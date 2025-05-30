import { 
  Search as SearchIcon
} from '@mui/icons-material';
import { 
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { TASK_STATUS, TASK_PRIORITY } from './constants';

const TaskFilters = ({ 
  searchTerm, 
  onSearchChange, 
  statusFilter, 
  onStatusFilterChange, 
  priorityFilter, 
  onPriorityFilterChange 
}) => {
  return (
    <div className="task-filters">
      <TextField
        size="small"
        placeholder="Search tasks..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
        }}
        sx={{ mb: 2 }}
        fullWidth
      />
      
      <div className="filter-row">
        <FormControl size="small" sx={{ minWidth: 100, mr: 1 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            label="Status"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value={TASK_STATUS.PENDING}>Pending</MenuItem>
            <MenuItem value={TASK_STATUS.IN_PROGRESS}>In Progress</MenuItem>
            <MenuItem value={TASK_STATUS.COMPLETED}>Completed</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Priority</InputLabel>
          <Select
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value)}
            label="Priority"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value={TASK_PRIORITY.URGENT}>Urgent</MenuItem>
            <MenuItem value={TASK_PRIORITY.HIGH}>High</MenuItem>
            <MenuItem value={TASK_PRIORITY.MEDIUM}>Medium</MenuItem>
            <MenuItem value={TASK_PRIORITY.LOW}>Low</MenuItem>
          </Select>
        </FormControl>
      </div>
    </div>
  );
};

export default TaskFilters;
