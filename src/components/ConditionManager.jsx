import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Tooltip, 
  Button,
  IconButton,
  Typography,
  Paper,
  Badge,
  CircularProgress
} from '@mui/material';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CodeIcon from '@mui/icons-material/Code';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import { useFlowManager } from '../context/FlowManagerContext';
import conditionStore from '../store/conditionStore';
import '../styles/ConditionManager.css';

const ConditionManager = () => {
  const [conditions, setConditions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [promptView, setPromptView] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Get the current flow
  const { currentFlow } = useFlowManager();

  // Update condition store when flow changes
  useEffect(() => {
    if (currentFlow) {
      conditionStore.setCurrentFlowId(currentFlow.id);
    }
  }, [currentFlow]);

  // Load conditions from store
  useEffect(() => {
    const loadConditions = async () => {
      setLoading(true);
      try {
        if (currentFlow) {
          await conditionStore.loadConditions();
        }
        const allConditions = conditionStore.getAllConditions();
        setConditions(allConditions);
      } catch (error) {
        console.error('Error loading conditions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConditions();
    
    // Set up an interval to refresh conditions regularly
    const intervalId = setInterval(() => {
      const allConditions = conditionStore.getAllConditions();
      setConditions(allConditions);
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, [currentFlow]);

  // Delete a condition
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this condition?')) {
      setLoading(true);
      try {
        await conditionStore.removeCondition(id);
        setConditions(conditionStore.getAllConditions());
      } catch (error) {
        console.error('Error deleting condition:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Copy OpenAI prompt to clipboard
  const copyPromptToClipboard = () => {
    const prompt = conditionStore.generateOpenAIPrompt();
    navigator.clipboard.writeText(prompt)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy prompt: ', err);
        alert('Failed to copy prompt. See console for details.');
      });
  };

  return (
    <div className="condition-manager">
      <motion.button 
        className="condition-manager-button"
        onClick={() => setIsOpen(true)}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        <ListAltIcon fontSize="small" />
        Manage Conditions ({conditions.length})
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="condition-manager-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="condition-manager-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="condition-manager-header">
                <Typography variant="h6" className="condition-manager-title">
                  Mail Conditions
                </Typography>
                <div className="condition-manager-actions">
                  <motion.button
                    className="view-toggle-button"
                    onClick={() => setPromptView(!promptView)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {promptView ? (
                      <>
                        <ListAltIcon fontSize="small" style={{ marginRight: '4px' }} />
                        View List
                      </>
                    ) : (
                      <>
                        <CodeIcon fontSize="small" style={{ marginRight: '4px' }} />
                        View Prompt
                      </>
                    )}
                  </motion.button>
                  <motion.button
                    className="close-button"
                    onClick={() => setIsOpen(false)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <CloseIcon fontSize="small" style={{ marginRight: '4px' }} />
                    Close
                  </motion.button>
                </div>
              </div>

              {promptView ? (
                <div className="prompt-view">
                  <textarea
                    readOnly
                    value={conditionStore.generateOpenAIPrompt()}
                    className="prompt-textarea"
                  />
                  <motion.button
                    className="copy-button"
                    onClick={copyPromptToClipboard}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    animate={copySuccess ? { backgroundColor: '#27ae60' } : {}}
                  >
                    {copySuccess ? (
                      <>
                        Copied!
                      </>
                    ) : (
                      <>
                        <ContentCopyIcon fontSize="small" />
                        Copy to Clipboard
                      </>
                    )}
                  </motion.button>
                </div>
              ) : (
                <>
                  {conditions.length === 0 ? (
                    <div className="empty-conditions">
                      <Typography variant="body1">
                        No conditions created yet.
                      </Typography>
                    </div>
                  ) : (
                    <table className="conditions-table">
                      <thead>
                        <tr>
                          <th>Mail Type</th>
                          <th>Return</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conditions.map((condition) => (
                          <motion.tr 
                            key={condition.id} 
                            draggable={true}
                            onDragStart={(e) => {
                              // Set the condition ID as drag data
                              e.dataTransfer.setData('application/conditionId', condition.id);
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            className="draggable-condition"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            whileHover={{ backgroundColor: '#f5f5f5' }}
                          >
                            <td className="condition-text-cell">
                              <div className="condition-text-content">
                                {condition.conditionText}
                              </div>
                            </td>
                            <td className="condition-text-cell">
                              <div className="condition-text-content">
                                {condition.returnText}
                              </div>
                            </td>
                            <td>
                              <div className="condition-actions">
                                <Tooltip title="Drag to add to diagram" arrow>
                                  <motion.button
                                    className="drag-button"
                                    onMouseDown={(e) => {
                                      // Prevent button click when starting drag
                                      e.stopPropagation();
                                    }}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <DragIndicatorIcon fontSize="small" />
                                  </motion.button>
                                </Tooltip>
                                <Tooltip title="Delete condition" arrow>
                                  <motion.button
                                    className="delete-button"
                                    onClick={() => handleDelete(condition.id)}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </motion.button>
                                </Tooltip>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConditionManager;
