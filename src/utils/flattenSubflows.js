/**
 * Aplatis un graphe React-Flow : pour chaque `subFlowNode`
 * encore « collapsed », on ré-insère ses nœuds / arêtes d’origine
 * et on rebranche les connexions externes.
 *
 * @param {Array} nodes
 * @param {Array} edges
 * @param {Map<string,{nodes:Array,edges:Array}>} originals
 * @returns {{ nodes:Array, edges:Array }}
 */
export const flattenSubflows = (nodes, edges, originals = new Map()) => {
  let flatNodes = [...nodes];
  let flatEdges = [...edges];

  let again = true;
  while (again) {
    again = false;

    for (const sf of [...flatNodes]) {
      if (sf.type !== 'subFlowNode') continue;

      // ► « collapsed » par défaut (seul isCollapsed === false l’exclut)
      if (sf.data?.isCollapsed === false) continue;

      // ► Où sont stockés les originaux ?
      let orig = originals.get(sf.id) || sf.data?.originals;
      if (!orig) continue;                // rien à aplatir

      again = true;

      /* ----- arêtes externes AVANT suppression du node ------------ */
      const inEdges  = flatEdges.filter(e => e.target === sf.id);
      const outEdges = flatEdges.filter(e => e.source === sf.id);

      /* ----- 1° on retire le subFlowNode + ses arêtes ------------- */
      flatNodes = flatNodes.filter(n => n.id !== sf.id);
      flatEdges = flatEdges.filter(
        e => e.source !== sf.id && e.target !== sf.id
      );

      /* ----- 2° on ré-insère nœuds & arêtes internes -------------- */
      flatNodes.push(...orig.nodes.map(n => ({ ...n })));
      flatEdges.push(...orig.edges.map(e => ({ ...e })));

      /* ----- 3° on rebranche vers l’extérieur --------------------- */
      const path    = sf.data.originalPath || orig.nodes.map(n => n.id);
      const firstId = path[0];
      const lastId  = path[path.length - 1];

      inEdges.forEach(e =>
        flatEdges.push({
          ...e,
          target       : firstId,
          targetHandle : 'execution',
          id           : `${e.id}-relIn-${sf.id}`,
        })
      );

      outEdges.forEach(e =>
        flatEdges.push({
          ...e,
          source       : lastId,
          sourceHandle : 'execution',
          id           : `${e.id}-relOut-${sf.id}`,
        })
      );
    }
  }

  console.log('[DEBUG] flatten DONE', flatNodes.filter(n => n.type==='conditionNode').map(n=>({id:n.id, start:n.data.isStartingPoint})));
  return { nodes: flatNodes, edges: flatEdges };
};
