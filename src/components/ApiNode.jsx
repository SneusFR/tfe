import { memo } from 'react';
import { Handle, Position } from 'reactflow';

const methodColors = {
  get: '#61affe',    // Blue
  post: '#49cc90',   // Green
  put: '#fca130',    // Orange
  delete: '#f93e3e', // Red
  patch: '#50e3c2',  // Teal
  options: '#0d5aa7', // Dark Blue
  head: '#9012fe',   // Purple
};

// Connection colors
const EXECUTION_LINK_COLOR = '#555'; // Gray for execution links
const DATA_LINK_COLOR = '#3498db';    // Blue for data links

// Custom triangle handle component for execution flow
const TriangleHandle = ({ type, position, id, style }) => {
  const baseStyle = {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    position: 'absolute',
    ...style
  };

  // Adjust the triangle shape based on the position
  let triangleStyle;
  if (position === Position.Top) {
    triangleStyle = {
      ...baseStyle,
      borderWidth: '0 8px 8px 8px',
      borderColor: 'transparent transparent #555 transparent',
      top: -8,
      left: '50%',
      transform: 'translateX(-50%)',
    };
  } else if (position === Position.Right) {
    triangleStyle = {
      ...baseStyle,
      borderWidth: '8px 0 8px 8px',
      borderColor: 'transparent transparent transparent #555',
      right: -8,
      top: '50%',
      transform: 'translateY(-50%)',
    };
  } else if (position === Position.Bottom) {
    triangleStyle = {
      ...baseStyle,
      borderWidth: '8px 8px 0 8px',
      borderColor: '#555 transparent transparent transparent',
      bottom: -8,
      left: '50%',
      transform: 'translateX(-50%)',
    };
  } else if (position === Position.Left) {
    triangleStyle = {
      ...baseStyle,
      borderWidth: '8px 8px 8px 0',
      borderColor: 'transparent #555 transparent transparent',
      left: -8,
      top: '50%',
      transform: 'translateY(-50%)',
    };
  }

  return (
    <div 
      className={`react-flow__handle react-flow__handle-${position} triangle-handle`} 
      style={triangleStyle}
      data-handleid={id}
      data-nodeid={id}
      data-handlepos={position}
    />
  );
};

