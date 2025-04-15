import { useState, useEffect } from 'react';
import conditionStore from '../store/conditionStore';
import '../styles/ConditionManager.css';

const ConditionManager = () => {
  const [conditions, setConditions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [promptView, setPromptView] = useState(false);

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

  // Delete a condition
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this condition?')) {
      conditionStore.removeCondition(id);
      setConditions(conditionStore.getAllConditions());
    }
  };

  // Copy OpenAI prompt to clipboard
  const copyPromptToClipboard = () => {
    const prompt = conditionStore.generateOpenAIPrompt();
    navigator.clipboard.writeText(prompt)
      .then(() => {
        alert('Prompt copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy prompt: ', err);
        alert('Failed to copy prompt. See console for details.');
      });
  };

  return (
    <div className="condition-manager">
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          padding: '8px 12px',
          backgroundColor: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '10px',
          fontWeight: 'bold'
        }}
      >
        Manage Conditions ({conditions.length})
      </button>

      {isOpen && (
        <div 
          className="condition-manager-modal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div 
            className="condition-manager-content"
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              width: '600px',
              maxWidth: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>Mail Conditions</h3>
              <div>
                <button
                  onClick={() => setPromptView(!promptView)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#8e44ad',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    marginRight: '10px',
                    cursor: 'pointer'
                  }}
                >
                  {promptView ? 'View List' : 'View Prompt'}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            {promptView ? (
              <div className="prompt-view">
                <textarea
                  readOnly
                  value={conditionStore.generateOpenAIPrompt()}
                  style={{
                    width: '100%',
                    minHeight: '200px',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontFamily: 'monospace',
                    marginBottom: '10px'
                  }}
                />
                <button
                  onClick={copyPromptToClipboard}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Copy to Clipboard
                </button>
              </div>
            ) : (
              <>
                {conditions.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#666' }}>No conditions created yet.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #ddd' }}>Mail Type</th>
                        <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #ddd' }}>Return</th>
                        <th style={{ textAlign: 'center', padding: '8px', borderBottom: '2px solid #ddd' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conditions.map((condition) => (
                        <tr 
                          key={condition.id} 
                          style={{ borderBottom: '1px solid #eee' }}
                          draggable={true}
                          onDragStart={(e) => {
                            // Set the condition ID as drag data
                            e.dataTransfer.setData('application/conditionId', condition.id);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          className="draggable-condition"
                        >
                          <td style={{ padding: '8px', maxWidth: '40%' }}>
                            <div style={{ maxHeight: '80px', overflow: 'auto' }}>
                              {condition.conditionText}
                            </div>
                          </td>
                          <td style={{ padding: '8px', maxWidth: '40%' }}>
                            <div style={{ maxHeight: '80px', overflow: 'auto' }}>
                              {condition.returnText}
                            </div>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '5px' }}>
                              <button
                                title="Drag to add to diagram"
                                style={{
                                  padding: '3px 8px',
                                  backgroundColor: '#8e44ad',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'grab'
                                }}
                                onMouseDown={(e) => {
                                  // Prevent button click when starting drag
                                  e.stopPropagation();
                                }}
                              >
                                ↔
                              </button>
                              <button
                                onClick={() => handleDelete(condition.id)}
                                title="Delete condition"
                                style={{
                                  padding: '3px 8px',
                                  backgroundColor: '#e74c3c',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer'
                                }}
                              >
                                ×
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConditionManager;
