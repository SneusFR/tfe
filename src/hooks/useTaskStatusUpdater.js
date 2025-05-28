import { useEffect, useRef, useCallback } from 'react';
import taskStore from '../store/taskStore';

/**
 * Hook personnalisé pour surveiller et mettre à jour automatiquement le statut des tâches
 * Rafraîchit les tâches lorsqu'une tâche en cours d'exécution se termine
 */
const useTaskStatusUpdater = (tasks, setTasks, currentFlowId, runningTask) => {
  const previousRunningTaskRef = useRef(null);
  const refreshTimeoutRef = useRef(null);

  // Fonction pour rafraîchir les tâches depuis le backend
  const refreshTasks = useCallback(async () => {
    if (!currentFlowId) return;
    
    try {
      console.log('🔄 [TASK STATUS UPDATER] Refreshing tasks after execution completion');
      const updatedTasks = await taskStore.getAllTasks({ forceRefresh: true }, { id: currentFlowId });
      setTasks(updatedTasks);
    } catch (error) {
      console.error('❌ [TASK STATUS UPDATER] Error refreshing tasks:', error);
    }
  }, [currentFlowId, setTasks]);

  // Surveiller les changements de statut des tâches en cours d'exécution
  useEffect(() => {
    const previousRunningTask = previousRunningTaskRef.current;
    
    // Si une tâche était en cours et n'est plus en cours (terminée)
    if (previousRunningTask && !runningTask) {
      console.log(`✅ [TASK STATUS UPDATER] Task ${previousRunningTask} completed, refreshing immediately`);
      
      // Nettoyer le timeout précédent s'il existe
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      // Rafraîchir immédiatement sans délai
      refreshTasks();
    }
    
    // Mettre à jour la référence
    previousRunningTaskRef.current = runningTask;
  }, [runningTask, refreshTasks]);

  // Surveiller les changements de statut des tâches individuelles
  useEffect(() => {
    if (!tasks || tasks.length === 0 || !currentFlowId) return;

    // Vérifier s'il y a des tâches qui pourraient avoir changé de statut
    const runningTasks = tasks.filter(task => 
      task.status === 'running' || 
      task.status === 'in_progress' || 
      task.status === 'executing'
    );

    if (runningTasks.length > 0) {
      console.log(`🔍 [TASK STATUS UPDATER] Found ${runningTasks.length} running tasks, setting up monitoring`);
      
      // Programmer une vérification périodique pour les tâches en cours
      const intervalId = setInterval(async () => {
        try {
          const statusCheck = await taskStore.checkRunningTasksStatus({ id: currentFlowId });
          
          if (statusCheck.statusChanged) {
            console.log('📊 [TASK STATUS UPDATER] Task status changes detected, updating tasks');
            setTasks(statusCheck.tasks);
          }
          
          // Si plus de tâches en cours, arrêter la surveillance
          if (!statusCheck.hasRunningTasks) {
            console.log('✅ [TASK STATUS UPDATER] No more running tasks, stopping monitoring');
            clearInterval(intervalId);
          }
        } catch (error) {
          console.error('❌ [TASK STATUS UPDATER] Error checking task status:', error);
        }
      }, 3000); // Vérifier toutes les 3 secondes pour une meilleure réactivité

      // Nettoyer l'intervalle après 5 minutes maximum
      const cleanupTimeoutId = setTimeout(() => {
        clearInterval(intervalId);
        console.log('⏰ [TASK STATUS UPDATER] Stopped monitoring after timeout');
      }, 300000); // 5 minutes

      return () => {
        clearInterval(intervalId);
        clearTimeout(cleanupTimeoutId);
      };
    }
  }, [tasks, currentFlowId, setTasks]);

  // Nettoyer les timeouts lors du démontage du composant
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Fonction utilitaire pour forcer un rafraîchissement manuel
  const forceRefresh = useCallback(async () => {
    console.log('🔄 [TASK STATUS UPDATER] Manual refresh triggered');
    await refreshTasks();
  }, [refreshTasks]);

  return {
    forceRefresh
  };
};

export default useTaskStatusUpdater;
