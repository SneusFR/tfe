import { motion } from 'framer-motion';
import { 
  Email as EmailIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { 
  Badge,
  TextField,
  Chip
} from '@mui/material';

const EmailNodesTab = ({ 
  emailNodesSearchTerm, 
  onEmailNodesSearchChange, 
  canEdit 
}) => {
  const emailNodes = [
    {
      id: 'sendingMailNode',
      type: 'sendingMailNode',
      label: 'SENDING MAIL',
      title: 'Send Email',
      description: 'Send emails using the Unipile API with customizable parameters',
      color: '#2196F3'
    },
    {
      id: 'emailAttachmentNode',
      type: 'emailAttachmentNode',
      label: 'EMAIL ATTACHMENT',
      title: 'Get Attachment',
      description: 'Retrieve email attachments using the Unipile API',
      color: '#9C27B0'
    },
    {
      id: 'ocrNode',
      type: 'ocrNode',
      label: 'OCR',
      title: 'Extract Text from Image',
      description: 'Convert image attachments to text using OCR technology',
      color: '#009688'
    },
    {
      id: 'mailBodyNode',
      type: 'mailBodyNode',
      label: 'MAIL BODY',
      title: 'Email Template',
      description: 'Create rich text email templates with dynamic variables using $variable syntax',
      color: '#FF6D00'
    }
  ];

  const filteredNodes = emailNodes.filter(node =>
    node.title.toLowerCase().includes(emailNodesSearchTerm.toLowerCase()) ||
    node.description.toLowerCase().includes(emailNodesSearchTerm.toLowerCase())
  );

  const handleDragStart = (e, nodeType) => {
    if (!canEdit) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('application/nodeType', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="tab-content">
      <div className="section-header">
        <h3>Email Nodes</h3>
        <Badge badgeContent={4} color="primary" max={99}>
          <EmailIcon />
        </Badge>
      </div>
      
      {/* Search email nodes */}
      <div className="task-filters">
        <TextField
          size="small"
          placeholder="Search email nodes..."
          value={emailNodesSearchTerm}
          onChange={(e) => onEmailNodesSearchChange(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
          fullWidth
        />
      </div>

      {/* Email Nodes list */}
      <div className="task-groups">
        <div className="task-group">
          <div className="group-header">
            <div className="group-title">
              <EmailIcon />
              <span>EMAIL NODES ({filteredNodes.length})</span>
            </div>
          </div>
          
          <div className="task-list">
            {filteredNodes.map(node => (
              <motion.div
                key={node.id}
                className="task-item"
                draggable={true}
                onDragStart={(e) => handleDragStart(e, node.type)}
                whileHover={{ x: 3 }}
                layout
                style={{ 
                  borderLeft: `3px solid ${node.color}`, 
                  cursor: canEdit ? 'grab' : 'default' 
                }}
              >
                <div className="task-main">
                  <div className="task-header">
                    <Chip 
                      label={node.label}
                      size="small" 
                      variant="outlined"
                      sx={{ 
                        fontSize: '10px', 
                        height: '20px', 
                        backgroundColor: node.color, 
                        color: 'white' 
                      }}
                    />
                  </div>
                  <div className="task-description">
                    <strong>{node.title}</strong>
                  </div>
                  <div className="task-description" style={{ marginTop: '4px', fontSize: '11px', color: '#666' }}>
                    {node.description}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {filteredNodes.length === 0 && emailNodesSearchTerm && (
          <div className="empty-group">
            No email nodes match your search
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailNodesTab;
