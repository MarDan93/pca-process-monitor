"""Package the verified standalone build for opening without developer tools."""

from pathlib import Path
from shutil import copyfile
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parents[1]
repo = root.parent
html = root / "dist/Progettazione-stampi.html"
screenshot = repo / ".cache/ux/concept-standalone.png"
for source in (html, screenshot):
    if not source.is_file():
        raise SystemExit("Eseguire prima npm run build:standalone e npm run test:standalone.")

instructions = """MOULD STUDIO — DEMO 02

1. Estrai tutti i file dello ZIP in una cartella sul computer.
2. Apri Progettazione-stampi.html con un browser recente (Chrome, Edge,
   Firefox o Safari). Non occorrono installazioni o connessione Internet.
3. La demo si apre sui due gusci 3D: trascina per ruotare, usa la rotella
   per lo zoom e prova le viste, l'esploso e gli spessori 1,5 / 2 / 2,5 mm.

Nel menu trovi brief cliente, pezzo/materiale, presse e riepilogo.
Puoi modificare i parametri ed esportare il brief JSON e i gusci OBJ.

DESCRIVI: prova "Guscio 140 x 90 x 40 mm, spessore 2 mm,
raggio 10 mm, PP lucido". Prepara la modifica, controlla e applica.
Sono comandi parametrici locali; non e ancora un agente AI.

FILE 3D: scegli l'unita e carica OBJ/STL (max 12 MB / 100.000 triangoli).
Gli ingombri passano al brief solo con il comando dedicato.
FOTO: aggiungi JPG/PNG/WebP come riferimento (max 8 MB / 25 megapixel).
La foto non ricostruisce automaticamente un modello 3D.

Mesh e foto sono conservate solo in memoria durante questa sessione.
Dopo un riavvio occorre ricaricarle; il JSON contiene solo metadati.
Il rendering richiede WebGL2. Se il browser aziendale blocca i file HTML
locali, serve un accesso web consentito dall'organizzazione.

I dati restano nel browser; non vengono inviati a un server. Esporta il
brief per conservarne una copia: la persistenza dei file locali dipende
dal browser e dal percorso del file. Non c'e ancora importazione JSON.

Questa demo mostra l'interfaccia e la geometria semplificata del
pezzo. Agganci, schede, guarnizioni e stampo non sono ancora modellati.
Simulazioni fisiche, import STEP, agenti AI, calcoli di costo e PCA/PLS
sono nella roadmap. IP65 e 1.000 cicli sono requisiti non verificati.

Anteprima.png mostra la stessa interfaccia senza dover aprire l'HTML.
La licenza MIT di Three.js e inclusa nel file HTML.
"""
destination = repo / "demo"
destination.mkdir(exist_ok=True)
copyfile(screenshot, destination / "Anteprima.png")
archive = destination / "progettazione-stampi-demo.zip"
with ZipFile(archive, "w", compression=ZIP_DEFLATED, compresslevel=9) as package:
    package.write(html, "Progettazione-stampi.html")
    package.write(screenshot, "Anteprima.png")
    package.writestr("LEGGIMI.txt", instructions.encode("utf-8"))
with ZipFile(archive) as package:
    if package.testzip() is not None:
        raise SystemExit("Archivio non valido.")
    assert package.read("Progettazione-stampi.html") == html.read_bytes()
print(f"Demo: {archive} ({archive.stat().st_size:,} bytes)")
