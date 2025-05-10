import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../context/AuthContext';
import { useFlowManager } from '../context/FlowManagerContext';
import { useFlowAccess } from '../hooks/useFlowAccess';
import collaborationStore from '../store/collaborationStore';
import './CollaboratorsManager.css';

const CollaboratorsManager = ({ onClose }) => {
  const { user } = useAuth();
  const { currentFlow, refreshFlows } = useFlowManager();
  const { userRole } = useFlowAccess();
  
  const [collaborators, setCollaborators] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('editor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Load collaborators from the store
  useEffect(() => {
    const loadCollaborators = async () => {
      if (!currentFlow) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const collabs = await collaborationStore.getByFlow(currentFlow.id, { forceRefresh: true });
        setCollaborators(collabs);
      } catch (err) {
        console.error('Error loading collaborators:', err);
        setError('Failed to load collaborators');
      } finally {
        setLoading(false);
      }
    };
    
    loadCollaborators();
  }, [currentFlow]);
  
  // Handle adding a new collaborator
  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    
    if (!newEmail.trim()) {
      setError('Email is required');
      return;
    }
    
    // Check if user has owner permissions
    if (userRole !== 'owner') {
      console.log("Permission denied: User doesn't have owner rights to add collaborators");
      setError("Vous n'avez pas la permission d'ajouter des collaborateurs à ce flow");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Check if the collaborator already exists
      const exists = collaborators.some(c => c.user?.email?.toLowerCase() === newEmail.toLowerCase());
      if (exists) {
        setError('This collaborator is already added to the flow');
        setLoading(false);
        return;
      }
      
      // Add the collaborator
      await collaborationStore.add({
        flowId: currentFlow.id,
        email: newEmail.trim(),
        role: newRole.toLowerCase()
      });
      
      // Refresh collaborators and flows
      await collaborationStore.getByFlow(currentFlow.id, { forceRefresh: true });
      await refreshFlows();
      
      // Clear the form
      setNewEmail('');
      setSuccess('Collaborator added successfully');
    } catch (err) {
      console.error('Error adding collaborator:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to add collaborator. The email may not exist in the system.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle removing a collaborator
  const handleRemoveCollaborator = async (collaborationId) => {
    // Check if user has owner permissions
    if (userRole !== 'owner') {
      console.log("Permission denied: User doesn't have owner rights to remove collaborators");
      setError("Vous n'avez pas la permission de supprimer des collaborateurs de ce flow");
      return;
    }
    
    if (!window.confirm('Are you sure you want to remove this collaborator?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await collaborationStore.remove(collaborationId);
      
      // Refresh collaborators and flows
      await collaborationStore.getByFlow(currentFlow.id, { forceRefresh: true });
      await refreshFlows();
      
      setSuccess('Collaborator removed successfully');
    } catch (err) {
      console.error('Error removing collaborator:', err);
      setError('Failed to remove collaborator');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle changing a collaborator's role
  const handleRoleChange = async (collaborationId, newRole) => {
    // Check if user has owner permissions
    if (userRole !== 'owner') {
      console.log("Permission denied: User doesn't have owner rights to change collaborator roles");
      setError("Vous n'avez pas la permission de modifier les rôles des collaborateurs de ce flow");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await collaborationStore.update(collaborationId, {
        role: newRole.toLowerCase()
      });
      
      // Refresh collaborators and flows
      await collaborationStore.getByFlow(currentFlow.id, { forceRefresh: true });
      await refreshFlows();
      
      setSuccess('Collaborator role updated successfully');
    } catch (err) {
      console.error('Error updating collaborator role:', err);
      setError('Failed to update collaborator role');
    } finally {
      setLoading(false);
    }
  };
  
  // Use the userRole from the hook
  const isOwner = userRole === 'owner';
  
  return (
    <div className="collaborators-manager">
      <div className="collaborators-manager-header">
        <Typography variant="h6">Manage Collaborators</Typography>
        <IconButton onClick={onClose} className="close-button">
          <span>×</span>
        </IconButton>
      </div>
      
      {error && (
        <Alert severity="error" className="alert" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" className="alert" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      <div className="collaborators-list">
        <Typography variant="subtitle1" className="section-title">
          Current Collaborators
        </Typography>
        
        {collaborators.length === 0 ? (
          <Typography variant="body2" className="no-collaborators">
            No collaborators yet
          </Typography>
        ) : (
          <table className="collaborators-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                {isOwner && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {collaborators.map((collaborator) => (
                <motion.tr 
                  key={collaborator.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <td>{collaborator.user?.email}</td>
                  <td>
                    {collaborator.role === 'owner' ? (
                      <span className="role owner">Owner</span>
                    ) : isOwner ? (
                      <FormControl size="small" fullWidth>
                        <Select
                          value={collaborator.role}
                          onChange={(e) => handleRoleChange(collaborator.id, e.target.value)}
                          disabled={loading}
                        >
                          <MenuItem value="editor">Editor</MenuItem>
                          <MenuItem value="viewer">Viewer</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <span className={`role ${collaborator.role}`}>
                        {collaborator.role.charAt(0).toUpperCase() + collaborator.role.slice(1)}
                      </span>
                    )}
                  </td>
                  {isOwner && (
                    <td>
                      {collaborator.role !== 'owner' && (
                        <IconButton 
                          onClick={() => handleRemoveCollaborator(collaborator.id)}
                          disabled={loading}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {isOwner && (
        <div className="add-collaborator-form">
          <Typography variant="subtitle1" className="section-title">
            Add New Collaborator
          </Typography>
          
          <form onSubmit={handleAddCollaborator}>
            <div className="form-row">
              <TextField
                label="Email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                fullWidth
                required
                disabled={loading}
                placeholder="Enter email address"
                className="email-input"
              />
              
              <FormControl className="role-select">
                <InputLabel>Role</InputLabel>
                <Select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  label="Role"
                  disabled={loading}
                >
                  <MenuItem value="editor">Editor</MenuItem>
                  <MenuItem value="viewer">Viewer</MenuItem>
                </Select>
              </FormControl>
              
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={loading || !newEmail.trim()}
                className="add-button"
              >
                {loading ? <CircularProgress size={24} /> : 'Add'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CollaboratorsManager;
