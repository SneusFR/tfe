// Store for managing tasks generated from email analysis
let tasks = [];

const taskStore = {
  // Add a new task
  addTask(taskData) {
    const newTask = {
      id: `task-${Date.now()}`,
      type: taskData.type || 'GENERAL',
      description: taskData.description,
      source: taskData.source || 'email',
      sourceId: taskData.sourceId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      senderEmail: taskData.senderEmail || '',
      recipientEmail: taskData.recipientEmail || '',
      attachments: taskData.attachments || []
    };
    console.log("📧 [TASK STORE] Creating task with email ID:", taskData.sourceId);
    if (taskData.attachments && taskData.attachments.length > 0) {
      console.log("📎 [TASK STORE] Task includes attachments:", 
        taskData.attachments.map(a => ({ id: a.id, name: a.name })));
    }
    tasks.push(newTask);
    this.saveToLocalStorage();
    return newTask;
  },

  // Remove a task by ID
  removeTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    this.saveToLocalStorage();
  },

  // Mark a task as completed
  completeTask(id) {
    const task = tasks.find(task => task.id === id);
    if (task) {
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      this.saveToLocalStorage();
    }
  },

  // Get all tasks
  getAllTasks() {
    return [...tasks];
  },

  // Get pending tasks
  getPendingTasks() {
    return tasks.filter(task => task.status === 'pending');
  },
  
  // Get task by ID
  getTaskById(id) {
    return tasks.find(task => task.id === id);
  },
  
  // Get tasks by type
  getTasksByType(type) {
    return tasks.filter(task => task.type === type);
  },

  // Save tasks to localStorage
  saveToLocalStorage() {
    try {
      localStorage.setItem('emailTasks', JSON.stringify(tasks));
      console.log('💾 [TASK STORE] Tasks saved to localStorage');
    } catch (error) {
      console.error('Error saving tasks to localStorage:', error);
    }
  },

  // Load tasks from localStorage
  loadFromLocalStorage() {
    try {
      const savedTasks = localStorage.getItem('emailTasks');
      if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        console.log('📂 [TASK STORE] Tasks loaded from localStorage');
      }
    } catch (error) {
      console.error('Error loading tasks from localStorage:', error);
    }
  }
};

// Initialize by loading from localStorage
taskStore.loadFromLocalStorage();

export default taskStore;
