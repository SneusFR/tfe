import { memo, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Handle, Position } from 'reactflow';

const BooleanNode = ({ data, id }) => {
  // BooleanNode component initialization
  
  // Default values if data is missing
  const [value, setValue] = useState(data?.value || false);
  
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
  
  // Define attribute colors for handles - memoized to prevent recreation
  const attributeColor = useMemo(() => '#4CAF50', []); // Green for boolean
  
  // Toggle the boolean value
  const handleToggle = useCallback(() => {
    const newValue = !value;
    setValue(newValue);
    callbacksRef.current[id]?.(newValue);
  }, [id, value]);
  
  // Memoize node style to prevent recreation on each render
  const nodeStyle = useMemo(() => ({
    borderTop: '3px solid #4CAF50', // Green for boolean nodes
    backgroundColor: '#e8f5e9', // Light green background
    border: '1px solid #c8e6c9',
    borderRadius: '5px',
    padding: '10px',
    minWidth: '150px',
    minHeight: '80px',
    boxShadow: '0 4px 8px rgba(76, 175, 80, 0.25)',
    zIndex: 10,
    position: 'relative'
  }), []);
  
  // Memoize header style
  const headerTypeStyle = useMemo(() => ({
    backgroundColor: '#4CAF50',
    padding: '2px 6px',
    borderRadius: '3px',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '10px',
    marginRight: '8px'
  }), []);
  
  // Memoize toggle switch container style
  const toggleContainerStyle = useMemo(() => ({
    fontSize: '12px',
    color: '#333',
    marginBottom: '8px',
    padding: '8px',
    borderRadius: '3px',
    background: '#fff',
    minHeight: '40px',
    border: '1px solid #c8e6c9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  }), []);
  
  // Memoize toggle switch style
  const toggleSwitchStyle = useMemo(() => ({
    position: 'relative',
    display: 'inline-block',
    width: '40px',
    height: '20px'
  }), []);
  
  // Memoize toggle switch input style
  const toggleInputStyle = useMemo(() => ({
    opacity: 0,
    width: 0,
    height: 0
  }), []);
  
  // Memoize toggle switch slider style
  const toggleSliderStyle = useMemo(() => ({
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: value ? '#4CAF50' : '#ccc',
    transition: '.4s',
    borderRadius: '34px',
    '&:before': {
      position: 'absolute',
      content: '""',
      height: '16px',
      width: '16px',
      left: value ? '20px' : '4px',
      bottom: '2px',
      backgroundColor: 'white',
      transition: '.4s',
      borderRadius: '50%'
    }
  }), [value]);
  
  // Memoize handle style
  const handleStyle = useMemo(() => ({
    background: attributeColor, 
    width: '8px', 
    height: '8px',
    right: 0
  }), [attributeColor]);
  
  return (
    <div 
      className="boolean-node"
      style={nodeStyle}
    >
      {/* Delete button */}
      {data.deleteButton}
      
      {/* Node header */}
      <div className="boolean-node-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <div 
          className="boolean-node-type" 
          style={headerTypeStyle}
        >
          BOOLEAN
        </div>
      </div>
      
      {/* Boolean toggle switch */}
      <div 
        className="boolean-node-content" 
        style={toggleContainerStyle}
      >
        <span>{value ? 'True' : 'False'}</span>
        <label style={toggleSwitchStyle}>
          <input
            type="checkbox"
            checked={value}
            onChange={handleToggle}
            style={toggleInputStyle}
          />
          <span 
            style={{
              ...toggleSliderStyle,
              '::before': toggleSliderStyle['&:before']
            }}
          ></span>
        </label>
      </div>
      
      {/* Output handle for data */}
      <Handle
        type="source"
        position={Position.Right}
        id="attr-boolean"
        style={handleStyle}
      />
    </div>
  );
};

export default memo(BooleanNode);
