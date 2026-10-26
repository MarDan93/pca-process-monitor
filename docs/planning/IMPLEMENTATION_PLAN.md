> **V2 supersedes earlier product/deployment assumptions:** see [the active system-first contract/roadmap](../product/FABRIVRA_V2.md). Dated implementation/audit details below remain historical evidence.

# Incremental implementation plan

**Latest direction, 19 October:** the owner requested Codespaces trials and prioritised a visible working process with AI assistance. The [bounded L0/AI increment](../verification/PROCESS_CODESPACES_2026-10-19.md) now implements a subset of I03–I04 without claiming I02 mould/press checks or full V1 completion. Its functional geometry and times are explicit configured assumptions. The [Codespaces guide](../deployment/CODESPACES.md) is the current trial entry point; local and managed-hosting paths remain alternatives. Close remaining geometry, economics and validation gates progressively.

**Delivery update, 19 October:** local-first use with local AI now supersedes the earlier online-only preference. The owner's [8 GB Windows hardware profile](../deployment/LOCAL_HARDWARE.md) sets a lightweight target for the first delivery, not a guarantee for all later CAD/physics workloads. Consolidate local startup/model readiness before extending the engineering engines. Preserve the module scope below; distinguish configured cycle animation from physical solvers and benchmark supported workloads on the actual hardware.

`AUD-2026-10-17`. Planning deliverable requested by the master prompt; application increments below are **not implemented by this audit**. Preserve the development branch, existing demo/PCA code and MIT licence. No push, merge, deployment, release or other publication without explicit user authorisation. Ordinary reversible technical choices do not require repeated questions.

**Subsequent coding update, 17 October:** I01a's local project/approved-commercial-operation boundary and a bounded I01b workspace are now implemented and [verified](../verification/WORKSPACE_2026-10-17.md). Actual files are `server/app/{main,schemas,store}.py`, `server/requirements.lock` and `web/src/` with an isolated launcher. This deliberately small SQLite adapter uses explicit transactions and a schema-version marker rather than adding an ORM/migration framework before another backend is required. Amounts use exact Decimal strings. Proposed paths below remain the original design plan, not a claim that every planned layer/file exists. Legacy-v4 import, additional sources/frames, identity/hosted isolation, backup/restore and broad AI evaluation remain I01b/release work. The next engineering engine is I02; I03–I04 are still required for the complete cycle/cost demonstration.

## Direction and scope

The next investment is a generic project/operation foundation, not another shell-specific feature or cosmetic demo. The first complete customer-to-production demonstration spans several small increments. It must implement all eleven requested steps with a restricted, documented mould/sequence family; it is not a promise of arbitrary industrial mould design.

Do not equate documentation, an animation, a schema or an installed solver with a working engineering model. Keep failed/blocked/unrun gates visible. [CURRENT_STATE.md](../architecture/CURRENT_STATE.md) is the audited baseline; [TARGET_ARCHITECTURE.md](../architecture/TARGET_ARCHITECTURE.md) and [THREAT_MODEL.md](../security/THREAT_MODEL.md) define implementation boundaries.

## I00 — Audit and evidence (this delivery)

Delivered: current/target architecture, rights/licence inventory, dataset admission register, threat model, two original UI studies with selected direction, this plan and reproducible PCA findings. Existing browser/AI regressions rerun. MIT, application code, lockfile and delivered demo preserved. Primary dataset metadata is proxy-blocked, so no external data is admitted. Native dependency advisories and scientific defects are recorded rather than silently fixed.

Two independent follow-ups accompany I01:

- **I00-S:** triage/remediate dependency advisories, establish an actual release-specific dependency/notice manifest and bounded file-processing strategy. No blind `npm audit fix`. Assess native versus browser reachability and use regression-tested versions; any unresolved release exception needs explicit security approval.
- **I00-N:** correct/retest PCA variance/limit/missing-data behaviour against independent references before using it for recommendations. This does not block commercial project storage or L0 scheduling; it blocks a trusted statistics/optimisation release.

## I01a — First concretely executable increment: generic projects and approved commercial operations

**Objective:** create two independent empty projects; capture commercial requests/units and sources; preview, approve, execute and undo one typed commercial update; save and reopen from a real local database. This closes a usable data/API boundary without redesigning geometry or pretending that mould/process tools exist.

