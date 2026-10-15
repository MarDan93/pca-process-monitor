# Stato reale e separazione dalla specifica

Aggiornamento: 2026-10-15. I documenti di revisione 3 definiscono il sistema richiesto. In questa tranche sono stati riscritti requisiti, architettura, simulazione, UX, roadmap e criteri di accettazione; non sono stati aggiunti un backend online, un agente o un motore fisico.

| Area | Disponibile nel repository | Da implementare |
| --- | --- | --- |
| Brief | Form locale con export e catalogo presse | Ingresso commerciale generico, chat AI e salvataggio server |
| Prodotto | Guscio parametrico dimostrativo; viewer OBJ/STL, unità e ingombri; foto di riferimento | Modello generico, STEP/solidi CAD, feature e ricostruzione assistita |
| Stampo | Requisiti descrittivi del caso | Geometria, cavità, estrazione, circuiti e alternative |
| Cella | Schede pressa candidate | Layout pressa/stampo/robot cartesiano/presa/nastro/ausiliari e cinematica |
| Processo | Nessun motore temporale dal granulo al nastro | Eventi, flussi materiale, parametri, animazione e livelli L0/L1/L2 |
| Dati e ML | Libreria Python PCA e notebook | Integrazione, correzione/verifica della libreria, PLS e ottimizzazione su dati reali |
| Distribuzione | Demo HTML scaricabile e sorgenti per sviluppo | Applicazione web ospitata, persistenza e accessi |
| AI | Parser locale limitato nella demo | Modelli open source e strumenti condivisi per tutti i moduli |

I 21 test e controlli Chromium precedentemente passati riguardano la demo 02. Non verificano il nuovo backlog. La libreria PCA originaria ha una criticità di normalizzazione Q rilevata durante onboarding, da riprodurre/correggere prima dell'impiego produttivo.

Il documento [archive/DEMO_02_SPECIFICATION.md](archive/DEMO_02_SPECIFICATION.md) conserva formato v4 e criteri della vecchia demo. [REFERENCE_CASE.md](REFERENCE_CASE.md) conserva i requisiti dell'involucro come caso opzionale. Nessuno dei due determina i campi obbligatori di un nuovo progetto della piattaforma.

La prossima tranche applicativa è P1/B01–B04: modello generico, archivio server e briefing commerciale conversazionale con AI reale. Le decisioni di hosting restano da prendere quando esisterà una distribuzione concreta da verificare.
