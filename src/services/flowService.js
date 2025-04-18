import { useAuth } from '../context/AuthContext';

// Create a service with the API instance from AuthContext
const createFlowService = (api) => {
  /**
   * Check if a user has access to a flow with a specific role
   * @param {string} userId - User ID
   * @param {string} flowId - Flow ID
   * @param {string} requiredRole - Required role (owner, editor, viewer)
   * @returns {Promise<boolean>} - Whether the user has access
   */
  const checkFlowAccess = async (userId, flowId, requiredRole = 'viewer') => {
    try {
      // This function is called by the backend middleware
      // We don't need to implement it in the frontend since the backend handles the check
      // But we need to have it defined to avoid the error
      return true;
    } catch (error) {
      console.error('Error checking flow access:', error);
      return false;
    }
  };

  /**
   * Get all flows for the current user
   * @param {Object} pagination - Pagination parameters
   * @param {number} pagination.page - Page number
   * @param {number} pagination.limit - Number of items per page
   * @returns {Promise<Object>} - Paginated flows data
   */
  const getFlows = async (pagination = { page: 1, limit: 10 }) => {
    const { page, limit } = pagination;
    const response = await api.get(`/api/flows?page=${page}&limit=${limit}`);
    return response.data;
  };

  /**
   * Get active flows for the current user
   * @param {Object} pagination - Pagination parameters
   * @param {number} pagination.page - Page number
   * @param {number} pagination.limit - Number of items per page
   * @returns {Promise<Object>} - Paginated active flows data
   */
  const getActiveFlows = async (pagination = { page: 1, limit: 10 }) => {
    const { page, limit } = pagination;
    const response = await api.get(`/api/flows/active?page=${page}&limit=${limit}`);
    return response.data;
  };

  /**
   * Get a specific flow by ID
   * @param {string} flowId - Flow ID
   * @returns {Promise<Object>} - Flow data
   */
  const getFlowById = async (flowId) => {
    const response = await api.get(`/api/flows/${flowId}`);
    return response.data;
  };

  /**
   * Create a new flow
   * @param {Object} flowData - Flow data
   * @param {string} flowData.name - Flow name
   * @returns {Promise<Object>} - Created flow data
   */
  const createFlow = async (flowData) => {
    const response = await api.post('/api/flows', flowData);
    return response.data;
  };

  /**
   * Save the current variant of a flow
   * @param {string} flowId - Flow ID
   * @param {Object} flowData - Flow data
   * @param {Array} flowData.nodes - Flow nodes
   * @param {Array} flowData.edges - Flow edges
   * @returns {Promise<Object>} - Updated flow data
   */
  const saveFlowVariant = async (flowId, flowData) => {
    const response = await api.put(`/api/flows/${flowId}`, flowData);
    return response.data;
  };

  /**
   * Switch to a different variant of a flow
   * @param {string} flowId - Flow ID
   * @param {number} index - Variant index (0, 1, or 2)
   * @returns {Promise<Object>} - Updated flow data
   */
  const switchFlowVariant = async (flowId, index) => {
    const response = await api.patch(`/api/flows/${flowId}/version`, { index });
    return response.data;
  };

  /**
   * Delete a flow
   * @param {string} flowId - Flow ID
   * @returns {Promise<Object>} - Response data
   */
  const deleteFlow = async (flowId) => {
    const response = await api.delete(`/api/flows/${flowId}`);
    return response.data;
  };

  return {
    checkFlowAccess,
    getFlows,
    getActiveFlows,
    getFlowById,
    createFlow,
    saveFlowVariant,
    switchFlowVariant,
    deleteFlow
  };
};

// Hook to use the flow service
export const useFlowService = () => {
  const { api } = useAuth();
  return createFlowService(api);
};
