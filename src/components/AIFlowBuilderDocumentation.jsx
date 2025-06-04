import React from 'react';

/**
 * Documentation component for the AI Flow Builder feature
 */
const AIFlowBuilderDocumentation = () => (
  <section id="ai-flow-builder" className="documentation-section">
  <h2>AI Flow Builder</h2>
  <p>
    The AI Flow Builder is a powerful feature that allows you to generate complete workflows using natural language descriptions. Instead of manually creating and connecting nodes, you can simply describe what you want to achieve, and the AI will build the flow for you.
  </p>
  
  <h3>Using the AI Flow Builder</h3>
  <p>
    To create a flow using AI:
  </p>
  <ol>
    <li>Open the Diagram Editor with an active flow</li>
    <li>Click the "IA Flow Builder" button in the top menu</li>
    <li>In the dialog that appears, describe the workflow you want to create in natural language</li>
    <li>If you have an existing flow, you can choose whether to use the current flow context to help the AI understand your environment</li>
    <li>Click "Générer le flux" to generate the flow</li>
    <li>The AI will create and position the necessary nodes and connections</li>
    <li>You can then review and refine the generated flow as needed</li>
  </ol>
  
  <h3>Tips for Effective Prompts</h3>
  <p>
    To get the best results from the AI Flow Builder, consider these tips for writing effective prompts:
  </p>
  <ul>
    <li><strong>Be specific:</strong> Clearly describe the trigger, conditions, and actions you want in your flow</li>
    <li><strong>Mention node types:</strong> If you know which specific nodes you need, mention them by name</li>
    <li><strong>Include data relationships:</strong> Describe how data should flow between nodes</li>
    <li><strong>Use examples:</strong> Provide concrete examples of the inputs and outputs you expect</li>
    <li><strong>Context awareness:</strong> When building on an existing flow, enable the flow context option to help the AI understand your current setup</li>
  </ul>
  
  <h3>Example Prompts</h3>
  <p>
    Here are some examples of effective prompts for the AI Flow Builder:
  </p>
  <ul>
    <li>"When I receive an email with 'invoice' in the subject, extract the invoice number and amount, then send a confirmation email to the sender"</li>
    <li>"Create a flow that monitors for emails about customer complaints, uses AI to analyze the sentiment, and forwards urgent issues to the support team"</li>
    <li>"I need a workflow that processes incoming order emails, extracts order details using OCR if there's an attachment, and creates a ticket in our API"</li>
    <li>"J'aimerais que pour les mails de factures impayées, on envoie un mail de rappel au client"</li>
  </ul>
  
  <h3>Understanding Generated Flows</h3>
  <p>
    The AI Flow Builder creates two types of connections between nodes:
  </p>
  <ul>
    <li><strong>Execution connections</strong> (gray arrows): These determine the order in which nodes are executed</li>
    <li><strong>Data connections</strong> (blue arrows): These show how data flows between nodes</li>
  </ul>
  
  <p>
    For example, in a flow that sends reminder emails for unpaid invoices:
  </p>
  <ul>
    <li>The AI node analyzes the invoice email and generates reminder text</li>
    <li>The Mail Body node contains the template with variables (prefixed with $) that can be filled with data</li>
    <li>Data connections link the original email's sender to the reminder email's recipient</li>
    <li>Data connections also link the AI output to variables in the Mail Body</li>
  </ul>
  
  <h3>Limitations and Best Practices</h3>
  <p>
    While the AI Flow Builder is powerful, it has some limitations to be aware of:
  </p>
  <ul>
    <li><strong>Complex Flows:</strong> The AI may struggle with very complex workflows that involve multiple conditions and branching paths</li>
    <li><strong>Specialized Nodes:</strong> Some specialized node types may not be used optimally by the AI if they're not explicitly mentioned in your prompt</li>
    <li><strong>API Integration:</strong> When working with API nodes, the AI needs specific information about endpoints and parameters to create accurate connections</li>
    <li><strong>Data Relationships:</strong> Complex data relationships between nodes might require manual adjustment after generation</li>
    <li><strong>Context Integration:</strong> When using flow context, the AI will try to integrate with existing nodes, but may not always create optimal connections</li>
  </ul>
  
  <p>
    To get better results from the AI Flow Builder:
  </p>
  <ul>
    <li><strong>Be specific about node types:</strong> Explicitly mention the types of nodes you want to use (e.g., "using API nodes to check user accounts")</li>
    <li><strong>Describe data flow:</strong> Explain how data should flow between nodes (e.g., "pass the email address from the condition node to the API node")</li>
    <li><strong>Mention conditional logic:</strong> Clearly describe any branching logic (e.g., "if the user has an account, do X, otherwise do Y")</li>
    <li><strong>Provide API details:</strong> Include information about API endpoints and parameters when relevant</li>
    <li><strong>Review and refine:</strong> Always review the generated flow and make manual adjustments as needed</li>
  </ul>
  
  <div className="warning">
    <strong>Note:</strong> The AI Flow Builder is designed to give you a starting point, not a perfect final solution. Complex workflows will likely require some manual refinement after generation.
  </div>
  
  <div className="tip">
    <strong>Tip:</strong> After generating a flow with AI, review the connections and node configurations to ensure they match your requirements. Pay special attention to data connections between nodes, as these determine how information flows through your workflow. You can always modify the generated flow manually.
  </div>
  
  <h3>AI-Driven Flow Creation</h3>
  <p>
    The AI Flow Builder can now interact directly with your diagram editor, allowing it to:
  </p>
  <ul>
    <li><strong>Understand existing flows:</strong> The AI can analyze your current flow structure and build upon it</li>
    <li><strong>Create complex node arrangements:</strong> Based on your description, the AI can create sophisticated node layouts with proper spacing</li>
    <li><strong>Establish appropriate connections:</strong> The AI understands both execution flow (how nodes are executed sequentially) and data flow (how information passes between nodes)</li>
    <li><strong>Integrate with existing nodes:</strong> When using flow context, the AI can connect new nodes to your existing flow elements</li>
  </ul>
  
  <p>
    This feature is particularly useful for:
  </p>
  <ul>
    <li><strong>Rapid prototyping:</strong> Quickly create a working flow that you can refine later</li>
    <li><strong>Complex automation:</strong> Let the AI handle the intricate connections between multiple nodes</li>
    <li><strong>Learning the platform:</strong> See how the AI structures flows to learn best practices</li>
    <li><strong>Extending existing flows:</strong> Add new functionality to your current workflows without manual configuration</li>
  </ul>
    <h3>AI-Driven Autonomous Flow Creation</h3>
    <p>
      <strong>New Feature:</strong> The AI Flow Builder can now autonomously create complete flows based on your natural language descriptions. This powerful enhancement allows you to:
    </p>
    <ul>
      <li><strong>Describe your workflow in plain language:</strong> Simply tell the AI what you want to accomplish (e.g., "For unpaid invoice emails, send a reminder email asking for payment")</li>
      <li><strong>Let the AI handle the implementation:</strong> The AI will select appropriate nodes, position them logically, and create all necessary connections</li>
      <li><strong>Focus on your business logic:</strong> Instead of worrying about technical implementation details, you can focus on describing your workflow requirements</li>
    </ul>
    
    <p>
      The AI will:
    </p>
    <ul>
      <li>Analyze your description to understand the workflow requirements</li>
      <li>Select the most appropriate node types for each step in the process</li>
      <li>Create and position nodes in a logical layout</li>
      <li>Establish both execution connections (flow sequence) and data connections (information transfer)</li>
      <li>Configure node properties with sensible defaults based on your description</li>
    </ul>
    
    <div className="tip">
      <strong>Pro Tip:</strong> For best results, be specific about the conditions that trigger your workflow and the actions you want to take. Include details about data you want to extract or manipulate, and specify any decision points or conditional logic.
    </div>
  </section>
);

export default AIFlowBuilderDocumentation;
