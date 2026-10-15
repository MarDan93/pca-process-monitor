# Caso opzionale — involucro elettronico

Requisiti concordati al 2026-10-15. I valori descrivono un caso dimostrativo da progettare e verificare; non sono risultati sperimentali né default della piattaforma. La [specifica generale](SPECIFICATION.md) ammette prodotti differenti e parte dal brief cliente. Questo caso può essere caricato come esempio e usato nella verifica insieme a geometrie diverse.

| Aspetto | Requisito |
| --- | --- |
| Destinazione | Dispositivo elettronico da interno |
| Assieme | Due gusci abbinati, anteriore e posteriore |
| Ingombro complessivo | 120 × 80 × 35 mm |
| Ripartizione iniziale | 50% / 50%, altezze 17,5 mm, modificabili |
| Profilo esterno | Angoli con raggio iniziale 8 mm |
| Spessori da confrontare | 1,5 / 2 / 2,5 mm; nessuna scelta finale |
| Estetica | Lucida, requisiti elevati su frontale e pareti laterali |
| Materiali candidati | ABS, PC/ABS, PP, PE e copolimeri; gradi da specificare |
| Fissaggio gusci | Sei agganci a scatto, tre per ciascun lato lungo |
| Smontaggio | Con attrezzo, senza danni |
| Vita degli agganci | Obiettivo 1.000 cicli di montaggio/smontaggio |
| Contenuto | Quattro schede elettroniche, due per due su un livello |
| Ingombro di ogni scheda | 40 × 25 × 8 mm, inclusi componenti |
| Connettore | Dietro sportello sigillato, tipologia e dimensioni da definire |
| Protezione | Obiettivo IP65 anche con cavo collegato |
| Sfiato | Protetto, per compensare la pressione; involucro chiuso |
| Raffreddamento | Da dimensionare a involucro chiuso; potenza e ambiente mancanti |
| Volumi produttivi | Quantità annua libera scelta dall'utente |
| Orizzonte economico | Inizialmente 5 anni, modificabile |
| Costo industriale | Da ricavare dal confronto, poi obiettivo fissabile |
| Presse | Confronto macchine esistenti e da acquistare |

## Disponibile nel prototipo

Brief e requisiti modificabili, varianti di spessore, gusci 3D con profilo arrotondato, rotazione, esploso/assemblato, trasparenza, volume geometrico, export OBJ/JSON, catalogo presse e persistenza nel browser. Sedici test geometrici e controllo funzionale in Chromium passati.

## Attività tecniche aperte del caso

Inserire gli ingombri delle schede e progettare supporti, giunzione, agganci, sportello, passaggio cavo e sfiato. Le aperture, gli agganci e l'elettronica non sono ancora modellati. IP65, durata a 1.000 cicli e prestazioni termiche restano da verificare; la geometria preliminare non è un progetto stampo esecutivo.

Il registro delle risposte è in DISCOVERY.md; modello dei dati e limiti sono in SPECIFICATION.md.
