import React from 'react';
import { motion } from 'framer-motion';
import { useFlowManager } from '../context/FlowManagerContext';
import '../styles/FlowVersionSelector.css';

const FlowVersionSelector = () => {
  const { currentFlow, switchFlowVersion } = useFlowManager();

  // If there's no current flow, don't render anything
  if (!currentFlow) {
    return null;
  }

  // Get the current version index
  const currentVersionIndex = currentFlow.currentVersionIndex || 0;

  // Handle version selection
  const handleVersionSelect = (versionIndex) => {
    if (versionIndex !== currentVersionIndex) {
      switchFlowVersion(versionIndex);
    }
  };

  return (
    <motion.div 
      className="flow-version-selector"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {[0, 1, 2].map((versionIndex) => (
        <motion.div
          key={versionIndex}
          className={`version-circle ${versionIndex === currentVersionIndex ? 'active' : ''}`}
          onClick={() => handleVersionSelect(versionIndex)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {versionIndex + 1}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default FlowVersionSelector;
