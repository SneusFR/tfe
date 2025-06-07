import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  BugReport as DebugIcon
} from '@mui/icons-material';

// Level config for styling
const levelConfig = {
  info: { 
    icon: <InfoIcon fontSize="small" />,
    label: 'Info'
  },
  debug: { 
    icon: <DebugIcon fontSize="small" />,
    label: 'Debug'
  },
  warn: { 
    icon: <WarningIcon fontSize="small" />,
    label: 'Warning'
  },
  error: { 
    icon: <ErrorIcon fontSize="small" />,
    label: 'Error'
  },
};

const NodeDetailsPanel = ({ node, onClose }) => {
  if (!node) return null;
  
  const { id, data } = node;
  const { level, message, nodeType, timestamp, payload } = data;
  
  // Format date for display
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss', { locale: fr });
    } catch (e) {
      return dateString;
    }
  };
  
  // Format payload for display
  const formatPayload = (payload) => {
    if (!payload) return '';
    try {
      return JSON.stringify(JSON.parse(payload), null, 2);
    } catch (e) {
      return payload;
    }
  };
  
  // Copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };
  
  // Get level info
  const levelInfo = levelConfig[level] || levelConfig.info;
  
  // Parse payload to extract input and output
  const getInputOutput = (payload) => {
    if (!payload) return { input: null, output: null };
    
    try {
      const parsedPayload = typeof payload === 'string' ? JSON.parse(payload) : payload;
      return {
        input: parsedPayload.input,
        output: parsedPayload.output,
        prompt: parsedPayload.prompt
      };
    } catch (e) {
      return { input: null, output: null, prompt: null };
    }
  };
  
  const { input, output, prompt } = getInputOutput(payload);
  
  // Animation variants for sections
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.3 + (i * 0.1),
        duration: 0.4
      }
    })
  };

  return (
    <motion.div 
      className="node-details-panel"
      initial={{ x: 350, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 350, opacity: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      }}
    >
      <div className="node-details-header">
        <h3 className="node-details-title">Node Details</h3>
        <button className="node-details-close" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      
      <div className="node-details-content">
        {/* Basic info section */}
        <motion.div 
          className="node-details-section"
          custom={0}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <div className="node-details-section-title">Basic Information</div>
          <div className="node-details-section-content">
            <div>
              <span className={`level-badge ${level}`}>
                {levelInfo.icon} {levelInfo.label}
              </span>
            </div>
            
            <div style={{ marginTop: '8px' }}>
              <strong>Node ID:</strong> {id}
            </div>
            
            {nodeType && (
              <div style={{ marginTop: '4px' }}>
                <strong>Node Type:</strong> <span className="node-type-badge">{nodeType}</span>
              </div>
            )}
            
            {timestamp && (
              <div style={{ marginTop: '4px' }}>
                <strong>Timestamp:</strong> <span className="timestamp">{formatDate(timestamp)}</span>
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Message section */}
        <motion.div 
          className="node-details-section"
          custom={1}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <div className="node-details-section-title">
            Message
            <button 
              className="copy-button" 
              onClick={() => copyToClipboard(message)}
              title="Copy message"
            >
              <CopyIcon fontSize="small" />
            </button>
          </div>
          <div className="node-details-section-content">
            <pre>{message || <span className="empty">No message available</span>}</pre>
          </div>
        </motion.div>
        
        {/* Prompt section (for AI nodes) */}
        {prompt && (
          <motion.div 
            className="node-details-section"
            custom={2}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
          >
            <div className="node-details-section-title">
              Prompt
              <button 
                className="copy-button" 
                onClick={() => copyToClipboard(prompt)}
                title="Copy prompt"
              >
                <CopyIcon fontSize="small" />
              </button>
            </div>
            <div className="node-details-section-content">
              <pre>{prompt || <span className="empty">No prompt available</span>}</pre>
            </div>
          </motion.div>
        )}
        
        {/* Input section */}
        {input && (
          <motion.div 
            className="node-details-section"
            custom={3}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
          >
            <div className="node-details-section-title">
              Input
              <button 
                className="copy-button" 
                onClick={() => copyToClipboard(JSON.stringify(input, null, 2))}
                title="Copy input"
              >
                <CopyIcon fontSize="small" />
              </button>
            </div>
            <div className="node-details-section-content">
              <pre>{JSON.stringify(input, null, 2) || <span className="empty">No input available</span>}</pre>
            </div>
          </motion.div>
        )}
        
        {/* Output section */}
        {output && (
          <motion.div 
            className="node-details-section"
            custom={4}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
          >
            <div className="node-details-section-title">
              Output
              <button 
                className="copy-button" 
                onClick={() => copyToClipboard(typeof output === 'string' ? output : JSON.stringify(output, null, 2))}
                title="Copy output"
              >
                <CopyIcon fontSize="small" />
              </button>
            </div>
            <div className="node-details-section-content">
              <pre>{typeof output === 'string' ? output : JSON.stringify(output, null, 2) || <span className="empty">No output available</span>}</pre>
            </div>
          </motion.div>
        )}
        
        {/* Raw payload section */}
        {payload && !input && !output && (
          <motion.div 
            className="node-details-section"
            custom={5}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
          >
            <div className="node-details-section-title">
              Payload
              <button 
                className="copy-button" 
                onClick={() => copyToClipboard(formatPayload(payload))}
                title="Copy payload"
              >
                <CopyIcon fontSize="small" />
              </button>
            </div>
            <div className="node-details-section-content">
              <pre>{formatPayload(payload) || <span className="empty">No payload available</span>}</pre>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default NodeDetailsPanel;
