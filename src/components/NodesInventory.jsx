import { useState, useEffect } from 'react';
import conditionStore from '../store/conditionStore';
import '../styles/NodesInventory.css';

const NodesInventory = ({ apiNodes = [] }) => {
  const [conditions, setConditions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('starting-points');
  const [apiNodesCount, setApiNodesCount] = useState(0);
  const [textNodeContent, setTextNodeContent] = useState('');
  const [showTextNodeModal, setShowTextNodeModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load conditions from store
  useEffect(() => {
    const loadConditions = () => {
      const allConditions = conditionStore.getAllConditions();
      setConditions(allConditions);
    };

    loadConditions();
    
    // Set up an interval to refresh conditions regularly
    const intervalId = setInterval(loadConditions, 3000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Update API nodes count when apiNodes prop changes
  useEffect(() => {
    setApiNodesCount(apiNodes.length);
  }, [apiNodes]);

  // Filter nodes based on search query
  const filteredConditions = conditions.filter(condition => 
    condition.conditionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
    condition.returnText.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Filter API nodes based on search query
  const filteredApiNodes = apiNodes.filter(node => 
    node.data.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (node.data.summary && node.data.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
    node.data.method.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="nodes-inventory-container">
      {/* Toggle Button */}
      <button 
        className={`inventory-toggle-button ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? 'Hide Inventory' : 'Show Inventory'}
      </button>

      {/* Inventory Panel */}
      <div className={`nodes-inventory ${isOpen ? 'open' : ''}`}>
        <div className="inventory-header">
          <div className="inventory-tabs">
            <button 
              className={`inventory-tab ${activeCategory === 'starting-points' ? 'active' : ''}`}
              onClick={() => setActiveCategory('starting-points')}
            >
              Starting Points
            </button>
            <button 
              className={`inventory-tab ${activeCategory === 'sending-mail' ? 'active' : ''}`}
              onClick={() => setActiveCategory('sending-mail')}
            >
              Sending Mail
            </button>
            <button 
              className={`inventory-tab ${activeCategory === 'text-nodes' ? 'active' : ''}`}
              onClick={() => setActiveCategory('text-nodes')}
            >
              Text Nodes
            </button>
            <button 
              className={`inventory-tab ${activeCategory === 'int-nodes' ? 'active' : ''}`}
              onClick={() => setActiveCategory('int-nodes')}
            >
              Int Nodes
            </button>
            <button 
              className={`inventory-tab ${activeCategory === 'api-nodes' ? 'active' : ''}`}
              onClick={() => setActiveCategory('api-nodes')}
            >
              API Nodes
            </button>
          </div>
          {activeCategory === 'starting-points' && (
            <span className="inventory-count">{conditions.length} conditions available</span>
          )}
          {activeCategory === 'api-nodes' && (
            <span className="inventory-count">{apiNodesCount} API endpoints available</span>
          )}
        </div>
        
        {/* Search Bar */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button 
              className="clear-search-button"
              onClick={() => setSearchQuery('')}
            >
              ×
            </button>
          )}
        </div>
        
        <div className="inventory-content">
          {activeCategory === 'starting-points' && (
            <>
              {filteredConditions.length === 0 ? (
                <div className="empty-inventory">
                  {searchQuery ? (
                    <p>No conditions match your search. Try a different search term.</p>
                  ) : (
                    <p>No conditions created yet. Create conditions to use them as starting points.</p>
                  )}
                </div>
              ) : (
                <div className="condition-items">
                  {filteredConditions.map((condition) => (
                    <div 
                      key={condition.id}
                      className="condition-item"
                      draggable={true}
                      onDragStart={(e) => {
                        // Set the condition ID as drag data
                        e.dataTransfer.setData('application/conditionId', condition.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                    >
                      <div className="condition-item-header">
                        <div className="condition-badge">CONDITION</div>
                        <div className="condition-return">{condition.returnText}</div>
                      </div>
                      <div className="condition-description">
                        {condition.conditionText.length > 70 
                          ? `${condition.conditionText.substring(0, 70)}...` 
                          : condition.conditionText}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          
          {activeCategory === 'sending-mail' && (
            <div className="condition-items">
              <div 
                className="condition-item sending-mail-item"
                draggable={true}
                onDragStart={(e) => {
                  // Set the node type as drag data
                  e.dataTransfer.setData('application/nodeType', 'sendingMailNode');
                  e.dataTransfer.effectAllowed = 'move';
                }}
                style={{ borderTop: '3px solid #2196F3' }}
              >
                <div className="condition-item-header">
                  <div className="condition-badge" style={{ backgroundColor: '#2196F3' }}>SENDING MAIL</div>
                  <div className="condition-return">Send Email</div>
                </div>
                <div className="condition-description">
                  Send emails using the Unipile API with customizable parameters
                </div>
              </div>
            </div>
          )}
          
          {activeCategory === 'text-nodes' && (
            <div className="condition-items">
              <div 
                className="condition-item text-node-item"
                draggable={true}
                onDragStart={(e) => {
                  // Set the node type as drag data
                  e.dataTransfer.setData('application/nodeType', 'textNode');
                  e.dataTransfer.effectAllowed = 'move';
                }}
                style={{ borderTop: '3px solid #9C27B0' }}
              >
                <div className="condition-item-header">
                  <div className="condition-badge" style={{ backgroundColor: '#9C27B0' }}>TEXT</div>
                  <div className="condition-return">Text Node</div>
                </div>
                <div className="condition-description">
                  Add text content that can connect to colored attribute handles
                </div>
              </div>
            </div>
          )}
          
          {activeCategory === 'int-nodes' && (
            <div className="condition-items">
              <div 
                className="condition-item int-node-item"
                draggable={true}
                onDragStart={(e) => {
                  // Set the node type as drag data
                  e.dataTransfer.setData('application/nodeType', 'intNode');
                  e.dataTransfer.effectAllowed = 'move';
                }}
                style={{ borderTop: '3px solid #2196F3' }}
              >
                <div className="condition-item-header">
                  <div className="condition-badge" style={{ backgroundColor: '#2196F3' }}>INT</div>
                  <div className="condition-return">Int Node</div>
                </div>
                <div className="condition-description">
                  Add integer values that can connect to colored attribute handles
                </div>
              </div>
            </div>
          )}
          
          {activeCategory === 'api-nodes' && (
            <>
              {filteredApiNodes.length === 0 ? (
                <div className="empty-inventory">
                  {searchQuery ? (
                    <p>No API endpoints match your search. Try a different search term.</p>
                  ) : (
                    <p>No API endpoints imported yet. Import an API specification to see endpoints here.</p>
                  )}
                </div>
              ) : (
                <div className="condition-items">
                  {filteredApiNodes.map((node) => (
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
            </>
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

export default NodesInventory;
