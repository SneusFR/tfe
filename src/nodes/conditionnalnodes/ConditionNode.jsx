import { memo, useMemo, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import NodeFieldSelector from '../../components/NodeFieldSelector';
import { useNodeFields } from '../../context/NodeFieldsContext';
import DeleteButton from '../../components/common/DeleteButton';

// Connection colors
const EXECUTION_LINK_COLOR = '#555'; // Gray for execution links
const DATA_LINK_COLOR = '#3498db';    // Blue for data links

const ConditionNode = ({ data, id }) => {
  // ConditionNode component initialization
  const { getVisibleFields, updateVisibleFields, getAvailableFields } = useNodeFields();
  
  // Memoize extracted data from props to prevent unnecessary recalculations
  const {
    returnText,
    conditionText,
    isStartingPoint,
    isConnectedToStartingNode,
    connectionIndicator,
    emailAttributes,
    isSelected
  } = useMemo(() => {
    const returnText = data?.returnText || 'Condition Output';
    const conditionText = data?.conditionText || 'Mail condition';
    const isStartingPoint = data?.isStartingPoint || false;
    const isConnectedToStartingNode = data?.isConnectedToStartingNode || false;
    const connectionIndicator = data?.connectionIndicator;
    
    // Email attributes for starting point nodes
    const emailAttributes = isStartingPoint ? (data?.emailAttributes || {
      email_id: 'email-123', // Added email_id field
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
    
    return {
      returnText,
      conditionText,
      isStartingPoint,
      isConnectedToStartingNode,
      connectionIndicator,
      emailAttributes,
      isSelected: data?.isSelected || false
    };
  }, [data]);
  
  // Get available fields for this node type
  const availableFields = useMemo(() => 
    getAvailableFields('conditionNode'), 
  [getAvailableFields]);
  
  // Get visible fields for this specific node
  const visibleFields = useMemo(() => 
    getVisibleFields(id, 'conditionNode'), 
  [getVisibleFields, id]);
  
  // Handle field visibility changes
  const handleVisibleFieldsChange = useCallback((fields) => {
    updateVisibleFields(id, fields);
  }, [updateVisibleFields, id]);
  
  // Define attribute colors for handles - memoized to prevent recreation
  const attributeColors = useMemo(() => ({
    from: '#4CAF50',     // Green
    to: '#4CAF50',       // Green (same as from)
    subject: '#2196F3',  // Blue
    date: '#FF9800',     // Orange
    content: '#9C27B0',  // Purple
    attachments: '#795548', // Brown
    cc: '#607D8B',       // Blue Grey
    bcc: '#F44336'       // Red
  }), []);
  
  // Common styles for data handles - memoized to prevent recreation on each render
  const getDataHandleStyle = useCallback((color) => {
    return {
      background: color,
      width: '10px',
      height: '10px',
      right: 0,
      cursor: 'crosshair',
    };
  }, []);
  
  // Execution handle styles - memoized to prevent recreation on each render
  const getExecutionHandleStyle = useCallback((position) => {
    const baseStyle = {
      background: 'transparent',
      width: 0,
      height: 0,
      borderTop: '6px solid transparent',
      borderBottom: '6px solid transparent',
    };
    
    if (position === 'left') {
      return {
        ...baseStyle,
        borderRight: '10px solid ' + EXECUTION_LINK_COLOR,
        top: 0,
        left: -10,
        opacity: 0.8,
      };
    } else {
      return {
        ...baseStyle,
        borderLeft: '10px solid ' + EXECUTION_LINK_COLOR,
        top: 0,
        right: -10,
        opacity: 0.8,
      };
    }
  }, []);
  
  // Memoize node style to prevent recreation on each render
  const nodeStyle = useMemo(() => ({
    borderTop: `3px solid ${isStartingPoint ? '#e74c3c' : '#8e44ad'}`, // Red for starting points, purple for regular
    backgroundColor: isStartingPoint ? '#fef9f9' : 'white',
    border: `1px solid ${isStartingPoint ? '#f7d9d9' : '#ddd'}`,
    borderRadius: '5px',
    padding: '10px',
    minWidth: '200px',
    minHeight: isStartingPoint ? '200px' : '100px', // Taller for starting points with attributes
    boxShadow: isStartingPoint ? '0 4px 12px rgba(231, 76, 60, 0.25)' : '0 4px 8px rgba(0, 0, 0, 0.2)',
    zIndex: isStartingPoint ? 15 : 10, // Higher z-index for starting points
    position: 'relative',
    transition: 'box-shadow 0.3s ease, transform 0.2s ease'
  }), [isStartingPoint]);
  
  return (
    <div 
      className={`condition-node ${isStartingPoint ? 'starting-point' : ''}`}
      style={nodeStyle}
    >
      {/* Delete button - visibility controlled by CSS */}
      {data.onDelete && <DeleteButton id={id} onDelete={data.onDelete} />}
      
      {/* Execution flow handles (triangles) - better integrated with the node */}
      {/* Only show left handle if not a starting point */}
      {!isStartingPoint && (
        <Handle
          type="target"
          position={Position.Left}
          id="execution"
          style={getExecutionHandleStyle('left')}
        />
      )}
      
      <Handle
        type="source"
        position={Position.Right}
        id="execution"
        style={getExecutionHandleStyle('right')}
      />
      
      {/* Default handles for connections removed as they're not needed */}
      
      {/* Connection indicator */}
      {connectionIndicator}
      
      {/* Node header with starting point badge */}
      <div className="condition-node-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
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
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div 
            className="condition-node-title" 
            style={{ 
              fontWeight: '500',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {returnText}
          </div>
          {isStartingPoint && emailAttributes && (
            <NodeFieldSelector
              node={id}
              isSelected={true}
              fields={availableFields}
              visibleFields={visibleFields}
              onVisibleFieldsChange={handleVisibleFieldsChange}
            />
          )}
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
      
      
      {/* Field selector gear icon is now moved inside the node header next to the title */}
      
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
            {/* Email ID attribute */}
            {visibleFields.includes('Email ID') && (
              <div className="attribute-item" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '4px', 
                position: 'relative',
                padding: '2px 4px',
                borderRadius: '3px',
                backgroundColor: 'transparent'
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
                  <strong>Email ID:</strong> {emailAttributes.email_id}
                </div>
                {/* Handle for Email ID attribute */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id="attr-email_id"
                  style={getDataHandleStyle(attributeColors.from)}
                />
              </div>
            )}
            
            {/* FromEmail attribute */}
            {visibleFields.includes('FromEmail') && (
              <div className="attribute-item" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '4px', 
                position: 'relative',
                padding: '2px 4px',
                borderRadius: '3px',
                backgroundColor: 'transparent'
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
                  style={getDataHandleStyle(attributeColors.from)}
                />
              </div>
            )}
            
            {/* FromDisplayName attribute */}
            {visibleFields.includes('FromDisplayName') && (
              <div className="attribute-item" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '4px', 
                position: 'relative',
                padding: '2px 4px',
                borderRadius: '3px',
                backgroundColor: 'transparent'
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
                  style={getDataHandleStyle(attributeColors.from)}
                />
              </div>
            )}
            
            {/* ToEmail attribute */}
            {visibleFields.includes('ToEmail') && (
              <div className="attribute-item" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '4px', 
                position: 'relative',
                padding: '2px 4px',
                borderRadius: '3px',
                backgroundColor: 'transparent'
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
                  style={getDataHandleStyle(attributeColors.to)}
                />
              </div>
            )}
            
            {/* ToDisplayName attribute */}
            {visibleFields.includes('ToDisplayName') && (
              <div className="attribute-item" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '4px', 
                position: 'relative',
                padding: '2px 4px',
                borderRadius: '3px',
                backgroundColor: 'transparent'
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
                  style={getDataHandleStyle(attributeColors.to)}
                />
              </div>
            )}
            
            {/* Subject attribute */}
            {visibleFields.includes('Subject') && (
              <div className="attribute-item" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '4px', 
                position: 'relative',
                padding: '2px 4px',
                borderRadius: '3px',
                backgroundColor: 'transparent'
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
                  style={getDataHandleStyle(attributeColors.subject)}
                />
              </div>
            )}
            
            {/* Date attribute */}
            {visibleFields.includes('Date') && (
              <div className="attribute-item" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '4px', 
                position: 'relative',
                padding: '2px 4px',
                borderRadius: '3px',
                backgroundColor: 'transparent'
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
                  style={getDataHandleStyle(attributeColors.date)}
                />
              </div>
            )}
            
            {/* Content attribute */}
            {visibleFields.includes('Content') && (
              <div className="attribute-item" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '4px', 
                position: 'relative',
                padding: '2px 4px',
                borderRadius: '3px',
                backgroundColor: 'transparent'
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
                  <strong>Content:</strong> {emailAttributes.content ? emailAttributes.content.substring(0, 30) + '...' : 'No content'}
                </div>
                {/* Handle for Content attribute */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id="attr-content"
                  style={getDataHandleStyle(attributeColors.content)}
                />
              </div>
            )}
            
            {/* Attachment ID attribute */}
            {visibleFields.includes('Attachment ID') && (
              <div className="attribute-item" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '4px', 
                position: 'relative',
                padding: '2px 4px',
                borderRadius: '3px',
                backgroundColor: 'transparent'
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
                  <strong>Attachment ID:</strong> {emailAttributes.attachments && emailAttributes.attachments.length > 0 ? 
                    emailAttributes.attachments[0].id || 'Available' : 'None'}
                </div>
                {/* Handle for Attachment ID attribute */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id="attr-attachment_id"
                  style={getDataHandleStyle(attributeColors.attachments)}
                />
              </div>
            )}
            
            {/* Attachments attribute (if any) */}
            {emailAttributes.attachments && emailAttributes.attachments.length > 0 && (
              <>
                <div className="attribute-item" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '4px', 
                  position: 'relative',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  backgroundColor: 'transparent'
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
                    style={getDataHandleStyle(attributeColors.attachments)}
                  />
                </div>
                
                {/* Individual attachment items with ID handles */}
                {emailAttributes.attachments.map((attachment, index) => (
                  <div 
                    key={`attachment-${index}`}
                    className="attribute-item attachment-item" 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '4px',
                      marginLeft: '12px',
                      position: 'relative',
                      padding: '2px 4px',
                      borderRadius: '3px',
                      backgroundColor: 'transparent',
                      fontSize: '9px'
                    }}
                  >
                    <div 
                      className="attribute-badge"
                      style={{ 
                        backgroundColor: attributeColors.attachments,
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        marginRight: '4px'
                      }}
                    ></div>
                    <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <strong>File:</strong> {attachment.name || `Attachment ${index + 1}`}
                      {attachment.id && <span style={{ marginLeft: '4px', color: '#777' }}>(ID: {attachment.id})</span>}
                    </div>
                    {/* Handle for individual attachment ID */}
                    <Handle
                      type="source"
                      position={Position.Right}
                      id={`attr-attachment-${index}`}
                      style={getDataHandleStyle(attributeColors.attachments)}
                    />
                  </div>
                ))}
              </>
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
                backgroundColor: 'transparent'
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
                  style={getDataHandleStyle(attributeColors.cc)}
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
                backgroundColor: 'transparent'
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
                  style={getDataHandleStyle(attributeColors.bcc)}
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
