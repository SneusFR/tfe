import { useState, useCallback } from 'react';

/**
 * Custom hook to handle ReactFlow initialization
 * Manages the reactFlowInstance and initial view fitting
 */
export function useReactFlowInit(nodes) {
  // State for ReactFlow instance
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  
  // Handle ReactFlow initialization
  const onInit = useCallback(
    (instance) => {
      setReactFlowInstance(instance);
      if (nodes.length > 0) {
        setTimeout(() => {
          instance.fitView({ padding: 0.2, includeHiddenNodes: true });
        }, 500);
      }
    },
    [nodes]
  );
  
  return {
    reactFlowInstance,
    setReactFlowInstance,
    onInit
  };
}
