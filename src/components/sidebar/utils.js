import { TASK_PRIORITY, TASK_STATUS } from './constants';
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Circle as CircleIcon
} from '@mui/icons-material';

export const getPriorityColor = (priority) => {
  switch (priority) {
    case TASK_PRIORITY.URGENT: return '#f44336';
    case TASK_PRIORITY.HIGH: return '#ff9800';
    case TASK_PRIORITY.MEDIUM: return '#2196f3';
    case TASK_PRIORITY.LOW: return '#4caf50';
    default: return '#9e9e9e';
  }
};

export const getStatusIcon = (status) => {
  switch (status) {
    case TASK_STATUS.COMPLETED: return CheckCircleIcon;
    case TASK_STATUS.IN_PROGRESS: return ScheduleIcon;
    default: return CircleIcon;
  }
};

export const filterTasks = (tasks, searchTerm, statusFilter, priorityFilter) => {
  return tasks.filter(task => {
    const matchesSearch = task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });
};

export const groupTasksByStatus = (tasks) => {
  return {
    pending: tasks.filter(t => t.status === TASK_STATUS.PENDING),
    in_progress: tasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS),
    completed: tasks.filter(t => t.status === TASK_STATUS.COMPLETED)
  };
};

export const filterConditions = (conditions, searchTerm) => {
  return conditions.filter(condition => {
    const matchesSearch = condition.conditionText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         condition.returnText?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });
};
