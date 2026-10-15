# Architettura del workspace conversazionale

L'esperienza deve permettere di descrivere, importare e modificare il prodotto nello stesso spazio 3D. Conversazione, albero del modello e proprietà condividono lo stato del progetto. L'immagine di un'idea è un riferimento; le analisi tecniche lavorano sulla geometria misurabile e sui requisiti.

## Tre ingressi, un progetto

| Ingresso | Ruolo nel prodotto completo | Stato della demo 02 |
| --- | --- | --- |
| Testo | Agente che struttura requisiti e propone operazioni CAD | Comandi locali per quote, parete, raggio, materiale e finitura del guscio |
| File 3D | STEP come solido CAD, mesh come superficie, unità e integrità esplicite | Viewer OBJ/STL e ingombri; nessun riconoscimento automatico di feature |
| Foto | Riferimenti, quota nota, viste multiple e ricostruzione parametrica da revisionare | Riferimento visivo locale; nessuna ricostruzione automatica |

Da una foto singola non si ricavano in modo univoco profondità, interni, spessori, tolleranze o materiale. La fotogrammetria può recuperare superfici visibili da molte fotografie e richiede un riferimento di scala per dimensioni metriche; non produce automaticamente un CAD parametrico utilizzabile per lo stampo. Una mesh generativa ha un ruolo di esplorazione della forma finché geometria e quote non vengono verificate.

## Componenti previsti

1. Workspace web con albero delle operazioni, selezione 3D, proprietà e conversazione contestuale. La libreria di UI è una scelta di implementazione; l'interazione si basa su azioni e risultati nello stesso progetto.
2. Stato di progetto versionato con requisiti, fonti, geometria, materiali e scenari economici. Ogni operazione conserva parametri, unità e revisione di partenza; file originali e allegati richiedono persistenza dedicata.
3. Motore CAD basato su Open CASCADE, eventualmente attraverso FreeCAD/CadQuery o WASM, per STEP, solidi, raccordi, sformi e operazioni sullo stampo. La scelta va verificata con casi della famiglia concordata.
4. Agente AI che trasforma il dialogo in comandi strutturati per gli stessi strumenti usati dalle proprietà. I calcoli e la geometria vengono eseguiti dai motori, con esito controllabile e modifica recuperabile. Il fornitore o modello locale resta da scegliere.
5. Backend e lavori asincroni per ricostruzione, analisi geometriche e solutori: avanzamento, annullamento e risultati legati alla versione del modello.
6. Servizi tecnico-economici e di processo; PCA/PLS su dati reali con preprocessing, dataset e modelli versionati.

La demo attuale separa già geometria pura, visualizzazione, comandi, importazione e template del workspace. Usa persistenza locale del brief, undo dell'ultima modifica da testo e file in memoria. Non contiene ancora un kernel CAD, un backend o un agente AI.

## Risultato di ciascuna fase

Idea o immagine → geometria parametrica/solido CAD con scala e quote → analisi di stampabilità → alternative di stampo, pressa e costo → simulazioni → piano di prove e validazione su dati reali. Le informazioni mancanti bloccano il relativo calcolo o diventano ipotesi esplicite. La conferma del brief non costituisce una verifica tecnica.

## Cosa significa gratuito

Il nucleo può utilizzare componenti open source: Three.js per la vista, Open CASCADE/FreeCAD/CadQuery per il CAD e NumPy/scikit-learn per l'analisi. Le singole licenze, inclusa quella del modello AI scelto, vanno controllate rispetto alla distribuzione prevista. Un agente locale compatibile può evitare tariffe per richiesta, usando risorse del computer o del server. Hardware, hosting, calcolo delle simulazioni, manutenzione e verifica ingegneristica restano costi reali. API AI, generazione immagini e solutori commerciali sono integrazioni opzionali con eventuali tariffe; non sono prerequisiti del nucleo proposto.

## Prossima implementazione

Validare questa UX, introdurre salvataggio di modelli/allegati e revisioni, poi integrare STEP e un piccolo insieme di operazioni CAD. Collegare l'agente a quelle operazioni e verificarlo sul guscio di riferimento prima di estendere la generazione a geometrie arbitrarie o stampi completi.
