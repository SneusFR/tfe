import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { 
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
  Tooltip
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useFlowManager } from '../context/FlowManagerContext';
import { useFlowAccess } from '../hooks/useFlowAccess.js';
import { FlowContext } from '../context/FlowContext';
import taskStore from '../store/taskStore';
import conditionStore from '../store/conditionStore';
import TaskDetailPanel from './TaskDetailPanel';
import {
  SidebarTabs,
  ConditionsTab,
  TasksTab,
  StartingPointsTab,
  ConditionalFlowTab,
  InputNodesTab,
  EmailNodesTab,
  AINodesTab,
  MiscNodesTab,
  InventoryTab,
  ApiNodesTab,
  SIDEBAR_TABS,
  TASK_STATUS,
  filterTasks,
  groupTasksByStatus,
  filterConditions
} from './sidebar';
import '../styles/ModernSidebar.css';

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
  
  // Other search terms
  const [conditionalFlowSearchTerm, setConditionalFlowSearchTerm] = useState('');
  const [inputNodesSearchTerm, setInputNodesSearchTerm] = useState('');
  const [emailNodesSearchTerm, setEmailNodesSearchTerm] = useState('');
  const [aiNodesSearchTerm, setAiNodesSearchTerm] = useState('');
  const [miscNodesSearchTerm, setMiscNodesSearchTerm] = useState('');
  const [startingPointsSearchTerm, setStartingPointsSearchTerm] = useState('');
  
  // Snackbar states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  // Bulk execution state
  const [isExecutingAll, setIsExecutingAll] = useState(false);
  
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

  // Calculate derived values
  const filteredTasks = filterTasks(tasks, searchTerm, statusFilter, priorityFilter);
  const groupedTasks = groupTasksByStatus(filteredTasks);
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
            
            const result = await taskStore.executeTask(
              taskId,
              async (taskToExecute) => {
                const updatedTasks = await taskStore.getAllTasks({}, { id: currentFlowId });
                setTasks(updatedTasks);
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

  const handleTaskSelect = (taskId) => {
    setSelectedTaskId(selectedTaskId === taskId ? null : taskId);
    setDetailPanelTaskId(taskId);
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

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

  // Execute all pending tasks in sequence
  const handleExecuteAllPendingTasks = async () => {
    if (!canEdit) {
      alert('You need editor permissions to perform this action');
      return;
    }

    const pendingTasks = tasks.filter(t => t.status === TASK_STATUS.PENDING);
    
    if (pendingTasks.length === 0) {
      setSnackbarMessage('No pending tasks to execute');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      return;
    }

    if (!window.confirm(`Are you sure you want to execute all ${pendingTasks.length} pending tasks in sequence?`)) {
      return;
    }

    setIsExecutingAll(true);
    const startTime = Date.now();
    let successCount = 0;
    let failureCount = 0;

    try {
      console.log(`🚀 [MODERN SIDEBAR] Starting bulk execution of ${pendingTasks.length} pending tasks`);
      
      for (let i = 0; i < pendingTasks.length; i++) {
        const task = pendingTasks[i];
        
        try {
          console.log(`🚀 [MODERN SIDEBAR] Executing task ${i + 1}/${pendingTasks.length}: ${task.id}`);
          
          const result = await taskStore.executeTask(
            task.id,
            async (taskToExecute) => {
              const updatedTasks = await taskStore.getAllTasks({}, { id: currentFlowId });
              setTasks(updatedTasks);
              return await executeFlowRef.current(taskToExecute);
            },
            { id: currentFlowId }
          );
          
          if (result.success) {
            successCount++;
            console.log(`✅ [MODERN SIDEBAR] Task ${i + 1}/${pendingTasks.length} executed successfully`);
          } else {
            failureCount++;
            console.error(`❌ [MODERN SIDEBAR] Task ${i + 1}/${pendingTasks.length} execution failed:`, result.error);
          }
          
        } catch (error) {
          failureCount++;
          console.error(`❌ [MODERN SIDEBAR] Error executing task ${i + 1}/${pendingTasks.length}:`, error);
        }
        
        // Refresh tasks after each execution
        const updatedTasks = await taskStore.getAllTasks({}, { id: currentFlowId });
        setTasks(updatedTasks);
      }
      
      const totalTime = Date.now() - startTime;
      const message = `Bulk execution completed: ${successCount} successful, ${failureCount} failed (${totalTime}ms)`;
      
      console.log(`📊 [MODERN SIDEBAR] ${message}`);
      setSnackbarMessage(message);
      setSnackbarSeverity(failureCount === 0 ? 'success' : 'warning');
      setSnackbarOpen(true);
      
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`❌ [MODERN SIDEBAR] Bulk execution failed:`, error);
      setSnackbarMessage(`Bulk execution failed: ${error.message || 'Unknown error'} (${totalTime}ms)`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsExecutingAll(false);
      // Final refresh
      const updatedTasks = await taskStore.getAllTasks({}, { id: currentFlowId });
      setTasks(updatedTasks);
    }
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case SIDEBAR_TABS.CONDITIONS:
        return (
          <ConditionsTab
            conditions={conditions}
            conditionsLoading={conditionsLoading}
            conditionsError={conditionsError}
            conditionsSearchTerm={conditionsSearchTerm}
            onConditionsSearchChange={setConditionsSearchTerm}
            onCreateCondition={handleCreateConditionWithRefresh}
            onConditionDelete={handleConditionDelete}
            canEdit={canEdit}
          />
        );

      case SIDEBAR_TABS.TASKS:
        return (
          <TasksTab
            tasks={tasks}
            loading={loading}
            error={error}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
            expandedGroups={expandedGroups}
            onToggleGroup={toggleGroup}
            selectedTaskId={selectedTaskId}
            onTaskSelect={handleTaskSelect}
            onTaskAction={handleTaskAction}
            onExecuteAllPendingTasks={handleExecuteAllPendingTasks}
            isExecutingAll={isExecutingAll}
            canEdit={canEdit}
          />
        );

      case SIDEBAR_TABS.STARTING_POINTS:
        return (
          <StartingPointsTab
            conditions={conditions}
            conditionsLoading={conditionsLoading}
            conditionsError={conditionsError}
            startingPointsSearchTerm={startingPointsSearchTerm}
            onStartingPointsSearchChange={setStartingPointsSearchTerm}
            canEdit={canEdit}
          />
        );

      case SIDEBAR_TABS.CONDITIONAL_FLOW:
        return (
          <ConditionalFlowTab
            conditionalFlowSearchTerm={conditionalFlowSearchTerm}
            onConditionalFlowSearchChange={setConditionalFlowSearchTerm}
            canEdit={canEdit}
          />
        );

      case SIDEBAR_TABS.INPUT_NODES:
        return (
          <InputNodesTab
            inputNodesSearchTerm={inputNodesSearchTerm}
            onInputNodesSearchChange={setInputNodesSearchTerm}
            canEdit={canEdit}
          />
        );

      case SIDEBAR_TABS.EMAIL_NODES:
        return (
          <EmailNodesTab
            emailNodesSearchTerm={emailNodesSearchTerm}
            onEmailNodesSearchChange={setEmailNodesSearchTerm}
            canEdit={canEdit}
          />
        );

      case SIDEBAR_TABS.AI_NODES:
        return (
          <AINodesTab
            aiNodesSearchTerm={aiNodesSearchTerm}
            onAINodesSearchChange={setAiNodesSearchTerm}
            canEdit={canEdit}
          />
        );

      case SIDEBAR_TABS.MISC_NODES:
        return (
          <MiscNodesTab
            miscNodesSearchTerm={miscNodesSearchTerm}
            onMiscNodesSearchChange={setMiscNodesSearchTerm}
            canEdit={canEdit}
          />
        );

      case SIDEBAR_TABS.INVENTORY:
        return (
          <InventoryTab
            apiSpec={apiSpec}
            apiInventoryNodes={apiInventoryNodes}
            onApiImport={onApiImport}
          />
        );

      case SIDEBAR_TABS.API_NODES:
        return (
          <ApiNodesTab
            apiInventoryNodes={apiInventoryNodes}
          />
        );

      default:
        return null;
    }
  };

  // Sidebar content
  const sidebarContent = (
    <div className={`modern-sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      {/* Tab icons */}
      <SidebarTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalPendingTasks={totalPendingTasks}
        conditionsCount={conditions.length}
        isCollapsed={isCollapsed}
        isHidden={isHidden}
        onToggleCollapsed={() => setIsCollapsed(!isCollapsed)}
        onToggleHidden={() => setIsHidden(!isHidden)}
      />

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
