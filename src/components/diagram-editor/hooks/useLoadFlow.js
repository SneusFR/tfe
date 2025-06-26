import { useEffect, useRef } from 'react';

/**
 * Custom hook to handle loading flow data when the current flow changes
 */
export function useLoadFlow(
  currentFlow,
  {
    nodes,
    edges,
    setNodes,
    setEdges,
    nodesRef,
    nodeCallbacksRef,
    onNodesChange,
    onEdgesChange,
    setCollapsedSubFlows,
    setOriginalNodesAndEdges,
    expandSubFlowRef
  }
) {
  // References to track previous flow ID and version index
  const prevFlowId = useRef();
  const prevVersionIndex = useRef();

  // Effect to load nodes and edges when the current flow changes
  useEffect(() => {
    // If there's no current flow, clear all nodes and edges
    if (!currentFlow) {
      setNodes([]);
      setEdges([]);
      if (onNodesChange) onNodesChange([]);
      if (onEdgesChange) onEdgesChange([]);
      prevFlowId.current = null;
      prevVersionIndex.current = null;
      // Clear subflow data when no flow is active
      setCollapsedSubFlows(new Map());
      setOriginalNodesAndEdges(new Map());
      return;
    }
    
    if (
      currentFlow.id === prevFlowId.current &&
      currentFlow.currentVersionIndex === prevVersionIndex.current
    ) {
      // Same flow AND same version - don't reload
      return;
    }
    
    prevFlowId.current = currentFlow.id;
    prevVersionIndex.current = currentFlow.currentVersionIndex;
    
    // Clear subflow data when changing flows to prevent data corruption
    setCollapsedSubFlows(new Map());
    setOriginalNodesAndEdges(new Map());

    // Get the version to use (either the current version or the flow itself for backward compatibility)
    const version = currentFlow.versions?.[currentFlow.currentVersionIndex] || currentFlow;
    
    // Load nodes
    if (version.nodes) {
      // Process loaded nodes to reattach callbacks
      let loaded = version.nodes || [];
      
      // Reattach callbacks to TextNodes
      loaded = loaded.map(n => {
        if (n.type === 'textNode') {
          // Store the callback in the ref
          const nodeId = n.id;
          nodeCallbacksRef.current[nodeId] = {
            onTextChange: (newText) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, text: newText } }
                    : node
                );
                // Update our ref
                nodesRef.current = updated;
                // Notify the parent INSIDE setNodes
                onNodesChange?.(updated);
                return updated;
              });
            }
          };
          
          // Inject the reference into data
          return {
            ...n,
            data: {
              ...n.data,
              onTextChange: (newText) => nodeCallbacksRef.current[nodeId].onTextChange(newText)
            }
          };
        } else if (n.type === 'intNode') {
          // Also reattach callbacks to IntNodes
          const nodeId = n.id;
          nodeCallbacksRef.current[nodeId] = {
            onValueChange: (newValue) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, value: newValue } }
                    : node
                );
                // Update our ref
                nodesRef.current = updated;
                // Notify the parent INSIDE setNodes
                onNodesChange?.(updated);
                return updated;
              });
            }
          };
          
          return {
            ...n,
            data: {
              ...n.data,
              onValueChange: (newValue) => nodeCallbacksRef.current[nodeId].onValueChange(newValue)
            }
          };
        } else if (n.type === 'aiNode') {
          // Also reattach callbacks to AINodes
          const nodeId = n.id;
          nodeCallbacksRef.current[nodeId] = {
            onPromptChange: (newPrompt) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, prompt: newPrompt } }
                    : node
                );
                // Update our ref
                nodesRef.current = updated;
                // Notify the parent INSIDE setNodes
                onNodesChange?.(updated);
                return updated;
              });
            },
            onInputChange: (newInput) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, input: newInput } }
                    : node
                );
                // Update our ref
                nodesRef.current = updated;
                // Notify the parent INSIDE setNodes
                onNodesChange?.(updated);
                return updated;
              });
            }
          };
          
          return {
            ...n,
            data: {
              ...n.data,
              onPromptChange: (newPrompt) => nodeCallbacksRef.current[nodeId].onPromptChange(newPrompt),
              onInputChange: (newInput) => nodeCallbacksRef.current[nodeId].onInputChange(newInput)
            }
          };
        } else if (n.type === 'conditionalFlowNode') {
          const nodeId = n.id;
          nodeCallbacksRef.current[nodeId] = {
          onConditionTypeChange: newType => {
            setNodes(prev => {
              const updated = prev.map(nd =>
                nd.id === nodeId
                  ? { ...nd, data: { ...nd.data, conditionType: newType } }
                  : nd
              );
              // Update our ref
              nodesRef.current = updated;
              // Notify the parent INSIDE setNodes
              onNodesChange?.(updated);
              return updated;
            });
          },
          onValueChange: newValue => {
            setNodes(prev => {
              const updated = prev.map(nd =>
                nd.id === nodeId
                  ? { ...nd, data: { ...nd.data, value: newValue } }
                  : nd
              );
              // Update our ref
              nodesRef.current = updated;
              // Notify the parent INSIDE setNodes
              onNodesChange?.(updated);
              return updated;
            });
          },
          onInputValueChange: newInputValue => {
            setNodes(prev => {
              const updated = prev.map(nd =>
                nd.id === nodeId
                  ? { ...nd, data: { ...nd.data, inputValue: newInputValue } }
                  : nd
              );
              // Update our ref
              nodesRef.current = updated;
              // Notify the parent INSIDE setNodes
              onNodesChange?.(updated);
              return updated;
            });
          }
          };
          return {
            ...n,
            data: {
              ...n.data,
              onConditionTypeChange: newType => nodeCallbacksRef.current[nodeId].onConditionTypeChange(newType),
              onValueChange: newVal => nodeCallbacksRef.current[nodeId].onValueChange(newVal),
              onInputValueChange: newInputValue => nodeCallbacksRef.current[nodeId].onInputValueChange(newInputValue)
            }
          };
        } else if (n.type === 'subFlowNode') {
          // ⚠️ Re-brancher les callbacks perdus lors de la sauvegarde
          return {
            ...n,
            data: {
              ...n.data,
              onExpand:   id => expandSubFlowRef.current(id),
              onCollapse: id => console.log('Collapse sub-flow:', id)
            }
          };
        }
        return n;
      });
      
      // Make sure to synchronize nodesRef
      nodesRef.current = loaded;

      // ---------- NOUVEAU : reconstruire la Map originals ----------
      const rebuilt = new Map();
      loaded.forEach(n => {
        if (n.type === 'subFlowNode' && n.data?.originals) {
          rebuilt.set(n.id, n.data.originals);
        }
      });
      setOriginalNodesAndEdges(rebuilt);
      // -------------------------------------------------------------
      
      setNodes(loaded);
      if (onNodesChange) onNodesChange(loaded);
    } else {
      setNodes([]);
      if (onNodesChange) onNodesChange([]);
    }
    
    // Load edges with default sourceHandle/targetHandle if needed
    if (version.edges) {
      const processedEdges = version.edges.map(edge => ({
        ...edge,
        sourceHandle: edge.sourceHandle || 'default-out',
        targetHandle: edge.targetHandle || 'default-in',
      }));
      
      // Clean up edges without handles to eliminate warnings
      const sanitisedEdges = processedEdges.filter(e => e.sourceHandle && e.targetHandle);
      setEdges(sanitisedEdges);
      if (onEdgesChange) onEdgesChange(sanitisedEdges);
    } else {
      setEdges([]);
      if (onEdgesChange) onEdgesChange([]);
    }
  }, [
    currentFlow, 
    setNodes, 
    setEdges, 
    onNodesChange, 
    onEdgesChange, 
    nodesRef, 
    nodeCallbacksRef, 
    setCollapsedSubFlows, 
    setOriginalNodesAndEdges,
    expandSubFlowRef
  ]);

  return {
    prevFlowId
  };
}
