import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Tooltip, 
  Badge,
  Chip,
  Divider
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import conditionStore from '../store/conditionStore';
import '../styles/NodesInventory.css';

const NodesInventory = ({ apiNodes = [] }) => {
  const [conditions, setConditions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('starting-points');
  
  const [apiNodesCount, setApiNodesCount] = useState(0);
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
      <motion.button 
        className={`inventory-toggle-button ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        {isOpen ? 'Hide Inventory' : 'Show Inventory'}
      </motion.button>

      {/* Inventory Panel */}
      <motion.div 
        className={`nodes-inventory ${isOpen ? 'open' : ''}`}
        initial={false}
        animate={isOpen ? { boxShadow: "0 -8px 20px rgba(0, 0, 0, 0.15)" } : { boxShadow: "0 -4px 10px rgba(0, 0, 0, 0.1)" }}
        transition={{ duration: 0.3 }}
      >
        <div className="inventory-header">
          <div className="inventory-tabs">
            <motion.button 
              className={`inventory-tab ${activeCategory === 'starting-points' ? 'active' : ''}`}
              onClick={() => setActiveCategory('starting-points')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Starting Points
            </motion.button>
            <motion.button 
              className={`inventory-tab ${activeCategory === 'sending-mail' ? 'active' : ''}`}
              onClick={() => setActiveCategory('sending-mail')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sending Mail
            </motion.button>
            <motion.button 
              className={`inventory-tab ${activeCategory === 'text-nodes' ? 'active' : ''}`}
              onClick={() => setActiveCategory('text-nodes')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Text Nodes
            </motion.button>
            <motion.button 
              className={`inventory-tab ${activeCategory === 'int-nodes' ? 'active' : ''}`}
              onClick={() => setActiveCategory('int-nodes')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Int Nodes
            </motion.button>
            <motion.button 
              className={`inventory-tab ${activeCategory === 'debug' ? 'active' : ''}`}
              onClick={() => setActiveCategory('debug')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Debug
            </motion.button>
            <motion.button 
              className={`inventory-tab ${activeCategory === 'api-nodes' ? 'active' : ''}`}
              onClick={() => setActiveCategory('api-nodes')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              API Nodes
            </motion.button>
          </div>
          {activeCategory === 'starting-points' && (
            <Chip 
              label={`${conditions.length} conditions available`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          {activeCategory === 'api-nodes' && (
            <Chip 
              label={`${apiNodesCount} API endpoints available`}
              size="small"
              color="primary"
              variant="outlined"
            />
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
            <motion.button 
              className="clear-search-button"
              onClick={() => setSearchQuery('')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ClearIcon fontSize="small" />
            </motion.button>
          )}
        </div>
        
        <div className="inventory-content">
          <AnimatePresence mode="wait">
            {activeCategory === 'starting-points' && (
              <motion.div
                key="starting-points"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
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
                      <motion.div 
                        key={condition.id}
                        className="condition-item"
                        draggable={true}
                        onDragStart={(e) => {
                          // Set the condition ID as drag data
                          e.dataTransfer.setData('application/conditionId', condition.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        whileHover={{ y: -5, boxShadow: "0 8px 16px rgba(0, 0, 0, 0.12)" }}
                        whileDrag={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.15)" }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="condition-item-header">
                          <Tooltip title="Drag to add to diagram" arrow placement="top">
                            <div className="condition-badge">CONDITION</div>
                          </Tooltip>
                          <div className="condition-return">{condition.returnText}</div>
                        </div>
                        <div className="condition-description">
                          {condition.conditionText.length > 70 
                            ? `${condition.conditionText.substring(0, 70)}...` 
                            : condition.conditionText}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          
            {activeCategory === 'sending-mail' && (
              <motion.div
                key="sending-mail"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="condition-items">
                  <motion.div 
                    className="condition-item sending-mail-item"
                    draggable={true}
                    onDragStart={(e) => {
                      // Set the node type as drag data
                      e.dataTransfer.setData('application/nodeType', 'sendingMailNode');
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    whileHover={{ y: -5, boxShadow: "0 8px 16px rgba(0, 0, 0, 0.12)" }}
                    whileDrag={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.15)" }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <div className="condition-item-header">
                      <Tooltip title="Drag to add to diagram" arrow placement="top">
                        <div className="condition-badge" style={{ backgroundColor: '#2196F3' }}>SENDING MAIL</div>
                      </Tooltip>
                      <div className="condition-return">Send Email</div>
                    </div>
                    <div className="condition-description">
                      Send emails using the Unipile API with customizable parameters
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="condition-item email-attachment-item"
                    draggable={true}
                    onDragStart={(e) => {
                      // Set the node type as drag data
                      e.dataTransfer.setData('application/nodeType', 'emailAttachmentNode');
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    whileHover={{ y: -5, boxShadow: "0 8px 16px rgba(0, 0, 0, 0.12)" }}
                    whileDrag={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.15)" }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <div className="condition-item-header">
                      <Tooltip title="Drag to add to diagram" arrow placement="top">
                        <div className="condition-badge" style={{ backgroundColor: '#9C27B0' }}>EMAIL ATTACHMENT</div>
                      </Tooltip>
                      <div className="condition-return">Get Attachment</div>
                    </div>
                    <div className="condition-description">
                      Retrieve email attachments using the Unipile API
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="condition-item ocr-item"
                    draggable={true}
                    onDragStart={(e) => {
                      // Set the node type as drag data
                      e.dataTransfer.setData('application/nodeType', 'ocrNode');
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    whileHover={{ y: -5, boxShadow: "0 8px 16px rgba(0, 0, 0, 0.12)" }}
                    whileDrag={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.15)" }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    <div className="condition-item-header">
                      <Tooltip title="Drag to add to diagram" arrow placement="top">
                        <div className="condition-badge" style={{ backgroundColor: '#009688' }}>OCR</div>
                      </Tooltip>
                      <div className="condition-return">Extract Text from Image</div>
                    </div>
                    <div className="condition-description">
                      Convert image attachments to text using OCR technology
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          
            {activeCategory === 'text-nodes' && (
              <motion.div
                key="text-nodes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="condition-items">
                  <motion.div 
                    className="condition-item text-node-item"
                    draggable={true}
                    onDragStart={(e) => {
                      // Set the node type as drag data
                      e.dataTransfer.setData('application/nodeType', 'textNode');
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    whileHover={{ y: -5, boxShadow: "0 8px 16px rgba(0, 0, 0, 0.12)" }}
                    whileDrag={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.15)" }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="condition-item-header">
                      <Tooltip title="Drag to add to diagram" arrow placement="top">
                        <div className="condition-badge" style={{ backgroundColor: '#9C27B0' }}>TEXT</div>
                      </Tooltip>
                      <div className="condition-return">Text Node</div>
                    </div>
                    <div className="condition-description">
                      Add text content that can connect to colored attribute handles
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          
            {activeCategory === 'int-nodes' && (
              <motion.div
                key="int-nodes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="condition-items">
                  <motion.div 
                    className="condition-item int-node-item"
                    draggable={true}
                    onDragStart={(e) => {
                      // Set the node type as drag data
                      e.dataTransfer.setData('application/nodeType', 'intNode');
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    whileHover={{ y: -5, boxShadow: "0 8px 16px rgba(0, 0, 0, 0.12)" }}
                    whileDrag={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.15)" }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="condition-item-header">
                      <Tooltip title="Drag to add to diagram" arrow placement="top">
                        <div className="condition-badge" style={{ backgroundColor: '#2196F3' }}>INT</div>
                      </Tooltip>
                      <div className="condition-return">Int Node</div>
                    </div>
                    <div className="condition-description">
                      Add integer values that can connect to colored attribute handles
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          
            {activeCategory === 'debug' && (
              <motion.div
                key="debug"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="condition-items">
                  <motion.div 
                    className="condition-item console-log-node-item"
                    draggable={true}
                    onDragStart={(e) => {
                      // Set the node type as drag data
                      e.dataTransfer.setData('application/nodeType', 'consoleLogNode');
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    whileHover={{ y: -5, boxShadow: "0 8px 16px rgba(0, 0, 0, 0.12)" }}
                    whileDrag={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.15)" }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="condition-item-header">
                      <Tooltip title="Drag to add to diagram" arrow placement="top">
                        <div className="condition-badge" style={{ backgroundColor: '#FF5722' }}>DEBUG</div>
                      </Tooltip>
                      <div className="condition-return">Console.log</div>
                    </div>
                    <div className="condition-description">
                      Logs input value to the console when connected to an execution flow
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          
            {activeCategory === 'api-nodes' && (
              <motion.div
                key="api-nodes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
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
                      <motion.div 
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
                        whileHover={{ y: -5, boxShadow: "0 8px 16px rgba(0, 0, 0, 0.12)" }}
                        whileDrag={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.15)" }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="condition-item-header">
                          <Tooltip title="Drag to add to diagram" arrow placement="top">
                            <div className="condition-badge" style={{ backgroundColor: getMethodColor(node.data.method) }}>
                              {node.data.method.toUpperCase()}
                            </div>
                          </Tooltip>
                          <div className="condition-return">{node.data.path}</div>
                        </div>
                        <div className="condition-description">
                          {node.data.summary || `${node.data.method.toUpperCase()} ${node.data.path}`}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
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