**Dependencies:** audit domain/operation decisions; select/pin and install the minimal API/persistence packages in an isolated development environment, verify their licences/APIs, and preserve current requirements. No paid service, hosted deployment, CAD kernel or public dataset is required. Start on a loopback-only synthetic-data development service. A production identity provider is a later security gate, not a claim attached to test principals.

### Proposed files

| Action | Path | Responsibility |
| --- | --- | --- |
| Add | `server/pyproject.toml` and a reproducible resolved dependency lock | Minimal API/schema/ORM/migration/test dependencies with version/integrity/licence evidence; do not expand the old PCA environment into an unbounded platform runtime |
| Add | `server/app/domain/projects.py` | Project/brief/requirements IDs; optional unknown values; commercial-unit/Decimal currency/count semantics; no shell/material/programme defaults |
| Add | `server/app/domain/operations.py` | Typed operation/preview/approval/effect digest, integer revisions, idempotency and compensating undo |
| Add | `server/app/application/project_service.py` | Create/open/list/update projects and sources through authorised boundaries |
| Add | `server/app/application/operation_service.py` | `update_commercial_requirements` validation, preview/approval/execute/undo; no arbitrary tool/code execution |
| Add | `server/app/infrastructure/database.py`, `repositories.py` | Transactional persistence; SQLite local adapter, later PostgreSQL parity |
| Add | `server/migrations/` | Reversible schema migration and verification; no migration over existing browser storage without an explicit import |
| Add | `server/app/api/projects.py`, `operations.py`, `schemas.py` | Request validation, explicit units, `If-Match` revision behaviour, bounded errors and response DTOs |
| Add | `server/app/security/principals.py` | Server-provided principal/project authorisation boundary; test doubles separated from real identity; any temporary local mode cannot bind publicly |
| Add | `server/app/main.py`, `settings.py` | App wiring/health, explicit local synthetic demo mode and no unauthenticated numerical endpoints |
| Add | `server/tests/test_projects.py`, `test_commercial_operations.py`, `test_revisions.py`, `test_project_access.py`, `test_persistence.py` | Observable contracts, isolation, failure/rollback/reopen, concurrency and undo |
| Update after checks | `docs/product/IMPLEMENTATION_STATUS.md`, setup/developer guide and operation contract | Actual commands/results and remaining identity/deployment limitations |

These are planned paths, not files falsely claimed to exist. Existing `prototype/app.js`, geometry/import/viewer, translations and tests stay intact in I01a. Reuse their field validation/provenance concepts as independently tested adapters, rather than copying UI state into a server-global object. No need to rewrite the PCA modules to create projects.

### Operation contract and acceptance

1. `POST /projects` creates a project with a new ID and integer revision. Unknown demand, material, geometry, programme length, price and cost are null/absent. Explicit sample templates are a different action.
2. `POST /projects/{id}/operation-previews` accepts the single allowlisted commercial tool, base revision, source statement and typed arguments; it makes no project mutation. Unit ambiguity/unknown fields are rejected or returned as missing inputs.
3. The preview returns exact effects/digest, source references and invalidated dependants. Approval is bound to project/principal/revision/digest with expiry and replay protection. Execution requires that approval, a matching revision and an idempotency key.
4. Execution commits the new revision and provenance atomically. A stale revision, changed effect, foreign-project source or unauthorised principal fails without partial writes. Retrying the same key does not apply twice.
5. Undo appends a compensating revision. It must not erase an intervening edit; preserved history/revisions remain queryable.
6. Close/restart the service and reopen both projects with their separate requests/units/sources. A missing requirement blocks a dependent calculation, not saving or unrelated editing. No numerical results exist in this increment.
7. The API is documented and locally demonstrable. Test identities are not described as production authentication. Public binding/privileged anonymous compute is disallowed in the interim configuration.

**Meaningful tests:** two unrelated flange/bracket briefs with different demand and commercial units; no cross-project leakage; absent versus explicit zero cost; units/count precision; invalid currency/basis; schema rejection; preview non-mutation; stale/altered/replayed approval; duplicate request; concurrent writers; rollback and process restart; compensating undo after/without intervening edits; persistence migration round trip. Production PostgreSQL/concurrency tests remain unpassed until that adapter is actually exercised.

**Exit:** reproducible fresh-environment install/start, real database request/reopen evidence and passing tests above. No P1-complete claim: integrated user interface, production identity and files are still required.

## I01b — Persistent workspace, supported assets and first actual AI operation

**Objective:** expose I01a in the original Process spine workspace; generic projects, shared brief/properties, supported OBJ/STL import with durable original bytes/units/transforms, persistent scene and permanently accessible copilot. Reuse browser inference for an actual approved commercial tool call.

