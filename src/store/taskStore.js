import axios from 'axios';

// Create an axios instance with withCredentials
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true // This is essential for sending cookies with requests
});

// Cache for tasks
let tasksCache = {
  data: [],
  lastFetched: null,
  loading: false
};

const taskStore = {
  // Add a new task
  async addTask(taskData) {
    try {
      console.log("📧 [TASK STORE] Creating task with email ID:", taskData.sourceId);
      if (taskData.attachments && taskData.attachments.length > 0) {
        console.log("📎 [TASK STORE] Task includes attachments:", 
          taskData.attachments.map(a => ({ id: a.id, name: a.name })));
      }
      
      const response = await api.post('/api/tasks', {
        type: taskData.type || 'GENERAL',
        description: taskData.description,
        source: taskData.source || 'email',
        sourceId: taskData.sourceId,
        attachments: taskData.attachments || []
      });
      
      // Update cache with the new task
      if (tasksCache.data.length > 0) {
        tasksCache.data.unshift(response.data);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  // Remove a task by ID
  async removeTask(id) {
    try {
      await api.delete(`/api/tasks/${id}`);
      
      // Update cache
      tasksCache.data = tasksCache.data.filter(task => task.id !== id);
      
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  // Mark a task as completed
  async completeTask(id) {
    try {
      const response = await api.put(`/api/tasks/${id}/complete`);
      
      // Update cache
      const taskIndex = tasksCache.data.findIndex(task => task.id === id);
      if (taskIndex !== -1) {
        tasksCache.data[taskIndex] = response.data;
      }
      
      return response.data;
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  },

  // Update a task
  async updateTask(id, updateData) {
    try {
      const response = await api.put(`/api/tasks/${id}`, updateData);
      
      // Update cache
      const taskIndex = tasksCache.data.findIndex(task => task.id === id);
      if (taskIndex !== -1) {
        tasksCache.data[taskIndex] = response.data;
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  // Get all tasks with optional filtering
  async getAllTasks(options = {}) {
    // If we have cached data and it's recent (less than 30 seconds old), return it
    const now = new Date();
    if (
      tasksCache.data.length > 0 && 
      tasksCache.lastFetched && 
      (now - tasksCache.lastFetched) < 30000 &&
      !options.forceRefresh
    ) {
      return [...tasksCache.data];
    }
    
    // If already loading, return current cache
    if (tasksCache.loading) {
      return [...tasksCache.data];
    }
    
    try {
      tasksCache.loading = true;
      
      // Build query parameters
      const params = new URLSearchParams();
      if (options.status) params.append('status', options.status);
      if (options.type) params.append('type', options.type);
      if (options.limit) params.append('limit', options.limit);
      if (options.page) params.append('page', options.page);
      
      const response = await api.get(`/api/tasks?${params.toString()}`);
      
      // Update cache
      tasksCache.data = response.data.data || [];
      tasksCache.lastFetched = now;
      
      return [...tasksCache.data];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    } finally {
      tasksCache.loading = false;
    }
  },

  // Get pending tasks
  async getPendingTasks() {
    const tasks = await this.getAllTasks({ status: 'pending' });
    return tasks;
  },
  
  // Get task by ID
  async getTaskById(id) {
    // Check cache first
    const cachedTask = tasksCache.data.find(task => task.id === id);
    if (cachedTask) {
      return cachedTask;
    }
    
    try {
      const response = await api.get(`/api/tasks/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching task ${id}:`, error);
      throw error;
    }
  },
  
  // Get tasks by type
  async getTasksByType(type) {
    const tasks = await this.getAllTasks({ type });
    return tasks;
  },
  
  // Get task statistics
  async getTaskStats() {
    try {
      const response = await api.get('/api/tasks/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching task stats:', error);
      throw error;
    }
  },

  // Clear the cache to force a refresh on next fetch
  clearCache() {
    tasksCache = {
      data: [],
      lastFetched: null,
      loading: false
    };
  },
  
  // For backward compatibility - load from localStorage if API fails
  async loadFromLocalStorage() {
    try {
      // Try to load from API first
      await this.getAllTasks({ forceRefresh: true });
    } catch (error) {
      console.error('Error loading tasks from API, falling back to localStorage:', error);
      
      try {
        const savedTasks = localStorage.getItem('emailTasks');
        if (savedTasks) {
          tasksCache.data = JSON.parse(savedTasks);
          console.log('📂 [TASK STORE] Tasks loaded from localStorage fallback');
        }
      } catch (localError) {
        console.error('Error loading tasks from localStorage:', localError);
      }
    }
  }
};

// Initialize by loading tasks
taskStore.loadFromLocalStorage();

export default taskStore;
