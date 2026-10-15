# Specifica iniziale — caso e raccolta del brief

Stato: requisiti confermati fino a D40. Prototipo di raccolta del brief e anteprima parametrica 3D del pezzo implementati; stampo e simulazioni di processo ancora da sviluppare.

## Caso di riferimento concordato

- Utente principale: progettista di stampi.
- Pezzo: involucro composto da due gusci estetici abbinati, anteriore e posteriore.
- Destinazione: dispositivo elettronico da interno.
- Ingombro esterno assemblato: 120 × 80 × 35 mm. Ripartizione iniziale delle altezze 50% / 50%, ossia 17,5 mm per metà, modificabile. Sono requisiti del caso dimostrativo, non misure reali.
- Acquisizione geometria prevista: importazione STEP oppure costruzione parametrica guidata.
- Materiali da confrontare: ABS, PC/ABS, PP, PE e copolimeri. Famiglie specifiche, gradi commerciali e proprietà fisiche ancora da definire; i copolimeri non costituiscono una scheda materiale unica.
- Stampo: deve affrontare sottosquadri e carrelli. Divisione, numero di cavità, corse e azionamenti ancora da definire.
- Presse: includere sia macchine disponibili sia candidati da acquistare.
- Prima consegna utilizzabile del prodotto: concept stampo 3D, confronto dei costi e compatibilità pressa, con ipotesi e verifiche revisionabili.
- Quantità annua: scelta liberamente dall'utente, senza fasce o tetto commerciale predefinito. Quantità assente non è interpretata come domanda infinita.
- Durata iniziale della commessa: 5 anni, modificabile.
- Costo industriale iniziale: risultato da ricavare dal confronto. L'utente può poi fissare un obiettivo; un obiettivo assente in modalità esplorativa è ammesso.
- Finitura lucida con requisiti estetici elevati su faccia frontale e pareti laterali; criteri quantitativi ancora da definire.
- Sei agganci a scatto, tre per lato lungo, smontabili con attrezzo senza danni, con obiettivo di 1.000 cicli; dimensioni, posizioni precise, accesso dell'attrezzo e forze ancora da definire.
- Raggio esterno iniziale degli angoli: 8 mm. Il modello parametrico lo applica al profilo in pianta dei gusci.
- Quattro schede elettroniche disposte due per due su un livello, ciascuna con ingombro 40 × 25 × 8 mm inclusi componenti. Quote di posizionamento e supporti da definire.
- Apertura per il connettore dietro uno sportello sigillato.
- Obiettivo IP65. La richiesta iniziale di ventilazione è stata precisata in involucro chiuso con sfiato protetto per compensare la pressione. Potenza dissipata e soluzione di raffreddamento restano da dimensionare.
- IP65 richiesto anche con cavo collegato; tenuta del passaggio cavo da progettare oltre allo sportello.
- Spessori candidati: 1,5 / 2 / 2,5 mm. Lo spessore finale non è ancora selezionato.

## Dati del brief

| Gruppo | Dati | Unità / significato |
| --- | --- | --- |
| Identità | Nome progetto, cliente, riferimento articolo/RFQ | Testo |
| Domanda | Quantità annua, lotto, durata commessa | Pezzi conformi, pezzi/lotto, anni |
| Economia | Modalità esplorativa/obiettivo fissato, costo industriale obiettivo, prezzo vendita, budget stampo | EUR/pezzo conforme, EUR/pezzo, EUR; voci distinte |
| Pezzo | Nome, funzione, materiale/alternative, grado | Descrizione; proprietà da associare a fonti prima dei calcoli |
| Geometria | Lunghezza, larghezza, altezza, varianti di spessore, spessore nominale selezionato | mm; varianti distinte dalla scelta finale |
| Qualità | Finitura strutturata, superfici estetiche, tolleranze, difetti ammessi | Finitura lucida confermata; criteri di accettazione da approfondire |
| Estrazione | Fissaggi, sottosquadri, vincoli | Descrizione iniziale; geometria e cinematismi da verificare |
| Presse | Identità, disponibilità/acquisto, chiusura, passaggio colonne, altezze stampo, corsa apertura, volume iniezione | kN, mm, cm³; dati macchina forniti |
| Costi pressa | Tariffa oraria, investimento acquisto | EUR/h, EUR; contenuto della tariffa da specificare |

