#!/usr/bin/env python3
"""Train hybrid recommendation models and cache scores in PostgreSQL.

Candidate retrieval uses LightFM's WARP objective over implicit feedback plus
student/item metadata. When there is enough impression-level data, LambdaMART
learns the final ordering. Serving never imports these packages: it reads the
cached scores, and falls back to the existing application order if none exist.
"""

from __future__ import annotations

import argparse
import ctypes.util
import json
import math
import os
import sys
import uuid
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Iterable
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import numpy as np
import psycopg
from lightfm import LightFM
from lightfm.data import Dataset
from lightfm.evaluation import precision_at_k
from psycopg.rows import dict_row
from graph import TypedGraph, graph_entity_scores, user_node

try:
    if sys.platform == "darwin" and ctypes.util.find_library("omp") is None:
        raise ImportError("macOS OpenMP runtime is not installed")
    from lightgbm import LGBMRanker
except (ImportError, OSError):  # Missing macOS OpenMP still leaves learned retrieval available.
    LGBMRanker = None


SURFACE_ENTITY = {
    "connect_feed": "connect_post",
    "marketplace": "marketplace_listing",
    "opportunities": "opportunity",
    "learning": "knowledge_resource",
    "people": "student_profile",
}

SURFACE_GRAPH_PREFIX = {
    "connect_feed": "post",
    "marketplace": "listing",
    "opportunities": "opportunity",
    "learning": "knowledge",
    "people": "student",
}


def load_local_env(path: str = ".env") -> None:
    """Load simple KEY=VALUE entries without adding a runtime dependency."""
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8") as env_file:
        for raw_line in env_file:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            normalized = value.strip()
            if len(normalized) >= 2 and normalized[0] == normalized[-1] and normalized[0] in {"'", '"'}:
                normalized = normalized[1:-1]
            os.environ.setdefault(key.strip(), normalized)


@dataclass(frozen=True)
class Entity:
    id: str
    features: tuple[str, ...]
    created_at: datetime


def token(prefix: str, value: Any) -> str | None:
    normalized = str(value or "").strip().lower()
    return f"{prefix}:{normalized}" if normalized else None


def tokens(prefix: str, values: Iterable[Any] | None) -> list[str]:
    return [candidate for value in (values or []) if (candidate := token(prefix, value))]


def postgres_url(value: str) -> str:
    """Remove Prisma-only URL options before handing the URL to psycopg."""
    parts = urlsplit(value)
    query = urlencode([(key, item) for key, item in parse_qsl(parts.query) if key != "schema"])
    return urlunsplit((parts.scheme, parts.netloc, parts.path, query, parts.fragment))


def item_age_days(created_at: datetime, now: datetime) -> float:
    comparable = created_at if created_at.tzinfo else created_at.replace(tzinfo=timezone.utc)
    return max(0.0, (now - comparable).total_seconds() / 86400)


def exponential_decay(age_days: float, half_life_days: float) -> float:
    """Return a smooth 1..0 recency value with a configurable half-life."""
    return math.exp(-math.log(2) * max(0.0, age_days) / max(0.001, half_life_days))


def freshness_score(entity: Entity, now: datetime, half_life_days: float) -> float:
    return exponential_decay(item_age_days(entity.created_at, now), half_life_days)


def effective_event_reward(event: dict[str, Any]) -> float:
    """Scale bounded client interaction types by meaningful engagement depth."""
    reward = max(0.0, float(event["reward"]))
    metadata = event.get("metadata") if isinstance(event.get("metadata"), dict) else {}
    if event.get("eventType") == "dwell":
        try:
            duration = min(3600.0, max(0.0, float(metadata.get("durationSeconds") or 0)))
        except (TypeError, ValueError):
            duration = 0.0
        if duration:
            reward *= min(3.0, max(0.25, math.log1p(duration) / math.log1p(60)))
    elif event.get("eventType") == "progress":
        try:
            progress = min(100.0, max(0.0, float(metadata.get("progressPercent") or 0)))
        except (TypeError, ValueError):
            progress = 0.0
        if progress:
            reward *= min(2.0, max(0.25, progress / 50.0))
    return reward


def event_training_weight(event: dict[str, Any], now: datetime, half_life_days: float) -> float:
    occurred_at = event["occurredAt"]
    comparable = occurred_at if occurred_at.tzinfo else occurred_at.replace(tzinfo=timezone.utc)
    age_days = max(0.0, (now - comparable).total_seconds() / 86400)
    return effective_event_reward(event) * exponential_decay(age_days, half_life_days)


