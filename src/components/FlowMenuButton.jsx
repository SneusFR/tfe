// FlowMenuButton.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useReactFlow } from 'reactflow';
import { Snackbar, Alert, Chip } from '@mui/material';
import { useFlowManager } from '../context/FlowManagerContext';
import { useFlowAccess } from '../hooks/useFlowAccess';
import '../styles/FlowMenuButton.css';

const FlowMenuButton = () => {
  const { getNodes, getEdges } = useReactFlow();
  const { toggleFlowModal, currentFlow, saveCurrentFlow, loading } = useFlowManager();
  const { hasAccess, userRole } = useFlowAccess('editor');

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('success');

  const handleSave = async () => {
    if (!currentFlow) {
      setMessage('No flow to save!');
      setSeverity('warning');
      setOpen(true);
      return;
    }
    
    if (!hasAccess) {
      console.log("Permission denied: User doesn't have editor rights to save the flow");
      setMessage("Vous n'avez pas la permission de sauvegarder ce flow");
      setSeverity('error');
      setOpen(true);
      return;
    }
    
    try {
      const nodes = getNodes();
      const edges = getEdges();
      await saveCurrentFlow(nodes, edges);
      setMessage('Flow saved successfully!');
      setSeverity('success');
    } catch (err) {
      setMessage(err.message || 'Failed to save flow');
      setSeverity('error');
    }
    setOpen(true);
  };

  // We don't render the buttons here anymore as they're now in the top panel
  return (
    <div style={{ display: 'none' }}>
      {/* Hidden component - functionality moved to top panel */}
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setOpen(false)} severity={severity} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default FlowMenuButton;
