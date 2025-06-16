import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Close as CloseIcon,
  PlayArrow as PlayIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Flag as FlagIcon,
  Category as CategoryIcon,
  Description as DescriptionIcon,
  Email as EmailIcon,
  Attachment as AttachmentIcon
} from '@mui/icons-material';
import {
  IconButton,
  Chip,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Divider,
  Box,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import { FlowContext } from '../../context/FlowContext';
import { useAuth } from '../../context/AuthContext';
import { useFlowManager } from '../../context/FlowManagerContext';
import { useFlowAccess } from '../../hooks/useFlowAccess.js';
import taskStore from '../../store/taskStore';
import '../../styles/TaskDetailPanel.css';

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

const TaskDetailPanel = ({ taskId, isOpen, onClose, onTaskUpdate }) => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState({});
  const [runningTask, setRunningTask] = useState(false);
  
  // Snackbar states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Contexts
  const { executeFlowRef } = useContext(FlowContext);
  const { isAuthenticated } = useAuth();
  const { currentFlowId } = useFlowManager();
  const { hasAccess: canEdit } = useFlowAccess('editor');

  // Load task details
  useEffect(() => {
    const loadTask = async () => {
      if (!taskId || !isOpen || !currentFlowId) return;

      setLoading(true);
      setError(null);

      try {
        const taskData = await taskStore.getTaskById(taskId, { id: currentFlowId });
        setTask(taskData);
        setEditedTask(taskData);
      } catch (err) {
        console.error('Error loading task:', err);
        setError('Failed to load task details');
      } finally {
        setLoading(false);
      }
    };

    loadTask();
  }, [taskId, isOpen, currentFlowId]);

  // Handle task actions
  const handleTaskAction = async (action) => {
    if (!canEdit && action !== 'run') {
      alert('You need editor permissions to perform this action');
      return;
    }

    try {
      switch (action) {
        case 'complete':
          await taskStore.completeTask(taskId, { id: currentFlowId });
          const completedTask = await taskStore.getTaskById(taskId, { id: currentFlowId });
          setTask(completedTask);
          onTaskUpdate?.(completedTask);
          break;

        case 'delete':
          if (window.confirm('Are you sure you want to delete this task?')) {
            await taskStore.removeTask(taskId, { id: currentFlowId });
            onClose();
            onTaskUpdate?.(null, 'deleted');
          }
          break;

        case 'run':
          setRunningTask(true);
          const startTime = Date.now();
          try {
            console.log(`🚀 [TASK DETAIL] Running task: ${taskId} - ${task.type}`);
            
            // Utiliser la nouvelle méthode executeTask qui gère automatiquement les statuts
            const result = await taskStore.executeTask(
              taskId,
              async (taskToExecute) => {
                // Mettre à jour l'état local avec la tâche en cours
                setTask(taskToExecute);
                onTaskUpdate?.(taskToExecute);
                
                // Exécuter le flow
                return await executeFlowRef.current(taskToExecute);
              },
              { id: currentFlowId }
            );
            
            const executionTime = Date.now() - startTime;
            
            if (result.success) {
              console.log(`✅ [TASK DETAIL] Task executed successfully:`, result);
              setTask(result.task);
              onTaskUpdate?.(result.task);
              setSnackbarMessage(`Task "${task.type}" executed successfully in ${executionTime}ms`);
              setSnackbarSeverity('success');
            } else {
              console.error(`❌ [TASK DETAIL] Task execution failed:`, result.error);
              setTask(result.task);
              onTaskUpdate?.(result.task);
              setSnackbarMessage(`Task execution failed: ${result.error}`);
              setSnackbarSeverity('error');
            }
            setSnackbarOpen(true);
          } catch (error) {
            console.error(`❌ [TASK DETAIL] Error executing task:`, error);
            const executionTime = Date.now() - startTime;
            setSnackbarMessage(`Error executing task: ${error.message || 'Unknown error'} (${executionTime}ms)`);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
          } finally {
            setRunningTask(false);
          }
          break;
      }
    } catch (err) {
      console.error('Error performing task action:', err);
      alert('Failed to perform action');
    }
  };

  // Handle task update
  const handleSaveTask = async () => {
    if (!canEdit) {
      alert('You need editor permissions to edit tasks');
      return;
    }

    try {
      const updatedTask = await taskStore.updateTask(taskId, editedTask, { id: currentFlowId });
      setTask(updatedTask);
      setIsEditing(false);
      onTaskUpdate?.(updatedTask);
    } catch (err) {
      console.error('Error updating task:', err);
      alert('Failed to update task');
    }
  };

  const handleCancelEdit = () => {
    setEditedTask(task);
    setIsEditing(false);
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

  const getStatusColor = (status) => {
    switch (status) {
      case TASK_STATUS.COMPLETED: return '#4caf50';
      case TASK_STATUS.IN_PROGRESS: return '#ff9800';
      case TASK_STATUS.PENDING: return '#9e9e9e';
      default: return '#9e9e9e';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="task-detail-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="task-detail-panel"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="panel-header">
            <div className="header-content">
              <Typography variant="h6" component="h2">
                Task Details
              </Typography>
              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            </div>
            
            {/* Action buttons */}
            <div className="header-actions">
              <Tooltip title="Run task">
                <Button
                  variant="contained"
                  startIcon={runningTask ? <ScheduleIcon /> : <PlayIcon />}
                  onClick={() => handleTaskAction('run')}
                  disabled={task?.status === TASK_STATUS.COMPLETED || runningTask}
                  sx={{ mr: 1 }}
                >
                  {runningTask ? 'Running...' : 'Run'}
                </Button>
              </Tooltip>

              {canEdit && (
                <>
                  <Tooltip title="Mark as completed">
                    <IconButton
                      onClick={() => handleTaskAction('complete')}
                      disabled={task?.status === TASK_STATUS.COMPLETED}
                      color="success"
                    >
                      <CheckIcon />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Edit task">
                    <IconButton
                      onClick={() => setIsEditing(!isEditing)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Delete task">
                    <IconButton
                      onClick={() => handleTaskAction('delete')}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </div>
          </div>

          <Divider />

          {/* Content */}
          <div className="panel-content">
            {loading && (
              <div className="loading-state">
                <Typography>Loading task details...</Typography>
              </div>
            )}

            {error && (
              <div className="error-state">
                <Typography color="error">{error}</Typography>
              </div>
            )}

            {task && (
              <div className="task-details">
                {/* Basic Info */}
                <div className="detail-section">
                  <Typography variant="h6" gutterBottom>
                    <CategoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Basic Information
                  </Typography>

                  <div className="detail-grid">
                    <div className="detail-item">
                      <Typography variant="subtitle2" color="textSecondary">
                        Type
                      </Typography>
                      {isEditing ? (
                        <TextField
                          size="small"
                          value={editedTask.type || ''}
                          onChange={(e) => setEditedTask({ ...editedTask, type: e.target.value })}
                          fullWidth
                        />
                      ) : (
                        <Chip label={task.type} variant="outlined" />
                      )}
                    </div>

                    <div className="detail-item">
                      <Typography variant="subtitle2" color="textSecondary">
                        Status
                      </Typography>
                      {isEditing ? (
                        <FormControl size="small" fullWidth>
                          <Select
                            value={editedTask.status || ''}
                            onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value })}
                          >
                            <MenuItem value={TASK_STATUS.PENDING}>Pending</MenuItem>
                            <MenuItem value={TASK_STATUS.IN_PROGRESS}>In Progress</MenuItem>
                            <MenuItem value={TASK_STATUS.COMPLETED}>Completed</MenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        <Chip
                          label={task.status?.replace('_', ' ').toUpperCase()}
                          sx={{ backgroundColor: getStatusColor(task.status), color: 'white' }}
                        />
                      )}
                    </div>

                    <div className="detail-item">
                      <Typography variant="subtitle2" color="textSecondary">
                        Priority
                      </Typography>
                      {isEditing ? (
                        <FormControl size="small" fullWidth>
                          <Select
                            value={editedTask.priority || ''}
                            onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value })}
                          >
                            <MenuItem value={TASK_PRIORITY.LOW}>Low</MenuItem>
                            <MenuItem value={TASK_PRIORITY.MEDIUM}>Medium</MenuItem>
                            <MenuItem value={TASK_PRIORITY.HIGH}>High</MenuItem>
                            <MenuItem value={TASK_PRIORITY.URGENT}>Urgent</MenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        task.priority && (
                          <Chip
                            label={task.priority}
                            sx={{ backgroundColor: getPriorityColor(task.priority), color: 'white' }}
                          />
                        )
                      )}
                    </div>

                    <div className="detail-item full-width">
                      <Typography variant="subtitle2" color="textSecondary">
                        Description
                      </Typography>
                      {isEditing ? (
                        <TextField
                          multiline
                          rows={3}
                          value={editedTask.description || ''}
                          onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                          fullWidth
                        />
                      ) : (
                        <Typography variant="body2">
                          {task.description || 'No description'}
                        </Typography>
                      )}
                    </div>
                  </div>
                </div>

                <Divider sx={{ my: 2 }} />

                {/* Email Information */}
                {(task.senderEmail || task.recipientEmail || task.subject) && (
                  <>
                    <div className="detail-section">
                      <Typography variant="h6" gutterBottom>
                        <EmailIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Email Information
                      </Typography>

                      <div className="detail-grid">
                        {task.senderEmail && (
                          <div className="detail-item">
                            <Typography variant="subtitle2" color="textSecondary">
                              From
                            </Typography>
                            <Typography variant="body2">
                              {task.senderName ? `${task.senderName} <${task.senderEmail}>` : task.senderEmail}
                            </Typography>
                          </div>
                        )}

                        {task.recipientEmail && (
                          <div className="detail-item">
                            <Typography variant="subtitle2" color="textSecondary">
                              To
                            </Typography>
                            <Typography variant="body2">
                              {task.recipientName ? `${task.recipientName} <${task.recipientEmail}>` : task.recipientEmail}
                            </Typography>
                          </div>
                        )}

                        {task.subject && (
                          <div className="detail-item full-width">
                            <Typography variant="subtitle2" color="textSecondary">
                              Subject
                            </Typography>
                            <Typography variant="body2">{task.subject}</Typography>
                          </div>
                        )}

                        {task.body && (
                          <div className="detail-item full-width">
                            <Typography variant="subtitle2" color="textSecondary">
                              Body Preview
                            </Typography>
                            <Typography variant="body2" className="email-body-preview">
                              {task.body.substring(0, 200)}
                              {task.body.length > 200 && '...'}
                            </Typography>
                          </div>
                        )}
                      </div>
                    </div>

                    <Divider sx={{ my: 2 }} />
                  </>
                )}

                {/* Attachments */}
                {task.attachments && task.attachments.length > 0 && (
                  <>
                    <div className="detail-section">
                      <Typography variant="h6" gutterBottom>
                        <AttachmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Attachments ({task.attachments.length})
                      </Typography>

                      <div className="attachments-list">
                        {task.attachments.map((attachment, index) => (
                          <Chip
                            key={index}
                            label={attachment.name || `Attachment ${index + 1}`}
                            variant="outlined"
                            size="small"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </div>
                    </div>

                    <Divider sx={{ my: 2 }} />
                  </>
                )}

                {/* Metadata */}
                <div className="detail-section">
                  <Typography variant="h6" gutterBottom>
                    <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Metadata
                  </Typography>

                  <div className="detail-grid">
                    <div className="detail-item">
                      <Typography variant="subtitle2" color="textSecondary">
                        Created
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(task.createdAt)}
                      </Typography>
                    </div>

                    <div className="detail-item">
                      <Typography variant="subtitle2" color="textSecondary">
                        Updated
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(task.updatedAt)}
                      </Typography>
                    </div>

                    {task.sourceId && (
                      <div className="detail-item">
                        <Typography variant="subtitle2" color="textSecondary">
                          Source ID
                        </Typography>
                        <Typography variant="body2" className="monospace">
                          {task.sourceId}
                        </Typography>
                      </div>
                    )}

                    {task.attachmentId && (
                      <div className="detail-item">
                        <Typography variant="subtitle2" color="textSecondary">
                          Attachment ID
                        </Typography>
                        <Typography variant="body2" className="monospace">
                          {task.attachmentId}
                        </Typography>
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit actions */}
                {isEditing && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <div className="edit-actions">
                      <Button
                        variant="contained"
                        onClick={handleSaveTask}
                        sx={{ mr: 1 }}
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
        
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
      </motion.div>
    </AnimatePresence>
  );
};

export default TaskDetailPanel;
