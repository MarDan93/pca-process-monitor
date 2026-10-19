> Current connected workflow (19 October): [load machine/material data, generate a preliminary mould layout and run synchronized 3D/traces](docs/data/ENGINEERING_LIBRARY.md). [Codespaces update instructions](docs/deployment/CODESPACES.md). Official numerical OEM coverage is currently zero (blocked source access); the engine computes configured L0 timing, not polymer physics. See [current status](docs/product/IMPLEMENTATION_STATUS.md).

# pca-process-monitor
Python library for PCA-based process monitoring — continuous and batch processes. Includes NIPALS, T², Q, contribution plots, and AI-assisted interpretation.

## Injection moulding platform

**Current delivery, 19 October:** try the server-backed app in [GitHub Codespaces](docs/deployment/CODESPACES.md), including a first configured material-to-conveyor simulation and actual server CPU AI. [Open the trial creation screen](https://github.com/codespaces/new?repo=1262022691&ref=trial%2Fcodespaces-process), select `trial/codespaces-process` and a two-core machine, then follow the guide. The owner must create the Codespace: the current integration lacks Codespaces API scope. No live service address or free unlimited hosting is claimed. Local startup and the earlier managed hosting preparation remain alternatives.

The target is an AI-assisted platform for commercial and technical feasibility and end-to-end injection moulding simulation, with browser access and separable local/hosted deployment. It starts with the customer brief and connects generic products, moulds, the press/Cartesian robot/conveyor cell, material-to-part process simulation, economics and real-data optimisation. Open-source components and AI models are a product requirement.

The new [runnable workspace](web/README.md) implements generic projects, durable commercial requirements, approved revisioned operations and an original dark CAD-style interface with persistent 3D and a right AI copilot. The local FastAPI/SQLite service and React/TypeScript interface reuse the existing viewer, mesh importer, translations and actual browser inference. See [implementation evidence](docs/verification/WORKSPACE_2026-10-17.md).

The [product documents](docs/product/README.md) define the full system. The existing offline demo remains an earlier shell-specific experiment. The workspace starts with empty generic projects, retains original OBJ/STL files and now runs a bounded L0 process with shared-clock animation/inventory/timeline, approved AI configuration and persisted results. Mould/press checks, costs, detailed physics and integrated scientific ML remain on the roadmap. The [17 October audit](docs/README.md) remains the dated baseline; [19 October verification](docs/verification/PROCESS_CODESPACES_2026-10-19.md) records this increment. The Codespaces trial uses `trial/codespaces-process`; `main` and MIT are preserved.

- [Prototype setup and checks](prototype/README.md)
- [Run the new workspace](web/README.md)
- [Download and open the standalone demo](demo/README.md)
- [Product roadmap](docs/product/ROADMAP.md)
- [Requirements and decisions](docs/product/DISCOVERY.md)
- [Current specification](docs/product/SPECIFICATION.md)
- [Optional enclosure example](docs/product/REFERENCE_CASE.md)
- [Online architecture and open-source approach](docs/product/ARCHITECTURE.md)
- [Material-to-conveyor simulation](docs/product/SIMULATION.md)
- [Implementation backlog and acceptance criteria](docs/product/BACKLOG.md)

## Project status and languages

I01a, bounded I01b and a first configured L0 subset of I03–I04 are implemented. The workspace passes transactional API, browser workflow, actual browser/server CPU AI and synthetic Codespaces-launcher checks. Full V1 is incomplete: mould/press checks, economics, physics, broader AI evaluation and production recovery remain open. See [the milestone table](docs/product/ROADMAP.md) and [actual implementation status](docs/product/IMPLEMENTATION_STATUS.md). The current trial branch is `trial/codespaces-process`; the earlier hosted snapshot remains on `deploy/web-pilot`. No merge into `main` or external hosting activation was performed.

The official repository language is English. The demo supports English, Italian, French and Spanish, with English as its default. See [contribution and language conventions](CONTRIBUTING.md).
