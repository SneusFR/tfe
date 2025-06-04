/**
 * AI Diagram Interaction Service
 * 
 * This service provides functions for the AI to interact directly with the diagram editor,
 * allowing it to create and manipulate nodes and connections based on natural language instructions.
 */

/**
 * Create a node in the diagram
 * 
 * @param {Object} flowState - The current state of the flow (nodes and edges)
 * @param {string} nodeType - The type of node to create
 * @param {Object} position - The position {x, y} to place the node
 * @param {Object} data - The data for the node
 * @returns {Object} - The created node
 */
export function createNode(flowState, nodeType, position, data = {}) {
  const nodeId = `${nodeType}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  
  // Create the base node
  const node = {
    id: nodeId,
    type: nodeType,
    position,
    data: { ...data }
  };
  
  // Add specific properties based on node type
  switch (nodeType) {
    case 'conditionNode':
      node.data = {
        ...node.data,
        conditionText: data.conditionText || 'Mail condition',
        returnText: data.returnText || 'Condition Output',
        isStartingPoint: data.isStartingPoint !== undefined ? data.isStartingPoint : true,
        emailAttributes: data.emailAttributes || {
          email_id: 'email-123',
          fromEmail: data.fromEmail || 'sender@example.com',
          fromDisplayName: data.fromDisplayName || 'Sender Name',
          toEmail: data.toEmail || 'recipient@example.com',
          toDisplayName: data.toDisplayName || 'Recipient Name',
          subject: data.subject || 'Email Subject',
          date: new Date().toISOString(),
          content: data.content || 'Email content...',
          attachments: [],
          cc: [],
          bcc: []
        }
      };
      break;
      
    case 'sendingMailNode':
      node.data = {
        ...node.data,
        emailAttributes: {
          account_id: data.account_id || '',
          fromEmail: data.fromEmail || 'sender@example.com',
          fromDisplayName: data.fromDisplayName || 'Sender Name',
          toEmail: data.toEmail || 'recipient@example.com',
          toDisplayName: data.toDisplayName || 'Recipient Name',
          subject: data.subject || 'Email Subject',
          content: data.content || 'Email content...',
          reply_to: data.reply_to || '',
          cc: data.cc || [],
          bcc: data.bcc || [],
          custom_headers: data.custom_headers || []
        }
      };
      break;
      
    case 'textNode':
      node.data = {
        ...node.data,
        text: data.text || 'Enter text here...',
        // Note: Callback functions will be attached by the DiagramEditor component
      };
      break;
      
    case 'aiNode':
      node.data = {
        ...node.data,
        prompt: data.prompt || 'Enter your prompt here...',
        input: data.input || '',
        output: data.output || '',
        // Note: Callback functions will be attached by the DiagramEditor component
      };
      break;
      
    case 'mailBodyNode':
      node.data = {
        ...node.data,
        content: data.content || '',
        // Note: Callback functions will be attached by the DiagramEditor component
      };
      break;
      
    case 'switchNode':
      node.data = {
        ...node.data,
        cases: data.cases || [
          { id: '1', value: '', label: 'Case 1' },
          { id: '2', value: '', label: 'Case 2' }
        ],
        // Note: Callback functions will be attached by the DiagramEditor component
      };
      break;
      
    case 'logicalOperatorNode':
      node.data = {
        ...node.data,
        operatorType: data.operatorType || 'AND',
        inputCount: data.inputCount || 2,
        // Note: Callback functions will be attached by the DiagramEditor component
      };
      break;
      
    case 'endNode':
      // End node doesn't need additional data
      break;
      
    default:
      // For other node types, just use the provided data
      break;
  }
  
  return node;
}

/**
 * Create a connection between two nodes
 * 
 * @param {string} sourceId - The ID of the source node
 * @param {string} targetId - The ID of the target node
 * @param {string} sourceHandle - The handle ID on the source node
 * @param {string} targetHandle - The handle ID on the target node
 * @param {boolean} isExecutionLink - Whether this is an execution link or a data link
 * @returns {Object} - The created edge
 */
export function createConnection(sourceId, targetId, sourceHandle = 'execution', targetHandle = 'execution', isExecutionLink = true) {
  const edgeId = `edge-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  
  // Determine link style based on type
  const linkColor = isExecutionLink ? '#555' : '#3498db'; // Gray for execution, blue for data
  
  return {
    id: edgeId,
    source: sourceId,
    target: targetId,
    sourceHandle,
    targetHandle,
    type: isExecutionLink ? 'smoothstep' : 'default',
    data: {
      isExecutionLink,
    },
    style: {
      strokeWidth: isExecutionLink ? 2.5 : 2,
      stroke: linkColor,
      opacity: isExecutionLink ? 0.9 : 0.8,
    },
    markerEnd: {
      type: 'arrowclosed',
      width: isExecutionLink ? 15 : 12,
      height: isExecutionLink ? 15 : 12,
      color: linkColor,
    },
  };
}

