import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { 
  fetchExecutionLogs,
  deleteExecutionLogs
} from '../api/executionLogs.js';

/**
 * Custom hook to manage execution logs with filtering and pagination
 * @param initialFilter - Initial filter parameters
 * @param initialPageState - Initial pagination state
 * @returns Logs data, loading state, error state, and utility functions
 */
export const useExecutionLogs = (
  initialFilter,
  initialPageState
) => {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState(initialFilter);
  const [pageState, setPageState] = useState(initialPageState);

  /* NEW : quand initialFilter change (flowId enfin connu) on le pousse
     dans le state interne et on remet la pagination à 1. */
  useEffect(() => {
    setFilter(initialFilter);
    setPageState(ps => ({ ...ps, page: 1 }));
  }, [initialFilter]);         // ← dépendance indispensable
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { showToast } = useToast();
  const navigate = useNavigate();

  /**
   * Fetch logs based on current filter and page state
   */
  const fetchLogs = useCallback(async () => {
    if (!filter.flowId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchExecutionLogs(filter, pageState);
      setLogs(response.data);
      
      // Only update pageState.total if it has changed to avoid infinite render loops
      if (response.total !== pageState.total) {
        setPageState(prev => ({
          ...prev,
          total: response.total
        }));
      }
    } catch (err) {
      // Handle different error types
      if (err.message.includes('Unauthorized')) {
        // Unauthorized - redirect to login
        navigate('/login');
      } else if (err.message.includes('Access forbidden')) {
        // Forbidden - show toast
        showToast('Accès interdit', 'error');
        setError('Vous n\'avez pas les droits nécessaires pour accéder à ces logs');
      } else {
        // Other API errors
        setError(err.message || 'Erreur lors du chargement des logs');
        showToast('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [filter, pageState, navigate, showToast]);

  /**
   * Update filter and reset to page 1
   * @param newFilter - New filter parameters
   */
  const updateFilter = useCallback((newFilter) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
    // Reset to page 1 when filter changes
    setPageState(prev => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Update page state
   * @param newPageState - New page state
   */
  const updatePageState = useCallback((newPageState) => {
    setPageState(prev => ({ ...prev, ...newPageState }));
  }, []);

  /**
   * Set page number
   * @param page - Page number
   */
  const setPage = useCallback((page) => {
    updatePageState({ page });
  }, [updatePageState]);

  /**
   * Delete logs based on criteria
   * @param criteria - Deletion criteria
   */
  const deleteLogs = useCallback(async (criteria) => {
    setLoading(true);
    setError(null);
    
    try {
      await deleteExecutionLogs(criteria);
      showToast('Logs supprimés avec succès', 'success');
      
      // Refresh logs after deletion (reset to page 1)
      setPageState(prev => ({ ...prev, page: 1 }));
      fetchLogs();
    } catch (err) {
      if (err.message.includes('Unauthorized')) {
        navigate('/login');
      } else if (err.message.includes('Access forbidden')) {
        showToast('Accès interdit', 'error');
        setError('Vous n\'avez pas les droits nécessaires pour supprimer ces logs');
      } else {
        setError(err.message || 'Erreur lors de la suppression des logs');
        showToast('Erreur de suppression', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [fetchLogs, navigate, showToast]);

  // Fetch logs when filter or page state changes
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    pageState,
    loading,
    error,
    updateFilter,
    setPage,
    updatePageState,
    deleteLogs,
    refetch: fetchLogs
  };
};
