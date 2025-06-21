import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  memo
} from 'react';
import SelectionControl from './components/SelectionControl';
import DeleteConnectionModal from './components/DeleteConnectionModal';
import DeleteButton from '../common/DeleteButton';
import { throttle, debounce } from 'lodash';
import { buildAdjacency, markReachable } from '../../utils/graph';
import { updateApiNodeBindings } from '../../utils/apiNodeUtils';
import FlowMenuButton from '../flow/FlowMenuButton';
import { useFlowManager } from '../../context/FlowManagerContext';
import { FlowProvider } from '../../context/FlowContext';
import { useFlowAccess } from '../../hooks/useFlowAccess.js';
import BackendConfigSelector from '../settings/BackendConfigSelector';
import AIFlowBuilder from '../ai-flow/AIFlowBuilder';
import { parseAIFlowData, positionNodes } from '../../services/aiFlowService';
import { motion } from 'framer-motion';
import { Snackbar, Alert, Tooltip, IconButton } from '@mui/material';
import { Psychology as AIIcon } from '@mui/icons-material';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  MarkerType,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import '../../styles/DiagramEditor.css';
import { 
  EXECUTION_LINK_COLOR, 
  DATA_LINK_COLOR, 
  EXECUTION_LINK_STYLE, 
  DATA_LINK_STYLE,
  nodeTypes,
  edgeTypes
} from './diagramConfig';
import { createNode } from './nodeFactory';
import { useSubFlows } from './useSubFlows';
import { useDiagramPerformance } from './useDiagramPerformance';
import conditionStore from '../../store/conditionStore';
import { 
  detectSubFlows, 
  createSubFlowNode, 
  calculateSubFlowPosition, 
  createSubFlowEdges, 
  removeSubFlowElements,
  expandSubFlow 
} from '../../utils/subFlowUtils';


