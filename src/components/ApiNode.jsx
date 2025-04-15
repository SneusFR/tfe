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

const ApiNode = ({ data, id }) => {
  // ApiNode component initialization
  
  // Default values if data is missing
  const method = data?.method || 'get';
  const path = data?.path || '/unknown';
  const summary = data?.summary || '';
  const parameters = data?.parameters || [];
  const requestBody = data?.requestBody || null;
  const responses = data?.responses || {};
  
  // Determine if the node has inputs (parameters or request body)
  const hasInputs = parameters.length > 0 || requestBody;
  
  // Determine if the node has outputs (responses)
  const hasOutputs = Object.keys(responses).length > 0;
  
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
        position: 'relative'
      }}
    >
      {/* Main input handle - only show if there are inputs */}
      {hasInputs && (
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          style={{ 
            background: '#555', 
            width: '10px', 
            height: '10px',
            top: 20 // Position at the top near the header
          }}
        />
      )}
      
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
      
      {/* Output section */}
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
      
      {/* Output handle - only show if there are outputs */}
      {hasOutputs && (
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          style={{ 
            background: '#555', 
            width: '10px', 
            height: '10px',
            top: 20 // Position at the top near the header to match the main input handle
          }}
        />
      )}
    </div>
  );
};

export default memo(ApiNode);
