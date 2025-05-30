import { motion } from 'framer-motion';
import { 
  Search as SearchIcon,
  Stop as StopIcon
} from '@mui/icons-material';
import { 
  Badge,
  TextField,
  Chip
} from '@mui/material';

const MiscNodesTab = ({ 
  miscNodesSearchTerm, 
  onMiscNodesSearchChange, 
  canEdit 
}) => {
  const miscNodes = [
    {
      id: 'endNode',
      type: 'endNode',
      label: 'END',
      title: 'End Node',
      description: 'Marks the end of a flow or process execution',
      color: '#F44336'
    },
    {
      id: 'consoleLogNode',
      type: 'consoleLogNode',
      label: 'DEBUG',
      title: 'Console Log',
      description: 'Debug and log values to the console for troubleshooting',
      color: '#FF9800'
    }
  ];

  const filteredNodes = miscNodes.filter(node =>
    node.title.toLowerCase().includes(miscNodesSearchTerm.toLowerCase()) ||
    node.description.toLowerCase().includes(miscNodesSearchTerm.toLowerCase())
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
        <h3>Misc Nodes</h3>
        <Badge badgeContent={2} color="primary" max={99}>
          <StopIcon />
        </Badge>
      </div>
      
      {/* Search misc nodes */}
      <div className="task-filters">
        <TextField
          size="small"
          placeholder="Search misc nodes..."
          value={miscNodesSearchTerm}
          onChange={(e) => onMiscNodesSearchChange(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
          fullWidth
        />
      </div>

      {/* Misc Nodes list */}
      <div className="task-groups">
        <div className="task-group">
          <div className="group-header">
            <div className="group-title">
              <StopIcon />
              <span>MISC NODES ({filteredNodes.length})</span>
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

        {filteredNodes.length === 0 && miscNodesSearchTerm && (
          <div className="empty-group">
            No misc nodes match your search
          </div>
        )}
      </div>
    </div>
  );
};

export default MiscNodesTab;
