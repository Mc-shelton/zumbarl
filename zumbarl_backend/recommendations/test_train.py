import unittest
from datetime import datetime, timedelta, timezone

from train import Entity, effective_event_reward, exponential_decay, graph_only_cached_scores


class TimeAwareRankingTests(unittest.TestCase):
    def test_exponential_decay_reaches_half_at_the_half_life(self):
        self.assertAlmostEqual(exponential_decay(21, 21), 0.5, places=7)
        self.assertGreater(exponential_decay(1, 21), exponential_decay(30, 21))

    def test_freshness_orders_disconnected_cold_start_candidates(self):
        now = datetime.now(timezone.utc)
        entities = {
            "older": Entity("older", (), now - timedelta(days=42)),
            "newer": Entity("newer", (), now - timedelta(hours=1)),
        }

        scores = graph_only_cached_scores(
            {"brian": ()}, entities, {"brian": {}}, top_k=10,
            freshness_blend=0.12, freshness_half_life_days=21,
        )

        self.assertEqual([entity_id for _, entity_id, _, _ in scores], ["newer", "older"])
        self.assertGreater(scores[0][2], scores[1][2])

    def test_meaningful_dwell_carries_more_weight_than_a_brief_view(self):
        brief = {"eventType": "dwell", "reward": 0.5, "metadata": {"durationSeconds": 10}}
        meaningful = {"eventType": "dwell", "reward": 0.5, "metadata": {"durationSeconds": 300}}

        self.assertGreater(effective_event_reward(meaningful), effective_event_reward(brief))
        self.assertLessEqual(effective_event_reward(meaningful), 1.5)


if __name__ == "__main__":
    unittest.main()
