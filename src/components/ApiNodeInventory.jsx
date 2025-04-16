import { useState } from 'react';
import '../styles/NodesInventory.css'; // Base styles
import '../styles/ApiNodeInventory.css'; // API-specific overrides

const ApiNodeInventory = ({ apiNodes }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="nodes-inventory-container api-inventory-container">
      {/* Toggle Button */}
      <button 
        className={`inventory-toggle-button ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? 'Hide API Nodes' : 'Show API Nodes'}
      </button>

      {/* Inventory Panel */}
      <div className={`nodes-inventory ${isOpen ? 'open' : ''}`}>
        <div className="inventory-header">
          <div className="inventory-tabs">
            <button 
              className="inventory-tab active"
              style={{ color: '#2196F3', borderBottomColor: '#2196F3' }}
            >
              API Nodes
            </button>
          </div>
          <span className="inventory-count">{apiNodes.length} API endpoints available</span>
        </div>
        
        <div className="inventory-content">
          {apiNodes.length === 0 ? (
            <div className="empty-inventory">
              <p>No API endpoints imported yet. Import an API specification to see endpoints here.</p>
            </div>
          ) : (
            <div className="condition-items">
              {apiNodes.map((node) => (
                <div 
                  key={`${node.id}-${Math.random().toString(36).substr(2, 9)}`}
                  className="condition-item"
                  draggable={true}
                  onDragStart={(e) => {
                    // Set the node type as apiNode
                    e.dataTransfer.setData('application/nodeType', 'apiNode');
                    // Set the API node data as drag data
                    e.dataTransfer.setData('application/apiNodeData', JSON.stringify(node.data));
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  style={{ borderTop: `3px solid ${getMethodColor(node.data.method)}` }}
                >
                  <div className="condition-item-header">
                    <div className="condition-badge" style={{ backgroundColor: getMethodColor(node.data.method) }}>
                      {node.data.method.toUpperCase()}
                    </div>
                    <div className="condition-return">{node.data.path}</div>
                  </div>
                  <div className="condition-description">
                    {node.data.summary || `${node.data.method.toUpperCase()} ${node.data.path}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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

export default ApiNodeInventory;
