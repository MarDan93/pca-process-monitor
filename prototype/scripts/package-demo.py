"""Package the verified single-file demo with English delivery instructions."""
from hashlib import sha256
from pathlib import Path
from shutil import copyfile
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parents[1]
repo = root.parent
html = root / "dist/Mould-Studio.html"
screenshot = repo / ".cache/ux/concept-standalone.png"
for source in (html, screenshot):
    if not source.is_file():
        raise SystemExit("Run npm run build:standalone and npm run test:standalone first.")

instructions = """MOULD STUDIO — AI AND GEOMETRY DEMO

Extract the ZIP, then open Mould-Studio.html in a recent browser.
English is the default. English, Italiano, Francais and Espanol
are selectable in the header without translating project values.

AI: select AI > Load AI model. First use needs internet and downloads
about 800 MB. No API key, account or paid inference is required.
After Ready, use Conversation for questions or select Propose changes
and try: Set annual_volume to 80000 and market to Appliances.
Review the reply and Apply AI proposal only if correct. Accepted values
are sourced in JSON export. Stop terminates loading/generation.
The small Qwen2.5 model can make mistakes or return unusable proposals.
Real browser inference and review/apply pass with self-hosted assets.
The remote-host route is blocked by the cloud browser certificate store;
see prototype/OPEN_SOURCE.md in the repository for exact evidence.

The CAD-style interface follows FreeCAD conventions with Lucide icons,
not an embedded FreeCAD/SolidWorks kernel. Use wireframe, grid, fit,
standard views, explosion and transparency on the actual 3D viewer.
Geometry/forms/local Commands work offline; first-use AI does not.

Commands example: shell 140 x 90 x 40 mm, wall 2 mm, radius 10 mm, ABS.
Prepare and apply the proposed reference-shell change. Commands support
English, Italian, French and Spanish; this parser is separate from AI.
OBJ/STL input: choose units first (12 MB / 100,000 triangles).
Photos are references (JPG/PNG/WebP, 8 MB/25 MP), not reconstructions.
Mesh/photo files remain in session memory; reload after restart.
JSON exports contain metadata, not source files. JSON import is planned.

This local demo is a partial AI experiment for P1, not the complete
online platform. Server persistence, STEP, generic CAD generation,
mould/cell/process simulation, economics and ML integration are planned.
WebGL2 is required for 3D and WebAssembly for AI. Runtime licences are
included in the HTML. Weights are not included. No engineering validation
has been performed. See Preview.png for the new interface.
"""
destination = repo / "demo"
destination.mkdir(exist_ok=True)
copyfile(screenshot, destination / "Preview.png")
copyfile(screenshot, destination / "Anteprima.png")  # Preserve previously shared links.
copyfile(html, destination / "Mould-Studio.html")
archive = destination / "mould-studio-demo.zip"
with ZipFile(archive, "w", compression=ZIP_DEFLATED, compresslevel=9) as package:
    package.write(html, "Mould-Studio.html")
    package.write(screenshot, "Preview.png")
    package.writestr("README.txt", instructions.encode("utf-8"))
with ZipFile(archive) as package:
    if package.testzip() is not None:
        raise SystemExit("Archive integrity check failed.")
    assert package.read("Mould-Studio.html") == html.read_bytes()
copyfile(archive, destination / "progettazione-stampi-demo.zip")  # Legacy URL alias.
checksum = sha256(archive.read_bytes()).hexdigest()
(destination / "SHA256SUMS").write_text(f"{checksum}  {archive.name}\n")
print(f"Demo: {archive} ({archive.stat().st_size:,} bytes); SHA-256: {checksum}")
