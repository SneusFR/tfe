// Flow Execution Engine
// This service handles the execution of a flow diagram by traversing nodes and edges

import axios from 'axios';

class FlowExecutionEngine {
  constructor() {
    this.nodes = [];
    this.edges = [];
    this.executionContext = new Map(); // Stores data during execution
    this.baseApiUrl = 'http://localhost:5171'; // Backend API base URL
  }

  // Set the diagram data (nodes and edges)
  setDiagram(nodes, edges) {
    this.nodes = nodes;
    this.edges = edges;
  }

  // Find the starting point node for a given task
  findStartingNode(task) {
    // Look for a condition node marked as starting point
    // that matches the task type or description
    const startingNode = this.nodes.find(node => 
      node.type === 'conditionNode' && 
      node.data.isStartingPoint === true &&
      (node.data.conditionText.includes(task.type) || 
       node.data.conditionText.includes(task.description))
    );
    
    return startingNode;
  }

  // Execute a flow for a given task
  async executeFlow(task) {
    console.log(`🔄 [FLOW ENGINE] Starting execution for task: ${task.id} - ${task.type}`);
    
    // Find the starting node
    const startingNode = this.findStartingNode(task);
    if (!startingNode) {
      console.error(`❌ [FLOW ENGINE] No starting node found for task: ${task.type}`);
      return { success: false, error: 'No starting node found for this task type' };
    }
    
    console.log(`✅ [FLOW ENGINE] Found starting node: ${startingNode.id}`);
    
    // Initialize execution context with task data
    this.executionContext.clear();
    this.executionContext.set('task', task);
    
    // Populate starting node attributes with task data
    if (startingNode.data.emailAttributes) {
      // Map task data to email attributes
      const emailAttributes = {
        ...startingNode.data.emailAttributes,
        fromEmail: task.senderEmail || startingNode.data.emailAttributes.fromEmail,
        toEmail: task.recipientEmail || startingNode.data.emailAttributes.toEmail,
        // Add other mappings as needed
      };
      
      // Store each attribute in the execution context
      Object.entries(emailAttributes).forEach(([key, value]) => {
        this.executionContext.set(`attr-${key}`, value);
      });
    }
    
    // Execute the flow starting from the starting node
    try {
      const result = await this.executeNode(startingNode);
      console.log(`✅ [FLOW ENGINE] Flow execution completed successfully`);
      return { success: true, result };
    } catch (error) {
      console.error(`❌ [FLOW ENGINE] Error executing flow:`, error);
      return { success: false, error: error.message };
    }
  }

  // Execute a single node and follow its outgoing edges
  async executeNode(node) {
    console.log(`🔄 [FLOW ENGINE] Executing node: ${node.id} (${node.type})`);
    
    let outputData;
    
    // Execute node based on its type
    switch (node.type) {
      case 'conditionNode':
        outputData = await this.executeConditionNode(node);
        break;
      case 'apiNode':
        outputData = await this.executeApiNode(node);
        break;
      case 'textNode':
        outputData = await this.executeTextNode(node);
        break;
      case 'intNode':
        outputData = await this.executeIntNode(node);
        break;
      case 'sendingMailNode':
        outputData = await this.executeSendingMailNode(node);
        break;
      default:
        console.warn(`⚠️ [FLOW ENGINE] Unknown node type: ${node.type}`);
        outputData = null;
    }
    
      // Store the node's output in the execution context
      if (outputData !== undefined) {
        this.executionContext.set(`output-${node.id}`, outputData);
        
        // If the node has a specific output handle, store the data for that handle
        if (node.type === 'apiNode' && outputData) {
          // Store the complete response
          this.executionContext.set(`${node.id}-output`, outputData);
          
          // Store specific parts of the response for the new output handles
          this.executionContext.set(`${node.id}-output-response`, outputData);
          this.executionContext.set(`${node.id}-output-body`, outputData); // For API responses, the data is usually the body
          this.executionContext.set(`${node.id}-output-status`, 200); // Default to 200 for mock responses
        }
      }
    
    // Find and follow outgoing edges
    const outgoingEdges = this.edges.filter(edge => edge.source === node.id);
    
    // Process each outgoing edge
    const results = [];
    for (const edge of outgoingEdges) {
      const targetNode = this.nodes.find(n => n.id === edge.target);
      if (targetNode) {
        // Pass data from source handle to target handle if specified
        if (edge.sourceHandle && edge.targetHandle) {
          const sourceData = this.getDataForHandle(node, edge.sourceHandle);
          if (sourceData !== undefined) {
            this.executionContext.set(edge.targetHandle, sourceData);
          }
        }
        
        // Execute the target node
        const result = await this.executeNode(targetNode);
        results.push(result);
      }
    }
    
    return results.length > 0 ? results : outputData;
  }

