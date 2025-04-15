import { memo } from 'react';
import { Handle, Position } from 'reactflow';

const SendingMailNode = ({ data, id }) => {
  // SendingMailNode component initialization
  
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
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#555', width: '10px', height: '10px' }}
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
          <div className="attribute-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', position: 'relative' }}>
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
            {/* Handle for Account ID attribute */}
            <Handle
              type="target"
              position={Position.Left}
              id="attr-account_id"
              style={{ 
                background: attributeColors.account_id, 
                width: '8px', 
                height: '8px',
                left: 0
              }}
            />
          </div>
          
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
              type="target"
              position={Position.Left}
              id="attr-fromEmail"
              style={{ 
                background: attributeColors.from, 
                width: '10px', 
                height: '10px',
                left: 0
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
              type="target"
              position={Position.Left}
              id="attr-fromDisplayName"
              style={{ 
                background: attributeColors.from, 
                width: '10px', 
                height: '10px',
                left: 0
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
              <strong>ToEmail:</strong> {emailAttributes.toEmail || 'Required'}
            </div>
            {/* Handle for ToEmail attribute */}
            <Handle
              type="target"
              position={Position.Left}
              id="attr-toEmail"
              style={{ 
                background: attributeColors.to, 
                width: '10px', 
                height: '10px',
                left: 0
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
              <strong>ToDisplayName:</strong> {emailAttributes.toDisplayName || 'Required'}
            </div>
            {/* Handle for ToDisplayName attribute */}
            <Handle
              type="target"
              position={Position.Left}
              id="attr-toDisplayName"
              style={{ 
                background: attributeColors.to, 
                width: '10px', 
                height: '10px',
                left: 0
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
              type="target"
              position={Position.Left}
              id="attr-subject"
              style={{ 
                background: attributeColors.subject, 
                width: '8px', 
                height: '8px',
                left: 0
              }}
            />
          </div>
          
          {/* Body attribute */}
          <div className="attribute-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', position: 'relative' }}>
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
            {/* Handle for Body attribute */}
            <Handle
              type="target"
              position={Position.Left}
              id="attr-body"
              style={{ 
                background: attributeColors.body, 
                width: '8px', 
                height: '8px',
                left: 0
              }}
            />
          </div>
          
          {/* Reply To attribute */}
          <div className="attribute-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', position: 'relative' }}>
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
            {/* Handle for Reply To attribute */}
            <Handle
              type="target"
              position={Position.Left}
              id="attr-reply_to"
              style={{ 
                background: attributeColors.reply_to, 
                width: '8px', 
                height: '8px',
                left: 0
              }}
            />
          </div>
          
          {/* CC attribute */}
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
              <strong>CC:</strong> {emailAttributes.cc.length > 0 
                ? `${emailAttributes.cc.length} recipients` 
                : 'Optional'}
            </div>
            {/* Handle for CC attribute */}
            <Handle
              type="target"
              position={Position.Left}
              id="attr-cc"
              style={{ 
                background: attributeColors.cc, 
                width: '8px', 
                height: '8px',
                left: 0
              }}
            />
          </div>
          
          {/* BCC attribute */}
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
              <strong>BCC:</strong> {emailAttributes.bcc.length > 0 
                ? `${emailAttributes.bcc.length} recipients` 
                : 'Optional'}
            </div>
            {/* Handle for BCC attribute */}
            <Handle
              type="target"
              position={Position.Left}
              id="attr-bcc"
              style={{ 
                background: attributeColors.bcc, 
                width: '8px', 
                height: '8px',
                left: 0
              }}
            />
          </div>
          
          {/* Custom Headers attribute */}
          <div className="attribute-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', position: 'relative' }}>
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
              <strong>Custom Headers:</strong> {emailAttributes.custom_headers.length > 0 
                ? `${emailAttributes.custom_headers.length} headers` 
                : 'Optional'}
            </div>
            {/* Handle for Custom Headers attribute */}
            <Handle
              type="target"
              position={Position.Left}
              id="attr-custom_headers"
              style={{ 
                background: attributeColors.custom_headers, 
                width: '8px', 
                height: '8px',
                left: 0
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#555', width: '10px', height: '10px' }}
      />
    </div>
  );
};

export default memo(SendingMailNode);
