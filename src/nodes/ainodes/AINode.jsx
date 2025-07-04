import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import DeleteButton from '../../components/common/DeleteButton';

// Connection colors
const EXECUTION_LINK_COLOR = '#555'; // Gray for execution links
const DATA_LINK_COLOR = '#3498db';    // Blue for data links

const AINode = ({ data, id }) => {
  // Default values if data is missing
  const [prompt, setPrompt] = useState(data?.prompt || 'Enter your prompt here...');
  const [input, setInput] = useState(data?.input || '');
  const [output, setOutput] = useState(data?.output || '');
  
  // Store callback in a ref to prevent recreation on each render
  const callbacksRef = useRef({});
  
  // Update callback ref when id changes
  useEffect(() => {
    callbacksRef.current[id] = {
      onPromptChange: (newPrompt) => {
        if (data.onPromptChange) {
          data.onPromptChange(newPrompt);
        }
      },
      onInputChange: (newInput) => {
        if (data.onInputChange) {
          data.onInputChange(newInput);
        }
      }
    };
  }, [id, data.onPromptChange, data.onInputChange]);
  
  // Update local state when data changes
  useEffect(() => {
    if (data?.prompt) {
      setPrompt(data.prompt);
    }
    if (data?.input) {
      setInput(data.input);
    }
    if (data?.output) {
      setOutput(data.output);
    }
  }, [data?.prompt, data?.input, data?.output]);
  
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [isEditingInput, setIsEditingInput] = useState(false);
  const isConnectedToStartingNode = data?.isConnectedToStartingNode || false;
  const connectionIndicator = data?.connectionIndicator;
  
  // Define attribute colors for handles
  const promptColor = '#9C27B0'; // Purple for prompt
  const inputColor = '#2196F3'; // Blue for input
  const outputColor = '#4CAF50'; // Green for output
  
  const handlePromptDoubleClick = () => {
    setIsEditingPrompt(true);
  };
  
  const handleInputDoubleClick = () => {
    setIsEditingInput(true);
  };
  
  // Memoized handlers to prevent recreation on each render
  const handlePromptBlur = useCallback(() => {
    setIsEditingPrompt(false);
    callbacksRef.current[id]?.onPromptChange?.(prompt);
  }, [id, prompt]);
  
  const handleInputBlur = useCallback(() => {
    setIsEditingInput(false);
    callbacksRef.current[id]?.onInputChange?.(input);
  }, [id, input]);
  
  const handlePromptKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      setIsEditingPrompt(false);
      callbacksRef.current[id]?.onPromptChange?.(prompt);
    }
  }, [id, prompt]);
  
  const handleInputKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      setIsEditingInput(false);
      callbacksRef.current[id]?.onInputChange?.(input);
    }
  }, [id, input]);
  
  return (
    <div 
      className="ai-node"
      style={{ 
        borderTop: '3px solid #673AB7', // Deep purple for AI nodes
        backgroundColor: '#f3e5f5', // Light purple background
        border: '1px solid #d1c4e9',
        borderRadius: '5px',
        padding: '10px',
        width: '300px', // Fixed width instead of minWidth
        minHeight: '150px',
        boxShadow: '0 4px 8px rgba(103, 58, 183, 0.25)',
        zIndex: 10,
        position: 'relative',
        transition: 'box-shadow 0.3s ease, transform 0.2s ease'
      }}
    >
      {/* Delete button - visibility controlled by CSS */}
      {data.onDelete && <DeleteButton id={id} onDelete={data.onDelete} />}
      
      {/* Connection indicator */}
      {connectionIndicator}
      
      {/* Node header */}
      <div className="ai-node-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <div 
          className="ai-node-type" 
          style={{ 
            backgroundColor: '#673AB7',
            padding: '2px 6px',
            borderRadius: '3px',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '10px',
            marginRight: '8px'
          }}
        >
          AI
        </div>
        <div className="ai-node-title" style={{ fontSize: '14px', fontWeight: 'bold' }}>
          AI Processing
        </div>
      </div>
      
      {/* Prompt section */}
      <div className="ai-node-section">
        <div className="ai-node-label" style={{ fontSize: '11px', marginBottom: '4px', color: '#555' }}>
          Prompt:
        </div>
        <div 
          className="ai-node-prompt" 
          style={{ 
            fontSize: '12px',
            color: '#333',
            marginBottom: '8px',
            padding: '4px',
            borderRadius: '3px',
            background: '#fff',
            minHeight: '40px',
            border: '1px solid #d1c4e9',
            cursor: 'pointer',
            wordWrap: 'break-word', // Ensure text wraps
            overflowWrap: 'break-word'
          }}
          onDoubleClick={handlePromptDoubleClick}
        >
          {isEditingPrompt ? (
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onBlur={handlePromptBlur}
              onKeyDown={handlePromptKeyDown}
              autoFocus
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: '12px',
                padding: '0',
                background: 'transparent',
                resize: 'vertical',
                minHeight: '40px',
                wordWrap: 'break-word',
                overflowWrap: 'break-word'
              }}
            />
          ) : (
            prompt
          )}
        </div>
      </div>
      
      {/* Input section */}
      <div className="ai-node-section">
        <div className="ai-node-label" style={{ fontSize: '11px', marginBottom: '4px', color: '#555' }}>
          Input:
        </div>
        <div 
          className="ai-node-input" 
          style={{ 
            fontSize: '12px',
            color: '#333',
            marginBottom: '8px',
            padding: '4px',
            borderRadius: '3px',
            background: '#fff',
            minHeight: '40px',
            border: '1px solid #d1c4e9',
            cursor: 'pointer',
            wordWrap: 'break-word', // Ensure text wraps
            overflowWrap: 'break-word'
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
                minHeight: '40px',
                wordWrap: 'break-word',
                overflowWrap: 'break-word'
              }}
            />
          ) : (
            input || 'Double-click to enter input text...'
          )}
        </div>
      </div>
      
      {/* Output section */}
      <div className="ai-node-section">
        <div className="ai-node-label" style={{ fontSize: '11px', marginBottom: '4px', color: '#555' }}>
          Output:
        </div>
        <div 
          className="ai-node-output" 
          style={{ 
            fontSize: '12px',
            color: '#333',
            padding: '4px',
            borderRadius: '3px',
            background: '#f5f5f5',
            minHeight: '40px',
            border: '1px solid #d1c4e9',
            fontStyle: 'italic',
            wordWrap: 'break-word', // Ensure text wraps
            overflowWrap: 'break-word',
            maxHeight: '100px',
            overflowY: 'auto' // Add scrolling for very long outputs
          }}
        >
          {output || 'AI response will appear here...'}
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
      
      {/* Input handles - Made more prominent */}
      <Handle
        type="target"
        position={Position.Left}
        id="attr-prompt"
        style={{ 
          background: promptColor, 
          width: '10px', 
          height: '10px',
          top: '32%',
          left: -5,
          border: '2px solid white',
          boxShadow: '0 0 3px rgba(0,0,0,0.3)'
        }}
      />
      
      <Handle
        type="target"
        position={Position.Left}
        id="attr-input"
        style={{ 
          background: inputColor, 
          width: '10px', 
          height: '10px',
          top: '58%',
          left: -5,
          border: '2px solid white',
          boxShadow: '0 0 3px rgba(0,0,0,0.3)'
        }}
      />
      
      {/* Output handle - Repositioned to align exactly with the edge connection */}
      <Handle
        type="source"
        position={Position.Right}
        id="attr-output"
        style={{ 
          background: outputColor, 
          width: '10px', 
          height: '10px',
          top: '88%', // Position it exactly where the edge connects
          right: -5,
          border: '2px solid white',
          boxShadow: '0 0 3px rgba(0,0,0,0.3)'
        }}
      />
      
      {/* Removed default handles for connections as requested */}
    </div>
  );
};

export default memo(AINode);
