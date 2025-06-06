# Backend Metrics Implementation Guide

This document outlines the backend implementation needed to support the metrics functionality in the diagram editor.

## API Endpoints

The frontend metrics functionality requires the following API endpoints:

### 1. Get Flow Metrics

```
GET /api/metrics/flows/:flowId
```

**Parameters:**
- `flowId`: The ID of the flow to fetch metrics for
- Query parameters for filtering:
  - `startDate`: Start date for filtering metrics
  - `endDate`: End date for filtering metrics
  - `status`: Filter by execution status (success, failed)
  - `nodeTypes`: Filter by node types

**Response:**
```json
{
  "summary": {
    "totalExecutions": 128,
    "successRate": 0.945,
    "failureRate": 0.055,
    "avgExecutionTime": 1800,
    "totalNodes": 15
  },
  "historicalData": [
    {
      "date": "2025-05-01",
      "executionCount": 5,
      "successRate": 0.8,
      "avgExecutionTime": 1500
    },
    // More data points...
  ],
  "nodeExecutionTimes": [
    {
      "nodeId": "node1",
      "label": "API Request",
      "nodeType": "apiNode",
      "avgTime": 800,
      "minTime": 500,
      "maxTime": 1200,
      "successRate": 0.98
    },
    // More nodes...
  ],
  "nodeTypeDistribution": [
    {
      "type": "apiNode",
      "count": 5,
      "avgExecutionTime": 800
    },
    // More node types...
  ],
  "errorDistribution": [
    {
      "type": "API Error",
      "count": 4
    },
    // More error types...
  ],
  "recentExecutions": [
    {
      "id": "exec-123",
      "timestamp": "2025-06-05T12:34:56Z",
      "executionTime": 1800,
      "success": true,
      "taskId": "task-456",
      "taskType": "emailProcessing"
    },
    // More executions...
  ]
}
```

### 2. Get Execution Details

```
GET /api/metrics/tasks/:taskId/execution
```

**Parameters:**
- `taskId`: The ID of the task to fetch execution details for

**Response:**
```json
{
  "id": "exec-123",
  "taskId": "task-456",
  "taskType": "emailProcessing",
  "startTime": "2025-06-05T12:34:56Z",
  "endTime": "2025-06-05T12:34:58Z",
  "executionTime": 2000,
  "success": true,
  "nodeMetrics": [
    {
      "nodeId": "node1",
      "label": "Start",
      "nodeType": "conditionNode",
      "startTime": 0,
      "actualTime": 100,
      "successRate": 1.0
    },
    // More nodes...
  ]
}
```

### 3. Get Node Performance Metrics

```
GET /api/metrics/flows/:flowId/nodes
```

**Parameters:**
- `flowId`: The ID of the flow to fetch node metrics for
- Query parameters for filtering (same as Get Flow Metrics)

**Response:**
```json
[
  {
    "nodeId": "node1",
    "label": "API Request",
    "nodeType": "apiNode",
    "executionCount": 128,
    "avgTime": 800,
    "minTime": 500,
    "maxTime": 1200,
    "errorRate": 0.023,
    "successRate": 0.977
  },
  // More nodes...
]
```

### 4. Get Flow Comparison Data

```
POST /api/metrics/flows/compare
```

**Request Body:**
```json
{
  "flowIds": ["flow1", "flow2", "flow3"],
  "timeRange": {
    "startDate": "2025-05-01",
    "endDate": "2025-06-01"
  }
}
```

**Response:**
```json
[
  {
    "flowId": "flow1",
    "name": "Current Flow",
    "executionCount": 128,
    "avgExecutionTime": 1800,
    "successRate": 0.945
  },
  // More flows...
]
```

### 5. Get Historical Execution Data

```
GET /api/metrics/flows/:flowId/history
```

**Parameters:**
- `flowId`: The ID of the flow to fetch historical data for
- Query parameters for time range:
  - `startDate`: Start date for the time range
  - `endDate`: End date for the time range
  - `interval`: Interval for data points (day, week, month)

**Response:**
```json
[
  {
    "date": "2025-05-01",
    "executionCount": 5,
    "successRate": 0.8,
    "avgExecutionTime": 1500
  },
  // More data points...
]
```

### 6. Export Metrics as CSV

```
GET /api/metrics/flows/:flowId/export
```

