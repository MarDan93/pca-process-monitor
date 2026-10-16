# Local demo download

**This demo now includes a real browser-AI integration and CAD-style interface. Full P1 (generic online projects and server storage) is not complete. Actual model inference has been verified in Chromium using self-hosted model/runtime files; the remote download route is blocked by this cloud browser’s certificate store.** Follow the [roadmap](../docs/product/ROADMAP.md) and [actual status](../docs/product/IMPLEMENTATION_STATUS.md).

1. [Download the ZIP](mould-studio-demo.zip?raw=true).
2. Extract all files and open **Mould-Studio.html** in a recent browser.
3. Select **English, Italiano, Français or Español** in the header. English is the default.

If the direct link fails, [open the ZIP file page](mould-studio-demo.zip) and use GitHub **Download raw**. A [single HTML file](Mould-Studio.html?raw=true) is also available; save it as `Mould-Studio.html` and open it locally. [SHA-256 checksum](SHA256SUMS) is provided. Older ZIP/image filenames remain compatibility aliases.

![English interface and 3D example](Preview.png)

Geometry, forms and local commands work without installation or network. The AI needs internet for its first model/runtime download (about 800 MB). WebGL2 is required for 3D. Try local geometric commands, OBJ/STL viewing with explicit units, photo references, brief/press forms and JSON/OBJ export. The language selector does not translate project values or filenames.

**Try AI:** open the **AI** tab, select **Load AI model**, wait for **Ready**, choose **Propose changes**, then ask `Set annual_volume to 80000 and market to Appliances. Reply briefly in English.` Review the response and select **Apply AI proposal**. Use **Conversation** for ordinary questions; it does not edit fields. No API key/account is needed. This small local model may return invalid proposals; the app shows the answer without applying them. [Model, licences and verification evidence](../prototype/OPEN_SOURCE.md).

The FreeCAD-inspired workbench has actual wireframe, grid, fit, standard views, explosion and transparency controls, with open-source Lucide icons. FreeCAD itself is not embedded.

**Commands tab example:** `shell 140 × 90 × 40 mm, wall 2 mm, radius 10 mm, glossy ABS`. Review/apply the proposal and optionally undo it. Commands also accept the supported Italian/French/Spanish keywords. This is a deterministic parser, not an AI model.

Mesh/photo files remain in session memory; reload them after restarting. JSON exports contain their metadata, not original files. STEP, mould/cell modelling, process physics, economics and PCA/PLS integration remain future work. The enclosure is only an optional example in the target platform.
