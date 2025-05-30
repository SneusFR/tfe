import { motion } from 'framer-motion';
import { 
  AccountTree as ConditionalFlowIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { 
  Badge,
  TextField,
  Chip
} from '@mui/material';

const ConditionalFlowTab = ({ 
  conditionalFlowSearchTerm, 
  onConditionalFlowSearchChange, 
  canEdit 
}) => {
  const conditionalFlowNodes = [
    {
      id: 'conditionalFlowNode',
      type: 'conditionalFlowNode',
      label: 'CONDITION',
      title: 'Conditional Flow',
      description: 'Create conditional paths with various comparison operators (equals, contains, greater than, etc.)',
      color: '#FF9800'
    },
    {
      id: 'switchNode',
      type: 'switchNode',
      label: 'SWITCH',
      title: 'Switch Flow',
      description: 'Create multiple execution paths based on case matching (similar to switch/case statements)',
      color: '#9C27B0'
    },
    {
      id: 'logicalOperatorNode',
      type: 'logicalOperatorNode',
      label: 'LOGIC',
      title: 'Logical Operator',
      description: 'Combine multiple boolean inputs with logical operators (AND, OR, XOR, etc.)',
      color: '#00BCD4'
    }
  ];

  const filteredNodes = conditionalFlowNodes.filter(node =>
    node.title.toLowerCase().includes(conditionalFlowSearchTerm.toLowerCase()) ||
    node.description.toLowerCase().includes(conditionalFlowSearchTerm.toLowerCase())
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
        <h3>Conditional Flow Nodes</h3>
        <Badge badgeContent={3} color="primary" max={99}>
          <ConditionalFlowIcon />
        </Badge>
      </div>
      
      {/* Search conditional flow nodes */}
      <div className="task-filters">
        <TextField
          size="small"
          placeholder="Search nodes..."
          value={conditionalFlowSearchTerm}
          onChange={(e) => onConditionalFlowSearchChange(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
          fullWidth
        />
      </div>

      {/* Conditional Flow Nodes list */}
      <div className="task-groups">
        <div className="task-group">
          <div className="group-header">
            <div className="group-title">
              <ConditionalFlowIcon />
              <span>CONDITIONAL FLOW NODES ({filteredNodes.length})</span>
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

        {filteredNodes.length === 0 && conditionalFlowSearchTerm && (
          <div className="empty-group">
            No conditional flow nodes match your search
          </div>
        )}
      </div>
    </div>
  );
};

export default ConditionalFlowTab;
