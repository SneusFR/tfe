import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlowService } from '../services/flowService';
import { useAuth } from './AuthContext';
import taskStore from '../store/taskStore';
import conditionStore from '../store/conditionStore';
import backendConfigStore from '../store/backendConfigStore';
import collaborationStore from '../store/collaborationStore';

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
  
  const { isAuthenticated, api, user } = useAuth();
  const flowService = useFlowService();
  
  // Clear all flow data
  const clear = useCallback(() => {
    setFlows([]);
    setCurrentFlow(null);
    collaborationStore.setCurrentFlowId(null);
  }, []);

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
        // Instead of loading the flow automatically, just clear it and show the modal
        localStorage.removeItem('mailflow_current_flow');
        setCurrentFlow(null);
        setShowFlowModal(true);
      } else {
        // No current flow, show the modal
        setShowFlowModal(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to load flows');
      // Don't automatically show the modal on error
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, flowService]);
  
  // Refresh flows without showing the modal (for use in CollaboratorsManager)
  const refreshFlowsQuiet = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    try {
      const flowsArray = await flowService.getFlows({ page: 1, limit: 100 });
      setFlows(flowsArray || []);
    } catch (err) {
      setError(err.message || 'Failed to load flows');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, flowService]);
  
  // Use a ref to track if we've already fetched flows
  const hasFetchedRef = useRef(false);
  
  // Load flows only once when authenticated
  useEffect(() => {
    if (isAuthenticated && !hasFetchedRef.current) {
      collaborationStore.clearCache();    // ← vide l'ancien cache mal formé
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
  const createFlow = async (name, collaboratorsEmails = []) => {
    setLoading(true);
    setError(null);
    try {
      // Create the flow first
      const apiFlow = await flowService.createFlow({ name });
      
      // Normalize flow to ensure it has an id property
      const newFlow = { ...apiFlow, id: apiFlow._id || apiFlow.id };
      
      // Create a copy of the flow that we'll update with collaborators
      const updatedFlow = { ...newFlow, collaborators: [] };
      
      // Add collaborators if provided
      if (collaboratorsEmails.length > 0) {
        for (const email of collaboratorsEmails) {
          try {
            // Use the collaborationStore to add collaborators
            const collaboration = await collaborationStore.add({
              flowId: newFlow.id,
              email: email.trim(),
              role: 'editor'
            });
            
            // Add the collaboration to our flow object
            if (collaboration) {
              updatedFlow.collaborators.push(collaboration);
            }
          } catch (collaboratorErr) {
            console.error(`Failed to add collaborator ${email}:`, collaboratorErr);
            // Continue with other collaborators even if one fails
          }
        }
      }
      
      // Add the flow to the local state
      setFlows([...flows, updatedFlow]);
      setCurrentFlow(updatedFlow);
      
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
      const apiFlow = await flowService.getFlowById(flowId);
      console.log('[loadFlow] flow from API', apiFlow);
      
      // Normalize flow to ensure it has an id property
      const flow = { ...apiFlow, id: apiFlow._id || apiFlow.id };
      
      // on vide / positionne le flow courant dans le store
      collaborationStore.setCurrentFlowId(flow.id);

      // 1️⃣ on force un fetch des collaborations (cookie déjà OK)
      try {
        const colls = await collaborationStore.getByFlow(flow.id, { forceRefresh: true });
        const me = colls.find(c =>
          (c.user.id ?? c.user._id ?? c.user).toString() ===
          (user.id ?? user._id).toString());
        if (me) flow.userRole = me.role;
        
        // Stocker les collaborations dans le flow pour un accès rapide
        flow.collaborators = colls;
      } catch (e) {
        console.error('[loadFlow] collaborations fetch failed', e);
      }

      setCurrentFlow(flow);
      setShowFlowModal(false);
      return flow;
    } catch (err) {
      // Check if this is a 403 Forbidden error
      if (err.response && err.response.status === 403) {
        // Show a toast message for unauthorized access
        // We'll use a simple alert for now, but you might want to use a toast library
        alert("Vous n'avez pas accès à ce flow");
        setError("Vous n'avez pas accès à ce flow");
      } else {
        setError(err.message || 'Failed to load flow');
      }
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Save the current flow
  const saveCurrentFlow = async (nodes, edges) => {
    if (!currentFlow) {
      console.log("Cannot save: No current flow selected");
      return;
    }
    
    const versionIndex = currentFlow.currentVersionIndex || 0;
    const version = currentFlow.versions?.[versionIndex] || {};
    
    // Clean nodes to remove React components and functions before saving
    const nodesToSave = Array.isArray(nodes) ? nodes.map(node => {
      // Extract only the serializable data from each node
      const { id, type, position, data, ...rest } = node;
      
      // Create a clean data object without React components or functions
      const cleanData = { ...data };
      
      // Remove React components and functions that cause circular references
      delete cleanData.deleteButton;
      delete cleanData.onTextChange;
      delete cleanData.onValueChange;
      delete cleanData.onPromptChange;
      delete cleanData.onInputChange;
      delete cleanData.onConditionTypeChange;
      delete cleanData.onInputValueChange;
      delete cleanData.onCasesChange;
      delete cleanData.onOperatorTypeChange;
      delete cleanData.onInputCountChange;
      
      // Return a clean node object
      return {
        id,
        type,
        position,
        data: cleanData,
        ...rest
      };
    }) : version.nodes || [];
    
    // Clean edges to remove any non-serializable properties
    const edgesToSave = Array.isArray(edges) ? edges.map(edge => {
      // Extract only the serializable data from each edge
      const { 
        id, 
        source, 
        target, 
        sourceHandle, 
        targetHandle, 
        type, 
        animated,
        style,
        markerEnd,
        data
      } = edge;
      
      // Return a clean edge object with only the essential properties
      return {
        id,
        source,
        target,
        sourceHandle,
        targetHandle,
        type,
        animated,
        style,           // ← on conserve
        markerEnd,       // ← on conserve
        data: data ? { 
          isExecutionLink: data.isExecutionLink,
          isConnected: data.isConnected
        } : undefined
      };
    }) : version.edges || [];
    
    setLoading(true);
    setError(null);
    try {
      // Save to backend
      const apiFlow = await flowService.saveFlowVariant(currentFlow.id, { nodes: nodesToSave, edges: edgesToSave });
      
      // Normalize flow to ensure it has an id property
      const updatedFlow = { ...apiFlow, id: apiFlow._id || apiFlow.id };
      
      // ➜ on recopie le rôle qu'on connaît déjà
      updatedFlow.userRole = currentFlow.userRole;

      // (facultatif, garde aussi les collaborateurs déjà chargés)
      updatedFlow.collaborators = currentFlow.collaborators;
      
      // Update local state
      setCurrentFlow(updatedFlow);
      setFlows(flows.map(f => f.id === updatedFlow.id ? updatedFlow : f));
      
      console.log("Flow saved successfully");
      return updatedFlow;
    } catch (err) {
      // Check if this is a permission error (403)
      if (err.response && err.response.status === 403) {
        console.log("Permission denied: User doesn't have rights to save this flow");
        setError("Vous n'avez pas la permission de sauvegarder ce flow");
      } else {
        console.error("Error saving flow:", err);
        setError(err.message || 'Failed to save flow');
      }
      
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
    if (!flowId) {
      console.log("Cannot update: No flow ID provided");
      return;
    }
    
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
      console.log("Flow properties updated successfully");
    } catch (err) {
      // Check if this is a permission error (403)
      if (err.response && err.response.status === 403) {
        console.log("Permission denied: User doesn't have rights to update this flow");
        setError("Vous n'avez pas la permission de modifier ce flow");
      } else {
        console.error("Error updating flow properties:", err);
        setError(err.message || 'Failed to update flow properties');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a flow
  const deleteFlow = async (flowId) => {
    if (!flowId) {
      console.log("Cannot delete: No flow ID provided");
      return;
    }
    
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
      
      console.log("Flow deleted successfully");
    } catch (err) {
      // Check if this is a permission error (403)
      if (err.response && err.response.status === 403) {
        console.log("Permission denied: User doesn't have rights to delete this flow");
        setError("Vous n'avez pas la permission de supprimer ce flow");
      } else {
        console.error("Error deleting flow:", err);
        setError(err.message || 'Failed to delete flow');
      }
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
    // If there's no current flow and the modal is open, don't allow closing it
    if (!currentFlow && showFlowModal) {
      return; // Keep the modal open
    }
    setShowFlowModal(!showFlowModal);
  };
  
  // Switch to a different version of the current flow
  const switchFlowVersion = async (versionIndex) => {
    if (!currentFlow) {
      console.log("Cannot switch version: No current flow selected");
      return null;
    }
    
    if (versionIndex < 0 || versionIndex > 2) {
      console.log(`Invalid version index: ${versionIndex}. Must be between 0 and 2.`);
      return null;
    }
    
    setLoading(true);
    setError(null);
    try {
      // Call the API to switch variants
      const apiFlow = await flowService.switchFlowVariant(currentFlow.id, versionIndex);
      
      // Normalize flow to ensure it has an id property
      const updatedFlow = { ...apiFlow, id: apiFlow._id || apiFlow.id };
      
      // Préserver le rôle utilisateur et les collaborateurs lors du changement de version
      updatedFlow.userRole = currentFlow.userRole;
      updatedFlow.collaborators = currentFlow.collaborators;
      
      // Update local state
      setCurrentFlow(updatedFlow);
      setFlows(flows.map(f => f.id === updatedFlow.id ? updatedFlow : f));
      
      console.log(`Switched to flow version ${versionIndex} successfully`);
      return updatedFlow;
    } catch (err) {
      // Check if this is a permission error (403)
      if (err.response && err.response.status === 403) {
        console.log("Permission denied: User doesn't have rights to switch flow versions");
        setError("Vous n'avez pas la permission de changer la version de ce flow");
      } else {
        console.error("Error switching flow version:", err);
        setError(err.message || 'Failed to switch flow version');
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get the current flow ID
  const currentFlowId = currentFlow?.id;

  // Set current flow ID in stores when flow changes
  useEffect(() => {
    if (currentFlow) {
      taskStore.clearCache();                       // 1) on vide
      taskStore.setCurrentFlowId(currentFlow.id);   // 2) on fixe le flow
      conditionStore.setCurrentFlowId(currentFlow.id);
      backendConfigStore.setCurrentFlowId(currentFlow.id);
      collaborationStore.setCurrentFlowId(currentFlow.id);
    }
  }, [currentFlow]);

  return (
    <FlowManagerContext.Provider
      value={{
        flows,
        currentFlow,
        setCurrentFlow,
        currentFlowId,
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
        refreshFlowsQuiet,
        clear,     // ← nouveau
      }}
    >
      {children}
    </FlowManagerContext.Provider>
  );
};

export default FlowManagerContext;
