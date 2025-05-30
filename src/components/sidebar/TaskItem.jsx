import { motion } from 'framer-motion';
import { 
  PlayArrow as PlayIcon,
  Check as CheckIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { 
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { getPriorityColor } from './utils';
import { TASK_STATUS } from './constants';

const TaskItem = ({ 
  task, 
  isSelected, 
  onSelect, 
  onTaskAction, 
  canEdit 
}) => {
  return (
    <motion.div
      className={`task-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(task.id)}
      whileHover={{ x: 3 }}
      layout
    >
      <div className="task-main">
        <div className="task-header">
          <Chip 
            label={task.type} 
            size="small" 
            variant="outlined"
            sx={{ fontSize: '10px', height: '20px' }}
          />
          {task.priority && (
            <Chip
              label={task.priority}
              size="small"
              sx={{ 
                fontSize: '10px', 
                height: '20px',
                backgroundColor: getPriorityColor(task.priority),
                color: 'white'
              }}
            />
          )}
        </div>
        <div className="task-description">
          {task.description}
        </div>
      </div>
      
      <div className="task-actions">
        <Tooltip title="Run task">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onTaskAction(task.id, 'run');
            }}
            disabled={task.status === TASK_STATUS.COMPLETED}
          >
            <PlayIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Mark as completed">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onTaskAction(task.id, 'complete');
            }}
            disabled={task.status === TASK_STATUS.COMPLETED || !canEdit}
          >
            <CheckIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Delete task">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onTaskAction(task.id, 'delete');
            }}
            disabled={!canEdit}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
    </motion.div>
  );
};

export default TaskItem;
