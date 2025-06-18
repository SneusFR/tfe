import axios from 'axios';

// API functions
export const fetchExecutionLogs = async (
  filter,
  pageState
) => {
  try {
    // Build query params
    const params = new URLSearchParams();
    params.append('flowId', filter.flowId);
    params.append('page', pageState.page.toString());
    params.append('limit', pageState.limit.toString());
    params.append('sort', pageState.sort);
    
    if (filter.taskIds && filter.taskIds.length > 0) {
      params.append('taskIds', filter.taskIds.join(','));
    }
    
    if (filter.level) {
      params.append('level', filter.level);
    }
    
    if (filter.since) {
      params.append('since', filter.since);
    }
    
    if (filter.until) {
      params.append('until', filter.until);
    }
    
    const response = await axios.get('/api/executions/logs', {
      params,
      withCredentials: true, // For JWT cookie
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle specific error codes
      if (error.response?.status === 401) {
        // Redirect to login will be handled by the hook
        throw new Error('Unauthorized: Please log in');
      } else if (error.response?.status === 403) {
        throw new Error('Access forbidden: You do not have permission to view these logs');
      } else {
        throw new Error(`Error fetching logs: ${error.response?.data?.message || error.message}`);
      }
    }
    throw new Error('An unexpected error occurred');
  }
};

export const fetchTaskLogs = async (
  taskId,
  pageState,
  filter
) => {
  try {
    // Build query params
    const params = new URLSearchParams();
    params.append('page', pageState.page.toString());
    params.append('limit', pageState.limit.toString());
    params.append('sort', pageState.sort);
    
    if (filter.level) {
      params.append('level', filter.level);
    }
    
    if (filter.since) {
      params.append('since', filter.since);
    }
    
    if (filter.until) {
      params.append('until', filter.until);
    }
    
    const response = await axios.get(`/api/executions/${taskId}/logs`, {
      params,
      withCredentials: true, // For JWT cookie
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle specific error codes
      if (error.response?.status === 401) {
        // Redirect to login will be handled by the hook
        throw new Error('Unauthorized: Please log in');
      } else if (error.response?.status === 403) {
        throw new Error('Access forbidden: You do not have permission to view these logs');
      } else {
        throw new Error(`Error fetching task logs: ${error.response?.data?.message || error.message}`);
      }
    }
    throw new Error('An unexpected error occurred');
  }
};

export const deleteExecutionLogs = async (
  options
) => {
  try {
    await axios.delete('/api/executions/logs', {
      data: options,
      withCredentials: true, // For JWT cookie
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle specific error codes
      if (error.response?.status === 401) {
        // Redirect to login will be handled by the hook
        throw new Error('Unauthorized: Please log in');
      } else if (error.response?.status === 403) {
        throw new Error('Access forbidden: You do not have permission to delete these logs');
      } else {
        throw new Error(`Error deleting logs: ${error.response?.data?.message || error.message}`);
      }
    }
    throw new Error('An unexpected error occurred');
  }
};
