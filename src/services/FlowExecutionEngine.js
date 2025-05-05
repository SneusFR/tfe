// Flow Execution Visualizer
// This service handles the visualization of a flow diagram execution

class FlowExecutionVisualizer {
  constructor() {
    this.nodes = [];
    this.edges = [];
    this.executionContext = new Map(); // Stores data during execution for visualization
  }

  // Set the diagram data (nodes and edges)
  setDiagram(nodes, edges) {
    this.nodes = nodes;
    this.edges = edges;
  }

  // Find the starting point node for a given task
  findStartingNode(task) {
    // Look for a condition node marked as starting point
    // that has a returnText matching the task type
    const startingNode = this.nodes.find(node => 
      node.type === 'conditionNode' && 
      node.data.isStartingPoint === true &&
      node.data.returnText === task.type
    );
    
    if (!startingNode) {
      console.error(`❌ [FLOW VISUALIZER] No matching starting node found for task type "${task.type}"`);
      return null;
    }
    
    console.log(`✅ [FLOW VISUALIZER] Found starting node with return value "${startingNode.data.returnText}"`);
    return startingNode;
  }

  // Get data for a specific handle (for visualization purposes only)
  getDataForHandle(node, handleId) {
    // For condition node attributes
    if (handleId.startsWith('attr-') && node.type === 'conditionNode') {
      return this.executionContext.get(handleId);
    }
    
    // For int node output
    if (handleId === 'attr-int' && node.type === 'intNode') {
      return node.data.value;
    }
    
    // For text node output
    if (node.type === 'textNode') {
      return node.data.text;
    }
    
    // Default: return the node's general output
    return this.executionContext.get(`output-${node.id}`);
  }

  // Simulate a flow execution for visualization purposes
  async visualizeFlow(task) {
    console.log(`🔄 [FLOW VISUALIZER] Visualizing flow for task: ${task.id} - ${task.type}`);
    
    // Find the starting node that matches the task type
    const startingNode = this.findStartingNode(task);
    if (!startingNode) {
      return { success: false, error: 'No starting node found for this task type' };
    }
    
    // Initialize execution context with task data
    this.executionContext.clear();
    this.executionContext.set('task', task);
    
    // Populate starting node attributes with task data if available
    if (startingNode.data.emailAttributes && task.sourceId) {
      // Map all email attributes from task to execution context
      const emailAttributes = {
        email_id: task.sourceId,
        fromEmail: task.senderEmail,
        fromDisplayName: task.senderName ?? startingNode.data.emailAttributes.fromDisplayName,
        toEmail: task.recipientEmail,
        toDisplayName: task.recipientName ?? startingNode.data.emailAttributes.toDisplayName,
        subject: task.subject ?? startingNode.data.emailAttributes.subject,
        date: task.date ?? startingNode.data.emailAttributes.date,
        content: task.body ?? startingNode.data.emailAttributes.content,
        attachment_id: task.attachmentId ?? startingNode.data.emailAttributes.attachment_id
      };
      
      // Store all attributes in execution context
      Object.entries(emailAttributes).forEach(([k, v]) => {
        if (v !== undefined) {
          this.executionContext.set('attr-' + k, v);
        }
      });
    }
    
    // Return visualization data
    return { 
      success: true, 
      startingNodeId: startingNode.id,
      flowPath: this.getFlowPath(startingNode)
    };
  }
  
  // Get the execution path through the flow (for visualization)
  getFlowPath(startNode) {
    const visited = new Set();
    const path = [];
    
    const traverse = (node) => {
      if (visited.has(node.id)) return;
      
      visited.add(node.id);
      path.push(node.id);
      
      // Find execution edges from this node
      const executionEdges = this.edges.filter(edge => 
        edge.source === node.id && 
        edge.data?.isExecutionLink === true
      );
      
      // Follow each execution edge
      for (const edge of executionEdges) {
        const targetNode = this.nodes.find(n => n.id === edge.target);
        if (targetNode) {
          path.push(edge.id); // Add the edge to the path
          traverse(targetNode);
        }
      }
    };
    
    traverse(startNode);
    return path;
  }
}

export default new FlowExecutionVisualizer();
