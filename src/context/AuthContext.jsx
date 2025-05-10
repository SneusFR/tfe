import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';

// Create an axios instance with withCredentials
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true // This is essential for sending cookies with requests
});

// Create the authentication context
export const AuthContext = createContext(null);

// Create a provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Function to register a new user
  const register = useCallback(async (email, password, displayName) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/auth/register', {
        email,
        password,
        displayName
      });
      
      const userData = response.data;
      const normalisedUser = {
        ...userData,
        id: userData.id ?? userData._id,   // toujours présent ensuite
      };
      setUser(normalisedUser);
      setIsAuthenticated(true);
      return { success: true, data: userData };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to login a user
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/auth/login', {
        email,
        password
      });
      
      const userData = response.data;
      const normalisedUser = {
        ...userData,
        id: userData.id ?? userData._id,   // toujours présent ensuite
      };
      setUser(normalisedUser);
      setIsAuthenticated(true);
      return { success: true, data: normalisedUser };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to reset all contexts and stores
  const reset = useCallback(async () => {
    // Clear user state
    setUser(null);
    setIsAuthenticated(false);
    
    // Remove flow ID from localStorage
    localStorage.removeItem('mailflow_current_flow');
    
    // Import dynamically to avoid circular dependency
    const { useFlowManager } = await import('./FlowManagerContext');
    const flowManager = useFlowManager();
    
    // Clear flow manager cache
    if (flowManager && flowManager.clear) {
      flowManager.clear();
    }
    
    // Clear all stores
    const collaborationStore = (await import('../store/collaborationStore')).default;
    collaborationStore.clearCache();
    
    const taskStore = (await import('../store/taskStore')).default;
    taskStore.clearCache();
    
    const conditionStore = (await import('../store/conditionStore')).default;
    conditionStore.setCurrentFlowId(null);
    
    const backendConfigStore = (await import('../store/backendConfigStore')).default;
    backendConfigStore.setCurrentFlowId(null);
  }, []);

  // Function to logout a user
  const logout = useCallback(async () => {
    try {
      // Call the logout endpoint
      await api.post('/api/auth/logout');
      
      // Reset all contexts and stores
      await reset();
      
      // Emit logout event for other tabs
      localStorage.setItem('logout', Date.now().toString());
    } catch (err) {
      console.error('Logout error:', err);
      // Even if the API call fails, still reset the client state
      await reset();
    }
  }, [reset]);

  // Function to get the current user's information
  const getCurrentUser = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/auth/me');
      const userData = response.data;
      const normalisedUser = {
        ...userData,
        id: userData.id ?? userData._id,   // toujours présent ensuite
      };
      setUser(normalisedUser);
      setIsAuthenticated(true);
      return normalisedUser;
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
      setError(err.response?.data?.message || 'Failed to get user information');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to check session status
  const sessionCheck = useCallback(async () => {
    try {
      const { data } = await api.get('/api/auth/me');
      const normalisedUser = {
        ...data,
        id: data.id ?? data._id,   // toujours présent ensuite
      };
      setUser(normalisedUser);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }
  }, [api]);

  // Check authentication status when the component mounts and on visibility change
  useEffect(() => {
    // Initial session check
    sessionCheck();
    
    // Add visibility change listener to check session when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sessionCheck();
      }
    };
    
    // Add storage event listener to handle logout across tabs
    const handleStorageChange = (e) => {
      if (e.key === 'logout') {
        reset();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [sessionCheck, reset]);

  // Provide the authentication context to children components
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated,
        register,
        login,
        logout,
        getCurrentUser,
        sessionCheck,
        reset,
        api // Expose the api instance for other components to use
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
