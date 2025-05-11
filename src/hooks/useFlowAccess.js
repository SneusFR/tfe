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
  const { currentFlow, setCurrentFlow } = useFlowManager();   // ← ①
  const { user } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction pour vérifier si le rôle de l'utilisateur est suffisant
  const hasAccess = useCallback(() => {
    if (!userRole || !requiredRole) {
      console.log(`Permission check failed: No user role (${userRole}) or required role (${requiredRole}) defined`);
      return false;
    }
    
    const userRank = RANK[userRole] || 0;
    const requiredRank = RANK[requiredRole] || 0;
    
    const hasPermission = userRank >= requiredRank;
    
    if (!hasPermission) {
      console.log(`Permission check failed: User role '${userRole}' (rank ${userRank}) is insufficient for required role '${requiredRole}' (rank ${requiredRank})`);
    }
    
    return hasPermission;
  }, [userRole, requiredRole]);

  // Récupérer le rôle de l'utilisateur pour le flow courant
  useEffect(() => {
    const fetchUserRole = async () => {
      console.log('[useFlowAccess] currentFlow', currentFlow?.id, 'userRole in flow', currentFlow?.userRole);
      
      if (!currentFlow || !user) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      /* 0. S'il y a déjà l'info dans le flow, on l'utilise tout de suite */
      if (currentFlow.userRole) {
        setUserRole(currentFlow.userRole);
      }

      try {
        setLoading(true);
        // Récupérer les collaborations pour ce flow
        /* 1. Ne force le refresh qu'en cas de mutation */
        const collaborations = await collaborationStore.getByFlow(currentFlow.id, { forceRefresh: false });
        console.log('[loadFlow] collabs', collaborations);
        
        // Trouver la collaboration de l'utilisateur courant
        const myCollaboration = collaborations.find(c => {
          // c.user peut être un objet ou une string
          let collabUserId;
          if (typeof c.user === 'object' && c.user) {
            collabUserId = (c.user.id || c.user._id || '').toString();
          } else {
            collabUserId = (c.user || '').toString();
          }
          const currentUserId = (user.id || user._id || '').toString();
          return collabUserId === currentUserId;
        });
        
        console.log('[loadFlow] my role', myCollaboration?.role);
        
        // Définir le rôle de l'utilisateur
        console.log('[useFlowAccess] setting userRole', myCollaboration?.role);
        if (myCollaboration) {
          const role = myCollaboration.role;
          setUserRole(role);

          /* Injecte le rôle UNE SEULE FOIS
             – même objet => pas de re‑rendu / pas de boucle */
          setCurrentFlow(prev => {
            if (!prev || prev.id !== currentFlow.id) return prev;   // autre flow ?
            if (prev.userRole === role)          return prev;       // déjà bon
            return { ...prev, userRole: role };                     // ↵ mise à jour
          });
        } else {
          setUserRole(null);
        }
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
  }, [currentFlow?.id, user, setCurrentFlow]);

  return {
    hasAccess: hasAccess(),
    userRole,
    loading,
    error
  };
};

export default useFlowAccess;
