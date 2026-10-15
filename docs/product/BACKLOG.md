# Backlog e criteri di accettazione — revisione 3

Stato: pianificato, 2026-10-15. Questi sono criteri da verificare nell'applicazione futura, non test già passati. Priorità e dipendenze seguono [ROADMAP.md](ROADMAP.md).

## Lavori nell'ordine di sviluppo

| ID | Lavoro | Dipendenza | Esito osservabile |
| --- | --- | --- | --- |
| B01 | Modello generico di commessa, prodotti/requisiti e unità commerciali | Specifica | Progetto vuoto e scenari indipendenti da una forma |
| B02 | API, archivio server, allegati, revisioni e operazioni | B01 | Salvataggio/riapertura e modifiche versionate |
| B03 | Home Cliente e mercato, chat principale e proprietà contestuali | B01–B02 | Brief commerciale completo senza passare da un editor geometrico |
| B04 | Prima inferenza open source e strumenti sul brief | B02–B03 | Conversazione reale, correzioni e fonti; modello dichiarato |
| B05 | Import CAD/mesh, riferimenti e requisiti geometrici estensibili | B02, B04 | Prodotti differenti e misure con unità |
| B06 | Alternative di stampo, cavità/estrazione e raffreddamenti geometrici | B05 | Concept collegato a domanda e prodotto |
| B07 | Cella con pressa, robot, presa, nastro e ausiliari | B05–B06 | Pose e assi espliciti, controlli di accesso/compatibilità disponibili |
| B08 | Motore eventi, bilanci di inventario e ricette L0 | B06–B07 | Dal materiale in ingresso al deposito, con attese e sovrapposizioni |
| B09 | Animazione e grafici sincronizzati, analisi delle pose | B08 | Timeline riproducibile e spiegazione dei vincoli |
| B10 | Capacità/costi e confronto di scenari | B01, B08 | Costo per unità venduta e capacità per articolo senza doppi conteggi |
| B11 | Modelli L1 e verifica termica/plastificazione | B08–B09 e riferimenti tecnici | Stime confrontate con casi noti e limiti dichiarati |
| B12 | Dati reali, PCA/PLS e ottimizzazione vincolata | B02, B10 e dataset | Previsioni validate e prove proposte entro vincoli |
| B13 | Distribuzione online, accessi e recupero dei dati | B02; ampliamento progressivo | Installazione HTTPS raggiungibile e dati recuperabili |

B13 abilita un'installazione di prova già con il primo percorso B01–B04; non si attende l'implementazione di tutta la fisica per utilizzare il brief online.

## Criteri di accettazione

| ID | Dato / azione | Esito richiesto |
| --- | --- | --- |
| A01 | Creazione nuova commessa | Nessun guscio, materiale, IP, quantità o durata impliciti; esempi opzionali marcati |
| A02 | Descrizione di domanda, mercato, prezzo, costo e budget | Dati separati e con unità; ambiguità sul costo e sull'unità venduta vengono chiarite |
| A03 | Correzione via chat e poi tramite proprietà | Stesso valore/versione nel progetto; fonte e annullamento disponibili |
| A04 | Riapertura e aggiornamenti concorrenti | Dati server conservati; nessuna sovrascrittura silenziosa di una revisione più recente |
| A05 | Mancanza di dati necessari | Sono indicati requisito e calcolo impedito, mentre il resto del brief resta utilizzabile |
| A06 | Import di flangia, staffa e involucro | Geometria/unità/feature proprie mantenute; nessun campo PCB/agganci obbligatorio globale |
| A07 | Foto senza scala e STEP/mesh con unità mancanti | Nessuna misura metrica dichiarata verificata; richiesta dei dati necessari e distinzione riferimento/mesh/solido |
| A08 | Cambio cavità o orientamento nello stampo | Nuova revisione e verifiche dipendenti da ricalcolare per presa, traiettoria, ciclo e costo |
| A09 | Robot XYZ senza polso e deposito con ribaltamento richiesto | Posa irraggiungibile motivata; nessuna rotazione aggiunta implicitamente all'animazione |
| A10 | Circuito proposto che interseca un estrattore nel modello disponibile | Conflitto geometrico segnalato con oggetti interessati; nessuna validazione termica dedotta dall'assenza di collisioni |
| A11 | Replay, pausa, passo e cambio velocità grafica | Stessi tempi simulati, log e pose agli eventi; soltanto il tempo di visione cambia |
| A12 | Raffreddamento/dosatura/trasferimento compatibili in parallelo | Sovrapposizioni rispettate; cadenza misurata dagli eventi, senza sommare tutte le durate |
| A13 | Presa e rilascio multicavità, nastro in moto | Identità/cavità e posa di ogni pezzo conservate; passaggio di riferimento senza salti |
| A14 | Modello AI indisponibile o operazione non supportata | Stato reale esposto; dati conservati; nessun parser o risultato fittizio etichettato come AI |
| A15 | Confronto economico o previsione da dati reali | Fonti, unità commerciale, versione input/modello e campo di validità presenti; mancanze e risultati da ricalcolare visibili |

