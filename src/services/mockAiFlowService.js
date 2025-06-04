/**
 * Mock implementation of the AI flow generation API endpoint
 * This file simulates the backend response for the AI flow generation feature
 */

/**
 * Generate a mock flow based on a natural language description
 * 
 * @param {string} prompt - The natural language description of the flow
 * @returns {Object} - The generated flow data
 */
export function generateMockFlow(prompt) {
  // This is a mock implementation that returns a predefined flow based on the prompt
  // In a real implementation, this would call an AI service to generate the flow
  
  // Check if the prompt contains keywords related to appointment scheduling
  const isAppointmentScheduling = /rendez-vous|appointment|schedule|meeting/i.test(prompt);
  
  // Check if the prompt contains keywords related to account verification/creation
  const isAccountManagement = /compte|account|verify|create|vérifier|créer/i.test(prompt);
  
  // Check if the prompt contains keywords related to API usage
  const isApiUsage = /api|node api|nodes api/i.test(prompt);
  
  // Check if the prompt contains keywords related to email and unpaid invoices
  const isUnpaidInvoiceEmail = /unpaid|invoice|facture|impayée|payment reminder|rappel/i.test(prompt);
  
  // If the prompt is about appointment scheduling with account management via API
  if (isAppointmentScheduling && isAccountManagement && isApiUsage) {
    return generateAppointmentWithAccountCheckFlow();
  }
  
  // If the prompt is about unpaid invoice emails
  if (isUnpaidInvoiceEmail) {
    return generateUnpaidInvoiceFlow();
  }
  
  // Default flow for other types of prompts
  return generateDefaultFlow(prompt);
}

/**
 * Generate a flow for handling unpaid invoice emails
 * 
 * @returns {Object} - The generated flow data
 */
