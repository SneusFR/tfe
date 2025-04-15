// Store for managing mail conditions
// This will be used to store all the conditions that will be sent to OpenAI API

let conditions = [];

const conditionStore = {
  // Add a new condition
  addCondition(condition) {
    const newCondition = {
      id: `condition-${Date.now()}`,
      type: 'mail',
      conditionText: condition.conditionText,
      returnText: condition.returnText,
      createdAt: new Date().toISOString()
    };
    console.log('✅ [CONDITION STORE] Adding new condition:', JSON.stringify(newCondition, null, 2));
    conditions.push(newCondition);
    this.saveToLocalStorage();
    return conditions[conditions.length - 1];
  },

  // Remove a condition by ID
  removeCondition(id) {
    console.log('🗑️ [CONDITION STORE] Removing condition with ID:', id);
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
      localStorage.setItem('mailConditions', JSON.stringify(conditions));
      console.log('💾 [CONDITION STORE] Conditions saved to localStorage');
    } catch (error) {
      console.error('Error saving conditions to localStorage:', error);
    }
  },

  // Load conditions from localStorage
  loadFromLocalStorage() {
    try {
      const savedConditions = localStorage.getItem('mailConditions');
      if (savedConditions) {
        conditions = JSON.parse(savedConditions);
        console.log('📂 [CONDITION STORE] Conditions loaded from localStorage');
      }
    } catch (error) {
      console.error('Error loading conditions from localStorage:', error);
    }
  }
};

// Initialize by loading from localStorage
conditionStore.loadFromLocalStorage();

export default conditionStore;