## Contratto iniziale del progetto esportato

- `schema_version`: versione 4 per includere profilo arrotondato, disposizione e cicli richiesti degli agganci.
- `id`, `created_at`, `updated_at`: identità e revisioni temporali del progetto.
- `dataset_kind`: progetto compilato o esempio UX; le singole voci mantengono anche provenienza propria.
- `currency`, `units`: valuta e unità di base esplicite.
- `brief`, `part`, `machines`: gruppi di input; campi numerici mancanti sono `null`.
- `part.wall_options_mm`: lista di spessori candidati positivi; `part.nominal_wall_mm` conserva separatamente l'eventuale scelta finale.
- `part.surface_finish` e `part.fastening`: finitura e fissaggio in formato strutturato.
- `part.opening`, `part.dimension_basis`, `part.front_share_percent`: configurazione geometrica e significato degli ingombri.
- `part.aesthetic_surfaces`, `part.snap_service`, `part.snap_count`: superfici a vista e requisiti degli agganci.
- `part.corner_radius_mm`, `part.snap_layout`, `part.snap_cycles`: raggio del profilo, disposizione e vita richiesta degli agganci.
- Campi opzionali aggiuntivi del formato 4: `electronics_configuration`, `pcb_count`, `external_openings`, `ip_target`, `thermal_strategy`, `connector_strategy`, `ip_in_use`, `pcb_layout`, `pcb_length_mm`, `pcb_width_mm`, `pcb_height_mm`. I requisiti sono distinti dalla verifica ingegneristica; nei progetti precedenti i campi assenti restano da definire.
- `concept_preview.wall_mm`: spessore visualizzato, distinto dalla selezione dello spessore nominale finale.
- `sources`: requisiti del caso, valori forniti dall'utente o esempi illustrativi. Nessun valore viene presentato come misura reale solo perché compilato.
- Export: aggiunge istante di export, capacità del prototipo e `engineering_validation: not_performed`.

I progetti di versione 1, 2 e 3 vengono aggiornati in memoria conservando dati, note e scelte esistenti. Uno spessore nominale precedente diventa anche candidato; i nuovi requisiti mancanti non sono imposti automaticamente. I vecchi profili privi di raggio restano a spigolo vivo (R0). Il comando di completamento del caso riempie solo i requisiti mancanti, senza sostituire valori validi, incluso R0. Il salvataggio avviene alle successive modifiche; il ripristino dei backup usa la stessa migrazione.

Il formato supporta raccolta dei requisiti e configurazione delle varianti. La struttura per scenari di domanda, versioni, geometrie/allegati, fonti documentali e condizioni produttive sarà estesa insieme alle decisioni successive.

## Criteri del primo prototipo

1. Un progettista può compilare e rivedere brief, pezzo e macchine senza passare da una conversazione obbligatoria.
2. Ogni campo numerico indica unità e intervallo ammesso; zero resta distinto da dato assente dove ammesso.
3. Valori non validi non sovrascrivono l'ultimo valore salvato e impediscono export/cambio schermata finché non sono corretti.
4. Le macchine esistenti e da acquistare restano distinte; nessuna viene dichiarata compatibile prima delle verifiche.
5. Il progetto sopravvive al reload nel browser; export e stato del salvataggio sono visibili.
6. L'esempio UX conserva il progetto precedente e rende riconoscibili i valori illustrativi.
7. Desktop e mobile consentono la compilazione senza scorrimento orizzontale.
8. I moduli ancora da implementare sono identificati chiaramente.
9. Le varianti di spessore possono essere aggiunte/rimosse, senza duplicati o valori non positivi, e conservate nel riepilogo e nell'export.
10. Nessuna variante viene dichiarata ottimale o fisicamente verificata senza il motore e i dati pertinenti.
11. L'anteprima 3D supporta rotazione, viste standard, esploso di due gusci e trasparenza, con fallback leggibile quando la grafica non è disponibile.
12. Parametri geometrici impossibili invalidano anteprima ed export, senza esportare una geometria precedente come se fosse aggiornata.
13. Il download OBJ contiene i componenti separati nella configurazione assemblata; l'esploso è solo una modalità di visualizzazione.