def load_students(connection: psycopg.Connection) -> dict[str, tuple[str, ...]]:
    rows = connection.execute(
        '''
        SELECT sp.id, sp."campusId", sp."courseId", sp."careerPath", sp."currentMode",
               COALESCE(cp.interests, ARRAY[]::text[]) AS interests,
               COALESCE(array_agg(DISTINCT sk.slug) FILTER (WHERE sk.slug IS NOT NULL), ARRAY[]::text[]) AS skills
        FROM student_profiles sp
        LEFT JOIN connect_profiles cp ON cp."studentId" = sp.id
        LEFT JOIN student_skills ss ON ss."studentId" = sp.id
        LEFT JOIN skills sk ON sk.id = ss."skillId"
        GROUP BY sp.id, cp.interests
        '''
    ).fetchall()
    students: dict[str, tuple[str, ...]] = {}
    for row in rows:
        features = [
            token("campus", row["campusId"]),
            token("course", row["courseId"]),
            token("career", row["careerPath"]),
            token("mode", row["currentMode"]),
            *tokens("interest", row["interests"]),
            *tokens("skill", row["skills"]),
        ]
        students[row["id"]] = tuple(value for value in features if value)
    return students


def load_entities(connection: psycopg.Connection, surface: str) -> dict[str, Entity]:
    if surface == "connect_feed":
        rows = connection.execute(
            '''
            SELECT p.id, p.type, p.visibility, p."studentId", p."knowledgeSpaceId", p."createdAt",
                   sp."campusId"
            FROM connect_posts p
            LEFT JOIN student_profiles sp ON sp.id = p."studentId"
            WHERE p.status = 'published' AND p."createdAt" > NOW() - INTERVAL '90 days'
            '''
        ).fetchall()
        return {
            row["id"]: Entity(row["id"], tuple(filter(None, [
                token("type", row["type"]), token("visibility", row["visibility"]),
                token("creator", row["studentId"]), token("campus", row["campusId"]),
                token("space", row["knowledgeSpaceId"]),
            ])), row["createdAt"])
            for row in rows
        }
    if surface == "marketplace":
        rows = connection.execute(
            '''
            SELECT id, category, "listingType", condition, "sellerId", "campusId", "createdAt"
            FROM marketplace_listings
            WHERE status = 'ACTIVE'
            '''
        ).fetchall()
        return {
            row["id"]: Entity(row["id"], tuple(filter(None, [
                token("category", row["category"]), token("listing_type", row["listingType"]),
                token("condition", row["condition"]), token("creator", row["sellerId"]),
                token("campus", row["campusId"]),
            ])), row["createdAt"])
            for row in rows
        }
    if surface == "opportunities":
        rows = connection.execute(
            '''
            SELECT id, category, "opportunityType", mode, "engagementMode", skills, "createdAt"
            FROM opportunities
            WHERE status IN ('published', 'open', 'ready', 'in_progress')
              AND visibility = 'public' AND "publishedAt" IS NOT NULL
            '''
        ).fetchall()
        return {
            row["id"]: Entity(row["id"], tuple(filter(None, [
                token("category", row["category"]), token("opportunity_type", row["opportunityType"]),
                token("mode", row["mode"]), token("engagement", row["engagementMode"]),
                *tokens("skill", row["skills"]),
            ])), row["createdAt"])
            for row in rows
        }
    if surface == "learning":
        rows = connection.execute(
            '''
            SELECT id, "resourceType", "accessMode", subject, "courseCode", "unitId",
                   institution, "ownerStudentId", "spaceId", "createdAt"
            FROM knowledge_resources
            WHERE status = 'PUBLISHED'
            '''
        ).fetchall()
        return {
            row["id"]: Entity(row["id"], tuple(filter(None, [
                token("resource_type", row["resourceType"]), token("access_mode", row["accessMode"]),
                token("subject", row["subject"]), token("course", row["courseCode"]),
                token("unit", row["unitId"]), token("institution", row["institution"]),
                token("creator", row["ownerStudentId"]), token("space", row["spaceId"]),
            ])), row["createdAt"])
            for row in rows
        }
    if surface == "people":
        rows = connection.execute(
            '''
            SELECT sp.id, sp."campusId", sp."courseId", sp."careerPath", sp."currentMode",
                   sp."updatedAt" AS "createdAt",
                   COALESCE(cp.interests, ARRAY[]::text[]) AS interests,
                   COALESCE(array_agg(DISTINCT sk.slug) FILTER (WHERE sk.slug IS NOT NULL), ARRAY[]::text[]) AS skills
            FROM student_profiles sp
            JOIN users u ON u.id = sp."userId" AND u."isActive" = TRUE
            LEFT JOIN connect_profiles cp ON cp."studentId" = sp.id
            LEFT JOIN student_skills ss ON ss."studentId" = sp.id
            LEFT JOIN skills sk ON sk.id = ss."skillId"
            GROUP BY sp.id, cp.interests
            '''
        ).fetchall()
        return {
            row["id"]: Entity(row["id"], tuple(filter(None, [
                token("campus", row["campusId"]), token("course", row["courseId"]),
                token("career", row["careerPath"]), token("mode", row["currentMode"]),
                *tokens("interest", row["interests"]), *tokens("skill", row["skills"]),
            ])), row["createdAt"])
            for row in rows
        }
    raise ValueError(f"Unsupported surface: {surface}")


