/**
 * Utility functions for detecting and managing sub-flows
 */

/**
 * Find all sub-flows from start nodes to end nodes, including conditional branches
 * @param {Array} nodes - All nodes in the flow
 * @param {Array} edges - All edges in the flow
 * @returns {Array} Array of sub-flow objects
 */
export const detectSubFlows = (nodes, edges) => {
  // Find all starting points (condition nodes with isStartingPoint = true)
  const startNodes = nodes.filter(node => 
    node.type === 'conditionNode' && node.data.isStartingPoint
  );
  
  // Find all end nodes
  const endNodes = nodes.filter(node => node.type === 'endNode');
  
  if (startNodes.length === 0 || endNodes.length === 0) {
    return [];
  }
  
  // Build adjacency lists for all connections (execution + data)
  const executionAdjacency = buildExecutionAdjacency(edges);
  const reverseExecutionAdjacency = buildReverseExecutionAdjacency(edges);
  const allConnectionsAdjacency = buildAllConnectionsAdjacency(edges);
  const reverseAllConnectionsAdjacency = buildReverseAllConnectionsAdjacency(edges);
  
  const subFlows = [];
  
  // For each start node, find all reachable nodes and end nodes
  startNodes.forEach(startNode => {
    endNodes.forEach(endNode => {
      const subFlowData = findSubFlowBetweenNodes(
        startNode.id, 
        endNode.id, 
        executionAdjacency, 
        reverseExecutionAdjacency,
        allConnectionsAdjacency,
        reverseAllConnectionsAdjacency,
        nodes
      );
      
      if (subFlowData && subFlowData.allNodes.length > 2) {
        const intermediateNodes = subFlowData.allNodes
          .filter(nodeId => nodeId !== startNode.id && nodeId !== endNode.id)
          .map(nodeId => nodes.find(n => n.id === nodeId))
          .filter(Boolean);
        
        subFlows.push({
          id: `subflow-${startNode.id}-${endNode.id}`,
          startNodeId: startNode.id,
          endNodeId: endNode.id,
          startNodeData: startNode.data,
          endNodeData: endNode.data,
          intermediateNodes,
          path: subFlowData.allNodes,
          subFlowName: startNode.data.conditionText || 'Sub-Flow'
        });
      }
    });
  });
  
  return subFlows;
};

/**
 * Find all nodes that are part of a sub-flow between start and end nodes
 * @param {string} startId - Start node ID
 * @param {string} endId - End node ID
 * @param {Map} executionAdjacency - Forward execution adjacency map
 * @param {Map} reverseExecutionAdjacency - Reverse execution adjacency map
 * @param {Map} allConnectionsAdjacency - Forward all connections adjacency map
 * @param {Map} reverseAllConnectionsAdjacency - Reverse all connections adjacency map
 * @param {Array} nodes - All nodes
 * @returns {Object|null} Sub-flow data or null if no valid sub-flow
 */
const findSubFlowBetweenNodes = (startId, endId, executionAdjacency, reverseExecutionAdjacency, allConnectionsAdjacency, reverseAllConnectionsAdjacency, nodes) => {
  // Find all nodes reachable from start via execution links
  const reachableFromStartExecution = findReachableNodes(startId, executionAdjacency);
  
  // Find all nodes that can reach end via execution links
  const canReachEndExecution = findReachableNodes(endId, reverseExecutionAdjacency);
  
  // Core sub-flow nodes: reachable from start AND can reach end via execution links
  const coreSubFlowNodes = Array.from(reachableFromStartExecution).filter(nodeId => canReachEndExecution.has(nodeId));
  
  // Must include both start and end nodes in core
  if (!coreSubFlowNodes.includes(startId) || !coreSubFlowNodes.includes(endId)) {
    return null;
  }
  
  // Must have at least one intermediate node in core
  if (coreSubFlowNodes.length <= 2) {
    return null;
  }
  
  // Now find all nodes connected to the core sub-flow via any type of connection
  const allSubFlowNodes = new Set(coreSubFlowNodes);
  
  // Add nodes that are connected to core nodes via data links
  coreSubFlowNodes.forEach(coreNodeId => {
    // Find nodes that provide data to this core node
    const dataProviders = reverseAllConnectionsAdjacency.get(coreNodeId) || [];
    dataProviders.forEach(providerId => {
      // Only include if not already part of another execution flow
      if (!isPartOfOtherExecutionFlow(providerId, startId, endId, executionAdjacency, reverseExecutionAdjacency)) {
        allSubFlowNodes.add(providerId);
      }
    });
    
    // Find nodes that receive data from this core node
    const dataConsumers = allConnectionsAdjacency.get(coreNodeId) || [];
    dataConsumers.forEach(consumerId => {
      // Only include if not already part of another execution flow
      if (!isPartOfOtherExecutionFlow(consumerId, startId, endId, executionAdjacency, reverseExecutionAdjacency)) {
        allSubFlowNodes.add(consumerId);
      }
    });
  });
  
  return {
    allNodes: Array.from(allSubFlowNodes),
    startId,
    endId
  };
};

