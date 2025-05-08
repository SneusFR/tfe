// Store for managing mail conditions
// This will be used to store all the conditions that will be sent to OpenAI API
import { getApi, getFlowApi } from '../utils/flowApiHelper';

// Default API instance
const api = getApi();

let conditions = [];
let currentFlowId = null;

const conditionStore = {
  // Set the current flow ID
  setCurrentFlowId(flowId) {
    if (currentFlowId !== flowId) {
      currentFlowId = flowId;
      conditions = []; // Clear conditions when flow changes
      this.loadConditions(); // Load conditions for the new flow
    }
  },

  // Load conditions from the server
  async loadConditions() {
    if (!currentFlowId) return;

    try {
      const flowApi = getFlowApi(currentFlowId);
      const response = await flowApi.get('/conditions');
      const payload   = response.data;
      conditions      = Array.isArray(payload?.data) ? payload.data
                      : Array.isArray(payload)      ? payload
                      : [];
      
      // Save to localStorage as backup
      this.saveToLocalStorage();
      
      console.log(`📂 [CONDITION STORE] Loaded ${conditions.length} conditions from server for flow ${currentFlowId}`);
      return conditions;
    } catch (error) {
      console.error('Error loading conditions from server:', error);
      // Fall back to localStorage
      this.loadFromLocalStorage();
      throw error;
    }
  },
  // Add a new condition
  async addCondition(condition) {
    const newCondition = {
      id: `condition-${Date.now()}`,
      type: 'mail',
      conditionText: condition.conditionText,
      returnText: condition.returnText,
      createdAt: new Date().toISOString()
    };
    
    console.log('✅ [CONDITION STORE] Adding new condition:', JSON.stringify(newCondition, null, 2));
    
    // If we have a flow ID, save to server
    if (currentFlowId) {
      try {
        const flowApi = getFlowApi(currentFlowId);
        const { id, ...payload } = newCondition;
        const response = await flowApi.post('/conditions', payload);
        const savedCondition = response.data;
        conditions.push(savedCondition);
        this.saveToLocalStorage(); // Backup to localStorage
        return savedCondition;
      } catch (error) {
        console.error('Error saving condition to server:', error);
        // Fall back to local storage only
        conditions.push(newCondition);
        this.saveToLocalStorage();
        return newCondition;
      }
    } else {
      // No flow ID, just use localStorage
      conditions.push(newCondition);
      this.saveToLocalStorage();
      return conditions[conditions.length - 1];
    }
  },

  // Remove a condition by ID
  async removeCondition(id) {
    console.log('🗑️ [CONDITION STORE] Removing condition with ID:', id);
    
    // If we have a flow ID, delete from server
    if (currentFlowId) {
      try {
        const flowApi = getFlowApi(currentFlowId);
        await flowApi.delete(`/conditions/${id}`);
      } catch (error) {
        console.error('Error deleting condition from server:', error);
        // Continue with local deletion even if server delete fails
      }
    }
    
    // Update local cache
    conditions = conditions.filter(condition => condition.id !== id);
    this.saveToLocalStorage();
  },

  // Get all conditions
  getAllConditions() {
    return [...conditions];
  },

  // Get condition by ID
  getConditionById(id) {
    return conditions.find(condition => condition.id === id);
  },

  // Generate prompt for OpenAI API
  generateOpenAIPrompt() {
    if (conditions.length === 0) {
      console.log('ℹ️ [CONDITION STORE] No conditions available for OpenAI prompt');
      return '';
    }

    const prompt = conditions
      .map(condition => {
        return `Si ça ressemble à ${condition.conditionText} envoie : "${condition.returnText}"`;
      })
      .join(',\n');
    
    console.log('🤖 [CONDITION STORE] Generated OpenAI prompt with', conditions.length, 'conditions');
    return prompt;
  },

  // Save conditions to localStorage
  saveToLocalStorage() {
    try {
      // If we have a flow ID, store with flow ID in the key
      const storageKey = currentFlowId 
        ? `mailConditions_flow_${currentFlowId}` 
        : 'mailConditions';
        
      localStorage.setItem(storageKey, JSON.stringify(conditions));
      console.log(`💾 [CONDITION STORE] Conditions saved to localStorage with key ${storageKey}`);
    } catch (error) {
      console.error('Error saving conditions to localStorage:', error);
    }
  },

  // Load conditions from localStorage
  loadFromLocalStorage() {
    try {
      // If we have a flow ID, load from flow-specific key
      const storageKey = currentFlowId 
        ? `mailConditions_flow_${currentFlowId}` 
        : 'mailConditions';
        
      const savedConditions = localStorage.getItem(storageKey);
      if (savedConditions) {
        conditions = JSON.parse(savedConditions) ?? [];
        console.log(`📂 [CONDITION STORE] Conditions loaded from localStorage with key ${storageKey}`);
      }
    } catch (error) {
      console.error('Error loading conditions from localStorage:', error);
    }
  }
};

// Initialize by loading from localStorage
conditionStore.loadFromLocalStorage();

export default conditionStore;