def load_events(connection: psycopg.Connection, surface: str) -> list[dict[str, Any]]:
    return connection.execute(
        '''
        SELECT "studentId", "entityId", "eventType", reward, position, "sessionId", metadata, "occurredAt"
        FROM recommendation_events
        WHERE surface = %s AND "entityType" = %s
          AND "occurredAt" > NOW() - INTERVAL '180 days'
        ORDER BY "occurredAt" ASC
        ''',
        (surface, SURFACE_ENTITY[surface]),
    ).fetchall()


def load_relationship_graph(connection: psycopg.Connection, event_half_life_days: float) -> TypedGraph:
    """Build a typed, directed graph from existing PostgreSQL relationships."""
    graph = TypedGraph()

    for row in connection.execute('SELECT "actorStudentId", "targetStudentId", type FROM connect_relationships').fetchall():
        actor = user_node(row["actorStudentId"])
        target = user_node(row["targetStudentId"])
        if row["type"] == "connect":
            graph.add_bidirectional(actor, target, 2.0)
        elif row["type"] == "follow":
            graph.add_edge(actor, target, 3.0)

    for row in connection.execute(
        '''SELECT sp.id AS "studentId", follower."managedProfileId"
           FROM managed_profile_followers follower
           JOIN student_profiles sp ON sp."userId" = follower."userId"'''
    ).fetchall():
        graph.add_edge(user_node(row["studentId"]), f'managed:{row["managedProfileId"]}', 3.0)

    for row in connection.execute('SELECT "studentId", "spaceId" FROM knowledge_space_followers').fetchall():
        graph.add_edge(user_node(row["studentId"]), f'space:{row["spaceId"]}', 2.5)
    for row in connection.execute(
        '''SELECT "studentId", "spaceId" FROM knowledge_space_memberships WHERE status = 'ACTIVE' '''
    ).fetchall():
        graph.add_bidirectional(user_node(row["studentId"]), f'space:{row["spaceId"]}', 2.0, 0.3)

    for row in connection.execute(
        '''SELECT sp.id AS "studentId", record.data->>'shopId' AS "shopId"
           FROM workflow_records record
           JOIN student_profiles sp ON sp."userId" = record.data->>'userId'
           WHERE record.collection = 'campusVendorFollowers' '''
    ).fetchall():
        graph.add_edge(user_node(row["studentId"]), f'shop:{row["shopId"]}' if row["shopId"] else None, 3.0)

    for row in connection.execute(
        '''SELECT id, "studentId", "managedProfileId", "knowledgeSpaceId",
                  payload #>> '{vendorShopId}' AS "vendorShopId"
           FROM connect_posts WHERE status = 'published' AND "createdAt" > NOW() - INTERVAL '90 days' '''
    ).fetchall():
        post = f'post:{row["id"]}'
        graph.add_edge(user_node(row["studentId"]) if row["studentId"] else None, post, 1.0)
        graph.add_edge(f'managed:{row["managedProfileId"]}' if row["managedProfileId"] else None, post, 1.2)
        graph.add_edge(f'space:{row["knowledgeSpaceId"]}' if row["knowledgeSpaceId"] else None, post, 1.2)
        graph.add_edge(f'shop:{row["vendorShopId"]}' if row["vendorShopId"] else None, post, 1.2)

    for row in connection.execute(
        '''SELECT id, "sellerId", "shopId" FROM marketplace_listings WHERE status = 'ACTIVE' '''
    ).fetchall():
        listing = f'listing:{row["id"]}'
        graph.add_edge(user_node(row["sellerId"]), listing, 0.8)
        graph.add_bidirectional(f'shop:{row["shopId"]}' if row["shopId"] else None, listing, 1.4, 0.2)
    for row in connection.execute(
        '''SELECT id, "ownerId" FROM marketplace_shops WHERE status NOT IN ('ARCHIVED', 'SUSPENDED')'''
    ).fetchall():
        graph.add_bidirectional(user_node(row["ownerId"]), f'shop:{row["id"]}', 0.8, 0.2)

    for row in connection.execute(
        '''SELECT id, "companyId" FROM managed_profiles WHERE "companyId" IS NOT NULL AND status = 'active' '''
    ).fetchall():
        graph.add_bidirectional(f'managed:{row["id"]}', f'company:{row["companyId"]}', 1.5, 0.5)
    for row in connection.execute(
        '''SELECT id, "companyId" FROM opportunities
           WHERE status IN ('published', 'open', 'ready', 'in_progress')
             AND visibility = 'public' AND "publishedAt" IS NOT NULL'''
    ).fetchall():
        graph.add_bidirectional(f'company:{row["companyId"]}', f'opportunity:{row["id"]}', 1.3, 0.2)

    for row in connection.execute(
        '''SELECT id, "ownerStudentId", "spaceId"
           FROM knowledge_resources WHERE status = 'PUBLISHED' '''
    ).fetchall():
        resource = f'knowledge:{row["id"]}'
        graph.add_edge(user_node(row["ownerStudentId"]), resource, 0.8)
        graph.add_bidirectional(f'space:{row["spaceId"]}' if row["spaceId"] else None, resource, 1.4, 0.25)
    for row in connection.execute(
        '''SELECT "studentId", "resourceId", action, status
           FROM knowledge_resource_accesses
           WHERE status IN ('ACTIVE', 'COMPLETED', 'PENDING') '''
    ).fetchall():
        access_weight = {
            'READ': 1.0, 'SAVE': 2.0, 'BORROW': 2.5, 'PURCHASE': 4.0,
        }.get(row["action"], 0.0)
        if row["status"] == 'PENDING':
            access_weight *= 0.6
        graph.add_bidirectional(
            user_node(row["studentId"]), f'knowledge:{row["resourceId"]}',
            access_weight, access_weight * 0.25,
        )

    for row in connection.execute(
        '''SELECT "studentId", surface, "entityType", "entityId", "eventType", reward, metadata, "occurredAt"
           FROM recommendation_events
           WHERE reward > 0 AND "occurredAt" > NOW() - INTERVAL '180 days' '''
    ).fetchall():
        prefix = SURFACE_GRAPH_PREFIX.get(row["surface"])
        if not prefix or row["entityType"] != SURFACE_ENTITY.get(row["surface"]):
            continue
        occurred_at = row["occurredAt"] if row["occurredAt"].tzinfo else row["occurredAt"].replace(tzinfo=timezone.utc)
        age_days = max(0.0, (datetime.now(timezone.utc) - occurred_at).total_seconds() / 86400)
        weight = min(5.0, effective_event_reward(row)) * exponential_decay(age_days, event_half_life_days)
        graph.add_bidirectional(user_node(row["studentId"]), f'{prefix}:{row["entityId"]}', weight, weight * 0.35)

    return graph


