# Zumbarl recommendation training

The API serves cached scores from PostgreSQL. Training is an offline CPU job, so
web requests never load LightFM or LightGBM and keep working when this job is not
installed or fails.

## Ranking layers

1. A typed relationship graph runs personalized PageRank from each student. It
   connects student follows/connections, managed profiles, hotels/vendors,
   knowledge spaces, learning resources, resource reads/saves/borrows/purchases,
   creators, posts, listings, companies, opportunities, and
   time-decayed positive interactions. A smooth creation-time freshness decay is
   blended with graph proximity, so new disconnected items can still enter a
   cold-start result instead of waiting for their first graph edge.
2. After 50 positive events, LightFM/WARP learns hybrid collaborative and
   metadata representations. Recent events carry more training weight, and both
   graph and fresh candidates are mixed into its retrieval pool.
3. Once grouped impression data is sufficient, LambdaMART learns the final order
   with graph proximity as one feature alongside relevance, popularity, activity,
   position bias, and freshness.

The graph is directed, so `Brian -> Aisha -> Hotel X -> listing` can surface a
listing for Brian. Disconnected nodes receive no graph score, graph paths are not
returned to clients, and normal API eligibility checks still run before ranking.
No graph database is required; the job builds the graph from PostgreSQL in memory.

The `learning` surface ranks only knowledge resources already authorized by the
Learn API. It records impressions, detail opens, reading starts, meaningful dwell,
saves, borrows, purchases, downloads, and video plays. Dwell depth is logarithmic
and capped, so a genuinely useful reading session matters more than a brief open
without allowing one long-running tab to dominate the model.

The `people` surface ranks active student profiles after the Connect API has
removed the viewer and applied its normal eligibility checks. Personalized
PageRank supplies network proximity; profile impressions, successful profile
opens, follows/connections, and dismissals provide feedback. Campus affinity and
profile interests/skills remain hybrid metadata features once LightFM activates.

## Run locally

```bash
python3 -m venv .venv-recommendations
npm run recommendations:setup
npm run recommendations:train
```

The checked-in versions support the repository's macOS Python 3.9 environment.
The npm command automatically uses `.venv-recommendations/bin/python` when that
environment exists, rather than accidentally invoking the system interpreter.
The setup command also applies LightFM's required legacy-build workaround; a
direct install with a current pip release will fail in LightFM 1.17's upstream
`setup.py`.

Run it every 6–24 hours using cron, a platform scheduler, or a one-off container.
For production, run `prisma migrate deploy` before the first training job.

The job activates a new artifact only after all scores for a surface have been
written in one transaction. If it has insufficient events, cannot connect, or
crashes, the previous unexpired model remains untouched. If no valid model exists,
the API returns the existing recency/priority ordering.

`RECOMMENDATION_GRAPH_BLEND` controls the graph share before LambdaMART is ready;
it defaults to `0.18`. `RECOMMENDATION_FRESHNESS_BLEND` defaults to `0.12`, with
a 21-day creation-time half-life. The two prior weights are capped together so
at least 20% of the learned retrieval signal remains. Behavioral feedback has a
separate 60-day half-life, preventing very old clicks from dominating current
interests. When there is no behavior yet, graph proximity and freshness provide
the cold-start order.
