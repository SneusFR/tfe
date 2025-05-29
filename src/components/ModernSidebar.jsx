import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings as SettingsIcon,
  Assignment as TaskIcon,
  Inventory as InventoryIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
  PlayArrow as PlayIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
  PushPin as PinIcon,
  Circle as CircleIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { 
  Badge,
  Tooltip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useFlowManager } from '../context/FlowManagerContext';
import { useFlowAccess } from '../hooks/useFlowAccess.js';
import { FlowContext } from '../context/FlowContext';
import taskStore from '../store/taskStore';
import conditionStore from '../store/conditionStore';
import ApiImporter from './ApiImporter';
import ConditionCreator from './ConditionCreator';
import ConditionManager from './ConditionManager';
import TaskDetailPanel from './TaskDetailPanel';
import '../styles/ModernSidebar.css';

const SIDEBAR_TABS = {
  CONDITIONS: 'conditions',
  TASKS: 'tasks',
  INVENTORY: 'inventory'
};

const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress', 
  COMPLETED: 'completed'
};

const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

const ModernSidebar = ({ 
  apiSpec, 
  apiInventoryNodes, 
  onApiImport, 
  onCreateCondition,
  activeTab: parentActiveTab 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Sidebar state
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [activeTab, setActiveTab] = useState(SIDEBAR_TABS.CONDITIONS);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [detailPanelTaskId, setDetailPanelTaskId] = useState(null);
  
  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  // Conditions state
  const [conditions, setConditions] = useState([]);
  const [conditionsLoading, setConditionsLoading] = useState(false);
  const [conditionsError, setConditionsError] = useState(null);
  const [conditionsSearchTerm, setConditionsSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({
    pending: true,
    in_progress: true,
    completed: false
  });
  
  // Snackbar states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  // Auth and permissions
  const { isAuthenticated } = useAuth();
  const { currentFlowId } = useFlowManager();
  const { hasAccess: canEdit } = useFlowAccess('editor');
  const { executeFlowRef } = useContext(FlowContext);

  // Load tasks
  useEffect(() => {
    const loadTasks = async () => {
      if (!isAuthenticated || !currentFlowId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const allTasks = await taskStore.getAllTasks({}, { id: currentFlowId });
        setTasks(allTasks);
      } catch (err) {
        console.error('Error loading tasks:', err);
        setError('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
    const intervalId = setInterval(loadTasks, 30000);
    return () => clearInterval(intervalId);
  }, [isAuthenticated, currentFlowId]);

  // Load conditions
  useEffect(() => {
    const loadConditions = async () => {
      if (!isAuthenticated || !currentFlowId) return;
      
      setConditionsLoading(true);
      setConditionsError(null);
      
      try {
        conditionStore.setCurrentFlowId(currentFlowId);
        await conditionStore.loadConditions();
        const allConditions = conditionStore.getAllConditions();
        setConditions(allConditions);
      } catch (err) {
        console.error('Error loading conditions:', err);
        setConditionsError('Failed to load conditions');
        // Try to get from local cache
        const allConditions = conditionStore.getAllConditions();
        setConditions(allConditions);
      } finally {
        setConditionsLoading(false);
      }
    };

    loadConditions();
    const intervalId = setInterval(loadConditions, 30000);
    return () => clearInterval(intervalId);
  }, [isAuthenticated, currentFlowId]);

  // Filter and group tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const groupedTasks = {
    pending: filteredTasks.filter(t => t.status === TASK_STATUS.PENDING),
    in_progress: filteredTasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS),
    completed: filteredTasks.filter(t => t.status === TASK_STATUS.COMPLETED)
  };

  const totalPendingTasks = tasks.filter(t => t.status !== TASK_STATUS.COMPLETED).length;

  // Task actions
  const handleTaskAction = async (taskId, action) => {
    if (!canEdit) {
      alert('You need editor permissions to perform this action');
      return;
    }

    try {
      switch (action) {
        case 'complete':
          await taskStore.completeTask(taskId, { id: currentFlowId });
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this task?')) {
            await taskStore.removeTask(taskId, { id: currentFlowId });
          }
          break;
        case 'run':
          const startTime = Date.now();
          try {
            console.log(`🚀 [MODERN SIDEBAR] Running task: ${taskId}`);
            
            // Utiliser la nouvelle méthode executeTask qui gère automatiquement les statuts
            const result = await taskStore.executeTask(
              taskId,
              async (taskToExecute) => {
                // Mettre à jour l'état local avec la tâche en cours
                const updatedTasks = await taskStore.getAllTasks({}, { id: currentFlowId });
                setTasks(updatedTasks);
                
                // Exécuter le flow
                return await executeFlowRef.current(taskToExecute);
              },
              { id: currentFlowId }
            );
            
            const executionTime = Date.now() - startTime;
            
            if (result.success) {
              console.log(`✅ [MODERN SIDEBAR] Task executed successfully:`, result);
              setSnackbarMessage(`Task executed successfully in ${executionTime}ms`);
              setSnackbarSeverity('success');
            } else {
              console.error(`❌ [MODERN SIDEBAR] Task execution failed:`, result.error);
              setSnackbarMessage(`Task execution failed: ${result.error}`);
              setSnackbarSeverity('error');
            }
            setSnackbarOpen(true);
          } catch (error) {
            console.error(`❌ [MODERN SIDEBAR] Error executing task:`, error);
            const executionTime = Date.now() - startTime;
            setSnackbarMessage(`Error executing task: ${error.message || 'Unknown error'} (${executionTime}ms)`);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
          }
          break;
      }
      
      // Refresh tasks
      const updatedTasks = await taskStore.getAllTasks({}, { id: currentFlowId });
      setTasks(updatedTasks);
    } catch (err) {
      console.error('Error performing task action:', err);
      alert('Failed to perform action');
    }
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case TASK_PRIORITY.URGENT: return '#f44336';
      case TASK_PRIORITY.HIGH: return '#ff9800';
      case TASK_PRIORITY.MEDIUM: return '#2196f3';
      case TASK_PRIORITY.LOW: return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case TASK_STATUS.COMPLETED: return <CheckCircleIcon />;
      case TASK_STATUS.IN_PROGRESS: return <ScheduleIcon />;
      default: return <CircleIcon />;
    }
  };

  // Filter conditions
  const filteredConditions = conditions.filter(condition => {
    const matchesSearch = condition.conditionText?.toLowerCase().includes(conditionsSearchTerm.toLowerCase()) ||
                         condition.returnText?.toLowerCase().includes(conditionsSearchTerm.toLowerCase());
    return matchesSearch;
  });

  // Condition actions
  const handleConditionDelete = async (conditionId) => {
    if (!canEdit) {
      alert('You need editor permissions to delete conditions');
      return;
    }

    if (window.confirm('Are you sure you want to delete this condition?')) {
      try {
        await conditionStore.removeCondition(conditionId);
        const updatedConditions = conditionStore.getAllConditions();
        setConditions(updatedConditions);
      } catch (err) {
        console.error('Error deleting condition:', err);
        alert('Failed to delete condition');
      }
    }
  };

  // Handle condition creation with refresh
  const handleCreateConditionWithRefresh = async (conditionData) => {
    try {
      await onCreateCondition(conditionData);
      // Refresh conditions list
      const updatedConditions = conditionStore.getAllConditions();
      setConditions(updatedConditions);
    } catch (err) {
      console.error('Error creating condition:', err);
    }
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case SIDEBAR_TABS.CONDITIONS:
        return (
          <div className="tab-content">
            <div className="section-header">
              <h3>Mail Conditions</h3>
              <Badge badgeContent={conditions.length} color="primary" max={99}>
                <SettingsIcon />
              </Badge>
            </div>
            
            {/* Create condition */}
            <div className="task-filters">
              <ConditionCreator onCreateCondition={handleCreateConditionWithRefresh} />
            </div>
            
            {/* Search conditions */}
            <div className="task-filters">
              <TextField
                size="small"
                placeholder="Search conditions..."
                value={conditionsSearchTerm}
                onChange={(e) => setConditionsSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                fullWidth
              />
            </div>

            {/* Conditions list */}
            <div className="task-groups">
              {conditionsLoading && (
                <div className="loading-state">
                  Loading conditions...
                </div>
              )}

              {conditionsError && (
                <div className="error-state">
                  {conditionsError}
                </div>
              )}

              {!conditionsLoading && filteredConditions.length === 0 && conditionsSearchTerm && (
                <div className="empty-group">
                  No conditions match your search
                </div>
              )}

              {!conditionsLoading && conditions.length === 0 && !conditionsSearchTerm && (
                <div className="empty-group">
                  No conditions created yet. Use the form above to create your first condition.
                </div>
              )}

              {!conditionsLoading && filteredConditions.length > 0 && (
                <div className="task-group">
                  <div className="group-header">
                    <div className="group-title">
                      <SettingsIcon />
                      <span>CONDITIONS ({filteredConditions.length})</span>
                    </div>
                  </div>
                  
                  <div className="task-list">
                    {filteredConditions.map(condition => (
                      <motion.div
                        key={condition.id}
                        className="task-item"
                        whileHover={{ x: 3 }}
                        layout
                      >
                        <div className="task-main">
                          <div className="task-header">
                            <Chip 
                              label="Mail Condition" 
                              size="small" 
                              variant="outlined"
                              sx={{ fontSize: '10px', height: '20px' }}
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
                        
                        <div className="task-actions">
                          <Tooltip title="Delete condition">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConditionDelete(condition.id);
                              }}
                              disabled={!canEdit}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case SIDEBAR_TABS.TASKS:
        return (
          <div className="tab-content">
            <div className="section-header">
              <h3>Tasks</h3>
              <Badge badgeContent={totalPendingTasks} color="error" max={99}>
                <TaskIcon />
              </Badge>
            </div>
            
            {/* Search and filters */}
            <div className="task-filters">
              <TextField
                size="small"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                    onChange={(e) => setStatusFilter(e.target.value)}
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
                    onChange={(e) => setPriorityFilter(e.target.value)}
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

            {/* Task groups */}
            <div className="task-groups">
              {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
                <div key={groupName} className="task-group">
                  <div 
                    className="group-header"
                    onClick={() => toggleGroup(groupName)}
                  >
                    <div className="group-title">
                      {getStatusIcon(groupName)}
                      <span>{groupName.replace('_', ' ').toUpperCase()}</span>
                      <Badge badgeContent={groupTasks.length} color="primary" />
                    </div>
                    {expandedGroups[groupName] ? <ArrowUpIcon /> : <ArrowDownIcon />}
                  </div>
                  
                  <AnimatePresence>
                    {expandedGroups[groupName] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="task-list"
                      >
                        {groupTasks.length === 0 ? (
                          <div className="empty-group">No tasks</div>
                        ) : (
                          groupTasks.map(task => (
                            <motion.div
                              key={task.id}
                              className={`task-item ${selectedTaskId === task.id ? 'selected' : ''}`}
                              onClick={() => {
                                setSelectedTaskId(selectedTaskId === task.id ? null : task.id);
                                setDetailPanelTaskId(task.id);
                              }}
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
                                      handleTaskAction(task.id, 'run');
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
                                      handleTaskAction(task.id, 'complete');
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
                                      handleTaskAction(task.id, 'delete');
                                    }}
                                    disabled={!canEdit}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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

      case SIDEBAR_TABS.INVENTORY:
        return (
          <div className="tab-content">
            <div className="section-header">
              <h3>API Inventory</h3>
            </div>
            
            <ApiImporter onApiImport={onApiImport} />
            
            {apiSpec && (
              <div className="api-info">
                <h4>{apiSpec.info?.title || 'Untitled API'}</h4>
                <p>{apiSpec.info?.description || ''}</p>
                <div className="api-stats">
                  <span>Version: {apiSpec.info?.version || 'Unknown'}</span>
                  <span>Endpoints: {apiInventoryNodes.length}</span>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Sidebar content
  const sidebarContent = (
    <div className={`modern-sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      {/* Tab icons */}
      <div className="sidebar-tabs">
        <Tooltip title="Conditions" placement="right">
          <div
            className={`tab-icon ${activeTab === SIDEBAR_TABS.CONDITIONS ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(SIDEBAR_TABS.CONDITIONS);
              if (isCollapsed) setIsCollapsed(false);
            }}
          >
            <SettingsIcon />
          </div>
        </Tooltip>
        
        <Tooltip title="Tasks" placement="right">
          <div
            className={`tab-icon ${activeTab === SIDEBAR_TABS.TASKS ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(SIDEBAR_TABS.TASKS);
              if (isCollapsed) setIsCollapsed(false);
            }}
          >
            <Badge badgeContent={totalPendingTasks} color="error" max={99}>
              <TaskIcon />
            </Badge>
          </div>
        </Tooltip>
        
        <Tooltip title="Inventory" placement="right">
          <div
            className={`tab-icon ${activeTab === SIDEBAR_TABS.INVENTORY ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(SIDEBAR_TABS.INVENTORY);
              if (isCollapsed) setIsCollapsed(false);
            }}
          >
            <InventoryIcon />
          </div>
        </Tooltip>
        
        {/* Toggle sidebar visibility */}
        <div className="sidebar-divider"></div>
        <Tooltip title={isCollapsed ? "Expand sidebar" : "Hide sidebar"} placement="right">
          <div
            className="tab-icon toggle-icon"
            onClick={() => setIsHidden(!isHidden)}
          >
            {isHidden ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </div>
        </Tooltip>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="sidebar-content"
          >
            <div className="content-header">
              <IconButton
                size="small"
                onClick={() => setIsCollapsed(true)}
                className="collapse-button"
              >
                <CloseIcon />
              </IconButton>
            </div>
            {renderTabContent()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Don't render anything if hidden
  if (isHidden) {
    return (
      <>
        {/* Show only a small toggle button when hidden */}
        <div className="sidebar-toggle-button">
          <Tooltip title="Show sidebar" placement="right">
            <IconButton
              onClick={() => setIsHidden(false)}
              sx={{
                position: 'fixed',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1000,
                backgroundColor: 'background.paper',
                boxShadow: 2,
                '&:hover': {
                  backgroundColor: 'action.hover',
                }
              }}
            >
              <ChevronRightIcon />
            </IconButton>
          </Tooltip>
        </div>
        <TaskDetailPanel
          taskId={detailPanelTaskId}
          isOpen={!!detailPanelTaskId}
          onClose={() => {
            setDetailPanelTaskId(null);
            setSelectedTaskId(null);
          }}
          onTaskUpdate={(updatedTask, action) => {
            if (action === 'deleted') {
              setDetailPanelTaskId(null);
              setSelectedTaskId(null);
            }
            // Refresh tasks
            const loadTasks = async () => {
              try {
                const allTasks = await taskStore.getAllTasks({}, { id: currentFlowId });
                setTasks(allTasks);
              } catch (err) {
                console.error('Error refreshing tasks:', err);
              }
            };
            loadTasks();
          }}
        />
      </>
    );
  }

  // Mobile drawer or desktop sidebar
  if (isMobile) {
    return (
      <Drawer
        anchor="left"
        open={!isCollapsed}
        onClose={() => setIsCollapsed(true)}
        variant="temporary"
        sx={{
          '& .MuiDrawer-paper': {
            width: 320,
            boxSizing: 'border-box',
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  return (
    <>
      {sidebarContent}
      <TaskDetailPanel
        taskId={detailPanelTaskId}
        isOpen={!!detailPanelTaskId}
        onClose={() => {
          setDetailPanelTaskId(null);
          setSelectedTaskId(null);
        }}
        onTaskUpdate={(updatedTask, action) => {
          if (action === 'deleted') {
            setDetailPanelTaskId(null);
            setSelectedTaskId(null);
          }
          // Refresh tasks
          const loadTasks = async () => {
            try {
              const allTasks = await taskStore.getAllTasks({}, { id: currentFlowId });
              setTasks(allTasks);
            } catch (err) {
              console.error('Error refreshing tasks:', err);
            }
          };
          loadTasks();
        }}
      />
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ModernSidebar;
