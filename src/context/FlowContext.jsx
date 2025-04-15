import { createContext, useRef, useEffect } from 'react';
import FlowExecutionEngine from '../services/FlowExecutionEngine';

// Create a context for the flow
export const FlowContext = createContext(null);

// Create a provider component
export const FlowProvider = ({ children, nodes, edges }) => {
  // Create a ref to hold the executeFlow function
  const executeFlowRef = useRef(async (task) => {
    return await FlowExecutionEngine.executeFlow(task);
  });
  
  // Update the diagram in the execution engine when nodes or edges change
  useEffect(() => {
    if (nodes && edges) {
      FlowExecutionEngine.setDiagram(nodes, edges);
    }
  }, [nodes, edges]);

  return (
    <FlowContext.Provider value={{ executeFlowRef }}>
      {children}
    </FlowContext.Provider>
  );
};
