// taskStore.js
import { getApi, getFlowApi } from '../utils/flowApiHelper';

// Instance API générique
const api = getApi();

/* ------------------------------------------------------------------ */
/*  État local (cache + flow courant)                                 */
/* ------------------------------------------------------------------ */
let currentFlowId = null;

let tasksCache = {
  data:        [],   // liste des tâches déjà récupérées
  lastFetched: null, // timestamp du dernier fetch
  loading:     false // évite les appels concurrents
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
const taskStore = {
  /* ---------------- Gestion du flow courant ----------------------- */
  setCurrentFlowId(flowId) {
    currentFlowId        = flowId;
    tasksCache.data      = [];
    tasksCache.lastFetched = null;
  },

  /* -------------------- Création ---------------------------------- */
  async addTask(taskData, currentFlow) {
    const flowApi  = getFlowApiFor(currentFlow);
    const payload  = stripUndefined({
      type:           taskData.type    || 'GENERAL',
      description:    taskData.description,
      source:         taskData.source  || 'email',
      sourceId:       taskData.sourceId,
      senderEmail:    taskData.senderEmail,
      recipientEmail: taskData.recipientEmail,
      status:         taskData.status,
      attachments:    taskData.attachments || [],
      subject:        taskData.subject,
      senderName:     taskData.senderName,
      recipientName:  taskData.recipientName,
      body:           taskData.body,
      date:           taskData.date,
      attachmentId:   taskData.attachmentId
    });

    const { data } = await flowApi.post('/tasks', payload);

    // On place la nouvelle tâche en tête du cache si celui‑ci existe déjà
    if (tasksCache.data.length) tasksCache.data.unshift(data);
    return data;
  },

  /* -------------------- Suppression ------------------------------- */
  async removeTask(id, currentFlow) {
    const flowApi = getFlowApiFor(currentFlow);
    await flowApi.delete(`/tasks/${id}`);
    tasksCache.data = tasksCache.data.filter((t) => t.id !== id);
    return true;
  },

  /* --------------- Marquer comme terminée ------------------------- */
  async completeTask(id, currentFlow) {
    const flowApi   = getFlowApiFor(currentFlow);
    const { data }  = await flowApi.put(`/tasks/${id}/complete`);
    const idx       = tasksCache.data.findIndex((t) => t.id === id);
    if (idx !== -1) tasksCache.data[idx] = data;
    return data;
  },

  /* -------------------- Mise à jour ------------------------------- */
  async updateTask(id, updateData = {}, currentFlow) {
    const flowApi  = getFlowApiFor(currentFlow);
    const payload  = stripUndefined({
      description:    updateData.description,
      type:           updateData.type,
      source:         updateData.source,
      sourceId:       updateData.sourceId,
      senderEmail:    updateData.senderEmail,
      recipientEmail: updateData.recipientEmail,
      status:         updateData.status,
      attachments:    updateData.attachments,
      subject:        updateData.subject,
      senderName:     updateData.senderName,
      recipientName:  updateData.recipientName,
      body:           updateData.body,
      date:           updateData.date,
      attachmentId:   updateData.attachmentId
    });

    const { data } = await flowApi.put(`/tasks/${id}`, payload);
    const idx      = tasksCache.data.findIndex((t) => t.id === id);
    if (idx !== -1) tasksCache.data[idx] = data;
    return data;
  },

  /* ------------------- Récupération liste ------------------------- */
  async getAllTasks(opts = {}, currentFlow) {
    const now = Date.now();

    // Cache frais ? on renvoie la copie
    if (
      tasksCache.data.length &&
      tasksCache.lastFetched &&
      now - tasksCache.lastFetched < 30_000 &&
      !opts.forceRefresh
    ) {
      return [...tasksCache.data];
    }
    if (tasksCache.loading) return [...tasksCache.data];

    try {
      tasksCache.loading = true;

      const params = new URLSearchParams();
      if (opts.status) params.append('status', opts.status);
      if (opts.type)   params.append('type',   opts.type);
      if (opts.limit)  params.append('limit',  opts.limit);
      if (opts.page)   params.append('page',   opts.page);

      const flowApi = getFlowApiFor(currentFlow);
      const qs      = params.toString();           // <-- évite le « /tasks? » vide
      const url     = qs ? `/tasks?${qs}` : '/tasks';

      const { data } = await flowApi.get(url);

      tasksCache.data        = data.data || [];
      tasksCache.lastFetched = now;
      return [...tasksCache.data];
    } finally {
      tasksCache.loading = false;
    }
  },

  /* -------------------- Raccourcis -------------------------------- */
  getPendingTasks(currentFlow)         { return this.getAllTasks({ status: 'pending' }, currentFlow); },
  getTasksByType(type, currentFlow)    { return this.getAllTasks({ type }, currentFlow); },

  async getTaskById(id, currentFlow) {
    const cached = tasksCache.data.find((t) => t.id === id);
    if (cached) return cached;
    const flowApi = getFlowApiFor(currentFlow);
    const { data } = await flowApi.get(`/tasks/${id}`);
    return data;
  },

  async getTaskStats(currentFlow) {
    const flowApi = getFlowApiFor(currentFlow);
    const { data } = await flowApi.get('/tasks/stats');
    return data;
  },

  // Vérifier le statut des tâches en cours d'exécution
  async checkRunningTasksStatus(currentFlow) {
    const runningTasks = tasksCache.data.filter(task => 
      task.status === 'running' || 
      task.status === 'in_progress' || 
      task.status === 'executing'
    );

    if (runningTasks.length === 0) {
      return { hasRunningTasks: false, statusChanged: false };
    }

    try {
      const flowApi = getFlowApiFor(currentFlow);
      const { data } = await flowApi.get('/tasks');
      const updatedTasks = data.data || [];

      // Vérifier si des tâches ont changé de statut
      const statusChanged = runningTasks.some(runningTask => {
        const updatedTask = updatedTasks.find(t => t.id === runningTask.id);
        return updatedTask && updatedTask.status !== runningTask.status;
      });

      if (statusChanged) {
        // Mettre à jour le cache avec les nouvelles données
        tasksCache.data = updatedTasks;
        tasksCache.lastFetched = Date.now();
      }

      return { 
        hasRunningTasks: updatedTasks.some(task => 
          task.status === 'running' || 
          task.status === 'in_progress' || 
          task.status === 'executing'
        ), 
        statusChanged,
        tasks: updatedTasks
      };
    } catch (error) {
      console.error('Error checking running tasks status:', error);
      return { hasRunningTasks: true, statusChanged: false };
    }
  },

  /* ------------------------ Divers -------------------------------- */
  clearCache() {
    tasksCache = { data: [], lastFetched: null, loading: false };
  },

  async loadFromLocalStorage(currentFlow) {
    try {
      await this.getAllTasks({ forceRefresh: true }, currentFlow);
    } catch {
      console.warn('API unreachable, loading tasks from localStorage');
      const saved = localStorage.getItem('emailTasks');
      if (saved) tasksCache.data = JSON.parse(saved);
    }
  }
};

/* Chargement initial ------------------------------------------------ */
taskStore.loadFromLocalStorage();

export default taskStore;
