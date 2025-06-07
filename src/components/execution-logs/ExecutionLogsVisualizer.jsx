import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useExecutionLogs } from '../../hooks/useExecutionLogs';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ExecutionNode from './ExecutionNode';
import NodeDetailsPanel from './NodeDetailsPanel';
import '../../styles/ExecutionLogsVisualizer.css';

// Material UI Icons
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import HistoryIcon from '@mui/icons-material/History';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InsertChartIcon from '@mui/icons-material/InsertChart';
import TaskIcon from '@mui/icons-material/Assignment';
import ViewListIcon from '@mui/icons-material/ViewList';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: -10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Node types
const nodeTypes = {
  executionNode: ExecutionNode,
};

const ExecutionLogsVisualizer = ({ flowId, taskId: initialTaskId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Task selection state
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(initialTaskId);
  const [tasksLoading, setTasksLoading] = useState(false);
  
  // Filter state
  const [filterLevel, setFilterLevel] = useState(undefined);
  const [filterSince, setFilterSince] = useState(undefined);
  const [filterUntil, setFilterUntil] = useState(undefined);
  
  // Initial filter and page state
  const initialFilter = useMemo(() => ({
    flowId,
    taskIds: selectedTaskId ? [selectedTaskId] : undefined,
    level: filterLevel,
    since: filterSince?.toISOString(),
    until: filterUntil?.toISOString(),
  }), [flowId, selectedTaskId, filterLevel, filterSince, filterUntil]);
  
  const initialPageState = {
    page: 1,
    limit: 100, // Get more logs at once for visualization
    total: 0,
    sort: "createdAt", // Sort by creation time ascending to show execution flow
  };
  
  // Use the custom hook for logs
  const {
    logs,
    pageState,
    loading,
    error,
    updateFilter,
    deleteLogs,
    refetch,
  } = useExecutionLogs(initialFilter, initialPageState);
  
  // Format date for display
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'HH:mm:ss', { locale: fr });
    } catch (e) {
      return dateString;
    }
  };
  
  // Fetch tasks for the flow
  const fetchTasks = useCallback(async () => {
    if (!flowId) return;
    
    setTasksLoading(true);
    try {
      const response = await axios.get(`/api/flows/${flowId}/tasks`, {
        withCredentials: true,
      });
      setTasks(response.data.data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setTasksLoading(false);
    }
  }, [flowId]);
  
  // Fetch tasks on mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);
  
  // Apply filters
  const handleApplyFilters = useCallback(() => {
    updateFilter({
      taskIds: selectedTaskId ? [selectedTaskId] : undefined,
      level: filterLevel,
      since: filterSince?.toISOString(),
      until: filterUntil?.toISOString(),
    });
  }, [updateFilter, selectedTaskId, filterLevel, filterSince, filterUntil]);
  
  // Reset filters
  const handleResetFilters = useCallback(() => {
    setSelectedTaskId(undefined);
    setFilterLevel(undefined);
    setFilterSince(undefined);
    setFilterUntil(undefined);
    updateFilter({
      taskIds: undefined,
      level: undefined,
      since: undefined,
      until: undefined,
    });
  }, [updateFilter]);
  
  // Clear logs
  const handleClearLogs = useCallback(() => {
    if (window.confirm('Are you sure you want to delete all logs for this flow?')) {
      deleteLogs({ flowId });
    }
  }, [deleteLogs, flowId]);
  
  // Handle node click
  const handleNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);
  
  // Close node details panel
  const handleCloseDetails = useCallback(() => {
    setSelectedNode(null);
  }, []);
  
  // Transform logs into nodes and edges for ReactFlow
  useEffect(() => {
    if (!logs || logs.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }
    
    // Sort logs by timestamp
    const sortedLogs = [...logs].sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
    
    // Filter logs to only include one node per nodeId
    // We'll prioritize logs with input/output information
    const nodeMap = new Map();
    
    // First pass: collect all logs by nodeId
    sortedLogs.forEach(log => {
      if (!log.nodeId) return; // Skip logs without nodeId
      
      if (!nodeMap.has(log.nodeId)) {
        nodeMap.set(log.nodeId, []);
      }
      nodeMap.get(log.nodeId).push(log);
    });
    
    // Second pass: select the most relevant log for each nodeId
    const filteredLogs = [];
    nodeMap.forEach(logs => {
      // Skip data nodes and non-executable nodes
      const isExecutableNode = logs.some(log => 
        log.nodeType && !log.nodeType.includes('dataNode') && !log.nodeType.includes('variableNode')
      );
      
      if (!isExecutableNode) return;
      
      // Prioritize logs with input/output information
      const logWithIO = logs.find(log => 
        log.payload && (log.payload.input || log.payload.output)
      );
      
      // If no log with I/O, use the first log that indicates node execution
      const executionLog = logs.find(log => 
        log.message && (
          log.message.includes('processing') || 
          log.message.includes('executed') || 
          log.message.includes('completed')
        )
      );
      
      // Fall back to the first log for this node
      const selectedLog = logWithIO || executionLog || logs[0];
      filteredLogs.push(selectedLog);
    });
    
    // Sort filtered logs by timestamp and ensure logical order
    filteredLogs.sort((a, b) => {
      // First sort by timestamp
      const timeA = new Date(a.timestamp);
      const timeB = new Date(b.timestamp);
      
      if (timeA.getTime() !== timeB.getTime()) {
        return timeA - timeB;
      }
      
      // If timestamps are the same, use logical ordering based on node types
      
      // End nodes should always be last
      if (a.nodeType === 'endNode') return 1;
      if (b.nodeType === 'endNode') return -1;
      
      // Start nodes should always be first
      if (a.nodeType && a.nodeType.includes('start')) return -1;
      if (b.nodeType && b.nodeType.includes('start')) return 1;
      
      // Email sending nodes should be near the end
      if (a.nodeType === 'sendingMailNode') return 1;
      if (b.nodeType === 'sendingMailNode') return -1;
      
      // Default to timestamp order
      return 0;
    });
    
    // Create nodes
    const newNodes = filteredLogs.map((log, index) => {
      // Determine label based on node type and message
      let label = log.message;
      if (label.length > 30) {
        label = label.substring(0, 27) + '...';
      }
      
      return {
        id: log.nodeId || log.id || `node-${index}`,
        type: 'executionNode',
        position: { x: 100 + index * 300, y: 150 }, // Position nodes in a horizontal line
        data: {
          label,
          nodeType: log.nodeType,
          level: log.level,
          timestamp: log.timestamp,
          message: log.message,
          payload: log.payload
        }
      };
    });
    
    // Create edges connecting nodes in sequence
    const newEdges = [];
    for (let i = 0; i < newNodes.length - 1; i++) {
      newEdges.push({
        id: `edge-${i}`,
        source: newNodes[i].id,
        target: newNodes[i + 1].id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#555' }
      });
    }
    
    setNodes(newNodes);
    setEdges(newEdges);
  }, [logs, setNodes, setEdges]);
  
  // Render loading state
  if (loading && logs.length === 0) {
    return (
      <div className="execution-logs-visualizer">
        <motion.div 
          className="execution-logs-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="execution-logs-title">Execution Logs</h2>
        </motion.div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Loading execution logs...
          </motion.div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="execution-logs-visualizer">
        <motion.div 
          className="execution-logs-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="execution-logs-title">Execution Logs</h2>
          <div className="execution-logs-actions">
            <button className="execution-logs-button" onClick={refetch}>
              <RefreshIcon /> Refresh
            </button>
          </div>
        </motion.div>
        <motion.div 
          className="empty-state"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="empty-state-icon">
            <ErrorOutlineIcon style={{ fontSize: 'inherit' }} />
          </div>
          <h3 className="empty-state-title">Error Loading Logs</h3>
          <p className="empty-state-description">{error}</p>
        </motion.div>
      </div>
    );
  }
  
  // Render empty state
  if (!logs || logs.length === 0) {
    return (
      <div className="execution-logs-visualizer">
        <motion.div 
          className="execution-logs-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="execution-logs-title">Execution Logs</h2>
          <div className="execution-logs-actions">
            <button className="execution-logs-button" onClick={refetch}>
              <RefreshIcon /> Refresh
            </button>
          </div>
        </motion.div>
        <motion.div 
          className="empty-state"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="empty-state-icon">
            <InsertChartIcon style={{ fontSize: 'inherit' }} />
          </div>
          <h3 className="empty-state-title">No Logs Available</h3>
          <p className="empty-state-description">
            There are no execution logs available for this flow yet. Run the flow to generate logs.
          </p>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="execution-logs-visualizer">
      <motion.div 
        className="execution-logs-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="execution-logs-header-content">
          <div className="task-selector">
            <div className="task-selector-label">
              <TaskIcon fontSize="small" />
              <span>Select Execution:</span>
            </div>
            <select 
              className="task-selector-dropdown"
              value={selectedTaskId || ''}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedTaskId(value || undefined);
                updateFilter({
                  taskIds: value ? [value] : undefined
                });
              }}
              disabled={tasksLoading}
            >
              <option value="">All Executions</option>
              {tasks.map(task => (
                <option key={task.id} value={task.id}>
                  {task.name || `Task ${task.id}`} - {format(new Date(task.createdAt), 'dd/MM/yyyy HH:mm')}
                </option>
              ))}
            </select>
          </div>
          
          <div className="execution-logs-actions">
            <button 
              className="execution-logs-button"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FilterAltIcon /> Filters
            </button>
            <button className="execution-logs-button" onClick={refetch}>
              <RefreshIcon /> Refresh
            </button>
            <button 
              className="execution-logs-button danger"
              onClick={handleClearLogs}
            >
              <DeleteIcon /> Clear Logs
            </button>
          </div>
        </div>
      </motion.div>
      
      {/* Filters panel */}
      <div className={`filters-panel ${showFilters ? 'open' : 'closed'}`}>
        <div className="filters-form">
          <div className="filter-group">
            <label className="filter-label">Log Level</label>
            <select
              className="filter-select"
              value={filterLevel || ''}
              onChange={(e) => setFilterLevel(e.target.value || undefined)}
            >
              <option value="">All Levels</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Since</label>
            <input
              type="datetime-local"
              className="filter-input"
              value={filterSince ? filterSince.toISOString().slice(0, 16) : ''}
              onChange={(e) => setFilterSince(e.target.value ? new Date(e.target.value) : undefined)}
            />
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Until</label>
            <input
              type="datetime-local"
              className="filter-input"
              value={filterUntil ? filterUntil.toISOString().slice(0, 16) : ''}
              onChange={(e) => setFilterUntil(e.target.value ? new Date(e.target.value) : undefined)}
            />
          </div>
        </div>
        
        <div className="filters-actions">
          <button 
            className="execution-logs-button"
            onClick={handleResetFilters}
          >
            Reset
          </button>
          <button 
            className="execution-logs-button primary"
            onClick={handleApplyFilters}
          >
            Apply Filters
          </button>
        </div>
      </div>
      
      <motion.div 
        className="execution-logs-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flow-visualization">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-right"
          >
            <Controls />
            <MiniMap 
              nodeStrokeColor={(n) => {
                if (n.type === 'input') return '#0041d0';
                if (n.type === 'output') return '#ff0072';
                return '#1a192b';
              }}
              nodeColor={(n) => {
                if (n.type === 'input') return '#e6f7ff';
                if (n.type === 'output') return '#fff3e6';
                return '#f7f7f7';
              }}
            />
            <Background variant="dots" gap={12} size={1} />
            
            <Panel position="top-left" style={{ margin: '16px' }}>
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                style={{ 
                  background: 'white', 
                  padding: '10px 16px', 
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 500,
                  color: '#4a5568'
                }}
              >
                <AccountTreeIcon fontSize="small" style={{ color: '#6366f1' }} />
                <span>Execution Flow: {nodes.length} nodes</span>
              </motion.div>
            </Panel>
          </ReactFlow>
        </div>
        
        <AnimatePresence>
          {selectedNode && (
            <NodeDetailsPanel 
              node={selectedNode} 
              onClose={handleCloseDetails} 
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ExecutionLogsVisualizer;
