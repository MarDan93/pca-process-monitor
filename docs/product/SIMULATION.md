# Specifica della simulazione: dal granulo al nastro

Proposta tecnica per M03–M05, revisione 3 del 2026-10-15. Descrive modelli da implementare e verificare; non documenta un motore già disponibile.

## Domande a cui rispondere

1. Il materiale arriva in quantità, condizioni e tempi sufficienti per la pressa?
2. Quali operazioni determinano il ciclo e quali possono sovrapporsi?
3. La geometria dello stampo consente apertura, estrazione, accesso del robot e orientamento richiesto sul nastro?
4. Quali assi, corse e pose servono, e quali alternative di stampo/cella rimuovono un vincolo?
5. Come cambiano tempi, capacità e costi quando variano materiale, alimentazione, raffreddamento o movimenti?
6. Quali risultati sono stime preliminari e quali sono stati confrontati con dati tecnici o prove reali?

## Livelli di modellazione

| Livello | Contenuto | Risultati ammessi |
| --- | --- | --- |
| L0 — Sequenza e cinematica | Geometrie funzionali, eventi, risorse, tempi configurati o calcolati dai movimenti | Timeline, ingombri, pose, corse, attese, capacità di uno scenario; animazione dei movimenti |
| L1 — Processo ridotto | Inventari e flussi, correlazioni documentate, bilanci di massa/energia, modelli concentrati o 1D | Evoluzioni e stime entro le ipotesi/proprietà disponibili, con confronto su riferimenti |
| L2 — Analisi fisica dettagliata | Solutori e discretizzazioni adatti per riempimento, termica, ritiro/deformazione o interazioni specifiche | Campi fisici soltanto per le analisi effettivamente calcolate e verificate |

I livelli sono assegnati per fenomeno, non all'intero progetto: una stessa esecuzione può avere cinematica verificata e raffreddamento solo configurato. La prima simulazione completa usa L0 e introduce L1 per singoli fenomeni verificati. Accuratezza, limiti e tempi di calcolo vanno misurati sui casi disponibili prima di promettere simulazione fisica dettagliata in tempo reale.

## Fasi, parametri e rappresentazione

| Fase/risorsa | Input e stato da rappresentare | Risultati e grafica |
| --- | --- | --- |
| Materiale in ingresso | Grado, lotto, composizione, eventuale rimacinato, massa, temperatura, umidità quando pertinente | Identità e disponibilità del lotto; flusso di materiale simbolico |
| Essiccazione eventuale | Capacità, carico, tempi/età del materiale, temperatura, condizioni dell'aria, umidità iniziale e obiettivo | Inventario condizionato, attese, consumo se modellato, andamento di temperatura/umidità |
| Trasporto | Lunghezza/percorso, portata o massa per carico, latenza, modalità ciclica/continua, capacità | Arrivi, ritardi, inventari e percorsi animati |
| Tramoggia/alimentazione | Capacità e livello iniziale, soglie di ricarica, portate, origine del materiale | Livello nel tempo, ricariche e rischio di alimentazione insufficiente |
| Plastificazione/dosatura | Vite/cilindro, diametro e geometria disponibili, zone termiche, giri, contropressione, corsa/dose, materiale e tempo di residenza | Massa disponibile, avanzamento vite, stati solidi/fusi e temperature solo secondo il modello scelto |
| Iniezione | Profilo velocità/portata, limite di pressione, dose, geometria di alimentazione/cavità, viscosità e condizioni termiche | Tempo e stato di riempimento; il fronte spaziale richiede un solutore adeguato |
| Mantenimento | Profilo pressione/tempo, commutazione, cuscino, condizioni di chiusura del punto di iniezione se modellate | Ricetta applicata, durata e grandezze effettivamente calcolate |
| Raffreddamento/termoregolazione | Geometria pezzo/stampo/circuiti, proprietà termiche, fluido, portata, temperature e criterio di estrazione | Stato termico configurato/stimato/calcolato; circuiti e direzione dei flussi |
| Apertura e movimenti stampo | Corse/profili, divisione, carrelli, posizioni di finecorsa, dipendenze | Posizioni, tempi e volumi di ingombro con esiti delle verifiche disponibili |
| Estrazione e presa | Estrattori, direzione/corsa, sequenza, punti presa, organo di presa, conferma della presa | Distacco e trasferimento di appartenenza del pezzo; vincoli di accesso |
| Robot e trasferimento | Assi realmente presenti, limiti, velocità/accelerazioni, massa/capacità, traiettorie, pose e tempi di presa | Tempo di movimento, attese, pose raggiungibili e interferenze verificate |
| Deposito e nastro | Posa richiesta, zona disponibile, passo/spaziatura, velocità, sensori/logica e accumulo | Identità e orientamento dei pezzi depositati, avanzamento e blocchi |

