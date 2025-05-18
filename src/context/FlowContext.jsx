import { createContext, useRef, useEffect, useState, useContext, useMemo } from 'react';
import { runFlow } from '../services/flowClient.js';
import { useAuth } from './AuthContext';
import conditionStore from '../store/conditionStore';
import backendConfigStore from '../store/backendConfigStore';

// Create a context for the flow
export const FlowContext = createContext(null);

// Create a provider component
export const FlowProvider = ({ children, nodes, edges, flowId }) => {
  const { api } = useAuth();
  // State to store the selected backend config ID
  const [backendConfigId, setBackendConfigId] = useState(null);
  // State to store all available backend configs
  const [backendConfigs, setBackendConfigs] = useState([]);
  // State to track loading state
  const [loading, setLoading] = useState(false);
  
  // Create a ref to hold the executeFlow function
  const executeFlowRef = useRef(async (task) => {
    return await runFlow(nodes, edges, task, backendConfigId, flowId);
  });
  
  // Stabilize the nodes and edges references using useRef
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  
  // Only update the refs when the actual content changes
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  
  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);
  
  // Update the executeFlowRef when backendConfigId or flowId change
  // Use the refs for nodes and edges to maintain stable function identity
  useEffect(() => {
    executeFlowRef.current = async (task) => {
      return await runFlow(nodesRef.current, edgesRef.current, task, backendConfigId, flowId);
    };
  }, [backendConfigId, flowId]); // Removed nodes and edges from dependencies

  // Update condition store when flowId changes
  useEffect(() => {
    if (flowId) {
      conditionStore.setCurrentFlowId(flowId);
    }
  }, [flowId]);

  // Fetch backend configurations
  useEffect(() => {
    const fetchBackendConfigs = async () => {
      try {
        setLoading(true);
        
        // Set the current flow ID in the store
        if (flowId) {
          backendConfigStore.setCurrentFlowId(flowId);
        }
        
        // Get all backend configs
        const configs = await backendConfigStore.getAll();
        setBackendConfigs(configs);
        
        // Set the active backend config as selected if no selection exists
        if (!backendConfigId) {
          const activeConfig = configs.find(config => config.isActive);
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
  }, [api, backendConfigId, flowId]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    executeFlowRef, 
    backendConfigId, 
    setBackendConfigId,
    backendConfigs,
    loading,
    flowId
  }), [backendConfigId, backendConfigs, loading, flowId]);
  
  return (
    <FlowContext.Provider value={contextValue}>
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
