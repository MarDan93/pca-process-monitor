"""Grounded workflow advice. Model selects actions, never supplies engineering facts."""
import json

MESSAGES = {
 'en': [
  'I can help prepare the comparison. A press cannot be selected from tonnage and polymer family alone.',
  'Demand: is the quantity per year or the total order? Confirm the programme duration and whether you count individual parts or assemblies in Customer brief.',
  'Product: describe the part and import its mesh. Add actual part mass and the projected area in the intended opening direction; mesh bounds are not projected area.',
  'Material: select the commercial grade, supplier and datasheet. PP alone does not define flow, shrinkage, thermal behaviour or melt density.',
  'Machines: add both presses to Machine park. Confirm force units (kN or metric tonnes-force), tie-bar spacing, mould heights, opening, injection unit/shot volume and your hourly costs. Tonnage alone cannot establish compatibility.',
  'Mould: generate a preliminary cavity layout from Product, choose an extraction axis and inspect the press checks. This creates envelopes, not a finished mould design.',
  'System Simulation: configure complete press/mould/EOAT/robot/conveyor/packaging scenarios, approve and compare them. Finite downstream buffers can block the robot and delay the press. 3D, timeline and signals share one clock. L0 uses configured times; pressure/temperature need measurements or separate Mold CAE.',
  'Economics: compare validated output rate, scrap, material and energy costs, tooling investment and machine hourly cost over the programme. Missing inputs prevent a defensible cost recommendation.',
  'No project values have been changed. Save confirmed inputs in the relevant module, or use a proposal mode to review a typed update.'
 ],
 'it': [
  'Posso aiutarti a preparare il confronto. Tonnellaggio e famiglia del polimero da soli non bastano per scegliere la pressa.',
  'Quantità: è una richiesta annua o il totale della commessa? Conferma durata del programma e se conti singoli pezzi o assiemi nel Brief cliente.',
  'Prodotto: descrivi il pezzo e importa la geometria. Servono massa reale e area proiettata nella direzione di apertura prevista; gli ingombri della mesh non sono l’area proiettata.',
  'Materiale: scegli grado commerciale, fornitore e scheda tecnica. Il solo PP non definisce fluidità, ritiro, comportamento termico o densità del fuso.',
  'Presse: inserisci entrambe nel Parco macchine. Conferma unità della forza (kN o tonnellate-forza metriche), distanza colonne, altezze stampo, apertura, gruppo di iniezione/volume dosabile e costi orari aziendali. Il solo tonnellaggio non stabilisce la compatibilità.',
  'Stampo: genera un layout preliminare delle cavità dal Prodotto, scegli l’asse di estrazione e leggi le verifiche pressa. Si generano ingombri, non uno stampo esecutivo.',
  'Simulazione sistema: configura scenari completi di pressa, stampo, pinza, robot, nastro e confezionamento, approvali e confrontali. I buffer a valle possono bloccare il robot e ritardare la pressa. 3D, timeline e segnali condividono il tempo. L0 usa durate configurate; pressione e temperatura richiedono misure o il modulo Mold CAE separato.',
  'Costi: confronta produttività verificata, scarti, materiale, energia, investimento stampo e costo orario pressa sulla durata della commessa. Senza questi dati non è motivabile una raccomandazione economica.',
  'Non ho modificato i valori del progetto. Salva gli input confermati nei moduli, oppure usa una modalità proposta per verificare un aggiornamento strutturato.'
 ],
 'fr': [
  'Je peux préparer la comparaison. Le tonnage et la famille du polymère ne suffisent pas pour choisir la presse.',
  'Demande : quantité annuelle ou commande totale ? Confirmez la durée et si vous comptez des pièces ou des ensembles dans le cahier client.',
  'Produit : décrivez la pièce et importez sa géométrie. Fournissez sa masse et sa surface projetée dans la direction d’ouverture ; les dimensions de la maille ne sont pas cette surface.',
  'Matière : choisissez la référence commerciale, le fournisseur et la fiche technique. PP seul ne définit pas les propriétés du grade.',
  'Machines : ajoutez les deux presses au parc. Précisez les unités de force, entraxes, hauteurs de moule, ouverture, unité d’injection/volume et vos coûts horaires.',
  'Moule : générez une implantation préliminaire des empreintes, choisissez un axe et consultez les vérifications presse. Il s’agit d’enveloppes, pas d’un moule de fabrication.',
  'Simulation système : configurez des scénarios complets presse/moule/préhenseur/robot/convoyeur/conditionnement, approuvez puis comparez. Les tampons limités peuvent bloquer le robot et retarder la presse. 3D et signaux partagent une horloge. L0 utilise des durées configurées ; la physique relève des mesures ou du module Mold CAE séparé.',
  'Coûts : comparez cadence validée, rebuts, matière, énergie, investissement et coût horaire sur la durée du programme. Les données manquantes empêchent une recommandation justifiable.',
  'Aucune donnée du projet modifiée. Enregistrez les données confirmées ou utilisez un mode proposition pour vérifier une modification structurée.'
 ],
 'es': [
  'Puedo preparar la comparación. El tonelaje y la familia del polímero no bastan para elegir la prensa.',
  'Demanda: ¿cantidad anual o pedido total? Confirma duración y si cuentas piezas o conjuntos en los requisitos del cliente.',
  'Producto: describe la pieza e importa su geometría. Aporta masa y área proyectada en la dirección de apertura; las dimensiones de la malla no son esa área.',
  'Material: selecciona grado comercial, proveedor y ficha técnica. PP solo no define las propiedades del grado.',
  'Máquinas: añade ambas prensas al parque. Confirma unidades de fuerza, distancia entre columnas, alturas de molde, apertura, unidad de inyección/volumen y costes horarios propios.',
  'Molde: genera una distribución preliminar de cavidades, elige un eje y revisa las comprobaciones. Son envolventes, no un molde de fabricación.',
  'Simulación del sistema: configura escenarios completos de prensa/molde/pinza/robot/cinta/embalaje, aprueba y compara. Los búferes limitados pueden bloquear el robot y retrasar la prensa. 3D y señales comparten reloj. L0 usa tiempos configurados; la física requiere medidas o el módulo Mold CAE separado.',
  'Costes: compara producción validada, rechazo, material, energía, inversión y coste horario durante el programa. Sin estos datos no hay una recomendación económica justificable.',
  'No se han cambiado los datos del proyecto. Guarda los datos confirmados o revisa una actualización en un modo de propuesta.'
 ]}
