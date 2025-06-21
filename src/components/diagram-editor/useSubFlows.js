import { useCallback, useRef, useState } from 'react';
import {
  detectSubFlows, createSubFlowNode, calculateSubFlowPosition,
  createSubFlowEdges, removeSubFlowElements
} from '../../utils/subFlowUtils';

/**
 * Encapsule la logique des sous-flux.
 */
export function useSubFlows(nodes, edges, setNodes, setEdges, onNodesChange, onEdgesChange, canEdit) {
  const [collapsedSubFlows, setCollapsedSubFlows] = useState(new Map());
  const [originalNodesAndEdges, setOriginalNodesAndEdges] = useState(new Map());
  const expandSubFlowRef = useRef();
  const nodeCallbacksRef = useRef({});

  // Function to create sub-flows automatically
  const createSubFlows = useCallback(() => {
    if (!canEdit) {
      alert("Vous n'avez pas la permission de modifier ce flow");
      return;
    }

    const detectedSubFlows = detectSubFlows(nodes, edges);
    
    if (detectedSubFlows.length === 0) {
      alert("Aucun sous-flux détecté. Assurez-vous d'avoir des nœuds de condition (points de départ) et des nœuds de fin connectés.");
      return;
    }

    let updatedNodes = [...nodes];
    let updatedEdges = [...edges];
    const newCollapsedSubFlows = new Map(collapsedSubFlows);
    const newOriginalNodesAndEdges = new Map(originalNodesAndEdges);

    detectedSubFlows.forEach(subFlow => {
      // Store original nodes and edges for this sub-flow
      const originalNodes = subFlow.path.map(nodeId => 
        nodes.find(n => n.id === nodeId)
      ).filter(Boolean);
      
      const originalEdges = edges.filter(edge => 
        subFlow.path.includes(edge.source) && subFlow.path.includes(edge.target)
      );

      newOriginalNodesAndEdges.set(subFlow.id, {
        nodes: originalNodes,
        edges: originalEdges
      });
      console.log('[DEBUG] subFlow created', subFlow.id, 'stored originals:', {nodes: originalNodes.length, edges: originalEdges.length});

      // Calculate position for the sub-flow node
      const position = calculateSubFlowPosition(originalNodes);

      // Create sub-flow node with callbacks
      const subFlowNode = createSubFlowNode(subFlow, position);
      subFlowNode.data.onExpand = (nodeId) => expandSubFlowRef.current(nodeId);      
      subFlowNode.data.onCollapse = (nodeId) => collapseSubFlowHandler(nodeId);

      subFlowNode.data.originals = {
        nodes: originalNodes,
        edges: originalEdges
      };

      // Remove original nodes and edges
      const { nodes: filteredNodes, edges: filteredEdges } = removeSubFlowElements(
        updatedNodes, 
        updatedEdges, 
        subFlow
      );

      // Create new edges for the sub-flow node
      const subFlowEdges = createSubFlowEdges(subFlow, edges);

      // Update arrays
      updatedNodes = [...filteredNodes, subFlowNode];
      updatedEdges = [...filteredEdges, ...subFlowEdges];

      // Mark as collapsed
      newCollapsedSubFlows.set(subFlow.id, true);
    });

    // Update state
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    setCollapsedSubFlows(newCollapsedSubFlows);
    setOriginalNodesAndEdges(newOriginalNodesAndEdges);
    
    if (onNodesChange) onNodesChange(updatedNodes);
    if (onEdgesChange) onEdgesChange(updatedEdges);

    alert(`${detectedSubFlows.length} sous-flux(s) créé(s) avec succès !`);
  }, [nodes, edges, canEdit, collapsedSubFlows, originalNodesAndEdges, onNodesChange, onEdgesChange]);

  // Function to expand a sub-flow
  const expandSubFlowHandler = useCallback((subFlowNodeId) => {
    if (!canEdit) {
      alert("Vous n'avez pas la permission de modifier ce flow");
      return;
    }

    console.log('Expanding sub-flow:', subFlowNodeId);
    console.log('Available original data keys:', Array.from(originalNodesAndEdges.keys()));
    console.log('Original nodes and edges map size:', originalNodesAndEdges.size);
    
    const originalData = originalNodesAndEdges.get(subFlowNodeId);
    if (!originalData) {
      console.error('No original data found for subflow:', subFlowNodeId);
      console.error('Available subflow IDs:', Array.from(originalNodesAndEdges.keys()));
      alert(`Erreur: Impossible de trouver les données originales pour le sous-flux ${subFlowNodeId}. Les données ont peut-être été perdues lors du changement de flow.`);
      return;
    }
    
    console.log('Found original data:', originalData);

    // Find edges that were connected to the subflow node from external nodes
    const externalIncomingEdges = edges.filter(e => 
      e.target === subFlowNodeId && e.source !== subFlowNodeId
    );
    const externalOutgoingEdges = edges.filter(e => 
      e.source === subFlowNodeId && e.target !== subFlowNodeId
    );

    // Remove the sub-flow node
    const updatedNodes = nodes.filter(n => n.id !== subFlowNodeId);
    
    // Remove edges connected to the sub-flow node
    const updatedEdges = edges.filter(e => 
      e.source !== subFlowNodeId && e.target !== subFlowNodeId
    );

    // Restore original nodes with proper callbacks
    const restoredNodes = originalData.nodes.map(node => {
      // Reattach callbacks based on node type
      if (node.type === 'textNode') {
        const nodeId = node.id;
        nodeCallbacksRef.current[nodeId] = {
          onTextChange: (newText) => {
            setNodes(prevNodes => {
              const updated = prevNodes.map(n =>
                n.id === nodeId
                  ? { ...n, data: { ...n.data, text: newText } }
                  : n
              );
              onNodesChange?.(updated);
              return updated;
            });
          }
        };
        return {
          ...node,
          data: {
            ...node.data,
            onTextChange: (newText) => nodeCallbacksRef.current[nodeId].onTextChange(newText)
          }
        };
      } else if (node.type === 'conditionalFlowNode') {
        const nodeId = node.id;
        nodeCallbacksRef.current[nodeId] = {
          onConditionTypeChange: newType => {
            setNodes(prev => {
              const updated = prev.map(nd =>
                nd.id === nodeId
                  ? { ...nd, data: { ...nd.data, conditionType: newType } }
                  : nd
              );
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
              onNodesChange?.(updated);
              return updated;
            });
          }
        };
        return {
          ...node,
          data: {
            ...node.data,
            onConditionTypeChange: newType => nodeCallbacksRef.current[nodeId].onConditionTypeChange(newType),
            onValueChange: newVal => nodeCallbacksRef.current[nodeId].onValueChange(newVal),
            onInputValueChange: newInputValue => nodeCallbacksRef.current[nodeId].onInputValueChange(newInputValue)
          }
        };
      }
      // Return node as-is for other types
      return node;
    });

    // Reconnect external edges to the appropriate nodes in the expanded subflow
    const reconnectedEdges = [];
    
    // Handle incoming edges (connect to start node of subflow)
    externalIncomingEdges.forEach(edge => {
      if (originalData.nodes.length > 0) {
        const startNode = originalData.nodes[0]; // Assuming first node is start
        reconnectedEdges.push({
          ...edge,
          target: startNode.id,
          targetHandle: 'execution',
          id: `${edge.id}-reconnected`
        });
      }
    });

    // Handle outgoing edges (connect from end node of subflow)
    externalOutgoingEdges.forEach(edge => {
      if (originalData.nodes.length > 0) {
        const endNode = originalData.nodes[originalData.nodes.length - 1]; // Assuming last node is end
        reconnectedEdges.push({
          ...edge,
          source: endNode.id,
          sourceHandle: 'execution',
          id: `${edge.id}-reconnected`
        });
      }
    });

    // Combine all nodes and edges
    const finalNodes = [...updatedNodes, ...restoredNodes];
    const finalEdges = [...updatedEdges, ...originalData.edges, ...reconnectedEdges];

    console.log('Final nodes after expansion:', finalNodes.length);
    console.log('Final edges after expansion:', finalEdges.length);

    // Update state
    setNodes(finalNodes);
    setEdges(finalEdges);
    
    // Remove from collapsed state
    const newCollapsedSubFlows = new Map(collapsedSubFlows);
    newCollapsedSubFlows.delete(subFlowNodeId);
    setCollapsedSubFlows(newCollapsedSubFlows);

    if (onNodesChange) onNodesChange(finalNodes);
    if (onEdgesChange) onEdgesChange(finalEdges);
  }, [nodes, edges, originalNodesAndEdges, collapsedSubFlows, canEdit, onNodesChange, onEdgesChange]);

  // Function to collapse a sub-flow (placeholder for future implementation)
  const collapseSubFlowHandler = useCallback((subFlowNodeId) => {
    // This would be used when expanding and then wanting to collapse again
    console.log('Collapse sub-flow:', subFlowNodeId);
  }, []);

  // Set the current expandSubFlowHandler to the ref
  expandSubFlowRef.current = expandSubFlowHandler;

  return { 
    createSubFlows, 
    expandSubFlowRef,
    collapsedSubFlows,
    setCollapsedSubFlows,
    originalNodesAndEdges,
    setOriginalNodesAndEdges
  };
}
