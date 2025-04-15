import { memo } from 'react';
import { Handle, Position } from 'reactflow';

// Connection colors
const EXECUTION_LINK_COLOR = '#555'; // Gray for execution links
const DATA_LINK_COLOR = '#3498db';    // Blue for data links

const ConditionNode = ({ data, id }) => {
  // ConditionNode component initialization
  
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
            <div className="attribute-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', position: 'relative' }}>
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
                style={{ 
                  background: attributeColors.from, 
                  width: '10px', 
                  height: '10px',
                  right: 0
                }}
              />
            </div>
            
            {/* FromDisplayName attribute */}
            <div className="attribute-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', position: 'relative' }}>
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
                style={{ 
                  background: attributeColors.from, 
                  width: '10px', 
                  height: '10px',
                  right: 0
                }}
              />
            </div>
            
            {/* ToEmail attribute */}
            <div className="attribute-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', position: 'relative' }}>
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
                style={{ 
                  background: attributeColors.to, 
                  width: '10px', 
                  height: '10px',
                  right: 0
                }}
              />
            </div>
            
            {/* ToDisplayName attribute */}
            <div className="attribute-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', position: 'relative' }}>
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
                style={{ 
                  background: attributeColors.to, 
                  width: '10px', 
                  height: '10px',
                  right: 0
                }}
              />
            </div>
            
            {/* Subject attribute */}
            <div className="attribute-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', position: 'relative' }}>
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
                style={{ 
                  background: attributeColors.subject, 
                  width: '8px', 
                  height: '8px',
                  right: 0
                }}
              />
            </div>
            
            {/* Date attribute */}
            <div className="attribute-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', position: 'relative' }}>
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
                style={{ 
                  background: attributeColors.date, 
                  width: '8px', 
                  height: '8px',
                  right: 0
                }}
              />
            </div>
            
            {/* Content attribute */}
            <div className="attribute-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', position: 'relative' }}>
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
                style={{ 
                  background: attributeColors.content, 
                  width: '8px', 
                  height: '8px',
                  right: 0
                }}
              />
            </div>
            
            {/* Attachments attribute (if any) */}
            {emailAttributes.attachments && emailAttributes.attachments.length > 0 && (
              <div className="attribute-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', position: 'relative' }}>
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
                  style={{ 
                    background: attributeColors.attachments, 
                    width: '8px', 
                    height: '8px',
                    right: 0
                  }}
                />
              </div>
            )}
            
            {/* CC attribute (if any) */}
            {emailAttributes.cc && emailAttributes.cc.length > 0 && (
              <div className="attribute-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', position: 'relative' }}>
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
                  style={{ 
                    background: attributeColors.cc, 
                    width: '8px', 
                    height: '8px',
                    right: 0
                  }}
                />
              </div>
            )}
            
            {/* BCC attribute (if any) */}
            {emailAttributes.bcc && emailAttributes.bcc.length > 0 && (
              <div className="attribute-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', position: 'relative' }}>
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
                  style={{ 
                    background: attributeColors.bcc, 
                    width: '8px', 
                    height: '8px',
                    right: 0
                  }}
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
