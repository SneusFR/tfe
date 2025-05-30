import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tooltip, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { useFlowAccess } from '../../hooks/useFlowAccess';

const ApiNodesTab = ({ 
  apiInventoryNodes = []
}) => {
  const { hasAccess: canEdit } = useFlowAccess('editor');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter API nodes based on search query
  const filteredApiNodes = apiInventoryNodes.filter(node => 
    node.data.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (node.data.summary && node.data.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
    node.data.method.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper function to get color based on HTTP method
  const getMethodColor = (method) => {
    const methodColors = {
      get: '#61affe',    // Blue
      post: '#49cc90',   // Green
      put: '#fca130',    // Orange
      delete: '#f93e3e', // Red
      patch: '#50e3c2',  // Teal
      options: '#0d5aa7', // Dark Blue
      head: '#9012fe',   // Purple
    };
    
    return methodColors[method] || '#999';
  };

  return (
    <div className="tab-content">
      <div className="section-header">
        <h3>API Nodes</h3>
        <Chip 
          label={`${apiInventoryNodes.length} endpoints available`}
          size="small"
          color="primary"
          variant="outlined"
        />
      </div>
      
      {/* Search Bar */}
      <div className="search-container" style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search API endpoints..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
        {searchQuery && (
          <motion.button 
            className="clear-search-button"
            onClick={() => setSearchQuery('')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <ClearIcon fontSize="small" />
          </motion.button>
        )}
      </div>

      <div className="nodes-list" style={{ 
        maxHeight: 'calc(100vh - 200px)', 
        overflowY: 'auto',
        paddingRight: '4px'
      }}>
        {filteredApiNodes.length === 0 ? (
          <div className="empty-state" style={{ 
            textAlign: 'center', 
            padding: '20px', 
            color: '#666',
            fontSize: '14px'
          }}>
            {searchQuery ? (
              <p>No API endpoints match your search. Try a different search term.</p>
            ) : (
              <p>No API endpoints imported yet. Import an API specification to see endpoints here.</p>
            )}
          </div>
        ) : (
          <div className="api-nodes-grid">
            {filteredApiNodes.map((node) => (
              <motion.div 
                key={node.id}
                className="api-node-item"
                draggable={true}
                onDragStart={(e) => {
                  if (!canEdit) {
                    e.preventDefault();
                    return;
                  }
                  // Set the node type as apiNode
                  e.dataTransfer.setData('application/nodeType', 'apiNode');
                  // Set the API node data as drag data
                  e.dataTransfer.setData('application/apiNodeData', JSON.stringify(node.data));
                  e.dataTransfer.effectAllowed = 'move';
                }}
                style={{ 
                  borderTop: `3px solid ${getMethodColor(node.data.method)}`,
                  padding: '12px',
                  margin: '8px 0',
                  backgroundColor: '#fff',
                  borderRadius: '4px',
                  border: '1px solid #e0e0e0',
                  cursor: canEdit ? 'grab' : 'default'
                }}
                whileHover={{ y: -2, boxShadow: "0 4px 8px rgba(0, 0, 0, 0.12)" }}
                whileDrag={{ scale: 1.02, boxShadow: "0 8px 16px rgba(0, 0, 0, 0.15)" }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="api-node-header" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <Tooltip title="Drag to add to diagram" arrow placement="top">
                    <div 
                      className="method-badge" 
                      style={{ 
                        backgroundColor: getMethodColor(node.data.method),
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      {node.data.method.toUpperCase()}
                    </div>
                  </Tooltip>
                  <div 
                    className="api-path" 
                    style={{ 
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#333',
                      marginLeft: '8px',
                      flex: 1
                    }}
                  >
                    {node.data.path}
                  </div>
                </div>
                <div 
                  className="api-description" 
                  style={{ 
                    fontSize: '12px',
                    color: '#666',
                    lineHeight: '1.4'
                  }}
                >
                  {node.data.summary || `${node.data.method.toUpperCase()} ${node.data.path}`}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiNodesTab;
