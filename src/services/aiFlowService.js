import { OpenAI } from 'openai';
import { generateMockFlow } from './mockAiFlowService';
import * as aiDiagramInteraction from './aiDiagramInteractionService';

// OpenAI API configuration
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_MODEL = 'o3'; // Using the best available model

// Initialize OpenAI client
const openai = OPENAI_API_KEY ? new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Allow usage in browser environment
}) : null;

/**
 * Generate a flow based on a natural language description using OpenAI's API
 * 
 * @param {string} prompt - The natural language description of the flow
 * @param {Object} flowContext - Optional context about the current flow (nodes, edges)
 * @returns {Promise<Object>} - The generated flow data
 */
export async function generateFlow(prompt, flowContext = null) {
  try {
    // If no API key is available, fall back to mock implementation
    if (!OPENAI_API_KEY) {
      console.warn('No OpenAI API key found. Using mock implementation instead.');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (flowContext) {
        // If we have flow context, use the AI diagram interaction service
        return aiDiagramInteraction.buildFlowFromDescription(prompt, flowContext);
      } else {
        // Otherwise, fall back to the mock implementation
        return generateMockFlow(prompt);
      }
    }

    // Get information about all available node types
    const nodeTypesInfo = aiDiagramInteraction.getNodeTypesInfo();
    
    // Prepare the system message that explains what we want from the AI
    const systemMessage = `
You are an expert flow builder for an email automation platform. Your task is to create a flow diagram based on the user's description.

The flow should include appropriate nodes and connections for the described automation. Here are the available node types and their purposes:

## Starting Points
- conditionNode: This is always the starting point of a flow. It checks conditions in incoming emails (e.g., subject contains "invoice", sender is from a specific domain). Every flow must start with at least one conditionNode with isStartingPoint set to true.

## Processing Nodes
- apiNode: For making API calls to external services (e.g., checking if a customer exists in a database)
- switchNode: For branching based on conditions (e.g., if customer exists, do X, otherwise do Y)
- textNode: For text processing and manipulation
- aiNode: For AI-powered text generation (e.g., summarizing email content, generating responses)
- mailBodyNode: For creating email body templates
- logicalOperatorNode: For combining multiple conditions (AND, OR, NOT)

## Output Nodes
- sendingMailNode: For sending emails (requires to, from, subject, and content)
- endNode: For terminating flows (every flow path should end with this)

## Node Data Requirements
- conditionNode: { conditionText: "string", returnText: "string", isStartingPoint: true, emailAttributes: {...} }
- apiNode: { method: "GET|POST|PUT|DELETE", url: "string", headers: {}, body: {} }
- switchNode: { cases: [{ id: "string", value: "string", label: "string" }] }
- textNode: { text: "string" }
- aiNode: { prompt: "string", input: "string" }
- mailBodyNode: { content: "string" }
- sendingMailNode: { emailAttributes: { fromEmail, toEmail, subject, content, etc. } }

## Connection Types
- Execution connections: Connect the "execution" handle of one node to another to define the flow of execution
- Data connections: Connect data output handles to input handles to pass data between nodes

Your response must be a valid JSON object with 'nodes' and 'edges' arrays. Each node must have:
- id: A unique string identifier (e.g., "condition-1", "api-2")
- type: One of the node types listed above
- position: { x: 0, y: 0 } (positions will be adjusted automatically)
- data: Object containing node-specific properties as described above

Each edge must have:
- id: A unique string identifier
- source: ID of the source node
- target: ID of the target node
- sourceHandle: Handle ID on the source node (e.g., "execution", "output")
- targetHandle: Handle ID on the target node (e.g., "execution", "input")

IMPORTANT: Always create a complete flow that handles the entire process described by the user. Make sure all paths end with an endNode. For email-related flows, always include proper email handling with sendingMailNode when responses are needed.

${flowContext ? `
## Current Flow Context
The user already has a flow with the following elements:
- Starting nodes: ${flowContext.currentFlow?.startingNodes?.length || 0}
- End nodes: ${flowContext.currentFlow?.endNodes?.length || 0}
- Total nodes: ${flowContext.currentFlow?.nodes?.length || 0}
- Total connections: ${flowContext.currentFlow?.edges?.length || 0}

IMPORTANT: Create a NEW flow based on the user's current description ONLY. DO NOT incorporate elements from previous flows or previous requests. The flow context is provided only for awareness of the current environment, not to mix with previous flows.
` : ''}
`;

    // Prepare the user message with the prompt
    const userMessage = `Create a flow diagram for the following automation: ${prompt}`;

    // Make the API call to OpenAI using the client library
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      temperature: 1,
      max_completion_tokens: 4000
    });

    // Extract the AI's response
    const aiResponse = response.choices[0].message.content;
    
    // Parse the JSON response
    let flowData;
    try {
      // Extract JSON from the response (in case the AI included explanatory text)
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || 
                        aiResponse.match(/{[\s\S]*}/);
      
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : aiResponse;
      flowData = JSON.parse(jsonString);
      
      // Ensure the flowData has the expected structure
      if (!flowData.nodes || !Array.isArray(flowData.nodes) || 
          !flowData.edges || !Array.isArray(flowData.edges)) {
        throw new Error('Invalid flow data structure');
      }
      
      // Position the nodes in a logical layout using our aiDiagramInteraction service
      flowData.nodes = aiDiagramInteraction.calculateNodePositions(flowData.nodes, flowData.edges);
      
      return flowData;
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.log('AI response:', aiResponse);
      
      if (flowContext) {
        // If we have flow context, use the AI diagram interaction service
        console.warn('Falling back to AI diagram interaction service due to parsing error');
        return aiDiagramInteraction.buildFlowFromDescription(prompt, flowContext);
      } else {
        // Otherwise, fall back to the mock implementation
        console.warn('Falling back to mock implementation due to parsing error');
        return generateMockFlow(prompt);
      }
    }
  } catch (error) {
    console.error('Error generating flow:', error);
    
    // Handle OpenAI API errors
    if (error.status === 429) {
      console.warn('OpenAI API rate limit exceeded. Falling back to alternative implementation.');
      if (flowContext) {
        return aiDiagramInteraction.buildFlowFromDescription(prompt, flowContext);
      } else {
        return generateMockFlow(prompt);
      }
    } else if (error.status >= 500) {
      console.warn('OpenAI API server error. Falling back to alternative implementation.');
      if (flowContext) {
        return aiDiagramInteraction.buildFlowFromDescription(prompt, flowContext);
      } else {
        return generateMockFlow(prompt);
      }
    } else if (error.name === 'AbortError') {
      console.warn('OpenAI API request timed out. Falling back to alternative implementation.');
      if (flowContext) {
        return aiDiagramInteraction.buildFlowFromDescription(prompt, flowContext);
      } else {
        return generateMockFlow(prompt);
      }
    } else if (error.code === 'ECONNABORTED' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      console.warn('Network error when calling OpenAI API. Falling back to alternative implementation.');
      if (flowContext) {
        return aiDiagramInteraction.buildFlowFromDescription(prompt, flowContext);
      } else {
        return generateMockFlow(prompt);
      }
    }
    
    // For other errors, provide a user-friendly message
    throw new Error(
      error.message || 
      'Une erreur est survenue lors de la génération du flux avec l\'IA'
    );
  }
}

