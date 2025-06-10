// collaborationStore.js
import { getApi, getFlowApi } from '../utils/flowApiHelper';

// Instance API générique
const api = getApi();

/* ------------------------------------------------------------------ */
/*  État local (cache + flow courant)                                 */
/* ------------------------------------------------------------------ */
let currentFlowId = null;

let collaborationsCache = {
  data:        [],   // liste des collaborations déjà récupérées
  lastFetched: null, // timestamp du dernier fetch
  loading:     false, // évite les appels concurrents
  promise:     null  // stocke la promesse de la requête en cours
};

/* ------------------------------------------------------------------ */
/*  Utilitaires                                                       */
/* ------------------------------------------------------------------ */
// Supprime les clés dont la valeur est undefined
const stripUndefined = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

const getFlowApiFor = (maybeFlow) => {
  if (maybeFlow && maybeFlow.id)         return getFlowApi(maybeFlow.id);
  if (currentFlowId)                    return getFlowApi(currentFlowId);
  return api;
};

/* ------------------------------------------------------------------ */
/*  Store                                                             */
/* ------------------------------------------------------------------ */
const collaborationStore = {
  /* ---------------- Gestion du flow courant ----------------------- */
  setCurrentFlowId(flowId) {
    currentFlowId = flowId;
    collaborationsCache.data = [];
    collaborationsCache.lastFetched = null;
    collaborationsCache.promise = null;
  },

  /* -------------------- Création ---------------------------------- */
  async add(collaborationData) {
    const { flowId, userId, email, role } = collaborationData;
    const payload = stripUndefined({ flowId, userId, email, role });

    const { data } = await api.post('/api/collaborations', payload);

    // On place la nouvelle collaboration en tête du cache si celui‑ci existe déjà
    if (collaborationsCache.data.length) collaborationsCache.data.unshift(data);
    return data;
  },

  /* -------------------- Suppression ------------------------------- */
  async remove(id) {
    await api.delete(`/api/collaborations/${id}`);
    collaborationsCache.data = collaborationsCache.data.filter((c) => c.id !== id);
    return true;
  },

  /* -------------------- Mise à jour ------------------------------- */
  async update(id, updateData = {}) {
    const payload = stripUndefined({
      role: updateData.role
    });

    const { data } = await api.put(`/api/collaborations/${id}`, payload);
    const idx = collaborationsCache.data.findIndex((c) => c.id === id);
    if (idx !== -1) collaborationsCache.data[idx] = data;
    return data;
  },

  /* ------------------- Récupération par flow --------------------- */
  async getByFlow(flowId, opts = {}) {
    console.log('[getByFlow] flowId', flowId, 'cached?', !!collaborationsCache.data.length);
    const now = Date.now();

    // Cache frais ? on renvoie la copie
    if (
      currentFlowId === flowId &&
      collaborationsCache.data.length &&
      collaborationsCache.lastFetched &&
      now - collaborationsCache.lastFetched < 30_000 &&
      !opts.forceRefresh
    ) {
      return [...collaborationsCache.data];
    }
    
    // 1. si une requête est déjà en cours, ATTENDEZ-LÀ plutôt que
    // de renvoyer [] tout de suite
    if (collaborationsCache.loading) {
      return collaborationsCache.promise;
    }

    try {
      collaborationsCache.loading = true;
      
      // Stocke la promesse pour pouvoir la renvoyer si getByFlow est appelé à nouveau
      // pendant que la requête est en cours
      collaborationsCache.promise = api.get(`/api/collaborations/flow/${flowId}`)
        .then(({ data }) => {
          collaborationsCache.data = data || [];
          collaborationsCache.lastFetched = now;
          return [...collaborationsCache.data];
        })
        .finally(() => {
          collaborationsCache.loading = false;
          collaborationsCache.promise = null;
        });

      return collaborationsCache.promise;
    } catch (error) {
      collaborationsCache.loading = false;
      collaborationsCache.promise = null;
      throw error;
    }
  },

  /* -------------------- Rôle de l'utilisateur courant ------------ */
  meRole(flowId, userId) {
    if (!flowId || !userId || !collaborationsCache.data.length) return null;
    
    // Cherche la collaboration de l'utilisateur courant pour ce flow
    // en comparant l'ID de l'utilisateur avec celui de la collaboration
    const myCollaboration = collaborationsCache.data.find(collab => {
      if (collab.flow !== flowId || !collab.user) return false;
      // collab.user peut être un objet ou une string
      let collabUserId;
      if (typeof collab.user === 'object' && collab.user) {
        collabUserId = (collab.user.id || collab.user._id || '').toString();
      } else {
        collabUserId = (collab.user || '').toString();
      }
      const currentUserId = (userId || '').toString();
      return collabUserId === currentUserId;
    });
    
    return myCollaboration ? myCollaboration.role : null;
  },

  /* ------------------------ Divers -------------------------------- */
  clearCache() {
    collaborationsCache = { data: [], lastFetched: null, loading: false, promise: null };
  }
};

export default collaborationStore;
