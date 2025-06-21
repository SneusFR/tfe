import { useCallback } from 'react';
import { createNode } from '../nodeFactory';
import conditionStore from '../../../store/conditionStore';

/**
 * Custom hook to handle node drop functionality
 * Manages the creation of nodes when dropped onto the diagram
 */
export function useNodeDrop({
  reactFlowInstance,
  nodes,
  setNodes,
  onNodesChange,
  canEdit,
  nodeCallbacksRef,
  nodesRef
}) {
  // Handle the drop event to add nodes to the diagram
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      if (!reactFlowInstance) return;
      if (!canEdit) {
        console.log("Permission denied: User doesn't have editor rights to add nodes");
        alert("Vous n'avez pas la permission d'ajouter des nœuds dans ce flow");
        return;
      }
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Ajout d'un nœud condition
      const conditionId = event.dataTransfer.getData('application/conditionId');
      if (conditionId) {
        const condition = conditionStore.getConditionById(conditionId);
        if (!condition) return;
        
        const newNode = createNode('conditionNode', position, {
          conditionText: condition.conditionText,
          returnText: condition.returnText
        });
        
        let updatedNodes = nodes.concat(newNode);
        setNodes(updatedNodes);
        if (onNodesChange) onNodesChange(updatedNodes);
        
        // Log successful condition node creation
        console.log('✅ [DIAGRAM EDITOR] Condition node created:', condition.conditionText);
        return;
      }

      // Ajout d'un nœud sendingMail ou text
      const nodeType = event.dataTransfer.getData('application/nodeType');
      if (!nodeType) return;
      
      try {
        // Create the node using the factory
        const newNode = createNode(nodeType, position);
        
        // Add callbacks for interactive nodes
        if (nodeType === 'textNode') {
          const nodeId = newNode.id;
          
          // Store the callback in the ref
          nodeCallbacksRef.current[nodeId] = {
            onTextChange: (newText) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, text: newText } }
                    : node
                );
                nodesRef.current = updated;
                onNodesChange?.(updated);
                return updated;
              });
            }
          };
          
          // Set the callback reference
          newNode.data.onTextChange = (newText) => nodeCallbacksRef.current[nodeId].onTextChange(newText);
        } 
        else if (nodeType === 'intNode') {
          const nodeId = newNode.id;
          
          nodeCallbacksRef.current[nodeId] = {
            onValueChange: (newValue) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, value: newValue } }
                    : node
                );
                nodesRef.current = updated;
                onNodesChange?.(updated);
                return updated;
              });
            }
          };
          
          newNode.data.onValueChange = (newValue) => nodeCallbacksRef.current[nodeId].onValueChange(newValue);
        }
        else if (nodeType === 'aiNode') {
          const nodeId = newNode.id;
          
          nodeCallbacksRef.current[nodeId] = {
            onPromptChange: (newPrompt) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, prompt: newPrompt } }
                    : node
                );
                nodesRef.current = updated;
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
                nodesRef.current = updated;
                onNodesChange?.(updated);
                return updated;
              });
            }
          };
          
          newNode.data.onPromptChange = (newPrompt) => nodeCallbacksRef.current[nodeId].onPromptChange(newPrompt);
          newNode.data.onInputChange = (newInput) => nodeCallbacksRef.current[nodeId].onInputChange(newInput);
        }
        else if (nodeType === 'conditionalFlowNode') {
          const nodeId = newNode.id;
          
          nodeCallbacksRef.current[nodeId] = {
            onConditionTypeChange: (newType) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, conditionType: newType } }
                    : node
                );
                nodesRef.current = updated;
                onNodesChange?.(updated);
                return updated;
              });
            },
            onValueChange: (newValue) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, value: newValue } }
                    : node
                );
                nodesRef.current = updated;
                onNodesChange?.(updated);
                return updated;
              });
            },
            onInputValueChange: (newInputValue) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, inputValue: newInputValue } }
                    : node
                );
                nodesRef.current = updated;
                onNodesChange?.(updated);
                return updated;
              });
            }
          };
          
          newNode.data.onConditionTypeChange = (newType) => nodeCallbacksRef.current[nodeId].onConditionTypeChange(newType);
          newNode.data.onValueChange = (newValue) => nodeCallbacksRef.current[nodeId].onValueChange(newValue);
          newNode.data.onInputValueChange = (newInputValue) => nodeCallbacksRef.current[nodeId].onInputValueChange(newInputValue);
        }
        else if (nodeType === 'switchNode') {
          const nodeId = newNode.id;
          
          nodeCallbacksRef.current[nodeId] = {
            onCasesChange: (newCases) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, cases: newCases } }
                    : node
                );
                nodesRef.current = updated;
                onNodesChange?.(updated);
                return updated;
              });
            }
          };
          
          newNode.data.onCasesChange = (newCases) => nodeCallbacksRef.current[nodeId].onCasesChange(newCases);
        }
        else if (nodeType === 'logicalOperatorNode') {
          const nodeId = newNode.id;
          
          nodeCallbacksRef.current[nodeId] = {
            onOperatorTypeChange: (newType) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, operatorType: newType } }
                    : node
                );
                nodesRef.current = updated;
                onNodesChange?.(updated);
                return updated;
              });
            },
            onInputCountChange: (newCount) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, inputCount: newCount } }
                    : node
                );
                nodesRef.current = updated;
                onNodesChange?.(updated);
                return updated;
              });
            }
          };
          
          newNode.data.onOperatorTypeChange = (newType) => nodeCallbacksRef.current[nodeId].onOperatorTypeChange(newType);
          newNode.data.onInputCountChange = (newCount) => nodeCallbacksRef.current[nodeId].onInputCountChange(newCount);
        }
        else if (nodeType === 'booleanNode') {
          const nodeId = newNode.id;
          
          nodeCallbacksRef.current[nodeId] = {
            onValueChange: (newValue) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, value: newValue } }
                    : node
                );
                nodesRef.current = updated;
                onNodesChange?.(updated);
                return updated;
              });
            }
          };
          
          newNode.data.onValueChange = (newValue) => nodeCallbacksRef.current[nodeId].onValueChange(newValue);
        }
        else if (nodeType === 'tokenNode') {
          const nodeId = newNode.id;
          
          nodeCallbacksRef.current[nodeId] = {
            onTokenChange: (newToken) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, token: newToken } }
                    : node
                );
                nodesRef.current = updated;
                onNodesChange?.(updated);
                return updated;
              });
            }
          };
          
          newNode.data.onTokenChange = (newToken) => nodeCallbacksRef.current[nodeId].onTokenChange(newToken);
        }
        else if (nodeType === 'mailBodyNode') {
          const nodeId = newNode.id;
          
          nodeCallbacksRef.current[nodeId] = {
            onContentChange: (newContent) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, content: newContent } }
                    : node
                );
                nodesRef.current = updated;
                onNodesChange?.(updated);
                return updated;
              });
            }
          };
          
          newNode.data.onContentChange = (newContent) => nodeCallbacksRef.current[nodeId].onContentChange(newContent);
        }
        
        // Add the node to the diagram
        const updatedNodes = nodes.concat(newNode);
        setNodes(updatedNodes);
        if (onNodesChange) onNodesChange(updatedNodes);
      } catch (error) {
        console.error('Error creating node:', error);
      }
    },
    [reactFlowInstance, nodes, setNodes, onNodesChange, canEdit, nodeCallbacksRef, nodesRef]
  );

  // Handle the dragover event
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    if (!canEdit) {
      console.log("Permission denied: User doesn't have editor rights to drag elements");
      event.dataTransfer.dropEffect = 'none';
    } else {
      event.dataTransfer.dropEffect = 'move';
    }
  }, [canEdit]);

  return {
    onDrop,
    onDragOver
  };
}
