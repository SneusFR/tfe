import { useState, useEffect } from 'react';
import taskStore from '../store/taskStore';
import '../styles/TaskManager.css';

const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
  
  // Handle the "Run" button click - does nothing as execution logic has been removed
  const handleRun = (id, e) => {
    e.stopPropagation(); // Prevent dropdown from closing
    console.log(`Task execution functionality has been removed for task ${id}`);
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="task-manager">
      <div className="task-dropdown">
        <button 
          className="task-dropdown-button"
          onClick={toggleDropdown}
        >
          Tasks ({tasks.length})
        </button>
        
        {isDropdownOpen && (
          <div className="task-dropdown-content">
            <div className="task-header">
              <h3>Tasks</h3>
              <button 
                className="close-button"
                onClick={toggleDropdown}
              >
                ×
              </button>
            </div>
            
            {tasks.length === 0 ? (
              <p className="no-tasks-message">No tasks available</p>
            ) : (
              <ul className="task-list">
                {tasks.map((task) => (
                  <li 
                    key={task.id} 
                    className={`task-item ${task.status === 'completed' ? 'completed' : ''}`}
                  >
                    <div className="task-content">
                      <div className="task-type">{task.type}</div>
                      <div className="task-description">{task.description}</div>
                    </div>
                    <div className="task-actions">
                      <button 
                        className="run-button"
                        onClick={(e) => handleRun(task.id, e)}
                        disabled={task.status === 'completed'}
                      >
                        Run
                      </button>
                      <button 
                        className="complete-button"
                        onClick={(e) => handleComplete(task.id, e)}
                        disabled={task.status === 'completed'}
                      >
                        ✓
                      </button>
                      <button 
                        className="delete-button"
                        onClick={(e) => handleDelete(task.id, e)}
                      >
                        ×
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManager;
