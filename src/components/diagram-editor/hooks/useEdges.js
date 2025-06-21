import { useCallback } from 'react';
import { applyEdgeChanges, addEdge, MarkerType } from 'reactflow';
import { updateApiNodeBindings } from '../../../utils/apiNodeUtils';
import { EXECUTION_LINK_COLOR, DATA_LINK_COLOR, EXECUTION_LINK_STYLE, DATA_LINK_STYLE } from '../diagramConfig';

/**
 * Custom hook to handle edge-related operations
 */
export function useEdges({
  nodes,
  edges,
  setNodes,
  setEdges,
  canEdit,
  onEdgesChange,
  onNodesChange,
  onConnect,
  setAnimatingEdge
}) {
  // Handle edge changes (add, remove, update)
  const handleEdgesChange = useCallback(
    (changes) => {
      if (!canEdit) {
        console.log("Permission denied: User doesn't have editor rights to modify edges");
        alert("Vous n'avez pas la permission de modifier ce flow");
        return;
      }
      
      const updatedEdges = applyEdgeChanges(changes, edges);
      setEdges(updatedEdges);
      if (onEdgesChange) onEdgesChange(updatedEdges);
      
      // Check if any edges were removed and update API node bindings
      const removedEdges = changes.filter(change => change.type === 'remove');
      if (removedEdges.length > 0) {
        // For each removed edge, check if it was connected to an API node
        removedEdges.forEach(change => {
          const edge = edges.find(e => e.id === change.id);
          if (edge && edge.targetHandle?.startsWith('body-')) {
            // Update the API node bindings
            const updatedNodes = updateApiNodeBindings(nodes, updatedEdges, edge.target);
            setNodes(updatedNodes);
            if (onNodesChange) onNodesChange(updatedNodes);
          }
        });
      }
      
      // No automatic saving - changes are stored in local state only
    },
    [edges, nodes, setEdges, setNodes, onEdgesChange, onNodesChange, canEdit]
  );

  // Handle connection creation
  const handleConnect = useCallback(
    (params) => {
      if (!canEdit) {
        console.log("Permission denied: User doesn't have editor rights to create connections");
        alert("Vous n'avez pas la permission de créer des connexions dans ce flow");
        return;
      }
      
      const edgeId = `edge-${Date.now()}`;
      
      // Add default handles if missing
      const sourceHandle = params.sourceHandle ?? 'default-out';
      const targetHandle = params.targetHandle ?? 'default-in';
      
      // Determine if this is an execution link or a data link
      // Execution links connect handles with IDs 'execution'
      const isExecutionLink =
      sourceHandle?.startsWith('execution') &&
      targetHandle?.startsWith('execution');
      
      const linkColor = isExecutionLink ? EXECUTION_LINK_COLOR : DATA_LINK_COLOR;
      
      const newEdge = {
        id: edgeId,
        source: params.source,
        target: params.target,
        sourceHandle,
        targetHandle,
        style: isExecutionLink ? EXECUTION_LINK_STYLE : DATA_LINK_STYLE,
        animated: false,
        type: isExecutionLink ? 'smoothstep' : 'default', // Smoother curves for execution links
        data: {
          isExecutionLink: isExecutionLink,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: isExecutionLink ? 15 : 12,
          height: isExecutionLink ? 15 : 12,
          color: isExecutionLink ? '#4CAF50' : linkColor,
        },
        labelStyle: { fill: '#333', fontWeight: 500, fontSize: 10 },
        labelBgStyle: { fill: '#fff', fillOpacity: 0.8 },
        className: 'new-connection', // Add class for connection animation
      };

      // Set the animating edge ID to trigger the connection animation
      if (isExecutionLink) {
        setAnimatingEdge(edgeId);
      }

      const updatedEdges = addEdge(newEdge, edges);
      setEdges(updatedEdges);
      if (onConnect) onConnect(updatedEdges);
      
      // Check if the connection is to an API node body field
      if (targetHandle?.startsWith('body-')) {
        // Update the API node bindings
        const updatedNodes = updateApiNodeBindings(nodes, updatedEdges, params.target);
        setNodes(updatedNodes);
        if (onNodesChange) onNodesChange(updatedNodes);
      }
    },
    [edges, nodes, setEdges, setNodes, onConnect, onNodesChange, canEdit, setAnimatingEdge]
  );

  return {
    handleEdgesChange,
    handleConnect
  };
}
