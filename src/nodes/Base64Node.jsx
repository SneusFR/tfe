import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { Handle, Position } from 'reactflow';

// Connection colors
const EXECUTION_LINK_COLOR = '#555'; // Gray for execution links
const DATA_LINK_COLOR = '#3498db';    // Blue for data links

const Base64Node = ({ data, id }) => {
  // Default values if data is missing
  const [input, setInput] = useState(data?.input || '');
  const [output, setOutput] = useState(data?.output || '');
  
  // Store callback in a ref to prevent recreation on each render
  const callbacksRef = useRef({});
  
  // Update callback ref when id changes
  useEffect(() => {
    callbacksRef.current[id] = {
      onInputChange: (newInput) => {
        if (data.onInputChange) {
          data.onInputChange(newInput);
        }
      }
    };
  }, [id, data.onInputChange]);
  
  // Update local state when data changes
  useEffect(() => {
    if (data?.input !== undefined) {
      setInput(data.input);
    }
    if (data?.output !== undefined) {
      setOutput(data.output);
    }
  }, [data?.input, data?.output]);
  
  // Auto-convert to Base64 when input changes
  useEffect(() => {
    if (input) {
      try {
        const base64Output = btoa(input);
        setOutput(base64Output);
      } catch (error) {
        setOutput('Error: Invalid input for Base64 encoding');
      }
    } else {
      setOutput('');
    }
  }, [input]);
  
  const [isEditingInput, setIsEditingInput] = useState(false);
  const isConnectedToStartingNode = data?.isConnectedToStartingNode || false;
  const connectionIndicator = data?.connectionIndicator;
  
  // Define attribute colors for handles
  const inputColor = '#2196F3'; // Blue for input
  const outputColor = '#4CAF50'; // Green for output
  
  const handleInputDoubleClick = () => {
    setIsEditingInput(true);
  };
  
  // Memoized handlers to prevent recreation on each render
  const handleInputBlur = useCallback(() => {
    setIsEditingInput(false);
    callbacksRef.current[id]?.onInputChange?.(input);
  }, [id, input]);
  
  const handleInputKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      setIsEditingInput(false);
      callbacksRef.current[id]?.onInputChange?.(input);
    }
  }, [id, input]);
  
  return (
    <div 
      className="base64-node"
      style={{ 
        borderTop: '3px solid #FF9800', // Orange for Base64 nodes
        backgroundColor: '#fff3e0', // Light orange background
        border: '1px solid #ffcc02',
        borderRadius: '5px',
        padding: '10px',
        minWidth: '250px',
        minHeight: '120px',
        boxShadow: '0 4px 8px rgba(255, 152, 0, 0.25)',
        zIndex: 10,
        position: 'relative',
        transition: 'box-shadow 0.3s ease, transform 0.2s ease'
      }}
    >
      {/* Delete button */}
      {data.deleteButton}
      
      {/* Connection indicator */}
      {connectionIndicator}
      
      {/* Node header */}
      <div className="base64-node-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <div 
          className="base64-node-type" 
          style={{ 
            backgroundColor: '#FF9800',
            padding: '2px 6px',
            borderRadius: '3px',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '10px',
            marginRight: '8px'
          }}
        >
          B64
        </div>
        <div className="base64-node-title" style={{ fontSize: '14px', fontWeight: 'bold' }}>
          Base64 Encoder
        </div>
      </div>
      
      {/* Input section */}
      <div className="base64-node-section">
        <div className="base64-node-label" style={{ fontSize: '11px', marginBottom: '4px', color: '#555' }}>
          Input:
        </div>
        <div 
          className="base64-node-input" 
          style={{ 
            fontSize: '12px',
            color: '#333',
            marginBottom: '8px',
            padding: '4px',
            borderRadius: '3px',
            background: '#fff',
            minHeight: '40px',
            border: '1px solid #ffcc02',
            cursor: 'pointer'
          }}
          onDoubleClick={handleInputDoubleClick}
        >
          {isEditingInput ? (
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              autoFocus
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: '12px',
                padding: '0',
                background: 'transparent',
                resize: 'vertical',
                minHeight: '40px'
              }}
            />
          ) : (
            input || 'Double-click to enter text to encode...'
          )}
        </div>
      </div>
      
      {/* Output section */}
      <div className="base64-node-section">
        <div className="base64-node-label" style={{ fontSize: '11px', marginBottom: '4px', color: '#555' }}>
          Output (Base64):
        </div>
        <div 
          className="base64-node-output" 
          style={{ 
            fontSize: '12px',
            color: '#333',
            padding: '4px',
            borderRadius: '3px',
            background: '#f5f5f5',
            minHeight: '40px',
            border: '1px solid #ffcc02',
            fontStyle: 'italic',
            wordBreak: 'break-all'
          }}
        >
          {output || 'Base64 encoded text will appear here...'}
        </div>
      </div>
      
      {/* Execution flow handles (triangles) */}
      <Handle
        type="target"
        position={Position.Left}
        id="execution"
        style={{ 
          background: 'transparent', 
          width: 0,
          height: 0,
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          borderRight: '10px solid ' + EXECUTION_LINK_COLOR,
          top: 0,
          left: -10,
        }}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="execution"
        style={{ 
          background: 'transparent', 
          width: 0,
          height: 0,
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          borderLeft: '10px solid ' + EXECUTION_LINK_COLOR,
          top: 0,
          right: -10,
        }}
      />
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="attr-input"
        style={{ 
          background: inputColor, 
          width: '10px', 
          height: '10px',
          top: '50%',
          left: -5,
          border: '2px solid white',
          boxShadow: '0 0 3px rgba(0,0,0,0.3)'
        }}
      />
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="attr-output"
        style={{ 
          background: outputColor, 
          width: '10px', 
          height: '10px',
          top: '80%',
          right: -5,
          border: '2px solid white',
          boxShadow: '0 0 3px rgba(0,0,0,0.3)'
        }}
      />
    </div>
  );
};

export default memo(Base64Node);
