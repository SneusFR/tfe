import { useState, useEffect, useCallback } from 'react';
import { useFlowManager } from '../context/FlowManagerContext';
import { useAuth } from '../context/AuthContext';
import collaborationStore from '../store/collaborationStore';

// Définition de la hiérarchie des rôles
const ROLE_HIERARCHY = ['viewer', 'editor', 'owner'];

// Créer un objet de rang à partir du tableau de hiérarchie
const RANK = {};
ROLE_HIERARCHY.forEach((role, index) => {
  RANK[role] = index + 1;
});

/**
 * Hook pour vérifier si l'utilisateur courant a accès à un flow avec un rôle spécifique
 * @param {string} requiredRole - Rôle requis ('owner', 'editor', 'viewer')
 * @returns {Object} - { hasAccess, userRole, loading, error }
 */
export const useFlowAccess = (requiredRole = 'viewer') => {
  const { currentFlow } = useFlowManager();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction pour vérifier si le rôle de l'utilisateur est suffisant
  const hasAccess = useCallback(() => {
    if (!userRole || !requiredRole) return false;
    
    const userRank = RANK[userRole] || 0;
    const requiredRank = RANK[requiredRole] || 0;
    
    return userRank >= requiredRank;
  }, [userRole, requiredRole]);

  // Récupérer le rôle de l'utilisateur pour le flow courant
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!currentFlow || !user) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Récupérer les collaborations pour ce flow
        const collaborations = await collaborationStore.getByFlow(currentFlow.id, { forceRefresh: true });
        
        // Trouver la collaboration de l'utilisateur courant
        const myCollaboration = collaborations.find(
          collab => collab.user && (collab.user.id === user.id || collab.user._id === user.id)
        );
        
        // Définir le rôle de l'utilisateur
        setUserRole(myCollaboration ? myCollaboration.role : null);
        setError(null);
      } catch (err) {
        console.error('Error fetching user role:', err);
        setError(err.message || 'Failed to fetch user role');
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [currentFlow, user]);

  return {
    hasAccess: hasAccess(),
    userRole,
    loading,
    error
  };
};

export default useFlowAccess;
