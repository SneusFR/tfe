import React from 'react';
import { motion } from 'framer-motion';
import { useFlowManager } from '../context/FlowManagerContext';
import { Tooltip } from '@mui/material';
import '../styles/FlowVersionSelector.css';

const FlowVersionSelector = () => {
  const { currentFlow, switchFlowVersion, loading, error } = useFlowManager();

  // If there's no current flow, don't render anything
  if (!currentFlow) {
    return null;
  }

  // Get the current version index
  const currentVersionIndex = currentFlow.currentVersionIndex || 0;

  // Handle version selection
  const handleVersionSelect = async (versionIndex) => {
    if (versionIndex !== currentVersionIndex && !loading) {
      await switchFlowVersion(versionIndex);
    }
  };

  return (
    <motion.div 
      className="flow-version-selector"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {[0, 1, 2].map((versionIndex) => {
        // Get the version data
        const version = currentFlow.versions?.[versionIndex];
        const hasContent = version && (version.nodes?.length > 0 || version.edges?.length > 0);
        const lastSaved = version?.savedAt ? new Date(version.savedAt).toLocaleString() : 'Never saved';
        
        return (
          <Tooltip 
            key={versionIndex}
            title={`Version ${versionIndex + 1}${hasContent ? ' (Has content)' : ' (Empty)'}\nLast saved: ${lastSaved}`}
            arrow
            placement="top"
          >
            <motion.div
              className={`version-circle ${versionIndex === currentVersionIndex ? 'active' : ''} ${loading && versionIndex !== currentVersionIndex ? 'disabled' : ''}`}
              onClick={() => handleVersionSelect(versionIndex)}
              whileHover={{ scale: loading ? 1.0 : 1.1 }}
              whileTap={{ scale: loading ? 1.0 : 0.95 }}
            >
              {loading && versionIndex === currentVersionIndex ? (
                <span className="loading-indicator">...</span>
              ) : (
                versionIndex + 1
              )}
            </motion.div>
          </Tooltip>
        );
      })}
      
      {error && (
        <div className="version-error">
          <Tooltip title={error} arrow placement="bottom">
            <span>!</span>
          </Tooltip>
        </div>
      )}
    </motion.div>
  );
};

export default FlowVersionSelector;
