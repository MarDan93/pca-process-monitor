# Local demo download

**This is a requirements/geometry demo. P0 documentation is complete; P1, the online application with commercial chat, real AI and server storage, is not implemented.** Follow the [roadmap](../docs/product/ROADMAP.md) and [actual status](../docs/product/IMPLEMENTATION_STATUS.md).

1. [Download the ZIP](mould-studio-demo.zip?raw=true).
2. Extract all files and open **Mould-Studio.html** in a recent browser.
3. Select **English, Italiano, Français or Español** in the header. English is the default.

If the direct link fails, [open the ZIP file page](mould-studio-demo.zip) and use GitHub **Download raw**. A [single HTML file](Mould-Studio.html?raw=true) is also available; save it as `Mould-Studio.html` and open it locally. [SHA-256 checksum](SHA256SUMS) is provided. Older ZIP/image filenames remain compatibility aliases.

![English interface and 3D example](Preview.png)

No installation or network connection is needed for the packaged demo. WebGL2 is required for 3D. Try local geometric commands, OBJ/STL viewing with explicit units, photo references, brief/press forms and JSON/OBJ export. The language selector does not translate project values or filenames.

Example command: `shell 140 × 90 × 40 mm, wall 2 mm, radius 10 mm, glossy ABS`. Review/apply the proposal and optionally undo it. Commands also accept the supported Italian/French/Spanish keywords. This is a deterministic parser, not an AI model.

Mesh/photo files remain in session memory; reload them after restarting. JSON exports contain their metadata, not original files. STEP, mould/cell modelling, process physics, actual AI, economics and PCA/PLS integration remain future work. The enclosure is only an optional example in the target platform.
