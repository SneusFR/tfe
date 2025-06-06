import axios from 'axios';

/**
 * API service for metrics data
 * This service provides methods to fetch metrics data from the backend
 */
const metricsApi = {
  /**
   * Fetch metrics data for a flow
   * @param {string} flowId - The ID of the flow to fetch metrics for
   * @param {Object} filter - Filter parameters for the metrics data
   * @returns {Promise<Object>} - The metrics data
   */
  getFlowMetrics: async (flowId, filter = {}) => {
    try {
      // Make a real API call to the backend
      const response = await axios.get(`/api/metrics/flows/${flowId}`, { params: filter });
      return response.data;
    } catch (error) {
      console.error('Error fetching metrics data:', error);
      console.warn('Falling back to mock data due to API error');
      // Fallback to mock data if the API call fails
      return generateMockMetricsData(flowId);
    }
  },
  
  /**
   * Fetch execution details for a specific execution
   * @param {string} executionId - The ID of the execution to fetch details for
   * @returns {Promise<Object>} - The execution details
   */
  getExecutionDetails: async (executionId) => {
    try {
      // Make a real API call to the backend
      const response = await axios.get(`/api/metrics/tasks/${executionId}/execution`);
      return response.data;
    } catch (error) {
      console.error('Error fetching execution details:', error);
      console.warn('Falling back to mock execution details due to API error');
      // Fallback to mock data if the API call fails
      return {
        id: executionId,
        timestamp: new Date().toISOString(),
        executionTime: 680,
        success: true,
        taskId: `task-${1000}`,
        taskType: 'emailProcessing',
        nodeMetrics: [
          { nodeId: 'condition-1', nodeType: 'conditionNode', label: 'Email Received', avgTime: 15, minTime: 10, maxTime: 25, successRate: 0.98, actualTime: 14 },
          { nodeId: 'api-1', nodeType: 'apiNode', label: 'Fetch Customer Data', avgTime: 120, minTime: 80, maxTime: 250, successRate: 0.95, actualTime: 130 },
          { nodeId: 'conditional-flow-1', nodeType: 'conditionalFlowNode', label: 'Check Customer Type', avgTime: 8, minTime: 5, maxTime: 15, successRate: 0.99, actualTime: 7 },
          { nodeId: 'text-1', nodeType: 'textNode', label: 'Prepare Email Content', avgTime: 5, minTime: 3, maxTime: 10, successRate: 1.0, actualTime: 4 },
          { nodeId: 'sending-mail-1', nodeType: 'sendingMailNode', label: 'Send Response Email', avgTime: 350, minTime: 200, maxTime: 800, successRate: 0.92, actualTime: 380 },
          { nodeId: 'api-2', nodeType: 'apiNode', label: 'Update CRM', avgTime: 180, minTime: 100, maxTime: 400, successRate: 0.94, actualTime: 160 },
          { nodeId: 'end-1', nodeType: 'endNode', label: 'End Process', avgTime: 3, minTime: 2, maxTime: 5, successRate: 1.0, actualTime: 3 },
        ]
      };
    }
  },
  
  /**
   * Fetch comparison data for flows
   * @returns {Promise<Array>} - The flow comparison data
   */
  getFlowComparison: async () => {
    try {
      // Make a real API call to the backend
      const response = await axios.post('/api/metrics/flows/compare', {
        flowIds: [], // Empty array to get all flows
        timeRange: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 30 days
          endDate: new Date().toISOString().split('T')[0]
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching flow comparison data:', error);
      console.warn('Falling back to mock comparison data due to API error');
      // Fallback to mock data if the API call fails
      return [
        { flowId: 'flow-1', name: 'Customer Onboarding', avgExecutionTime: 850, executionCount: 120, successRate: 0.94 },
        { flowId: 'flow-2', name: 'Support Ticket Processing', avgExecutionTime: 920, executionCount: 350, successRate: 0.91 },
        { flowId: 'flow-3', name: 'Email Response Automation', avgExecutionTime: 680, executionCount: 210, successRate: 0.96 },
        { flowId: 'flow-4', name: 'Order Fulfillment', avgExecutionTime: 1200, executionCount: 80, successRate: 0.89 },
        { flowId: 'flow-5', name: 'Lead Qualification', avgExecutionTime: 550, executionCount: 180, successRate: 0.97 },
      ];
    }
  },
  
  /**
   * Export metrics data as CSV
   * @param {string} flowId - The ID of the flow to export metrics for
   * @param {Object} filter - Filter parameters for the metrics data
   * @returns {Promise<Blob>} - The CSV file as a Blob
   */
  exportMetricsAsCsv: async (flowId, filter = {}) => {
    try {
      // Make a real API call to the backend
      const response = await axios.get(`/api/metrics/flows/${flowId}/export`, { 
        params: filter,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting metrics data:', error);
      console.warn('Falling back to mock CSV data due to API error');
      // Fallback to mock data if the API call fails
      const csvString = 'date,avgExecutionTime,executionCount,successRate\n' +
        '2023-01-01,750,12,0.95\n' +
        '2023-01-02,720,8,0.92\n' +
        '2023-01-03,680,15,0.97\n';
      
      // Convert the CSV string to a Blob
      return new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    }
  }
};

// Mock data generation function
const generateMockMetricsData = (flowId, refresh = false) => {
  // Generate random variation if refreshing
  const variation = refresh ? Math.random() * 0.3 - 0.15 : 0; // -15% to +15%
  
  // Generate execution times for nodes
  const nodeExecutionTimes = [
    { nodeId: 'condition-1', nodeType: 'conditionNode', label: 'Email Received', avgTime: 15 + variation * 15, minTime: 10, maxTime: 25, successRate: 0.98 },
    { nodeId: 'api-1', nodeType: 'apiNode', label: 'Fetch Customer Data', avgTime: 120 + variation * 120, minTime: 80, maxTime: 250, successRate: 0.95 },
    { nodeId: 'conditional-flow-1', nodeType: 'conditionalFlowNode', label: 'Check Customer Type', avgTime: 8 + variation * 8, minTime: 5, maxTime: 15, successRate: 0.99 },
    { nodeId: 'text-1', nodeType: 'textNode', label: 'Prepare Email Content', avgTime: 5 + variation * 5, minTime: 3, maxTime: 10, successRate: 1.0 },
    { nodeId: 'sending-mail-1', nodeType: 'sendingMailNode', label: 'Send Response Email', avgTime: 350 + variation * 350, minTime: 200, maxTime: 800, successRate: 0.92 },
    { nodeId: 'api-2', nodeType: 'apiNode', label: 'Update CRM', avgTime: 180 + variation * 180, minTime: 100, maxTime: 400, successRate: 0.94 },
    { nodeId: 'end-1', nodeType: 'endNode', label: 'End Process', avgTime: 3 + variation * 3, minTime: 2, maxTime: 5, successRate: 1.0 },
  ];
  
  // Generate historical execution data (last 30 days)
  const today = new Date();
  const historicalData = Array.from({ length: 30 }).map((_, i) => {
    const date = new Date();
    date.setDate(today.getDate() - (29 - i));
    
    // Add some randomness to the data
    const baseExecutionTime = 700 + variation * 700;
    const randomFactor = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
    const executionCount = Math.floor(5 + Math.random() * 10); // 5 to 15 executions per day
    
    return {
      date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      avgExecutionTime: Math.round(baseExecutionTime * randomFactor),
      executionCount,
      successRate: 0.85 + Math.random() * 0.15, // 85% to 100%
    };
  });
  
  // Generate flow comparison data
  const flowComparison = [
    { flowId: 'flow-1', name: 'Customer Onboarding', avgExecutionTime: 850 + variation * 850, executionCount: 120, successRate: 0.94 },
    { flowId: 'flow-2', name: 'Support Ticket Processing', avgExecutionTime: 920 + variation * 920, executionCount: 350, successRate: 0.91 },
    { flowId: flowId, name: 'Email Response Automation', avgExecutionTime: 680 + variation * 680, executionCount: 210, successRate: 0.96 },
    { flowId: 'flow-4', name: 'Order Fulfillment', avgExecutionTime: 1200 + variation * 1200, executionCount: 80, successRate: 0.89 },
    { flowId: 'flow-5', name: 'Lead Qualification', avgExecutionTime: 550 + variation * 550, executionCount: 180, successRate: 0.97 },
  ];
  
  // Generate recent executions data
  const recentExecutions = Array.from({ length: 10 }).map((_, i) => {
    const date = new Date();
    date.setMinutes(today.getMinutes() - i * 30);
    
    // Random execution time with some variation
    const baseTime = 680 + variation * 680;
    const executionTime = Math.round(baseTime * (0.8 + Math.random() * 0.4)); // 80% to 120% of base time
    
    // Random success/failure
    const success = Math.random() > 0.1; // 90% success rate
    
    return {
      id: `exec-${Date.now()}-${i}`,
      timestamp: date.toISOString(),
      executionTime,
      success,
      taskId: `task-${1000 + i}`,
      taskType: 'emailProcessing',
      nodeMetrics: nodeExecutionTimes.map(node => ({
        ...node,
        actualTime: Math.round(node.avgTime * (0.7 + Math.random() * 0.6)) // 70% to 130% of avg time
      }))
    };
  });
  
  // Generate node type distribution
  const nodeTypeDistribution = [
    { type: 'apiNode', count: 12, avgExecutionTime: 150 + variation * 150 },
    { type: 'conditionNode', count: 8, avgExecutionTime: 12 + variation * 12 },
    { type: 'textNode', count: 5, avgExecutionTime: 5 + variation * 5 },
    { type: 'sendingMailNode', count: 3, avgExecutionTime: 320 + variation * 320 },
    { type: 'conditionalFlowNode', count: 6, avgExecutionTime: 10 + variation * 10 },
    { type: 'endNode', count: 2, avgExecutionTime: 3 + variation * 3 },
  ];
  
  // Generate error distribution
  const errorDistribution = [
    { type: 'API Connection Error', count: 15, percentage: 45 },
    { type: 'Timeout', count: 8, percentage: 24 },
    { type: 'Data Validation Error', count: 6, percentage: 18 },
    { type: 'Authentication Error', count: 4, percentage: 12 },
    { type: 'Other', count: 1, percentage: 3 },
  ];
  
  // Return the complete metrics data object
  return {
    summary: {
      totalExecutions: 210,
      avgExecutionTime: 680 + variation * 680,
      successRate: 0.96,
      failureRate: 0.04,
      totalNodes: 36,
      totalEdges: 42,
    },
    nodeExecutionTimes,
    historicalData,
    flowComparison,
    recentExecutions,
    nodeTypeDistribution,
    errorDistribution,
  };
};

export default metricsApi;
