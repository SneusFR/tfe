import React from 'react';
import { motion } from 'framer-motion';
import { fadeIn, slideUp, formatTime } from './animations';
import { SummaryCard, MetricsCard } from './UIComponents';
import { LineChart, BarChart, PieChart } from './Charts';
import { ExecutionItem, NodeExecutionTable, FlowComparisonTable } from './ExecutionComponents';

// Material UI Icons
import TimelineIcon from '@mui/icons-material/Timeline';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

/**
 * OverviewTab component for displaying summary metrics and charts
 */
export const OverviewTab = ({ data }) => {
  return (
    <motion.div 
      key="overview"
      className="overview-tab"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0 }}
      variants={fadeIn}
    >
      {/* Summary Cards */}
      <motion.div 
        className="metrics-summary"
        variants={slideUp}
        initial="hidden"
        animate="visible"
      >
        <SummaryCard
          title="Total Executions"
          value={data.summary.totalExecutions}
          subtitle={`Last 30 days`}
          accentColor="primary"
        />
        <SummaryCard
          title="Average Execution Time"
          value={formatTime(data.summary.avgExecutionTime)}
          subtitle={`Across all executions`}
          accentColor="info"
        />
        <SummaryCard
          title="Success Rate"
          value={`${(data.summary.successRate * 100).toFixed(1)}%`}
          subtitle={`${data.summary.totalExecutions} executions`}
          accentColor="success"
          trend={0.05}
        />
        <SummaryCard
          title="Failure Rate"
          value={`${(data.summary.failureRate * 100).toFixed(1)}%`}
          subtitle={`${Math.round(data.summary.totalExecutions * data.summary.failureRate)} failures`}
          accentColor="danger"
          trend={-0.02}
        />
      </motion.div>

      {/* Charts */}
      <MetricsCard 
        title="Execution Time Trend" 
        icon={<TimelineIcon />}
        variants={slideUp}
      >
        <LineChart
          data={data.historicalData}
          dataKey="avgExecutionTime"
          xAxisKey="date"
          name="Average Execution Time (ms)"
        />
      </MetricsCard>

      <MetricsCard 
        title="Execution Count by Day" 
        icon={<BarChartIcon />}
        variants={slideUp}
      >
        <BarChart
          data={data.historicalData}
          dataKey="executionCount"
          xAxisKey="date"
          name="Execution Count"
        />
      </MetricsCard>

      {/* Distribution Charts */}
      <div className="metrics-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
        <MetricsCard 
          title="Node Type Distribution" 
          icon={<PieChartIcon />}
          variants={slideUp}
        >
          <PieChart
            data={data.nodeTypeDistribution}
            dataKey="count"
            nameKey="type"
            name="Node Type Distribution"
          />
        </MetricsCard>

        <MetricsCard 
          title="Error Distribution" 
          icon={<PieChartIcon />}
          variants={slideUp}
        >
          <PieChart
            data={data.errorDistribution}
            dataKey="count"
            nameKey="type"
            name="Error Distribution"
          />
        </MetricsCard>
      </div>
    </motion.div>
  );
};

/**
 * ExecutionsTab component for displaying execution history
 */
export const ExecutionsTab = ({ 
  data, 
  selectedExecution, 
  executionDetails, 
  executionLoading, 
  onExecutionSelect 
}) => {
  return (
    <motion.div 
      key="executions"
      className="executions-tab"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0 }}
      variants={fadeIn}
    >
      <MetricsCard 
        title="Recent Executions" 
        icon={<ScheduleIcon />}
        variants={slideUp}
      >
        {data.recentExecutions.map((execution) => (
          <ExecutionItem
            key={execution.id}
            execution={execution}
            selectedExecution={selectedExecution}
            onSelect={onExecutionSelect}
            executionDetails={executionDetails}
            executionLoading={executionLoading}
          />
        ))}
      </MetricsCard>
    </motion.div>
  );
};

/**
 * NodesTab component for displaying node performance metrics
 */
export const NodesTab = ({ data }) => {
  return (
    <motion.div 
      key="nodes"
      className="nodes-tab"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0 }}
      variants={fadeIn}
    >
      <MetricsCard 
        title="Node Execution Times" 
        icon={<TimelineIcon />}
        variants={slideUp}
      >
        <NodeExecutionTable nodes={data.nodeExecutionTimes} />
      </MetricsCard>

      <MetricsCard 
        title="Node Type Performance" 
        icon={<BarChartIcon />}
        variants={slideUp}
      >
        <BarChart
          data={data.nodeTypeDistribution}
          dataKey="avgExecutionTime"
          xAxisKey="type"
          name="Average Execution Time by Node Type (ms)"
        />
      </MetricsCard>
    </motion.div>
  );
};

/**
 * ComparisonTab component for comparing flow metrics
 */
export const ComparisonTab = ({ 
  flowId, 
  comparisonData, 
  comparisonLoading 
}) => {
  return (
    <motion.div 
      key="comparison"
      className="comparison-tab"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0 }}
      variants={fadeIn}
    >
      <MetricsCard 
        title="Flow Comparison" 
        icon={<CompareArrowsIcon />}
        variants={slideUp}
      >
        {comparisonLoading ? (
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            Loading comparison data...
          </div>
        ) : comparisonData ? (
          <FlowComparisonTable data={comparisonData} currentFlowId={flowId} />
        ) : (
          <div className="no-data">
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              Error loading comparison data. Please try refreshing the page.
            </div>
          </div>
        )}
      </MetricsCard>

      {comparisonData && comparisonData.length > 0 && (
        <div className="metrics-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
          <MetricsCard 
            title="Execution Time Comparison" 
            icon={<BarChartIcon />}
            variants={slideUp}
          >
            <BarChart
              data={comparisonData}
              dataKey="avgExecutionTime"
              xAxisKey="name"
              name="Average Execution Time (ms)"
            />
          </MetricsCard>

          <MetricsCard 
            title="Success Rate Comparison" 
            icon={<BarChartIcon />}
            variants={slideUp}
          >
            <BarChart
              data={comparisonData}
              dataKey="successRate"
              xAxisKey="name"
              name="Success Rate"
            />
          </MetricsCard>
        </div>
      )}
    </motion.div>
  );
};
