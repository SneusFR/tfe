import { createContext } from 'react';

// Create a context for the flow (execution functionality has been removed)
export const FlowContext = createContext(null);

// Create a provider component (execution functionality has been removed)
export const FlowProvider = ({ children }) => {
  // Placeholder empty object for executeFlowRef to avoid breaking code that references it
  const dummyExecuteFlowRef = { 
    current: () => {
      console.log('Flow execution functionality has been removed');
      return { success: false, error: 'Flow execution functionality has been removed' };
    }
  };

  return (
    <FlowContext.Provider value={{ executeFlowRef: dummyExecuteFlowRef }}>
      {children}
    </FlowContext.Provider>
  );
};
