import { useCallback, useRef, useState, useMemo } from 'react';
import { throttle, debounce } from 'lodash';
import { useNodesState, useEdgesState, applyNodeChanges } from 'reactflow';
import { EXECUTION_LINK_STYLE } from './diagramConfig';

/**
 * Custom hook to handle performance optimizations for the diagram editor
 */
export function useDiagramPerformance(
  initialNodes, 
  initialEdges, 
  selectedNodeId, 
  onNodesChange,
  onEdgesChange
) {
  // Initialize nodes and edges states
  const [nodes, setNodes] = useNodesState(initialNodes || []);
  const [edges, setEdges] = useEdgesState(initialEdges || []);
  
  // Reference to track current nodes state
  const nodesRef = useRef([]);
  
  // State for animating new connections
  const [animatingEdgeId, setAnimatingEdgeId] = useState(null);

  // Optimized version of node changes to improve performance during dragging
  const throttledApply = useRef(
    throttle((changes) => {
      // Skip processing if there are too many changes at once (performance optimization)
      if (changes.length > 100) {
        console.log('Skipping large batch of changes for performance');
        return;
      }
      
      // Batch position changes together
      const positionChanges = changes.filter(c => c.type === 'position');
      const otherChanges = changes.filter(c => c.type !== 'position');
      
      // Process position changes more aggressively
      if (positionChanges.length > 0) {
        // Check if we're still dragging
        const isDragging = positionChanges.some(c => c.dragging === true);
        
        // Use requestAnimationFrame for smoother updates during dragging
        if (isDragging) {
          requestAnimationFrame(() => {
            setNodes(prev => {
              // Apply position changes
              const next = applyNodeChanges(positionChanges, prev);
              nodesRef.current = next;
              return next;
            });
          });
        } else {
          // When dragging ends, update normally
          setNodes(prev => {
            const next = applyNodeChanges(positionChanges, prev);
            nodesRef.current = next;
            return next;
          });
          
          // Only notify parent when dragging ends
          onNodesChange?.(nodesRef.current);
        }
      }
      
      // Process other changes normally
      if (otherChanges.length > 0) {
        setNodes(prev => {
          const next = applyNodeChanges(otherChanges, prev);
          nodesRef.current = next;
          return next;
        });
        onNodesChange?.(nodesRef.current);
      }
    }, 10) // More aggressive throttling for better performance
  ).current;

  // Optimization: Debounce selection changes to improve performance
  const throttledSelectionChange = useRef(
    debounce((params) => {
      if (params.selectionMode) {
        // Only update if the selection has actually changed
        const newSelection = params.nodes || [];
        
        // Use a more efficient way to compare selections
        // by creating a Set of IDs for faster lookup
        const prevSelectedIds = new Set(params.selectedNodesForSelection.map(node => node.id));
        const newSelectedIds = new Set(newSelection.map(node => node.id));
        
        // Quick length check first
        if (prevSelectedIds.size !== newSelectedIds.size) {
          params.setSelectedNodesForSelection(newSelection);
          return;
        }
        
        // Check if all IDs in the new selection exist in the previous selection
        let selectionChanged = false;
        for (const id of newSelectedIds) {
          if (!prevSelectedIds.has(id)) {
            selectionChanged = true;
            break;
          }
        }
        
        if (selectionChanged) {
          params.setSelectedNodesForSelection(newSelection);
        }
      }
    }, 100) // Reduced debounce time for more responsive selection
  ).current;

  // Cache for previous node data to avoid unnecessary updates
  const prevNodesDataRef = useRef(new Map());
  
  // Function to create memoized nodes (moved to component)
  const createMemoNodes = useCallback((nodes, selectedNodeId, handleNodeDelete) => {
    // Skip processing if there are no nodes
    if (nodes.length === 0) return [];
    
    // Use a Map for faster lookups during processing
    const nodeMap = new Map();
    const result = new Array(nodes.length);
    
    // First pass: collect all node IDs that need updates
    const nodesToUpdate = new Set();
    
    // Process nodes in a single pass for better performance
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      nodeMap.set(n.id, i); // Store index for faster lookup
      
      const isSelected = n.id === selectedNodeId;
      
      // Check if we need to update this node's data
      const prevNodeData = prevNodesDataRef.current.get(n.id);
      const prevSelected = prevNodeData?.isSelected;
      const prevPosition = prevNodeData?.position;
      
      // Determine if position changed - only check if we have previous data
      const positionChanged = !prevPosition || 
                             prevPosition.x !== n.position.x || 
                             prevPosition.y !== n.position.y;
      
      // Mark for update if needed
      if (!prevNodeData || prevSelected !== isSelected || positionChanged) {
        nodesToUpdate.add(n.id);
        
        // Update stored state for future comparison
        prevNodesDataRef.current.set(n.id, {
          isSelected,
          position: { x: n.position.x, y: n.position.y }
        });
      }
      
      // Prepare the basic node structure
      const className = isSelected ? 'selected-node' : '';
      
      // Create the node with minimal changes
      result[i] = {
        ...n,
        className,
        data: {
          ...n.data,
          isSelected,
          deleteButton: isSelected ? { id: n.id, onDelete: handleNodeDelete } : null
        }
      };
    }
    
    // Clean up any nodes that no longer exist (only every 20 renders to save performance)
    if (Math.random() < 0.05) { // 5% chance to run cleanup on each render
      for (const nodeId of prevNodesDataRef.current.keys()) {
        if (!nodeMap.has(nodeId)) {
          prevNodesDataRef.current.delete(nodeId);
        }
      }
    }
    
    return result;
  }, []);

  // Cache for previous edge data to avoid unnecessary updates
  const prevEdgesDataRef = useRef(new Map());
  
  // Optimized memoization of edges for better performance with large edge counts
  const computedEdges = useMemo(() => {
    // Skip processing if there are no edges
    if (edges.length === 0) return [];
    
    // Pre-allocate array for better performance
    const result = new Array(edges.length);
    
    // Process all edges in a single pass for better performance
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      
      if (e.data?.isExecutionLink) {
        // All execution links use the same style now
        result[i] = {
          ...e,
          style: EXECUTION_LINK_STYLE,
          animated: false,
          className: e.id === animatingEdgeId ? 'new-connection' : ''
        };
      } else {
        // Non-execution links don't need special processing
        result[i] = e;
      }
    }
    
    return result;
  }, [edges, animatingEdgeId]); // Include animatingEdgeId in dependencies

  // Function to set animating edge ID
  const setAnimatingEdge = useCallback((edgeId) => {
    setAnimatingEdgeId(edgeId);
    
    // Clear the animation after a delay
    if (edgeId) {
      setTimeout(() => {
        // Remove the new-connection class after animation completes
        setEdges(eds => 
          eds.map(e => 
            e.id === edgeId ? { ...e, className: '' } : e
          )
        );
        
        setAnimatingEdgeId(null);
      }, 1000);
    }
  }, [setEdges]);

  return {
    nodes,
    setNodes,
    edges,
    setEdges,
    nodesRef,
    throttledApply,
    throttledSelectionChange,
    createMemoNodes,
    computedEdges,
    setAnimatingEdge,
    animatingEdgeId,
    prevNodesDataRef
  };
}
