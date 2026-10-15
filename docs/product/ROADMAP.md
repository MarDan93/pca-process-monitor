# Roadmap del prodotto — versione iniziale

Stato: avvio della definizione. I requisiti confermati derivano dalla conversazione; le proposte sono da validare con l'utente. Le fasi non costituiscono una stima di tempi o costi.

## Obiettivo

Accompagnare la progettazione per lo stampaggio a iniezione dal brief cliente alla proposta tecnico-economica, al concept dello stampo, alla configurazione di pressa e ausiliari, alla simulazione e all'ottimizzazione su dati reali. Ridurre il lavoro ripetitivo rendendo verificabili alternative, dati, ipotesi e decisioni. La verifica tecnica rimane parte del percorso.

## Requisiti confermati

- Partenza da requisiti cliente tecnici, estetici, produttivi e commerciali.
- Analisi del pezzo 3D e, in prospettiva, reverse engineering a partire da geometria ricostruita e misure.
- Volumi annui, durata della commessa, costo obiettivo e budget devono influire su stampo, pressa e automazione.
- Proposta assistita di stampo: divisione, cavità, alimentazione, raffreddamento, materiali, estrazione e componenti.
- Simulazione temporale di plastificazione e ciclo di stampaggio, con stato dei componenti e animazione di stampo, pezzo e robot.
- Analisi e ottimizzazione con dati reali forniti dall'utente, PCA per esplorazione e PLS per previsione delle caratteristiche misurate.
- Integrazione AI e UX professionale orientata alla semplicità; dettagli tecnici consultabili.
- Nessun dato, CAD o caso produttivo reale disponibile all'avvio.
- Utente principale della prima versione: progettista di stampi.
- Primo caso: pezzo complesso con sottosquadri e carrelli; dettagli dei cinematismi da precisare.
- Confronto di presse del parco esistente e di presse da scegliere/acquistare fin dalla prima versione.
- Primo pezzo: guscio estetico per dispositivo elettronico da interno, 120 × 80 × 35 mm indicativi, con fissaggi e sottosquadri.
- Ingresso geometria: STEP oppure creazione parametrica guidata.
- Alternative materiale: ABS, PC/ABS, PP, PE e copolimeri; gradi e proprietà da definire.
- Prima consegna: concept stampo 3D, confronto costi e compatibilità pressa.
- Quantità annua libera scelta dall'utente; durata iniziale commessa 5 anni modificabile; costo industriale da ricavare dal confronto prima di fissare un obiettivo.
- Guscio con finitura lucida e requisiti estetici elevati, fissaggio tramite soli agganci a scatto, confronto degli spessori 1,5 / 2 / 2,5 mm.
- Due gusci, con ingombro complessivo 120 × 80 × 35 mm, altezze iniziali 50% / 50%, sei agganci smontabili con attrezzo. Faccia frontale e pareti laterali sono estetiche.
- Tre agganci per lato lungo, obiettivo di 1.000 cicli di montaggio/smontaggio e raggio esterno iniziale 8 mm.
- Quattro schede, sportello sigillato per il connettore, obiettivo IP65 e involucro chiuso con sfiato protetto di compensazione della pressione. Raffreddamento e tenute da verificare.
- Schede 40 × 25 × 8 mm inclusi componenti, disposte due per due su un livello. Obiettivo IP65 anche con cavo collegato.

## Percorso dell'utente

Brief cliente → pezzo e materiale → requisiti e vincoli → alternative stampo/pressa → confronto economico → concept e verifiche → simulazione → dati di produzione → analisi e ottimizzazione → piano di prove e report.

## Fase 0 — Specifica della prima versione

Definire utente principale, caso di riferimento, parco presse, output, priorità e criteri di accettazione. Chiarire prezzo di vendita, costo industriale obiettivo, costo dello stampo e modalità di ammortamento. Stabilire quali input sono obbligatori e quali possono essere assunti con indicazione esplicita.

Consegna: specifica concordata, glossario e registro delle decisioni. Uscita: per ogni funzione iniziale sono chiari input, risultato e verifica.

## Fase 1 — UX navigabile del percorso completo

Progettare viste per brief, pezzo, alternative, pressa, simulazione e dati. Mettere in evidenza origine dei risultati, informazioni mancanti e affidabilità. Permettere revisione delle proposte AI, confronto delle alternative, salvataggio delle configurazioni e consultazione dei dettagli.

Consegna: prototipo interattivo su un caso dimostrativo. Uscita: l'utente completa il percorso e comprende risultati e assunzioni; i valori illustrativi sono identificati come tali.

## Fase 2 — Base applicativa e contratto dei dati

Introdurre progetti, versioni di brief e configurazioni, unità di misura, materiali, presse, ausiliari, costi e requisiti. Gestire sia macchine possedute sia candidati da acquistare, distinguendo costi operativi e investimento aggiuntivo. Importare CSV/Excel con anteprima e mappatura. Collegare segnali temporali e misure finali a ciclo, lotto, pezzo, stampo e macchina. Registrare provenienza e qualità dei dati.

Consegna: dati e progetti persistenti. Uscita: importazione, correzione, salvataggio e riapertura preservano associazioni e unità.

