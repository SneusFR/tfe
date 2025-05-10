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

  return (
    <motion.div
      className="flow-menu-button-container"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flow-buttons-wrapper">
        {userRole && (
          <Chip
            label={userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            color={userRole === 'owner' ? 'primary' : userRole === 'editor' ? 'success' : 'default'}
            size="small"
            className="role-chip"
            style={{ marginRight: '10px' }}
          />
        )}
        
        <motion.button
          className={`flow-save-button ${loading ? 'loading' : ''}`}
          onClick={handleSave}
          whileHover={{ scale: loading || !hasAccess ? 1 : 1.05 }}
          whileTap={{ scale: loading || !hasAccess ? 1 : 0.95 }}
          disabled={loading || !currentFlow || !hasAccess}
          title={!hasAccess ? "You need editor or owner permissions to save" : ""}
        >
          {loading ? 'Saving…' : 'Save'}
        </motion.button>

        <motion.button
          className="flow-menu-button"
          onClick={toggleFlowModal}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={loading}
        >
          Flow Menu
        </motion.button>
      </div>

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
    </motion.div>
  );
};

export default FlowMenuButton;
