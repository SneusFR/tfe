/**
 * Utility functions for API nodes
 */

/**
 * Updates the bindings for an API node when a connection is created or removed
 * @param {Object} nodes - All nodes in the flow
 * @param {Object} edges - All edges in the flow
 * @param {string} apiNodeId - ID of the API node to update
 * @returns {Object} - Updated nodes
 */
export const updateApiNodeBindings = (nodes, edges, apiNodeId) => {
  // Find the API node
  const apiNodeIndex = nodes.findIndex(node => node.id === apiNodeId);
  if (apiNodeIndex === -1) return nodes;

  const apiNode = nodes[apiNodeIndex];
  if (apiNode.type !== 'apiNode') return nodes;

  // Get all edges connected to this API node's body field handles
  const bodyFieldEdges = edges.filter(edge => 
    edge.target === apiNodeId && 
    edge.targetHandle?.startsWith('body-')
  );

  // Create a new bindings object
  const bindings = {};

  // For each edge, extract the field name from the target handle and store the source info
  bodyFieldEdges.forEach(edge => {
    const fieldName = edge.targetHandle.replace('body-', '');
    const sourceNode = nodes.find(node => node.id === edge.source);
    
    if (sourceNode) {
      bindings[fieldName] = {
        nodeId: edge.source,
        handleId: edge.sourceHandle,
        nodeType: sourceNode.type
      };
    }
  });

  // Create updated nodes array with the new bindings
  return nodes.map((node, index) => {
    if (index === apiNodeIndex) {
      return {
        ...node,
        data: {
          ...node.data,
          bindings
        }
      };
    }
    return node;
  });
};

/**
 * Prepares the request body for an API node by combining bindings and default values
 * @param {Object} apiNode - The API node
 * @param {Object} executionContext - The current execution context with values from other nodes
 * @returns {Object} - The prepared request body
 */
export const prepareApiNodeRequestBody = (apiNode, executionContext) => {
  const { defaultBody = {}, bindings = {}, bodySchema } = apiNode.data;
  
  // If there's no schema, return empty object
  if (!bodySchema || !bodySchema.properties) {
    return {};
  }
  
  // Start with the default body
  const requestBody = { ...defaultBody };
  
  // For each binding, get the value from the execution context
  Object.entries(bindings).forEach(([fieldName, binding]) => {
    const { nodeId, handleId } = binding;
    const sourceValue = executionContext.get(`output-${nodeId}-${handleId}`);
    
    if (sourceValue !== undefined) {
      requestBody[fieldName] = sourceValue;
    }
  });
  
  return requestBody;
};
