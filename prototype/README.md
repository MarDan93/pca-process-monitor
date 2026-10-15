# Mould Studio — workspace di modellazione e brief

Implementazione navigabile in italiano per raccolta dei requisiti e anteprima parametrica dei gusci. La grafica usa Three.js 0.180.0, fissato nel lockfile e servito localmente, senza CDN o chiamate AI. Non implementa ancora calcoli economici, analisi STEP, CAD dello stampo, simulazioni di processo o PCA/PLS.

La seconda demo mette il modello al centro, con albero dei componenti e pannello contestuale da descrizione, file 3D o foto. `description.js` estrae comandi locali limitati a quote/spessore/raggio/materiale/finitura; non usa un modello linguistico. La proposta viene controllata geometricamente prima di applicarla e può essere annullata. `mesh-import.js` visualizza OBJ/STL con unità esplicite e ingombri, senza dedurre volume, materiale o solidità; i file non sono caricati su servizi esterni. Le foto sono riferimenti locali, senza ricostruzione automatica.

Mesh e foto rimangono in memoria durante la sessione e vanno ricaricate dopo un riavvio. L'export JSON ne conserva solo i metadati. L'OBJ esportabile resta quello del guscio parametrico; l'esportazione è disabilitata mentre si osserva una mesh importata. STEP e l'agente AI richiedono i moduli indicati in [architettura](../docs/product/ARCHITECTURE.md).

## Demo senza installazioni

Il pacchetto in [demo](../demo/README.md) contiene un unico file HTML, un'anteprima e istruzioni in italiano. Dopo aver estratto lo ZIP, aprire `Progettazione-stampi.html` in un browser recente: si apre direttamente l'anteprima 3D. Three.js e CSS sono inclusi; non servono server, Node.js, Python o accessi a Internet per utilizzare la demo.

Per rigenerare il pacchetto dopo l'installazione delle dipendenze:

```bash
npm run build:standalone
npm run test:standalone
npm run package:demo
```

Il controllo usa Chromium con un profilo isolato: carica il singolo HTML via loopback e poi disconnette la rete durante le interazioni. Controlla anche l'assenza di richieste per risorse esterne. Il browser cloud impedisce la navigazione `file://` per policy: l'apertura diretta come file non è stata verificata in questo ambiente. La confezione ZIP viene verificata per integrità e uguaglianza dell'HTML con quello provato.

## Avvio locale per sviluppo

Nel checkout esistente `/workspace/pca-process-monitor`, entrare in `prototype`, poi installare con il lockfile:

```bash
npm ci
```

Sempre da `prototype`, avviare:

```bash
npm start
```

Servono Node.js/npm per le dipendenze e Python per il server statico. Usare la porta 4173 per il browser di sviluppo. Il rendering 3D richiede WebGL2; se non disponibile, le specifiche e l'export geometrico restano utilizzabili. Il pacchetto scaricabile non costituisce un sito web ospitato.

## Cosa si può provare

- Navigare fra brief cliente, pezzo/materiale, anteprima 3D, presse candidate e riepilogo.
- Compilare requisiti tecnici e commerciali; riconoscere quelli già definiti per il caso di riferimento.
- Inserire una quantità annua libera, usare una durata iniziale modificabile di 5 anni e scegliere fra costo esplorativo e obiettivo fissato.
- Registrare e modificare presse esistenti o da acquistare con unità esplicite.
- Impostare finitura e fissaggi; aggiungere/rimuovere varianti di spessore, distinte dallo spessore nominale finale.
- Raccogliere numero di schede, aperture, obiettivo IP, architettura termica e tenuta del connettore; questi requisiti compaiono anche nel riepilogo e nell'export JSON.
- Ruotare il guscio, cambiare vista, usare esploso/trasparenza e confrontare gli spessori senza fissare quello finale.
- Aggiornare dimensioni e ripartizione dell'altezza, visualizzando volume e ingombro geometrici.
- Scaricare i due gusci come componenti separati OBJ nella posizione assemblata. Le coordinate sono in mm per convenzione documentata; OBJ non impone un'unità di misura. La vista esplosa non modifica la geometria esportata.
- Vedere informazioni mancanti e completare il campo pertinente.
- Riaprire il progetto dopo un reload del browser.
- Esportare il brief JSON con unità, provenienza e stato della verifica tecnica.
- Aprire un esempio illustrativo e poi ripristinare il progetto conservato.

## Dati e persistenza

Il progetto è salvato nel `localStorage` del browser, con chiave `injection-moulding-brief-v1`. La posizione è locale al browser e all'origine di sviluppo; non esiste ancora un archivio server o la collaborazione fra utenti. L'export JSON è il modo disponibile per conservare una copia del brief fuori dal browser. L'importazione del JSON sarà implementata nella fase di persistenza applicativa.

