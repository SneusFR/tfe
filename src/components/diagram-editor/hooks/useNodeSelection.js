import { useState, useCallback } from 'react';

/**
 * Custom hook to handle node selection and deletion
 */
export function useNodeSelection({
  nodes,
  edges,
  setNodes,
  setEdges,
  canEdit,
  onNodesChange,
  onEdgesChange,
  selectedNodeId,
  setSelectedNodeId
}) {
  
  // Handle node click to show delete button
  const handleNodeClick = useCallback(
    (event, node) => {
      // Only allow selection for delete if user can edit
      if (!canEdit) {
        console.log("Permission denied: User doesn't have editor rights to select nodes for deletion");
        return;
      }
      
      // Toggle selection if clicking the same node, otherwise select the new node
      setSelectedNodeId(prevId => prevId === node.id ? null : node.id);
    },
    [canEdit]
  );
  
  // Handle node deletion
  const handleNodeDelete = useCallback(
    (nodeId) => {
      if (!canEdit) {
        console.log("Permission denied: User doesn't have editor rights to delete nodes");
        alert("Vous n'avez pas la permission de supprimer des nœuds dans ce flow");
        return;
      }
      
      if (!window.confirm('Do you want to delete this node?')) return;
      
      // Always use functional updates to work with the latest state
      setEdges(prevEdges => {
        const newEdges = prevEdges.filter(e => e.source !== nodeId && e.target !== nodeId);
        onEdgesChange?.(newEdges);
        return newEdges;
      });
      
      setNodes(prevNodes => {
        const newNodes = prevNodes.filter(n => n.id !== nodeId);
        onNodesChange?.(newNodes);
        return newNodes;
      });
      
      setSelectedNodeId(null);
    },
    [canEdit, setEdges, setNodes, onEdgesChange, onNodesChange]
  );
  
  // Note: We no longer inject the delete handler into nodes here.
  // Instead, it's added at render time in the DiagramEditor component.

  return {
    selectedNodeId,
    setSelectedNodeId,
    handleNodeClick,
    handleNodeDelete
  };
}