**Files:** proposed `web/src/workspace/WorkspaceShell.tsx`, `ProjectContext.ts`, `SceneHost.tsx`, `CopilotPanel.tsx`, `ModulePanel.tsx`, `api/project-client.ts`, `operations/preview-controller.ts`, `assets/asset-client.ts`, `i18n/`; `server/app/api/assets.py`, `infrastructure/asset_store.py`, `application/asset_service.py`; parser job adapter and tests. Add a minimal React/TypeScript build only after a focused integration/licence/install check. Keep existing modules through adapters around `prototype/concept-view.js`, `mesh-import.js`, `shell-geometry.js`, `ai-client.js`, `ai-contract.js`, `description.js` and translation catalogues. The earlier `app.js` remains a working legacy demo during migration; do not import its global DOM lifecycle into the new scene owner.

**Acceptance:** original geometry/bytes/units/frame survive reopen; bracket/flange/enclosure stay distinct; no global PCB/clip fields. Navigating all implemented modules leaves the same viewer/camera/selection. Panels collapse/resize and copilot drafts persist. A real model proposes a commercial update; I01a validates/previews/approves/executes it and shows undo/source/revision. Manual fields use the same operation. Missing AI or malformed output does not mutate anything. Old v4 imports preserve particular requirements without adding defaults to new projects. EN/IT/FR/ES and existing regressions remain intact.

Identity/ACL and asset/job limits must precede any private/public deployment. A browser-only anonymous synthetic demo remains separate from private project endpoints. No paid hosting or public URL is created without approval.

## I02 — Restricted mould alternatives and preliminary press checks

**Objective:** a supported single-article cavity-layout/envelope concept with alternatives (for example 2 versus 4 cavities) and explicit preliminary press checks. This is not tool-grade mould design.

**Files:** proposed `server/app/domain/moulds.py`, `cell.py`, `engines/mould_layout.py`, `engines/press_compatibility.py`, corresponding typed tools/API/tests; scene adapters for original simplified mould/press envelopes. Extend the existing generic asset model, not the shell template as a global model.

**Inputs:** actual imported geometry or an explicit optional original template; unit/frame/ejection direction; user/sourced cavity spacing, mould envelope/mounting/strokes, shot requirement and clamp requirement/basis; candidate press specifications. Do not infer shot volume, projected area, melt density or cavity pressure from bounds/material family. Steels, feed/ejection/cooling can initially be configuration with unavailable checks clearly marked.

**Acceptance:** individual cavity IDs/transforms, original product link and accessible layout; correct dimensional boundary checks for each declared press criterion; passed/failed/incomplete per check, never an unexplained overall safe/compatible stamp. Unsupported undercuts/parting/solid operations are reported. Changing cavities invalidates downstream grip, sequence/capacity/cost results. Tests include the same product on two alternatives, insufficient shot, mounting/stroke conflict and missing input. A numerical clamp calculation uses explicit cavity-pressure/projected-area data and conversions, not hydraulic pressure substitution.

## I03 — First L0 material-to-conveyor engine and cell poses

**Objective:** real deterministic events/resources/inventories across configured drying/feed/metering/injection/holding/cooling/opening/ejection/pickup/transfer/deposit/belt phases. Omitted auxiliaries/qualification have explicit scenario states. Simple boxes/meshes can represent functional envelopes; do not animate unmodelled mechanisms as if calculated.

**Files:** proposed `server/app/domain/scenarios.py`, `frames.py`, `engines/l0/scheduler.py`, `resources.py`, `inventory.py`, `motion.py`, `poses.py`, run manifest/job service and tests; frontend event/pose sampling adapter.

Evaluate SimPy against an analytical resource benchmark before choosing it; alternatively justify a small standard-library scheduler. Keep numerical/event engine independent of rendering. Store immutable input/run versions, deterministic equal-time ordering and one support per part. Configured times or rest-to-rest motion profiles carry their source/assumptions; no polymer temperature/flow-field claim is available at L0.

**Acceptance:** analytical overlap/shared-resource schedules; empty/qualified inventory comparison; no negative mass or injection without a configured available dose; coherent cooling/metering/transfer dependencies; part IDs and pose continuity; XYZ-only flipped-deposit rejection; conveyor blockage/waiting; bounded events/horizon/instances; repeatability, cancellation and partial-result states. Use no employer data. All fixture times/properties are explicitly synthetic/configured.

