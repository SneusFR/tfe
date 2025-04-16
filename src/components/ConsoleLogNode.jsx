import { memo, useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';

// Connection colors
const EXECUTION_LINK_COLOR = '#555'; // Gray for execution links
const DATA_LINK_COLOR = '#3498db';    // Blue for data links

const ConsoleLogNode = ({ data, id }) => {
  // ConsoleLogNode component initialization
  
  // Default values if data is missing
  const [value, setValue] = useState(data?.value || '');
  
  // Update local state when data.value changes
  useEffect(() => {
    if (data?.value !== undefined) {
      setValue(data.value);
    }
  }, [data?.value]);
  const [isEditing, setIsEditing] = useState(false);
  
  // Define attribute colors for handles - using green for debug nodes
  const attributeColor = '#4CAF50'; // Green
  
  const handleDoubleClick = () => {
    setIsEditing(true);
  };
  
  const handleBlur = () => {
    setIsEditing(false);
    // Update the node data if needed
    if (data.onValueChange) {
      data.onValueChange(value);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      // Update the node data if needed
      if (data.onValueChange) {
        data.onValueChange(value);
      }
    }
  };
  
  const handleChange = (e) => {
    setValue(e.target.value);
  };
  
  return (
    <div 
      className="console-log-node"
      style={{ 
        borderTop: '3px solid #4CAF50', // Green for debug nodes
        backgroundColor: '#E8F5E9', // Light green background
        border: '1px solid #C8E6C9',
        borderRadius: '5px',
        padding: '10px',
        minWidth: '150px',
        minHeight: '80px',
        boxShadow: '0 4px 8px rgba(76, 175, 80, 0.25)',
        zIndex: 10,
        position: 'relative'
      }}
      onDoubleClick={handleDoubleClick}
    >
      {/* Node header */}
      <div className="console-log-node-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <div 
          className="console-log-node-type" 
          style={{ 
            backgroundColor: '#4CAF50',
            padding: '2px 6px',
            borderRadius: '3px',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '10px',
            marginRight: '8px'
          }}
        >
          DEBUG
        </div>
      </div>
      
      {/* Console.log content */}
      <div 
        className="console-log-node-content" 
        style={{ 
          fontSize: '12px',
          color: '#333',
          marginBottom: '8px',
          padding: '4px',
          borderRadius: '3px',
          background: '#fff',
          minHeight: '40px',
          border: '1px solid #C8E6C9'
        }}
      >
        {isEditing ? (
          <input
            type="text"
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: '12px',
              padding: '0',
              background: 'transparent'
            }}
            placeholder="Enter value to log..."
          />
        ) : (
          value || "console.log()"
        )}
      </div>
      
      {/* Execution flow handles (triangles) - better integrated with the node */}
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
      
      {/* Input handle for data */}
      <Handle
        type="target"
        position={Position.Left}
        id="input-value"
        style={{ 
          background: attributeColor, 
          width: '8px', 
          height: '8px',
          left: 0,
          top: '50%'
        }}
      />
    </div>
  );
};

export default memo(ConsoleLogNode);