/**
 * Parse the AI-generated flow data and create nodes and edges
 * 
 * @param {Object} flowData - The flow data generated by the AI
 * @returns {Object} - The parsed nodes and edges
 */
export function parseAIFlowData(flowData) {
  // This function will be called by the DiagramEditor to create nodes and edges
  // based on the AI-generated flow data
  
  const { nodes = [], edges = [] } = flowData;
  
  // Process nodes to ensure they have all required properties
  const processedNodes = nodes.map(node => {
    // Ensure each node has a unique ID
    if (!node.id) {
      node.id = `${node.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Ensure each node has a position
    if (!node.position) {
      node.position = { x: 0, y: 0 };
    }
    
    // Process specific node types
    switch (node.type) {
      case 'conditionNode':
        return {
          ...node,
          data: {
            ...node.data,
            isStartingPoint: node.data.isStartingPoint || true,
            emailAttributes: node.data.emailAttributes || {
              email_id: 'email-123',
              fromEmail: 'sender@example.com',
              fromDisplayName: 'Sender Name',
              toEmail: 'recipient@example.com',
              toDisplayName: 'Recipient Name',
              subject: 'Email Subject',
              date: new Date().toISOString(),
              content: 'Email content preview...',
              attachments: [],
              cc: [],
              bcc: [],
            }
          }
        };
        
      case 'sendingMailNode':
        return {
          ...node,
          data: {
            ...node.data,
            emailAttributes: node.data.emailAttributes || {
              account_id: '',
              fromEmail: 'sender@example.com',
              fromDisplayName: 'Sender Name',
              toEmail: 'recipient@example.com',
              toDisplayName: 'Recipient Name',
              subject: 'Email Subject',
              content: 'Email content...',
              reply_to: '',
              cc: [],
              bcc: [],
              custom_headers: [],
            }
          }
        };
        
      case 'textNode':
        return {
          ...node,
          data: {
            ...node.data,
            text: node.data.text || 'Enter text here...',
          }
        };
        
      case 'aiNode':
        return {
          ...node,
          data: {
            ...node.data,
            prompt: node.data.prompt || 'Enter your prompt here...',
            input: node.data.input || '',
            output: node.data.output || '',
          }
        };
        
      case 'mailBodyNode':
        return {
          ...node,
          data: {
            ...node.data,
            content: node.data.content || '',
          }
        };
        
      default:
        return node;
    }
  });
  
  // Process edges to ensure they have all required properties
  const processedEdges = edges.map(edge => {
    // Ensure each edge has a unique ID
    if (!edge.id) {
      edge.id = `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Determine if this is an execution link or a data link
    const isExecutionLink = 
      (edge.sourceHandle?.startsWith('execution') && edge.targetHandle?.startsWith('execution')) ||
      ((!edge.sourceHandle || edge.sourceHandle === 'default-out') && 
       (!edge.targetHandle || edge.targetHandle === 'default-in'));
    
    const linkColor = isExecutionLink ? '#555' : '#3498db';
    
    return {
      ...edge,
      sourceHandle: edge.sourceHandle || 'execution',
      targetHandle: edge.targetHandle || 'execution',
      type: isExecutionLink ? 'smoothstep' : 'default',
      data: {
        ...edge.data,
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
  });
  
  return {
    nodes: processedNodes,
    edges: processedEdges,
  };
}

/**
 * Position nodes in a logical layout
 * 
 * @param {Array} nodes - The nodes to position
 * @param {Array} edges - The edges connecting the nodes
 * @returns {Array} - The nodes with updated positions
 */
export function positionNodes(nodes, edges) {
  // Use the aiDiagramInteraction service to calculate node positions
  return aiDiagramInteraction.calculateNodePositions(nodes, edges);
}
