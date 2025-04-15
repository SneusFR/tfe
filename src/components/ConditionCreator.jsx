import { useState } from 'react';

const ConditionCreator = ({ onCreateCondition }) => {
  const [conditionText, setConditionText] = useState('');
  const [returnText, setReturnText] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!conditionText.trim() || !returnText.trim()) {
      alert('Please fill in all fields');
      return;
    }

    onCreateCondition({
      type: 'conditionNode',
      data: {
        conditionText,
        returnText
      }
    });

    // Reset form and close
    setConditionText('');
    setReturnText('');
    setIsOpen(false);
  };

  return (
    <div className="condition-creator">
      <button 
        className="open-condition-creator" 
        onClick={() => setIsOpen(true)}
        style={{
          padding: '8px 12px',
          backgroundColor: '#8e44ad',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '10px',
          fontWeight: 'bold'
        }}
      >
        + Create Condition
      </button>

      {isOpen && (
        <div 
          className="condition-creator-modal"
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
            className="condition-creator-content"
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              width: '400px',
              maxWidth: '90%',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
            }}
          >
            <h3 style={{ marginTop: 0 }}>Create Mail Condition</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Type of mail:
                </label>
                <textarea
                  value={conditionText}
                  onChange={(e) => setConditionText(e.target.value)}
                  placeholder="Describe the type of mail this condition should match..."
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    minHeight: '80px'
                  }}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Return:
                </label>
                <textarea
                  value={returnText}
                  onChange={(e) => setReturnText(e.target.value)}
                  placeholder="Enter the text to return when this condition matches..."
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    minHeight: '80px'
                  }}
                />
              </div>
              
              <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#8e44ad',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Create Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConditionCreator;
