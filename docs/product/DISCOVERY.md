# Registro dei requisiti e delle decisioni

Aggiornamento: revisione 3 del 2026-10-15. Le risposte storiche restano conservate; i chiarimenti D44–D56 governano l'impostazione attuale. La [specifica](SPECIFICATION.md) descrive la piattaforma online generica e la [roadmap](ROADMAP.md) ordina le consegne.

## Chiarimento del perimetro

Il prodotto richiesto parte dalle esigenze commerciali del cliente, usa la chat come ingresso principale e integra modellazione prodotto, stampo, cella e simulazione dal granulo al nastro. Tutti i moduli devono integrare AI e componenti open source. La modellazione serve allo studio tecnico-economico e del processo; la piattaforma non è centrata sulla progettazione esecutiva CAD.

Le decisioni su dimensioni, finitura, materiali candidati, agganci, elettronica, IP e durata iniziale di cinque anni appartengono al caso dimostrativo. Il guscio è un caso opzionale: non impone forma, dati o valori iniziali ai nuovi progetti. Quantità liberamente configurabile, distinzione prezzo/costo e confronto tra risorse esistenti/da acquistare restano requisiti generali.

Le sezioni seguenti conservano il percorso storico. Le voci aperte non sono decisioni dell'utente e le proposte rimangono tali.

## Decisioni iniziali confermate

1. Utente principale della prima versione: progettista di stampi.
2. Caso iniziale: pezzo complesso con sottosquadri e carrelli. Il modello dimostrativo sarà creato nel progetto; famiglia e cinematismi da precisare.
3. Vincolo presse: parco esistente configurato dall'utente e nuove macchine da scegliere/acquistare, entrambi dalla prima versione.

## Decisioni successive confermate

4. Famiglia del pezzo dimostrativo: guscio estetico con fissaggi e sottosquadri.
5. Ingresso geometria: importazione STEP oppure creazione parametrica guidata.
6. Prima consegna utilizzabile: concept stampo 3D, confronto costi e compatibilità pressa.
7. Destinazione: dispositivo elettronico da interno.
8. Dimensioni esterne indicative: 120 × 80 × 35 mm; spessori e tolleranze da definire.
9. Materiali: confronto ABS e PC/ABS, esteso a PP, PE e copolimeri richiesti dall'utente. Famiglie/gradi da specificare.

## Decisioni commerciali confermate

10. Quantità annua libera, scelta dall'utente, senza fasce né limite commerciale predefinito. Un dato non specificato resta mancante e non permette una verifica della capacità; non si assume una domanda infinita.
11. Durata iniziale della commessa: 5 anni, modificabile nei progetti.
12. Costo industriale da far emergere dal confronto delle alternative, poi fissare come obiettivo. Prezzo di vendita e budget restano distinti.

## Dettagli del guscio confermati

13. Finitura lucida con requisiti estetici elevati. Superfici interessate e valori di accettazione da specificare.
14. Fissaggi tramite soli agganci a scatto. Forma, posizione e modalità di smontaggio da specificare.
15. Confrontare spessori nominali 1,5 / 2 / 2,5 mm. Nessuno è ancora scelto come spessore finale; ogni candidato richiede verifica per materiale.

## Geometria e uso degli agganci confermati

16. Due gusci abbinati, anteriore e posteriore.
17. Finitura lucida con requisiti estetici elevati su faccia frontale e pareti laterali.
18. Agganci smontabili con attrezzo senza danneggiare il guscio.
19. L'ingombro 120 × 80 × 35 mm si riferisce al prodotto assemblato completo.
20. Ripartizione iniziale dell'altezza 50% anteriore / 50% posteriore, modificabile; ciascuna metà è alta 17,5 mm nel caso iniziale.
21. Sei agganci a scatto, da dimensionare e posizionare.

## Dettagli degli agganci e del profilo confermati

22. Tre agganci per ciascun lato lungo.
23. Obiettivo di 1.000 cicli di montaggio/smontaggio; resistenza da verificare con materiale, geometria e prove pertinenti.
24. Raggio esterno iniziale degli angoli: 8 mm. Il modello attuale lo applica al profilo dei gusci; i raccordi fuori piano restano da progettare.

## Contenuto e protezione confermati

25. Contenuto: più schede elettroniche.
26. Aperture richieste inizialmente: connettore e ventilazione. La successiva decisione 28 precisa la ventilazione come sfiato protetto per compensare la pressione, senza feritoie aperte.
27. Obiettivo IP65, non ancora qualificato.
28. Involucro chiuso con sfiato protetto di compensazione della pressione; raffreddamento da valutare a involucro chiuso.
29. Quattro schede elettroniche, ingombri da definire.
30. Connettore dietro uno sportello sigillato.

## Condizioni d'uso e ingombri confermati

31. IP65 richiesto anche durante l'uso con cavo collegato: è necessaria una soluzione di tenuta per il cavo, oltre allo sportello.
32. Quattro schede disposte due per due su un unico livello; posizione parametrica.
33. Ingombro indicativo di ciascuna scheda 40 × 25 × 8 mm, con altezza comprensiva dei componenti.

