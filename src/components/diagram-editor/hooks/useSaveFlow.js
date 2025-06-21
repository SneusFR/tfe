import { useState, useCallback } from 'react';

/**
 * Custom hook to handle flow saving functionality
 * Manages the save operation and snackbar notifications
 */
export function useSaveFlow({
  currentFlow,
  nodes,
  edges,
  canEdit,
  saveCurrentFlow
}) {
  // State for loading indicator
  const [loading, setLoading] = useState(false);
  
  // State for snackbar
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('success');
  const [open, setOpen] = useState(false);
  
  // Handle save function
  const handleSave = useCallback(async () => {
    if (!currentFlow) {
      setMessage('No flow to save!');
      setSeverity('warning');
      setOpen(true);
      return;
    }
    
    if (!canEdit) {
      console.log("Permission denied: User doesn't have editor rights to save the flow");
      setMessage("Vous n'avez pas la permission de sauvegarder ce flow");
      setSeverity('error');
      setOpen(true);
      return;
    }
    
    setLoading(true);
    try {
      await saveCurrentFlow(nodes, edges);
      setMessage('Flow saved successfully!');
      setSeverity('success');
    } catch (err) {
      setMessage(err.message || 'Failed to save flow');
      setSeverity('error');
    } finally {
      setLoading(false);
      setOpen(true);
    }
  }, [currentFlow, nodes, edges, canEdit, saveCurrentFlow]);
  
  // Snackbar props for easy passing to Snackbar component
  const snackbarProps = {
    open,
    message,
    severity,
    onClose: () => setOpen(false)
  };
  
  return {
    handleSave,
    loading,
    snackbarProps,
    setMessage,
    setSeverity,
    setOpen
  };
}
