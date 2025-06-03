import React, { createContext, useContext, useState, useEffect } from 'react';

// Create context
const NodeFieldsContext = createContext();

// Default fields for different node types
const DEFAULT_FIELDS = {
  conditionNode: [
    'Email ID',
    'FromEmail',
    'FromDisplayName',
    'ToEmail',
    'ToDisplayName',
    'Subject',
    'Date',
    'Content',
    'Attachment ID'
  ],
  // Add other node types as needed
};

// Default visible fields (initially all fields are visible)
const getDefaultVisibleFields = (nodeType) => {
  return DEFAULT_FIELDS[nodeType] || [];
};

export const NodeFieldsProvider = ({ children }) => {
  // State to store visible fields for each node
  const [nodeVisibleFields, setNodeVisibleFields] = useState({});
  
  // Load saved preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem('nodeVisibleFields');
      if (savedPreferences) {
        setNodeVisibleFields(JSON.parse(savedPreferences));
      }
    } catch (error) {
      console.error('Error loading node field preferences:', error);
    }
  }, []);
  
  // Save preferences to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('nodeVisibleFields', JSON.stringify(nodeVisibleFields));
    } catch (error) {
      console.error('Error saving node field preferences:', error);
    }
  }, [nodeVisibleFields]);
  
  // Get visible fields for a specific node
  const getVisibleFields = (nodeId, nodeType) => {
    // If node has specific preferences, use those
    if (nodeVisibleFields[nodeId]) {
      return nodeVisibleFields[nodeId];
    }
    
    // Otherwise return all fields for that node type
    return getDefaultVisibleFields(nodeType);
  };
  
  // Update visible fields for a specific node
  const updateVisibleFields = (nodeId, fields) => {
    setNodeVisibleFields(prev => ({
      ...prev,
      [nodeId]: fields
    }));
  };
  
  // Get all available fields for a node type
  const getAvailableFields = (nodeType) => {
    return DEFAULT_FIELDS[nodeType] || [];
  };
  
  // Reset to default (all fields visible)
  const resetToDefault = (nodeId, nodeType) => {
    updateVisibleFields(nodeId, getDefaultVisibleFields(nodeType));
  };
  
  // Value object to be provided by the context
  const value = {
    getVisibleFields,
    updateVisibleFields,
    getAvailableFields,
    resetToDefault
  };
  
  return (
    <NodeFieldsContext.Provider value={value}>
      {children}
    </NodeFieldsContext.Provider>
  );
};

// Custom hook to use the context
export const useNodeFields = () => {
  const context = useContext(NodeFieldsContext);
  if (!context) {
    throw new Error('useNodeFields must be used within a NodeFieldsProvider');
  }
  return context;
};
