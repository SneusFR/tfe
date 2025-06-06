import React, { useState } from 'react';
import { useFlowManager } from '../context/FlowManagerContext';
import ModernMetricsPanel from './ModernMetricsPanel';
import { motion } from 'framer-motion';
import { fadeIn } from './metrics/animations';
import { EmptyState } from './metrics/UIComponents';
import InsertChartIcon from '@mui/icons-material/InsertChart';

/**
 * Wrapper component for the ModernMetricsPanel
 * This component handles the flow selection and passes the selected flow to the ModernMetricsPanel
 * with a modern, animated UI
 */
const MetricsPanelWrapper = () => {
  const { flows, currentFlowId } = useFlowManager();
  const [selectedFlowId, setSelectedFlowId] = useState(currentFlowId || '');
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [filter, setFilter] = useState({});

  // Handle flow selection change
  const handleFlowChange = (e) => {
    setSelectedFlowId(e.target.value);
  };

  // Handle date range change
  const handleDateRangeChange = (range) => {
    setDateRange(range);
    setFilter(prev => ({ ...prev, startDate: range.start, endDate: range.end }));
  };

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  };

  return (
    <motion.div 
      className="modern-metrics-container"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <div className="flow-selector-container">
        <div className="flow-selector-wrapper">
          <label htmlFor="flow-select" className="flow-select-label">
            <InsertChartIcon style={{ marginRight: '0.5rem' }} />
            Select Flow:
          </label>
          <select
            id="flow-select"
            value={selectedFlowId}
            onChange={handleFlowChange}
            className="flow-select-input"
          >
            <option value="">Select a flow</option>
            {flows.map((flow) => (
              <option key={flow.id} value={flow.id}>
                {flow.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedFlowId ? (
        <ModernMetricsPanel
          flowId={selectedFlowId}
          filter={filter}
          onFilterChange={handleFilterChange}
          onDateRangeChange={handleDateRangeChange}
          dateRange={dateRange}
        />
      ) : (
        <div className="modern-metrics-wrapper">
          <div className="modern-metrics-panel">
            <div className="metrics-content empty">
              <EmptyState
                icon={<InsertChartIcon />}
                title="No Flow Selected"
                description="Please select a flow from the dropdown above to view its metrics."
                variants={fadeIn}
              />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MetricsPanelWrapper;
