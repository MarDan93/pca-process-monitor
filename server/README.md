# Local workspace service

The same service now includes an explicit protected **hosted** mode for the user's browser-only product. See [managed deployment](../docs/deployment/MANAGED_WEB.md) and [18-test/container evidence](../docs/verification/HOSTED_2026-10-17.md). The local boundary described below applies only to developer mode; it is not the end-user delivery route. No public service exists until the owner connects hosting and accepts its charges.

FastAPI/Pydantic contracts, standard-library SQLite persistence and immutable snapshots implement the first commercial tool. The small adapter uses parameterised SQL and explicit transactions rather than adding an ORM/migration framework before a second storage backend exists. `schema_version=1` is the initial local schema; a migration/recovery policy is required before schema upgrades or hosted deployment. The isolated environment and exact artifact hashes are in `requirements.lock`; `requirements.in` lists direct dependencies. The original PCA environment is unchanged.

## Operation contract

`POST /api/projects` creates an empty generic project at revision 0. The server owns project identity and principal. Commercial fields are optional; null means unknown, zero is explicit where allowed. Demand and lot size are integer counts up to the JavaScript exact-integer boundary (9,007,199,254,740,991), with no commercial scenario cap. Prices/budget are exact decimal strings (up to 18 digits / 6 decimal places), stored without binary floating-point arithmetic. Supported quote currencies are EUR/USD/GBP/CHF/CAD/JPY. A currency change with existing amounts must explicitly restate or clear every amount; no conversion or BOM/cost inference is available.

For `update_commercial_requirements`:

1. `POST /api/projects/{id}/operations/preview` accepts `base_revision`, strict commercial `changes`, and `source`. It validates and stores exact effects/provenance without changing the project.
2. `POST …/{operation_id}/approve` takes the preview `digest`. The digest binds project, server principal, base revision, effects and source. A ten-minute preview yields one approval token, stored only as a hash server-side.
3. `POST …/{operation_id}/execute` requires digest, token and idempotency key. The transaction rechecks current revision/expiry and appends the new immutable snapshot and provenance before consuming approval. A retry with the same key/token returns the original execution result; it is a historical acknowledgement, so the UI refreshes the current project afterward. Other replays, foreign-project operations or altered effects fail.
4. `POST …/{operation_id}/undo` requires current base revision and an idempotency key. It appends a compensating snapshot; it cannot erase an intervening edit. History preserves both execution and undo.

Manual properties and model proposals use this same boundary. AI source records require the exact request and pinned model ID/revision. This establishes provenance, not truth or engineering accuracy. No arbitrary scripts, external agents or tools are executed.

`GET /api/projects/{id}/revisions` returns the latest 100 provenance entries; immutable snapshots remain in SQLite. `POST /api/projects/{id}/assets` retains original OBJ/STL bytes and explicit units with a SHA-256 manifest. It is an explicit manual import, not the commercial tool. File content is never executed, and download is an octet-stream attachment. The frontend parser runs in a dedicated worker with an 8-second deadline and existing 100,000-triangle cap; the server stores opaque bounded originals rather than claiming solid validation.

## Local boundary

Use [the workspace launcher](../web/README.md). Writes require the token obtained from `GET /api/session`; browser origins must match the request origin. Only loopback peers and local Host headers are allowed. Request bodies are bounded before JSON parsing (32 KiB for normal operations, 18 MiB for asset transport), assets at 12 MiB, 20 originals / 96 MiB per project. Local limits are 200 projects and 5,000 operations per project. They are development resource guards, not public multi-user quotas. No external URL fetch, public numerical job or user-supplied principal endpoint exists. Tests inject a separate principal only through the application factory to prove owner scoping; no impersonation request field is accepted.

The service is intentionally not a hosted identity/ACL implementation. Do not deploy behind a public reverse proxy. Proper authentication, per-user authorisation, request-rate/job/storage budgets, recovery tests, TLS deployment and release security/licence review remain required.