const DiagramEditor = ({
  nodes: initialNodes,
  edges: initialEdges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onEdgeDelete,
}) => {
  const { currentFlow, saveCurrentFlow, toggleFlowModal } = useFlowManager();
  const { hasAccess: canEdit, hasAccess } = useFlowAccess('editor');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('success');
  const [open, setOpen] = useState(false);
  const [aiFlowBuilderOpen, setAiFlowBuilderOpen] = useState(false);
  const [deleteConnectionModalOpen, setDeleteConnectionModalOpen] = useState(false);
  const [edgeToDelete, setEdgeToDelete] = useState(null);
  
  // Add class to body when diagram editor is active
  useEffect(() => {
    document.body.classList.add('diagram-editor-active');
    return () => {
      document.body.classList.remove('diagram-editor-active');
    };
  }, []);
  
  // Handle save function
  const handleSave = async () => {
    if (!currentFlow) {
      setMessage('No flow to save!');
      setSeverity('warning');
      setOpen(true);
      return;
    }
    
    if (!canEdit) {
      console.log("Permission denied: User doesn't have editor rights to save the flow");
      setMessage("Vous n'avez pas la permission de sauvegarder ce flow");
      setSeverity('error');
      setOpen(true);
      return;
    }
    
    setLoading(true);
    try {
      await saveCurrentFlow(nodes, edges);
      setMessage('Flow saved successfully!');
      setSeverity('success');
    } catch (err) {
      setMessage(err.message || 'Failed to save flow');
      setSeverity('error');
    } finally {
      setLoading(false);
      setOpen(true);
    }
  };
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const reactFlowWrapper = useRef(null);
  // Use refs for adjacency and connected nodes to avoid unnecessary re-renders
  const adjacencyRef = useRef(buildAdjacency([]));
  const connectedIdsRef = useRef(new Set());
  // Keep a state version for components that need to re-render when connections change
  const [connectedIds, setConnectedIds] = useState(new Set());
  // Track the selected node to show delete button
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  // State for selection mode and selected nodes
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedNodesForSelection, setSelectedNodesForSelection] = useState([]);
  
  // Store node callbacks in a ref to prevent recreation on each render
  const nodeCallbacksRef = useRef({});
  
  // Use the performance hook
  const {
    nodes, 
    setNodes,
    edges, 
    setEdges,
    nodesRef,
    throttledApply,
    throttledSelectionChange,
    createMemoNodes,
    computedEdges,
    setAnimatingEdge,
    animatingEdgeId
  } = useDiagramPerformance(
    initialNodes, 
    initialEdges, 
    selectedNodeId, 
    onNodesChange,
    onEdgesChange
  );
  
  // Reference to track previous flow ID
  const prevFlowId = useRef();
  
  // Use the subflows hook
  const { 
    createSubFlows, 
    expandSubFlowRef,
    collapsedSubFlows,
    setCollapsedSubFlows,
    originalNodesAndEdges,
    setOriginalNodesAndEdges
  } = useSubFlows(nodes, edges, setNodes, setEdges, onNodesChange, onEdgesChange, canEdit);

  // Effet pour charger les nœuds et les arêtes lorsque le flow courant change
  useEffect(() => {
    // If there's no current flow, clear all nodes and edges
    if (!currentFlow) {
      setNodes([]);
      setEdges([]);
      if (onNodesChange) onNodesChange([]);
      if (onEdgesChange) onEdgesChange([]);
      prevFlowId.current = null;
      // Clear subflow data when no flow is active
      setCollapsedSubFlows(new Map());
      setOriginalNodesAndEdges(new Map());
      return;
    }
    
    if (currentFlow.id === prevFlowId.current) return;
    prevFlowId.current = currentFlow.id;
    
    // Reset selected node when flow changes
    setSelectedNodeId(null);
    
    // Clear subflow data when changing flows to prevent data corruption
    setCollapsedSubFlows(new Map());
    setOriginalNodesAndEdges(new Map());

    // Get the version to use (either the current version or the flow itself for backward compatibility)
    const version = currentFlow.versions?.[currentFlow.currentVersionIndex] || currentFlow;
    
    // Load nodes
    if (version.nodes) {
      // Process loaded nodes to reattach callbacks
      let loaded = version.nodes || [];
      
      // Reattach callbacks to TextNodes
      loaded = loaded.map(n => {
        if (n.type === 'textNode') {
          // Store the callback in the ref
          const nodeId = n.id;
          nodeCallbacksRef.current[nodeId] = {
            onTextChange: (newText) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, text: newText } }
                    : node
                );
                // Update our ref
                nodesRef.current = updated;
                // Notify the parent INSIDE setNodes
                onNodesChange?.(updated);
                return updated;
              });
            }
          };
          
          // Inject the reference into data
          return {
            ...n,
            data: {
              ...n.data,
              onTextChange: (newText) => nodeCallbacksRef.current[nodeId].onTextChange(newText)
            }
          };
        } else if (n.type === 'intNode') {
          // Also reattach callbacks to IntNodes
          const nodeId = n.id;
          nodeCallbacksRef.current[nodeId] = {
            onValueChange: (newValue) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, value: newValue } }
                    : node
                );
                // Update our ref
                nodesRef.current = updated;
                // Notify the parent INSIDE setNodes
                onNodesChange?.(updated);
                return updated;
              });
            }
          };
          
          return {
            ...n,
            data: {
              ...n.data,
              onValueChange: (newValue) => nodeCallbacksRef.current[nodeId].onValueChange(newValue)
            }
          };
        } else if (n.type === 'aiNode') {
          // Also reattach callbacks to AINodes
          const nodeId = n.id;
          nodeCallbacksRef.current[nodeId] = {
            onPromptChange: (newPrompt) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, prompt: newPrompt } }
                    : node
                );
                // Update our ref
                nodesRef.current = updated;
                // Notify the parent INSIDE setNodes
                onNodesChange?.(updated);
                return updated;
              });
            },
            onInputChange: (newInput) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, input: newInput } }
                    : node
                );
                // Update our ref
                nodesRef.current = updated;
                // Notify the parent INSIDE setNodes
                onNodesChange?.(updated);
                return updated;
              });
            }
          };
          
          return {
            ...n,
            data: {
              ...n.data,
              onPromptChange: (newPrompt) => nodeCallbacksRef.current[nodeId].onPromptChange(newPrompt),
              onInputChange: (newInput) => nodeCallbacksRef.current[nodeId].onInputChange(newInput)
            }
          };
        } else if (n.type === 'conditionalFlowNode') {
          const nodeId = n.id;
          nodeCallbacksRef.current[nodeId] = {
          onConditionTypeChange: newType => {
            setNodes(prev => {
              const updated = prev.map(nd =>
                nd.id === nodeId
                  ? { ...nd, data: { ...nd.data, conditionType: newType } }
                  : nd
              );
              // Update our ref
              nodesRef.current = updated;
              // Notify the parent INSIDE setNodes
              onNodesChange?.(updated);
              return updated;
            });
          },
          onValueChange: newValue => {
            setNodes(prev => {
              const updated = prev.map(nd =>
                nd.id === nodeId
                  ? { ...nd, data: { ...nd.data, value: newValue } }
                  : nd
              );
              // Update our ref
              nodesRef.current = updated;
              // Notify the parent INSIDE setNodes
              onNodesChange?.(updated);
              return updated;
            });
          },
          onInputValueChange: newInputValue => {
            setNodes(prev => {
              const updated = prev.map(nd =>
                nd.id === nodeId
                  ? { ...nd, data: { ...nd.data, inputValue: newInputValue } }
                  : nd
              );
              // Update our ref
              nodesRef.current = updated;
              // Notify the parent INSIDE setNodes
              onNodesChange?.(updated);
              return updated;
            });
          }
          };
          return {
            ...n,
            data: {
              ...n.data,
              onConditionTypeChange: newType => nodeCallbacksRef.current[nodeId].onConditionTypeChange(newType),
              onValueChange: newVal => nodeCallbacksRef.current[nodeId].onValueChange(newVal),
              onInputValueChange: newInputValue => nodeCallbacksRef.current[nodeId].onInputValueChange(newInputValue)
            }
          };
        } else if (n.type === 'subFlowNode') {
          // ⚠️ Re-brancher les callbacks perdus lors de la sauvegarde
          return {
            ...n,
            data: {
              ...n.data,
              onExpand:   id => expandSubFlowRef.current(id),
              onCollapse: id => console.log('Collapse sub-flow:', id)
            }
          };
        }
        return n;
      });
      
      // Make sure to synchronize nodesRef
      nodesRef.current = loaded;

      // ---------- NOUVEAU : reconstruire la Map originals ----------
      const rebuilt = new Map();
      loaded.forEach(n => {
        if (n.type === 'subFlowNode' && n.data?.originals) {
          rebuilt.set(n.id, n.data.originals);
        }
      });
      setOriginalNodesAndEdges(rebuilt);
      // -------------------------------------------------------------
      
      setNodes(loaded);
      if (onNodesChange) onNodesChange(loaded);
    } else {
      setNodes([]);
      if (onNodesChange) onNodesChange([]);
    }
    
    // Load edges with default sourceHandle/targetHandle if needed
    if (version.edges) {
      const processedEdges = version.edges.map(edge => ({
        ...edge,
        sourceHandle: edge.sourceHandle || 'default-out',
        targetHandle: edge.targetHandle || 'default-in',
      }));
      
      // Clean up edges without handles to eliminate warnings
      const sanitisedEdges = processedEdges.filter(e => e.sourceHandle && e.targetHandle);
      setEdges(sanitisedEdges);
      if (onEdgesChange) onEdgesChange(sanitisedEdges);
    } else {
      setEdges([]);
      if (onEdgesChange) onEdgesChange([]);
    }
  }, [currentFlow, setNodes, setEdges, onNodesChange, onEdgesChange]);


  const handleEdgesChange = useCallback(
    (changes) => {
      if (!canEdit) {
        console.log("Permission denied: User doesn't have editor rights to modify edges");
        alert("Vous n'avez pas la permission de modifier ce flow");
        return;
      }
      
      const updatedEdges = applyEdgeChanges(changes, edges);
      setEdges(updatedEdges);
      if (onEdgesChange) onEdgesChange(updatedEdges);
      
      // Check if any edges were removed and update API node bindings
      const removedEdges = changes.filter(change => change.type === 'remove');
      if (removedEdges.length > 0) {
        // For each removed edge, check if it was connected to an API node
        removedEdges.forEach(change => {
          const edge = edges.find(e => e.id === change.id);
          if (edge && edge.targetHandle?.startsWith('body-')) {
            // Update the API node bindings
            const updatedNodes = updateApiNodeBindings(nodes, updatedEdges, edge.target);
            setNodes(updatedNodes);
            if (onNodesChange) onNodesChange(updatedNodes);
          }
        });
      }
      
      // No automatic saving - changes are stored in local state only
    },
    [edges, nodes, setEdges, setNodes, onEdgesChange, onNodesChange, canEdit]
  );

  const handleEdgeClick = useCallback(
    (event, edge) => {
      if (!canEdit) {
        console.log("Permission denied: User doesn't have editor rights to delete edges");
        alert("Vous n'avez pas la permission de supprimer des connexions dans ce flow");
        return;
      }
      
      // Open the custom confirmation modal instead of using window.confirm
      setEdgeToDelete(edge);
      setDeleteConnectionModalOpen(true);
    },
    [canEdit]
  );
  
  // Handle the confirmation from the modal
  const handleDeleteConfirm = useCallback(() => {
    if (!edgeToDelete) return;
    
    const updatedEdges = edges.filter((e) => e.id !== edgeToDelete.id);
    setEdges(updatedEdges);
    if (onEdgesChange) onEdgesChange(updatedEdges);
    if (onEdgeDelete) onEdgeDelete(edgeToDelete, updatedEdges);
    
    // Check if the deleted edge was connected to an API node body field
    if (edgeToDelete.targetHandle?.startsWith('body-')) {
      // Update the API node bindings
      const updatedNodes = updateApiNodeBindings(nodes, updatedEdges, edgeToDelete.target);
      setNodes(updatedNodes);
      if (onNodesChange) onNodesChange(updatedNodes);
    }
    
    // Close the modal and reset the edge to delete
    setDeleteConnectionModalOpen(false);
    setEdgeToDelete(null);
  }, [edgeToDelete, edges, nodes, setEdges, setNodes, onEdgesChange, onEdgeDelete, onNodesChange]);
  
  // Handle the cancellation from the modal
  const handleDeleteCancel = useCallback(() => {
    setDeleteConnectionModalOpen(false);
    setEdgeToDelete(null);
  }, []);
  
  // Handle node click to show delete button
  const handleNodeClick = useCallback(
    (event, node) => {
      // Only allow selection for delete if user can edit
      if (!canEdit) {
        console.log("Permission denied: User doesn't have editor rights to select nodes for deletion");
        return;
      }
      
      // Toggle selection if clicking the same node, otherwise select the new node
      setSelectedNodeId(prevId => prevId === node.id ? null : node.id);
    },
    [canEdit]
  );
  
  // Handle node deletion
  const handleNodeDelete = useCallback(
    (nodeId) => {
      if (!canEdit) {
        console.log("Permission denied: User doesn't have editor rights to delete nodes");
        alert("Vous n'avez pas la permission de supprimer des nœuds dans ce flow");
        return;
      }
      
      if (window.confirm('Do you want to delete this node?')) {
        // Remove all edges connected to this node
        const updatedEdges = edges.filter(
          (e) => e.source !== nodeId && e.target !== nodeId
        );
        setEdges(updatedEdges);
        if (onEdgesChange) onEdgesChange(updatedEdges);
        
        // Remove the node
        const updatedNodes = nodes.filter((n) => n.id !== nodeId);
        setNodes(updatedNodes);
        if (onNodesChange) onNodesChange(updatedNodes);
        
        // Clear selection
        setSelectedNodeId(null);
      }
    },
    [edges, nodes, setEdges, setNodes, onEdgesChange, onNodesChange, canEdit]
  );

  // Create memoized nodes using the function from the performance hook
  const memoNodes = useMemo(() => 
    createMemoNodes(nodes, selectedNodeId, handleNodeDelete),
    [nodes, selectedNodeId, handleNodeDelete, createMemoNodes]
  );

  // Calculate starting points only when nodes with isStartingPoint change
  const startingIds = useMemo(
    () => nodes.filter(n => n.type === 'conditionNode' && n.data.isStartingPoint)
               .map(n => n.id),
    [nodes]
  );
  
  // Update adjacency and connected nodes ONLY when edges or starting points change
  // This is a critical optimization that prevents recalculation during node dragging
  useEffect(() => {
    // Update adjacency when edges change
    adjacencyRef.current = buildAdjacency(edges);
    
    // Update connected nodes
    const newConnectedIds = markReachable(startingIds, adjacencyRef.current);
    connectedIdsRef.current = newConnectedIds;
    
    // Update state version to trigger re-renders where needed
    setConnectedIds(newConnectedIds);
  }, [edges, startingIds]);
  
  // Création d'une arête avec distinction entre lien d'exécution et lien de données
  const handleConnect = useCallback(
    (params) => {
      if (!canEdit) {
        console.log("Permission denied: User doesn't have editor rights to create connections");
        alert("Vous n'avez pas la permission de créer des connexions dans ce flow");
        return;
      }
      
      const edgeId = `edge-${Date.now()}`;
      
      // Add default handles if missing
      const sourceHandle = params.sourceHandle ?? 'default-out';
      const targetHandle = params.targetHandle ?? 'default-in';
      
      // Determine if this is an execution link or a data link
      // Execution links connect handles with IDs 'execution'
      const isExecutionLink =
      sourceHandle?.startsWith('execution') &&
      targetHandle?.startsWith('execution');
      
      const linkColor = isExecutionLink ? EXECUTION_LINK_COLOR : DATA_LINK_COLOR;
      
      const newEdge = {
        id: edgeId,
        source: params.source,
        target: params.target,
        sourceHandle,
        targetHandle,
        style: isExecutionLink ? EXECUTION_LINK_STYLE : DATA_LINK_STYLE,
        animated: false,
        type: isExecutionLink ? 'smoothstep' : 'default', // Smoother curves for execution links
        data: {
          isExecutionLink: isExecutionLink,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: isExecutionLink ? 15 : 12,
          height: isExecutionLink ? 15 : 12,
          color: isExecutionLink ? '#4CAF50' : linkColor,
        },
        labelStyle: { fill: '#333', fontWeight: 500, fontSize: 10 },
        labelBgStyle: { fill: '#fff', fillOpacity: 0.8 },
        className: 'new-connection', // Add class for connection animation
      };

      // Set the animating edge ID to trigger the connection animation
      if (isExecutionLink) {
        setAnimatingEdge(edgeId);
      }

      const updatedEdges = addEdge(newEdge, edges);
      setEdges(updatedEdges);
      if (onConnect) onConnect(updatedEdges);
      
      // Check if the connection is to an API node body field
      if (targetHandle?.startsWith('body-')) {
        // Update the API node bindings
        const updatedNodes = updateApiNodeBindings(nodes, updatedEdges, params.target);
        setNodes(updatedNodes);
        if (onNodesChange) onNodesChange(updatedNodes);
      }
    },
    [edges, nodes, setEdges, setNodes, onConnect, onNodesChange, canEdit]
  );

  const onInit = useCallback(
    (instance) => {
      setReactFlowInstance(instance);
      if (nodes.length > 0) {
        setTimeout(() => {
          instance.fitView({ padding: 0.2, includeHiddenNodes: true });
        }, 500);
      }
    },
    [nodes]
  );

  // Gestion du drop pour ajouter les nœuds
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      if (!reactFlowInstance) return;
      if (!canEdit) {
        console.log("Permission denied: User doesn't have editor rights to add nodes");
        alert("Vous n'avez pas la permission d'ajouter des nœuds dans ce flow");
        return;
      }
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Ajout d'un nœud condition
      const conditionId = event.dataTransfer.getData('application/conditionId');
      if (conditionId) {
        const condition = conditionStore.getConditionById(conditionId);
        if (!condition) return;
        
        const newNode = createNode('conditionNode', position, {
          conditionText: condition.conditionText,
          returnText: condition.returnText
        });
        
        let updatedNodes = nodes.concat(newNode);
        setNodes(updatedNodes);
        if (onNodesChange) onNodesChange(updatedNodes);
        
        // Log successful condition node creation
        console.log('✅ [DIAGRAM EDITOR] Condition node created:', condition.conditionText);
        return;
      }

      // Ajout d'un nœud sendingMail ou text
      const nodeType = event.dataTransfer.getData('application/nodeType');
      if (!nodeType) return;
      
      try {
        // Create the node using the factory
        const newNode = createNode(nodeType, position);
        
        // Add callbacks for interactive nodes
        if (nodeType === 'textNode') {
          const nodeId = newNode.id;
          
          // Store the callback in the ref
          nodeCallbacksRef.current[nodeId] = {
            onTextChange: (newText) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, text: newText } }
                    : node
                );
                nodesRef.current = updated;
                onNodesChange?.(updated);
                return updated;
              });
            }
          };
          
          // Set the callback reference
          newNode.data.onTextChange = (newText) => nodeCallbacksRef.current[nodeId].onTextChange(newText);
        } 
        else if (nodeType === 'intNode') {
          const nodeId = newNode.id;
          
          nodeCallbacksRef.current[nodeId] = {
            onValueChange: (newValue) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, value: newValue } }
                    : node
                );
                nodesRef.current = updated;
                onNodesChange?.(updated);
                return updated;
              });
            }
          };
          
          newNode.data.onValueChange = (newValue) => nodeCallbacksRef.current[nodeId].onValueChange(newValue);
        }
        else if (nodeType === 'aiNode') {
          const nodeId = newNode.id;
          
          nodeCallbacksRef.current[nodeId] = {
            onPromptChange: (newPrompt) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, prompt: newPrompt } }
                    : node
                );
                nodesRef.current = updated;
                onNodesChange?.(updated);
                return updated;
              });
            },
            onInputChange: (newInput) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, input: newInput } }
                    : node
                );
                nodesRef.current = updated;
                onNodesChange?.(updated);
                return updated;
              });
            }
          };
          
          newNode.data.onPromptChange = (newPrompt) => nodeCallbacksRef.current[nodeId].onPromptChange(newPrompt);
          newNode.data.onInputChange = (newInput) => nodeCallbacksRef.current[nodeId].onInputChange(newInput);
        }
        else if (nodeType === 'conditionalFlowNode') {
          const nodeId = newNode.id;
          
          nodeCallbacksRef.current[nodeId] = {
            onConditionTypeChange: (newType) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, conditionType: newType } }
                    : node
                );
                nodesRef.current = updated;
                onNodesChange?.(updated);
                return updated;
              });
            },
            onValueChange: (newValue) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, value: newValue } }
                    : node
                );
                nodesRef.current = updated;
                onNodesChange?.(updated);
                return updated;
              });
            },
            onInputValueChange: (newInputValue) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, inputValue: newInputValue } }
                    : node
                );
                nodesRef.current = updated;
                onNodesChange?.(updated);
                return updated;
              });
            }
          };
          
          newNode.data.onConditionTypeChange = (newType) => nodeCallbacksRef.current[nodeId].onConditionTypeChange(newType);
          newNode.data.onValueChange = (newValue) => nodeCallbacksRef.current[nodeId].onValueChange(newValue);
          newNode.data.onInputValueChange = (newInputValue) => nodeCallbacksRef.current[nodeId].onInputValueChange(newInputValue);
        }
        else if (nodeType === 'switchNode') {
          const nodeId = newNode.id;
          
          nodeCallbacksRef.current[nodeId] = {
            onCasesChange: (newCases) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, cases: newCases } }
                    : node
                );
                nodesRef.current = updated;
                onNodesChange?.(updated);
                return updated;
              });
            }
          };
          
          newNode.data.onCasesChange = (newCases) => nodeCallbacksRef.current[nodeId].onCasesChange(newCases);
        }
        else if (nodeType === 'logicalOperatorNode') {
          const nodeId = newNode.id;
          
          nodeCallbacksRef.current[nodeId] = {
            onOperatorTypeChange: (newType) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, operatorType: newType } }
                    : node
                );
                nodesRef.current = updated;
                onNodesChange?.(updated);
                return updated;
              });
            },
            onInputCountChange: (newCount) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, inputCount: newCount } }
                    : node
                );
                nodesRef.current = updated;
                onNodesChange?.(updated);
                return updated;
              });
            }
          };
          
          newNode.data.onOperatorTypeChange = (newType) => nodeCallbacksRef.current[nodeId].onOperatorTypeChange(newType);
          newNode.data.onInputCountChange = (newCount) => nodeCallbacksRef.current[nodeId].onInputCountChange(newCount);
        }
        else if (nodeType === 'booleanNode') {
          const nodeId = newNode.id;
          
          nodeCallbacksRef.current[nodeId] = {
            onValueChange: (newValue) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, value: newValue } }
                    : node
                );
                nodesRef.current = updated;
                onNodesChange?.(updated);
                return updated;
              });
            }
          };
          
          newNode.data.onValueChange = (newValue) => nodeCallbacksRef.current[nodeId].onValueChange(newValue);
        }
        else if (nodeType === 'tokenNode') {
          const nodeId = newNode.id;
          
          nodeCallbacksRef.current[nodeId] = {
            onTokenChange: (newToken) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, token: newToken } }
                    : node
                );
                nodesRef.current = updated;
                onNodesChange?.(updated);
                return updated;
              });
            }
          };
          
          newNode.data.onTokenChange = (newToken) => nodeCallbacksRef.current[nodeId].onTokenChange(newToken);
        }
        else if (nodeType === 'mailBodyNode') {
          const nodeId = newNode.id;
          
          nodeCallbacksRef.current[nodeId] = {
            onContentChange: (newContent) => {
              setNodes(prevNodes => {
                const updated = prevNodes.map(node =>
                  node.id === nodeId
                    ? { ...node, data: { ...node.data, content: newContent } }
                    : node
                );
                nodesRef.current = updated;
                onNodesChange?.(updated);
                return updated;
              });
            }
          };
          
          newNode.data.onContentChange = (newContent) => nodeCallbacksRef.current[nodeId].onContentChange(newContent);
        }
        
        // Add the node to the diagram
        const updatedNodes = nodes.concat(newNode);
        setNodes(updatedNodes);
        if (onNodesChange) onNodesChange(updatedNodes);
      } catch (error) {
        console.error('Error creating node:', error);
      }
    },
    [reactFlowInstance, nodes, setNodes, onNodesChange, canEdit]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    if (!canEdit) {
      console.log("Permission denied: User doesn't have editor rights to drag elements");
      event.dataTransfer.dropEffect = 'none';
    } else {
      event.dataTransfer.dropEffect = 'move';
    }
  }, [canEdit]);


  // We no longer need to manually add connection indicators
  // They are now handled by CSS with .connected-node::after

  // No need for local DeleteButton component as we're importing it


  return (
    <div
      ref={reactFlowWrapper}
      className="diagram-editor hardware-accelerated"
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        willChange: 'transform', // Hint to browser to use hardware acceleration
        transform: 'translateZ(0)' // Force hardware acceleration
      }}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      {!currentFlow && (
        <div className="flow-required-overlay" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          color: 'white',
          textAlign: 'center',
          padding: '20px'
        }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              backgroundColor: '#2a2a2a',
              borderRadius: '8px',
              padding: '30px',
              maxWidth: '500px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}
          >
            <h2 style={{ marginTop: 0 }}>Aucun flow actif</h2>
            <p>Vous devez créer un nouveau flow ou charger un flow existant pour continuer.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleFlowModal}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: 'pointer',
                marginTop: '20px'
              }}
            >
              Créer ou charger un flow
            </motion.button>
          </motion.div>
        </div>
      )}
      <ReactFlowProvider>
