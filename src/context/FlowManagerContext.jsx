import React, { createContext, useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Create context
const FlowManagerContext = createContext();

// Custom hook to use the FlowManager context
export const useFlowManager = () => useContext(FlowManagerContext);

export const FlowManagerProvider = ({ children }) => {
  // State for flows
  const [flows, setFlows] = useState([]);
  const [currentFlow, setCurrentFlow] = useState(null);
  const [showFlowModal, setShowFlowModal] = useState(false);
  
  // Load flows from localStorage on initial render
  useEffect(() => {
    const savedFlows = localStorage.getItem('mailflow_flows');
    if (savedFlows) {
      setFlows(JSON.parse(savedFlows));
    }
    
    // Check if there's a current flow saved
    const currentFlowId = localStorage.getItem('mailflow_current_flow');
    if (currentFlowId) {
      const savedFlows = JSON.parse(localStorage.getItem('mailflow_flows') || '[]');
      const flow = savedFlows.find(f => f.id === currentFlowId);
      if (flow) {
        setCurrentFlow(flow);
      } else {
        // If the flow doesn't exist anymore, show the modal
        setShowFlowModal(true);
      }
    } else {
      // If no current flow, show the modal
      setShowFlowModal(true);
    }
  }, []);
  
  // Save flows to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('mailflow_flows', JSON.stringify(flows));
  }, [flows]);
  
  // Save current flow to localStorage whenever it changes
  useEffect(() => {
    if (currentFlow) {
      localStorage.setItem('mailflow_current_flow', currentFlow.id);
    }
  }, [currentFlow]);
  
  // Create a new flow
  const createFlow = (name, collaborators = []) => {
    const newFlow = {
      id: `flow-${Date.now()}`,
      name,
      collaborators,
      nodes: [],
      edges: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      thumbnail: null, // Will be updated later
    };
    
    setFlows([...flows, newFlow]);
    setCurrentFlow(newFlow);
    setShowFlowModal(false);
    
    return newFlow;
  };
  
  // Load an existing flow
  const loadFlow = (flowId) => {
    const flow = flows.find(f => f.id === flowId);
    if (flow) {
      setCurrentFlow(flow);
      setShowFlowModal(false);
    }
    return flow;
  };
  
  // Save the current flow
  const saveCurrentFlow = (nodes, edges) => {
    if (!currentFlow) return;
    
    const updatedFlow = {
      ...currentFlow,
      nodes,
      edges,
      updatedAt: new Date().toISOString(),
      // Generate a simple thumbnail representation (could be improved)
      thumbnail: nodes.length > 0 ? generateThumbnail(nodes, edges) : null,
    };
    
    setCurrentFlow(updatedFlow);
    setFlows(flows.map(f => f.id === updatedFlow.id ? updatedFlow : f));
    
    return updatedFlow;
  };
  
  // Update flow properties
  const updateFlowProperties = (flowId, properties) => {
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
  };
  
  // Delete a flow
  const deleteFlow = (flowId) => {
    const updatedFlows = flows.filter(f => f.id !== flowId);
    setFlows(updatedFlows);
    
    // If the deleted flow is the current flow, clear it
    if (currentFlow && currentFlow.id === flowId) {
      setCurrentFlow(null);
      localStorage.removeItem('mailflow_current_flow');
      setShowFlowModal(true);
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
  
  return (
    <FlowManagerContext.Provider
      value={{
        flows,
        currentFlow,
        showFlowModal,
        createFlow,
        loadFlow,
        saveCurrentFlow,
        updateFlowProperties,
        deleteFlow,
        toggleFlowModal,
        setShowFlowModal,
      }}
    >
      {children}
    </FlowManagerContext.Provider>
  );
};

export default FlowManagerContext;
