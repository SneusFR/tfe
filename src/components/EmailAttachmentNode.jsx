import { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';

// Connection colors
const EXECUTION_LINK_COLOR = '#555'; // Gray for execution links
const DATA_LINK_COLOR = '#3498db';    // Blue for data links

const EmailAttachmentNode = ({ data, id }) => {
  // EmailAttachmentNode component initialization
  const [hoveredHandle, setHoveredHandle] = useState(null);
  
  // Default values if data is missing
  const emailAttributes = data?.emailAttributes || {
    account_id: '',
    email_id: '',
    attachment_id: ''
  };
  
  // Define attribute colors for handles - matching the colors from ConditionNode
  const attributeColors = {
    account_id: '#FF5722', // Deep Orange
    email_id: '#4CAF50',   // Green
    attachment_id: '#2196F3' // Blue
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
      left: 0,
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

  // Output handle styles
  const getOutputHandleStyle = (color, handleId) => {
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
  
  return (
    <div 
      className="email-attachment-node"
      style={{ 
        borderTop: '3px solid #9C27B0', // Purple for attachment nodes
        backgroundColor: '#f9f0ff', // Light purple background
        border: '1px solid #e1bee7',
        borderRadius: '5px',
        padding: '10px',
        minWidth: '200px',
        minHeight: '150px',
        boxShadow: '0 4px 8px rgba(156, 39, 176, 0.25)',
        zIndex: 10,
        position: 'relative'
      }}
    >
      {/* Execution flow handles (triangles) */}
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
      <div className="email-attachment-node-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <div 
          className="email-attachment-node-type" 
          style={{ 
            backgroundColor: '#9C27B0',
            padding: '2px 6px',
            borderRadius: '3px',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '10px',
            marginRight: '8px'
          }}
        >
          EMAIL ATTACHMENT
        </div>
        <div 
          className="email-attachment-node-title" 
          style={{ 
            fontWeight: '500',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          Get Attachment
        </div>
      </div>
      
      {/* Email attributes section */}
      <div 
        className="email-attributes"
        style={{
          marginTop: '12px',
          borderTop: '1px dashed #9C27B0',
          paddingTop: '8px'
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '6px', color: '#9C27B0' }}>
          PARAMETERS
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
            backgroundColor: hoveredHandle === 'attr-account_id' ? 'rgba(255, 87, 34, 0.1)' : 'transparent',
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
            {/* Handle for Account ID attribute */}
            <Handle
              type="target"
              position={Position.Left}
              id="attr-account_id"
              style={getDataHandleStyle(attributeColors.account_id, 'attr-account_id')}
              onMouseEnter={() => handleMouseEnter('attr-account_id')}
              onMouseLeave={handleMouseLeave}
            />
          </div>
          
          {/* Email ID attribute */}
          <div className="attribute-item" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '4px', 
            position: 'relative',
            padding: '2px 4px',
            borderRadius: '3px',
            backgroundColor: hoveredHandle === 'attr-email_id' ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
            transition: 'background-color 0.2s ease'
          }}>
            <div 
              className="attribute-badge"
              style={{ 
                backgroundColor: attributeColors.email_id,
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                marginRight: '4px'
              }}
            ></div>
            <div style={{ flex: 1 }}>
              <strong>Email ID:</strong> {emailAttributes.email_id || 'Required'}
            </div>
            {/* Handle for Email ID attribute */}
            <Handle
              type="target"
              position={Position.Left}
              id="attr-email_id"
              style={getDataHandleStyle(attributeColors.email_id, 'attr-email_id')}
              onMouseEnter={() => handleMouseEnter('attr-email_id')}
              onMouseLeave={handleMouseLeave}
            />
          </div>
          
          {/* Attachment ID attribute */}
          <div className="attribute-item" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '4px', 
            position: 'relative',
            padding: '2px 4px',
            borderRadius: '3px',
            backgroundColor: hoveredHandle === 'attr-attachment_id' ? 'rgba(33, 150, 243, 0.1)' : 'transparent',
            transition: 'background-color 0.2s ease'
          }}>
            <div 
              className="attribute-badge"
              style={{ 
                backgroundColor: attributeColors.attachment_id,
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                marginRight: '4px'
              }}
            ></div>
            <div style={{ flex: 1 }}>
              <strong>Attachment ID:</strong> {emailAttributes.attachment_id || 'Required'}
            </div>
            {/* Handle for Attachment ID attribute */}
            <Handle
              type="target"
              position={Position.Left}
              id="attr-attachment_id"
              style={getDataHandleStyle(attributeColors.attachment_id, 'attr-attachment_id')}
              onMouseEnter={() => handleMouseEnter('attr-attachment_id')}
              onMouseLeave={handleMouseLeave}
            />
          </div>
        </div>
      </div>

      {/* Output section */}
      <div 
        className="output-section"
        style={{
          marginTop: '12px',
          borderTop: '1px dashed #9C27B0',
          paddingTop: '8px'
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '6px', color: '#9C27B0' }}>
          OUTPUT
        </div>
        
        <div className="output-list" style={{ fontSize: '10px' }}>
          {/* Attachment data output */}
          <div className="output-item" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '4px', 
            position: 'relative',
            padding: '2px 4px',
            borderRadius: '3px',
            backgroundColor: hoveredHandle === 'output-attachment' ? 'rgba(156, 39, 176, 0.1)' : 'transparent',
            transition: 'background-color 0.2s ease'
          }}>
            <div 
              className="output-badge"
              style={{ 
                backgroundColor: '#9C27B0',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                marginRight: '4px'
              }}
            ></div>
            <div style={{ flex: 1 }}>
              <strong>Attachment Data</strong>
            </div>
            {/* Handle for Attachment output */}
            <Handle
              type="source"
              position={Position.Right}
              id="output-attachment"
              style={getOutputHandleStyle('#9C27B0', 'output-attachment')}
              onMouseEnter={() => handleMouseEnter('output-attachment')}
              onMouseLeave={handleMouseLeave}
            />
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default memo(EmailAttachmentNode);