def surface_graph_scores(
    pageranks: dict[str, dict[str, float]], surface: str, entities: dict[str, Entity]
) -> dict[str, dict[str, float]]:
    prefix = SURFACE_GRAPH_PREFIX[surface]
    return {
        student_id: graph_entity_scores(rank, prefix, entities.keys())
        for student_id, rank in pageranks.items()
    }


def graph_only_cached_scores(
    students: dict[str, tuple[str, ...]], entities: dict[str, Entity], graph_scores: dict[str, dict[str, float]],
    top_k: int, freshness_blend: float, freshness_half_life_days: float,
) -> list[tuple[str, str, float, int]]:
    now = datetime.now(timezone.utc)
    freshness = {
        entity_id: freshness_score(entity, now, freshness_half_life_days)
        for entity_id, entity in entities.items()
    }
    output: list[tuple[str, str, float, int]] = []
    for student_id in students:
        student_graph = graph_scores.get(student_id, {})
        max_graph_score = max(student_graph.values(), default=0.0)
        blended = {
            entity_id: (
                (1.0 - freshness_blend) * (student_graph.get(entity_id, 0.0) / max_graph_score if max_graph_score > 0 else 0.0)
                + freshness_blend * freshness[entity_id]
            )
            for entity_id in entities
        }
        ordered = sorted(blended.items(), key=lambda item: item[1], reverse=True)[:top_k]
        output.extend((student_id, entity_id, score, rank) for rank, (entity_id, score) in enumerate(ordered, start=1))
    return output


