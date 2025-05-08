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
import './CollaboratorsManager.css';

const CollaboratorsManager = ({ onClose }) => {
  const { api, user } = useAuth();
  const { currentFlow, refreshFlows } = useFlowManager();
  
  const [collaborators, setCollaborators] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('editor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Load collaborators from the current flow
  useEffect(() => {
    if (currentFlow && currentFlow.collaborators) {
      setCollaborators(currentFlow.collaborators);
    }
  }, [currentFlow]);
  
  // Handle adding a new collaborator
  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    
    if (!newEmail.trim()) {
      setError('Email is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Check if the collaborator already exists
      const exists = collaborators.some(c => c.email.toLowerCase() === newEmail.toLowerCase());
      if (exists) {
        setError('This collaborator is already added to the flow');
        setLoading(false);
        return;
      }
      
      // Add the collaborator
      await api.post('/api/collaborations', {
        flowId: currentFlow.id,
        email: newEmail.trim(),
        role: newRole.toLowerCase()
      });
      
      // Refresh the flow to get updated collaborators
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
    if (!window.confirm('Are you sure you want to remove this collaborator?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await api.delete(`/api/collaborations/${collaborationId}`);
      
      // Refresh the flow to get updated collaborators
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
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await api.patch(`/api/collaborations/${collaborationId}`, {
        role: newRole.toLowerCase()
      });
      
      // Refresh the flow to get updated collaborators
      await refreshFlows();
      
      setSuccess('Collaborator role updated successfully');
    } catch (err) {
      console.error('Error updating collaborator role:', err);
      setError('Failed to update collaborator role');
    } finally {
      setLoading(false);
    }
  };
  
  // Get the current user's role in the flow
  const getCurrentUserRole = () => {
    if (!currentFlow || !currentFlow.collaborators) return null;
    
    const userEmail = user?.email;
    if (!userEmail) return null;
    
    const userCollaboration = currentFlow.collaborators.find(c => 
      c.email.toLowerCase() === userEmail.toLowerCase()
    );
    
    return userCollaboration ? userCollaboration.role : null;
  };
  
  const userRole = getCurrentUserRole();
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
                  <td>{collaborator.email}</td>
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
