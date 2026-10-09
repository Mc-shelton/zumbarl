We have a solid baseline, but we are not production-grade for high availability yet.

| Area | Already implemented | Main gap |
|---|---|---|
| Health | `/health`; bounded PostgreSQL, Redis, and storage checks on `/ready`; HTTP 503 on required-dependency failure | Add deployed uptime checks and alert routing. |
| Traffic | Redis-backed rate limiting | Redis failure currently prevents startup despite rate limiting having `skipOnError`. |
| Realtime | One shared SSE connection with heartbeat and exponential reconnect | Events use an in-memory `EventEmitter`, so multiple API instances would not share events. See [realtimeEvents.ts](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl_backend/src/lib/realtimeEvents.ts:8). |
| Performance | Route-level frontend code splitting, database indexes, 60-second dashboard caching, reduced polling, and bounded shared API/upload requests | Several database lists remain unpaginated and cache invalidation uses Redis scans. |
| External services | M-Pesa, routing, geocoding and link-preview calls have timeouts | No circuit breakers or common retry policy. |
| Background work | Idempotent financial processing, database leases for Evergreen, explicit schema/data migration commands, and recurring maintenance jobs in a dedicated worker | Add durable queues/workers for email, notifications, moderation, payouts, reminders, campaign statistics, and evidence scoring. |
| Shutdown | SIGTERM/SIGINT graceful shutdown, bounded shutdown time, and PostgreSQL/Redis cleanup | Exercise termination behavior in the target orchestrator. |
| Monitoring | Structured Fastify logs and request IDs | No API metrics, distributed tracing, alerting, or persistent server-error tracking. |
| Deployment | Production API/worker/frontend images, health checks, Caddy HTTPS edge, Compose topology, and release/backup/rollback runbook | Provision the actual environment, configure external services, pin immutable image tags, and complete staging acceptance. |

The order I recommend is:

1. Configure and verify the implemented S3-compatible storage adapter in staging.
2. Deploy the provided API, dedicated maintenance worker, frontend, and HTTPS edge topology in staging.
3. Add durable queues for the remaining asynchronous workloads.
4. Add Redis Pub/Sub for cross-instance realtime delivery.
5. Run at least two API instances behind a load balancer.
6. Add request latency/error metrics, database query monitoring, error tracking, uptime checks, and alerts.
7. Paginate large endpoints, profile slow queries, eliminate broad Redis scans, and introduce frontend request cancellation/timeouts.
8. Exercise graceful termination and failed-dependency readiness in the target orchestrator.
9. Establish load tests and targets such as 99.9% availability, reads under 300 ms p95, writes under 700 ms p95, and less than 1% 5xx responses.