def fit_retriever(
    students: dict[str, tuple[str, ...]], entities: dict[str, Entity], events: list[dict[str, Any]], epochs: int,
    event_half_life_days: float,
) -> tuple[LightFM, Any, Any, dict[str, int], dict[str, int], dict[str, float]]:
    positive = [event for event in events if event["reward"] > 0 and event["studentId"] in students and event["entityId"] in entities]
    now = datetime.now(timezone.utc)
    dataset = Dataset()
    dataset.fit(
        users=students.keys(),
        items=entities.keys(),
        user_features={feature for values in students.values() for feature in values},
        item_features={feature for entity in entities.values() for feature in entity.features},
    )
    interactions, weights = dataset.build_interactions(
        (event["studentId"], event["entityId"], max(0.01, event_training_weight(event, now, event_half_life_days)))
        for event in positive
    )
    user_features = dataset.build_user_features(students.items(), normalize=False)
    item_features = dataset.build_item_features(((entity.id, entity.features) for entity in entities.values()), normalize=False)
    model = LightFM(no_components=64, loss="warp", learning_rate=0.035, item_alpha=1e-6, user_alpha=1e-6, random_state=42)
    model.fit(interactions, sample_weight=weights, user_features=user_features, item_features=item_features, epochs=epochs, num_threads=max(1, min(8, os.cpu_count() or 1)), verbose=False)
    user_map, _, item_map, _ = dataset.mapping()
    precision = float(np.nan_to_num(precision_at_k(
        model, interactions, user_features=user_features, item_features=item_features, k=min(10, len(entities)), num_threads=max(1, min(8, os.cpu_count() or 1))
    ).mean()))
    return model, user_features, item_features, user_map, item_map, {
        "trainingPrecisionAt10": precision,
        "positiveEvents": len(positive),
        "effectivePositiveWeight": sum(event_training_weight(event, now, event_half_life_days) for event in positive),
        "eventHalfLifeDays": event_half_life_days,
    }


def relevance(reward: float) -> int:
    if reward <= 0:
        return 0
    if reward < 1:
        return 1
    return min(4, 1 + int(round(reward)))


def fit_ranker(
    events: list[dict[str, Any]], entities: dict[str, Entity], user_map: dict[str, int], item_map: dict[str, int],
    model: LightFM, user_features: Any, item_features: Any, graph_scores: dict[str, dict[str, float]]
) -> tuple[Any | None, dict[str, float]]:
    if LGBMRanker is None:
        return None, {"lambdaMart": 0, "lambdaMartReason": "lightgbm-not-installed"}
    known = [event for event in events if event["studentId"] in user_map and event["entityId"] in item_map]
    item_popularity = Counter(event["entityId"] for event in known if event["reward"] > 0)
    user_activity = Counter(event["studentId"] for event in known)
    groups: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for event in known:
        session = event["sessionId"] or event["occurredAt"].date().isoformat()
        groups[(event["studentId"], session)].append(event)
    usable_groups = [values for values in groups.values() if len(values) >= 2 and len({relevance(effective_event_reward(item)) for item in values}) >= 2]
    if sum(map(len, usable_groups)) < 100 or len(usable_groups) < 10:
        return None, {"lambdaMart": 0, "lambdaMartReason": "insufficient-grouped-impressions"}

    x_rows: list[list[float]] = []
    y_rows: list[int] = []
    sizes: list[int] = []
    now = datetime.now(timezone.utc)
    for group in usable_groups:
        sizes.append(len(group))
        for event in group:
            user_index, item_index = user_map[event["studentId"]], item_map[event["entityId"]]
            cf_score = float(model.predict(user_index, np.array([item_index]), user_features=user_features, item_features=item_features)[0])
            position = event["position"] if event["position"] is not None else 25
            age_days = item_age_days(entities[event["entityId"]].created_at, now)
            graph_score = graph_scores.get(event["studentId"], {}).get(event["entityId"], 0.0)
            x_rows.append([
                cf_score, math.log1p(item_popularity[event["entityId"]]), math.log1p(user_activity[event["studentId"]]),
                1 / (1 + position), math.log1p(age_days), math.log1p(graph_score * 1_000_000),
            ])
            y_rows.append(relevance(effective_event_reward(event)))
    ranker = LGBMRanker(
        objective="lambdarank", metric="ndcg", n_estimators=180, learning_rate=0.045,
        num_leaves=31, min_child_samples=20, subsample=0.85, colsample_bytree=0.85,
        random_state=42, verbosity=-1,
    )
    ranker.fit(np.asarray(x_rows), np.asarray(y_rows), group=sizes)
    return ranker, {"lambdaMart": 1, "lambdaMartRows": len(x_rows), "lambdaMartGroups": len(sizes)}


