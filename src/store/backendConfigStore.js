// store/backendConfigStore.js
import { getApi, getFlowApi } from '../utils/flowApiHelper';

/**
 * Store pour gérer les configurations backend
 * Utilise l'API spécifique au flow quand un flowId est fourni
 */
class BackendConfigStore {
  constructor() {
    this.api = getApi();
    this.currentFlowId = null;
  }

  /**
   * Définit l'ID du flow courant
   * @param {string} flowId - ID du flow
   */
  setCurrentFlowId(flowId) {
    this.currentFlowId = flowId;
  }

  /**
   * Récupère toutes les configurations backend
   * @returns {Promise<Array>} - Liste des configurations
   */
  async getAll() {
    if (!this.currentFlowId) return [];   // ou throw new Error('Flow not set')
    try {
      // Utilise l'API du flow si un flowId est défini, sinon l'API globale
      const flowApi = this.currentFlowId ? getFlowApi(this.currentFlowId) : this.api;
      const res = await flowApi.get('/backend-configs');
      
      // Gère la pagination si le backend renvoie un objet paginé
      const list = Array.isArray(res.data?.data) ? res.data.data : res.data;
      return list;
    } catch (error) {
      console.error('Error fetching backend configs:', error);
      throw error;
    }
  }

  /**
   * Récupère une configuration backend par son ID
   * @param {string} id - ID de la configuration
   * @returns {Promise<Object>} - Configuration backend
   */
  async getById(id) {
    if (!this.currentFlowId) return null;   // ou throw new Error('Flow not set')
    try {
      const flowApi = this.currentFlowId ? getFlowApi(this.currentFlowId) : this.api;
      const res = await flowApi.get(`/backend-configs/${id}`);
      return res.data;
    } catch (error) {
      console.error(`Error fetching backend config ${id}:`, error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle configuration backend
   * @param {Object} config - Données de la configuration
   * @returns {Promise<Object>} - Configuration créée
   */
  async create(config) {
    if (!this.currentFlowId) return null;   // ou throw new Error('Flow not set')
    try {
      const flowApi = this.currentFlowId ? getFlowApi(this.currentFlowId) : this.api;
      const res = await flowApi.post('/backend-configs', config);
      return res.data;
    } catch (error) {
      console.error('Error creating backend config:', error);
      throw error;
    }
  }

  /**
   * Met à jour une configuration backend
   * @param {string} id - ID de la configuration
   * @param {Object} config - Données mises à jour
   * @returns {Promise<Object>} - Configuration mise à jour
   */
  async update(id, config) {
    if (!this.currentFlowId) return null;   // ou throw new Error('Flow not set')
    try {
      const flowApi = this.currentFlowId ? getFlowApi(this.currentFlowId) : this.api;
      const res = await flowApi.put(`/backend-configs/${id}`, config);
      return res.data;
    } catch (error) {
      console.error(`Error updating backend config ${id}:`, error);
      throw error;
    }
  }

  /**
   * Supprime une configuration backend
   * @param {string} id - ID de la configuration
   * @returns {Promise<Object>} - Réponse de l'API
   */
  async delete(id) {
    if (!this.currentFlowId) return null;   // ou throw new Error('Flow not set')
    try {
      const flowApi = this.currentFlowId ? getFlowApi(this.currentFlowId) : this.api;
      const res = await flowApi.delete(`/backend-configs/${id}`);
      return res.data;
    } catch (error) {
      console.error(`Error deleting backend config ${id}:`, error);
      throw error;
    }
  }

  /**
   * Définit une configuration comme active
   * @param {string} id - ID de la configuration
   * @returns {Promise<Object>} - Configuration mise à jour
   */
  async setActive(id) {
    if (!this.currentFlowId) return null;   // ou throw new Error('Flow not set')
    try {
      const flowApi = this.currentFlowId ? getFlowApi(this.currentFlowId) : this.api;
      const res = await flowApi.patch(`/backend-configs/${id}/active`);
      return res.data;
    } catch (error) {
      console.error(`Error setting backend config ${id} as active:`, error);
      throw error;
    }
  }
}

// Exporte une instance unique du store
const backendConfigStore = new BackendConfigStore();
export default backendConfigStore;
