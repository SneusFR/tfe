import { motion } from 'framer-motion';
import { 
  Delete as DeleteIcon
} from '@mui/icons-material';
import { 
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';

const ConditionItem = ({ 
  condition, 
  onDelete, 
  canEdit,
  isDraggable = false,
  chipLabel = "Mail Condition",
  chipColor = undefined,
  borderColor = undefined
}) => {
  const handleDragStart = (e) => {
    if (!canEdit || !isDraggable) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('application/conditionId', condition.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const itemStyle = {
    cursor: canEdit && isDraggable ? 'grab' : 'default',
    ...(borderColor && { borderLeft: `3px solid ${borderColor}` })
  };

  const chipStyle = chipColor ? {
    fontSize: '10px', 
    height: '20px', 
    backgroundColor: chipColor, 
    color: 'white'
  } : {
    fontSize: '10px', 
    height: '20px'
  };

  return (
    <motion.div
      className="task-item"
      draggable={isDraggable}
      onDragStart={handleDragStart}
      whileHover={{ x: 3 }}
      layout
      style={itemStyle}
    >
      <div className="task-main">
        <div className="task-header">
          <Chip 
            label={chipLabel}
            size="small" 
            variant={chipColor ? "filled" : "outlined"}
            sx={chipStyle}
          />
        </div>
        <div className="task-description">
          <strong>If:</strong> {condition.conditionText}
        </div>
        <div className="task-description" style={{ marginTop: '4px', fontStyle: 'italic' }}>
          <strong>Then:</strong> {condition.returnText}
        </div>
        {condition.createdAt && (
          <div className="task-description" style={{ marginTop: '4px', fontSize: '11px', color: '#999' }}>
            Created: {new Date(condition.createdAt).toLocaleDateString()}
          </div>
        )}
      </div>
      
      {onDelete && (
        <div className="task-actions">
          <Tooltip title="Delete condition">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(condition.id);
              }}
              disabled={!canEdit}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      )}
    </motion.div>
  );
};

export default ConditionItem;
