import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlowManager } from '../context/FlowManagerContext';
import '../styles/FlowModal.css';

const FlowModal = () => {
  const {
    flows,
    showFlowModal,
    createFlow,
    loadFlow,
    toggleFlowModal,
  } = useFlowManager();

  const [view, setView] = useState('main'); // 'main', 'create', 'load'
  const [flowName, setFlowName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [collaboratorInput, setCollaboratorInput] = useState('');

  // Reset state when modal is opened
  useEffect(() => {
    if (showFlowModal) {
      setView('main');
      setFlowName('');
      setSearchTerm('');
      setCollaborators([]);
      setCollaboratorInput('');
    }
  }, [showFlowModal]);

  // Handle flow creation
  const handleCreateFlow = () => {
    if (flowName.trim()) {
      createFlow(flowName, collaborators);
    }
  };

  // Handle adding a collaborator
  const handleAddCollaborator = () => {
    if (collaboratorInput.trim() && !collaborators.includes(collaboratorInput.trim())) {
      setCollaborators([...collaborators, collaboratorInput.trim()]);
      setCollaboratorInput('');
    }
  };

  // Handle removing a collaborator
  const handleRemoveCollaborator = (collaborator) => {
    setCollaborators(collaborators.filter(c => c !== collaborator));
  };

  // Filter flows based on search term
  const filteredFlows = flows.filter(flow => 
    flow.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { y: -50, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', damping: 25, stiffness: 500 } },
    exit: { y: 50, opacity: 0 },
  };

  const listItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({ 
      opacity: 1, 
      y: 0, 
      transition: { 
        delay: i * 0.05,
        duration: 0.3,
      } 
    }),
  };

  return (
    <AnimatePresence>
      {showFlowModal && (
        <motion.div 
          className="flow-modal-overlay"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={overlayVariants}
        >
          <motion.div 
            className="flow-modal"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Main View */}
            {view === 'main' && (
              <div className="flow-modal-content">
                <h2>Flow Manager</h2>
                <p>Create a new flow or load an existing one</p>
                
                <div className="flow-modal-buttons">
                  <motion.button 
                    className="flow-button create"
                    onClick={() => setView('create')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Create New Flow
                  </motion.button>
                  <motion.button 
                    className="flow-button load"
                    onClick={() => setView('load')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={flows.length === 0}
                  >
                    Load Existing Flow
                  </motion.button>
                </div>
                
                {flows.length === 0 && (
                  <p className="no-flows-message">No flows available. Create your first flow!</p>
                )}
                
                <motion.button 
                  className="close-button"
                  onClick={toggleFlowModal}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ×
                </motion.button>
              </div>
            )}
            
            {/* Create Flow View */}
            {view === 'create' && (
              <div className="flow-modal-content">
                <h2>Create New Flow</h2>
                
                <div className="form-group">
                  <label htmlFor="flow-name">Flow Name</label>
                  <input
                    id="flow-name"
                    type="text"
                    value={flowName}
                    onChange={(e) => setFlowName(e.target.value)}
                    placeholder="Enter flow name"
                    autoFocus
                  />
                </div>
                
                <div className="form-group">
                  <label>Collaborators (Optional)</label>
                  <div className="collaborator-input-container">
                    <input
                      type="text"
                      value={collaboratorInput}
                      onChange={(e) => setCollaboratorInput(e.target.value)}
                      placeholder="Add collaborator"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCollaborator();
                        }
                      }}
                    />
                    <motion.button
                      onClick={handleAddCollaborator}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={!collaboratorInput.trim()}
                    >
                      Add
                    </motion.button>
                  </div>
                  
                  {collaborators.length > 0 && (
                    <div className="collaborators-list">
                      <AnimatePresence>
                        {collaborators.map((collaborator, index) => (
                          <motion.div
                            key={collaborator}
                            className="collaborator-tag"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                          >
                            {collaborator}
                            <button 
                              onClick={() => handleRemoveCollaborator(collaborator)}
                              className="remove-collaborator"
                            >
                              ×
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
                
                <div className="modal-actions">
                  <motion.button 
                    className="secondary-button"
                    onClick={() => setView('main')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Back
                  </motion.button>
                  <motion.button 
                    className="primary-button"
                    onClick={handleCreateFlow}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={!flowName.trim()}
                  >
                    Create Flow
                  </motion.button>
                </div>
                
                <motion.button 
                  className="close-button"
                  onClick={toggleFlowModal}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ×
                </motion.button>
              </div>
            )}
            
            {/* Load Flow View */}
            {view === 'load' && (
              <div className="flow-modal-content">
                <h2>Load Flow</h2>
                
                <div className="search-container">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search flows..."
                    autoFocus
                  />
                </div>
                
                <div className="flows-grid">
                  <AnimatePresence>
                    {filteredFlows.length > 0 ? (
                      filteredFlows.map((flow, index) => (
                        <motion.div
                          key={flow.id}
                          className="flow-card"
                          custom={index}
                          variants={listItemVariants}
                          initial="hidden"
                          animate="visible"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => loadFlow(flow.id)}
                        >
                          <div className="flow-thumbnail">
                            {flow.thumbnail ? (
                              <div className="thumbnail-stats">
                                <span>{flow.thumbnail.nodeCount} nodes</span>
                                <span>{flow.thumbnail.edgeCount} connections</span>
                              </div>
                            ) : (
                              <div className="empty-thumbnail">No preview</div>
                            )}
                          </div>
                          <div className="flow-info">
                            <h3>{flow.name}</h3>
                            <p>Last updated: {new Date(flow.updatedAt).toLocaleDateString()}</p>
                            {flow.collaborators.length > 0 && (
                              <div className="collaborators">
                                <span>{flow.collaborators.length} collaborator(s)</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="no-flows-found">
                        <p>No flows found matching "{searchTerm}"</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="modal-actions">
                  <motion.button 
                    className="secondary-button"
                    onClick={() => setView('main')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Back
                  </motion.button>
                </div>
                
                <motion.button 
                  className="close-button"
                  onClick={toggleFlowModal}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ×
                </motion.button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FlowModal;
