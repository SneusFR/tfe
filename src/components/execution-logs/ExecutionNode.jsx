import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';

const ExecutionNode = ({ data, isConnectable, selected }) => {
  const { label, nodeType, level, timestamp } = data;
  
  // Determine node class based on node type
  const nodeClass = `node-${nodeType || 'default'}`;
  
  // Animation variants
  const nodeVariants = {
    initial: { opacity: 0, y: 20, scale: 0.9 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: 0.1
      }
    }
  };
  
  return (
    <motion.div 
      className={`execution-node ${nodeClass} ${selected ? 'selected' : ''}`}
      initial="initial"
      animate="animate"
      variants={nodeVariants}
      whileHover={{ 
        scale: 1.03,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        transition: { duration: 0.2 }
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      
      <motion.div 
        className="execution-node-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <div className="execution-node-label">{label}</div>
        {nodeType && (
          <div className="execution-node-type">{nodeType}</div>
        )}
      </motion.div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
    </motion.div>
  );
};

export default memo(ExecutionNode);
