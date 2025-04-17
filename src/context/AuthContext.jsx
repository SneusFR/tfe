import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';

// Create the authentication context
export const AuthContext = createContext(null);

// Create a provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);

  // Configure axios to use the token for all requests
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('authToken', token);
      setIsAuthenticated(true);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('authToken');
      setIsAuthenticated(false);
    }
  }, [token]);

  // Function to register a new user
  const register = useCallback(async (email, password, displayName) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/auth/register', {
        email,
        password,
        displayName
      });
      
      const { token: newToken, ...userData } = response.data;
      setToken(newToken);
      setUser(userData);
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
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });
      
      const { token: newToken, ...userData } = response.data;
      setToken(newToken);
      setUser(userData);
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
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  // Function to get the current user's information
  const getCurrentUser = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data);
    } catch (err) {
      // If the token is invalid, clear it
      if (err.response?.status === 401) {
        setToken(null);
        setUser(null);
      }
      setError(err.response?.data?.message || 'Failed to get user information');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Get the current user when the component mounts or token changes
  useEffect(() => {
    if (token) {
      getCurrentUser();
    }
  }, [token, getCurrentUser]);

  // Provide the authentication context to children components
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAuthenticated,
        register,
        login,
        logout,
        getCurrentUser
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