/**
 * Calculate optimal positions for nodes in a flow
 * 
 * @param {Array} nodes - The nodes to position
 * @param {Array} edges - The edges connecting the nodes
 * @returns {Array} - The nodes with updated positions
 */
export function calculateNodePositions(nodes, edges) {
  // Find starting nodes (condition nodes with isStartingPoint = true)
  const startNodes = nodes.filter(node => 
    node.type === 'conditionNode' && node.data.isStartingPoint
  );
  
  if (startNodes.length === 0) {
    return nodes;
  }
  
  // Build adjacency list for execution links
  const adjacency = new Map();
  edges.forEach(edge => {
    if (edge.data?.isExecutionLink || 
        (edge.sourceHandle === 'execution' && edge.targetHandle === 'execution') ||
        (!edge.sourceHandle || edge.sourceHandle === 'default-out') && 
        (!edge.targetHandle || edge.targetHandle === 'default-in')) {
      if (!adjacency.has(edge.source)) {
        adjacency.set(edge.source, []);
      }
      adjacency.get(edge.source).push(edge.target);
    }
  });
  
  // Position nodes in a tree layout
  const nodePositions = new Map();
  const nodeWidth = 300;
  const nodeHeight = 200;
  const horizontalSpacing = 400;
  const verticalSpacing = 300;
  
  // Position start nodes at the top
  startNodes.forEach((node, index) => {
    nodePositions.set(node.id, {
      x: index * (nodeWidth + horizontalSpacing),
      y: 0
    });
  });
  
  // BFS to position the rest of the nodes
  const visited = new Set(startNodes.map(node => node.id));
  const queue = [...startNodes.map(node => ({ id: node.id, level: 0, column: 0 }))];
  
  while (queue.length > 0) {
    const { id, level, column } = queue.shift();
    const children = adjacency.get(id) || [];
    
    children.forEach((childId, index) => {
      if (!visited.has(childId)) {
        visited.add(childId);
        
        // Position child node
        nodePositions.set(childId, {
          x: column * (nodeWidth + horizontalSpacing) + index * 100,
          y: (level + 1) * (nodeHeight + verticalSpacing)
        });
        
        queue.push({ id: childId, level: level + 1, column: column + index });
      }
    });
  }
  
  // Update node positions
  return nodes.map(node => {
    const position = nodePositions.get(node.id);
    if (position) {
      return {
        ...node,
        position
      };
    }
    return node;
  });
}

/**
 * Build a complete flow based on a natural language description
 * 
 * @param {string} description - The natural language description of the flow
 * @param {Object} flowContext - The context of the current flow (available nodes, etc.)
 * @returns {Object} - The generated flow (nodes and edges)
 */