  // Get data for a specific handle
  getDataForHandle(node, handleId) {
    // For condition node attributes
    if (handleId.startsWith('attr-') && node.type === 'conditionNode') {
      return this.executionContext.get(handleId);
    }
    
    // For int node output
    if (handleId === 'attr-int' && node.type === 'intNode') {
      return node.data.value;
    }
    
    // For API node output - main output handle
    if (handleId === 'output' && node.type === 'apiNode') {
      return this.executionContext.get(`${node.id}-output`);
    }
    
    // For API node specific output handles
    if (handleId.startsWith('output-') && node.type === 'apiNode') {
      const outputType = handleId.replace('output-', '');
      return this.executionContext.get(`${node.id}-output-${outputType}`);
    }
    
    // For text node output
    if (node.type === 'textNode') {
      return node.data.text;
    }
    
    // Default: return the node's general output
    return this.executionContext.get(`output-${node.id}`);
  }

  // Execute a condition node
  async executeConditionNode(node) {
    console.log(`🔄 [FLOW ENGINE] Executing condition node: ${node.id}`);
    
    // For starting points, we've already populated the attributes
    if (node.data.isStartingPoint) {
      return node.data.returnText || 'Condition matched';
    }
    
    // For regular condition nodes, evaluate the condition
    // This is a simplified implementation
    return node.data.returnText || 'Condition evaluated';
  }

