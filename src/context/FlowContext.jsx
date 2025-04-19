import { createContext, useRef, useEffect, useState } from 'react';
import { runFlow } from '../services/flowClient';

// Create a context for the flow
export const FlowContext = createContext(null);

// Create a provider component
export const FlowProvider = ({ children, nodes, edges }) => {
  // State to store the selected backend config ID
  const [backendConfigId, setBackendConfigId] = useState(null);
  
  // Create a ref to hold the executeFlow function
  const executeFlowRef = useRef(async (task) => {
    return await runFlow(nodes, edges, task, backendConfigId);
  });
  
  // Update the executeFlowRef when nodes, edges, or backendConfigId change
  useEffect(() => {
    executeFlowRef.current = async (task) => {
      return await runFlow(nodes, edges, task, backendConfigId);
    };
  }, [nodes, edges, backendConfigId]);

  return (
    <FlowContext.Provider value={{ executeFlowRef, backendConfigId, setBackendConfigId }}>
      {children}
    </FlowContext.Provider>
  );
};