export function buildFlowFromDescription(description, flowContext) {
  // This is a placeholder for the actual implementation
  // In a real implementation, this would use the OpenAI API to generate a flow
  // based on the description and the available nodes in the flowContext
  
  // Generate a unique flow ID to ensure no overlap with previous flows
  const flowId = `flow-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  
  // For now, we'll just create a simple flow with a condition node, a text node, and an end node
  const nodes = [];
  const edges = [];
  
  // Create a condition node as the starting point
  const conditionNode = createNode(
    { nodes, edges },
    'conditionNode',
    { x: 100, y: 100 },
    {
      conditionText: `Email contains "${description}"`,
      returnText: 'Condition met',
      isStartingPoint: true
    }
  );
  nodes.push(conditionNode);
  
  // Create a text node
  const textNode = createNode(
    { nodes, edges },
    'textNode',
    { x: 100, y: 300 },
    {
      text: `Processing for: ${description}`
    }
  );
  nodes.push(textNode);
  
  // Create an end node
  const endNode = createNode(
    { nodes, edges },
    'endNode',
    { x: 100, y: 500 }
  );
  nodes.push(endNode);
  
  // Connect the nodes
  const edge1 = createConnection(conditionNode.id, textNode.id);
  const edge2 = createConnection(textNode.id, endNode.id);
  edges.push(edge1, edge2);
  
  // Calculate optimal positions for the nodes
  const positionedNodes = calculateNodePositions(nodes, edges);
  
  return {
    nodes: positionedNodes,
    edges
  };
}

/**
 * Get information about all available node types
 * 
 * @returns {Object} - Information about all available node types
 */
export function getNodeTypesInfo() {
  return {
    conditionNode: {
      description: "Starting point that checks conditions in incoming emails",
      handles: {
        inputs: [],
        outputs: [
          { id: "execution", type: "execution", description: "Execution flow output" },
          { id: "attr-fromEmail", type: "data", description: "Sender email address" },
          { id: "attr-fromDisplayName", type: "data", description: "Sender display name" },
          { id: "attr-toEmail", type: "data", description: "Recipient email address" },
          { id: "attr-toDisplayName", type: "data", description: "Recipient display name" },
          { id: "attr-subject", type: "data", description: "Email subject" },
          { id: "attr-content", type: "data", description: "Email content" },
          // Add other attributes as needed
        ]
      }
    },
    sendingMailNode: {
      description: "Sends an email with specified attributes",
      handles: {
        inputs: [
          { id: "execution", type: "execution", description: "Execution flow input" },
          { id: "attr-fromEmail", type: "data", description: "Sender email address" },
          { id: "attr-fromDisplayName", type: "data", description: "Sender display name" },
          { id: "attr-toEmail", type: "data", description: "Recipient email address" },
          { id: "attr-toDisplayName", type: "data", description: "Recipient display name" },
          { id: "attr-subject", type: "data", description: "Email subject" },
          { id: "attr-content", type: "data", description: "Email content" },
          // Add other attributes as needed
        ],
        outputs: [
          { id: "execution", type: "execution", description: "Execution flow output" }
        ]
      }
    },
    textNode: {
      description: "Processes and manipulates text",
      handles: {
        inputs: [
          { id: "execution", type: "execution", description: "Execution flow input" },
          { id: "attr-text", type: "data", description: "Text input" }
        ],
        outputs: [
          { id: "execution", type: "execution", description: "Execution flow output" },
          { id: "attr-text", type: "data", description: "Processed text output" }
        ]
      }
    },
    aiNode: {
      description: "AI-powered text generation",
      handles: {
        inputs: [
          { id: "execution", type: "execution", description: "Execution flow input" },
          { id: "attr-input", type: "data", description: "Input text for AI processing" }
        ],
        outputs: [
          { id: "execution", type: "execution", description: "Execution flow output" },
          { id: "attr-output", type: "data", description: "AI-generated output text" }
        ]
      }
    },
    mailBodyNode: {
      description: "Creates email body templates",
      handles: {
        inputs: [
          { id: "execution", type: "execution", description: "Execution flow input" },
          { id: "attr-content", type: "data", description: "Email content input" }
        ],
        outputs: [
          { id: "execution", type: "execution", description: "Execution flow output" },
          { id: "attr-content", type: "data", description: "Email content output" }
        ]
      }
    },
    switchNode: {
      description: "Branches based on conditions",
      handles: {
        inputs: [
          { id: "execution", type: "execution", description: "Execution flow input" },
          { id: "attr-field", type: "data", description: "Field to evaluate" }
        ],
        outputs: [
          { id: "case-true", type: "execution", description: "True case output" },
          { id: "case-false", type: "execution", description: "False case output" },
          // Dynamic case outputs will be generated based on the cases
        ]
      }
    },
    logicalOperatorNode: {
      description: "Combines multiple conditions (AND, OR, NOT)",
      handles: {
        inputs: [
          { id: "execution", type: "execution", description: "Execution flow input" },
          { id: "input-1", type: "data", description: "First input" },
          { id: "input-2", type: "data", description: "Second input" },
          // Dynamic inputs based on inputCount
        ],
        outputs: [
          { id: "execution", type: "execution", description: "Execution flow output" },
          { id: "result", type: "data", description: "Logical operation result" }
        ]
      }
    },
    endNode: {
      description: "Terminates flows",
      handles: {
        inputs: [
          { id: "execution", type: "execution", description: "Execution flow input" }
        ],
        outputs: []
      }
    }
    // Add other node types as needed
  };
}

/**
 * Get the current flow context
 * 
 * @param {Array} nodes - The current nodes in the flow
 * @param {Array} edges - The current edges in the flow
 * @returns {Object} - The flow context
 */
export function getFlowContext(nodes, edges) {
  // Get information about all node types
  const nodeTypesInfo = getNodeTypesInfo();
  
  // Get information about the current flow
  const startingNodes = nodes.filter(node => 
    node.type === 'conditionNode' && node.data.isStartingPoint
  );
  
  const endNodes = nodes.filter(node => node.type === 'endNode');
  
  // Build adjacency list
  const adjacency = new Map();
  edges.forEach(edge => {
    if (!adjacency.has(edge.source)) {
      adjacency.set(edge.source, []);
    }
    adjacency.get(edge.source).push({
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      isExecutionLink: edge.data?.isExecutionLink || 
        (edge.sourceHandle === 'execution' && edge.targetHandle === 'execution')
    });
  });
  
  return {
    nodeTypes: nodeTypesInfo,
    currentFlow: {
      nodes,
      edges,
      startingNodes,
      endNodes,
      adjacency
    }
  };
}
