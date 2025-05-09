import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Typography,
  Tooltip,
  Badge,
  CircularProgress
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import CategoryIcon from '@mui/icons-material/Category';
import RefreshIcon from '@mui/icons-material/Refresh';
import { FlowContext } from '../context/FlowContext';
import { useAuth } from '../context/AuthContext';
import { useFlowManager } from '../context/FlowManagerContext';
import { useFlowAccess } from '../hooks/useFlowAccess';
import taskStore from '../store/taskStore';
import '../styles/TaskManager.css';

const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [runningTask, setRunningTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get contexts
  const { isAuthenticated } = useAuth();
  const { currentFlowId } = useFlowManager();
  const { hasAccess: canEdit } = useFlowAccess('editor');

  // Load tasks from store
  useEffect(() => {
    const loadTasks = async () => {
      if (!isAuthenticated) return;
      if (!currentFlowId) return;
      
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
    
    // Set up an interval to refresh tasks regularly
    const intervalId = setInterval(loadTasks, 30000); // Increased to 30 seconds to reduce API calls
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated, currentFlowId]);

  // Refresh tasks manually
  const handleRefresh = async (e) => {
    if (e) e.stopPropagation();
    
    setLoading(true);
    setError(null);
    
    try {
      // Force refresh from API
      const allTasks = await taskStore.getAllTasks({ forceRefresh: true }, { id: currentFlowId });
      setTasks(allTasks);
    } catch (err) {
      console.error('Error refreshing tasks:', err);
      setError('Failed to refresh tasks');
    } finally {
      setLoading(false);
    }
  };

  // Delete a task
  const handleDelete = async (id, e) => {
    e.stopPropagation(); // Prevent dropdown from closing
    if (!canEdit) {
      alert('You need editor or owner permissions to delete tasks');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskStore.removeTask(id, { id: currentFlowId });
        setTasks(await taskStore.getAllTasks({}, { id: currentFlowId }));
      } catch (err) {
        console.error('Error deleting task:', err);
        alert('Failed to delete task');
      }
    }
  };

  // Mark task as completed
  const handleComplete = async (id, e) => {
    e.stopPropagation(); // Prevent dropdown from closing
    if (!canEdit) {
      alert('You need editor or owner permissions to complete tasks');
      return;
    }
    
    try {
      await taskStore.completeTask(id, { id: currentFlowId });
      setTasks(await taskStore.getAllTasks({}, { id: currentFlowId }));
    } catch (err) {
      console.error('Error completing task:', err);
      alert('Failed to complete task');
    }
  };
  
  // Get the executeFlow function from context
  const { executeFlowRef } = useContext(FlowContext);
  
  // Handle the "Run" button click - execute the flow for this task
  const handleRun = async (id, e) => {
    e.stopPropagation(); // Prevent dropdown from closing
    
    setRunningTask(id);
    
    try {
      // Get the task data
      const task = await taskStore.getTaskById(id, { id: currentFlowId });
      if (!task) {
        console.error(`Task not found: ${id}`);
        alert('Task not found');
        return;
      }
      
      console.log(`🚀 [TASK MANAGER] Running task: ${id} - ${task.type}`);
      
      // Execute the flow
      const result = await executeFlowRef.current(task);
      
      if (result.success) {
        console.log(`✅ [TASK MANAGER] Task executed successfully:`, result);
        alert(`Task executed successfully!`);
      } else {
        console.error(`❌ [TASK MANAGER] Task execution failed:`, result.error);
        alert(`Task execution failed: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ [TASK MANAGER] Error executing task:`, error);
      alert(`Error executing task: ${error.message || 'Unknown error'}`);
    } finally {
      setRunningTask(null);
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };
  
  // Get task count with badge
  const getTaskCount = () => {
    const pendingTasks = tasks.filter(task => task.status !== 'completed').length;
    return pendingTasks;
  };

  return (
    <div className="task-manager">
      <div className="task-dropdown">
        <motion.button 
          className="task-dropdown-button"
          onClick={toggleDropdown}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <Badge 
            badgeContent={getTaskCount()} 
            color="error"
            max={99}
            sx={{ 
              '& .MuiBadge-badge': {
                fontSize: '10px',
                height: '18px',
                minWidth: '18px',
                padding: '0 4px'
              }
            }}
          >
            <AssignmentIcon fontSize="small" style={{ marginRight: '4px' }} />
          </Badge>
          Tasks ({tasks.length})
        </motion.button>
        
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div 
              className="task-dropdown-content"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="task-header">
                <h3>Tasks</h3>
                <motion.button 
                  className="close-button"
                  onClick={toggleDropdown}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <CloseIcon fontSize="small" />
                </motion.button>
              </div>
              
              <div className="task-actions-header">
                <Tooltip title="Refresh tasks" arrow placement="top">
                  <motion.button 
                    className="refresh-button"
                    onClick={handleRefresh}
                    disabled={loading}
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.5 }}
                  >
                    {loading ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
                  </motion.button>
                </Tooltip>
              </div>
              
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
              
              {loading && tasks.length === 0 ? (
                <div className="loading-message">
                  <CircularProgress size={24} />
                  <span>Loading tasks...</span>
                </div>
              ) : tasks.length === 0 ? (
                <div className="no-tasks-message">No tasks available</div>
              ) : (
                <ul className="task-list">
                  {tasks.map((task) => (
                    <motion.li 
                      key={task.id} 
                      className={`task-item ${task.status === 'completed' ? 'completed' : ''}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      whileHover={task.status !== 'completed' ? { x: 3 } : {}}
                    >
                      <div className="task-content">
                        <div className="task-type">
                          <CategoryIcon fontSize="small" />
                          {task.type}
                        </div>
                        <div className="task-description">{task.description}</div>
                      </div>
                      <div className="task-actions">
                        <Tooltip title="Run task" arrow placement="top">
                          <span>
                            <motion.button 
                              className="run-button"
                              onClick={(e) => handleRun(task.id, e)}
                              disabled={task.status === 'completed' || runningTask === task.id}
                              whileHover={task.status !== 'completed' && runningTask !== task.id ? { y: -2 } : {}}
                              whileTap={task.status !== 'completed' && runningTask !== task.id ? { scale: 0.95 } : {}}
                            >
                              {runningTask === task.id ? (
                                'Running...'
                              ) : (
                                <>
                                  <PlayArrowIcon fontSize="small" />
                                  Run
                                </>
                              )}
                            </motion.button>
                          </span>
                        </Tooltip>
                        <Tooltip title={canEdit ? "Mark as completed" : "You need editor permissions"} arrow placement="top">
                          <span>
                            <motion.button 
                              className="complete-button"
                              onClick={(e) => handleComplete(task.id, e)}
                              disabled={task.status === 'completed' || !canEdit}
                              whileHover={task.status !== 'completed' && canEdit ? { y: -2 } : {}}
                              whileTap={task.status !== 'completed' && canEdit ? { scale: 0.95 } : {}}
                            >
                              <CheckIcon fontSize="small" />
                            </motion.button>
                          </span>
                        </Tooltip>
                        <Tooltip title={canEdit ? "Delete task" : "You need editor permissions"} arrow placement="top">
                          <motion.button 
                            className="delete-button"
                            onClick={(e) => handleDelete(task.id, e)}
                            disabled={!canEdit}
                            whileHover={canEdit ? { y: -2 } : {}}
                            whileTap={canEdit ? { scale: 0.95 } : {}}
                          >
                            <DeleteIcon fontSize="small" />
                          </motion.button>
                        </Tooltip>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TaskManager;
