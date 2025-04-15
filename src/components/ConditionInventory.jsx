import { useState, useEffect } from 'react';
import conditionStore from '../store/conditionStore';
import '../styles/ConditionInventory.css';

const ConditionInventory = () => {
  const [conditions, setConditions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('starting-points');
  const [textNodeContent, setTextNodeContent] = useState('');
  const [showTextNodeModal, setShowTextNodeModal] = useState(false);

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

  return (
    <div className="condition-inventory-container">
      {/* Toggle Button */}
      <button 
        className={`inventory-toggle-button ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? 'Hide Inventory' : 'Show Inventory'}
      </button>

      {/* Inventory Panel */}
      <div className={`condition-inventory ${isOpen ? 'open' : ''}`}>
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
          </div>
          {activeCategory === 'starting-points' && (
            <span className="inventory-count">{conditions.length} conditions available</span>
          )}
        </div>
        
        <div className="inventory-content">
          {activeCategory === 'starting-points' && (
            <>
              {conditions.length === 0 ? (
                <div className="empty-inventory">
                  <p>No conditions created yet. Create conditions to use them as starting points.</p>
                </div>
              ) : (
                <div className="condition-items">
                  {conditions.map((condition) => (
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
        </div>
      </div>
    </div>
  );
};

export default ConditionInventory;
