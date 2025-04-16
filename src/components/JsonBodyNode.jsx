import { memo, useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';

// Connection colors
const EXECUTION_LINK_COLOR = '#555'; // Gray for execution links
const DATA_LINK_COLOR = '#3498db';    // Blue for data links

const JsonBodyNode = ({ data, id }) => {
  // Default values if data is missing
  const [jsonData, setJsonData] = useState(data?.jsonData || {});
  const [sourceNodeId, setSourceNodeId] = useState(data?.sourceNodeId || null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Update local state when data changes
  useEffect(() => {
    if (data?.jsonData) {
      setJsonData(data.jsonData);
    }
    if (data?.sourceNodeId) {
      setSourceNodeId(data.sourceNodeId);
    }
  }, [data?.jsonData, data?.sourceNodeId]);
  
  // Define attribute colors for handles
  const attributeColor = '#fca130'; // Orange - same as PUT method
  
  // Function to render JSON data with handles for each property
  const renderJsonWithHandles = (obj, path = '') => {
    if (!obj || typeof obj !== 'object') return null;
    
    return (
      <div style={{ marginLeft: '10px' }}>
        {Object.entries(obj).map(([key, value], index) => {
          const currentPath = path ? `${path}.${key}` : key;
          const handleId = `handle-${currentPath}`;
          
          return (
            <div key={index} style={{ position: 'relative', marginBottom: '4px' }}>
              {/* Handle for this property */}
              <Handle
                type="target"
                position={Position.Left}
                id={handleId}
                style={{ 
                  background: attributeColor, 
                  width: '6px', 
                  height: '6px',
                  left: -4,
                  border: '1px solid white',
                  boxShadow: '0 0 2px rgba(0,0,0,0.3)'
                }}
              />
              
              <span style={{ fontWeight: 'bold', fontSize: '11px' }}>{key}: </span>
              
              {typeof value === 'object' && value !== null ? (
                <>
                  <span style={{ fontSize: '11px' }}>{Array.isArray(value) ? '[' : '{'}</span>
                  {renderJsonWithHandles(value, currentPath)}
                  <span style={{ fontSize: '11px' }}>{Array.isArray(value) ? ']' : '}'}</span>
                </>
              ) : (
                <span style={{ fontSize: '11px' }}>
                  {typeof value === 'string' ? `"${value}"` : String(value)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  
  const handleDoubleClick = () => {
    setIsEditing(true);
  };
  
  const handleBlur = () => {
    setIsEditing(false);
    // Update the node data if needed
    if (data.onJsonDataChange) {
      data.onJsonDataChange(jsonData);
    }
  };
  
  // Format JSON as a string for display/editing
  const jsonString = JSON.stringify(jsonData, null, 2);
  
  return (
    <div 
      className="json-body-node"
      style={{ 
        borderTop: '3px solid #fca130', // Orange for JSON body nodes (same as PUT)
        backgroundColor: '#fff9f0', // Light orange background
        border: '1px solid #ffe0b2',
        borderRadius: '5px',
        padding: '10px',
        minWidth: '200px',
        minHeight: '100px',
        boxShadow: '0 4px 8px rgba(252, 161, 48, 0.25)',
        zIndex: 10,
        position: 'relative'
      }}
      onDoubleClick={handleDoubleClick}
    >
      {/* Node header */}
      <div className="json-body-node-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <div 
          className="json-body-node-type" 
          style={{ 
            backgroundColor: '#fca130',
            padding: '2px 6px',
            borderRadius: '3px',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '10px',
            marginRight: '8px'
          }}
        >
          JSON BODY
        </div>
        {sourceNodeId && (
          <div 
            className="json-body-source" 
            style={{ 
              fontSize: '10px',
              color: '#666'
            }}
          >
            Source: {sourceNodeId}
          </div>
        )}
      </div>
      
      {/* JSON content */}
      <div 
        className="json-body-node-content" 
        style={{ 
          fontSize: '12px',
          color: '#333',
          marginBottom: '8px',
          padding: '4px',
          borderRadius: '3px',
          background: '#fff',
          minHeight: '60px',
          border: '1px solid #ffe0b2',
          overflow: 'auto',
          maxHeight: '200px'
        }}
      >
        {isEditing ? (
          <textarea
            value={jsonString}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setJsonData(parsed);
              } catch (error) {
                // If not valid JSON, just update the text
                // It will be validated on blur
              }
            }}
            onBlur={handleBlur}
            autoFocus
            style={{
              width: '100%',
              height: '100%',
              minHeight: '60px',
              border: 'none',
              outline: 'none',
              fontSize: '12px',
              padding: '0',
              background: 'transparent',
              fontFamily: 'monospace'
            }}
          />
        ) : (
          <div style={{ fontFamily: 'monospace' }}>
            {renderJsonWithHandles(jsonData)}
          </div>
        )}
      </div>
      
      {/* Execution flow handles */}
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
      
      {/* Output handle for the entire JSON body */}
      <Handle
        type="source"
        position={Position.Right}
        id="body"
        style={{ 
          background: attributeColor, 
          width: '8px', 
          height: '8px',
          right: 0,
          bottom: '50%'
        }}
      />
    </div>
  );
};

export default memo(JsonBodyNode);
