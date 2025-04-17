import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Typography,
  Tooltip,
  Badge
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import CategoryIcon from '@mui/icons-material/Category';
import { FlowContext } from '../context/FlowContext';
import taskStore from '../store/taskStore';
import '../styles/TaskManager.css';

const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [runningTask, setRunningTask] = useState(null);

  // Load tasks from store
  useEffect(() => {
    const loadTasks = () => {
      const allTasks = taskStore.getAllTasks();
      setTasks(allTasks);
    };

    loadTasks();
    
    // Set up an interval to refresh tasks regularly
    const intervalId = setInterval(loadTasks, 3000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Delete a task
  const handleDelete = (id, e) => {
    e.stopPropagation(); // Prevent dropdown from closing
    if (window.confirm('Are you sure you want to delete this task?')) {
      taskStore.removeTask(id);
      setTasks(taskStore.getAllTasks());
    }
  };

  // Mark task as completed
  const handleComplete = (id, e) => {
    e.stopPropagation(); // Prevent dropdown from closing
    taskStore.completeTask(id);
    setTasks(taskStore.getAllTasks());
  };
  
  // Get the executeFlow function from context
  const { executeFlowRef } = useContext(FlowContext);
  
  // Handle the "Run" button click - execute the flow for this task
  const handleRun = async (id, e) => {
    e.stopPropagation(); // Prevent dropdown from closing
    
    // Get the task data
    const task = taskStore.getTaskById(id);
    if (!task) {
      console.error(`Task not found: ${id}`);
      return;
    }
    
    setRunningTask(id);
    console.log(`🚀 [TASK MANAGER] Running task: ${id} - ${task.type}`);
    
    try {
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
      alert(`Error executing task: ${error.message}`);
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
              
              {tasks.length === 0 ? (
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
                        </Tooltip>
                        <Tooltip title="Mark as completed" arrow placement="top">
                          <motion.button 
                            className="complete-button"
                            onClick={(e) => handleComplete(task.id, e)}
                            disabled={task.status === 'completed'}
                            whileHover={task.status !== 'completed' ? { y: -2 } : {}}
                            whileTap={task.status !== 'completed' ? { scale: 0.95 } : {}}
                          >
                            <CheckIcon fontSize="small" />
                          </motion.button>
                        </Tooltip>
                        <Tooltip title="Delete task" arrow placement="top">
                          <motion.button 
                            className="delete-button"
                            onClick={(e) => handleDelete(task.id, e)}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.95 }}
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
