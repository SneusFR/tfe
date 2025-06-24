import { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import DeleteButton from '../../components/common/DeleteButton';

// Connection colors
const EXECUTION_LINK_COLOR = '#555'; // Gray for execution links
const DATA_LINK_COLOR = '#3498db';    // Blue for data links

const SendingMailNode = ({ data, id }) => {
  // SendingMailNode component initialization
  const [hoveredHandle, setHoveredHandle] = useState(null);
  
  // Default values if data is missing
  const emailAttributes = data?.emailAttributes || {
    account_id: '',
    fromEmail: 'sender@example.com',
    fromDisplayName: 'Sender Name',
    toEmail: 'recipient@example.com',
    toDisplayName: 'Recipient Name',
    subject: 'Email Subject',
    content: 'Email content...',
    reply_to: '',
    cc: [],
    bcc: [],
    custom_headers: []
  };
  
  // Define attribute colors for handles - matching the colors from ConditionNode
  const attributeColors = {
    account_id: '#FF5722', // Deep Orange
    from: '#4CAF50',       // Green
    to: '#4CAF50',         // Green (same as from for consistency)
    subject: '#2196F3',    // Blue
    body: '#9C27B0',       // Purple
    reply_to: '#FF9800',   // Orange
    cc: '#607D8B',         // Blue Grey
    bcc: '#F44336',        // Red
    custom_headers: '#795548' // Brown
  };
  
  // Handle hover effects
  const handleMouseEnter = (handleId) => {
    setHoveredHandle(handleId);
  };
  
  const handleMouseLeave = () => {
    setHoveredHandle(null);
  };
  
  // Common styles for data handles
  const getDataHandleStyle = (color, handleId, position) => {
    const isHovered = hoveredHandle === handleId;
    const baseStyle = {
      background: color,
      width: isHovered ? '14px' : '10px',
      height: isHovered ? '14px' : '10px',
      border: isHovered ? '2px solid white' : 'none',
      boxShadow: isHovered ? `0 0 6px ${color}` : 'none',
      transition: 'all 0.2s ease',
      cursor: 'crosshair',
    };
    
    // Position the handle correctly based on whether it's on the left or right
    if (position === Position.Left) {
      return {
        ...baseStyle,
        left: 0,
      };
    } else {
      return {
        ...baseStyle,
        right: 0,
      };
    }
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
      className="sending-mail-node"
      style={{ 
        borderTop: '3px solid #2196F3', // Blue for sending mail nodes
        backgroundColor: '#f0f8ff', // Light blue background
        border: '1px solid #bbdefb',
        borderRadius: '5px',
        padding: '10px',
        minWidth: '200px',
        minHeight: '200px',
        boxShadow: '0 4px 8px rgba(33, 150, 243, 0.25)',
        zIndex: 10,
        position: 'relative'
      }}
    >
      {/* Delete button - visibility controlled by CSS */}
      {data.onDelete && <DeleteButton id={id} onDelete={data.onDelete} />}
      
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
      
      {/* Node header */}
      <div className="sending-mail-node-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <div 
          className="sending-mail-node-type" 
          style={{ 
            backgroundColor: '#2196F3',
            padding: '2px 6px',
            borderRadius: '3px',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '10px',
            marginRight: '8px'
          }}
        >
          SENDING MAIL
        </div>
        <div 
          className="sending-mail-node-title" 
          style={{ 
            fontWeight: '500',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          Send Email
        </div>
      </div>
      
      {/* Email attributes section */}
      <div 
        className="email-attributes"
        style={{
          marginTop: '12px',
          borderTop: '1px dashed #2196F3',
          paddingTop: '8px'
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '6px', color: '#2196F3' }}>
          EMAIL PARAMETERS
        </div>
        
        <div className="attribute-list" style={{ fontSize: '10px' }}>
          {/* Account ID attribute */}
          <div className="attribute-item" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '4px', 
            position: 'relative',
            padding: '2px 4px',
            borderRadius: '3px',
            backgroundColor: hoveredHandle === 'attr-account_id' || hoveredHandle === 'out-account_id' ? 'rgba(255, 87, 34, 0.1)' : 'transparent',
            transition: 'background-color 0.2s ease'
          }}>
            <div 
              className="attribute-badge"
              style={{ 
                backgroundColor: attributeColors.account_id,
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                marginRight: '4px'
              }}
            ></div>
            <div style={{ flex: 1 }}>
              <strong>Account ID:</strong> {emailAttributes.account_id || 'Required'}
            </div>
            {/* Input Handle for Account ID attribute */}
            <Handle
              type="target"
              position={Position.Left}
              id="attr-account_id"
              style={getDataHandleStyle(attributeColors.account_id, 'attr-account_id', Position.Left)}
              onMouseEnter={() => handleMouseEnter('attr-account_id')}
              onMouseLeave={handleMouseLeave}
            />
            {/* Output Handle for Account ID attribute */}
            <Handle
              type="source"
              position={Position.Right}
              id="out-account_id"
              style={getDataHandleStyle(attributeColors.account_id, 'out-account_id', Position.Right)}
              onMouseEnter={() => handleMouseEnter('out-account_id')}
              onMouseLeave={handleMouseLeave}
            />
          </div>
          
          {/* FromEmail attribute */}
          <div className="attribute-item" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '4px', 
            position: 'relative',
            padding: '2px 4px',
            borderRadius: '3px',
            backgroundColor: hoveredHandle === 'attr-fromEmail' || hoveredHandle === 'out-fromEmail' ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
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
            {/* Input Handle for FromEmail attribute */}
            <Handle
              type="target"
              position={Position.Left}
              id="attr-fromEmail"
              style={getDataHandleStyle(attributeColors.from, 'attr-fromEmail', Position.Left)}
              onMouseEnter={() => handleMouseEnter('attr-fromEmail')}
              onMouseLeave={handleMouseLeave}
            />
            {/* Output Handle for FromEmail attribute */}
            <Handle
              type="source"
              position={Position.Right}
              id="out-fromEmail"
              style={getDataHandleStyle(attributeColors.from, 'out-fromEmail', Position.Right)}
              onMouseEnter={() => handleMouseEnter('out-fromEmail')}
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
            backgroundColor: hoveredHandle === 'attr-fromDisplayName' || hoveredHandle === 'out-fromDisplayName' ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
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
            {/* Input Handle for FromDisplayName attribute */}
            <Handle
              type="target"
              position={Position.Left}
              id="attr-fromDisplayName"
              style={getDataHandleStyle(attributeColors.from, 'attr-fromDisplayName', Position.Left)}
              onMouseEnter={() => handleMouseEnter('attr-fromDisplayName')}
              onMouseLeave={handleMouseLeave}
            />
            {/* Output Handle for FromDisplayName attribute */}
            <Handle
              type="source"
              position={Position.Right}
              id="out-fromDisplayName"
              style={getDataHandleStyle(attributeColors.from, 'out-fromDisplayName', Position.Right)}
              onMouseEnter={() => handleMouseEnter('out-fromDisplayName')}
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
            backgroundColor: hoveredHandle === 'attr-toEmail' || hoveredHandle === 'out-toEmail' ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
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
              <strong>ToEmail:</strong> {emailAttributes.toEmail || 'Required'}
            </div>
            {/* Input Handle for ToEmail attribute */}
            <Handle
              type="target"
              position={Position.Left}
              id="attr-toEmail"
              style={getDataHandleStyle(attributeColors.to, 'attr-toEmail', Position.Left)}
              onMouseEnter={() => handleMouseEnter('attr-toEmail')}
              onMouseLeave={handleMouseLeave}
            />
            {/* Output Handle for ToEmail attribute */}
            <Handle
              type="source"
              position={Position.Right}
              id="out-toEmail"
              style={getDataHandleStyle(attributeColors.to, 'out-toEmail', Position.Right)}
              onMouseEnter={() => handleMouseEnter('out-toEmail')}
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
            backgroundColor: hoveredHandle === 'attr-toDisplayName' || hoveredHandle === 'out-toDisplayName' ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
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
              <strong>ToDisplayName:</strong> {emailAttributes.toDisplayName || 'Required'}
            </div>
            {/* Input Handle for ToDisplayName attribute */}
            <Handle
              type="target"
              position={Position.Left}
              id="attr-toDisplayName"
              style={getDataHandleStyle(attributeColors.to, 'attr-toDisplayName', Position.Left)}
              onMouseEnter={() => handleMouseEnter('attr-toDisplayName')}
              onMouseLeave={handleMouseLeave}
            />
            {/* Output Handle for ToDisplayName attribute */}
            <Handle
              type="source"
              position={Position.Right}
              id="out-toDisplayName"
              style={getDataHandleStyle(attributeColors.to, 'out-toDisplayName', Position.Right)}
              onMouseEnter={() => handleMouseEnter('out-toDisplayName')}
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
            backgroundColor: hoveredHandle === 'attr-subject' || hoveredHandle === 'out-subject' ? 'rgba(33, 150, 243, 0.1)' : 'transparent',
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
            {/* Input Handle for Subject attribute */}
            <Handle
              type="target"
              position={Position.Left}
              id="attr-subject"
              style={getDataHandleStyle(attributeColors.subject, 'attr-subject', Position.Left)}
              onMouseEnter={() => handleMouseEnter('attr-subject')}
              onMouseLeave={handleMouseLeave}
            />
            {/* Output Handle for Subject attribute */}
            <Handle
              type="source"
              position={Position.Right}
              id="out-subject"
              style={getDataHandleStyle(attributeColors.subject, 'out-subject', Position.Right)}
              onMouseEnter={() => handleMouseEnter('out-subject')}
              onMouseLeave={handleMouseLeave}
            />
          </div>
          
          {/* Body attribute */}
          <div className="attribute-item" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '4px', 
            position: 'relative',
            padding: '2px 4px',
            borderRadius: '3px',
            backgroundColor: hoveredHandle === 'attr-body' || hoveredHandle === 'out-body' ? 'rgba(156, 39, 176, 0.1)' : 'transparent',
            transition: 'background-color 0.2s ease'
          }}>
            <div 
              className="attribute-badge"
              style={{ 
                backgroundColor: attributeColors.body,
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                marginRight: '4px'
              }}
            ></div>
            <div style={{ flex: 1 }}>
              <strong>Body:</strong> {emailAttributes.content ? emailAttributes.content.substring(0, 30) + '...' : 'Required'}
            </div>
            {/* Input Handle for Body attribute */}
            <Handle
              type="target"
              position={Position.Left}
              id="attr-body"
              style={getDataHandleStyle(attributeColors.body, 'attr-body', Position.Left)}
              onMouseEnter={() => handleMouseEnter('attr-body')}
              onMouseLeave={handleMouseLeave}
            />
            {/* Output Handle for Body attribute */}
            <Handle
              type="source"
              position={Position.Right}
              id="out-body"
              style={getDataHandleStyle(attributeColors.body, 'out-body', Position.Right)}
              onMouseEnter={() => handleMouseEnter('out-body')}
              onMouseLeave={handleMouseLeave}
            />
          </div>
          
          {/* Reply To attribute */}
          <div className="attribute-item" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '4px', 
            position: 'relative',
            padding: '2px 4px',
            borderRadius: '3px',
            backgroundColor: hoveredHandle === 'attr-reply_to' || hoveredHandle === 'out-reply_to' ? 'rgba(255, 152, 0, 0.1)' : 'transparent',
            transition: 'background-color 0.2s ease'
          }}>
            <div 
              className="attribute-badge"
              style={{ 
                backgroundColor: attributeColors.reply_to,
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                marginRight: '4px'
              }}
            ></div>
            <div style={{ flex: 1 }}>
              <strong>Reply To:</strong> {emailAttributes.reply_to || 'Optional'}
            </div>
            {/* Input Handle for Reply To attribute */}
            <Handle
              type="target"
              position={Position.Left}
              id="attr-reply_to"
              style={getDataHandleStyle(attributeColors.reply_to, 'attr-reply_to', Position.Left)}
              onMouseEnter={() => handleMouseEnter('attr-reply_to')}
              onMouseLeave={handleMouseLeave}
            />
            {/* Output Handle for Reply To attribute */}
            <Handle
              type="source"
              position={Position.Right}
              id="out-reply_to"
              style={getDataHandleStyle(attributeColors.reply_to, 'out-reply_to', Position.Right)}
              onMouseEnter={() => handleMouseEnter('out-reply_to')}
              onMouseLeave={handleMouseLeave}
            />
          </div>
          
          {/* CC attribute */}
          <div className="attribute-item" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '4px', 
            position: 'relative',
            padding: '2px 4px',
            borderRadius: '3px',
            backgroundColor: hoveredHandle === 'attr-cc' || hoveredHandle === 'out-cc' ? 'rgba(96, 125, 139, 0.1)' : 'transparent',
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
              <strong>CC:</strong> {emailAttributes.cc && emailAttributes.cc.length > 0 
                ? `${emailAttributes.cc.length} recipients` 
                : 'Optional'}
            </div>
            {/* Input Handle for CC attribute */}
            <Handle
              type="target"
              position={Position.Left}
              id="attr-cc"
              style={getDataHandleStyle(attributeColors.cc, 'attr-cc', Position.Left)}
              onMouseEnter={() => handleMouseEnter('attr-cc')}
              onMouseLeave={handleMouseLeave}
            />
            {/* Output Handle for CC attribute */}
            <Handle
              type="source"
              position={Position.Right}
              id="out-cc"
              style={getDataHandleStyle(attributeColors.cc, 'out-cc', Position.Right)}
              onMouseEnter={() => handleMouseEnter('out-cc')}
              onMouseLeave={handleMouseLeave}
            />
          </div>
          
          {/* BCC attribute */}
          <div className="attribute-item" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '4px', 
            position: 'relative',
            padding: '2px 4px',
            borderRadius: '3px',
            backgroundColor: hoveredHandle === 'attr-bcc' || hoveredHandle === 'out-bcc' ? 'rgba(244, 67, 54, 0.1)' : 'transparent',
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
              <strong>BCC:</strong> {emailAttributes.bcc && emailAttributes.bcc.length > 0 
                ? `${emailAttributes.bcc.length} recipients` 
                : 'Optional'}
            </div>
            {/* Input Handle for BCC attribute */}
            <Handle
              type="target"
              position={Position.Left}
              id="attr-bcc"
              style={getDataHandleStyle(attributeColors.bcc, 'attr-bcc', Position.Left)}
              onMouseEnter={() => handleMouseEnter('attr-bcc')}
              onMouseLeave={handleMouseLeave}
            />
            {/* Output Handle for BCC attribute */}
            <Handle
              type="source"
              position={Position.Right}
              id="out-bcc"
              style={getDataHandleStyle(attributeColors.bcc, 'out-bcc', Position.Right)}
              onMouseEnter={() => handleMouseEnter('out-bcc')}
              onMouseLeave={handleMouseLeave}
            />
          </div>
          
          {/* Custom Headers attribute */}
          <div className="attribute-item" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '4px', 
            position: 'relative',
            padding: '2px 4px',
            borderRadius: '3px',
            backgroundColor: hoveredHandle === 'attr-custom_headers' || hoveredHandle === 'out-custom_headers' ? 'rgba(121, 85, 72, 0.1)' : 'transparent',
            transition: 'background-color 0.2s ease'
          }}>
            <div 
              className="attribute-badge"
              style={{ 
                backgroundColor: attributeColors.custom_headers,
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                marginRight: '4px'
              }}
            ></div>
            <div style={{ flex: 1 }}>
              <strong>Custom Headers:</strong> {emailAttributes.custom_headers && emailAttributes.custom_headers.length > 0 
                ? `${emailAttributes.custom_headers.length} headers` 
                : 'Optional'}
            </div>
            {/* Input Handle for Custom Headers attribute */}
            <Handle
              type="target"
              position={Position.Left}
              id="attr-custom_headers"
              style={getDataHandleStyle(attributeColors.custom_headers, 'attr-custom_headers', Position.Left)}
              onMouseEnter={() => handleMouseEnter('attr-custom_headers')}
              onMouseLeave={handleMouseLeave}
            />
            {/* Output Handle for Custom Headers attribute */}
            <Handle
              type="source"
              position={Position.Right}
              id="out-custom_headers"
              style={getDataHandleStyle(attributeColors.custom_headers, 'out-custom_headers', Position.Right)}
              onMouseEnter={() => handleMouseEnter('out-custom_headers')}
              onMouseLeave={handleMouseLeave}
            />
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default memo(SendingMailNode);
