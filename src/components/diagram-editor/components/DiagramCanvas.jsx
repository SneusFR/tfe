import React from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { DATA_LINK_COLOR } from '../diagramConfig';

/**
 * DiagramCanvas component that encapsulates the ReactFlow canvas and its related elements
 */
const DiagramCanvas = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onEdgeClick,
  onNodeClick,
  nodeTypes,
  edgeTypes,
  onInit,
  selectionMode,
  throttledSelectionChange,
  children
}) => {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onEdgeClick={onEdgeClick}
      onNodeClick={onNodeClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onInit={onInit}
      defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
      minZoom={0.1}
      maxZoom={4}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      deleteKeyCode={['Backspace', 'Delete']} // Support both keys for deletion
      multiSelectionKeyCode={['Control', 'Meta']} // Support both Ctrl and Cmd for multi-selection
      snapToGrid={nodes.length > 100} // Enable snap to grid for large diagrams to improve performance
      snapGrid={[15, 15]}
      onlyRenderVisibleElements={nodes.length > 50} // Only render visible elements for better performance with large diagrams
      style={{ background: '#f5f5f5' }}
      edgeUpdaterRadius={10} // Increase the edge updater radius for easier edge manipulation
      edgesFocusable={true} // Make edges focusable
      edgesUpdatable={true} // Allow edges to be updated
      selectionOnDrag={selectionMode} // Enable selection by dragging when in selection mode
      selectionMode={selectionMode ? 1 : 0} // 1 = box selection, 0 = default
      panOnDrag={!selectionMode} // Disable panning when in selection mode
      nodesDraggable={!selectionMode} // Disable node dragging when in selection mode
      nodesConnectable={!selectionMode} // Disable node connections when in selection mode
      onSelectionChange={throttledSelectionChange}
      connectionLineStyle={{ 
        stroke: DATA_LINK_COLOR, 
        strokeWidth: 2.5,
        opacity: 0.6,
        strokeDasharray: '5,5'
      }}
      connectionLineType="smoothstep"
      defaultEdgeOptions={{
        type: 'smoothstep',
        animated: false,
      }}
    >
      <Controls />
      {/* Only show MiniMap for smaller diagrams to improve performance */}
      {nodes.length < 50 && <MiniMap nodeStrokeWidth={1} nodeColor="#888" />}
      {/* Use larger gap for background dots when there are many nodes to improve performance */}
      <Background variant="dots" gap={nodes.length > 200 ? 20 : 12} size={1} />
      
      {/* Render children (like DiagramToolbar, LeftPanel, etc.) */}
      {children}
    </ReactFlow>
  );
};

export default DiagramCanvas;