## Fase 3 — Prima proposta tecnico-economica utilizzabile

Confrontare configurazioni preliminari di cavità, ciclo, pressa e automazione. Calcolare capacità di pezzi conformi rispetto a ore disponibili, disponibilità, scarti e domanda. Esplicitare costi del materiale, macchina, personale, energia, manutenzione, investimenti e ammortamento evitando doppi conteggi. Analizzare sensibilità a domanda, tempo ciclo e scarti. L'agente propone alternative e usa strumenti di calcolo per confrontarle.

Consegna: report esportabile con alternative, vincoli, costi, ipotesi e informazioni mancanti; concept semplificato chiaramente indicato come preliminare. Uscita: formule riproducibili su casi di riferimento e nessuna proposta che ignori un vincolo noto.

## Fase 4 — Geometria e concept stampo

Importare STEP, verificare unità e integrità, misurare ingombro, volume e proprietà utili. Introdurre verifiche di spessori, sformi, sottosquadri e direzione di estrazione. Il primo caso deve includere carrelli: rappresentare direzioni, corse, sequenza di rientro, spazio disponibile e possibili interferenze. Generare concept parametrico per la famiglia di pezzi scelta. Verificare ingombri e compatibilità con la pressa. Animare apertura, movimento dei carrelli, espulsione e presa robot; distinguere animazione e verifica delle collisioni.

Consegna: concept 3D e analisi geometriche tracciabili. Uscita: misure confrontate con geometrie note e limiti del concept espliciti. Un concept non equivale a disegni esecutivi completi dello stampo.

## Fase 5 — Simulazione temporale verificata

Implementare modelli con ipotesi documentate per plastificazione, bilanci termici, raffreddamento e tempi del ciclo. Usare proprietà del materiale con fonte e campo di validità. Collegare timeline e stato simulato ai componenti 3D. Introdurre solutori dettagliati di riempimento, ritiro e deformazione secondo priorità e risorse. Verificare ogni modello prima di usare i suoi risultati per raccomandazioni.

Consegna: simulazione riproducibile sul caso di riferimento. Uscita: risultati confrontati con riferimenti pertinenti, stabilità numerica e campo di applicazione dichiarato. Dati simulati e misure reali conservano provenienza distinta.

## Fase 6 — Analisi e ottimizzazione su dati reali

Verificare e integrare PCA, aggiungere PLS, definire preprocessing e caratteristiche estratte dai segnali. Validare su gruppi di dati separati per lotto o campagna evitando contaminazioni. Visualizzare copertura delle condizioni, prestazioni e incertezza dove supportata. Cercare configurazioni entro vincoli tecnici e condizioni supportate dai dati; proporre esperimenti per ampliare la copertura. Conservare versione del modello e dataset associato.

Consegna: analisi, previsioni e confronto di configurazioni con piano di verifica. Uscita: dati reali sufficienti e validazione documentata. Dati dimostrativi permettono sviluppo e verifica del flusso software, senza dimostrare accuratezza in produzione.

## Fase 7 — Prodotto utilizzabile

Verificare il percorso completo, gestione degli errori, recupero dei progetti, accessi, trattamento dei file e credenziali AI secondo il contesto concordato. Preparare guida, installazione/deployment e casi di accettazione. Validare con utenti del ruolo scelto e un caso reale quando disponibile.

Consegna: applicazione rilasciabile con capacità e limiti definiti. Uscita: criteri concordati superati e output comprensibili, esportabili e tecnicamente revisionabili.

## Architettura proposta, da confermare

Prototipo attuale: interfaccia web in moduli JavaScript e Three.js 0.180.0, dipendenza fissata nel lockfile e servita localmente. Per il prodotto completo: backend Python con API, strumenti CAD e calcoli separati, archivio persistente e job asincroni per elaborazioni lunghe. L'eventuale passaggio a React/TypeScript resta da valutare. Un coordinatore AI userà strumenti specializzati con input/output strutturati. Più agenti saranno introdotti se migliorano un compito misurabile. Nessun fornitore AI è ancora scelto.

## Base esistente

La base di partenza contiene una libreria PCA, diagnostica, grafici e un notebook per Colab, senza suite implementata per la libreria. Il progetto ora aggiunge il prototipo web e test per geometria e browser; il workflow tecnico-economico resta da implementare. Durante onboarding è stato rilevato che lo spike sintetico continuo aumenta Q senza superare il limite Q: verificare e correggere la normalizzazione delle statistiche prima di usarle per raccomandazioni.

## Prossimo passo

Il prototipo in /prototype implementa brief, varianti, anteprima 3D parametrica con profilo arrotondato R8, viste assemblata/esplosa, volume geometrico, export OBJ/JSON, requisiti funzionali/tenuta, presse candidate e persistenza locale. Sedici test geometrici e il controllo funzionale in Chromium sono passati il 2026-10-15. Stampo, import STEP, calcoli economici, simulazioni di processo e agenti AI restano da sviluppare. Proseguire con ingombri e supporti interni, dettagli del connettore/cavo e dati termici; poi geometria degli agganci, tenute, schede materiale e concept stampo. Riepilogo del caso in REFERENCE_CASE.md.