**Parameters:**
- `flowId`: The ID of the flow to export metrics for
- Query parameters for filtering (same as Get Flow Metrics)

**Response:**
- CSV file download

## Database Schema

To support these metrics, the following database schema is recommended:

### ExecutionLog

```
{
  id: String,
  flowId: String,
  taskId: String,
  taskType: String,
  startTime: Date,
  endTime: Date,
  executionTime: Number,
  success: Boolean,
  error: String,
  nodeMetrics: [
    {
      nodeId: String,
      label: String,
      nodeType: String,
      startTime: Number,
      endTime: Number,
      executionTime: Number,
      success: Boolean,
      error: String
    }
  ]
}
```

### NodeMetrics

```
{
  nodeId: String,
  flowId: String,
  label: String,
  nodeType: String,
  executionCount: Number,
  totalExecutionTime: Number,
  minExecutionTime: Number,
  maxExecutionTime: Number,
  successCount: Number,
  failureCount: Number,
  lastUpdated: Date
}
```

## Implementation Notes

1. The ExecutionLog collection should be updated in real-time during flow execution.
2. The NodeMetrics collection can be updated either in real-time or through a scheduled job that aggregates data from the ExecutionLog collection.
3. For performance reasons, consider implementing caching for frequently accessed metrics data.
4. For large datasets, consider implementing pagination for the API endpoints.
5. Implement proper error handling and validation for all API endpoints.
6. Consider implementing rate limiting to prevent abuse of the API endpoints.
7. Ensure proper authentication and authorization for all API endpoints.

## Integration with Flow Execution Engine

The Flow Execution Engine should be modified to log execution metrics during flow execution. Here's a high-level overview of the changes needed:

1. Add logging at the start and end of flow execution to track execution time.
2. Add logging for each node execution to track node execution time.
3. Add error handling to log errors during flow execution.
4. Update the ExecutionLog collection with the execution metrics.
5. Optionally, update the NodeMetrics collection in real-time or schedule a job to update it periodically.

Example integration with the Flow Execution Engine:

```javascript
// In FlowExecutionEngine.js

async executeFlow(task) {
  const startTime = Date.now();
  const executionLog = {
    flowId: task.flow,
    taskId: task.id,
    taskType: task.type,
    startTime: new Date(startTime),
    nodeMetrics: []
  };
  
  try {
    // Execute the flow
    const result = await this.executeNode(startingNode, executionLog);
    
    // Update execution log
    const endTime = Date.now();
    executionLog.endTime = new Date(endTime);
    executionLog.executionTime = endTime - startTime;
    executionLog.success = true;
    
    // Save execution log
    await ExecutionLog.create(executionLog);
    
    return { success: true, result };
  } catch (error) {
    // Update execution log with error
    const endTime = Date.now();
    executionLog.endTime = new Date(endTime);
    executionLog.executionTime = endTime - startTime;
    executionLog.success = false;
    executionLog.error = error.message;
    
    // Save execution log
    await ExecutionLog.create(executionLog);
    
    return { success: false, error: error.message };
  }
}

async executeNode(node, executionLog) {
  const startTime = Date.now();
  const nodeMetric = {
    nodeId: node.id,
    label: node.data.label || node.type,
    nodeType: node.type,
    startTime: startTime - executionLog.startTime.getTime()
  };
  
  try {
    // Execute the node
    const result = await this.executeNodeByType(node);
    
    // Update node metric
    const endTime = Date.now();
    nodeMetric.endTime = endTime - executionLog.startTime.getTime();
    nodeMetric.executionTime = endTime - startTime;
    nodeMetric.success = true;
    
    // Add node metric to execution log
    executionLog.nodeMetrics.push(nodeMetric);
    
    return result;
  } catch (error) {
    // Update node metric with error
    const endTime = Date.now();
    nodeMetric.endTime = endTime - executionLog.startTime.getTime();
    nodeMetric.executionTime = endTime - startTime;
    nodeMetric.success = false;
    nodeMetric.error = error.message;
    
    // Add node metric to execution log
    executionLog.nodeMetrics.push(nodeMetric);
    
    throw error;
  }
}
```

This implementation guide provides a comprehensive overview of the backend changes needed to support the metrics functionality in the diagram editor. By following this guide, you can implement a robust metrics system that provides valuable insights into flow execution performance.
