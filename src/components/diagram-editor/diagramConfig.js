// Connection colors and styles
export const EXECUTION_LINK_COLOR = '#555'; // Gray for execution links
export const DATA_LINK_COLOR = '#3498db';    // Blue for data links

export const EXECUTION_LINK_STYLE = {
  strokeWidth: 3,
  stroke: '#4CAF50', // Always green for execution links
  strokeDasharray: '0',
  opacity: 1,
};

export const DATA_LINK_STYLE = {
  strokeWidth: 2,
  stroke: DATA_LINK_COLOR,
  opacity: 0.8,
};

// Node types configuration
import ApiNode from '../../nodes/miscnodes/ApiNode.jsx';
import ConditionNode from '../../nodes/conditionnalnodes/ConditionNode.jsx';
import ConditionalFlowNode from '../../nodes/conditionnalnodes/ConditionalFlowNode.jsx';
import SwitchNode from '../../nodes/conditionnalnodes/SwitchNode.jsx';
import LogicalOperatorNode from '../../nodes/conditionnalnodes/LogicalOperatorNode.jsx';
import SendingMailNode from '../../nodes/mailnodes/SendingMailNode.jsx';
import EmailAttachmentNode from '../../nodes/mailnodes/EmailAttachmentNode.jsx';
import TextNode from '../../nodes/inputnodes/TextNode.jsx';
import IntNode from '../../nodes/inputnodes/IntNode.jsx';
import BooleanNode from '../../nodes/inputnodes/BooleanNode.jsx';
import TokenNode from '../../nodes/inputnodes/TokenNode.jsx';
import Base64Node from '../../nodes/inputnodes/Base64Node.jsx';
import OcrNode from '../../nodes/mailnodes/OcrNode.jsx';
import ConsoleLogNode from '../../nodes/miscnodes/ConsoleLogNode.jsx';
import AINode from '../../nodes/ainodes/AINode.jsx';
import MailBodyNode from '../../nodes/mailnodes/MailBodyNode.jsx';
import EndNode from '../../nodes/miscnodes/EndNode.jsx';
import SubFlowNode from '../../nodes/miscnodes/SubFlowNode.jsx';

export const nodeTypes = {
  apiNode: ApiNode,
  conditionNode: ConditionNode,
  conditionalFlowNode: ConditionalFlowNode,
  switchNode: SwitchNode,
  logicalOperatorNode: LogicalOperatorNode,
  sendingMailNode: SendingMailNode,
  emailAttachmentNode: EmailAttachmentNode,
  textNode: TextNode,
  intNode: IntNode,
  booleanNode: BooleanNode,
  tokenNode: TokenNode,
  base64Node: Base64Node,
  ocrNode: OcrNode,
  consoleLogNode: ConsoleLogNode,
  aiNode: AINode,
  mailBodyNode: MailBodyNode,
  endNode: EndNode,
  subFlowNode: SubFlowNode,
};

// Define edge types
export const edgeTypes = Object.freeze({});
