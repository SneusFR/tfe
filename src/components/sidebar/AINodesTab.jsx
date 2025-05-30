import { motion } from 'framer-motion';
import { 
  Psychology as AIIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { 
  Badge,
  TextField,
  Chip
} from '@mui/material';

const AINodesTab = ({ 
  aiNodesSearchTerm, 
  onAINodesSearchChange, 
  canEdit 
}) => {
  const aiNodes = [
    {
      id: 'aiNode',
      type: 'aiNode',
      label: 'AI PROCESSING',
      title: 'AI Processing',
      description: 'Process text with AI using customizable prompts and inputs',
      color: '#673AB7'
    }
  ];

  const filteredNodes = aiNodes.filter(node =>
    node.title.toLowerCase().includes(aiNodesSearchTerm.toLowerCase()) ||
    node.description.toLowerCase().includes(aiNodesSearchTerm.toLowerCase())
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
        <h3>AI Nodes</h3>
        <Badge badgeContent={1} color="primary" max={99}>
          <AIIcon />
        </Badge>
      </div>
      
      {/* Search AI nodes */}
      <div className="task-filters">
        <TextField
          size="small"
          placeholder="Search AI nodes..."
          value={aiNodesSearchTerm}
          onChange={(e) => onAINodesSearchChange(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
          fullWidth
        />
      </div>

      {/* AI Nodes list */}
      <div className="task-groups">
        <div className="task-group">
          <div className="group-header">
            <div className="group-title">
              <AIIcon />
              <span>AI NODES ({filteredNodes.length})</span>
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

        {filteredNodes.length === 0 && aiNodesSearchTerm && (
          <div className="empty-group">
            No AI nodes match your search
          </div>
        )}
      </div>
    </div>
  );
};

export default AINodesTab;
