# pca-process-monitor
Python library for PCA-based process monitoring — continuous and batch processes. Includes NIPALS, T², Q, contribution plots, and AI-assisted interpretation.

## Injection moulding platform

The user-facing application is browser-only, with server-persisted projects. [Managed web deployment](docs/deployment/MANAGED_WEB.md) prepares the full current version on Render with an owner login and persistent disk. Hosting activation/account and recurring-charge approval remain external prerequisites; no live service URL exists yet. Local commands below are for developers, not end-user installation.

The target is an online, AI-assisted platform for commercial and technical feasibility and end-to-end injection moulding simulation. It starts with the customer brief and connects generic products, moulds, the press/Cartesian robot/conveyor cell, material-to-part process simulation, economics and real-data optimisation. Open-source components and AI models are a product requirement.

The new [runnable workspace](web/README.md) implements generic projects, durable commercial requirements, approved revisioned operations and an original dark CAD-style interface with persistent 3D and a right AI copilot. The local FastAPI/SQLite service and React/TypeScript interface reuse the existing viewer, mesh importer, translations and actual browser inference. See [implementation evidence](docs/verification/WORKSPACE_2026-10-17.md).

The [product documents](docs/product/README.md) define the full system. The existing offline demo remains an earlier shell-specific experiment. The new workspace starts with empty generic projects and retains original OBJ/STL files; mould/cell/process/cost engines and production online deployment remain on the roadmap. The [17 October audit](docs/README.md) remains the dated baseline for scientific, security, rights and data gates. No push, merge, relicense or publication was performed.

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

I01a and a bounded part of I01b are implemented locally. The new workspace passes transactional API, browser workflow and actual self-hosted browser-AI checks. P1 is not a completed online milestone: wider AI evaluation, production identity/access/recovery and the remaining migration work are open. See [the milestone table](docs/product/ROADMAP.md) and [actual implementation status](docs/product/IMPLEMENTATION_STATUS.md). Development remains on `demo/progettazione-stampi-2026-10-15`, not `main`; this increment is uncommitted local work.

The official repository language is English. The demo supports English, Italian, French and Spanish, with English as its default. See [contribution and language conventions](CONTRIBUTING.md).