## Scenari di verifica trasversali

### S01 — Nuova richiesta commerciale generica

Eseguire separatamente una commessa per flangia e una per staffa; il guscio elettronico è un terzo caso opzionale. Fornire nella chat quantità, mercato e obiettivo economico, quindi correggere quantità da proprietà e dalla chat. Riaprire i progetti. Verificare indipendenza, provenienza e assenza di requisiti del guscio importati negli altri articoli. Dati degli scenari sono illustrativi e non diventano default.

### S02 — Stampo famiglia e unità venduta

Definire un assieme che richiede due articoli e una disposizione cavità non bilanciata rispetto alla distinta. Verificare che domanda, capacità e costo siano espressi per articolo e per assieme conforme. Non basta sommare cavità per dichiarare la capacità vendibile. Cambiare domanda deve invalidare il confronto economico pertinente.

### S03 — Orientamento dal prelievo al nastro

Configurare uno stampo multicavità, prese e un robot XYZ privo di rotazione; richiedere un deposito ribaltato. Verificare rifiuto motivato e alternative. In una variante aggiungere un polso realmente configurato o modificare stampo/presa. Verificare continuità delle pose e limiti di corsa al cambio di supporto; metodo e limiti della verifica collisioni devono essere visibili.

### S04 — Impianto vuoto e materiale già pronto

Confrontare avvio con essiccazione richiesta e inventari vuoti contro avvio con quantità/età del materiale già condizionato note. L'iniezione attende dose e materiale idoneo nel primo scenario. Verificare conservazione della massa, nessun inventario negativo e identità dei lotti. Non si assume che il tempo nominale di residenza certifichi la condizione di ogni porzione.

### S05 — Attività sovrapposte e nastro bloccato

Configurare un caso in cui dosatura e raffreddamento si sovrappongono e il robot può depositare durante il ciclo successivo. Verificare cadenza dagli eventi, uso delle risorse e conteggio dei pezzi. Bloccare la disponibilità sul nastro: l'attesa si propaga secondo le dipendenze e non produce compenetrazioni o duplicazioni di pezzi.

### S06 — Revisione, costi e replay

Eseguire uno scenario, rivedere una corsa o un tempo, poi confrontare i risultati. Il vecchio run mantiene input e tempi originali; il nuovo usa la revisione nuova. Tariffa inclusiva di energia o ammortamento non somma nuovamente quelle voci. La velocità di playback non altera capacità o costo.

### S07 — Raffreddamenti e modelli ridotti

Confrontare un percorso che interseca una parte vincolata con uno geometricamente ammissibile secondo il modello. Valutare termica/idraulica soltanto se i dati sono sufficienti. Il secondo circuito non è automaticamente ottimale o validato fisicamente. Ogni modello L1 ha un caso di riferimento, tolleranze motivate e analisi del dominio; soglie numeriche da definire prima di implementarlo.

## Condizione per dichiarare una consegna pronta

Per la tranche indicata devono essere elencati criteri eseguiti/passati/falliti/non eseguiti, input e versioni, limiti e risultati riproducibili. Una schermata con dati illustrativi non dimostra che i motori sottostanti siano implementati. La validazione ingegneristica richiede evidenze tecniche specifiche oltre ai controlli del software.
