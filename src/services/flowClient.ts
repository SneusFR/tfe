import axios from 'axios';

export async function runFlow(nodes, edges, task, backendConfigId?: string, flowId?: string) {
  const res = await axios.post(`/api/flow/${flowId}/execute`,
    { nodes, edges, task, backendConfigId },
    { withCredentials: true } // seulement si la route est protégée côté back
  );
  return res.data; // { success, result }
}