def cached_scores(
    students: dict[str, tuple[str, ...]], entities: dict[str, Entity], events: list[dict[str, Any]], model: LightFM,
    ranker: Any | None, user_features: Any, item_features: Any, user_map: dict[str, int], item_map: dict[str, int], top_k: int,
    graph_scores: dict[str, dict[str, float]], graph_blend: float, freshness_blend: float,
    freshness_half_life_days: float,
) -> list[tuple[str, str, float, int]]:
    reverse_items = {index: item_id for item_id, index in item_map.items()}
    item_indices = np.arange(len(item_map), dtype=np.int32)
    event_item_popularity = Counter(event["entityId"] for event in events if event["reward"] > 0)
    event_user_activity = Counter(event["studentId"] for event in events)
    now = datetime.now(timezone.utc)
    output: list[tuple[str, str, float, int]] = []
    for student_id in students:
        user_index = user_map[student_id]
        retrieval_scores = model.predict(user_index, item_indices, user_features=user_features, item_features=item_features, num_threads=1)
        pool_size = min(len(item_indices), max(top_k * 4, top_k))
        retrieval_pool = np.argpartition(retrieval_scores, -pool_size)[-pool_size:] if pool_size < len(item_indices) else item_indices
        graph_candidates = sorted(graph_scores.get(student_id, {}), key=graph_scores.get(student_id, {}).get, reverse=True)[:max(top_k * 2, top_k)]
        fresh_candidates = sorted(
            entities, key=lambda entity_id: entities[entity_id].created_at, reverse=True
        )[:max(top_k * 2, top_k)]
        pool = np.asarray(sorted(
            set(map(int, retrieval_pool))
            | {item_map[entity_id] for entity_id in graph_candidates if entity_id in item_map}
            | {item_map[entity_id] for entity_id in fresh_candidates if entity_id in item_map}
        ), dtype=np.int32)
        graph_values = np.asarray([graph_scores.get(student_id, {}).get(reverse_items[int(item_index)], 0.0) for item_index in pool])
        freshness_values = np.asarray([
            freshness_score(entities[reverse_items[int(item_index)]], now, freshness_half_life_days)
            for item_index in pool
        ])
        retrieval_values = retrieval_scores[pool].astype(float)
        retrieval_range = float(np.ptp(retrieval_values))
        graph_range = float(np.ptp(graph_values))
        normalized_retrieval = (retrieval_values - retrieval_values.min()) / retrieval_range if retrieval_range > 1e-12 else np.zeros_like(retrieval_values)
        normalized_graph = (graph_values - graph_values.min()) / graph_range if graph_range > 1e-12 else (graph_values > 0).astype(float)
        retrieval_blend = max(0.0, 1.0 - graph_blend - freshness_blend)
        final_scores = (
            retrieval_blend * normalized_retrieval
            + graph_blend * normalized_graph
            + freshness_blend * freshness_values
        )
        if ranker is not None:
            features = []
            for item_index in pool:
                entity_id = reverse_items[int(item_index)]
                age_days = item_age_days(entities[entity_id].created_at, now)
                features.append([
                    float(retrieval_scores[item_index]), math.log1p(event_item_popularity[entity_id]),
                    math.log1p(event_user_activity[student_id]), 1.0, math.log1p(age_days),
                    math.log1p(graph_scores.get(student_id, {}).get(entity_id, 0.0) * 1_000_000),
                ])
            final_scores = ranker.predict(np.asarray(features))
        ordering = np.argsort(-final_scores)[:top_k]
        for rank, offset in enumerate(ordering, start=1):
            output.append((student_id, reverse_items[int(pool[offset])], float(final_scores[offset]), rank))
    return output


