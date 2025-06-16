import React, { useState, useEffect, useCallback } from 'react';
import { useMetricsData } from '../hooks/useMetricsData';
import metricsApi from '../api/metricsApi';
import '../styles/MetricsPanel.css';

// Import chart libraries
// Note: In a real implementation, you would need to install these libraries:
// npm install recharts react-datepicker

// For now, we'll use mock components for the charts
const LineChart = ({ data, dataKey, xAxisKey, name }) => (
  <div className="chart-container">
    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
      Line Chart: {name} (Mock)
    </div>
  </div>
);

const BarChart = ({ data, dataKey, xAxisKey, name }) => (
  <div className="chart-container">
    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
      Bar Chart: {name} (Mock)
    </div>
  </div>
);

const PieChart = ({ data, dataKey, nameKey, name }) => (
  <div className="chart-container">
    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
      Pie Chart: {name} (Mock)
    </div>
  </div>
);

const DateRangePicker = ({ onChange, startDate, endDate }) => (
  <div className="date-range-picker">
    <label>Date Range:</label>
    <div className="date-inputs">
      <input type="date" value={startDate || ''} onChange={(e) => onChange({ start: e.target.value, end: endDate })} />
      <span>to</span>
      <input type="date" value={endDate || ''} onChange={(e) => onChange({ start: startDate, end: e.target.value })} />
    </div>
  </div>
);

/**
 * MetricsPanel component
 * Displays detailed metrics for a flow
 */
