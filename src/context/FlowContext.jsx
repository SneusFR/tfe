// FlowContext.jsx
import {
  createContext,
  useRef,
  useEffect,
  useState,
  useContext,
  useMemo,
} from 'react';
import { runFlow } from '../services/flowClient.js';
import { useAuth } from './AuthContext';
import conditionStore from '../store/conditionStore';
import backendConfigStore from '../store/backendConfigStore';

/* ------------------------------------------------------------------ */
/*  Contexte                                                          */
/* ------------------------------------------------------------------ */
export const FlowContext = createContext(null);

/* ------------------------------------------------------------------ */
/*  Provider                                                          */
/* ------------------------------------------------------------------ */
export const FlowProvider = ({
  children,
  nodes,
  edges,
  flowId,
  subFlowOriginals = new Map(), // ← nouvelle prop
}) => {
  const { api } = useAuth();

  /* ---------------- Backend config sélectionnée ------------------- */
  const [backendConfigId, setBackendConfigId] = useState(null);
  const [backendConfigs, setBackendConfigs]   = useState([]);
  const [loading, setLoading]                 = useState(false);

  /* ---------------- Références « stables » ------------------------ */
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  useEffect(() => { nodesRef.current = nodes;  }, [nodes]);
  useEffect(() => { edgesRef.current = edges;  }, [edges]);

  /* ---------------- Fonction d’exécution (mutable ref) ------------ */
  const executeFlowRef = useRef(async (task) => {
    const { flattenSubflows } = await import(
      '../utils/flattenSubflows.js'
    );
    const { nodes: flatN, edges: flatE } = flattenSubflows(
      nodesRef.current,
      edgesRef.current,
      subFlowOriginals
    );
    console.log('[DEBUG] flattenSubflows →', { nodes: flatN.length, edges: flatE.length, first5: flatN.slice(0,5) });
    return runFlow(flatN, flatE, task, backendConfigId, flowId);
  });

  // remet à jour la fonction si backendConfigId ou flowId changent
  useEffect(() => {
    executeFlowRef.current = async (task) => {
      const { flattenSubflows } = await import(
        '../utils/flattenSubflows.js'
      );
      const { nodes: flatN, edges: flatE } = flattenSubflows(
        nodesRef.current,
        edgesRef.current,
        subFlowOriginals
      );
      console.log('[DEBUG] flattenSubflows →', { nodes: flatN.length, edges: flatE.length, first5: flatN.slice(0,5) });
      return runFlow(flatN, flatE, task, backendConfigId, flowId);
    };
  }, [backendConfigId, flowId, subFlowOriginals]);

  /* ---------------- Mises à jour annexes -------------------------- */
  useEffect(() => {
    if (flowId) conditionStore.setCurrentFlowId(flowId);
  }, [flowId]);

  // Charge/rafraîchit les configurations backend
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (flowId) backendConfigStore.setCurrentFlowId(flowId);
        const cfgs = await backendConfigStore.getAll();
        setBackendConfigs(cfgs);

        // If no backend config is selected and there are configs available, select the first one
        if (!backendConfigId && cfgs.length > 0) {
          setBackendConfigId(cfgs[0].id);
        }
      } catch (e) {
        console.error('[FlowProvider] backend config error', e);
      } finally {
        setLoading(false);
      }
    };
    if (api) load();
  }, [api, backendConfigId, flowId]);

  /* ---------------- Valeur du contexte ---------------------------- */
  const ctx = useMemo(
    () => ({
      executeFlowRef,
      backendConfigId,
      setBackendConfigId,
      backendConfigs,
      loading,
      flowId,
    }),
    [backendConfigId, backendConfigs, loading, flowId]
  );

  return <FlowContext.Provider value={ctx}>{children}</FlowContext.Provider>;
};

/* ------------------------------------------------------------------ */
/*  Hook utilisateur                                                  */
/* ------------------------------------------------------------------ */
export const useFlow = () => {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error('useFlow must be used within a FlowProvider');
  return ctx;
};
