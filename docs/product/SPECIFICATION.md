# Specifica della piattaforma — revisione 3

Data: 2026-10-15. Requisiti aggiornati dopo il chiarimento sull'intero sistema. Questo documento descrive il prodotto da costruire. Le funzionalità della demo esistente sono elencate separatamente in [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).

## Scopo e confini

Piattaforma online per studiare fattibilità commerciale e tecnica dello stampaggio a iniezione, configurare prodotto, stampo e cella e simulare il percorso dal granulo al pezzo sul nastro. L'utente confronta alternative prima di investire e prepara verifiche tecniche su ipotesi tracciabili. Il ruolo principale già indicato è il progettista di stampi; il brief deve accogliere anche informazioni commerciali e produttive del cliente.

Il progetto può riguardare prodotti differenti. La geometria può essere descritta, importata o ricostruita con assistenza da immagini e misure. La copertura della generazione geometrica cresce per operazioni supportate: accettare un prodotto generico non significa promettere la generazione o la simulazione accurata di qualsiasi forma con qualsiasi dato.

La modellazione produce rappresentazioni sufficienti alle decisioni richieste. L'obiettivo comprende orientamenti, corse, ingombri, sequenze, raffreddamenti e parametri; la documentazione esecutiva completa di uno stampo e la programmazione certificata della macchina restano fuori dalla prima versione.

## Requisiti trasversali

- Fruizione dal browser; progetti, allegati e revisioni persistenti sul server. La demo HTML resta un artefatto di sviluppo.
- Conversazione come ingresso principale in ogni modulo. Proprietà e campi strutturati sono una modalità contestuale di lettura/correzione degli stessi dati.
- Un nuovo progetto parte dalla richiesta del cliente, senza geometria, materiale, quantità, vita commessa o prezzo impliciti. Esempi e template si caricano su scelta esplicita e mantengono origine dimostrativa.
- Software, grafica, strumenti di calcolo e integrazione AI basati su componenti open source. Il modello AI e la relativa licenza saranno selezionati esplicitamente; accesso ai pesi e licenza open source non sono sinonimi.
- Ogni dato distingue valore fornito, estratto, assunto, stimato, simulato o misurato, con fonte, unità, revisione e stato delle verifiche.
- Un dato assente resta assente. Può impedire una specifica valutazione senza impedire la raccolta del resto del progetto.
- Le modifiche aggiornano le dipendenze: risultati su revisioni precedenti restano consultabili e sono segnalati come da ricalcolare.

## M01 — Cliente, mercato e fattibilità commerciale

È il punto di ingresso del progetto. La chat raccoglie funzione e mercato del prodotto, destinatari, requisiti applicabili, obiettivi economici e vincoli. Non richiede subito dati che non cambiano la decisione corrente.

| Gruppo | Informazioni da poter descrivere | Uso nei moduli successivi |
| --- | --- | --- |
| Richiesta | Cliente, RFQ, articolo/revisione, funzione, mercato, applicazione, area di vendita | Requisiti tecnici e criteri di accettazione |
| Domanda | Quantità annue per scenario/anno, lotti, stagionalità, crescita, ricambi, scadenze | Cavità, numero di stampi/celle, capacità e servizio |
| Unità commerciale | Pezzo, kit o assieme; distinta e quantità di ciascun componente | Conversione della domanda e costi confrontabili |
| Economia | Prezzo vendita, valuta, costo industriale obiettivo oppure esplorativo, margine richiesto | Alternative ammissibili e sensibilità |
| Investimenti | Budget separati per stampo, pressa, automazione e ausiliari; titolarità e vita attesa | Acquisto, ammortamento e confronto con risorse esistenti |
| Produzione | Stabilimento, turni/ore, cambi produzione, disponibilità, scarti e vincoli di capacità | Produzione conforme e lead time |
| Accettazione | Qualità funzionale/estetica, tolleranze, ambiente, prove e documenti richiesti | Vincoli sul prodotto e verifica finale |

Quantità annua libera, senza tetto commerciale prefissato; assenza di quantità e domanda illimitata non sono equivalenti. Durata e valuta sono dati di progetto. Il prezzo di vendita non sostituisce il costo industriale. Una percentuale di margine deve indicare la base di calcolo.

Output: brief strutturato, fonti/allegati, domande mancanti ordinate per impatto, scenari di domanda e obiettivi. Testo originale e informazioni aggiuntive restano conservati: la tabella non limita ciò che il cliente può descrivere. La prima revisione può essere completa dal punto di vista commerciale e ancora incompleta per simulare.

## M02 — Prodotto

Descrizione libera e requisiti estensibili per uno o più articoli/componenti: funzione, geometria, dimensioni, materiale/grado, superfici, tolleranze, estetica, assemblaggio e caratteristiche speciali. Le proprietà specifiche appartengono al prodotto o alla feature interessata; non diventano campi obbligatori globali.

Ingressi: testo, file CAD/mesh, foto, schizzi e quote. Immagini concettuali possono aiutare l'esplorazione della forma. Una foto richiede scala nota e informazioni aggiuntive per ricostruzione metrica; interni, materiale e tolleranze non vengono inventati.

Output: geometria con sistema di riferimento, requisiti collegati a regioni/feature quando disponibili, osservazioni di stampabilità e dati mancanti. Un modello può essere un solido CAD, una mesh o un riferimento, con capacità di analisi esplicite. Geometrie diverse da un involucro devono mantenere le proprie caratteristiche.

## M03 — Stampo

