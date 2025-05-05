// taskStore.js
import axios from 'axios';

// Axios (envoie les cookies pour la session)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true
});

/* ------------------------------------------------------------------------- */
/*  Cache simple                                                            */
/* ------------------------------------------------------------------------- */
let tasksCache = {
  data: [],
  lastFetched: null,
  loading: false
};

/* ------------------------------------------------------------------------- */
/*  Helpers                                                                  */
/* ------------------------------------------------------------------------- */
/** Nettoie un objet en supprimant les clés dont la valeur est undefined */
const stripUndefined = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

/* ------------------------------------------------------------------------- */
/*  Store                                                                    */
/* ------------------------------------------------------------------------- */
const taskStore = {
  /* --------------------------------------------------------------------- */
  /*  Création                                                             */
  /* --------------------------------------------------------------------- */
  async addTask(taskData) {
    try {
      console.log('📧 [TASK STORE] Creating task:', {
        sourceId: taskData.sourceId,
        sender:   taskData.senderEmail,
        recipient:taskData.recipientEmail
      });

      const payload = stripUndefined({
        type:           taskData.type || 'GENERAL',
        description:    taskData.description,
        source:         taskData.source || 'email',
        sourceId:       taskData.sourceId,
        senderEmail:    taskData.senderEmail,
        recipientEmail: taskData.recipientEmail,
        status:         taskData.status,           // facultatif
        attachments:    taskData.attachments || []
      });

      const response = await api.post('/api/tasks', payload);

      // maj du cache
      if (tasksCache.data.length > 0) {
        tasksCache.data.unshift(response.data);
      }
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  /* --------------------------------------------------------------------- */
  /*  Suppression                                                          */
  /* --------------------------------------------------------------------- */
  async removeTask(id) {
    try {
      await api.delete(`/api/tasks/${id}`);
      tasksCache.data = tasksCache.data.filter((t) => t.id !== id);
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  /* --------------------------------------------------------------------- */
  /*  Marquer comme terminée                                               */
  /* --------------------------------------------------------------------- */
  async completeTask(id) {
    try {
      const response = await api.put(`/api/tasks/${id}/complete`);
      const idx = tasksCache.data.findIndex((t) => t.id === id);
      if (idx !== -1) tasksCache.data[idx] = response.data;
      return response.data;
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  },

  /* --------------------------------------------------------------------- */
  /*  Mise à jour                                                          */
  /* --------------------------------------------------------------------- */
  async updateTask(id, updateData = {}) {
    try {
      const payload = stripUndefined({
        description:    updateData.description,
        type:           updateData.type,
        source:         updateData.source,
        sourceId:       updateData.sourceId,
        senderEmail:    updateData.senderEmail,
        recipientEmail: updateData.recipientEmail,
        status:         updateData.status,
        attachments:    updateData.attachments
      });

      const response = await api.put(`/api/tasks/${id}`, payload);

      const idx = tasksCache.data.findIndex((t) => t.id === id);
      if (idx !== -1) tasksCache.data[idx] = response.data;
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  /* --------------------------------------------------------------------- */
  /*  Récupération (liste)                                                 */
  /* --------------------------------------------------------------------- */
  async getAllTasks(opts = {}) {
    const now = Date.now();

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

      const res = await api.get(`/api/tasks?${params}`);
      tasksCache.data        = res.data.data || [];
      tasksCache.lastFetched = now;

      return [...tasksCache.data];
    } catch (err) {
      console.error('Error fetching tasks:', err);
      throw err;
    } finally {
      tasksCache.loading = false;
    }
  },

  /* --------------------------------------------------------------------- */
  /*  Raccourcis                                                           */
  /* --------------------------------------------------------------------- */
  async getPendingTasks()       { return this.getAllTasks({ status: 'pending' }); },
  async getTasksByType(type)    { return this.getAllTasks({ type }); },

  async getTaskById(id) {
    const cached = tasksCache.data.find((t) => t.id === id);
    if (cached) return cached;

    const { data } = await api.get(`/api/tasks/${id}`);
    return data;
  },

  async getTaskStats() {
    const { data } = await api.get('/api/tasks/stats');
    return data;
  },

  /* --------------------------------------------------------------------- */
  /*  Divers                                                               */
  /* --------------------------------------------------------------------- */
  clearCache() {
    tasksCache = { data: [], lastFetched: null, loading: false };
  },

  async loadFromLocalStorage() {
    try {
      await this.getAllTasks({ forceRefresh: true });
    } catch (apiErr) {
      console.warn('API unreachable, loading tasks from localStorage');
      try {
        const saved = localStorage.getItem('emailTasks');
        if (saved) tasksCache.data = JSON.parse(saved);
      } catch (localErr) {
        console.error('Error loading tasks from localStorage:', localErr);
      }
    }
  }
};

/* Chargement initial */
taskStore.loadFromLocalStorage();

export default taskStore;