const MetricsPanel = ({ flowId, filter, onFilterChange, onDateRangeChange, dateRange }) => {
  const { data, loading, error, refetch } = useMetricsData(flowId, filter);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [executionDetails, setExecutionDetails] = useState(null);
  const [executionLoading, setExecutionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [comparisonData, setComparisonData] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  // Fetch execution details when an execution is selected
  const fetchExecutionDetails = useCallback(async (executionId) => {
    if (!executionId) return;
    
    setExecutionLoading(true);
    try {
      const details = await metricsApi.getExecutionDetails(executionId);
      setExecutionDetails(details);
    } catch (err) {
      console.error('Error fetching execution details:', err);
    } finally {
      setExecutionLoading(false);
    }
  }, []);

  // Fetch flow comparison data
  const fetchComparisonData = useCallback(async () => {
    setComparisonLoading(true);
    try {
      const data = await metricsApi.getFlowComparison();
      setComparisonData(data);
    } catch (err) {
      console.error('Error fetching flow comparison data:', err);
    } finally {
      setComparisonLoading(false);
    }
  }, []);

  // Fetch comparison data on mount
  useEffect(() => {
    fetchComparisonData();
  }, [fetchComparisonData]);

  // Fetch execution details when selected execution changes
  useEffect(() => {
    if (selectedExecution) {
      fetchExecutionDetails(selectedExecution);
    } else {
      setExecutionDetails(null);
    }
  }, [selectedExecution, fetchExecutionDetails]);

  // Handle execution selection
  const handleExecutionSelect = (executionId) => {
    setSelectedExecution(executionId === selectedExecution ? null : executionId);
  };

  // Handle export to CSV
  const handleExportCsv = async () => {
    try {
      const blob = await metricsApi.exportMetricsAsCsv(flowId, filter);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flow-metrics-${flowId}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting metrics data:', err);
    }
  };

  // Format time in milliseconds to a readable format
  const formatTime = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Format date to a readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get color for node type
  const getNodeTypeColor = (nodeType) => {
    const colors = {
      apiNode: '#3498db',
      conditionNode: '#2ecc71',
      textNode: '#9b59b6',
      sendingMailNode: '#e74c3c',
      conditionalFlowNode: '#f1c40f',
      endNode: '#34495e',
      default: '#95a5a6'
    };
    return colors[nodeType] || colors.default;
  };

  // Get badge class based on success rate
  const getSuccessRateBadgeClass = (rate) => {
    if (rate >= 0.95) return 'metrics-badge-success';
    if (rate >= 0.85) return 'metrics-badge-warning';
    return 'metrics-badge-error';
  };

  // Render loading state
  if (loading) {
    return (
      <div className="metrics-panel">
        <div className="metrics-content">
          <div className="metrics-empty-state">
            <div className="metrics-empty-state-icon">⏳</div>
            <h3 className="metrics-empty-state-title">Loading Metrics Data</h3>
            <p className="metrics-empty-state-description">
              Please wait while we fetch the metrics data for this flow.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="metrics-panel">
        <div className="metrics-content">
          <div className="metrics-empty-state">
            <div className="metrics-empty-state-icon">❌</div>
            <h3 className="metrics-empty-state-title">Error Loading Metrics</h3>
            <p className="metrics-empty-state-description">
              {error}
            </p>
            <button onClick={refetch} className="btn btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render empty state if no data
  if (!data) {
    return (
      <div className="metrics-panel">
        <div className="metrics-content">
          <div className="metrics-empty-state">
            <div className="metrics-empty-state-icon">📊</div>
            <h3 className="metrics-empty-state-title">No Metrics Data Available</h3>
            <p className="metrics-empty-state-description">
              There is no metrics data available for this flow yet. Run the flow to generate metrics.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="metrics-panel">
      <div className="metrics-header">
        <h2>Flow Metrics Dashboard</h2>
        <div className="metrics-actions">
          <button onClick={refetch} className="btn btn-secondary">
            Refresh
          </button>
          <button onClick={handleExportCsv} className="btn btn-primary">
            Export CSV
          </button>
        </div>
      </div>

      <div className="metrics-filter">
        <div className="metrics-filter-item">
          <DateRangePicker
            onChange={onDateRangeChange}
            startDate={dateRange.start}
            endDate={dateRange.end}
          />
        </div>
        <div className="metrics-filter-item">
          <label>Status:</label>
          <select
            value={filter.status || ''}
            onChange={(e) => onFilterChange({ status: e.target.value })}
          >
            <option value="">All</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>
        </div>
        <div className="metrics-filter-item">
          <label>Task Type:</label>
          <select
            value={filter.taskType || ''}
            onChange={(e) => onFilterChange({ taskType: e.target.value })}
          >
            <option value="">All</option>
            <option value="emailProcessing">Email Processing</option>
            <option value="dataSync">Data Sync</option>
            <option value="notification">Notification</option>
          </select>
        </div>
      </div>

      <div className="metrics-tabs">
        <div className="tabs-header">
          <button
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab-button ${activeTab === 'executions' ? 'active' : ''}`}
            onClick={() => setActiveTab('executions')}
          >
            Executions
          </button>
          <button
            className={`tab-button ${activeTab === 'nodes' ? 'active' : ''}`}
            onClick={() => setActiveTab('nodes')}
          >
            Node Performance
          </button>
          <button
            className={`tab-button ${activeTab === 'comparison' ? 'active' : ''}`}
            onClick={() => setActiveTab('comparison')}
          >
            Flow Comparison
          </button>
        </div>

        <div className="metrics-tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="metrics-summary">
                <div className="summary-item">
                  <div className="summary-item-title">Total Executions</div>
                  <div className="summary-item-value">{data.summary.totalExecutions}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-item-title">Average Execution Time</div>
                  <div className="summary-item-value">{formatTime(data.summary.avgExecutionTime)}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-item-title">Success Rate</div>
                  <div className="summary-item-value">{(data.summary.successRate * 100).toFixed(1)}%</div>
                  <div className="summary-item-subtitle">
                    {data.summary.totalExecutions} executions
                  </div>
                </div>
                <div className="summary-item">
                  <div className="summary-item-title">Failure Rate</div>
                  <div className="summary-item-value">{(data.summary.failureRate * 100).toFixed(1)}%</div>
                  <div className="summary-item-subtitle">
                    {Math.round(data.summary.totalExecutions * data.summary.failureRate)} failures
                  </div>
                </div>
              </div>

              <div className="metrics-card">
                <div className="metrics-card-header">
                  <h3>Execution Time Trend</h3>
                </div>
                <div className="metrics-card-content">
                  <LineChart
                    data={data.historicalData}
                    dataKey="avgExecutionTime"
                    xAxisKey="date"
                    name="Average Execution Time (ms)"
                  />
                </div>
              </div>

              <div className="metrics-card">
                <div className="metrics-card-header">
                  <h3>Execution Count by Day</h3>
                </div>
                <div className="metrics-card-content">
                  <BarChart
                    data={data.historicalData}
                    dataKey="executionCount"
                    xAxisKey="date"
                    name="Execution Count"
                  />
                </div>
              </div>

              <div className="metrics-card">
                <div className="metrics-card-header">
                  <h3>Node Type Distribution</h3>
                </div>
                <div className="metrics-card-content">
                  <PieChart
                    data={data.nodeTypeDistribution}
                    dataKey="count"
                    nameKey="type"
                    name="Node Type Distribution"
                  />
                </div>
              </div>

              <div className="metrics-card">
                <div className="metrics-card-header">
                  <h3>Error Distribution</h3>
                </div>
                <div className="metrics-card-content">
                  <PieChart
                    data={data.errorDistribution}
                    dataKey="count"
                    nameKey="type"
                    name="Error Distribution"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'executions' && (
            <div className="executions-tab">
              <div className="metrics-card">
                <div className="metrics-card-header">
                  <h3>Recent Executions</h3>
                </div>
                <div className="metrics-card-content">
                  {data.recentExecutions.map((execution) => (
                    <div
                      key={execution.id}
                      className="metrics-execution-item"
                    >
                      <div
                        className="metrics-execution-header"
                        onClick={() => handleExecutionSelect(execution.id)}
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
                            {execution.success ? 'Success' : 'Failed'}
                          </span>
                        </div>
                      </div>
                      {selectedExecution === execution.id && (
                        <div className="metrics-execution-content">
                          {executionLoading ? (
                            <div className="loading-indicator">Loading details...</div>
                          ) : executionDetails ? (
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
                                  <div key={node.nodeId} className="metrics-node-item">
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
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="no-details">No details available</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'nodes' && (
            <div className="nodes-tab">
              <div className="metrics-card">
                <div className="metrics-card-header">
                  <h3>Node Execution Times</h3>
                </div>
                <div className="metrics-card-content">
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
                      {data.nodeExecutionTimes.map((node) => (
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
                </div>
              </div>

              <div className="metrics-card">
                <div className="metrics-card-header">
                  <h3>Node Type Performance</h3>
                </div>
                <div className="metrics-card-content">
                  <BarChart
                    data={data.nodeTypeDistribution}
                    dataKey="avgExecutionTime"
                    xAxisKey="type"
                    name="Average Execution Time by Node Type (ms)"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comparison' && (
            <div className="comparison-tab">
              <div className="metrics-card">
                <div className="metrics-card-header">
                  <h3>Flow Comparison</h3>
                </div>
                <div className="metrics-card-content">
                  {comparisonLoading ? (
                    <div className="loading-indicator">Loading comparison data...</div>
                  ) : comparisonData ? (
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
                        {comparisonData.map((flow) => (
                          <tr
                            key={flow.flowId}
                            className={flow.flowId === flowId ? 'current-flow' : ''}
                          >
                            <td>
                              {flow.name}
                              {flow.flowId === flowId && (
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
                  ) : (
                    <div className="no-data">No comparison data available</div>
                  )}
                </div>
              </div>

              <div className="metrics-card">
                <div className="metrics-card-header">
                  <h3>Execution Time Comparison</h3>
                </div>
                <div className="metrics-card-content">
                  <BarChart
                    data={comparisonData || []}
                    dataKey="avgExecutionTime"
                    xAxisKey="name"
                    name="Average Execution Time (ms)"
                  />
                </div>
              </div>

              <div className="metrics-card">
                <div className="metrics-card-header">
                  <h3>Success Rate Comparison</h3>
                </div>
                <div className="metrics-card-content">
                  <BarChart
                    data={comparisonData || []}
                    dataKey="successRate"
                    xAxisKey="name"
                    name="Success Rate"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricsPanel;