/**
 * Check if a node is part of another execution flow (not the current sub-flow)
 * @param {string} nodeId - Node ID to check
 * @param {string} currentStartId - Current sub-flow start ID
 * @param {string} currentEndId - Current sub-flow end ID
 * @param {Map} executionAdjacency - Execution adjacency map
 * @param {Map} reverseExecutionAdjacency - Reverse execution adjacency map
 * @returns {boolean} True if node is part of another execution flow
 */
const isPartOfOtherExecutionFlow = (nodeId, currentStartId, currentEndId, executionAdjacency, reverseExecutionAdjacency) => {
  // Check if this node can reach other end nodes via execution links
  const reachableFromNode = findReachableNodes(nodeId, executionAdjacency);
  const canReachNode = findReachableNodes(nodeId, reverseExecutionAdjacency);
  
  // If the node has its own execution flow that doesn't involve current start/end, exclude it
  for (const reachableId of reachableFromNode) {
    if (reachableId !== currentEndId && canReachNode.has(currentStartId)) {
      // This node is part of the current flow
      return false;
    }
  }
  
  return false; // For now, include all connected nodes
};

/**
 * Find all nodes reachable from a given start node using BFS
 * @param {string} startId - Start node ID
 * @param {Map} adjacency - Adjacency map
 * @returns {Set} Set of reachable node IDs
 */
