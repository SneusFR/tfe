import React, { useState, useEffect, useCallback } from 'react';
import { useMetricsData } from '../hooks/useMetricsData';
import { AnimatePresence, motion } from 'framer-motion';
import { fadeIn, staggerContainer } from './metrics/animations';
import { TabButton, ModernDateRangePicker, EmptyState } from './metrics/UIComponents';
import { OverviewTab, ExecutionsTab, NodesTab, ComparisonTab } from './metrics/TabComponents';
import metricsApi from '../api/metricsApi';
import '../styles/ModernMetricsPanel.css';

// Material UI Icons
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HistoryIcon from '@mui/icons-material/History';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InsertChartIcon from '@mui/icons-material/InsertChart';

/**
 * ModernMetricsPanel component
 * A modern, animated dashboard for displaying flow metrics
 */
const ModernMetricsPanel = ({ flowId, filter, onFilterChange, onDateRangeChange, dateRange }) => {
  const { data, loading, error, refetch } = useMetricsData(flowId, filter);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [executionDetails, setExecutionDetails] = useState(null);
  const [executionLoading, setExecutionLoading] = useState(false);
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

  // Render loading state
  if (loading) {
    return (
      <div className="modern-metrics-wrapper">
        <div className="modern-metrics-panel">
          <div className="metrics-content loading">
            <div className="loading-indicator">
              <div className="loading-spinner"></div>
              <span>Loading metrics data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="modern-metrics-wrapper">
        <div className="modern-metrics-panel">
          <div className="metrics-content error">
            <EmptyState
              icon={<ErrorOutlineIcon />}
              title="Error Loading Metrics"
              description={error}
              action={
                <button onClick={refetch} className="metrics-button">
                  Try Again
                </button>
              }
              variants={fadeIn}
            />
          </div>
        </div>
      </div>
    );
  }

  // Render empty state if no data
  if (!data) {
    return (
      <div className="modern-metrics-wrapper">
        <div className="modern-metrics-panel">
          <div className="metrics-content empty">
            <EmptyState
              icon={<InsertChartIcon />}
              title="No Metrics Data Available"
              description="There is no metrics data available for this flow yet. Run the flow to generate metrics."
              variants={fadeIn}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-metrics-wrapper">
      <div className="modern-metrics-panel">
        <motion.div 
          className="metrics-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2>Flow Metrics Dashboard</h2>
          <div className="metrics-actions">
            <button onClick={refetch} className="metrics-button">
              <RefreshIcon />
              Refresh
            </button>
            <button onClick={handleExportCsv} className="metrics-button">
              <FileDownloadIcon />
              Export CSV
            </button>
          </div>
        </motion.div>

        <motion.div 
          className="metrics-filters"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <ModernDateRangePicker
            onChange={onDateRangeChange}
            startDate={dateRange.start}
            endDate={dateRange.end}
          />
          
          <div className="filter-group">
            <label className="filter-label">Status</label>
            <select
              className="filter-select"
              value={filter.status || ''}
              onChange={(e) => onFilterChange({ status: e.target.value })}
            >
              <option value="">All</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Task Type</label>
            <select
              className="filter-select"
              value={filter.taskType || ''}
              onChange={(e) => onFilterChange({ taskType: e.target.value })}
            >
              <option value="">All</option>
              <option value="emailProcessing">Email Processing</option>
              <option value="dataSync">Data Sync</option>
              <option value="notification">Notification</option>
            </select>
          </div>
        </motion.div>

        <motion.div 
          className="metrics-tabs"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            icon={<DashboardIcon />}
          >
            Overview
          </TabButton>
          <TabButton
            active={activeTab === 'executions'}
            onClick={() => setActiveTab('executions')}
            icon={<HistoryIcon />}
          >
            Executions
          </TabButton>
          <TabButton
            active={activeTab === 'nodes'}
            onClick={() => setActiveTab('nodes')}
            icon={<DeviceHubIcon />}
          >
            Node Performance
          </TabButton>
          <TabButton
            active={activeTab === 'comparison'}
            onClick={() => setActiveTab('comparison')}
            icon={<CompareArrowsIcon />}
          >
            Flow Comparison
          </TabButton>
        </motion.div>

        <div className="metrics-content">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <OverviewTab key="overview" data={data} />
            )}
            
            {activeTab === 'executions' && (
              <ExecutionsTab
                key="executions"
                data={data}
                selectedExecution={selectedExecution}
                executionDetails={executionDetails}
                executionLoading={executionLoading}
                onExecutionSelect={handleExecutionSelect}
              />
            )}
            
            {activeTab === 'nodes' && (
              <NodesTab key="nodes" data={data} />
            )}
            
            {activeTab === 'comparison' && (
              <ComparisonTab
                key="comparison"
                flowId={flowId}
                comparisonData={comparisonData}
                comparisonLoading={comparisonLoading}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ModernMetricsPanel;