Alternative per numero/disposizione delle cavità, piano e direzione di divisione, inserti, materiali, alimentazione, sfiati, carrelli/lifters, estrazione e circuiti di raffreddamento. Stampo monoimpronta, multicavità o famiglia richiedono rappresentazione distinta della produzione per articolo.

Ogni cavità associa prodotto, orientamento, posizione, origine locale e punto/direzione di estrazione. La scelta determina anche accesso del robot e orientamento del pezzo al prelievo. I raffreddamenti conservano percorso 3D, sezioni, connessioni, portata/fluido/temperature e verifiche disponibili rispetto a cavità, inserti, estrattori e strutture.

Output: concept modificabile e alternative confrontabili, ingombri, corse, vincoli sulla pressa/cella e stato delle verifiche. La proposta dei raffreddamenti usa geometria e modelli termici dichiarati, come dettagliato in [SIMULATION.md](SIMULATION.md).

## M04 — Cella: pressa, stampo, robot cartesiano, nastro e ausiliari

Configurazione di macchine già disponibili o candidate da acquistare. Modelli semplificati devono mantenere ingombri funzionali, corse, velocità/accelerazioni, capacità, riferimenti di installazione e punti di interfaccia.

La cella comprende pressa e unità di iniezione, stampo, robot cartesiano, organo di presa, nastro, essiccatore eventuale, alimentazione/trasporto materiale e termoregolazione. Le singole risorse sono opzionali secondo il processo; l'assenza di un essiccatore non implica che un materiale sia lavorabile senza condizionamento.

Output: layout 3D, montaggio, compatibilità per verifiche disponibili, traiettorie e accessibilità, prese e pose di deposito. Un robot cartesiano non acquisisce gradi di libertà rotativi inesistenti: un ribaltamento richiesto deve trovare un polso/attuatore configurato, una stazione ausiliaria o una diversa soluzione di stampo/layout.

## M05 — Processo temporale dal granulo al nastro

Materiale in ingresso → essiccazione/condizionamento eventuale → trasporto e tramoggia → alimentazione vite → plastificazione/dosatura → iniezione → mantenimento/raffreddamento → apertura e movimenti stampo → estrazione/prelievo → trasferimento → deposito → avanzamento sul nastro.

La sequenza è un grafo di dipendenze e risorse: attività indipendenti possono sovrapporsi. Essiccazione e alimentazione operano anche su tempi diversi dal singolo ciclo pressa. La simulazione distingue avviamento, stato iniziale dei serbatoi e funzionamento ripetuto.

Ogni fase collega rappresentazione 3D, stato, inizio/fine, parametri, grafici e fonte del calcolo. L'utente può riprodurre, fermare, avanzare per evento e confrontare scenari. Orientamento e identità di ciascun pezzo restano tracciati da cavità a nastro. I livelli di modellazione e relativi criteri sono definiti in [SIMULATION.md](SIMULATION.md).

## M06 — Economia, dati reali e ottimizzazione

Il confronto economico riceve domanda da M01, materiali/geometrie da M02, investimenti da M03/M04 e ciclo/capacità da M05. Restituisce costo per unità commerciale conforme, capacità per articolo, investimento, sensibilità e dati mancanti, evitando doppi conteggi di tariffa, energia, ammortamento e perdite.

PCA esplora variabilità, raggruppamenti e contributi senza attribuire automaticamente causalità. PLS prevede variabili target misurate a partire da condizioni e caratteristiche dichiarate. Dati reali dell'utente, identificativi ciclo/lotto, preprocessing, separazione di addestramento/validazione e copertura delle condizioni sono prerequisiti delle raccomandazioni produttive. L'ottimizzazione conserva vincoli tecnici e piano di prova delle configurazioni proposte.

## Contratto comune fra moduli

| Entità | Contenuto e collegamenti |
| --- | --- |
| Progetto e revisioni | Identità, cliente, valuta, unità, scenari e revisione immutabile di input |
| Brief e requisiti | Domanda, unità commerciale/distinta, mercato, obiettivi, vincoli e origine |
| Prodotti e feature | Geometria/allegati versionati, riferimenti, materiali e proprietà estensibili |
| Alternative stampo | Cavità collegate ai prodotti, attuatori, estrazione e circuiti |
| Cella e risorse | Asset, installazioni, trasformazioni, capacità, disponibilità e tariffe |
| Ricetta e sequenza | Parametri, unità, limiti, eventi, dipendenze, traiettorie e risorse |
| Esecuzione simulata | Snapshot degli input, versioni dei modelli, condizioni iniziali, eventi, segnali, pezzi e verifiche |
| Analisi economica/ML | Scenario o dataset/versione, metodo, risultati, campo di validità e dipendenze |
| Conversazione e operazioni | Richiesta originale, interpretazione strutturata, modifiche, fonti e annullamento |

Un riferimento fisico o geometrico usa un identificativo stabile; la posizione visualizzata di un oggetto non sostituisce la sua posa nel processo. Il vecchio export `schema_version: 4` descrive la demo e non è il contratto della piattaforma. Dettagli storici in [archive/DEMO_02_SPECIFICATION.md](archive/DEMO_02_SPECIFICATION.md).

## Prima tranche e verifica del prodotto

La prima tranche applicativa è il brief commerciale generico via chat e campi contestuali, con salvataggio online e progetti privi di dati dimostrativi impliciti. La prima tranche di simulazione collega un prodotto importato, uno stampo/cella semplificati e una sequenza parametrica completa. Casi di geometria differenti devono verificare l'estensibilità fin dall'inizio.

Requisiti e stato dell'implementazione sono separati. Criteri osservabili e ordine di sviluppo sono in [BACKLOG.md](BACKLOG.md) e [ROADMAP.md](ROADMAP.md).
