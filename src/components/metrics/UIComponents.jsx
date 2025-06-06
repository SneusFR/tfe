import React from 'react';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { slideUp } from './animations';

// Material UI Icons
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

/**
 * Modern DateRangePicker component
 */
export const ModernDateRangePicker = ({ onChange, startDate, endDate }) => {
  return (
    <div className="filter-group">
      <label className="filter-label">Date Range</label>
      <div className="date-range-picker">
        <DatePicker
          selected={startDate ? new Date(startDate) : null}
          onChange={(date) => onChange({ start: date?.toISOString().split('T')[0], end: endDate })}
          placeholderText="Start Date"
          className="date-input"
          dateFormat="yyyy-MM-dd"
        />
        <span>to</span>
        <DatePicker
          selected={endDate ? new Date(endDate) : null}
          onChange={(date) => onChange({ start: startDate, end: date?.toISOString().split('T')[0] })}
          placeholderText="End Date"
          className="date-input"
          dateFormat="yyyy-MM-dd"
          minDate={startDate ? new Date(startDate) : null}
        />
      </div>
    </div>
  );
};

/**
 * SummaryCard component for displaying metric summaries
 */
export const SummaryCard = ({ title, value, subtitle, accentColor, trend }) => {
  return (
    <motion.div 
      className="summary-card"
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      variants={slideUp}
    >
      <div className={`summary-card-accent accent-${accentColor}`}></div>
      <div className="summary-card-title">{title}</div>
      <div className="summary-card-value">{value}</div>
      {subtitle && (
        <div className="summary-card-subtitle">
          {trend && trend > 0 ? (
            <TrendingUpIcon fontSize="small" className="trend-up" />
          ) : trend && trend < 0 ? (
            <TrendingDownIcon fontSize="small" className="trend-down" />
          ) : null}
          {subtitle}
        </div>
      )}
    </motion.div>
  );
};

/**
 * MetricsCard component for wrapping chart content
 */
export const MetricsCard = ({ title, icon, children, variants }) => {
  return (
    <motion.div 
      className="metrics-card"
      variants={variants}
    >
      <div className="metrics-card-header">
        <h3 className="metrics-card-title">
          {icon && React.cloneElement(icon, { style: { marginRight: '0.5rem', verticalAlign: 'middle' } })}
          {title}
        </h3>
      </div>
      <div className="metrics-card-content">
        {children}
      </div>
    </motion.div>
  );
};

/**
 * TabButton component for tab navigation
 */
export const TabButton = ({ active, onClick, icon, children }) => {
  return (
    <button
      className={`tab-button ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {icon && React.cloneElement(icon, { fontSize: "small", style: { marginRight: '0.5rem' } })}
      {children}
    </button>
  );
};

/**
 * EmptyState component for displaying empty/loading/error states
 */
export const EmptyState = ({ icon, title, description, action, variants }) => {
  return (
    <motion.div 
      className="metrics-empty-state"
      initial="hidden"
      animate="visible"
      variants={variants}
    >
      {icon && React.cloneElement(icon, { style: { fontSize: '3rem', marginBottom: '1rem' } })}
      <h3 className="metrics-empty-state-title">{title}</h3>
      <p className="metrics-empty-state-description">
        {description}
      </p>
      {action}
    </motion.div>
  );
};
