Agreed. The earlier 30/20-style weights should not become the production recommender. They are useful only as a temporary baseline and for defining training signals.

## Algorithm selected

Zumbarl should use a learned, multi-stage hybrid recommender:

1. Candidate retrieval: Hybrid matrix factorization using LightFM with WARP loss.

   It learns user, item, skill, campus, category and creator embeddings from implicit behavior while using profile metadata for cold-start users/items. This is especially appropriate while Zumbarl’s interaction dataset is still sparse; the underlying approach was specifically shown to outperform pure collaborative or content-based methods in sparse/cold-start settings. [Metadata Embeddings for User and Item Cold-start Recommendations](https://arxiv.org/abs/1507.08439)

2. Final ranking: LambdaMART learning-to-rank.

   Each surface gets its own ranker:

   - Post feed
   - Stories
   - Opportunities
   - Marketplace
   - People
   - Learning resources

   LambdaMART will learn nonlinear interactions such as “Canva skill + Earn mode + recent design applications + same campus” instead of us manually assigning a final score. It directly optimizes ranking quality such as NDCG. [Microsoft Research’s LambdaMART overview](https://www.microsoft.com/en-us/research/publication/from-ranknet-to-lambdarank-to-lambdamart-an-overview/)

3. Exploration: Contextual Thompson Sampling or LinUCB.

   A small number of feed positions—approximately 5–10%—should explore new creators, categories and listings. The bandit learns from the result and prevents the system from trapping Brian inside his existing interests. Contextual bandits are designed to balance personalized exploitation with learning from new content. [Contextual-bandit recommendation paper](https://arxiv.org/abs/1003.0146)

4. Constrained re-ranking.

   After model scoring, apply only:

   - Privacy and visibility constraints
   - Availability/deadline constraints
   - Blocking and moderation
   - Creator/category diversity
   - Sponsored-content limits
   - Duplicate and previously completed-item removal

This follows the established candidate-generation → ranking architecture used in large recommendation systems. [Google’s two-stage recommendation architecture](https://research.google/pubs/deep-neural-networks-for-youtube-recommendations/)

## What the models learn from

Actions become training outcomes, not manually added points:

| Strength | Behavior |
|---|---|
| Very strong | Purchase, completed application, accepted offer, attended event |
| Strong | Cart addition, bid started, save, reshare, meaningful comment, RSVP |
| Medium | Like, follow, connect, story completion, long dwell |
| Weak | Open, click, short view |
| Negative | Repeated skip, quick bounce, hide, unfollow |
| Exclusionary | Report, block, inaccessible content |

Events receive time decay so Brian’s activity this week matters more than something he clicked six months ago.

We should also correct for position bias: items shown first naturally get more clicks. The event system must log impressions, position, model version and exploration probability so evaluation can use inverse-propensity weighting rather than assuming every click proves relevance.

## Brian example

Initially, Brian’s LightFM representation comes from:

- Zetech University
- Marketing & Design
- Graphic Design, Canva and Content Creation
- Earn mode
- Zetech Digital Library membership/ownership

As he interacts, collaborative behavior becomes stronger:

- Brian applies to Canva gigs.
- Other students with similar behavior also apply to social-media and brand-design projects.
- Those opportunities enter Brian’s retrieval candidates even when they do not contain the exact word “Canva.”
- LambdaMART then decides their order using deadline, skill compatibility, company quality, Brian’s historical application behavior and current context.
- The bandit occasionally inserts a video-editing opportunity to test whether Brian’s interests are expanding.

The final explanation might be:

> Recommended because it matches your verified design skills and resembles opportunities you recently explored.

## Upgrade path

LightFM is the right retrieval model for Zumbarl’s current sparse-data stage. When interaction volume becomes large enough, candidate retrieval can move to a neural two-tower model with approximate-nearest-neighbor search. LambdaMART can remain the final ranker until offline and A/B evaluation proves a neural ranker performs better.

Success should be measured through temporal offline tests—NDCG@10 and Recall@50—followed by controlled A/B tests on meaningful outcomes such as completed applications, purchases, useful comments, follows and hides. We should not optimize raw clicks alone.



No heavy infrastructure is required for the first production version.

We can use:

- Existing PostgreSQL for interaction events, model versions, and cached recommendations.
- A scheduled CPU training job—initially nightly or every few hours.
- A small Python training environment with LightFM, LightGBM, NumPy and SciPy.
- Existing Node backend to retrieve cached candidates, enforce privacy, and serve results.
- Existing storage or PostgreSQL for versioned model artifacts.

We do not initially need:

- GPUs
- Kafka
- A data warehouse
- A separate online ML service
- A dedicated feature store
- A vector database
- Kubernetes
- Redis, although it could later improve caching

The practical architecture would be:

```text
User actions
    ↓
PostgreSQL recommendation_events
    ↓
Scheduled CPU training job
    ↓
LightFM candidate model + LambdaMART ranker
    ↓
Top recommendations saved to PostgreSQL
    ↓
Node API applies live privacy/availability checks
    ↓
Brian’s personalized feed
```

Training remains outside web requests, so users do not wait for the models. The API would normally perform a quick database read of Brian’s precomputed recommendations.

Initially, I recommend:

- Retrain every 6–12 hours.
- Refresh simple recent-behavior features every few minutes.
- Precompute approximately 100–300 recommendations per student per surface.
- Re-rank the returned page for availability, duplicates and diversity.
- Fall back safely to eligible recent content if a model or score is unavailable.

Later, only when traffic justifies it, we could add Redis, `pgvector`, a streaming event system, and an always-online inference service.

So the additional operational requirement is essentially one scheduled CPU-based Python job—not a large ML platform. No implementation changes were made before your interruption.