KEYS = ['demand', 'geometry', 'material', 'machines', 'layout', 'simulation', 'costs']


def workflow_reply(text, language, project):
    """A closed action vocabulary prevents hallucinated prices, names and specifications."""
    guided = False
    try:
        cleaned = text.strip()
        if cleaned.startswith('```') and cleaned.endswith('```'):
            cleaned = cleaned.split('\n', 1)[1].rsplit('```', 1)[0].strip()
        data = json.loads(cleaned)
        # Small models sometimes return the action array directly. Both forms
        # have exactly the same closed vocabulary; neither permits prose/facts.
        actions = data if isinstance(data, list) else data['actions']
        if (isinstance(data, dict) and set(data) != {'actions'}) or not isinstance(actions, list) or not 1 <= len(actions) <= 4 or any(a not in KEYS for a in actions):
            raise ValueError('Invalid workflow actions.')
    except (ValueError, KeyError, TypeError):
        actions, guided = ['demand', 'geometry', 'material', 'machines'], True
    # Missing prerequisites must not disappear just because a model skipped them.
    if project['commercial']['annual_volume'] is None and 'demand' not in actions:
        actions.insert(0, 'demand')
    if not project['asset'] and 'geometry' not in actions:
        actions.append('geometry')
    if any(a in actions for a in ('machines', 'costs', 'layout')) and not (project.get('engineering') or {}).get('material') and 'material' not in actions:
        actions.append('material')
    lines = MESSAGES[language]
    return '\n\n'.join([lines[0], *['• ' + lines[KEYS.index(a) + 1] for a in dict.fromkeys(actions)], lines[-1]]), guided