## Primo modello geometrico implementato

Gusci a parete uniforme con profilo rettangolare arrotondato, senza sformi o ritiro. Apertura sul retro, su lato corto o assieme di due gusci; per l'assieme sono configurabili altezza totale e ripartizione. Il raggio si applica al profilo perpendicolare all'apertura. Il profilo interno usa il raggio esterno meno lo spessore, limitato a zero. Gli archi sono approssimati con 24 segmenti per quarto di cerchio; il volume è quello della mesh poligonale. Nei test sul caso R8, tutti e tre gli spessori hanno una differenza relativa inferiore allo 0,01% rispetto al volume del profilo con archi ideali. Il caso iniziale confronta 1,5 / 2 / 2,5 mm senza scegliere lo spessore finale.

La geometria non include ancora agganci, raccordi fuori piano, nervature, battute, sedi per l'attrezzo, canali, estrattori o stampo. I 1.000 cicli sono un requisito non ancora verificato. Aspetto e colore nel visualizzatore sono illustrativi. L'OBJ usa coordinate in millimetri per convenzione documentata; non è un modello STEP o un progetto esecutivo. Il volume non determina massa, peso iniettato o tempo ciclo senza ulteriori modelli e dati.

## Tenuta e dissipazione

IP65 è un obiettivo, non una proprietà ottenuta dal modello 3D. Giunzione dei gusci, sportello, connettore/passaggio cavo e sfiato devono avere una soluzione di tenuta da dimensionare e verificare anche con cavo collegato. Il requisito di 1.000 cicli richiede di definire anche le condizioni di verifica delle tenute dopo le aperture.

Lo sfiato protetto per la pressione non è un sistema di ventilazione per raffreddamento con ricambio d'aria. La valutazione termica a involucro chiuso richiede potenza dissipata, condizioni ambientali, limiti di temperatura, posizione delle schede e proprietà dei materiali. L'anteprima non include schede, sportello, guarnizioni, aperture o sfiato e non prevede ancora temperature.

## Criteri di confronto da implementare

Per ogni combinazione materiale/grado e spessore considerare resa estetica (segni, risucchi, deformazioni), comportamento dell'aggancio (montaggio, ritenzione, deformazione e smontaggio), producibilità, raffreddamento/tempo ciclo e costo. Proprietà del materiale, geometria locale degli agganci e condizioni di accettazione sono prerequisiti per le relative previsioni. Il prototipo attuale presenta le configurazioni, senza valori fisici o economici inventati.

## Decisioni ancora necessarie

Quote dei supporti interni e disposizione precisa delle quattro schede; dimensioni di connettore e cavo; potenza e ambiente; scenari e lotti del caso; sformi, tolleranze e criteri estetici quantitativi; dimensioni e forze degli agganci, giochi e sedi per l'attrezzo; tenute di gusci/sportello/cavo e sfiato; direzione di estrazione e carrelli; gradi materiale e dati per verifica a 1.000 cicli; alimentazione e raffreddamento dello stampo; dati del parco presse e tariffe; costi e ammortamento; formato del concept stampo e casi di verifica tecnica. Le domande saranno affrontate in piccoli gruppi.
