// Animation variants for Framer Motion
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

export const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Utility functions for metrics
export const formatTime = (ms) => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

export const getNodeTypeColor = (nodeType) => {
  const colors = {
    apiNode: '#3b82f6',
    conditionNode: '#10b981',
    textNode: '#8b5cf6',
    sendingMailNode: '#ef4444',
    conditionalFlowNode: '#f59e0b',
    endNode: '#4b5563',
    default: '#9ca3af'
  };
  return colors[nodeType] || colors.default;
};

export const getSuccessRateBadgeClass = (rate) => {
  if (rate >= 0.95) return 'metrics-badge-success';
  if (rate >= 0.85) return 'metrics-badge-warning';
  return 'metrics-badge-error';
};
