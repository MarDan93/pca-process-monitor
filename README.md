# pca-process-monitor
Python library for PCA-based process monitoring — continuous and batch processes. Includes NIPALS, T², Q, contribution plots, and AI-assisted interpretation.

## Injection moulding platform

The target is an online, AI-assisted platform for commercial and technical feasibility and end-to-end injection moulding simulation. It starts with the customer brief and connects generic products, moulds, the press/Cartesian robot/conveyor cell, material-to-part process simulation, economics and real-data optimisation. Open-source components and AI models are a product requirement.

The [product documents](docs/product/README.md) define the system and acceptance criteria. The existing offline demo is an earlier shell-specific UX experiment; it does not implement the online platform, AI agents or process simulation. See [implementation status](docs/product/IMPLEMENTATION_STATUS.md).

- [Prototype setup and checks](prototype/README.md)
- [Download and open the standalone demo](demo/README.md)
- [Product roadmap](docs/product/ROADMAP.md)
- [Requirements and decisions](docs/product/DISCOVERY.md)
- [Current specification](docs/product/SPECIFICATION.md)
- [Optional enclosure example](docs/product/REFERENCE_CASE.md)
- [Online architecture and open-source approach](docs/product/ARCHITECTURE.md)
- [Material-to-conveyor simulation](docs/product/SIMULATION.md)
- [Implementation backlog and acceptance criteria](docs/product/BACKLOG.md)

## Project status and languages

P0 specification is complete. P1 (generic commercial chat, actual open-source AI and server persistence) has not started. See [the milestone table](docs/product/ROADMAP.md) and [actual implementation status](docs/product/IMPLEMENTATION_STATUS.md). Demo maintenance is tracked separately. Development is currently on `demo/progettazione-stampi-2026-10-15`, not `main`.

The official repository language is English. The demo supports English, Italian, French and Spanish, with English as its default. See [contribution and language conventions](CONTRIBUTING.md).