const findReachableNodes = (startId, adjacency) => {
  const reachable = new Set([startId]);
  const queue = [startId];
  
  while (queue.length > 0) {
    const currentNode = queue.shift();
    const neighbors = adjacency.get(currentNode) || [];
    
    for (const neighbor of neighbors) {
      if (!reachable.has(neighbor)) {
        reachable.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  
  return reachable;
};

/**
 * Build adjacency list for execution links only
 * @param {Array} edges - All edges
 * @returns {Map} Adjacency map
 */
const buildExecutionAdjacency = (edges) => {
  const adj = new Map();
  
  edges.forEach(edge => {
    if (edge.data?.isExecutionLink || 
        (edge.sourceHandle === 'execution' && edge.targetHandle === 'execution') ||
        (!edge.sourceHandle || edge.sourceHandle === 'default-out') && 
        (!edge.targetHandle || edge.targetHandle === 'default-in')) {
      if (!adj.has(edge.source)) {
        adj.set(edge.source, []);
      }
      adj.get(edge.source).push(edge.target);
    }
  });
  
  return adj;
};

/**
 * Build reverse adjacency list for execution links only
 * @param {Array} edges - All edges
 * @returns {Map} Reverse adjacency map
 */
const buildReverseExecutionAdjacency = (edges) => {
  const adj = new Map();
  
  edges.forEach(edge => {
    if (edge.data?.isExecutionLink || 
        (edge.sourceHandle === 'execution' && edge.targetHandle === 'execution') ||
        (!edge.sourceHandle || edge.sourceHandle === 'default-out') && 
        (!edge.targetHandle || edge.targetHandle === 'default-in')) {
      if (!adj.has(edge.target)) {
        adj.set(edge.target, []);
      }
      adj.get(edge.target).push(edge.source);
    }
  });
  
  return adj;
};

/**
 * Build adjacency list for all types of connections
 * @param {Array} edges - All edges
 * @returns {Map} Adjacency map
 */
const buildAllConnectionsAdjacency = (edges) => {
  const adj = new Map();
  
  edges.forEach(edge => {
    if (!adj.has(edge.source)) {
      adj.set(edge.source, []);
    }
    adj.get(edge.source).push(edge.target);
  });
  
  return adj;
};

/**
 * Build reverse adjacency list for all types of connections
 * @param {Array} edges - All edges
 * @returns {Map} Reverse adjacency map
 */
const buildReverseAllConnectionsAdjacency = (edges) => {
  const adj = new Map();
  
  edges.forEach(edge => {
    if (!adj.has(edge.target)) {
      adj.set(edge.target, []);
    }
    adj.get(edge.target).push(edge.source);
  });
  
  return adj;
};

/**
 * Create a sub-flow node from detected sub-flow data
 * @param {Object} subFlow - Sub-flow data
 * @param {Object} position - Position for the new node
 * @returns {Object} Sub-flow node object
 */
export const createSubFlowNode = (subFlow, position) => {
  return {
    id: subFlow.id,
    type: 'subFlowNode',
    position,
    data: {
      subFlowName: subFlow.subFlowName,
      startNodeData: subFlow.startNodeData,
      endNodeData: subFlow.endNodeData,
      intermediateNodes: subFlow.intermediateNodes,
      originalPath: subFlow.path,
      isCollapsed: true,
      // Placeholder callbacks - will be set by DiagramEditor
      onExpand: null,
      onCollapse: null
    }
  };
};

/**
 * Calculate position for sub-flow node based on original nodes
 * @param {Array} originalNodes - Original nodes in the sub-flow
 * @returns {Object} Position object {x, y}
 */
export const calculateSubFlowPosition = (originalNodes) => {
  if (originalNodes.length === 0) {
    return { x: 0, y: 0 };
  }
  
  const positions = originalNodes.map(node => node.position);
  const avgX = positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length;
  const avgY = positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length;
  
  return { x: avgX, y: avgY };
};

/**
 * Create edges for sub-flow node (connecting to external nodes)
 * @param {Object} subFlow - Sub-flow data
 * @param {Array} allEdges - All edges in the flow
 * @returns {Array} New edges for the sub-flow node
 */
export const createSubFlowEdges = (subFlow, allEdges) => {
  // Return an empty array to remove the automatic creation of edges
  // This removes the edges that were previously connecting to the start and end nodes
  return [];
};

/**
 * Remove nodes and edges that are part of a sub-flow
 * @param {Array} nodes - All nodes
 * @param {Array} edges - All edges
 * @param {Object} subFlow - Sub-flow to remove
 * @returns {Object} {nodes, edges} without sub-flow elements
 */
export const removeSubFlowElements = (nodes, edges, subFlow) => {
  const subFlowNodeIds = new Set(subFlow.path);
  
  const filteredNodes = nodes.filter(node => !subFlowNodeIds.has(node.id));
  const filteredEdges = edges.filter(edge => 
    !subFlowNodeIds.has(edge.source) && !subFlowNodeIds.has(edge.target)
  );
  
  return { nodes: filteredNodes, edges: filteredEdges };
};

/**
 * Expand a sub-flow back to individual nodes
 * @param {Object} subFlowNode - The sub-flow node to expand
 * @param {Array} originalNodes - Original nodes that were collapsed
 * @param {Array} originalEdges - Original edges that were collapsed
 * @returns {Object} {nodes, edges} to add back
 */
export const expandSubFlow = (subFlowNode, originalNodes, originalEdges) => {
  // Return the original nodes and edges
  return {
    nodes: originalNodes,
    edges: originalEdges
  };
};