## Prossimo approfondimento

Priorità attuale: implementare un brief commerciale generico con chat, proprietà contestuali e persistenza server. I dati di ogni pezzo, stampo o cella saranno raccolti nel relativo progetto. Per il caso opzionale del guscio rimangono aperti supporti interni, connettore/cavo, guarnizioni, dissipazione e verifica degli agganci; non bloccano lo sviluppo generale.

## Argomenti da affrontare in ordine

Le domande verranno presentate in piccoli gruppi. Le scelte successive dipenderanno dalle risposte precedenti.

1. Uso e output: chi decide, attività attuale, destinatario dei risultati, contenuto del report e della prima consegna utile.
2. Caso di riferimento: funzione del pezzo, dimensioni indicative, materiale, superfici, tolleranze, geometria e caratteristiche di estrazione.
3. Richiesta commerciale: quantità annua, lotti, vita commessa, consegne, costo industriale obiettivo, prezzo di vendita, budget e proprietà dello stampo.
4. Stabilimento: presse disponibili, dati e unità, ore e turni, disponibilità, ausiliari, robot, personale e vincoli.
5. Modello economico: tariffe, materiale e recupero sfridi, costi energetici, scarti, manutenzione, ammortamento, margini e sensibilità. Distinguere costi inclusi nella tariffa da costi aggiuntivi.
6. Alternative stampo: cavità, divisione, alimentazione, raffreddamento, materiali e componenti; priorità fra costo, qualità, durata e manutenzione.
7. CAD e risultati geometrici: formati, dimensione dei file, proprietà da misurare, limiti iniziali, export del concept e documentazione richiesta.
8. Simulazione: domande da risolvere, precisione, tempi di risposta, modelli, fonti dei dati materiali, verifiche e criteri di confronto.
9. Animazione e robot: sequenze, geometria, movimenti, tempi, collisioni, ingombri e livello di dettaglio.
10. Dati reali: formati e sorgenti, frequenza dei segnali, ID ciclo, allineamento temporale, qualità, lotti e misure del pezzo.
11. Analisi e ottimizzazione: obiettivi misurati, parametri modificabili, vincoli, copertura, validazione e verifica delle configurazioni proposte.
12. AI: compiti, fonti tecniche, spiegazioni, revisione delle proposte, gestione delle informazioni mancanti, fornitore e budget.
13. UX: percorso principale, lingua, dispositivi, modalità assistita e dettagli tecnici, confronto e gestione delle revisioni.
14. Distribuzione: uso personale o aziendale, utenti, archiviazione, accessi, deployment e gestione di dati cliente e credenziali.
15. Accettazione: casi reali/dimostrativi, correttezza, prestazioni, facilità d'uso, output e verifica tecnica.

## Regole del percorso

- Le informazioni tecniche e commerciali confermate non vengono richieste di nuovo senza motivo.
- Le ipotesi di sviluppo sono esplicite e modificabili; i dati mancanti non vengono inventati come misure reali.
- La prima versione segue un caso delimitato e un percorso completo, con estensioni successive.
- I modelli predittivi sulla produzione richiedono dati reali pertinenti e verifica delle prestazioni.
- L'agente presenta alternative con motivazioni e usa strumenti verificabili per geometria e calcoli.

## Registro delle decisioni

