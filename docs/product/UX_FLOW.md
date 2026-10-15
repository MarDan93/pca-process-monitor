# Esperienza della piattaforma online

Specifica UX, revisione 3 del 2026-10-15. Il progettista parte dalla richiesta del cliente e costruisce scenari tecnico-economici di produzione. La geometria è una delle viste del progetto; la home iniziale mette in primo piano commessa, domanda, mercato e obiettivi.

## Avvio di un progetto

La home offre «Nuovo studio» e progetti esistenti. Esempi dimostrativi sono un'opzione separata. Un nuovo studio non contiene un guscio, una quantità o un materiale già scelti.

La prima domanda è aperta: «Che cosa chiede il cliente e quale decisione vuoi preparare?». È possibile rispondere a testo e allegare documenti, foto o file geometrici. L'assistente struttura il brief e pone poche domande mirate all'informazione che cambia la fattibilità: mercato/uso, quantità e unità commerciale, consegne e obiettivo economico.

Esempio illustrativo: «Il cliente vuole produrre staffe per elettrodomestici, 600.000 pezzi l'anno, obiettivo 0,40 euro, usando se possibile le presse esistenti». Il sistema registra quanto fornito e lascia aperti grado materiale, geometria, qualità, calendario e significato del costo. Non assume le caratteristiche di un contenitore elettronico.

## Uno spazio condiviso

- Testata: commessa, scenario/revisione, salvataggio server e stato dei lavori.
- Navigazione: Cliente e mercato; Prodotto; Stampo; Cella; Processo; Confronto e dati.
- Conversazione principale persistente con contesto del modulo o dell'oggetto selezionato.
- Area dei risultati: scheda commerciale, prodotto/stampo/cella 3D, timeline, grafici o confronto secondo il compito.
- Proprietà contestuali apribili per modificare valori, fonti, unità e vincoli; non una lunga procedura obbligatoria di moduli.
- Stato visibile: dati mancanti, ipotesi, risultati disponibili, verifiche eseguite e risultati da ricalcolare.

Il tono visivo è professionale, leggibile e moderno. Colore e animazione aiutano la lettura ma ogni stato ha anche un'etichetta. Il pannello di dettaglio non deve ridurre la conversazione a una funzione marginale.

## Percorso principale

| Passaggio | Azione dell'utente nella chat | Risultato visibile |
| --- | --- | --- |
| Cliente | Descrive domanda, mercato, prezzo/costo e vincoli | Brief sintetico con campi aggiornati e dati mancanti |
| Prodotto | Descrive, allega geometria o immagini/misure | Modello o riferimento con scala, proprietà e stato delle analisi |
| Stampo | Chiede alternative compatibili con domanda e prodotto | Layout cavità, estrazione, raffreddamenti e ragioni del confronto |
| Cella | Seleziona pressa/robot/nastro o descrive risorse disponibili | Layout e gradi di libertà, pose e compatibilità verificabili |
| Processo | Definisce ricetta e chiede di vedere dal materiale al deposito | Sequenza, timeline e stati dei componenti/materiale |
| Confronto | Varia volumi, layout, ciclo o ipotesi | Capacità, costi, criticità e risultati da ricalcolare |
| Dati reali | Carica dati e definisce target/obiettivi | Esplorazione PCA, previsione PLS e configurazioni da provare |

Il percorso consente di tornare a qualunque modulo mantenendo scenario e contesto. Le dipendenze bloccano soltanto le operazioni che non possono ancora produrre un risultato utilizzabile.

## Tre ingressi per il prodotto

**Testo:** l'agente ricava requisiti e operazioni supportate. Mostra la differenza rispetto alla revisione precedente, permette correzione/annullamento e conserva il dialogo originale. I campi e la chat usano le stesse operazioni di aggiornamento.

**File 3D:** il sistema identifica formato, unità, revisione, componenti e integrità disponibile. Unità mancanti vanno chiarite prima delle misure metriche. Una mesh non viene presentata come solido CAD verificato.

**Foto/schizzi:** l'interfaccia chiede quota nota e viste utili alla ricostruzione. Ipotesi e regioni non osservabili sono esplicite. Una forma generata a scopo illustrativo rimane distinguibile dalla geometria che alimenta le analisi.

## La simulazione come esperienza esplorabile

La vista Processo combina cella 3D, flusso materiale e timeline con tracce per essiccatore, alimentazione, vite, pressa/stampo, robot e nastro. Il flusso attraversa risorse reali o semplificate con collegamenti visibili.

Selezionare una fase evidenzia componenti e pezzi coinvolti e apre tempi, parametri, fonti e risultati. La chat accetta richieste come «Perché il robot aspetta?», «Mostra l'orientamento al deposito», «Confronta un'altra disposizione delle cavità» e «Cosa cambia se il trasporto materiale è più lento?», usando i dati della simulazione.

Controlli: avvio, pausa, passo per evento, riavvolgimento e velocità. Cambiare la velocità di riproduzione non modifica il tempo simulato. Durante il calcolo si mostrano avanzamento, annullamento e motivo di eventuali attese.

La posa desiderata sul nastro e le rotazioni del robot sono configurabili. Il sistema rende visibile se la posa è raggiungibile con gli assi disponibili; una diversa soluzione richiede un nuovo scenario. Percorsi, piani di separazione e circuiti di raffreddamento possono essere isolati visivamente.

## Dettagli e gestione delle revisioni

Da un valore si accede a unità, fonte e ipotesi; da un risultato alle condizioni che lo hanno prodotto. Cambiare dati non aggiorna silenziosamente una simulazione precedente. L'utente vede «risultato della revisione X, da ricalcolare per Y» e può confrontare entrambi.

Se un'operazione non è supportata, l'assistente conserva il requisito e spiega quale rappresentazione o dato permette di proseguire. In assenza di motore AI configurato l'applicazione espone la disponibilità reale e mantiene utilizzabili le proprietà; non etichetta un parser come agente AI.

## Riferimento GetcraftAI

Riferimento richiesto dall'utente per semplicità di accesso e interazione conversazionale con risultati visivi. La ricerca del sito candidato `https://getcraftai.com` non è stata possibile nell'ambiente: il proxy ha restituito 403. Non sono state verificate funzionalità, stack, licenze o prestazioni del servizio e non vengono usati come requisiti tecnici.

I criteri verificabili del nostro prodotto sono in [BACKLOG.md](BACKLOG.md). La demo 02 rimane una prova di alcune interazioni geometriche, descritta in [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).