Unità fisiche esplicite. Pressione specifica del materiale, pressione idraulica e pressione in cavità sono grandezze distinte. Una conversione richiede i dati della macchina. Le proprietà di famiglia del polimero non sostituiscono grado commerciale e coefficienti necessari al modello.

## Due scale temporali e condizioni iniziali

Il sistema segue sia il flusso materiale (carichi, essiccazione, residenza e rifornimenti) sia i cicli ripetuti della cella. La vista non rappresenta il moto di ogni granulo; particelle/colori sono una visualizzazione del modello aggregato.

La prima implementazione usa lotti/porzioni di massa con origine e stato di condizionamento. L'età iniziale del materiale in essiccatore e tramoggia è parte dello scenario. «Impianto vuoto» e «impianto già alimentato con materiale idoneo» producono transitori differenti.

Un modello ideale FIFO o miscelato deve essere dichiarato. Il rapporto massa/portata fornisce un tempo nominale di residenza, non garantisce da solo che ogni porzione abbia soddisfatto il tempo minimo di essiccazione. Il bisogno di condizionamento deriva dalle specifiche del grado e dalle condizioni iniziali.

Per un inventario: variazione della massa = massa entrata − massa uscita. Bilanci e disponibilità impediscono inventari negativi e dosi prodotte senza materiale. Scarti e canali escono dal bilancio con destinazione dichiarata; un eventuale riciclo ha percorso, limiti e ritardo propri.

Per L1 della plastificazione considerare separatamente riscaldamento dalle zone, contributo meccanico, perdite e trasporto; termica e fusione dipendono dalle proprietà disponibili, inclusi fenomeni pertinenti ai semicristallini. Correlazioni di essiccazione o reologia, ad esempio modelli di viscosità dipendenti da taglio/temperatura, vengono abilitate soltanto con coefficienti e campo di validità documentati.

## Eventi, dipendenze e tempo ciclo

Ogni operazione ha identificativo, precondizioni, risorse, durata/modello di durata, modifiche di stato e condizioni di completamento. Gli eventi sono ordinati su un unico tempo simulato; eventi simultanei usano un criterio deterministico documentato. La velocità di riproduzione grafica è indipendente.

Dipendenze di esempio, da adattare alla cella configurata:

- Avvio iniezione: stampo nella configurazione richiesta, unità pronta e dose/materiale disponibili.
- Raffreddamento: evolve dal contatto del fuso con lo stampo e può sovrapporsi a mantenimento e dosatura; non si aggiunge automaticamente come tempo interamente successivo.
- Dosatura successiva: parte quando consentito dalla ricetta e dalla macchina, con risorse disponibili.
- Apertura/prelievo: richiedono la fine delle fasi pertinenti e le posizioni compatibili di stampo, estrazione e robot.
- Trasferimento/deposito: possono proseguire mentre la pressa inizia un nuovo ciclo, se il robot è fuori dalle zone e risorse necessarie e le altre precondizioni sono soddisfatte.
- Nastro pieno o alimentazione insufficiente: creano attese e possono propagare un blocco a monte.

Il ciclo pressa è misurato fra due eventi di riferimento uguali consecutivi, ad esempio due inizi di chiusura. Il lead time del materiale/pezzo, il ciclo robot e la cadenza di deposito sono metriche diverse. La durata totale non è la somma di tutte le durate sovrapposte. Il motore identifica risorse occupate, attese e cammino che determina la cadenza.

## Posa del pezzo: cavità → robot → nastro

Ogni cella definisce un riferimento globale e riferimenti locali per pressa, semistampi, cavità, estrattori, robot, organo di presa, prodotto e nastro. Si memorizzano trasformazioni rigide con unità lineari esplicite e convenzione di orientamento; non si confondono viste di esploso e pose operative.

La posa globale di un pezzo è la composizione della posa del riferimento che lo sostiene e della trasformazione locale del pezzo. Al cambio di riferimento, la nuova trasformazione locale viene calcolata dalla posa globale corrente: il pezzo non salta né cambia orientamento al momento della presa o del rilascio.