Un progetto non leggibile viene conservato senza sovrascriverlo; il prototipo segnala che la sessione è in memoria. L'esempio richiede un salvataggio recuperabile del progetto corrente prima di sostituirlo.

Il formato esportato è ora versione 4. La migrazione dai formati 1, 2 e 3 conserva dati e note; uno spessore nominale già registrato viene mantenuto e proposto come candidato. I nuovi requisiti restano da definire nei progetti precedenti; il raggio precedente resta R0. Il comando di completamento del caso riempie solo i requisiti mancanti, senza sostituire scelte già registrate, incluso R0. Anche i backup precedenti usano la stessa migrazione.

## Limiti della prima geometria

Gusci a spessore uniforme con profilo arrotondato, inizialmente R8. Il profilo è triangolato con 24 segmenti per quarto di cerchio. Sei agganci, tre per lato lungo e obiettivo di 1.000 cicli, sono registrati come requisiti ma non ancora modellati/verificati. Raccordi fuori piano, sformi, ritiro, nervature, battute, sedi per l'attrezzo, alimentazione ed estrazione richiedono i moduli successivi. Il volume mostrato è quello della mesh semplificata, non una previsione di peso o processo. Colore e aspetto sono illustrativi.

Il caso richiede quattro schede 40 × 25 × 8 mm disposte due per due su un livello e IP65 anche con cavo collegato, con involucro chiuso, sfiato protetto per pressione e sportello sigillato sul connettore. Schede, sportello, aperture e guarnizioni non sono ancora modellati. IP65 e 1.000 cicli sono obiettivi non verificati; il prototipo non calcola ancora il raffreddamento.

## Controlli ripetibili

Da `prototype`:

```bash
npm test
```

Per il controllo completo nel browser:

```bash
npm run test:browser
```

Il secondo comando richiede Chromium e Node.js 22+; usa un profilo temporaneo e un server locale isolato, senza toccare i dati di un browser utente. È possibile indicare il percorso di Chromium con `CHROMIUM_BINARY`. Gli artefatti sono scritti in `.cache/ux` nella radice del repository.

## Verifica eseguita

Controllo funzionale in Chromium il 2026-10-13: compilazione/persistenza, modalità esplorativa senza costo prefissato, durata iniziale 5 anni, quantità libera anche oltre le fasce proposte, zero come valore di costo e passaggio a obiettivo fissato, rifiuto quantità negative con blocco navigazione, reload, coerenza altezza stampo minima/massima, macchine esistenti/da acquistare, modifica di una pressa senza duplicazione, download JSON effettivo, testo utente reso senza interpretazione HTML, apertura/ripristino esempio e layout mobile senza overflow orizzontale. Nessuna eccezione JavaScript durante il percorso verificato.

Questa verifica riguarda il prototipo del brief, non la correttezza ingegneristica dei moduli ancora da implementare.

Verifica aggiuntiva per varianti/versione 2: default lucido/agganci a scatto, tre spessori senza scelta finale implicita, aggiunta/rimozione, rifiuto duplicati e spessori negativi, riepilogo e download JSON del run corrente, persistenza dopo reload, migrazione di progetto e backup versione 1 conservando cliente/note/spessore, contenimento della tabella su mobile e assenza di eccezioni JavaScript.

Il 2026-10-15: `npm ci` e avvio `npm start` eseguiti con successo; 16 test geometrici passati, inclusi solidi chiusi/orientati, ingombri, volume verificato dalle triangolazioni, profili arrotondati, ripartizioni asimmetriche e indici OBJ. Controllo Chromium passato per rendering WebGL effettivo R8, variazione dello spessore e del volume, camere/esploso, download OBJ dei due gusci con raggio, export JSON dei requisiti funzionali con IP65 non verificato, blocco di geometria/export obsoleti, reload, migrazione del formato precedente conservando R0, layout mobile e assenza di eccezioni JavaScript.

Sempre il 2026-10-15: lo stesso percorso è passato sul singolo HTML con rete disconnessa durante le interazioni, nessuna richiesta di risorse esterne e partenza diretta dalla vista 3D. Per i reload il test ricollega il server di loopback per ricaricare l'HTML, poi disconnette nuovamente la rete. Anche il percorso di sviluppo è stato ricontrollato dopo la modifica dell'avvio.

Demo 02: 21 test automatici passati per geometria, comandi, conversioni di unità e parser OBJ/STL, compresi input non validi. Nel browser verificati preparazione/applicazione/annullamento dei comandi, rifiuto di geometria impossibile, caricamento/rimozione foto senza modifiche alle quote, importazione OBJ con scelta delle unità, trasferimento esplicito degli ingombri, conservazione del modello dopo un import fallito e layout mobile. Il percorso completo passa anche sul bundle singolo con rete disconnessa durante le interazioni.