  // Execute an API node
  async executeApiNode(node) {
    console.log(`🔄 [FLOW ENGINE] Executing API node: ${node.id} - ${node.data.method} ${node.data.path}`);
    
    try {
      // Build the request configuration
      const method = node.data.method.toLowerCase();
      let url = node.data.path;
      
      // Replace path parameters with values from the execution context
      if (node.data.parameters) {
        for (const param of node.data.parameters) {
          if (param.in === 'path') {
            // Get parameter value from connected handle or execution context
            let paramValue = this.executionContext.get(`param-${param.name}`);
            
            // If not found in execution context, check if there's a direct connection to this parameter
            if (paramValue === undefined) {
              // Find edges that target this parameter's handle
              const targetHandleId = `param-${param.name}`;
              const incomingEdges = this.edges.filter(edge => 
                edge.target === node.id && edge.targetHandle === targetHandleId
              );
              
              if (incomingEdges.length > 0) {
                // Get the source node and handle
                const sourceEdge = incomingEdges[0];
                const sourceNode = this.nodes.find(n => n.id === sourceEdge.source);
                
                if (sourceNode) {
                  // Get data from the source node's handle
                  paramValue = this.getDataForHandle(sourceNode, sourceEdge.sourceHandle);
                }
              }
            }
            
            // If we have a value, replace the parameter in the URL
            if (paramValue !== undefined) {
              console.log(`🔄 [FLOW ENGINE] Replacing path parameter {${param.name}} with value: ${paramValue}`);
              url = url.replace(`{${param.name}}`, paramValue);
            } else {
              console.warn(`⚠️ [FLOW ENGINE] No value found for path parameter: ${param.name}`);
            }
          }
        }
      }
      
      // Ensure URL starts with the base API URL
      if (!url.startsWith('http')) {
        url = `${this.baseApiUrl}${url}`;
      }
      
      // Build query parameters
      const queryParams = {};
      if (node.data.parameters) {
        for (const param of node.data.parameters) {
          if (param.in === 'query') {
            // Get parameter value from connected handle or execution context
            let paramValue = this.executionContext.get(`param-${param.name}`);
            
            // If not found in execution context, check if there's a direct connection to this parameter
            if (paramValue === undefined) {
              // Find edges that target this parameter's handle
              const targetHandleId = `param-${param.name}`;
              const incomingEdges = this.edges.filter(edge => 
                edge.target === node.id && edge.targetHandle === targetHandleId
              );
              
              if (incomingEdges.length > 0) {
                // Get the source node and handle
                const sourceEdge = incomingEdges[0];
                const sourceNode = this.nodes.find(n => n.id === sourceEdge.source);
                
                if (sourceNode) {
                  // Get data from the source node's handle
                  paramValue = this.getDataForHandle(sourceNode, sourceEdge.sourceHandle);
                }
              }
            }
            
            // If we have a value, add it to the query parameters
            if (paramValue !== undefined) {
              console.log(`🔄 [FLOW ENGINE] Adding query parameter ${param.name}=${paramValue}`);
              queryParams[param.name] = paramValue;
            }
          }
        }
      }
      
      // Build request body if needed
      let requestBody = null;
      if (['post', 'put', 'patch'].includes(method) && node.data.requestBody) {
        // Get request body from execution context
        requestBody = this.executionContext.get('param-body');
        
        // If not found in execution context, check if there's a direct connection to the body parameter
        if (requestBody === undefined) {
          // Find edges that target the body parameter handle
          const targetHandleId = 'param-body';
          const incomingEdges = this.edges.filter(edge => 
            edge.target === node.id && edge.targetHandle === targetHandleId
          );
          
          if (incomingEdges.length > 0) {
            // Get the source node and handle
            const sourceEdge = incomingEdges[0];
            const sourceNode = this.nodes.find(n => n.id === sourceEdge.source);
            
            if (sourceNode) {
              // Get data from the source node's handle
              requestBody = this.getDataForHandle(sourceNode, sourceEdge.sourceHandle);
              
              // If the source is a text node, try to parse it as JSON
              if (sourceNode.type === 'textNode' && typeof requestBody === 'string') {
                try {
                  requestBody = JSON.parse(requestBody);
                  console.log(`🔄 [FLOW ENGINE] Parsed JSON body from text node`);
                } catch (e) {
                  console.warn(`⚠️ [FLOW ENGINE] Failed to parse text node content as JSON, using as string`);
                }
              }
            }
          }
        }
        
        if (requestBody !== undefined) {
          console.log(`🔄 [FLOW ENGINE] Using request body:`, requestBody);
        } else {
          console.warn(`⚠️ [FLOW ENGINE] No request body found for ${method.toUpperCase()} request`);
        }
      }
      
      // Execute the API request
      console.log(`🔄 [FLOW ENGINE] Making API request: ${method.toUpperCase()} ${url}`);
      const response = await axios({
        method,
        url,
        params: queryParams,
        data: requestBody,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`✅ [FLOW ENGINE] API request successful: ${response.status}`);
      
      // Store specific parts of the response in the execution context
      this.executionContext.set(`${node.id}-output-response`, response.data);
      this.executionContext.set(`${node.id}-output-body`, response.data);
      this.executionContext.set(`${node.id}-output-status`, response.status);
      
      return response.data;
    } catch (error) {
      console.error(`❌ [FLOW ENGINE] API request failed:`, error);
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  // Execute a text node
  async executeTextNode(node) {
    console.log(`🔄 [FLOW ENGINE] Executing text node: ${node.id}`);
    return node.data.text;
  }

  // Execute an int node
  async executeIntNode(node) {
    console.log(`🔄 [FLOW ENGINE] Executing int node: ${node.id}`);
    return node.data.value;
  }

  // Execute a sending mail node
  async executeSendingMailNode(node) {
    console.log(`🔄 [FLOW ENGINE] Executing sending mail node: ${node.id}`);
    
    // In a real implementation, this would send an email
    // For now, we'll just log the email details
    const emailData = {
      from: node.data.emailAttributes.fromEmail,
      to: node.data.emailAttributes.toEmail,
      subject: node.data.emailAttributes.subject,
      content: node.data.emailAttributes.content,
    };
    
    console.log(`📧 [FLOW ENGINE] Would send email:`, emailData);
    return { sent: true, email: emailData };
  }
}

export default new FlowExecutionEngine();
