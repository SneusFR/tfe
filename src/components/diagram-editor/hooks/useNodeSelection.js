import { useState, useCallback, useEffect } from 'react';

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
      
      if (window.confirm('Do you want to delete this node?')) {
        // Remove all edges connected to this node
        const updatedEdges = edges.filter(
          (e) => e.source !== nodeId && e.target !== nodeId
        );
        setEdges(updatedEdges);
        if (onEdgesChange) onEdgesChange(updatedEdges);
        
        // Remove the node
        const updatedNodes = nodes.filter((n) => n.id !== nodeId);
        setNodes(updatedNodes);
        if (onNodesChange) onNodesChange(updatedNodes);
        
        // Clear selection
        setSelectedNodeId(null);
      }
    },
    [edges, nodes, setEdges, setNodes, onEdgesChange, onNodesChange, canEdit]
  );
  
  // Add onDelete function to all nodes
  useEffect(() => {
    if (nodes.length === 0) return;
    
    let changed = false;
    const updatedNodes = nodes.map(node => {
      // Ensure data object exists
      const data = node.data || {};
      
      // Add onDelete only if it doesn't already exist
      if (!data.onDelete) {
        changed = true;
        return {
          ...node,
          data: { ...data, onDelete: handleNodeDelete }
        };
      }
      return node;
    });
    
    // Only update if at least one node was changed
    if (changed) {
      setNodes(updatedNodes);
    }
  }, [nodes, handleNodeDelete, setNodes]); // Include all dependencies

  return {
    selectedNodeId,
    setSelectedNodeId,
    handleNodeClick,
    handleNodeDelete
  };
}
