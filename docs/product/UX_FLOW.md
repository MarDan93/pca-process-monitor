# Primo flusso UX — bozza di lavoro

Destinatario confermato: progettista di stampi. Caso: due gusci estetici per elettronica da interno, assieme 120 × 80 × 35 mm, altezze iniziali uguali e raggio esterno R8. Sei agganci, tre per lato lungo, smontabili con attrezzo, obiettivo 1.000 cicli. Faccia frontale e laterali lucide con requisiti estetici elevati. Ingresso STEP o creazione parametrica guidata. Confronto presse esistenti e da acquistare. Prima consegna: concept stampo 3D, confronto costi e compatibilità pressa.

Il prototipo /prototype implementa raccolta brief, pezzo/materiale, varianti di spessore, anteprima 3D parametrica del pezzo, presse candidate e riepilogo con export JSON/OBJ. Le alternative 1,5 / 2 / 2,5 mm restano distinte dallo spessore finale. Sono disponibili volume geometrico, rotazione, viste standard, esploso e trasparenza; non sono risultati di simulazione fisica. Le altre viste descritte sotto restano in progettazione.

## Principio

Il progetto conserva un brief strutturato che può essere compilato direttamente o tramite conversazione con l'agente. La conversazione non è l'unico luogo in cui restano i requisiti: campi, fonti, ipotesi e revisioni devono essere consultabili e modificabili. L'agente pone domande contestuali, iniziando da ciò che cambia le scelte di stampo e pressa.

## Struttura dello spazio di lavoro

- Navigazione per progetto e fase: brief, pezzo, alternative, stampo/pressa, simulazione, dati/ottimizzazione, report.
- Area centrale per geometria 3D, tabelle di confronto o grafici secondo la fase.
- Pannello contestuale con proprietà selezionate, criticità, dati mancanti e contributo dell'agente.
- Riepilogo persistente di versione del progetto, stato delle verifiche e informazioni ancora necessarie.

Non affidare significato al solo colore: accompagnare stati e criticità con etichette e spiegazioni. Mostrare unità e provenienza accanto ai valori tecnici ed economici.

## 1. Avvio e brief cliente

L'utente crea il progetto e descrive richiesta e funzione del prodotto. Il sistema struttura quantità annua, lotti, durata della commessa, qualità, costo industriale obiettivo, prezzo di vendita e budget. Segnala informazioni mancanti e distingue dati forniti, estratti da file e ipotesi.

Risultato visibile: scheda sintetica della richiesta, allegati, requisiti vincolanti e domande aperte. La geometria può essere acquisita secondo la modalità che verrà scelta.

## 2. Analisi del pezzo

Visualizzare geometria e misure con selezione delle regioni. Collegare spessori, superfici, tolleranze, materiale e sottosquadri alle aree del pezzo quando possibile. Proporre direzioni di estrazione con motivazioni e indicare i movimenti laterali necessari. Non presentare proprietà del materiale dedotte dal solo colore o dalla geometria.

Risultato visibile: elenco delle osservazioni geometriche e delle alternative da approfondire. Valutazioni automatiche mostrano metodo e limiti.

## 3. Confronto delle alternative

Confrontare candidati per numero di cavità, alimentazione, carrelli, pressa, ausiliari e automazione. Distinguere macchina disponibile da macchina da acquistare. Mostrare capacità annua di pezzi conformi, costo unitario stimato, investimento, quota di ammortamento, tempo ciclo, requisiti mancanti e criticità.

L'utente può cambiare priorità e ipotesi e osservare come varia il confronto. Ogni stima conserva il dettaglio dei costi, le fonti e la versione. Le alternative non ancora verificabili restano identificabili come preliminari.

## 4. Concept stampo e pressa

Mostrare componenti e movimenti: parti fisse/mobili, carrelli, estrazione e robot. Collegare la selezione 3D alle caratteristiche e ai vincoli. Rendere visibili corse, sequenze, ingombri e compatibilità con i candidati pressa. Separare stato delle verifiche geometriche, cinematiche e di processo.

Le proposte dell'agente devono poter essere confrontate con la configurazione precedente senza perdere le scelte dell'utente.

## 5. Simulazione e verifica

Timeline con avvio, pausa, avanzamento per fase e velocità di riproduzione. Stato dei componenti sincronizzato ai risultati realmente calcolati. Grafici con unità, limiti, modello e fonte dei parametri. L'animazione deve distinguere movimenti configurati da campi fisici calcolati.

Risultato visibile: scenari confrontabili, ipotesi e criticità associate a momento e componente.

## 6. Dati reali e ottimizzazione

Importazione guidata con anteprima, mappatura, ID ciclo e unità. Collegare misure del pezzo ai cicli e al contesto. Mostrare qualità e copertura del dataset prima dell'addestramento. Per PCA e PLS permettere approfondimento tecnico e una spiegazione orientata alle decisioni. Ogni configurazione proposta conserva obiettivi, vincoli, versione del modello e piano delle prove.

## 7. Consegna

Raccogliere brief, configurazione scelta, confronto delle alternative, concept, costi, ipotesi, verifiche eseguite e questioni tecniche aperte. Formati di export e contenuto della prima consegna da concordare.

## Verifiche UX da definire sul prototipo

- Un progettista ricostruisce il brief e riconosce le ipotesi senza rileggere la conversazione.
- Comprende perché una pressa o una soluzione con carrelli è proposta o esclusa.
- Cambia volumi e tariffe e ritrova le conseguenze nei costi e nella capacità.
- Riconosce differenza fra dati reali, stime, proposte AI e risultati verificati.
- Confronta revisioni ed esporta un risultato revisionabile.

Queste sono ipotesi di accettazione del prodotto. Il prototipo implementato verifica raccolta e navigazione dei requisiti e geometria semplificata dei gusci. Confronto economico, CAD dello stampo e analisi dei risultati saranno sviluppati nelle fasi successive.