def activate_scores(
    connection: psycopg.Connection, surface: str, entity_type: str, scores: list[tuple[str, str, float, int]],
    algorithm: str, metrics: dict[str, Any], ttl_hours: int,
) -> str:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=ttl_hours)
    version = now.strftime("%Y%m%dT%H%M%S%fZ")
    artifact_id = f"rec_model_{uuid.uuid4().hex}"
    reason = json.dumps({"algorithm": algorithm, "graph": "personalized-pagerank" if "pagerank" in algorithm else None})
    with connection.transaction():
        connection.execute(
            '''INSERT INTO recommendation_model_artifacts
               (id, surface, version, algorithm, status, metrics, "featureSchema", "trainedAt", "activatedAt", "expiresAt", "createdAt", "updatedAt")
               VALUES (%s, %s, %s, %s, 'PENDING', %s::jsonb, %s::jsonb, %s, NULL, %s, %s, %s)''',
            (artifact_id, surface, version, algorithm, json.dumps(metrics), json.dumps({"ranker": ["cfScore", "itemPopularity", "userActivity", "positionBias", "itemAge", "graphProximity"]}), now, expires_at, now, now),
        )
        with connection.cursor() as cursor:
            cursor.executemany(
                '''INSERT INTO recommendation_scores
                   (id, "studentId", surface, "entityType", "entityId", score, rank, reason, "modelArtifactId", "generatedAt", "expiresAt")
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s, %s)
                   ON CONFLICT ("studentId", surface, "entityType", "entityId") DO UPDATE SET
                     score = EXCLUDED.score, rank = EXCLUDED.rank, reason = EXCLUDED.reason,
                     "modelArtifactId" = EXCLUDED."modelArtifactId", "generatedAt" = EXCLUDED."generatedAt", "expiresAt" = EXCLUDED."expiresAt"''',
                ((f"rec_score_{uuid.uuid4().hex}", student_id, surface, entity_type, entity_id, score, rank, reason, artifact_id, now, expires_at)
                 for student_id, entity_id, score, rank in scores),
            )
        connection.execute("UPDATE recommendation_model_artifacts SET status = 'ARCHIVED', \"updatedAt\" = %s WHERE surface = %s AND status = 'ACTIVE'", (now, surface))
        connection.execute("UPDATE recommendation_model_artifacts SET status = 'ACTIVE', \"activatedAt\" = %s, \"updatedAt\" = %s WHERE id = %s", (now, now, artifact_id))
    return version