function generateUnpaidInvoiceFlow() {
  // Generate a unique ID for this flow
  const flowId = Date.now();
  
  // Create nodes
  const conditionNode = {
    id: `condition-node-${flowId}`,
    type: 'conditionNode',
    position: { x: 0, y: 0 },
    data: {
      conditionText: 'Email contient "facture impayée"',
      returnText: 'Facture impayée détectée',
      isStartingPoint: true,
      emailAttributes: {
        email_id: 'email-123',
        fromEmail: 'client@example.com',
        fromDisplayName: 'Client',
        toEmail: 'finance@company.com',
        toDisplayName: 'Service Facturation',
        subject: 'Facture impayée',
        date: new Date().toISOString(),
        content: 'Email content preview...',
        attachments: [],
        cc: [],
        bcc: [],
      },
    },
  };
  
  const aiNode = {
    id: `ai-node-${flowId}`,
    type: 'aiNode',
    position: { x: 0, y: 0 },
    data: {
      prompt: 'Générer un message de rappel poli pour une facture impayée. Utiliser les informations suivantes: numéro de facture, montant, date d\'échéance.',
      input: '{invoice_number}, {amount}, {due_date}',
      output: '',
    },
  };
  
  const mailBodyNode = {
    id: `mail-body-node-${flowId}`,
    type: 'mailBodyNode',
    position: { x: 0, y: 0 },
    data: {
      content: 'Bonjour $recipient_name,\n\nNous vous rappelons que la facture n°$invoice_number d\'un montant de $amount€ est impayée depuis le $due_date.\n\n$content\n\nMerci de bien vouloir procéder au règlement dans les plus brefs délais.\n\nCordialement,\nL\'équipe de facturation',
    },
  };
  
  const sendingMailNode = {
    id: `sending-mail-node-${flowId}`,
    type: 'sendingMailNode',
    position: { x: 0, y: 0 },
    data: {
      emailAttributes: {
        account_id: '',
        fromEmail: 'finance@company.com',
        fromDisplayName: 'Service Facturation',
        toEmail: 'client@example.com',
        toDisplayName: 'Client',
        subject: 'Rappel : Facture impayée',
        content: '',
        reply_to: '',
        cc: [],
        bcc: [],
        custom_headers: [],
      },
    },
  };
  
  const endNode = {
    id: `end-node-${flowId}`,
    type: 'endNode',
    position: { x: 0, y: 0 },
    data: {},
  };
  
  // Create edges
  const edges = [
    // Connect condition to AI (execution flow)
    {
      id: `edge-1-${flowId}`,
      source: conditionNode.id,
      target: aiNode.id,
      sourceHandle: 'execution',
      targetHandle: 'execution',
      type: 'smoothstep',
      data: { isExecutionLink: true },
      style: { stroke: '#555', strokeWidth: 2.5 },
      markerEnd: { type: 'arrowclosed', color: '#555' },
    },
    
    // Connect AI output to mailBody content (data flow)
    {
      id: `edge-2-${flowId}`,
      source: aiNode.id,
      target: mailBodyNode.id,
      sourceHandle: 'attr-output',
      targetHandle: 'attr-content',
      type: 'default',
      data: { isExecutionLink: false },
      style: { stroke: '#3498db', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#3498db' },
      label: 'output → $content',
    },
    
    // Connect AI to sendingMail (execution flow)
    {
      id: `edge-3-${flowId}`,
      source: aiNode.id,
      target: sendingMailNode.id,
      sourceHandle: 'execution',
      targetHandle: 'execution',
      type: 'smoothstep',
      data: { isExecutionLink: true },
      style: { stroke: '#555', strokeWidth: 2.5 },
      markerEnd: { type: 'arrowclosed', color: '#555' },
    },
    
    // Connect mailBody to sendingMail content (data flow)
    {
      id: `edge-4-${flowId}`,
      source: mailBodyNode.id,
      target: sendingMailNode.id,
      sourceHandle: 'attr-content',
      targetHandle: 'attr-content',
      type: 'default',
      data: { isExecutionLink: false },
      style: { stroke: '#3498db', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#3498db' },
      label: 'content → content',
    },
    
    // Connect condition fromEmail to sendingMail toEmail (data flow - inverted)
    {
      id: `edge-5-${flowId}`,
      source: conditionNode.id,
      target: sendingMailNode.id,
      sourceHandle: 'attr-fromEmail',
      targetHandle: 'attr-toEmail',
      type: 'default',
      data: { isExecutionLink: false },
      style: { stroke: '#3498db', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#3498db' },
      label: 'fromEmail → toEmail',
    },
    
    // Connect condition fromDisplayName to sendingMail toDisplayName (data flow - inverted)
    {
      id: `edge-6-${flowId}`,
      source: conditionNode.id,
      target: sendingMailNode.id,
      sourceHandle: 'attr-fromDisplayName',
      targetHandle: 'attr-toDisplayName',
      type: 'default',
      data: { isExecutionLink: false },
      style: { stroke: '#3498db', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#3498db' },
      label: 'fromDisplayName → toDisplayName',
    },
    
    // Connect sendingMail to end (execution flow)
    {
      id: `edge-7-${flowId}`,
      source: sendingMailNode.id,
      target: endNode.id,
      sourceHandle: 'execution',
      targetHandle: 'execution',
      type: 'smoothstep',
      data: { isExecutionLink: true },
      style: { stroke: '#555', strokeWidth: 2.5 },
      markerEnd: { type: 'arrowclosed', color: '#555' },
    },
  ];
  
  return {
    nodes: [conditionNode, aiNode, mailBodyNode, sendingMailNode, endNode],
    edges,
  };
}

/**
 * Generate a flow for appointment scheduling with account verification
 * 
 * @returns {Object} - The generated flow data
 */
function generateAppointmentWithAccountCheckFlow() {
  // Generate a unique ID for this flow
  const flowId = Date.now();
  
  // Create nodes with specific positions to match the desired layout
  const conditionNode = {
    id: `condition-node-${flowId}`,
    type: 'conditionNode',
    position: { x: 100, y: 100 },
    data: {
      conditionText: 'Email contient "rendez-vous" ou "appointment"',
      returnText: 'Demande de rendez-vous détectée',
      isStartingPoint: true,
      emailAttributes: {
        email_id: 'email-123',
        fromEmail: 'client@example.com',
        fromDisplayName: 'Client',
        toEmail: 'appointments@company.com',
        toDisplayName: 'Service Rendez-vous',
        subject: 'Demande de rendez-vous',
        date: new Date().toISOString(),
        content: 'Je souhaiterais prendre rendez-vous...',
        attachments: [],
        cc: [],
        bcc: [],
      },
    },
  };
  
  // API Node to check if user has an account
  const checkAccountApiNode = {
    id: `check-account-api-${flowId}`,
    type: 'apiNode',
    position: { x: 400, y: 100 },
    data: {
      label: 'Vérifier compte utilisateur',
      method: 'GET',
      endpoint: '/api/users/check',
      parameters: [
        { name: 'email', value: '', type: 'string' }
      ],
      headers: [
        { name: 'Content-Type', value: 'application/json' }
      ],
      responseMapping: [
        { source: 'data.exists', target: 'exists' },
        { source: 'data.userId', target: 'userId' }
      ]
    },
  };
  
  // Conditional node to branch based on account existence
  const accountExistsNode = {
    id: `account-exists-${flowId}`,
    type: 'switchNode',
    position: { x: 700, y: 100 },
    data: {
      label: 'Compte existe?',
      field: 'exists',
      cases: [
        { value: 'true', label: 'Oui' },
        { value: 'false', label: 'Non' }
      ],
      defaultCase: 'false'
    },
  };
  
  // API Node to create a new account
  const createAccountApiNode = {
    id: `create-account-api-${flowId}`,
    type: 'apiNode',
    position: { x: 700, y: 300 },
    data: {
      label: 'Créer compte utilisateur',
      method: 'POST',
      endpoint: '/api/users',
      parameters: [],
      body: {
        email: '',
        name: '',
        source: 'appointment_request'
      },
      headers: [
        { name: 'Content-Type', value: 'application/json' }
      ],
      responseMapping: [
        { source: 'data.userId', target: 'userId' },
        { source: 'data.success', target: 'accountCreated' }
      ]
    },
  };
  
  // Mail body for existing account
  const existingAccountMailBody = {
    id: `existing-mail-body-${flowId}`,
    type: 'mailBodyNode',
    position: { x: 1000, y: 50 },
    data: {
      content: 'Bonjour $recipient_name,\n\nNous confirmons votre demande de rendez-vous. Vous pouvez vous connecter à votre compte existant pour voir les détails.\n\nCordialement,\nL\'équipe des rendez-vous'
    },
  };
  
  // Mail body for new account
  const newAccountMailBody = {
    id: `new-mail-body-${flowId}`,
    type: 'mailBodyNode',
    position: { x: 1000, y: 300 },
    data: {
      content: 'Bonjour $recipient_name,\n\nNous confirmons votre demande de rendez-vous. Un compte a été créé pour vous avec votre adresse email.\n\nVous pouvez définir votre mot de passe en cliquant sur le lien suivant: $reset_password_link\n\nCordialement,\nL\'équipe des rendez-vous'
    },
  };
  
  // Send email node for existing account
  const existingAccountSendMail = {
    id: `existing-send-mail-${flowId}`,
    type: 'sendingMailNode',
    position: { x: 1300, y: 50 },
    data: {
      emailAttributes: {
        account_id: '',
        fromEmail: 'appointments@company.com',
        fromDisplayName: 'Service Rendez-vous',
        toEmail: '',
        toDisplayName: '',
        subject: 'Confirmation de rendez-vous',
        content: '',
        reply_to: '',
        cc: [],
        bcc: [],
        custom_headers: [],
      },
    },
  };
  
  // Send email node for new account
  const newAccountSendMail = {
    id: `new-send-mail-${flowId}`,
    type: 'sendingMailNode',
    position: { x: 1300, y: 300 },
    data: {
      emailAttributes: {
        account_id: '',
        fromEmail: 'appointments@company.com',
        fromDisplayName: 'Service Rendez-vous',
        toEmail: '',
        toDisplayName: '',
        subject: 'Confirmation de rendez-vous et création de compte',
        content: '',
        reply_to: '',
        cc: [],
        bcc: [],
        custom_headers: [],
      },
    },
  };
  
  // End node for existing account path
  const existingAccountEndNode = {
    id: `existing-end-${flowId}`,
    type: 'endNode',
    position: { x: 1600, y: 50 },
    data: {},
  };
  
  // End node for new account path
  const newAccountEndNode = {
    id: `new-end-${flowId}`,
    type: 'endNode',
    position: { x: 1600, y: 300 },
    data: {},
  };
  
  // Create edges
  const edges = [
    // Connect condition to check account API (execution flow)
    {
      id: `edge-1-${flowId}`,
      source: conditionNode.id,
      target: checkAccountApiNode.id,
      sourceHandle: 'execution',
      targetHandle: 'execution',
      type: 'smoothstep',
      data: { isExecutionLink: true },
      style: { stroke: '#555', strokeWidth: 2.5 },
      markerEnd: { type: 'arrowclosed', color: '#555' },
    },
    
    // Connect condition fromEmail to check account API email parameter (data flow)
    {
      id: `edge-2-${flowId}`,
      source: conditionNode.id,
      target: checkAccountApiNode.id,
      sourceHandle: 'attr-fromEmail',
      targetHandle: 'param-email',
      type: 'default',
      data: { isExecutionLink: false },
      style: { stroke: '#3498db', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#3498db' },
      label: 'fromEmail → email',
    },
    
    // Connect check account API to switch node (execution flow)
    {
      id: `edge-3-${flowId}`,
      source: checkAccountApiNode.id,
      target: accountExistsNode.id,
      sourceHandle: 'execution',
      targetHandle: 'execution',
      type: 'smoothstep',
      data: { isExecutionLink: true },
      style: { stroke: '#555', strokeWidth: 2.5 },
      markerEnd: { type: 'arrowclosed', color: '#555' },
    },
    
    // Connect check account API result to switch node input (data flow)
    {
      id: `edge-4-${flowId}`,
      source: checkAccountApiNode.id,
      target: accountExistsNode.id,
      sourceHandle: 'attr-exists',
      targetHandle: 'attr-field',
      type: 'default',
      data: { isExecutionLink: false },
      style: { stroke: '#3498db', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#3498db' },
      label: 'exists → field',
    },
    
    // Connect switch node "true" case to existing account mail body (execution flow)
    {
      id: `edge-5-${flowId}`,
      source: accountExistsNode.id,
      target: existingAccountMailBody.id,
      sourceHandle: 'case-true',
      targetHandle: 'execution',
      type: 'smoothstep',
      data: { isExecutionLink: true },
      style: { stroke: '#555', strokeWidth: 2.5 },
      markerEnd: { type: 'arrowclosed', color: '#555' },
      label: 'Oui',
    },
    
    // Connect switch node "false" case to create account API (execution flow)
    {
      id: `edge-6-${flowId}`,
      source: accountExistsNode.id,
      target: createAccountApiNode.id,
      sourceHandle: 'case-false',
      targetHandle: 'execution',
      type: 'smoothstep',
      data: { isExecutionLink: true },
      style: { stroke: '#555', strokeWidth: 2.5 },
      markerEnd: { type: 'arrowclosed', color: '#555' },
      label: 'Non',
    },
    
    // Connect condition fromEmail to create account API email field (data flow)
    {
      id: `edge-7-${flowId}`,
      source: conditionNode.id,
      target: createAccountApiNode.id,
      sourceHandle: 'attr-fromEmail',
      targetHandle: 'body-email',
      type: 'default',
      data: { isExecutionLink: false },
      style: { stroke: '#3498db', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#3498db' },
      label: 'fromEmail → email',
    },
    
    // Connect condition fromDisplayName to create account API name field (data flow)
    {
      id: `edge-8-${flowId}`,
      source: conditionNode.id,
      target: createAccountApiNode.id,
      sourceHandle: 'attr-fromDisplayName',
      targetHandle: 'body-name',
      type: 'default',
      data: { isExecutionLink: false },
      style: { stroke: '#3498db', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#3498db' },
      label: 'fromDisplayName → name',
    },
    
    // Connect create account API to new account mail body (execution flow)
    {
      id: `edge-9-${flowId}`,
      source: createAccountApiNode.id,
      target: newAccountMailBody.id,
      sourceHandle: 'execution',
      targetHandle: 'execution',
      type: 'smoothstep',
      data: { isExecutionLink: true },
      style: { stroke: '#555', strokeWidth: 2.5 },
      markerEnd: { type: 'arrowclosed', color: '#555' },
    },
    
    // Connect existing account mail body to existing account send mail (execution flow)
    {
      id: `edge-10-${flowId}`,
      source: existingAccountMailBody.id,
      target: existingAccountSendMail.id,
      sourceHandle: 'execution',
      targetHandle: 'execution',
      type: 'smoothstep',
      data: { isExecutionLink: true },
      style: { stroke: '#555', strokeWidth: 2.5 },
      markerEnd: { type: 'arrowclosed', color: '#555' },
    },
    
    // Connect existing account mail body content to existing account send mail content (data flow)
    {
      id: `edge-11-${flowId}`,
      source: existingAccountMailBody.id,
      target: existingAccountSendMail.id,
      sourceHandle: 'attr-content',
      targetHandle: 'attr-content',
      type: 'default',
      data: { isExecutionLink: false },
      style: { stroke: '#3498db', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#3498db' },
      label: 'content → content',
    },
    
    // Connect condition fromEmail to existing account send mail toEmail (data flow)
    {
      id: `edge-12-${flowId}`,
      source: conditionNode.id,
      target: existingAccountSendMail.id,
      sourceHandle: 'attr-fromEmail',
      targetHandle: 'attr-toEmail',
      type: 'default',
      data: { isExecutionLink: false },
      style: { stroke: '#3498db', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#3498db' },
      label: 'fromEmail → toEmail',
    },
    
    // Connect condition fromDisplayName to existing account send mail toDisplayName (data flow)
    {
      id: `edge-13-${flowId}`,
      source: conditionNode.id,
      target: existingAccountSendMail.id,
      sourceHandle: 'attr-fromDisplayName',
      targetHandle: 'attr-toDisplayName',
      type: 'default',
      data: { isExecutionLink: false },
      style: { stroke: '#3498db', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#3498db' },
      label: 'fromDisplayName → toDisplayName',
    },
    
    // Connect new account mail body to new account send mail (execution flow)
    {
      id: `edge-14-${flowId}`,
      source: newAccountMailBody.id,
      target: newAccountSendMail.id,
      sourceHandle: 'execution',
      targetHandle: 'execution',
      type: 'smoothstep',
      data: { isExecutionLink: true },
      style: { stroke: '#555', strokeWidth: 2.5 },
      markerEnd: { type: 'arrowclosed', color: '#555' },
    },
    
    // Connect new account mail body content to new account send mail content (data flow)
    {
      id: `edge-15-${flowId}`,
      source: newAccountMailBody.id,
      target: newAccountSendMail.id,
      sourceHandle: 'attr-content',
      targetHandle: 'attr-content',
      type: 'default',
      data: { isExecutionLink: false },
      style: { stroke: '#3498db', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#3498db' },
      label: 'content → content',
    },
    
    // Connect condition fromEmail to new account send mail toEmail (data flow)
    {
      id: `edge-16-${flowId}`,
      source: conditionNode.id,
      target: newAccountSendMail.id,
      sourceHandle: 'attr-fromEmail',
      targetHandle: 'attr-toEmail',
      type: 'default',
      data: { isExecutionLink: false },
      style: { stroke: '#3498db', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#3498db' },
      label: 'fromEmail → toEmail',
    },
    
    // Connect condition fromDisplayName to new account send mail toDisplayName (data flow)
    {
      id: `edge-17-${flowId}`,
      source: conditionNode.id,
      target: newAccountSendMail.id,
      sourceHandle: 'attr-fromDisplayName',
      targetHandle: 'attr-toDisplayName',
      type: 'default',
      data: { isExecutionLink: false },
      style: { stroke: '#3498db', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#3498db' },
      label: 'fromDisplayName → toDisplayName',
    },
    
    // Connect existing account send mail to existing account end node (execution flow)
    {
      id: `edge-18-${flowId}`,
      source: existingAccountSendMail.id,
      target: existingAccountEndNode.id,
      sourceHandle: 'execution',
      targetHandle: 'execution',
      type: 'smoothstep',
      data: { isExecutionLink: true },
      style: { stroke: '#555', strokeWidth: 2.5 },
      markerEnd: { type: 'arrowclosed', color: '#555' },
    },
    
    // Connect new account send mail to new account end node (execution flow)
    {
      id: `edge-19-${flowId}`,
      source: newAccountSendMail.id,
      target: newAccountEndNode.id,
      sourceHandle: 'execution',
      targetHandle: 'execution',
      type: 'smoothstep',
      data: { isExecutionLink: true },
      style: { stroke: '#555', strokeWidth: 2.5 },
      markerEnd: { type: 'arrowclosed', color: '#555' },
    },
  ];
  
  return {
    nodes: [
      conditionNode, 
      checkAccountApiNode, 
      accountExistsNode, 
      createAccountApiNode, 
      existingAccountMailBody, 
      newAccountMailBody, 
      existingAccountSendMail, 
      newAccountSendMail, 
      existingAccountEndNode, 
      newAccountEndNode
    ],
    edges,
  };
}

/**
 * Generate a default flow based on a prompt
 * 
 * @param {string} prompt - The natural language description of the flow
 * @returns {Object} - The generated flow data
 */
function generateDefaultFlow(prompt) {
  // Generate a unique ID for this flow
  const flowId = Date.now();
  
  // Create a simple flow with a condition node, text node, and end node
  const conditionNode = {
    id: `condition-node-${flowId}`,
    type: 'conditionNode',
    position: { x: 0, y: 0 },
    data: {
      conditionText: 'Condition basée sur la description: ' + prompt.substring(0, 50) + '...',
      returnText: 'Condition remplie',
      isStartingPoint: true,
      emailAttributes: {
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
      },
    },
  };
  
  const textNode = {
    id: `text-node-${flowId}`,
    type: 'textNode',
    position: { x: 0, y: 0 },
    data: {
      text: 'Flux généré à partir de la description: ' + prompt,
    },
  };
  
  const endNode = {
    id: `end-node-${flowId}`,
    type: 'endNode',
    position: { x: 0, y: 0 },
    data: {},
  };
  
  // Create edges
  const edges = [
    {
      id: `edge-1-${flowId}`,
      source: conditionNode.id,
      target: textNode.id,
      sourceHandle: 'execution',
      targetHandle: 'execution',
    },
    {
      id: `edge-2-${flowId}`,
      source: textNode.id,
      target: endNode.id,
      sourceHandle: 'execution',
      targetHandle: 'execution',
    },
  ];
  
  return {
    nodes: [conditionNode, textNode, endNode],
    edges,
  };
}
