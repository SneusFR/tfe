import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTime, formatDate, getNodeTypeColor, getSuccessRateBadgeClass } from './animations';

// Material UI Icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

/**
 * ExecutionItem component for displaying execution details
 */
export const ExecutionItem = ({ execution, selectedExecution, onSelect, executionDetails, executionLoading }) => {
  const isSelected = selectedExecution === execution.id;

  return (
    <motion.div 
      className="metrics-execution-item"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="metrics-execution-header"
        onClick={() => onSelect(execution.id)}
      >
        <div className="execution-info">
          <span className="execution-id">{execution.id}</span>
          <span className="execution-timestamp">
            {formatDate(execution.timestamp)}
          </span>
        </div>
        <div className="execution-stats">
          <span className="execution-time">
            {formatTime(execution.executionTime)}
          </span>
          <span
            className={`metrics-badge ${
              execution.success
                ? 'metrics-badge-success'
                : 'metrics-badge-error'
            }`}
          >
            {execution.success ? (
              <><CheckCircleIcon fontSize="small" style={{ marginRight: '4px' }} /> Success</>
            ) : (
              <><ErrorIcon fontSize="small" style={{ marginRight: '4px' }} /> Failed</>
            )}
          </span>
          <ExpandMoreIcon 
            style={{ 
              transform: isSelected ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease'
            }} 
          />
        </div>
      </div>
      
      <AnimatePresence>
        {isSelected && (
          <motion.div 
            className="metrics-execution-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {executionLoading ? (
              <div className="loading-indicator">
                <div className="loading-spinner"></div>
                Loading details...
              </div>
            ) : executionDetails ? (
              <ExecutionDetails 
                executionDetails={executionDetails} 
              />
            ) : (
              <div className="no-details">No details available</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * ExecutionDetails component for displaying detailed execution information
 */
export const ExecutionDetails = ({ executionDetails }) => {
  return (
    <div className="execution-details">
      <div className="execution-details-header">
        <h4>Execution Details</h4>
        <div className="execution-meta">
          <div>Task ID: {executionDetails.taskId}</div>
          <div>Task Type: {executionDetails.taskType}</div>
        </div>
      </div>
      <div className="execution-nodes">
        <h5>Node Performance</h5>
        {executionDetails.nodeMetrics.map((node) => (
          <NodeMetricItem key={node.nodeId} node={node} />
        ))}
      </div>
    </div>
  );
};

/**
 * NodeMetricItem component for displaying node metrics in execution details
 */
export const NodeMetricItem = ({ node }) => {
  return (
    <div className="metrics-node-item">
      <div className="metrics-node-label">
        <div
          className="metrics-node-icon"
          style={{
            backgroundColor: getNodeTypeColor(node.nodeType),
          }}
        >
          {node.nodeType.charAt(0).toUpperCase()}
        </div>
        <div className="metrics-node-name">{node.label}</div>
      </div>
      <div className="metrics-node-stats">
        <div className="metrics-node-time">
          {formatTime(node.actualTime)}
        </div>
        <div
          className={`metrics-badge ${getSuccessRateBadgeClass(
            node.successRate
          )}`}
        >
          {(node.successRate * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
};

/**
 * NodeExecutionTable component for displaying node execution times
 */
export const NodeExecutionTable = ({ nodes }) => {
  return (
    <table className="metrics-table">
      <thead>
        <tr>
          <th>Node</th>
          <th>Type</th>
          <th>Avg Time</th>
          <th>Min Time</th>
          <th>Max Time</th>
          <th>Success Rate</th>
        </tr>
      </thead>
      <tbody>
        {nodes.map((node) => (
          <tr key={node.nodeId}>
            <td>{node.label}</td>
            <td>{node.nodeType}</td>
            <td>{formatTime(node.avgTime)}</td>
            <td>{formatTime(node.minTime)}</td>
            <td>{formatTime(node.maxTime)}</td>
            <td>
              <span
                className={`metrics-badge ${getSuccessRateBadgeClass(
                  node.successRate
                )}`}
              >
                {(node.successRate * 100).toFixed(0)}%
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/**
 * FlowComparisonTable component for displaying flow comparison data
 */
export const FlowComparisonTable = ({ data, currentFlowId }) => {
  return (
    <table className="metrics-table">
      <thead>
        <tr>
          <th>Flow Name</th>
          <th>Avg Execution Time</th>
          <th>Execution Count</th>
          <th>Success Rate</th>
        </tr>
      </thead>
      <tbody>
        {data.map((flow) => (
          <tr
            key={flow.flowId}
            className={flow.flowId === currentFlowId ? 'current-flow' : ''}
          >
            <td>
              {flow.name}
              {flow.flowId === currentFlowId && (
                <span className="metrics-badge metrics-badge-info">
                  Current
                </span>
              )}
            </td>
            <td>{formatTime(flow.avgExecutionTime)}</td>
            <td>{flow.executionCount}</td>
            <td>
              <span
                className={`metrics-badge ${getSuccessRateBadgeClass(
                  flow.successRate
                )}`}
              >
                {(flow.successRate * 100).toFixed(0)}%
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
