import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlowManager } from '../context/FlowManagerContext';
import { useAuth } from '../context/AuthContext';
import { useFlowAccess } from '../hooks/useFlowAccess.js';
import CollaboratorsManager from './CollaboratorsManager';
import FlowPreview from './FlowPreview';
import '../styles/FlowModal.css';

const FlowModal = () => {
  const {
    flows,
    showFlowModal,
    createFlow,
    loadFlow,
    toggleFlowModal,
    loading,
    error,
    refreshFlows,
    deleteFlow,
    setCurrentFlow
  } = useFlowManager();
  
  const { isAuthenticated, user } = useAuth();
  const { hasAccess: canManageCollaborators } = useFlowAccess('editor');

  const [view, setView] = useState('main'); // 'main', 'create', 'load'
  const [flowName, setFlowName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [collaboratorInput, setCollaboratorInput] = useState('');
  const [flowToDelete, setFlowToDelete] = useState(null);
  const [showCollaboratorsManager, setShowCollaboratorsManager] = useState(false);

  // Reset state when modal is opened
  useEffect(() => {
    if (showFlowModal) {
      setView('main');
      setFlowName('');
      setSearchTerm('');
      setCollaborators([]);
      setCollaboratorInput('');
      setFlowToDelete(null);
      
      // We don't need to call refreshFlows here as it's already called when the user logs in
      // and when flows are added or deleted
    }
  }, [showFlowModal]);

  // Handle flow creation
  const handleCreateFlow = async () => {
    if (flowName.trim()) {
      await createFlow(flowName, collaborators);
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

  // Handle flow deletion
  const handleDeleteFlow = async () => {
    if (flowToDelete) {
      try {
        await deleteFlow(flowToDelete.id);
        setFlowToDelete(null);
      } catch (err) {
        console.error('Error deleting flow:', err);
      }
    }
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
                
                {error && (
                  <div className="error-message">
                    <p>{error}</p>
                  </div>
                )}
                
                <div className="flow-modal-buttons">
                  <motion.button 
                    className="flow-button create"
                    onClick={() => setView('create')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Create New Flow'}
                  </motion.button>
                  <motion.button 
                    className="flow-button load"
                    onClick={() => setView('load')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={flows.length === 0 || loading}
                  >
                    {loading ? 'Loading...' : 'Load Existing Flow'}
                  </motion.button>
                </div>
                
                {flows.length === 0 && (
                  <p className="no-flows-message">No flows available. Create your first flow!</p>
                )}
                
                {/* Only show close button if there's a current flow */}
                {/* Close button removed to force flow selection */}
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
                    disabled={loading}
                  >
                    Back
                  </motion.button>
                  <motion.button 
                    className="primary-button"
                    onClick={handleCreateFlow}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={!flowName.trim() || loading}
                  >
                    {loading ? 'Creating...' : 'Create Flow'}
                  </motion.button>
                </div>
                
                {error && (
                  <div className="error-message">
                    <p>{error}</p>
                  </div>
                )}
                
                {/* Only show close button if there's a current flow */}
                {/* Close button removed to force flow selection */}
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
                  {loading ? (
                    <div className="loading-indicator">
                      <p>Loading flows...</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {filteredFlows.length > 0 ? (
                        // Use a Set to track flow IDs we've already rendered to avoid duplicates
                        filteredFlows.filter((flow, index, self) => 
                          // Only keep the first occurrence of each flow.id
                          index === self.findIndex(f => f.id === flow.id)
                        ).map((flow, index) => (
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
                              <FlowPreview 
                                nodes={flow.thumbnail?.nodes || flow.versions?.[flow.currentVersionIndex || 0]?.nodes || []}
                                edges={flow.thumbnail?.edges || flow.versions?.[flow.currentVersionIndex || 0]?.edges || []}
                                width={240}
                                height={120}
                              />
                            </div>
                            <div className="flow-info">
                              <h3>{flow.name}</h3>
                              <p>Last updated: {new Date(flow.updatedAt).toLocaleDateString()}</p>
                              {flow.collaborators && flow.collaborators.length > 0 && (
                                <div className="collaborators">
                                  <span>{flow.collaborators.length} collaborator(s)</span>
                                </div>
                              )}
                              <div className="flow-card-actions">
                              {canManageCollaborators && (
                                <motion.button
                                  className="manage-collaborators-button"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent card click
                                    setCurrentFlow(flow);
                                    setShowCollaboratorsManager(true);
                                  }}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  Manage Collaborators
                                </motion.button>
                              )}
                                <motion.button
                                  className="delete-flow-button"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent card click
                                    setFlowToDelete(flow);
                                  }}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  Delete
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="no-flows-found">
                          <p>No flows found matching "{searchTerm}"</p>
                        </div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
                
                <div className="modal-actions">
                  <motion.button 
                    className="secondary-button"
                    onClick={() => setView('main')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={loading}
                  >
                    Back
                  </motion.button>
                </div>
                
                {error && (
                  <div className="error-message">
                    <p>{error}</p>
                  </div>
                )}
                
                {/* Only show close button if there's a current flow */}
                {/* Close button removed to force flow selection */}
              </div>
            )}

            {/* Collaborators Manager Dialog */}
            {showCollaboratorsManager && (
              <div className="modal-overlay">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="modal-container"
                >
                  <CollaboratorsManager onClose={() => setShowCollaboratorsManager(false)} />
                </motion.div>
              </div>
            )}

            {/* Delete Flow Confirmation Dialog */}
            {flowToDelete && (
              <div className="delete-confirmation-overlay">
                <motion.div 
                  className="delete-confirmation-dialog"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                >
                  <h3>Delete Flow</h3>
                  <p>Are you sure you want to delete the flow "{flowToDelete.name}"?</p>
                  <p className="warning">This action cannot be undone.</p>
                  
                  <div className="confirmation-actions">
                    <motion.button
                      className="cancel-button"
                      onClick={() => setFlowToDelete(null)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      className="delete-button"
                      onClick={handleDeleteFlow}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={loading}
                    >
                      {loading ? 'Deleting...' : 'Delete'}
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FlowModal;
