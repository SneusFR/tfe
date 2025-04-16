import { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';

// Connection colors
const EXECUTION_LINK_COLOR = '#555'; // Gray for execution links
const DATA_LINK_COLOR = '#3498db';    // Blue for data links

const ConditionNode = ({ data, id }) => {
  // ConditionNode component initialization
  const [hoveredHandle, setHoveredHandle] = useState(null);
  
  // Default values if data is missing
  const returnText = data?.returnText || 'Condition Output';
  const conditionText = data?.conditionText || 'Mail condition';
  const isStartingPoint = data?.isStartingPoint || false;
  
  // Email attributes for starting point nodes
  const emailAttributes = isStartingPoint ? (data?.emailAttributes || {
    fromEmail: 'sender@example.com',
    fromDisplayName: 'Sender Name',
    toEmail: 'recipient@example.com',
    toDisplayName: 'Recipient Name',
    subject: 'Email Subject',
    date: new Date().toISOString(),
    content: 'Email content...',
    attachments: [],
    cc: [],
    bcc: []
  }) : null;
  
  // Define attribute colors for handles
  const attributeColors = {
    from: '#4CAF50',     // Green
    to: '#4CAF50',       // Green (same as from)
    subject: '#2196F3',  // Blue
    date: '#FF9800',     // Orange
    content: '#9C27B0',  // Purple
    attachments: '#795548', // Brown
    cc: '#607D8B',       // Blue Grey
    bcc: '#F44336'       // Red
  };
  
  // Handle hover effects
  const handleMouseEnter = (handleId) => {
    setHoveredHandle(handleId);
  };
  
  const handleMouseLeave = () => {
    setHoveredHandle(null);
  };
  
  // Common styles for data handles
  const getDataHandleStyle = (color, handleId) => {
    const isHovered = hoveredHandle === handleId;
    return {
      background: color,
      width: isHovered ? '14px' : '10px',
      height: isHovered ? '14px' : '10px',
      right: 0,
      border: isHovered ? '2px solid white' : 'none',
      boxShadow: isHovered ? `0 0 6px ${color}` : 'none',
      transition: 'all 0.2s ease',
      cursor: 'crosshair',
    };
  };
  
  // Execution handle styles
  const getExecutionHandleStyle = (position, isHovered) => {
    const baseStyle = {
      background: 'transparent',
      width: 0,
      height: 0,
      borderTop: '6px solid transparent',
      borderBottom: '6px solid transparent',
      transition: 'all 0.2s ease',
    };
    
    if (position === 'left') {
      return {
        ...baseStyle,
        borderRight: `${isHovered ? '12px' : '10px'} solid ${EXECUTION_LINK_COLOR}`,
        top: 0,
        left: -10,
        opacity: isHovered ? 1 : 0.8,
        filter: isHovered ? `drop-shadow(0 0 3px ${EXECUTION_LINK_COLOR})` : 'none',
      };
    } else {
      return {
        ...baseStyle,
        borderLeft: `${isHovered ? '12px' : '10px'} solid ${EXECUTION_LINK_COLOR}`,
        top: 0,
        right: -10,
        opacity: isHovered ? 1 : 0.8,
        filter: isHovered ? `drop-shadow(0 0 3px ${EXECUTION_LINK_COLOR})` : 'none',
      };
    }
  };
  
  return (
    <div 
      className={`condition-node ${isStartingPoint ? 'starting-point' : ''}`}
      style={{ 
        borderTop: `3px solid ${isStartingPoint ? '#e74c3c' : '#8e44ad'}`, // Red for starting points, purple for regular
        backgroundColor: isStartingPoint ? '#fef9f9' : 'white',
        border: `1px solid ${isStartingPoint ? '#f7d9d9' : '#ddd'}`,
        borderRadius: '5px',
        padding: '10px',
        minWidth: '200px',
        minHeight: isStartingPoint ? '200px' : '100px', // Taller for starting points with attributes
        boxShadow: isStartingPoint ? '0 4px 12px rgba(231, 76, 60, 0.25)' : '0 4px 8px rgba(0, 0, 0, 0.2)',
        zIndex: isStartingPoint ? 15 : 10, // Higher z-index for starting points
        position: 'relative'
      }}
    >
      {/* Execution flow handles (triangles) - better integrated with the node */}
      <Handle
        type="target"
        position={Position.Left}
        id="execution"
        style={getExecutionHandleStyle('left', hoveredHandle === 'execution-left')}
        onMouseEnter={() => handleMouseEnter('execution-left')}
        onMouseLeave={handleMouseLeave}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="execution"
        style={getExecutionHandleStyle('right', hoveredHandle === 'execution-right')}
        onMouseEnter={() => handleMouseEnter('execution-right')}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* Node header with condition type */}
      <div className="condition-node-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <div 
          className="condition-node-type" 
          style={{ 
            backgroundColor: '#8e44ad',
            padding: '2px 6px',
            borderRadius: '3px',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '10px',
            marginRight: '8px'
          }}
        >
          CONDITION
        </div>
        {isStartingPoint && (
          <div 
            className="starting-point-badge" 
            style={{ 
              backgroundColor: '#e74c3c',
              padding: '2px 6px',
              borderRadius: '3px',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '10px',
              marginRight: '8px'
            }}
          >
            START
          </div>
        )}
        <div 
          className="condition-node-title" 
          style={{ 
            fontWeight: '500',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          Mail Condition
        </div>
      </div>
      
      {/* Condition text */}
      <div 
        className="condition-node-text" 
        style={{ 
          fontSize: '11px',
          color: '#555',
          marginBottom: '8px',
          border: '1px solid #eee',
          padding: '4px',
          borderRadius: '3px',
          background: '#f9f9f9'
        }}
      >
        <strong>If mail resembles:</strong> {conditionText}
      </div>
      
      {/* Return text */}
      <div 
        className="condition-node-return" 
        style={{ 
          fontSize: '11px',
          color: '#555',
          marginBottom: '8px',
          border: '1px solid #eee',
          padding: '4px',
          borderRadius: '3px',
          background: '#f9f9f9'
        }}
      >
        <strong>Return:</strong> {returnText}
      </div>
      
      
      {/* Email attributes section for starting points */}
      {isStartingPoint && emailAttributes && (
        <div 
          className="email-attributes"
          style={{
            marginTop: '12px',
            borderTop: '1px dashed #e74c3c',
            paddingTop: '8px'
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '6px', color: '#e74c3c' }}>
            EMAIL ATTRIBUTES
          </div>
          
          <div className="attribute-list" style={{ fontSize: '10px' }}>
            {/* FromEmail attribute */}
            <div className="attribute-item" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '4px', 
              position: 'relative',
              padding: '2px 4px',
              borderRadius: '3px',
              backgroundColor: hoveredHandle === 'attr-fromEmail' ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
              transition: 'background-color 0.2s ease'
            }}>
              <div 
                className="attribute-badge"
                style={{ 
                  backgroundColor: attributeColors.from,
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  marginRight: '4px'
                }}
              ></div>
              <div style={{ flex: 1 }}>
                <strong>FromEmail:</strong> {emailAttributes.fromEmail}
              </div>
              {/* Handle for FromEmail attribute */}
              <Handle
                type="source"
                position={Position.Right}
                id="attr-fromEmail"
                style={getDataHandleStyle(attributeColors.from, 'attr-fromEmail')}
                onMouseEnter={() => handleMouseEnter('attr-fromEmail')}
                onMouseLeave={handleMouseLeave}
              />
            </div>
            
            {/* FromDisplayName attribute */}
            <div className="attribute-item" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '4px', 
              position: 'relative',
              padding: '2px 4px',
              borderRadius: '3px',
              backgroundColor: hoveredHandle === 'attr-fromDisplayName' ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
              transition: 'background-color 0.2s ease'
            }}>
              <div 
                className="attribute-badge"
                style={{ 
                  backgroundColor: attributeColors.from,
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  marginRight: '4px'
                }}
              ></div>
              <div style={{ flex: 1 }}>
                <strong>FromDisplayName:</strong> {emailAttributes.fromDisplayName}
              </div>
              {/* Handle for FromDisplayName attribute */}
              <Handle
                type="source"
                position={Position.Right}
                id="attr-fromDisplayName"
                style={getDataHandleStyle(attributeColors.from, 'attr-fromDisplayName')}
                onMouseEnter={() => handleMouseEnter('attr-fromDisplayName')}
                onMouseLeave={handleMouseLeave}
              />
            </div>
            
            {/* ToEmail attribute */}
            <div className="attribute-item" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '4px', 
              position: 'relative',
              padding: '2px 4px',
              borderRadius: '3px',
              backgroundColor: hoveredHandle === 'attr-toEmail' ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
              transition: 'background-color 0.2s ease'
            }}>
              <div 
                className="attribute-badge"
                style={{ 
                  backgroundColor: attributeColors.to,
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  marginRight: '4px'
                }}
              ></div>
              <div style={{ flex: 1 }}>
                <strong>ToEmail:</strong> {emailAttributes.toEmail}
              </div>
              {/* Handle for ToEmail attribute */}
              <Handle
                type="source"
                position={Position.Right}
                id="attr-toEmail"
                style={getDataHandleStyle(attributeColors.to, 'attr-toEmail')}
                onMouseEnter={() => handleMouseEnter('attr-toEmail')}
                onMouseLeave={handleMouseLeave}
              />
            </div>
            
            {/* ToDisplayName attribute */}
            <div className="attribute-item" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '4px', 
              position: 'relative',
              padding: '2px 4px',
              borderRadius: '3px',
              backgroundColor: hoveredHandle === 'attr-toDisplayName' ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
              transition: 'background-color 0.2s ease'
            }}>
              <div 
                className="attribute-badge"
                style={{ 
                  backgroundColor: attributeColors.to,
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  marginRight: '4px'
                }}
              ></div>
              <div style={{ flex: 1 }}>
                <strong>ToDisplayName:</strong> {emailAttributes.toDisplayName}
              </div>
              {/* Handle for ToDisplayName attribute */}
              <Handle
                type="source"
                position={Position.Right}
                id="attr-toDisplayName"
                style={getDataHandleStyle(attributeColors.to, 'attr-toDisplayName')}
                onMouseEnter={() => handleMouseEnter('attr-toDisplayName')}
                onMouseLeave={handleMouseLeave}
              />
            </div>
            
            {/* Subject attribute */}
            <div className="attribute-item" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '4px', 
              position: 'relative',
              padding: '2px 4px',
              borderRadius: '3px',
              backgroundColor: hoveredHandle === 'attr-subject' ? 'rgba(33, 150, 243, 0.1)' : 'transparent',
              transition: 'background-color 0.2s ease'
            }}>
              <div 
                className="attribute-badge"
                style={{ 
                  backgroundColor: attributeColors.subject,
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  marginRight: '4px'
                }}
              ></div>
              <div style={{ flex: 1 }}>
                <strong>Subject:</strong> {emailAttributes.subject}
              </div>
              {/* Handle for Subject attribute */}
              <Handle
                type="source"
                position={Position.Right}
                id="attr-subject"
                style={getDataHandleStyle(attributeColors.subject, 'attr-subject')}
                onMouseEnter={() => handleMouseEnter('attr-subject')}
                onMouseLeave={handleMouseLeave}
              />
            </div>
            
            {/* Date attribute */}
            <div className="attribute-item" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '4px', 
              position: 'relative',
              padding: '2px 4px',
              borderRadius: '3px',
              backgroundColor: hoveredHandle === 'attr-date' ? 'rgba(255, 152, 0, 0.1)' : 'transparent',
              transition: 'background-color 0.2s ease'
            }}>
              <div 
                className="attribute-badge"
                style={{ 
                  backgroundColor: attributeColors.date,
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  marginRight: '4px'
                }}
              ></div>
              <div style={{ flex: 1 }}>
                <strong>Date:</strong> {new Date(emailAttributes.date).toLocaleString()}
              </div>
              {/* Handle for Date attribute */}
              <Handle
                type="source"
                position={Position.Right}
                id="attr-date"
                style={getDataHandleStyle(attributeColors.date, 'attr-date')}
                onMouseEnter={() => handleMouseEnter('attr-date')}
                onMouseLeave={handleMouseLeave}
              />
            </div>
            
            {/* Content attribute */}
            <div className="attribute-item" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '4px', 
              position: 'relative',
              padding: '2px 4px',
              borderRadius: '3px',
              backgroundColor: hoveredHandle === 'attr-content' ? 'rgba(156, 39, 176, 0.1)' : 'transparent',
              transition: 'background-color 0.2s ease'
            }}>
              <div 
                className="attribute-badge"
                style={{ 
                  backgroundColor: attributeColors.content,
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  marginRight: '4px'
                }}
              ></div>
              <div style={{ flex: 1 }}>
                <strong>Content:</strong> {emailAttributes.content.substring(0, 30)}...
              </div>
              {/* Handle for Content attribute */}
              <Handle
                type="source"
                position={Position.Right}
                id="attr-content"
                style={getDataHandleStyle(attributeColors.content, 'attr-content')}
                onMouseEnter={() => handleMouseEnter('attr-content')}
                onMouseLeave={handleMouseLeave}
              />
            </div>
            
            {/* Attachments attribute (if any) */}
            {emailAttributes.attachments && emailAttributes.attachments.length > 0 && (
              <div className="attribute-item" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '4px', 
                position: 'relative',
                padding: '2px 4px',
                borderRadius: '3px',
                backgroundColor: hoveredHandle === 'attr-attachments' ? 'rgba(121, 85, 72, 0.1)' : 'transparent',
                transition: 'background-color 0.2s ease'
              }}>
                <div 
                  className="attribute-badge"
                  style={{ 
                    backgroundColor: attributeColors.attachments,
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    marginRight: '4px'
                  }}
                ></div>
                <div style={{ flex: 1 }}>
                  <strong>Attachments:</strong> {emailAttributes.attachments.length} files
                </div>
                {/* Handle for Attachments attribute */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id="attr-attachments"
                  style={getDataHandleStyle(attributeColors.attachments, 'attr-attachments')}
                  onMouseEnter={() => handleMouseEnter('attr-attachments')}
                  onMouseLeave={handleMouseLeave}
                />
              </div>
            )}
            
            {/* CC attribute (if any) */}
            {emailAttributes.cc && emailAttributes.cc.length > 0 && (
              <div className="attribute-item" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '4px', 
                position: 'relative',
                padding: '2px 4px',
                borderRadius: '3px',
                backgroundColor: hoveredHandle === 'attr-cc' ? 'rgba(96, 125, 139, 0.1)' : 'transparent',
                transition: 'background-color 0.2s ease'
              }}>
                <div 
                  className="attribute-badge"
                  style={{ 
                    backgroundColor: attributeColors.cc,
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    marginRight: '4px'
                  }}
                ></div>
                <div style={{ flex: 1 }}>
                  <strong>CC:</strong> {emailAttributes.cc.length} recipients
                </div>
                {/* Handle for CC attribute */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id="attr-cc"
                  style={getDataHandleStyle(attributeColors.cc, 'attr-cc')}
                  onMouseEnter={() => handleMouseEnter('attr-cc')}
                  onMouseLeave={handleMouseLeave}
                />
              </div>
            )}
            
            {/* BCC attribute (if any) */}
            {emailAttributes.bcc && emailAttributes.bcc.length > 0 && (
              <div className="attribute-item" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '4px', 
                position: 'relative',
                padding: '2px 4px',
                borderRadius: '3px',
                backgroundColor: hoveredHandle === 'attr-bcc' ? 'rgba(244, 67, 54, 0.1)' : 'transparent',
                transition: 'background-color 0.2s ease'
              }}>
                <div 
                  className="attribute-badge"
                  style={{ 
                    backgroundColor: attributeColors.bcc,
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    marginRight: '4px'
                  }}
                ></div>
                <div style={{ flex: 1 }}>
                  <strong>BCC:</strong> {emailAttributes.bcc.length} recipients
                </div>
                {/* Handle for BCC attribute */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id="attr-bcc"
                  style={getDataHandleStyle(attributeColors.bcc, 'attr-bcc')}
                  onMouseEnter={() => handleMouseEnter('attr-bcc')}
                  onMouseLeave={handleMouseLeave}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(ConditionNode);
