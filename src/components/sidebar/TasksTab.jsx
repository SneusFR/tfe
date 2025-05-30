import { 
  Assignment as TaskIcon,
  PlaylistPlay as PlaylistPlayIcon
} from '@mui/icons-material';
import { 
  Badge,
  IconButton,
  Tooltip
} from '@mui/material';
import TaskFilters from './TaskFilters';
import TaskGroup from './TaskGroup';
import { filterTasks, groupTasksByStatus } from './utils';
import { TASK_STATUS } from './constants';

const TasksTab = ({ 
  tasks, 
  loading, 
  error, 
  searchTerm, 
  onSearchChange, 
  statusFilter, 
  onStatusFilterChange, 
  priorityFilter, 
  onPriorityFilterChange, 
  expandedGroups, 
  onToggleGroup, 
  selectedTaskId, 
  onTaskSelect, 
  onTaskAction, 
  onExecuteAllPendingTasks, 
  isExecutingAll, 
  canEdit 
}) => {
  const filteredTasks = filterTasks(tasks, searchTerm, statusFilter, priorityFilter);
  const groupedTasks = groupTasksByStatus(filteredTasks);
  const totalPendingTasks = tasks.filter(t => t.status !== TASK_STATUS.COMPLETED).length;

  return (
    <div className="tab-content">
      <div className="section-header">
        <h3>Tasks</h3>
        <Badge badgeContent={totalPendingTasks} color="error" max={99}>
          <TaskIcon />
        </Badge>
      </div>
      
      {/* Search and filters */}
      <TaskFilters
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={onPriorityFilterChange}
      />
      
      {/* Execute all pending tasks button */}
      {groupedTasks.pending.length > 0 && (
        <div className="bulk-actions" style={{ marginTop: '12px', marginBottom: '8px' }}>
          <Tooltip title={`Execute all ${groupedTasks.pending.length} pending tasks in sequence`}>
            <IconButton
              onClick={onExecuteAllPendingTasks}
              disabled={!canEdit || isExecutingAll}
              sx={{
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                '&:disabled': {
                  backgroundColor: 'action.disabled',
                  color: 'action.disabled',
                },
                width: '100%',
                borderRadius: 1,
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 'medium'
              }}
            >
              <PlaylistPlayIcon sx={{ mr: 1 }} />
              {isExecutingAll ? 'Executing...' : `Execute All Pending (${groupedTasks.pending.length})`}
            </IconButton>
          </Tooltip>
        </div>
      )}

      {/* Task groups */}
      <div className="task-groups">
        {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
          <TaskGroup
            key={groupName}
            groupName={groupName}
            tasks={groupTasks}
            isExpanded={expandedGroups[groupName]}
            onToggle={onToggleGroup}
            selectedTaskId={selectedTaskId}
            onTaskSelect={onTaskSelect}
            onTaskAction={onTaskAction}
            canEdit={canEdit}
          />
        ))}
      </div>

      {loading && (
        <div className="loading-state">
          Loading tasks...
        </div>
      )}

      {error && (
        <div className="error-state">
          {error}
        </div>
      )}
    </div>
  );
};

export default TasksTab;
