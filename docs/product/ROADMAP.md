# Roadmap della piattaforma — revisione 3

Data: 2026-10-15. La priorità recepisce il chiarimento: piattaforma online di fattibilità e simulazione dell'intero processo, con ingresso commerciale e conversazione trasversale. La demo di gusci è un esperimento precedente. Le fasi descrivono risultati e dipendenze, senza promettere durate non stimate.

Riferimenti: [specifica](SPECIFICATION.md), [architettura](ARCHITECTURE.md), [simulazione](SIMULATION.md), [backlog e accettazione](BACKLOG.md), [stato reale](IMPLEMENTATION_STATUS.md).

## Percorso del prodotto

Cliente/mercato/domanda → prodotto e vincoli → alternative di stampo/cella → processo dal granulo al nastro → capacità e costo → dati reali e ottimizzazione. Revisioni e scenari consentono di tornare sulle scelte a partire dai risultati.

La chat è disponibile in ogni modulo e opera sugli stessi dati delle proprietà. Software e modelli scelti per il percorso principale devono rispettare il requisito open source. Tutte le fasi includono provenienza, unità, dati mancanti e annullamento/versioni pertinenti.

## P0 — Specifica e criteri del sistema

**Consegna:** requisiti generici, flussi commerciali, mappa dei moduli, contratto delle dipendenze, livelli di simulazione e scenari di accettazione. **Stato:** documentazione di questa revisione; non equivale all'implementazione.

Il caso elettronico resta opzionale. Non sono fissati come default globali forma, materiale, spessore, agganci, grado IP o durata della commessa.

## P1 — Applicazione web e brief cliente conversazionale

**Consegna:** progetti vuoti, salvataggio server, allegati e revisioni; home Cliente e mercato; chat con primo modello open source integrato e proprietà contestuali. Raccolta domanda/unità commerciale, mercato, costi/prezzi/budget, produzione e vincoli. Correzioni e dati mancanti sono visibili.

**Dipendenze:** selezione e prova di un modello con licenza adatta, servizi applicativi e archivio. L'ambiente di sviluppo può eseguire lo stack prima della scelta dell'hosting.

**Uscita:** A01–A05 e A14 di [BACKLOG.md](BACKLOG.md). Due richieste commerciali su prodotti diversi rimangono indipendenti; riapertura e modifica da chat/proprietà convergono sugli stessi dati. Il sistema non genera valori di simulazione per campi mancanti.

Questa è la prossima tranche di implementazione. Prima del rilascio esterno, indirizzo HTTPS, persistenza e accessi saranno verificati su una distribuzione concreta; il pacchetto offline non è il canale finale del prodotto.

## P2 — Prodotto generico e strumenti geometrici

**Consegna:** importazione STEP e mesh, scala/riferimenti, componenti e requisiti estensibili. Misure e operazioni CAD supportate sono richiamabili da chat o proprietà. Foto/quote vengono conservate come riferimenti per ricostruzione assistita; generazione da immagini è un'attività separata con verifica metrica.

**Dipendenze:** P1 e prova del kernel su geometrie differenti. **Uscita:** A06–A07; scenari S01 e S02. Una flangia, una staffa e un involucro non vengono ricondotti forzatamente al template guscio. Le operazioni non supportate mantengono i requisiti senza produrre un risultato fittizio.

## P3 — Alternative di stampo e cella funzionale

**Consegna:** cavità e loro orientamenti, divisione/estrazione, ingombri stampo; pressa, robot cartesiano, organo di presa, nastro e ausiliari con riferimenti e corse reali. Proposte iniziali di circuiti di raffreddamento e controllo geometrico disponibile. Risorse esistenti e da acquistare sono confrontabili.

**Dipendenze:** P2 e dati di almeno un asset per categoria nel caso di prova, eventualmente illustrativi e marcati. **Uscita:** A08–A10; scenario S03. Una modifica del layout evidenzia conseguenze su accesso, posa e dati da ricalcolare. La prima proposta non richiede il dettaglio esecutivo di ogni componente commerciale.

## P4 — Prima simulazione completa L0 e confronto economico

**Consegna:** flusso materiale/condizionamento configurato, rifornimento, ciclo pressa/stampo, presa/trasferimento/deposito e nastro, con eventi, risorse e sovrapposizioni. Animazione 3D sincronizzata ai parametri; tempi dichiarati o ricavati da movimenti, con origine esplicita. Capacità per articolo e costo per unità commerciale derivano dallo scenario e dalle ipotesi economiche.

**Dipendenze:** P1–P3; ricetta e stati iniziali sufficienti. **Uscita:** A11–A13 e A15; scenari S03–S06. Il flusso è completo dal materiale in ingresso al pezzo sul nastro; il livello L0 non viene presentato come previsione fisica dettagliata di fusione, riempimento o deformazione.

Questa è la prima consegna integrata di studio tecnico-economico e ciclo animato. P1 è già utilizzabile per il brief; P4 chiude il primo percorso di simulazione semplificata.

## P5 — Modelli L1 di materiale, plastificazione e raffreddamento

**Consegna:** bilanci e correlazioni pertinenti per inventari/condizionamento, plastificazione e termica, con proprietà del grado e risorse. Confronto di circuiti e criteri di estrazione. Grafici e parametri sono collegati ai fenomeni effettivamente modellati.

**Dipendenze:** P4 e casi tecnici/dati per verificare ogni modello. **Uscita:** scenario S07 e criteri di confronto specifici definiti prima dell'implementazione. Fonti, campo di validità, errori e tempi di calcolo documentati. Le analisi dettagliate L2 entrano per fenomeno quando esiste una necessità e un solutore verificabile.

## P6 — Analisi e ottimizzazione su dati reali

**Consegna:** importazione dati di processo/misure qualità, associazione ciclo/lotto/articolo, preprocessing e modelli PCA/PLS versionati. Ottimizzazione vincolata con evidenza della copertura e piano di prova. Gli scenari simulati restano distinti dai dati misurati.

**Dipendenze:** dati reali pertinenti e correzione/verifica della libreria PCA di base. **Uscita:** A15 e scenari di dataset separati per campagne, con confronto rispetto a baseline e criteri concordati sul target.

## P7 — Verifica e rilascio online

**Consegna:** percorso completo verificato, salvataggi/ripristino, gestione lavori, accessi, deployment ripetibile, guida e report esportabili. Hardware/hosting sono dimensionati in base a misure e carichi concordati.

**Uscita:** criteri applicabili del backlog superati; capacità disponibili, preliminari e non supportate sono comprensibili. Verifica su casi diversi e almeno un caso reale quando disponibile. Una prima installazione di prova può precedere P7; non implica completamento di tutti i moduli.

## Trattamento delle decisioni aperte

Provider/dominio, numero di utenti, hardware AI e livello fisico per i primi casi vengono definiti quando cambiano una scelta concreta. Non servono altre domande sulle dimensioni del guscio per iniziare P1. Dettagli di ciascun prodotto, materiale, stampo e impianto sono informazioni dei singoli progetti.
