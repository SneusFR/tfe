import React from 'react';
import { motion } from 'framer-motion';
import { useFlowManager } from '../context/FlowManagerContext';
import '../styles/FlowMenuButton.css';

const FlowMenuButton = () => {
  const { toggleFlowModal, currentFlow, saveCurrentFlow } = useFlowManager();
  
  const handleSaveFlow = () => {
    // This function will be connected to the backend later
    // For now, just call the saveCurrentFlow function
    if (currentFlow) {
      // We're passing the current nodes and edges which would normally come from the diagram
      // In a real implementation, you would get these from the diagram editor
      const currentVersion = currentFlow.versions[currentFlow.currentVersionIndex];
      saveCurrentFlow(currentVersion.nodes, currentVersion.edges);
      alert('Flow saved successfully!');
    } else {
      alert('No flow to save!');
    }
  };

  return (
    <motion.div 
      className="flow-menu-button-container"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flow-buttons-wrapper">
        <motion.button
          className="flow-save-button"
          onClick={handleSaveFlow}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Save current flow"
        >
          <div className="flow-menu-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" />
            </svg>
          </div>
          <span className="save-button-label">Save</span>
        </motion.button>
        
        <motion.button
          className="flow-menu-button"
          onClick={toggleFlowModal}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="flow-menu-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
              <path d="M7 12h2v5H7zm4-7h2v12h-2zm4 4h2v8h-2z" />
            </svg>
          </div>
          <div className="flow-menu-text">
            <span className="flow-menu-label">Flow Menu</span>
            {currentFlow && (
              <span className="current-flow-name">{currentFlow.name}</span>
            )}
          </div>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default FlowMenuButton;
