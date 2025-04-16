import { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';

// Connection colors
const EXECUTION_LINK_COLOR = '#555'; // Gray for execution links
const DATA_LINK_COLOR = '#3498db';    // Blue for data links

const OcrNode = ({ data, id }) => {
  // OcrNode component initialization
  const [hoveredHandle, setHoveredHandle] = useState(null);
  
  // Default values if data is missing
  const ocrAttributes = data?.ocrAttributes || {
    attachment_data: null,
    language: 'auto',
    enhance_image: false
  };
  
  // Define attribute colors for handles
  const attributeColors = {
    attachment_data: '#9C27B0', // Purple for attachment data (matching EmailAttachmentNode)
    language: '#4CAF50',        // Green
    enhance_image: '#FF9800'    // Orange
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
  
  // Main OCR color - using a teal color to differentiate from other nodes
  const OCR_COLOR = '#009688'; // Teal
  
  return (
    <div 
      className="ocr-node"
      style={{ 
        borderTop: `3px solid ${OCR_COLOR}`,
        backgroundColor: '#e0f2f1', // Light teal background
        border: '1px solid #b2dfdb',
        borderRadius: '5px',
        padding: '10px',
        minWidth: '200px',
        minHeight: '150px',
        boxShadow: `0 4px 8px rgba(0, 150, 136, 0.25)`,
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
      <div className="ocr-node-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <div 
          className="ocr-node-type" 
          style={{ 
            backgroundColor: OCR_COLOR,
            padding: '2px 6px',
            borderRadius: '3px',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '10px',
            marginRight: '8px'
          }}
        >
          OCR
        </div>
        <div 
          className="ocr-node-title" 
          style={{ 
            fontWeight: '500',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          Extract Text from Image
        </div>
      </div>
      
      {/* OCR attributes section */}
      <div 
        className="ocr-attributes"
        style={{
          marginTop: '12px',
          borderTop: `1px dashed ${OCR_COLOR}`,
          paddingTop: '8px'
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '6px', color: OCR_COLOR }}>
          PARAMETERS
        </div>
        
        <div className="attribute-list" style={{ fontSize: '10px' }}>
          {/* Attachment Data attribute */}
          <div className="attribute-item" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '4px', 
            position: 'relative',
            padding: '2px 4px',
            borderRadius: '3px',
            backgroundColor: hoveredHandle === 'attr-attachment_data' ? 'rgba(156, 39, 176, 0.1)' : 'transparent',
            transition: 'background-color 0.2s ease'
          }}>
            <div 
              className="attribute-badge"
              style={{ 
                backgroundColor: attributeColors.attachment_data,
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                marginRight: '4px'
              }}
            ></div>
            <div style={{ flex: 1 }}>
              <strong>Attachment Data:</strong> {ocrAttributes.attachment_data ? 'Connected' : 'Required'}
            </div>
            {/* Handle for Attachment Data attribute */}
            <Handle
              type="target"
              position={Position.Left}
              id="attr-attachment_data"
              style={getDataHandleStyle(attributeColors.attachment_data, 'attr-attachment_data')}
              onMouseEnter={() => handleMouseEnter('attr-attachment_data')}
              onMouseLeave={handleMouseLeave}
            />
          </div>
          
          {/* Language attribute */}
          <div className="attribute-item" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '4px', 
            position: 'relative',
            padding: '2px 4px',
            borderRadius: '3px',
            backgroundColor: hoveredHandle === 'attr-language' ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
            transition: 'background-color 0.2s ease'
          }}>
            <div 
              className="attribute-badge"
              style={{ 
                backgroundColor: attributeColors.language,
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                marginRight: '4px'
              }}
            ></div>
            <div style={{ flex: 1 }}>
              <strong>Language:</strong> {ocrAttributes.language || 'auto'}
            </div>
            {/* Handle for Language attribute */}
            <Handle
              type="target"
              position={Position.Left}
              id="attr-language"
              style={getDataHandleStyle(attributeColors.language, 'attr-language')}
              onMouseEnter={() => handleMouseEnter('attr-language')}
              onMouseLeave={handleMouseLeave}
            />
          </div>
          
          {/* Enhance Image attribute */}
          <div className="attribute-item" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '4px', 
            position: 'relative',
            padding: '2px 4px',
            borderRadius: '3px',
            backgroundColor: hoveredHandle === 'attr-enhance_image' ? 'rgba(255, 152, 0, 0.1)' : 'transparent',
            transition: 'background-color 0.2s ease'
          }}>
            <div 
              className="attribute-badge"
              style={{ 
                backgroundColor: attributeColors.enhance_image,
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                marginRight: '4px'
              }}
            ></div>
            <div style={{ flex: 1 }}>
              <strong>Enhance Image:</strong> {ocrAttributes.enhance_image ? 'Yes' : 'No'}
            </div>
            {/* Handle for Enhance Image attribute */}
            <Handle
              type="target"
              position={Position.Left}
              id="attr-enhance_image"
              style={getDataHandleStyle(attributeColors.enhance_image, 'attr-enhance_image')}
              onMouseEnter={() => handleMouseEnter('attr-enhance_image')}
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
          borderTop: `1px dashed ${OCR_COLOR}`,
          paddingTop: '8px'
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '6px', color: OCR_COLOR }}>
          OUTPUT
        </div>
        
        <div className="output-list" style={{ fontSize: '10px' }}>
          {/* Extracted Text output */}
          <div className="output-item" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '4px', 
            position: 'relative',
            padding: '2px 4px',
            borderRadius: '3px',
            backgroundColor: hoveredHandle === 'output-text' ? `rgba(0, 150, 136, 0.1)` : 'transparent',
            transition: 'background-color 0.2s ease'
          }}>
            <div 
              className="output-badge"
              style={{ 
                backgroundColor: OCR_COLOR,
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                marginRight: '4px'
              }}
            ></div>
            <div style={{ flex: 1 }}>
              <strong>Extracted Text</strong>
            </div>
            {/* Handle for Extracted Text output */}
            <Handle
              type="source"
              position={Position.Right}
              id="output-text"
              style={getOutputHandleStyle(OCR_COLOR, 'output-text')}
              onMouseEnter={() => handleMouseEnter('output-text')}
              onMouseLeave={handleMouseLeave}
            />
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default memo(OcrNode);
