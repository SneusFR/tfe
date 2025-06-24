import { memo, useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import DeleteButton from '../../components/common/DeleteButton';

// Connection colors
const EXECUTION_LINK_COLOR = '#555'; // Gray for execution links
const DATA_LINK_COLOR = '#3498db';    // Blue for data links

const ConsoleLogNode = ({ data = {}, id }) => {
  // Define attribute colors for handles
  const attributeColor = '#FF5722'; // Orange for debug nodes
  
  return (
    <div 
      className="console-log-node"
      style={{ 
        borderTop: '3px solid #FF5722', // Orange for debug nodes
        backgroundColor: '#FFF3E0', // Light orange background
        border: '1px solid #FFE0B2',
        borderRadius: '5px',
        padding: '10px',
        minWidth: '150px',
        minHeight: '80px',
        boxShadow: '0 4px 8px rgba(255, 87, 34, 0.25)',
        zIndex: 10,
        position: 'relative'
      }}
    >
      {/* Delete button - visibility controlled by CSS */}
      {data.onDelete && <DeleteButton id={id} onDelete={data.onDelete} />}
      
      {/* Node header */}
      <div className="console-log-node-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <div 
          className="console-log-node-type" 
          style={{ 
            backgroundColor: '#FF5722',
            padding: '2px 6px',
            borderRadius: '3px',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '10px',
            marginRight: '8px'
          }}
        >
          DEBUG
        </div>
        <div style={{ fontSize: '12px', fontWeight: 'bold' }}>Console.log</div>
      </div>
      
      {/* Node content */}
      <div 
        className="console-log-node-content" 
        style={{ 
          fontSize: '12px',
          color: '#333',
          marginBottom: '8px',
          padding: '4px',
          borderRadius: '3px',
          background: '#fff',
          minHeight: '40px',
          border: '1px solid #FFE0B2'
        }}
      >
        Logs input value to the console
      </div>
      
      {/* Execution flow handles (triangles) */}
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
      
      {/* Input handle for data to log */}
      <Handle
        type="target"
        position={Position.Left}
        id="input-value"
        style={{ 
          background: DATA_LINK_COLOR, 
          width: '8px', 
          height: '8px',
          left: 0,
          top: '50%'
        }}
      />
    </div>
  );
};

export default memo(ConsoleLogNode);
