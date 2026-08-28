"""Small weighted graph primitives for offline recommendation training."""

from __future__ import annotations

from collections import defaultdict
from typing import Iterable


class TypedGraph:
    def __init__(self) -> None:
        self._adjacency: dict[str, dict[str, float]] = defaultdict(dict)
        self.edge_count = 0

    @property
    def node_count(self) -> int:
        nodes = set(self._adjacency)
        for neighbors in self._adjacency.values():
            nodes.update(neighbors)
        return len(nodes)

    def add_edge(self, source: str | None, target: str | None, weight: float = 1.0) -> None:
        if not source or not target or source == target or weight <= 0:
            return
        if target not in self._adjacency[source]:
            self.edge_count += 1
            self._adjacency[source][target] = 0.0
        self._adjacency[source][target] += float(weight)

    def add_bidirectional(self, left: str | None, right: str | None, weight: float = 1.0, reverse_weight: float | None = None) -> None:
        self.add_edge(left, right, weight)
        self.add_edge(right, left, weight if reverse_weight is None else reverse_weight)

    def personalized_pagerank(
        self, seed: str, restart_probability: float = 0.2, iterations: int = 24, tolerance: float = 1e-10
    ) -> dict[str, float]:
        if seed not in self._adjacency:
            return {seed: 1.0}
        scores = {seed: 1.0}
        continuation = 1.0 - restart_probability
        for _ in range(iterations):
            next_scores: dict[str, float] = defaultdict(float)
            next_scores[seed] = restart_probability
            dangling_mass = 0.0
            for source, score in scores.items():
                neighbors = self._adjacency.get(source, {})
                total_weight = sum(neighbors.values())
                if total_weight <= 0:
                    dangling_mass += score
                    continue
                for target, weight in neighbors.items():
                    next_scores[target] += continuation * score * weight / total_weight
            next_scores[seed] += continuation * dangling_mass
            difference = sum(abs(next_scores.get(node, 0.0) - scores.get(node, 0.0)) for node in set(scores) | set(next_scores))
            scores = dict(next_scores)
            if difference < tolerance:
                break
        return scores


def graph_entity_scores(rank: dict[str, float], prefix: str, entity_ids: Iterable[str]) -> dict[str, float]:
    return {
        entity_id: score
        for entity_id in entity_ids
        if (score := rank.get(f"{prefix}:{entity_id}", 0.0)) > 0
    }


def user_node(student_id: str) -> str:
    return f"student:{student_id}"