## I04 — Shared-clock playback, capacity and cost comparison

**Objective:** play actual I03 runs and compute documented good-output/cost comparisons with complete sources and units.

**Files:** proposed `web/src/simulation/PlaybackClock.ts`, `RunSampler.ts`, `TimelineDrawer.tsx`, `EventLog.tsx`, result-chart adapters; `server/app/engines/economics.py`, `capacity.py`, report manifest and tool; tests for replay/hand calculations.

**Acceptance:** pause/seek/step/speed preserve event timestamps and state; one simulation time for scene/charts/logs. Capacity by article and commercial unit/BOM, startup versus steady state, rejects/runners/material mass and rate inclusions are consistent. Existing energy/depreciation/OEE losses are not charged twice. Missing inputs return incomplete totals without inventing costs; historical runs remain tied to their own revision. Compare simple analytical fixtures and an integrated configured case. Scientific fields remain unavailable unless actually computed.

## First complete integrated milestone — V1

| Requested step | Completion evidence |
| --- | --- |
| 1. Generic project | I01a: no product/business defaults; independent IDs/revisions |
| 2. Commercial request | I01a/I01b: chat/properties share quantities, market, commercial unit, costs/targets and sources |
| 3. Supported geometry import | I01b: OBJ/STL, declared units/frame, original bytes retained; STEP not claimed |
| 4. Persistent viewport | I01b: canvas/camera/selection survive module changes |
| 5. Simple mould alternatives | I02: supported cavity layout/envelopes with explicit unsupported checks |
| 6. Preliminary press checks | I02: sourced dimensional/shot/clamp/stroke criteria, incomplete states |
| 7. Temporal L0 | I03: actual event/resource/inventory engine |
| 8. Synchronous animation | I03/I04: run-driven poses and one playback clock, no fake physics |
| 9. Capacity/costs | I04: run/analytic basis, good commercial unit, sources and no double counting |
| 10. AI approved modification | I01b commercial tool, later I02 cavity tool; exact preview/approval/undo; dependent reruns only when engines exist |
| 11. Save/reopen | I01a–I04: server projects, original assets, revisions, run manifests and historical comparisons |

**V1 scenario:** two independent projects with different supplied geometries; one deliberately supported single-article mould/cell case, two cavity alternatives, defined press/XYZ robot/belt/auxiliary conditions and declared recipe/rates. Demonstrate save/reopen, one real AI change, stale results, recalculation, event playback and comparison. Include unreachable flip, starvation and missing-cost branches. Every diagram/parameter states its source and fidelity. Full mouldability, tooling drawings, universal CAD generation and validated polymer physics remain outside V1.

Do not label V1 complete until all eleven observable steps pass end-to-end tests. I01a by itself is a foundation, not this milestone. An online pilot additionally requires I00-S and identity/backup/independent security gates; no implicit permission to publish follows from passing tests.

## Later increments

- **I05 CAD kernel/families:** compare Open CASCADE wrappers on permitted STEP solids, topology/units/frame/volume/export and representative supported feature operations; select one wrapper. Add parametric families, assembly dependencies, ejection/feeding and geometric cooling proposals with explicit checks. No promise of arbitrary mould generation.
- **I06 physical L1:** source/publish equations, units, assumptions and material-grade data; verify mass/energy, conditioning/plasticisation and cooling against analytical then independent measured cases. CoolProp is only a relevant fluid-property candidate. No detailed heat map from an average temperature.
- **I07 statistics/optimisation:** close I00-N; admit licensed real datasets; grouped validation/baselines; integrate PCA and PLS, then constrained trial design. Correlation is not causation or experimental validation.
- **I08 optional L2 and release:** select bounded CFD/FEM integrations only after installation/API/licence/reference/performance gates; prove backup/restore, multiuser isolation and supported deployments. Review costs/licence/publication decisions with the owner on concrete results.

## Delivery rules and review gates

Each increment reports changed files, reused components, executed/passed/failed/blocked/unrun checks, scientific/security/licence limits and exact artefact versions. Keep regression tests tied to actual behaviours; do not create trivial tests or hide failures. Run new heavyweight engines only when justified by the next capability.

Ordinary reversible choices are made by the implementation lead with a recorded rationale. Ask only for licence/rights decisions, paid commitments, irreversible architecture/security exceptions and explicitly restricted publication. Do not request permission merely to continue local audit/development. No dates, percentage completion or free-hosting/performance promise is given without measured scope/hardware.
