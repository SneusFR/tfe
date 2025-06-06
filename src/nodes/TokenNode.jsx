import { memo, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Handle, Position } from 'reactflow';

const TokenNode = ({ data, id }) => {
  // TokenNode component initialization
  
  // Default values if data is missing
  const [token, setToken] = useState(data?.token || '');
  const [isEditing, setIsEditing] = useState(false);
  
  // Store callback in a ref to prevent recreation on each render
  const callbacksRef = useRef({});
  
  // Update callback ref when id changes
  useEffect(() => {
    callbacksRef.current[id] = (newToken) => {
      if (data.onTokenChange) {
        data.onTokenChange(newToken);
      }
    };
  }, [id, data.onTokenChange]);
  
  // Update local state when data.token changes
  useEffect(() => {
    if (data?.token !== undefined) {
      setToken(data.token);
    }
  }, [data?.token]);
  
  // Define attribute colors for handles - memoized to prevent recreation
  const attributeColor = useMemo(() => '#FF9800', []); // Orange for token
  
  const handleDoubleClick = () => {
    setIsEditing(true);
  };
  
  // Memoized handlers to prevent recreation on each render
  const handleBlur = useCallback(() => {
    setIsEditing(false);
    // Use the callback from ref instead of directly from props
    callbacksRef.current[id]?.(token);
  }, [id, token]);
  
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      // Use the callback from ref instead of directly from props
      callbacksRef.current[id]?.(token);
    }
  }, [id, token]);
  
  const handleChange = useCallback((e) => {
    setToken(e.target.value);
  }, []);
  
  // Create masked token display
  const maskedToken = useMemo(() => {
    return token ? '•'.repeat(Math.min(token.length, 20)) : '';
  }, [token]);
  
  // Memoize node style to prevent recreation on each render
  const nodeStyle = useMemo(() => ({
    borderTop: '3px solid #FF9800', // Orange for token nodes
    backgroundColor: '#fff3e0', // Light orange background
    border: '1px solid #ffe0b2',
    borderRadius: '5px',
    padding: '10px',
    minWidth: '150px',
    minHeight: '80px',
    boxShadow: '0 4px 8px rgba(255, 152, 0, 0.25)',
    zIndex: 10,
    position: 'relative'
  }), []);
  
  // Memoize header style
  const headerTypeStyle = useMemo(() => ({
    backgroundColor: '#FF9800',
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
    border: '1px solid #ffe0b2',
    display: 'flex',
    alignItems: 'center'
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
      className="token-node"
      style={nodeStyle}
      onDoubleClick={handleDoubleClick}
    >
      {/* Delete button */}
      {data.deleteButton}
      
      {/* Node header */}
      <div className="token-node-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <div 
          className="token-node-type" 
          style={headerTypeStyle}
        >
          TOKEN
        </div>
      </div>
      
      {/* Token content */}
      <div 
        className="token-node-content" 
        style={contentStyle}
      >
        {isEditing ? (
          <input
            type="text"
            value={token}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            style={inputStyle}
            placeholder="Enter token value"
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <span style={{ 
              fontFamily: 'monospace', 
              letterSpacing: '1px',
              color: token ? '#555' : '#aaa'
            }}>
              {maskedToken || 'No token set'}
            </span>
            <div 
              style={{ 
                marginLeft: 'auto', 
                cursor: 'pointer',
                fontSize: '10px',
                color: '#FF9800',
                padding: '2px 4px',
                borderRadius: '2px',
                border: '1px solid #FF9800'
              }}
              onClick={handleDoubleClick}
            >
              Edit
            </div>
          </div>
        )}
      </div>
      
      {/* Output handle for data */}
      <Handle
        type="source"
        position={Position.Right}
        id="attr-token"
        style={handleStyle}
      />
    </div>
  );
};

export default memo(TokenNode);
