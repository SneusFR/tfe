import { createContext, useRef, useEffect, useState, useContext } from 'react';
import { runFlow } from '../services/flowClient';
import { useAuth } from './AuthContext';

// Create a context for the flow
export const FlowContext = createContext(null);

// Create a provider component
export const FlowProvider = ({ children, nodes, edges }) => {
  const { api } = useAuth();
  // State to store the selected backend config ID
  const [backendConfigId, setBackendConfigId] = useState(null);
  // State to store all available backend configs
  const [backendConfigs, setBackendConfigs] = useState([]);
  // State to track loading state
  const [loading, setLoading] = useState(false);
  
  // Create a ref to hold the executeFlow function
  const executeFlowRef = useRef(async (task) => {
    return await runFlow(nodes, edges, task, backendConfigId);
  });
  
  // Update the executeFlowRef when nodes, edges, or backendConfigId change
  useEffect(() => {
    executeFlowRef.current = async (task) => {
      return await runFlow(nodes, edges, task, backendConfigId);
    };
  }, [nodes, edges, backendConfigId]);

  // Fetch backend configurations
  useEffect(() => {
    const fetchBackendConfigs = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/backend-configs');
        setBackendConfigs(response.data);
        
        // Set the active backend config as selected if no selection exists
        if (!backendConfigId) {
          const activeConfig = response.data.find(config => config.isActive);
          if (activeConfig) {
            setBackendConfigId(activeConfig.id);
          }
        }
      } catch (error) {
        console.error('Error fetching backend configs:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (api) {
      fetchBackendConfigs();
    }
  }, [api, backendConfigId]);

  return (
    <FlowContext.Provider value={{ 
      executeFlowRef, 
      backendConfigId, 
      setBackendConfigId,
      backendConfigs,
      loading
    }}>
      {children}
    </FlowContext.Provider>
  );
};

// Custom hook to use the flow context
export const useFlow = () => {
  const context = useContext(FlowContext);
  if (!context) {
    throw new Error('useFlow must be used within a FlowProvider');
  }
  return context;
};
