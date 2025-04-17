import React from 'react';
import { motion } from 'framer-motion';
import { useFlowManager } from '../context/FlowManagerContext';
import '../styles/FlowMenuButton.css';

const FlowMenuButton = () => {
  const { toggleFlowModal, currentFlow } = useFlowManager();

  return (
    <motion.div 
      className="flow-menu-button-container"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
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
    </motion.div>
  );
};

export default FlowMenuButton;
