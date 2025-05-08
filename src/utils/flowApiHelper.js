// utils/flowApiHelper.js
import axios from 'axios';

/**
 * Retourne une instance Axios pré‑configurée pour un flow précis
 * @param {string} flowId - Identifiant du flow
 * @returns {AxiosInstance}
 */
export const getFlowApi = (flowId) => {
  if (!flowId) {
    throw new Error('Flow ID is required to create a flow API instance');
  }

  return axios.create({
    // ⚠️  « flow » au singulier pour coller aux routes REST
    baseURL: `/api/flows/${flowId}`,
    withCredentials: true,
    headers: {
      Accept: 'application/json',
    },
  });
};

/**
 * Instance générique pour les appels qui ne dépendent pas d’un flow
 * @returns {AxiosInstance}
 */
export const getApi = () =>
  axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true,
  });
