import { memo, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Handle, Position } from 'reactflow';

// Connection colors
const EXECUTION_LINK_COLOR = '#555'; // Gray for execution links
const DATA_LINK_COLOR = '#3498db';    // Blue for data links

const TextNode = ({ data, id }) => {
  // TextNode component initialization
  
  // Default values if data is missing
  const [text, setText] = useState(data?.text || 'Text content');
  
  // Store callback in a ref to prevent recreation on each render
  const callbacksRef = useRef({});
  
  // Update callback ref when id changes
  useEffect(() => {
    callbacksRef.current[id] = (newText) => {
      if (data.onTextChange) {
        data.onTextChange(newText);
      }
    };
  }, [id, data.onTextChange]);
  
  // Update local state when data.text changes
  useEffect(() => {
    if (data?.text) {
      setText(data.text);
    }
  }, [data?.text]);
  
  const [isEditing, setIsEditing] = useState(false);
  const isConnectedToStartingNode = data?.isConnectedToStartingNode || false;
  const connectionIndicator = data?.connectionIndicator;
  
  // Define attribute colors for handles - memoized to prevent recreation
  const attributeColor = useMemo(() => '#9C27B0', []); // Purple - same as content/body
  
  const handleDoubleClick = () => {
    setIsEditing(true);
  };
  
  // Memoized handlers to prevent recreation on each render
  const handleBlur = useCallback(() => {
    setIsEditing(false);
    // Use the callback from ref instead of directly from props
    callbacksRef.current[id]?.(text);
  }, [id, text]);
  
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      // Use the callback from ref instead of directly from props
      callbacksRef.current[id]?.(text);
    }
  }, [id, text]);
  
  // Memoize node style to prevent recreation on each render
  const nodeStyle = useMemo(() => ({
    borderTop: '3px solid #9C27B0', // Purple for text nodes
    backgroundColor: '#f9f0ff', // Light purple background
    border: '1px solid #e1bee7',
    borderRadius: '5px',
    padding: '10px',
    minWidth: '150px',
    minHeight: '80px',
    boxShadow: '0 4px 8px rgba(156, 39, 176, 0.25)',
    zIndex: 10,
    position: 'relative',
    transition: 'box-shadow 0.3s ease, transform 0.2s ease'
  }), []);
  
  // Memoize header style
  const headerTypeStyle = useMemo(() => ({
    backgroundColor: '#9C27B0',
    padding: '2px 6px',
    borderRadius: '3px',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '10px',
    marginRight: '8px'
  }), []);
  
  // Memoize content style
  const contentStyle = useMemo(() => ({
    fontSize: '12px',
    color: '#333',
    marginBottom: '8px',
    padding: '4px',
    borderRadius: '3px',
    background: '#fff',
    minHeight: '40px',
    border: '1px solid #e1bee7'
  }), []);
  
  // Memoize input style
  const inputStyle = useMemo(() => ({
    width: '100%',
    border: 'none',
    outline: 'none',
    fontSize: '12px',
    padding: '0',
    background: 'transparent'
  }), []);
  
  // Memoize handle style
  const handleStyle = useMemo(() => ({
    background: attributeColor, 
    width: '8px', 
    height: '8px',
    right: 0
  }), [attributeColor]);
  
  return (
    <div 
      className="text-node"
      style={nodeStyle}
      onDoubleClick={handleDoubleClick}
    >
      {/* Delete button */}
      {data.deleteButton}
      
      {/* Connection indicator */}
      {connectionIndicator}
      {/* Node header */}
      <div className="text-node-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <div 
          className="text-node-type" 
          style={headerTypeStyle}
        >
          TEXT
        </div>
      </div>
      
      {/* Text content */}
      <div 
        className="text-node-content" 
        style={contentStyle}
      >
        {isEditing ? (
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            style={inputStyle}
          />
        ) : (
          text
        )}
      </div>
      
      {/* Execution flow handles removed as TextNode doesn't have its own processing */}
      
      {/* Output handle for data */}
      <Handle
        type="source"
        position={Position.Right}
        id="attr-text"
        style={handleStyle}
      />
      
      {/* Default handles for connections removed as they're not needed */}
    </div>
  );
};

export default memo(TextNode);
