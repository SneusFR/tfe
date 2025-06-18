import { useState, useEffect, useCallback } from 'react';
import metricsApi from '../services/metricsApi';

/**
 * Custom hook to fetch and manage metrics data for a flow
 * @param {string} flowId - The ID of the flow to fetch metrics for
 * @param {Object} filter - Filter parameters for the metrics data
 * @returns {Object} - The metrics data, loading state, error state, and refetch function
 */
export const useMetricsData = (flowId, filter = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to fetch metrics data from the backend
  const fetchMetricsData = useCallback(async () => {
    if (!flowId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use the metricsApi service to fetch the data
      const metricsData = await metricsApi.getFlowMetrics(flowId, filter);
      setData(metricsData);
    } catch (err) {
      console.error('Error fetching metrics data:', err);
      setError('Failed to load metrics data');
    } finally {
      setLoading(false);
    }
  }, [flowId, filter]);
  
  // Fetch metrics data on mount and when dependencies change
  useEffect(() => {
    fetchMetricsData();
  }, [fetchMetricsData]);
  
  // Function to manually refetch metrics data
  const refetch = useCallback(() => {
    fetchMetricsData();
  }, [fetchMetricsData]);
  
  return { data, loading, error, refetch };
};


export default useMetricsData;