Ogni pezzo/canale ha identità, articolo, cavità, ciclo e un unico riferimento di supporto corrente. Le transizioni possono essere cavità/estrattore → organo di presa → nastro, secondo la sequenza configurata. Una presa multicavità rappresenta le pose di ogni pezzo rispetto all'organo di presa.

Per un robot cartesiano XYZ senza rotazione, una posa di deposito che richiede un ribaltamento non è raggiungibile con la sola traslazione. Il sistema deve motivare il vincolo e confrontare polso aggiuntivo, stazione di orientamento, diversa presa/layout o diversa disposizione/estrazione dello stampo. La proposta non cambia automaticamente le capacità del robot.

Le prime verifiche usano corse, inviluppi, distanze e campionamento/swept volumes secondo il metodo disponibile. Una traiettoria soltanto campionata conserva tale limite: non viene dichiarata priva di collisioni per ogni istante. La simulazione preliminare non è una validazione della sicurezza funzionale della cella.

## Modelli iniziali del movimento

In L0, tempi dichiarati dal costruttore o misurati hanno fonte esplicita. In assenza, un profilo trapezoidale/triangolare può stimare movimenti con partenza e arrivo a velocità zero. Per distanza d, velocità massima v e accelerazione simmetrica a: durata = 2√(d/a) se d ≤ v²/a; altrimenti durata = d/v + v/a. Parametri devono essere positivi e il movimento entro corsa.

Assi sincronizzati possono condividere la durata massima dei singoli assi se il controllo lo consente; movimenti sequenziali hanno dipendenze separate. Jerk, traiettorie di raccordo, ritardi di presa, assestamento e limiti sotto carico vanno aggiunti quando richiesti o forniti. Il modello non sostituisce automaticamente i dati del robot reale.

## Circuiti di raffreddamento dello stampo

Ogni circuito conserva percorso 3D/rami, diametri/sezioni, ingressi/uscite, fluido, temperature, portata o condizioni di pressione, materiali e riferimenti geometrici. Le alternative possono essere convenzionali o conformali quando rappresentazione e realizzabilità sono supportate.

L'agente può proporre zone da raffreddare e alternative di percorso. Gli strumenti geometrici controllano intersezioni, accessibilità e distanze rispetto a cavità, superfici, inserti, fissaggi, carrelli ed estrattori secondo i vincoli dello scenario. Distanze e diametri non hanno un valore universale imposto a ogni stampo.

Per L1, un modello termico concentrato/rete di resistenze usa masse, capacità termiche, scambi e proprietà con fonte. Una rete idraulica richiede proprietà del fluido, geometrie e correlazioni applicabili per perdite e scambio. Se la portata è imposta, la pressione richiesta può essere un risultato; se è imposta la pressione disponibile, la portata va risolta. Non si impongono entrambe come dati indipendenti incoerenti.

Mostrare tempo/criterio di estrazione stimato, uniformità per la discretizzazione disponibile e sensibilità dei candidati. Hotspot locali, tensioni, deformazione e prestazioni dettagliate richiedono i rispettivi modelli: una temperatura media non diventa una mappa termica 3D interpolata senza fondamento.

## Capacità, costo e output dell'esecuzione

Conservare snapshot/revisione degli input, versioni dei modelli, condizioni iniziali, log degli eventi, stati/trasformazioni, segnali con unità, bilanci, metriche, ipotesi e verifiche. Un'esecuzione interrotta rimane riconoscibile come parziale.

La capacità deriva da pezzi effettivamente prodotti/conformi nello scenario o, per una stima stabile, da tempo produttivo, cadenza, cavità attive e resa. Perdite già comprese nei tempi o negli eventi non vengono moltiplicate nuovamente con fattori OEE. Il tempo di avvio si tiene distinto dal regime.

Per stampi famiglia, confrontare produzione per articolo con distinta e domanda; il numero totale di cavità non basta a calcolare gli assiemi vendibili. Il confronto economico distingue unità commerciale, materiale/canali/scarti, energia, tariffe, personale, investimenti e criteri di allocazione.

## Verifiche richieste

I criteri S01–S07 e A01–A15 sono in [BACKLOG.md](BACKLOG.md). Prima di introdurre L1/L2, ogni modello deve avere fonte/equazioni, unità, input necessari, dominio, caso di riferimento e criterio di confronto. La documentazione può essere completata adesso; accuratezza numerica e prestazioni saranno dimostrate con l'implementazione.
