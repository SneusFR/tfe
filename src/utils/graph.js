export const buildAdjacency = (edges) => {
  const adj = new Map();
  edges.forEach(e => {
    if (e.data?.isExecutionLink &&
        e.sourceHandle === 'execution' &&
        e.targetHandle === 'execution') {
      (adj.get(e.source) ?? adj.set(e.source, new Set()).get(e.source))
        .add(e.target);
    }
  });
  return adj;
};

export const markReachable = (starts, adj) => {
  const seen = new Set(starts);
  const stack = [...starts];
  while (stack.length) {
    const n = stack.pop();
    adj.get(n)?.forEach(next => {
      if (!seen.has(next)) {
        seen.add(next);
        stack.push(next);
      }
    });
  }
  return seen;
};
