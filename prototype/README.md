# Mould Studio — local requirements and geometry demo

This is the legacy demo, not the P1 online application. [Platform documents](../docs/product/README.md) define the generic, customer-first product. See [actual status](../docs/product/IMPLEMENTATION_STATUS.md).

## Download without developer tools

Use the [demo delivery page](../demo/README.md), extract the ZIP and open `Mould-Studio.html` in a recent browser. Three.js, CSS and all translations are bundled. WebGL2 is required for 3D. No server or internet connection is needed for the packaged demo.

The interface defaults to English. The selector offers English, Italiano, Français and Español, persisting the explicit preference separately from project data. Changing language preserves values, notes, filenames, pending fields and validation state. Number/currency presentation follows the locale; stored numbers do not change.

## Development

From `prototype`:

```bash
npm ci
npm start
```

Node/npm installs pinned dependencies; Python serves development files on loopback port 4173. The cloud onboarding UI does not expose loopback previews. Three.js is pinned at 0.180.0; esbuild at 0.25.12. No CDN or AI service is called.

```bash
npm test
npm run test:browser
npm run build:standalone
npm run test:standalone
npm run package:demo
```

Browser checks require Chromium and Node 22+. `CHROMIUM_BINARY` can override its path. They use an isolated profile/server and write artefacts under repository `.cache/ux`. The standalone test loads the single HTML over loopback, disconnects networking during interactions and verifies no external dependencies. It reconnects for document reloads. Direct `file://` navigation is blocked by the cloud browser policy, so double-click opening is not directly verified here.

## Available capabilities and limits

- Local commercial/technical forms, press catalogue, wall candidates, JSON export and browser persistence.
- Simplified example shell geometry, views, explosion/transparency, geometric volume and OBJ export in assembled coordinates. OBJ uses millimetres by convention.
- `description.js`: deterministic geometric commands in EN/IT/FR/ES with preview/apply/undo. This is not a language model.
- `mesh-import.js`: OBJ/STL viewing with explicit coordinate units and bounds, up to 12 MB/100,000 triangles. Bounds update the brief only on explicit action. Mesh solidity/material/volume are not inferred.
- Local JPG/PNG/WebP references, up to 8 MB/25 megapixels. Automatic reconstruction is not implemented.
- Meshes/photos stay in session memory and must be reloaded after restart. JSON includes metadata, not original files. OBJ export remains for the parametric example and is disabled while viewing imported geometry.

There is no backend, actual AI agent, STEP kernel, mould/cell model, cycle/process engine, cost calculation or PCA/PLS application integration. The shell example does not constrain the target platform.

## Persistence and migration

Project storage uses `injection-moulding-brief-v1` and an example backup key. The exported schema is v4. Its historical contract and migration rules are in [the archive](../docs/product/archive/DEMO_02_SPECIFICATION.md). Unreadable data is preserved; unavailable storage falls back to memory with export guidance. JSON import is not implemented.

`mould-studio-language` stores only the interface preference. Unsupported preferences fall back to English. Source strings/documentation are English; translation catalogues intentionally contain the other UI languages. User-authored content is explicitly excluded from UI translation.

## Verification scope

Unit checks cover geometry, volumes, closed/oriented meshes, OBJ indices, commands, import units/errors and translation catalogue/parameter integrity. Browser checks cover actual 3D, parameters, file downloads, legacy migration, local references/import, four languages, language persistence, unchanged project data, pending form input, invalid values and mobile layout.

These demonstrate demo behaviour, not engineering accuracy or completion of P1. Required platform acceptance scenarios remain planned in [BACKLOG.md](../docs/product/BACKLOG.md).