const ApiNode = ({ data, id }) => {
  // ApiNode component initialization
  
  // Default values if data is missing
  const method = data?.method || 'get';
  const path = data?.path || '/unknown';
  const summary = data?.summary || '';
  const parameters = data?.parameters || [];
  const requestBody = data?.requestBody || null;
  const responses = data?.responses || {};
  const isConnectedToStartingNode = data?.isConnectedToStartingNode || false;
  const connectionIndicator = data?.connectionIndicator;
  
  // Determine if the node has inputs (parameters or request body)
  const hasInputs = parameters.length > 0 || requestBody;
  
  // Determine if the node has outputs (responses) and prepare output data structure
  const hasOutputs = Object.keys(responses).length > 0;
  
  // Define possible output data fields based on response
  const outputFields = [
    { id: 'response', label: 'Response', description: 'Complete response object' },
    { id: 'body', label: 'Body', description: 'Response body data' },
    { id: 'status', label: 'Status', description: 'HTTP status code' }
  ];
  
  return (
    <div 
      className="api-node" 
      style={{ 
        borderTop: `3px solid ${methodColors[method] || '#999'}`,
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '5px',
        padding: '10px',
        minWidth: '200px',
        minHeight: '100px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        zIndex: 10,
        position: 'relative',
        transition: 'box-shadow 0.3s ease, transform 0.2s ease'
      }}
    >
      {/* Connection indicator */}
      {connectionIndicator}
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
      
      {/* Node header with method and path */}
      <div className="api-node-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <div 
          className="api-node-method" 
          style={{ 
            backgroundColor: methodColors[method] || '#999',
            padding: '2px 6px',
            borderRadius: '3px',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '10px',
            marginRight: '8px'
          }}
        >
          {method.toUpperCase()}
        </div>
        <div 
          className="api-node-path" 
          style={{ 
            fontWeight: '500',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {path}
        </div>
      </div>
      
      {/* Node content with summary */}
      {summary && (
        <div 
          className="api-node-summary" 
          style={{ 
            fontSize: '11px',
            color: '#666',
            marginBottom: '8px'
          }}
        >
          {summary}
        </div>
      )}
      
      {/* Input section */}
      {hasInputs && (
        <div 
          className="api-node-section" 
          style={{ 
            marginTop: '8px',
            borderTop: '1px solid #eee',
            paddingTop: '8px'
          }}
        >
          <div 
            className="api-node-section-title" 
            style={{ 
              fontWeight: '500',
              fontSize: '11px',
              marginBottom: '4px'
            }}
          >
            Inputs
          </div>
          <div 
            className="api-node-section-content" 
            style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            {parameters.map((param, index) => (
              <div 
                key={index} 
                className="api-node-param" 
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '10px',
                  position: 'relative'
                }}
              >
                {/* Individual handle for each parameter */}
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`param-${param.name}`}
                  style={{ 
                    background: methodColors[method] || '#555', 
                    width: '6px', 
                    height: '6px',
                    left: -4,
                    border: '1px solid white',
                    boxShadow: '0 0 2px rgba(0,0,0,0.3)'
                  }}
                />
                <span 
                  className="param-name" 
                  style={{ 
                    fontWeight: '500',
                    marginRight: '4px'
                  }}
                >
                  {param.name}
                </span>
                <span 
                  className="param-type" 
                  style={{ 
                    color: '#666'
                  }}
                >
                  {param.schema?.type || 'any'}
                </span>
                {param.required && (
                  <span 
                    className="param-required" 
                    style={{ 
                      color: '#f93e3e',
                      marginLeft: '2px'
                    }}
                  >
                    *
                  </span>
                )}
              </div>
            ))}
            {requestBody && (
              <div 
                className="api-node-request-body" 
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '10px',
                  position: 'relative'
                }}
              >
                {/* Handle for request body */}
                <Handle
                  type="target"
                  position={Position.Left}
                  id="param-body"
                  style={{ 
                    background: methodColors[method] || '#555', 
                    width: '6px', 
                    height: '6px',
                    left: -4,
                    border: '1px solid white',
                    boxShadow: '0 0 2px rgba(0,0,0,0.3)'
                  }}
                />
                <span 
                  className="request-body-label" 
                  style={{ 
                    fontWeight: '500'
                  }}
                >
                  Body
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Responses section */}
      {hasOutputs && (
        <div 
          className="api-node-section" 
          style={{ 
            marginTop: '8px',
            borderTop: '1px solid #eee',
            paddingTop: '8px'
          }}
        >
          <div 
            className="api-node-section-title" 
            style={{ 
              fontWeight: '500',
              fontSize: '11px',
              marginBottom: '4px'
            }}
          >
            Responses
          </div>
          <div 
            className="api-node-section-content" 
            style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            {Object.entries(responses).map(([code, response], index) => (
              <div 
                key={index} 
                className="api-node-response" 
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '10px'
                }}
              >
                <span 
                  className="response-code" 
                  style={{ 
                    fontWeight: '500',
                    marginRight: '4px'
                  }}
                >
                  {code}
                </span>
                <span 
                  className="response-description" 
                  style={{ 
                    color: '#666'
                  }}
                >
                  {response.description || ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Output section with handles */}
      {hasOutputs && (
        <div 
          className="api-node-section" 
          style={{ 
            marginTop: '8px',
            borderTop: '1px solid #eee',
            paddingTop: '8px'
          }}
        >
          <div 
            className="api-node-section-title" 
            style={{ 
              fontWeight: '500',
              fontSize: '11px',
              marginBottom: '4px'
            }}
          >
            Output
          </div>
          <div 
            className="api-node-section-content" 
            style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            {outputFields.map((field, index) => (
              <div 
                key={index} 
                className="api-node-output-field" 
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '10px',
                  position: 'relative'
                }}
              >
                <span 
                  className="output-field-name" 
                  style={{ 
                    fontWeight: '500',
                    marginRight: '4px'
                  }}
                >
                  {field.label}
                </span>
                <span 
                  className="output-field-description" 
                  style={{ 
                    color: '#666'
                  }}
                >
                  {field.description}
                </span>
                
                {/* Handle for each output field */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`output-${field.id}`}
                  style={{ 
                    background: methodColors[method] || '#555', 
                    width: '6px', 
                    height: '6px',
                    right: -4,
                    border: '1px solid white',
                    boxShadow: '0 0 2px rgba(0,0,0,0.3)'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      
    </div>
  );
};

export default memo(ApiNode);
