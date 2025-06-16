import React from 'react';
import '../../styles/FlowPreview.css';

const FlowPreview = ({ nodes = [], edges = [], width = 240, height = 120 }) => {
  if (!nodes || nodes.length === 0) {
    return (
      <div className="flow-preview-empty" style={{ width, height }}>
        <span>No preview</span>
      </div>
    );
  }

  // Calculate bounds of all nodes
  const bounds = nodes.reduce(
    (acc, node) => {
      const x = node.position?.x || 0;
      const y = node.position?.y || 0;
      const nodeWidth = 150; // Approximate node width
      const nodeHeight = 80; // Approximate node height
      
      return {
        minX: Math.min(acc.minX, x),
        minY: Math.min(acc.minY, y),
        maxX: Math.max(acc.maxX, x + nodeWidth),
        maxY: Math.max(acc.maxY, y + nodeHeight),
      };
    },
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  );

  // Add minimal padding
  const padding = 8;
  const contentWidth = bounds.maxX - bounds.minX + padding * 2;
  const contentHeight = bounds.maxY - bounds.minY + padding * 2;

  // Calculate scale to fit in preview with better space utilization
  const scaleX = width / contentWidth;
  const scaleY = height / contentHeight;
  
  // For small diagrams, allow more scaling up; for large ones, scale down appropriately
  const maxScale = nodes.length <= 3 ? 2.0 : nodes.length <= 6 ? 1.5 : 1.2;
  const scale = Math.min(scaleX, scaleY, maxScale);

  // Center the content
  const offsetX = (width - contentWidth * scale) / 2;
  const offsetY = (height - contentHeight * scale) / 2;

  // Transform coordinates
  const transformX = (x) => (x - bounds.minX + padding) * scale + offsetX;
  const transformY = (y) => (y - bounds.minY + padding) * scale + offsetY;

  // Node type colors
  const getNodeColor = (type) => {
    switch (type) {
      case 'textNode': return '#3498db';
      case 'intNode': return '#e74c3c';
      case 'apiNode': return '#f39c12';
      case 'aiNode': return '#9b59b6';
      case 'conditionNode': return '#e67e22';
      case 'switchNode': return '#1abc9c';
      case 'logicalOperatorNode': return '#34495e';
      case 'subFlowNode': return '#8e44ad';
      case 'endNode': return '#27ae60';
      case 'booleanNode': return '#16a085';
      case 'base64Node': return '#d35400';
      case 'emailAttachmentNode': return '#c0392b';
      case 'mailBodyNode': return '#2980b9';
      case 'sendingMailNode': return '#8e44ad';
      case 'ocrNode': return '#f1c40f';
      case 'tokenNode': return '#95a5a6';
      case 'consoleLogNode': return '#7f8c8d';
      default: return '#bdc3c7';
    }
  };

  return (
    <div className="flow-preview" style={{ width, height }}>
      <svg width={width} height={height} className="flow-preview-svg">
        {/* Render edges first (behind nodes) */}
        {edges && edges.map((edge) => {
          const sourceNode = nodes.find(n => n.id === edge.source);
          const targetNode = nodes.find(n => n.id === edge.target);
          
          if (!sourceNode || !targetNode) return null;

          const sourceX = transformX(sourceNode.position.x + 75); // Center of node
          const sourceY = transformY(sourceNode.position.y + 40);
          const targetX = transformX(targetNode.position.x + 75);
          const targetY = transformY(targetNode.position.y + 40);

          return (
            <line
              key={edge.id}
              x1={sourceX}
              y1={sourceY}
              x2={targetX}
              y2={targetY}
              stroke="#94a3b8"
              strokeWidth={Math.max(1, 2 * scale)}
              opacity={0.6}
            />
          );
        })}

        {/* Render nodes */}
        {nodes.map((node) => {
          const x = transformX(node.position.x);
          const y = transformY(node.position.y);
          const nodeWidth = 150 * scale;
          const nodeHeight = 80 * scale;
          const color = getNodeColor(node.type);

          return (
            <g key={node.id}>
              <rect
                x={x}
                y={y}
                width={nodeWidth}
                height={nodeHeight}
                fill={color}
                rx={4 * scale}
                opacity={0.8}
                stroke="#ffffff"
                strokeWidth={Math.max(0.5, 1 * scale)}
              />
              {/* Node label (only show if scale is large enough) */}
              {scale > 0.3 && (
                <text
                  x={x + nodeWidth / 2}
                  y={y + nodeHeight / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={Math.max(8, 10 * scale)}
                  fontWeight="500"
                >
                  {node.type.replace('Node', '')}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      
      {/* Stats overlay */}
      <div className="flow-preview-stats">
        <span>{nodes.length} nodes</span>
        <span>{edges?.length || 0} connections</span>
      </div>
    </div>
  );
};

export default FlowPreview;
