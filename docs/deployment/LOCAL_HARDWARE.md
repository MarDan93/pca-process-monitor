# Local hardware profile

**Later trial choice, 19 October:** the owner chose [Codespaces](CODESPACES.md) for the first online process/AI trial. Server CPU inference and a bounded L0 scheduler are now implemented there. The local-machine assessment below remains useful for browser scene complexity and any future local delivery; it is not a benchmark of either computer.

Updated 2026-10-19. The owner now requests a local application, including local AI, superseding the earlier online-only delivery preference. The browser interface, local API/database and existing browser inference are reusable; a new native AI runtime has not been integrated. Managed hosting remains an optional prepared deployment, not an activated service.

## Owner's current computer

The supplied Windows system-information screenshot reports:

- Intel Core i5-6200U at approximately 2.3 GHz.
- 8 GB installed RAM.
- A graphics-memory figure of 1 GB, with multiple GPUs indicated. Exact adapters, drivers and available shared memory are unknown.
- 238 GB storage, with approximately 151 GB used (approximately 87 GB free). Storage type is unknown.

These specifications are a development target, **not a measured compatibility or performance result**. Windows version, free RAM under normal use and browser/WebGL support still need confirmation on the actual machine. Cloud browser results cannot predict this laptop's response times.

## Feasibility by workload

| Workload | Assessment for this computer |
| --- | --- |
| Customer brief, commercial data, project revisions and local database | Suitable first-delivery target; must be checked on the actual Windows machine. |
| Bounded mesh viewing and simplified product/mould/cell scenes | Plausible with limited scene complexity; detailed assemblies may exhaust memory or render slowly. Existing import limits are safety limits, not a performance guarantee. |
| Small local AI model on CPU | Plausible but memory use and latency need measurement. The current pinned 0.5B q4 model is small and has limited domain accuracy; loading it is optional. |
| Configured event/resource cycle simulation and run-driven animation | Appropriate future lightweight target with bounded scenarios, event history and rendered instances. The engine is not implemented yet. |
| PCA/PLS on modest tabular datasets | Generally a CPU workload; actual dataset dimensions and algorithm choices determine memory/time. PCA correctness work and PLS integration remain open. |
| Detailed STEP assemblies, automatic CAD operations and multiple simultaneous agents | Not a comfortable target at 8 GB. Operation complexity and model/runtime memory need separate acceptance checks. |
| High-resolution polymer flow, cooling/warpage CFD/FEM, large optimisation campaigns or larger AI models | No claim of practical full-local operation on this computer. Restrict fidelity/size or use more capable hardware. |

Availability of a module in the interface does not establish that its largest workloads run on the same hardware. A temporal animation of configured phases is not a validated flow or thermal solution.

## Lightweight delivery decisions

Reuse the existing local API/database and browser viewport. Keep AI loading explicit, use CPU inference as the conservative baseline, and avoid requiring GPU acceleration. The existing worker already uses one WASM thread and handles one request at a time. Do not start a collection of resident AI agents or heavyweight solvers by default.

For future engines, bound scene/event sizes and run computational jobs sequentially on this profile. Preserve the full project model and module roadmap; make workload/fidelity limits visible rather than silently presenting simplified calculations as high-fidelity results. A native inference adapter, offline first-download workflow and automatic resource scheduling are future implementation work, not features delivered by this assessment.

The current model download is approximately 786 MB; model file size is **not** its total runtime RAM requirement. The app, model runtime, browser and Windows share the 8 GB. No response-time or peak-memory target has yet passed on this computer. Approximately 87 GB free is sufficient to begin with a bounded installation, but caches, future models and project/run history require explicit storage management.

## Upgrade guidance, not a universal minimum

16 GB RAM offers a more useful entry point for local 3D plus small AI; 32 GB and a modern multi-core CPU are a more comfortable engineering-development target. Check the laptop's upgrade limits before buying RAM. A GPU is not required for the first increment or ordinary PCA/PLS. A compatible GPU with roughly 8–12 GB VRAM can help selected larger quantised models, but does not guarantee that every model or solver fits. High-fidelity solvers need workload-specific sizing and may need substantially more memory.

## Windows acceptance still required

On the actual computer, verify startup/save/reopen, representative mesh navigation, first model download, inference and cancellation, and failure recovery under memory pressure. Record free/peak RAM, storage growth, browser version and observed response times. Until that check is performed, describe the first delivery as a lightweight target with cloud-tested software, not as a Windows performance certification.

See [current implementation status](../product/IMPLEMENTATION_STATUS.md), [workspace startup](../../web/README.md) and the [incremental roadmap](../planning/IMPLEMENTATION_PLAN.md).
