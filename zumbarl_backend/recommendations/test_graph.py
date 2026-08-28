import unittest

from graph import TypedGraph, graph_entity_scores, user_node


class PersonalizedPageRankTests(unittest.TestCase):
    def test_discovers_a_listing_through_a_followed_student_and_hotel(self):
        graph = TypedGraph()
        graph.add_edge(user_node("brian"), user_node("aisha"), 3)
        graph.add_edge(user_node("aisha"), "shop:hotel-x", 3)
        graph.add_edge("shop:hotel-x", "listing:breakfast", 1)

        rank = graph.personalized_pagerank(user_node("brian"))
        scores = graph_entity_scores(rank, "listing", ["breakfast", "unrelated"])

        self.assertGreater(scores["breakfast"], 0)
        self.assertNotIn("unrelated", scores)

    def test_does_not_leak_disconnected_entities_into_results(self):
        graph = TypedGraph()
        graph.add_edge(user_node("brian"), "shop:nearby", 1)
        graph.add_edge(user_node("someone-else"), "shop:private", 1)

        rank = graph.personalized_pagerank(user_node("brian"))

        self.assertGreater(rank["shop:nearby"], 0)
        self.assertNotIn("shop:private", rank)
        self.assertAlmostEqual(sum(rank.values()), 1.0, places=7)

    def test_scores_followed_people_for_profile_suggestions(self):
        graph = TypedGraph()
        graph.add_edge(user_node("brian"), user_node("aisha"), 3)

        scores = graph_entity_scores(
            graph.personalized_pagerank(user_node("brian")), "student", ["aisha", "grace"]
        )

        self.assertGreater(scores["aisha"], 0)
        self.assertNotIn("grace", scores)


if __name__ == "__main__":
    unittest.main()
