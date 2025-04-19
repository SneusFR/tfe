import axios from 'axios';

export async function runFlow(nodes, edges, task, backendConfigId?: string) {
  const res = await axios.post('/api/flow/execute',
    { nodes, edges, task, backendConfigId },
    { withCredentials: true } // seulement si la route est protégée côté back
  );
  return res.data; // { success, result }
}
