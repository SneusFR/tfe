import React, { memo, useMemo } from 'react';
import { Handle, Position } from 'reactflow';

// Connection colors
const EXECUTION_LINK_COLOR = '#555';

const SubFlowNode = ({ data, id }) => {
  // Extract data with defaults
  const {
    subFlowName,
    startNodeData,
    endNodeData,
    intermediateNodes,
    isConnectedToStartingNode,
    isCollapsed,
    onExpand,
    onCollapse
  } = useMemo(() => ({
    subFlowName: data?.subFlowName || 'Sub-Flow',
    startNodeData: data?.startNodeData || {},
    endNodeData: data?.endNodeData || {},
    intermediateNodes: data?.intermediateNodes || [],
    isConnectedToStartingNode: data?.isConnectedToStartingNode || false,
    isCollapsed: data?.isCollapsed !== false, // Default to collapsed
    onExpand: data?.onExpand,
    onCollapse: data?.onCollapse
  }), [data]);

  // Handle expand/collapse button click
  const handleExpandClick = (e) => {
    e.stopPropagation(); // Prevent node selection
    console.log('SubFlowNode expand button clicked:', id, 'isCollapsed:', isCollapsed);
    console.log('onExpand callback:', typeof onExpand);
    console.log('onCollapse callback:', typeof onCollapse);
    
    if (isCollapsed) {
      console.log('Expanding sub-flow:', id);
      if (typeof onExpand === 'function') {
        onExpand(id);
      } else {
        console.error('onExpand is not a function:', onExpand);
      }
    } else {
      console.log('Collapsing sub-flow:', id);
      if (typeof onCollapse === 'function') {
        onCollapse(id);
      } else {
        console.error('onCollapse is not a function:', onCollapse);
      }
    }
  };

  // Memoize node style
  const nodeStyle = useMemo(() => ({
    backgroundColor: '#f8f9fa',
    border: '2px solid #6c757d',
    borderRadius: '8px',
    padding: '12px',
    minWidth: '250px',
    minHeight: '120px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    position: 'relative',
    transition: 'all 0.3s ease'
  }), []);

  // Memoize header style
  const headerStyle = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
    borderBottom: '1px solid #dee2e6',
    paddingBottom: '6px'
  }), []);

  // Memoize content style
  const contentStyle = useMemo(() => ({
    fontSize: '11px',
    color: '#495057'
  }), []);

  // Memoize expand button style
  const expandButtonStyle = useMemo(() => ({
    position: 'absolute',
    top: '8px',
    right: '8px',
    backgroundColor: isCollapsed ? '#28a745' : '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '10px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s ease',
    zIndex: 10
  }), [isCollapsed]);

  return (
    <div 
      className="subflow-node" 
      style={nodeStyle}
    >
      {/* Delete button */}
      {data.deleteButton}
      
      {/* Expand/Collapse button */}
      <button
        style={expandButtonStyle}
        onClick={handleExpandClick}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
        }}
        title={isCollapsed ? 'Expandre le sous-flux' : 'Réduire le sous-flux'}
      >
        {isCollapsed ? '🔍' : '📦'}
        <span>{isCollapsed ? 'Ouvrir' : 'Fermer'}</span>
      </button>
      
      {/* Execution flow handles */}
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
          top: '50%',
          left: -10,
          transform: 'translateY(-50%)'
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
          top: '50%',
          right: -10,
          transform: 'translateY(-50%)'
        }}
      />
      
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div 
            style={{ 
              backgroundColor: '#6c757d',
              padding: '2px 6px',
              borderRadius: '3px',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '10px',
              marginRight: '8px'
            }}
          >
            SUB-FLOW
          </div>
          <div style={{ fontWeight: '600', fontSize: '12px' }}>
            {subFlowName}
          </div>
        </div>
      </div>
      
      {/* Content - Summary of nodes */}
      <div style={contentStyle}>
        <div style={{ marginBottom: '6px' }}>
          <strong>Start:</strong> {startNodeData.conditionText || 'Condition'}
        </div>
        
        {intermediateNodes.length > 0 && (
          <div style={{ marginBottom: '6px' }}>
            <strong>Nodes:</strong> {intermediateNodes.length} intermediate node(s)
            <div style={{ fontSize: '10px', color: '#6c757d', marginTop: '2px' }}>
              {intermediateNodes.slice(0, 3).map((node, index) => (
                <span key={index}>
                  {node.type === 'sendingMailNode' ? '📧' : 
                   node.type === 'textNode' ? '📝' : 
                   node.type === 'conditionalFlowNode' ? '🔀' : 
                   node.type === 'apiNode' ? '🔗' : 
                   node.type === 'mailBodyNode' ? '📄' : '⚙️'} {node.type}
                  {index < Math.min(intermediateNodes.length, 3) - 1 ? ', ' : ''}
                </span>
              ))}
              {intermediateNodes.length > 3 && <span>...</span>}
            </div>
          </div>
        )}
        
        <div>
          <strong>End:</strong> Flow termination
        </div>
      </div>
      
      {/* Status indicator */}
      <div style={{
        position: 'absolute',
        bottom: '4px',
        right: '8px',
        fontSize: '10px',
        color: '#6c757d',
        fontStyle: 'italic'
      }}>
        {isCollapsed ? 'Condensé' : 'Étendu'}
      </div>
    </div>
  );
};

export default memo(SubFlowNode);
