import { nanoid } from 'nanoid';

/**
 * @param {string} type
 * @param {{x:number,y:number}} position
 * @param {object} extra  Données spécifiques au type (facultatif)
 * @returns {import('reactflow').Node}
 */
export function createNode(type, position, extra = {}) {
  const id = `${type}-${nanoid(8)}`;

  switch (type) {
    case 'textNode':
      return {
        id, type, position,
        data: { text: 'Enter text here...', ...extra },
      };

    case 'intNode':
      return {
        id, type, position,
        data: { value: 0, ...extra },
      };

    case 'sendingMailNode':
      return {
        id, type, position,
        data: {
          emailAttributes: {
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
            ...extra.emailAttributes,
          },
        },
      };

    case 'emailAttachmentNode':
      return {
        id, type, position,
        data: {
          emailAttributes: {
            account_id: '',
            email_id: '',
            attachment_id: '',
            ...extra.emailAttributes,
          },
        },
      };

    case 'ocrNode':
      return {
        id, type, position,
        data: {
          ocrAttributes: {
            attachment_data: null,
            language: 'auto',
            enhance_image: false,
            ...extra.ocrAttributes,
          },
        },
      };

    case 'consoleLogNode':
      return {
        id, type, position,
        data: { ...extra },
      };

    case 'aiNode':
      return {
        id, type, position,
        data: {
          prompt: 'Enter your prompt here...',
          input: '',
          output: '',
          ...extra,
        },
      };

    case 'conditionalFlowNode':
      return {
        id, type, position,
        data: {
          conditionType: 'equals',
          value: '',
          inputValue: '',
          ...extra,
        },
      };

    case 'switchNode':
      return {
        id, type, position,
        data: {
          cases: [
            { id: '1', value: '', label: 'Case 1' },
            { id: '2', value: '', label: 'Case 2' }
          ],
          ...extra,
        },
      };

    case 'logicalOperatorNode':
      return {
        id, type, position,
        data: {
          operatorType: 'AND',
          inputCount: 2,
          ...extra,
        },
      };

    case 'booleanNode':
      return {
        id, type, position,
        data: {
          value: false,
          ...extra,
        },
      };

    case 'tokenNode':
      return {
        id, type, position,
        data: {
          token: '',
          ...extra,
        },
      };

    case 'base64Node':
      return {
        id, type, position,
        data: { ...extra },
      };

    case 'mailBodyNode':
      return {
        id, type, position,
        data: {
          content: '',
          ...extra,
        },
      };

    case 'endNode':
      return {
        id, type, position,
        data: { ...extra },
      };

    case 'conditionNode':
      return {
        id, type, position,
        data: {
          conditionText: extra.conditionText || '',
          returnText: extra.returnText || '',
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
            ...extra.emailAttributes,
          },
        },
      };

    case 'apiNode':
      return {
        id, type, position,
        data: { ...extra },
      };

    default:
      throw new Error(`Unknown node type: ${type}`);
  }
}
