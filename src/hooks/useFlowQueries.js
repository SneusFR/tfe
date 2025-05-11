import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useFlowService } from '../services/flowService';
import collaborationStore from '../store/collaborationStore';
import { useAuth } from '../context/AuthContext';

/**
 * Hook pour utiliser les requêtes de flows avec React Query
 */
export const useFlowQueries = () => {
  const flowService = useFlowService();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Récupérer tous les flows
  const useFlows = (pagination = { page: 1, limit: 100 }) => {
    return useQuery(
      ['flows', pagination],
      () => flowService.getFlows(pagination),
      {
        staleTime: 30000, // 30 secondes
        keepPreviousData: true,
      }
    );
  };

  // Récupérer un flow par ID
  const useFlowById = (flowId) => {
    return useQuery(
      ['flow', flowId],
      () => flowService.getFlowById(flowId),
      {
        staleTime: 30000,
        enabled: !!flowId,
      }
    );
  };

  // Récupérer les collaborations pour un flow
  const useCollaborations = (flowId, options = {}) => {
    const { forceRefresh = false } = options;
    
    return useQuery(
      ['collaborations', flowId],
      () => collaborationStore.getByFlow(flowId, { forceRefresh }),
      {
        staleTime: 30000,
        enabled: !!flowId,
      }
    );
  };

  // Mutation pour créer un flow
  const useCreateFlow = () => {
    return useMutation(
      (flowData) => flowService.createFlow(flowData),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(['flows']);
        },
      }
    );
  };

  // Mutation pour sauvegarder un flow
  const useSaveFlow = () => {
    return useMutation(
      ({ flowId, flowData }) => flowService.saveFlowVariant(flowId, flowData),
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries(['flow', data.id]);
          queryClient.invalidateQueries(['flows']);
        },
      }
    );
  };

  // Mutation pour supprimer un flow
  const useDeleteFlow = () => {
    return useMutation(
      (flowId) => flowService.deleteFlow(flowId),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(['flows']);
        },
      }
    );
  };

  // Mutation pour ajouter un collaborateur
  const useAddCollaborator = () => {
    return useMutation(
      (collaborationData) => collaborationStore.add(collaborationData),
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries(['collaborations', data.flow]);
          queryClient.invalidateQueries(['flow', data.flow]);
          queryClient.invalidateQueries(['flows']);
        },
      }
    );
  };

  // Mutation pour supprimer un collaborateur
  const useRemoveCollaborator = () => {
    return useMutation(
      ({ id, flowId }) => {
        return collaborationStore.remove(id).then(() => ({ id, flowId }));
      },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries(['collaborations', data.flowId]);
          queryClient.invalidateQueries(['flow', data.flowId]);
          queryClient.invalidateQueries(['flows']);
        },
      }
    );
  };

  // Mutation pour mettre à jour un collaborateur
  const useUpdateCollaborator = () => {
    return useMutation(
      ({ id, updateData, flowId }) => {
        return collaborationStore.update(id, updateData).then(data => ({ ...data, flowId }));
      },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries(['collaborations', data.flowId]);
          queryClient.invalidateQueries(['flow', data.flowId]);
          queryClient.invalidateQueries(['flows']);
        },
      }
    );
  };

  return {
    useFlows,
    useFlowById,
    useCollaborations,
    useCreateFlow,
    useSaveFlow,
    useDeleteFlow,
    useAddCollaborator,
    useRemoveCollaborator,
    useUpdateCollaborator,
  };
};