def train_surface(
    connection: psycopg.Connection, surface: str, args: argparse.Namespace,
    students: dict[str, tuple[str, ...]], pageranks: dict[str, dict[str, float]], graph: TypedGraph,
) -> bool:
    entities = load_entities(connection, surface)
    events = load_events(connection, surface)
    graph_scores = surface_graph_scores(pageranks, surface, entities)
    graph_cached = graph_only_cached_scores(
        students, entities, graph_scores, args.top_k, args.freshness_blend, args.freshness_half_life_days
    )
    graph_reachable_count = sum(len(scores) for scores in graph_scores.values())
    positive_count = sum(event["reward"] > 0 and event["studentId"] in students and event["entityId"] in entities for event in events)
    if len(students) < 2 or len(entities) < 2:
        print(f"{surface}: fallback remains active (students={len(students)}, entities={len(entities)}, positive_events={positive_count})")
        return False
    if positive_count < args.min_positive_events:
        metrics = {
            "students": len(students), "candidates": len(entities), "events": len(events),
            "positiveEvents": positive_count, "graphNodes": graph.node_count,
            "graphEdges": graph.edge_count, "graphScores": graph_reachable_count,
            "freshnessBlend": args.freshness_blend, "freshnessHalfLifeDays": args.freshness_half_life_days,
            "coldStart": True,
        }
        algorithm = "personalized-pagerank+freshness-decay"
        version = activate_scores(connection, surface, SURFACE_ENTITY[surface], graph_cached, algorithm, metrics, args.ttl_hours)
        print(f"{surface}: activated cold-start {algorithm} model {version} with {len(graph_cached)} cached scores")
        return True
    model, user_features, item_features, user_map, item_map, metrics = fit_retriever(
        students, entities, events, args.epochs, args.event_half_life_days
    )
    ranker, ranker_metrics = fit_ranker(events, entities, user_map, item_map, model, user_features, item_features, graph_scores)
    metrics.update(ranker_metrics)
    metrics.update({
        "students": len(students), "candidates": len(entities), "events": len(events),
        "graphNodes": graph.node_count, "graphEdges": graph.edge_count,
        "graphScores": graph_reachable_count, "graphBlend": args.graph_blend,
        "freshnessBlend": args.freshness_blend, "freshnessHalfLifeDays": args.freshness_half_life_days,
    })
    scores = cached_scores(
        students, entities, events, model, ranker, user_features, item_features, user_map, item_map,
        args.top_k, graph_scores, args.graph_blend, args.freshness_blend, args.freshness_half_life_days,
    )
    algorithm = (
        "lightfm-warp+personalized-pagerank+freshness-decay+lambdamart"
        if ranker is not None else "lightfm-warp+personalized-pagerank+freshness-decay"
    )
    version = activate_scores(connection, surface, SURFACE_ENTITY[surface], scores, algorithm, metrics, args.ttl_hours)
    print(f"{surface}: activated {algorithm} model {version} with {len(scores)} cached scores")
    return True


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--surface", choices=["all", *SURFACE_ENTITY], default="all")
    parser.add_argument("--epochs", type=int, default=int(os.getenv("RECOMMENDATION_EPOCHS", "25")))
    parser.add_argument("--top-k", type=int, default=int(os.getenv("RECOMMENDATION_TOP_K", "200")))
    parser.add_argument("--ttl-hours", type=int, default=int(os.getenv("RECOMMENDATION_TTL_HOURS", "36")))
    parser.add_argument("--min-positive-events", type=int, default=int(os.getenv("RECOMMENDATION_MIN_POSITIVE_EVENTS", "50")))
    parser.add_argument("--graph-blend", type=float, default=float(os.getenv("RECOMMENDATION_GRAPH_BLEND", "0.18")))
    parser.add_argument("--freshness-blend", type=float, default=float(os.getenv("RECOMMENDATION_FRESHNESS_BLEND", "0.12")))
    parser.add_argument("--freshness-half-life-days", type=float, default=float(os.getenv("RECOMMENDATION_FRESHNESS_HALF_LIFE_DAYS", "21")))
    parser.add_argument("--event-half-life-days", type=float, default=float(os.getenv("RECOMMENDATION_EVENT_HALF_LIFE_DAYS", "60")))
    return parser.parse_args()


def main() -> int:
    load_local_env()
    args = parse_args()
    args.graph_blend = min(0.5, max(0.0, args.graph_blend))
    args.freshness_blend = min(0.5, max(0.0, args.freshness_blend))
    blend_total = args.graph_blend + args.freshness_blend
    if blend_total > 0.8:
        args.graph_blend *= 0.8 / blend_total
        args.freshness_blend *= 0.8 / blend_total
    args.freshness_half_life_days = max(0.001, args.freshness_half_life_days)
    args.event_half_life_days = max(0.001, args.event_half_life_days)
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL is required", file=sys.stderr)
        return 2
    surfaces = list(SURFACE_ENTITY) if args.surface == "all" else [args.surface]
    with psycopg.connect(postgres_url(database_url), row_factory=dict_row) as connection:
        students = load_students(connection)
        graph = load_relationship_graph(connection, args.event_half_life_days)
        pageranks = {student_id: graph.personalized_pagerank(user_node(student_id)) for student_id in students}
        print(f"relationship graph: {graph.node_count} nodes, {graph.edge_count} weighted directed edges")
        activated = sum(train_surface(connection, surface, args, students, pageranks, graph) for surface in surfaces)
    print(f"training complete: {activated}/{len(surfaces)} surfaces activated; remaining surfaces use fallback ordering")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
