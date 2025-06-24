import { memo, useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import DeleteButton from '../../components/common/DeleteButton';

// Connection colors
const EXECUTION_LINK_COLOR = '#555'; // Gray for execution links

const EndNode = ({ data = {}, id }) => {
  // Extract data with defaults
  const {
    isConnectedToStartingNode,
    connectionIndicator
  } = useMemo(() => ({
    isConnectedToStartingNode: data?.isConnectedToStartingNode || false,
    connectionIndicator: data?.connectionIndicator
  }), [data]);

  // Memoize node style to prevent recreation on each render
  const nodeStyle = useMemo(() => ({
    backgroundColor: '#f93e3e', // Red background
    border: '3px solid #d32f2f', // Darker red border
    borderRadius: '50%', // Make it circular
    width: '60px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 8px rgba(249, 62, 62, 0.3)',
    zIndex: 10,
    position: 'relative',
    transition: 'box-shadow 0.3s ease, transform 0.2s ease',
    cursor: 'default'
  }), []);

  // Memoize icon style
  const iconStyle = useMemo(() => ({
    color: 'white',
    fontSize: '20px',
    fontWeight: 'bold',
    userSelect: 'none'
  }), []);

  // Memoize label style
  const labelStyle = useMemo(() => ({
    position: 'absolute',
    bottom: '-25px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '12px',
    fontWeight: '500',
    color: '#333',
    whiteSpace: 'nowrap',
    userSelect: 'none'
  }), []);

  return (
    <div 
      className="end-node" 
      style={nodeStyle}
    >
      {/* Delete button - visibility controlled by CSS */}
      {data.onDelete && <DeleteButton id={id} onDelete={data.onDelete} />}
      
      {/* Connection indicator */}
      {connectionIndicator}
      
      {/* Execution flow handle - only input (left side) */}
      <Handle
        type="target"
        position={Position.Left}
        id="execution"
        style={{ 
          background: 'transparent', 
          width: 0,
          height: 0,
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
          borderRight: '12px solid ' + EXECUTION_LINK_COLOR,
          top: '50%',
          left: -12,
          transform: 'translateY(-50%)'
        }}
      />
      
      {/* End icon */}
      <div style={iconStyle}>
        ⏹
      </div>
      
      {/* Label */}
      <div style={labelStyle}>
        END
      </div>
    </div>
  );
};

export default memo(EndNode);
