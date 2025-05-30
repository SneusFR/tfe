import { motion } from 'framer-motion';
import { 
  Input as InputIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { 
  Badge,
  TextField,
  Chip
} from '@mui/material';

const InputNodesTab = ({ 
  inputNodesSearchTerm, 
  onInputNodesSearchChange, 
  canEdit 
}) => {
  const inputNodes = [
    {
      id: 'textNode',
      type: 'textNode',
      label: 'TEXT',
      title: 'Text Node',
      description: 'Add text content that can connect to colored attribute handles',
      color: '#9C27B0'
    },
    {
      id: 'intNode',
      type: 'intNode',
      label: 'INT',
      title: 'Int Node',
      description: 'Add integer values that can connect to colored attribute handles',
      color: '#2196F3'
    },
    {
      id: 'booleanNode',
      type: 'booleanNode',
      label: 'BOOLEAN',
      title: 'Boolean Node',
      description: 'Toggle switch for true/false values with output handle',
      color: '#4CAF50'
    },
    {
      id: 'tokenNode',
      type: 'tokenNode',
      label: 'TOKEN',
      title: 'Token Node',
      description: 'Securely store and transmit sensitive values with masked display',
      color: '#FF9800'
    },
    {
      id: 'base64Node',
      type: 'base64Node',
      label: 'B64',
      title: 'Base64 Encoder',
      description: 'Convert text strings to Base64 encoding for email content processing',
      color: '#FF9800'
    }
  ];

  const filteredNodes = inputNodes.filter(node =>
    node.title.toLowerCase().includes(inputNodesSearchTerm.toLowerCase()) ||
    node.description.toLowerCase().includes(inputNodesSearchTerm.toLowerCase())
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
        <h3>Input Nodes</h3>
        <Badge badgeContent={5} color="primary" max={99}>
          <InputIcon />
        </Badge>
      </div>
      
      {/* Search input nodes */}
      <div className="task-filters">
        <TextField
          size="small"
          placeholder="Search nodes..."
          value={inputNodesSearchTerm}
          onChange={(e) => onInputNodesSearchChange(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
          fullWidth
        />
      </div>

      {/* Input Nodes list */}
      <div className="task-groups">
        <div className="task-group">
          <div className="group-header">
            <div className="group-title">
              <InputIcon />
              <span>INPUT NODES ({filteredNodes.length})</span>
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

        {filteredNodes.length === 0 && inputNodesSearchTerm && (
          <div className="empty-group">
            No input nodes match your search
          </div>
        )}
      </div>
    </div>
  );
};

export default InputNodesTab;
