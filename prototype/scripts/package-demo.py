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

instructions = """MOULD STUDIO — LOCAL REQUIREMENTS AND GEOMETRY DEMO

Extract the ZIP, then open Mould-Studio.html in a recent browser.
The interface defaults to English. Select English, Italiano, Francais
or Espanol in the header; the selection is remembered by the browser.
No developer tools, server or internet connection are needed.

This is a local demo, not the target online platform.
P0 specification is complete. P1 (generic commercial chat with real AI
and server persistence) has not been implemented.

Try: shell 140 x 90 x 40 mm, wall 2 mm, radius 10 mm, glossy ABS.
Prepare and apply the proposed change. Local commands also support
Italian, French and Spanish keywords; they are not an AI agent.

For OBJ/STL input choose units first (max 12 MB / 100,000 triangles).
Photos are local visual references (JPG/PNG/WebP, max 8 MB/25 MP),
not automatic reconstructions. Meshes and photos remain in session
memory and must be loaded again after restarting the page.

Use JSON export to retain a copy of the brief. JSON contains asset
metadata, not original files; JSON import is not yet implemented.
Browser persistence for local files depends on browser/path settings.
WebGL2 is required for 3D. Engineering validation has not been performed.
Mould, cell, process simulation, costs and actual AI are planned modules.
Preview.png shows the interface. The Three.js MIT licence is in the HTML.
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
