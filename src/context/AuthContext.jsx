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
      setUser(userData);
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
      setUser(userData);
      setIsAuthenticated(true);
      return { success: true, data: userData };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to logout a user
  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Function to get the current user's information
  const getCurrentUser = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/auth/me');
      setUser(response.data);
      setIsAuthenticated(true);
      return response.data;
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
      setError(err.response?.data?.message || 'Failed to get user information');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check authentication status when the component mounts
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await api.get('/api/auth/me');
        setUser(data);
        setIsAuthenticated(true);
      } catch (err) {
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, []);

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