| ID | Decisione | Stato | Fonte |
| --- | --- | --- | --- |
| D01 | Stampaggio a iniezione | Confermato | Conversazione |
| D02 | Partenza da richiesta cliente tecnica e commerciale | Confermato | Conversazione |
| D03 | Volumi, costo e pressa influenzano il concept stampo | Confermato | Conversazione |
| D04 | Simulazione include plastificazione, ciclo e robot | Confermato | Conversazione |
| D05 | Modulo analisi/ottimizzazione alimentato da dati reali dell'utente | Confermato | Conversazione |
| D06 | UX professionale e integrazione di uno o più agenti AI | Confermato | Conversazione |
| D07 | Caso, CAD e dati reali non ancora disponibili | Confermato | Conversazione |
| D08 | Progettista di stampi come utente principale | Confermato | Risposta prima domanda |
| D09 | Primo caso complesso con sottosquadri e carrelli | Confermato | Risposta seconda domanda |
| D10 | Presse esistenti e da acquistare fin dalla prima versione | Confermato | Risposta terza domanda |
| D11 | Guscio estetico con fissaggi e sottosquadri | Confermato | Risposta quarta domanda |
| D12 | Importazione STEP oppure creazione parametrica guidata | Confermato | Risposta quinta domanda |
| D13 | Concept stampo 3D, confronto costi e compatibilità pressa | Confermato | Risposta sesta domanda |
| D14 | Guscio per dispositivo elettronico da interno | Confermato | Risposta settima domanda |
| D15 | Ingombro indicativo 120 × 80 × 35 mm | Confermato | Risposta ottava domanda |
| D16 | ABS, PC/ABS, PP, PE e copolimeri tra le alternative | Confermato | Risposta nona domanda |
| D17 | Quantità annua libera scelta dall'utente | Confermato | Risposta decima domanda |
| D18 | Durata iniziale 5 anni, modificabile | Confermato | Risposta undicesima domanda |
| D19 | Costo emergente dal confronto, poi obiettivo fissabile | Confermato | Risposta dodicesima domanda |
| D20 | Finitura lucida, requisiti estetici elevati | Confermato | Risposta tredicesima domanda |
| D21 | Solo agganci a scatto | Confermato | Risposta quattordicesima domanda |
| D22 | Confronto spessori 1,5 / 2 / 2,5 mm, nessuna scelta finale | Confermato | Risposta quindicesima domanda |
| D23 | Due gusci abbinati, anteriore e posteriore | Confermato | Risposta sedicesima domanda |
| D24 | Faccia frontale e pareti laterali estetiche | Confermato | Risposta diciassettesima domanda |
| D25 | Smontaggio con attrezzo senza danni | Confermato | Risposta diciottesima domanda |
| D26 | Ingombro 120 × 80 × 35 mm dell'assieme completo | Confermato | Risposta diciannovesima domanda |
| D27 | Altezza ripartita inizialmente 50% / 50% | Confermato | Risposta ventesima domanda |
| D28 | Sei agganci a scatto | Confermato | Risposta ventunesima domanda |
| D29 | Tre agganci per ciascun lato lungo | Confermato | Risposta ventiduesima domanda |
| D30 | Obiettivo 1.000 cicli di montaggio/smontaggio | Confermato | Risposta ventitreesima domanda |
| D31 | Raggio esterno iniziale 8 mm | Confermato | Risposta ventiquattresima domanda |
| D32 | Più schede elettroniche | Confermato | Risposta venticinquesima domanda |
| D33 | Aperture connettore/ventilazione, precisate da D35 | Confermato e precisato | Risposta ventiseiesima domanda |
| D34 | Obiettivo IP65, non qualificato | Confermato | Risposta ventisettesima domanda |
| D35 | Involucro chiuso e sfiato protetto per pressione | Confermato | Risposta ventottesima domanda |
| D36 | Quattro schede elettroniche | Confermato | Risposta ventinovesima domanda |
| D37 | Connettore dietro sportello sigillato | Confermato | Risposta trentesima domanda |
| D38 | Obiettivo IP65 anche con cavo collegato | Confermato | Risposta trentunesima domanda |
| D39 | Quattro schede due per due su un livello | Confermato | Risposta trentaduesima domanda |
| D40 | Ogni scheda con componenti: 40 × 25 × 8 mm | Confermato | Risposta trentatreesima domanda |
| D41 | UX professionale da software di modellazione, aspetto moderno e modello centrale | Richiesto | Feedback demo 01 |
| D42 | Creazione da dialogo, caricamento file 3D e acquisizione da foto | Richiesto per il prodotto completo | Feedback demo 01 |
| D43 | Percorso esplicito dalla creazione del pezzo alla progettazione dello stampo | Richiesto | Feedback demo 01 |
| D44 | Uso online come modalità preferita del prodotto | Confermato | Chiarimento dopo demo 02 |
| D45 | Prodotti generici, con descrizione flessibile; guscio solo dimostrativo | Confermato | Chiarimento dopo demo 02 |
| D46 | Piattaforma di fattibilità e processo, non centrata sulla progettazione CAD esecutiva | Confermato | Chiarimento dopo demo 02 |
| D47 | Priorità a cliente, mercato, quantità, prezzo e informazioni commerciali | Confermato | Chiarimento dopo demo 02 |
| D48 | Moduli integrati di prodotto, stampo e cella produttiva | Confermato | Chiarimento dopo demo 02 |
| D49 | Cella con pressa/stampo, robot cartesiano e nastro; orientamenti pezzo tracciati | Confermato | Chiarimento dopo demo 02 |
| D50 | Processo completo dal granulo, con essiccazione eventuale, a pezzo sul nastro | Confermato | Chiarimento dopo demo 02 |
| D51 | Animazione temporale con dettagli grafici e parametri di tutte le fasi | Confermato | Chiarimento dopo demo 02 |
| D52 | Modellare il posizionamento dei raffreddamenti nello stampo | Confermato | Chiarimento dopo demo 02 |
| D53 | Chat come via principale; campi dettagliati contestuali in secondo piano | Confermato | Chiarimento dopo demo 02 |
| D54 | AI open source in tutti i moduli e stack grafico/funzionale open source | Confermato | Chiarimento dopo demo 02 |
| D55 | Dettaglio funzionale sufficientemente preciso, senza esigere ogni componente esecutivo | Confermato | Chiarimento dopo demo 02 |
| D56 | GetcraftAI come riferimento per l'esperienza | Richiesto; servizio non verificato | Feedback e chiarimento dopo demo 02 |

Il requisito open source è esplicito con D54; budget di hosting/hardware, provider, dominio e modello AI restano da definire. La demo 02 non implementa il sistema completo. Stato verificabile in [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md), architettura prevista in [ARCHITECTURE.md](ARCHITECTURE.md).
