import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlowService } from '../services/flowService';
import { useAuth } from './AuthContext';

// Create context
const FlowManagerContext = createContext();

// Custom hook to use the FlowManager context
export const useFlowManager = () => useContext(FlowManagerContext);

export const FlowManagerProvider = ({ children }) => {
  // State for flows
  const [flows, setFlows] = useState([]);
  const [currentFlow, setCurrentFlow] = useState(null);
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { isAuthenticated } = useAuth();
  const flowService = useFlowService();
  
  // Load flows from API when authenticated
  const fetchFlows = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    try {
      const flowsArray = await flowService.getFlows({ page: 1, limit: 100 });
      setFlows(flowsArray || []);
      
      // Check if there's a current flow saved
      const currentFlowId = localStorage.getItem('mailflow_current_flow');
      if (currentFlowId) {
        const flow = flowsArray.find(f => f.id === currentFlowId);
        if (flow) {
          setCurrentFlow(flow);
        } else if (flowsArray.length === 0) {
          // Only show the modal if there are no flows available
          setShowFlowModal(true);
        }
      } else if (flowsArray.length === 0) {
        // Only show the modal if there are no flows available and no current flow
        setShowFlowModal(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to load flows');
      // Don't automatically show the modal on error
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, flowService]);
  
  // Use a ref to track if we've already fetched flows
  const hasFetchedRef = useRef(false);
  
  // Load flows only once when authenticated
  useEffect(() => {
    if (isAuthenticated && !hasFetchedRef.current) {
      fetchFlows();
      hasFetchedRef.current = true;
    }
  }, [isAuthenticated, fetchFlows]);
  
  // Save current flow ID to localStorage whenever it changes
  useEffect(() => {
    if (currentFlow) {
      localStorage.setItem('mailflow_current_flow', currentFlow.id);
    }
  }, [currentFlow]);
  
  // Create a new flow
  const createFlow = async (name, collaborators = []) => {
    setLoading(true);
    setError(null);
    try {
      const newFlow = await flowService.createFlow({ name });
      
      // Add the flow to the local state
      setFlows([...flows, newFlow]);
      setCurrentFlow(newFlow);
      setShowFlowModal(false);
      
      return newFlow;
    } catch (err) {
      setError(err.message || 'Failed to create flow');
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Load an existing flow
  const loadFlow = async (flowId) => {
    setLoading(true);
    setError(null);
    try {
      const flow = await flowService.getFlowById(flowId);
      
      setCurrentFlow(flow);
      setShowFlowModal(false);
      return flow;
    } catch (err) {
      setError(err.message || 'Failed to load flow');
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Save the current flow
  const saveCurrentFlow = async (nodes, edges) => {
    if (!currentFlow) return;
    
    const versionIndex = currentFlow.currentVersionIndex || 0;
    const version = currentFlow.versions?.[versionIndex] || {};
    const nodesToSave = Array.isArray(nodes) ? nodes : version.nodes || [];
    const edgesToSave = Array.isArray(edges) ? edges : version.edges || [];
    
    setLoading(true);
    setError(null);
    try {
      // Save to backend
      const updatedFlow = await flowService.saveFlowVariant(currentFlow.id, { nodes: nodesToSave, edges: edgesToSave });
      
      // Update local state
      setCurrentFlow(updatedFlow);
      setFlows(flows.map(f => f.id === updatedFlow.id ? updatedFlow : f));
      
      return updatedFlow;
    } catch (err) {
      setError(err.message || 'Failed to save flow');
      
      // Even if the API call fails, update the local state to prevent data loss
      const localUpdatedFlow = { ...currentFlow };
      localUpdatedFlow.versions[versionIndex].nodes = nodesToSave;
      localUpdatedFlow.versions[versionIndex].edges = edgesToSave;
      localUpdatedFlow.updatedAt = new Date().toISOString();
      
      // Generate a thumbnail from the current version
      localUpdatedFlow.thumbnail = nodesToSave.length > 0 || edgesToSave.length > 0 
        ? generateThumbnail(nodesToSave, edgesToSave) 
        : null;
      
      setCurrentFlow(localUpdatedFlow);
      
      return localUpdatedFlow;
    } finally {
      setLoading(false);
    }
  };
  
  // Update flow properties
  const updateFlowProperties = async (flowId, properties) => {
    setLoading(true);
    setError(null);
    try {
      // For now, we'll just update the name since that's what the backend supports
      if (properties.name) {
        await flowService.createFlow({ id: flowId, name: properties.name });
      }
      
      // Update local state
      const updatedFlows = flows.map(flow => {
        if (flow.id === flowId) {
          const updatedFlow = {
            ...flow,
            ...properties,
            updatedAt: new Date().toISOString(),
          };
          
          // If this is the current flow, update it as well
          if (currentFlow && currentFlow.id === flowId) {
            setCurrentFlow(updatedFlow);
          }
          
          return updatedFlow;
        }
        return flow;
      });
      
      setFlows(updatedFlows);
    } catch (err) {
      setError(err.message || 'Failed to update flow properties');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a flow
  const deleteFlow = async (flowId) => {
    setLoading(true);
    setError(null);
    try {
      await flowService.deleteFlow(flowId);
      
      // Update local state
      const updatedFlows = flows.filter(f => f.id !== flowId);
      setFlows(updatedFlows);
      
      // If the deleted flow is the current flow, clear it
      if (currentFlow && currentFlow.id === flowId) {
        setCurrentFlow(null);
        localStorage.removeItem('mailflow_current_flow');
        setShowFlowModal(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete flow');
    } finally {
      setLoading(false);
    }
  };
  
  // Generate a simple thumbnail representation of the flow
  const generateThumbnail = (nodes, edges) => {
    // This is a placeholder - in a real implementation, you might
    // want to generate an actual image or a more sophisticated representation
    return {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      nodeTypes: [...new Set(nodes.map(node => node.type))],
    };
  };
  
  // Toggle the flow modal
  const toggleFlowModal = () => {
    setShowFlowModal(!showFlowModal);
  };
  
  // Switch to a different version of the current flow
  const switchFlowVersion = async (versionIndex) => {
    if (!currentFlow || versionIndex < 0 || versionIndex > 2) return;
    
    setLoading(true);
    setError(null);
    try {
      // Call the API to switch variants
      const updatedFlow = await flowService.switchFlowVariant(currentFlow.id, versionIndex);
      
      // Update local state
      setCurrentFlow(updatedFlow);
      setFlows(flows.map(f => f.id === updatedFlow.id ? updatedFlow : f));
      
      return updatedFlow;
    } catch (err) {
      setError(err.message || 'Failed to switch flow version');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return (
    <FlowManagerContext.Provider
      value={{
        flows,
        currentFlow,
        showFlowModal,
        loading,
        error,
        createFlow,
        loadFlow,
        saveCurrentFlow,
        updateFlowProperties,
        deleteFlow,
        toggleFlowModal,
        setShowFlowModal,
        switchFlowVersion,
        refreshFlows: fetchFlows,
      }}
    >
      {children}
    </FlowManagerContext.Provider>
  );
};

export default FlowManagerContext;
