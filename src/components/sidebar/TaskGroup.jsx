import { motion, AnimatePresence } from 'framer-motion';
import { 
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon
} from '@mui/icons-material';
import { Badge } from '@mui/material';
import { getStatusIcon } from './utils';
import TaskItem from './TaskItem';

const TaskGroup = ({ 
  groupName, 
  tasks, 
  isExpanded, 
  onToggle, 
  selectedTaskId,
  onTaskSelect,
  onTaskAction,
  canEdit 
}) => {
  const StatusIcon = getStatusIcon(groupName);

  return (
    <div className="task-group">
      <div 
        className="group-header"
        onClick={() => onToggle(groupName)}
      >
        <div className="group-title">
          <StatusIcon />
          <span>{groupName.replace('_', ' ').toUpperCase()}</span>
          <Badge badgeContent={tasks.length} color="primary" />
        </div>
        {isExpanded ? <ArrowUpIcon /> : <ArrowDownIcon />}
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="task-list"
          >
            {tasks.length === 0 ? (
              <div className="empty-group">No tasks</div>
            ) : (
              tasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isSelected={selectedTaskId === task.id}
                  onSelect={onTaskSelect}
                  onTaskAction={onTaskAction}
                  canEdit={canEdit}
                />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskGroup;