<FlowProvider
  nodes={nodes}
  edges={edges}
  flowId={currentFlow?.id}
  subFlowOriginals={originalNodesAndEdges}   
>  <ReactFlow
          nodes={memoNodes}
          edges={computedEdges}
          onNodesChange={throttledApply}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onEdgeClick={handleEdgeClick}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onInit={onInit}
          defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
          minZoom={0.1}
          maxZoom={4}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          deleteKeyCode={['Backspace', 'Delete']} // Support both keys for deletion
          multiSelectionKeyCode={['Control', 'Meta']} // Support both Ctrl and Cmd for multi-selection
          snapToGrid={nodes.length > 100} // Enable snap to grid for large diagrams to improve performance
          snapGrid={[15, 15]}
          onlyRenderVisibleElements={nodes.length > 50} // Only render visible elements for better performance with large diagrams
          style={{ background: '#f5f5f5' }}
          edgeUpdaterRadius={10} // Increase the edge updater radius for easier edge manipulation
          edgesFocusable={true} // Make edges focusable
          edgesUpdatable={true} // Allow edges to be updated
          selectionOnDrag={selectionMode} // Enable selection by dragging when in selection mode
          selectionMode={selectionMode ? 1 : 0} // 1 = box selection, 0 = default
          panOnDrag={!selectionMode} // Disable panning when in selection mode
          nodesDraggable={!selectionMode} // Disable node dragging when in selection mode
          nodesConnectable={!selectionMode} // Disable node connections when in selection mode
          onSelectionChange={throttledSelectionChange}
          connectionLineStyle={{ 
            stroke: DATA_LINK_COLOR, 
            strokeWidth: 2.5,
            opacity: 0.6,
            strokeDasharray: '5,5'
          }}
          connectionLineType="smoothstep"
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: false,
          }}
        >
          <Controls />
          {/* Only show MiniMap for smaller diagrams to improve performance */}
          {nodes.length < 50 && <MiniMap nodeStrokeWidth={1} nodeColor={n => n.className?.includes('connected-node') ? '#4CAF50' : '#888'} />}
          {/* Use larger gap for background dots when there are many nodes to improve performance */}
          <Background variant="dots" gap={nodes.length > 200 ? 20 : 12} size={1} />
          <Panel position="top-right">
            <div className="diagram-info">
              <div className="diagram-header">
                <h3>{currentFlow?.name || "Diagram"}</h3>
                <span className="endpoints-info">{nodes.length} endpoints loaded</span>
                {currentFlow?.userRole && (
                  <span className="user-role-badge">
                    {currentFlow.userRole.charAt(0).toUpperCase() + currentFlow.userRole.slice(1)}
                  </span>
                )}
              </div>
              <div className="diagram-buttons">
                {nodes.length > 0 && (
                  <button
                    className="diagram-button fit-view-button"
                    onClick={() => {
                      document.querySelector('.react-flow__controls-fitview')?.click();
                    }}
                  >
                    Fit View
                  </button>
                )}
                {canEdit && nodes.length > 0 && (
                  <button
                    className="diagram-button save-button"
                    onClick={handleSave}
                    disabled={loading || !currentFlow || !hasAccess}
                    title={!hasAccess ? "You need editor or owner permissions to save" : ""}
                  >
                    <i className="fas fa-save"></i> Save
                  </button>
                )}
                {canEdit && currentFlow && (
                  <button
                    className="diagram-button flow-menu-button"
                    onClick={toggleFlowModal}
                    disabled={loading}
                  >
                    Flow Menu
                  </button>
                )}
                {canEdit && nodes.length > 0 && (
                  <button
                    className="diagram-button create-subflows-button"
                    onClick={createSubFlows}
                  >
                    Créer des sous-flux
                  </button>
                )}
                {canEdit && currentFlow && (
                  <Tooltip title="Générer un flux avec l'IA">
                    <button
                      className="diagram-button ai-flow-button"
                      onClick={() => setAiFlowBuilderOpen(true)}
                      disabled={loading}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '5px',
                        backgroundColor: '#673AB7',
                        color: 'white'
                      }}
                    >
                      <AIIcon fontSize="small" />
                      IA Flow Builder
                    </button>
                  </Tooltip>
                )}
              </div>
            </div>
          </Panel>
          
          <Panel position="top-left" style={{ marginTop: '10px' }}>
            <BackendConfigSelector />
          </Panel>
          </ReactFlow>
          
          {/* FlowMenuButton is now the only UI element for flow management */}
          <FlowMenuButton />
          
          {/* Selection Control - Only render when diagram tab is active */}
          {document.body.classList.contains('diagram-editor-active') && (
            <SelectionControl 
              selectionMode={selectionMode}
              setSelectionMode={setSelectionMode}
              selectedNodes={selectedNodesForSelection}
            />
          )}
        </FlowProvider>
      </ReactFlowProvider>
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setOpen(false)} severity={severity} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
      
      {/* AI Flow Builder Dialog */}
      <AIFlowBuilder 
        open={aiFlowBuilderOpen}
        onClose={() => setAiFlowBuilderOpen(false)}
        nodes={nodes}
        edges={edges}
        onFlowGenerated={(flowData) => {
          if (!canEdit) {
            setMessage("Vous n'avez pas la permission de modifier ce flow");
            setSeverity('error');
            setOpen(true);
            return;
          }
          
          try {
            // Parse the AI-generated flow data
            const { nodes: aiNodes, edges: aiEdges } = parseAIFlowData(flowData);
            
            // Position the nodes in a logical layout
            const positionedNodes = positionNodes(aiNodes, aiEdges);
            
            // Add the nodes and edges to the diagram
            setNodes(prevNodes => [...prevNodes, ...positionedNodes]);
            setEdges(prevEdges => [...prevEdges, ...aiEdges]);
            
            // Notify parent components
            if (onNodesChange) onNodesChange([...nodes, ...positionedNodes]);
            if (onEdgesChange) onEdgesChange([...edges, ...aiEdges]);
            
            // Show success message
            setMessage('Flux généré avec succès !');
            setSeverity('success');
            setOpen(true);
            
            // Fit view to show the new nodes
            setTimeout(() => {
              if (reactFlowInstance) {
                reactFlowInstance.fitView({ padding: 0.2 });
              }
            }, 100);
          } catch (error) {
            console.error('Error processing AI flow data:', error);
            setMessage('Erreur lors de la génération du flux');
            setSeverity('error');
            setOpen(true);
          }
        }}
      />
      
      {/* Custom Delete Connection Modal */}
      <DeleteConnectionModal 
        isOpen={deleteConnectionModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

// Create a memoized version of the DiagramEditor component with custom equality check
export default memo(DiagramEditor, (prevProps, nextProps) => {
  // Only re-render if the nodes or edges arrays have actually changed
  const nodesEqual = prevProps.nodes === nextProps.nodes || 
    (prevProps.nodes?.length === nextProps.nodes?.length && 
     JSON.stringify(prevProps.nodes) === JSON.stringify(nextProps.nodes));
  
  const edgesEqual = prevProps.edges === nextProps.edges || 
    (prevProps.edges?.length === nextProps.edges?.length && 
     JSON.stringify(prevProps.edges) === JSON.stringify(nextProps.edges));
  
  // Return true if both nodes and edges are equal (meaning no re-render needed)
  return nodesEqual && edgesEqual;
});
