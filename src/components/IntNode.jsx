import { memo, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Handle, Position } from 'reactflow';

// Connection colors
const EXECUTION_LINK_COLOR = '#555'; // Gray for execution links
const DATA_LINK_COLOR = '#3498db';    // Blue for data links

const IntNode = ({ data, id }) => {
  // IntNode component initialization
  
  // Default values if data is missing
  const [value, setValue] = useState(data?.value || 0);
  
  // Store callback in a ref to prevent recreation on each render
  const callbacksRef = useRef({});
  
  // Update callback ref when id changes
  useEffect(() => {
    callbacksRef.current[id] = (newValue) => {
      if (data.onValueChange) {
        data.onValueChange(newValue);
      }
    };
  }, [id, data.onValueChange]);
  
  // Update local state when data.value changes
  useEffect(() => {
    if (data?.value !== undefined) {
      setValue(data.value);
    }
  }, [data?.value]);
  
  const [isEditing, setIsEditing] = useState(false);
  
  // Define attribute colors for handles - memoized to prevent recreation
  const attributeColor = useMemo(() => '#2196F3', []); // Blue
  
  const handleDoubleClick = () => {
    setIsEditing(true);
  };
  
  // Memoized handlers to prevent recreation on each render
  const handleBlur = useCallback(() => {
    setIsEditing(false);
    // Use the callback from ref instead of directly from props
    callbacksRef.current[id]?.(value);
  }, [id, value]);
  
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      // Use the callback from ref instead of directly from props
      callbacksRef.current[id]?.(value);
    }
  }, [id, value]);
  
  const handleChange = useCallback((e) => {
    // Ensure only integers are entered
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue)) {
      setValue(newValue);
    } else if (e.target.value === '') {
      // Allow empty input for typing purposes
      setValue('');
    }
  }, []);
  
  // Memoize node style to prevent recreation on each render
  const nodeStyle = useMemo(() => ({
    borderTop: '3px solid #2196F3', // Blue for int nodes
    backgroundColor: '#e3f2fd', // Light blue background
    border: '1px solid #bbdefb',
    borderRadius: '5px',
    padding: '10px',
    minWidth: '150px',
    minHeight: '80px',
    boxShadow: '0 4px 8px rgba(33, 150, 243, 0.25)',
    zIndex: 10,
    position: 'relative'
  }), []);
  
  // Memoize header style
  const headerTypeStyle = useMemo(() => ({
    backgroundColor: '#2196F3',
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
    border: '1px solid #bbdefb'
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
      className="int-node"
      style={nodeStyle}
      onDoubleClick={handleDoubleClick}
    >
      {/* Delete button */}
      {data.deleteButton}
      
      {/* Node header */}
      <div className="int-node-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <div 
          className="int-node-type" 
          style={headerTypeStyle}
        >
          INT
        </div>
      </div>
      
      {/* Int content */}
      <div 
        className="int-node-content" 
        style={contentStyle}
      >
        {isEditing ? (
          <input
            type="number"
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            style={inputStyle}
          />
        ) : (
          value
        )}
      </div>
      
      {/* Execution flow handles removed as IntNode doesn't have its own processing */}
      
      {/* Output handle for data */}
      <Handle
        type="source"
        position={Position.Right}
        id="attr-int"
        style={handleStyle}
      />
    </div>
  );
};

export default memo(IntNode);
