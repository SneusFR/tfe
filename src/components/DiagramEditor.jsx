import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo
} from 'react';
import SelectionControl from './diagram-editor/components/SelectionControl';
import { isEqual } from 'lodash';
import DeleteButton from './common/DeleteButton';
import { throttle } from 'lodash';
import { buildAdjacency, markReachable } from '../utils/graph';
import { updateApiNodeBindings } from '../utils/apiNodeUtils';
import FlowMenuButton from './FlowMenuButton';
import { useFlowManager } from '../context/FlowManagerContext';
import { FlowProvider } from '../context/FlowContext';
import { useFlowAccess } from '../hooks/useFlowAccess.js';
import BackendConfigSelector from './settings/BackendConfigSelector';
import AIFlowBuilder from './AIFlowBuilder';
import { parseAIFlowData, positionNodes } from '../services/aiFlowService';
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
import '../styles/DiagramEditor.css';

import ApiNode from '../nodes/miscnodes/ApiNode.jsx';
import ConditionNode from '../nodes/conditionnalnodes/ConditionNode.jsx';
import ConditionalFlowNode from '../nodes/conditionnalnodes/ConditionalFlowNode.jsx';
import SwitchNode from '../nodes/conditionnalnodes/SwitchNode.jsx';
import LogicalOperatorNode from '../nodes/conditionnalnodes/LogicalOperatorNode.jsx';
import SendingMailNode from '../nodes/mailnodes/SendingMailNode.jsx';
import EmailAttachmentNode from '../nodes/mailnodes/EmailAttachmentNode.jsx';
import TextNode from '../nodes/inputnodes/TextNode.jsx';
import IntNode from '../nodes/inputnodes/IntNode.jsx';
import BooleanNode from '../nodes/inputnodes/BooleanNode.jsx';
import TokenNode from '../nodes/inputnodes/TokenNode.jsx';
import Base64Node from '../nodes/inputnodes/Base64Node.jsx';
import OcrNode from '../nodes/mailnodes/OcrNode.jsx';
import ConsoleLogNode from '../nodes/miscnodes/ConsoleLogNode.jsx';
import AINode from '../nodes/ainodes/AINode.jsx';
import MailBodyNode from '../nodes/mailnodes/MailBodyNode.jsx';
import EndNode from '../nodes/miscnodes/EndNode.jsx';
import SubFlowNode from '../nodes/miscnodes/SubFlowNode.jsx';
import conditionStore from '../store/conditionStore';
import { 
  detectSubFlows, 
  createSubFlowNode, 
  calculateSubFlowPosition, 
  createSubFlowEdges, 
  removeSubFlowElements,
  expandSubFlow 
} from '../utils/subFlowUtils';

// Connection colors and styles
const EXECUTION_LINK_COLOR = '#555'; // Gray for execution links
const DATA_LINK_COLOR = '#3498db';    // Blue for data links
const EXECUTION_LINK_STYLE = {
  strokeWidth: 2.5,
  stroke: EXECUTION_LINK_COLOR,
  strokeDasharray: '0',
  opacity: 0.9,
};
const DATA_LINK_STYLE = {
  strokeWidth: 2,
  stroke: DATA_LINK_COLOR,
  opacity: 0.8,
};
const CONNECTED_EXECUTION_LINK_STYLE = {
  ...EXECUTION_LINK_STYLE,
  stroke: '#4CAF50', // Green for connected execution links
  strokeWidth: 3,
  opacity: 1,
  animation: 'flowPulse 2s infinite',
};

// Déclaration des types de nœuds et d'arêtes en dehors du composant
const nodeTypes = {
  apiNode: ApiNode,
  conditionNode: ConditionNode,
  conditionalFlowNode: ConditionalFlowNode,
  switchNode: SwitchNode,
  logicalOperatorNode: LogicalOperatorNode,
  sendingMailNode: SendingMailNode,
  emailAttachmentNode: EmailAttachmentNode,
  textNode: TextNode,
  intNode: IntNode,
  booleanNode: BooleanNode,
  tokenNode: TokenNode,
  base64Node: Base64Node,
  ocrNode: OcrNode,
  consoleLogNode: ConsoleLogNode,
  aiNode: AINode,
  mailBodyNode: MailBodyNode,
  endNode: EndNode,
  subFlowNode: SubFlowNode,
};

// Define edge types outside the component
const edgeTypes = Object.freeze({});

// Tous les handles sont compatibles entre eux - défini au niveau module pour éviter la recréation
const areHandlesCompatible = () => true;

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
  const [nodes, setNodes] = useNodesState(initialNodes || []);
  const [edges, setEdges] = useEdgesState(initialEdges || []);
  const reactFlowWrapper = useRef(null);
  // Use refs for adjacency and connected nodes to avoid unnecessary re-renders
  const adjacencyRef = useRef(buildAdjacency(edges));
  const connectedIdsRef = useRef(new Set());
  // Keep a state version for components that need to re-render when connections change
  const [connectedIds, setConnectedIds] = useState(new Set());
  const [animatingEdgeId, setAnimatingEdgeId] = useState(null);
  // Track the selected node to show delete button
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  // State for selection mode and selected nodes
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedNodesForSelection, setSelectedNodesForSelection] = useState([]);
  
  // Optimization: Throttle selection changes to improve performance
  const throttledSelectionChange = useRef(
    throttle((params) => {
      if (selectionMode) {
        setSelectedNodesForSelection(params.nodes || []);
      }
    }, 100) // Throttle to 100ms
  ).current;
  
  // Store node callbacks in a ref to prevent recreation on each render
  const nodeCallbacksRef = useRef({});
  
  // Reference to track current nodes state
  const nodesRef = useRef([]);
  
  // Reference to track previous flow ID
  const prevFlowId = useRef();
  
  // State for sub-flow management
  const [collapsedSubFlows, setCollapsedSubFlows] = useState(new Map());
  const [originalNodesAndEdges, setOriginalNodesAndEdges] = useState(new Map());

  // Function to create sub-flows automatically
  const createSubFlows = useCallback(() => {
    if (!canEdit) {
      alert("Vous n'avez pas la permission de modifier ce flow");
      return;
    }

    const detectedSubFlows = detectSubFlows(nodes, edges);
    
    if (detectedSubFlows.length === 0) {
      alert("Aucun sous-flux détecté. Assurez-vous d'avoir des nœuds de condition (points de départ) et des nœuds de fin connectés.");
      return;
    }

    let updatedNodes = [...nodes];
    let updatedEdges = [...edges];
    const newCollapsedSubFlows = new Map(collapsedSubFlows);
    const newOriginalNodesAndEdges = new Map(originalNodesAndEdges);

    detectedSubFlows.forEach(subFlow => {
      // Store original nodes and edges for this sub-flow
      const originalNodes = subFlow.path.map(nodeId => 
        nodes.find(n => n.id === nodeId)
      ).filter(Boolean);
      
      const originalEdges = edges.filter(edge => 
        subFlow.path.includes(edge.source) && subFlow.path.includes(edge.target)
      );

      newOriginalNodesAndEdges.set(subFlow.id, {
        nodes: originalNodes,
        edges: originalEdges
      });
      console.log('[DEBUG] subFlow created', subFlow.id, 'stored originals:', {nodes: originalNodes.length, edges: originalEdges.length});

      // Calculate position for the sub-flow node
      const position = calculateSubFlowPosition(originalNodes);

      // Create sub-flow node with callbacks
      const subFlowNode = createSubFlowNode(subFlow, position);
      subFlowNode.data.onExpand = (nodeId) => expandSubFlowHandlerRef.current(nodeId);      
      subFlowNode.data.onCollapse = (nodeId) => collapseSubFlowHandler(nodeId);

      subFlowNode.data.originals = {
      nodes: originalNodes,
      edges: originalEdges
      };

      // Remove original nodes and edges
      const { nodes: filteredNodes, edges: filteredEdges } = removeSubFlowElements(
        updatedNodes, 
        updatedEdges, 
        subFlow
      );

      // Create new edges for the sub-flow node
      const subFlowEdges = createSubFlowEdges(subFlow, edges);

      // Update arrays
      updatedNodes = [...filteredNodes, subFlowNode];
      updatedEdges = [...filteredEdges, ...subFlowEdges];

      // Mark as collapsed
      newCollapsedSubFlows.set(subFlow.id, true);
    });

    // Update state
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    setCollapsedSubFlows(newCollapsedSubFlows);
    setOriginalNodesAndEdges(newOriginalNodesAndEdges);
    
    if (onNodesChange) onNodesChange(updatedNodes);
    if (onEdgesChange) onEdgesChange(updatedEdges);

    alert(`${detectedSubFlows.length} sous-flux(s) créé(s) avec succès !`);
  }, [nodes, edges, canEdit, collapsedSubFlows, originalNodesAndEdges, onNodesChange, onEdgesChange]);




  // Function to expand a sub-flow
  const expandSubFlowHandler = useCallback((subFlowNodeId) => {
    if (!canEdit) {
      alert("Vous n'avez pas la permission de modifier ce flow");
      return;
    }

    console.log('Expanding sub-flow:', subFlowNodeId);
    console.log('Available original data keys:', Array.from(originalNodesAndEdges.keys()));
    console.log('Original nodes and edges map size:', originalNodesAndEdges.size);
    
    const originalData = originalNodesAndEdges.get(subFlowNodeId);
    if (!originalData) {
      console.error('No original data found for subflow:', subFlowNodeId);
      console.error('Available subflow IDs:', Array.from(originalNodesAndEdges.keys()));
      alert(`Erreur: Impossible de trouver les données originales pour le sous-flux ${subFlowNodeId}. Les données ont peut-être été perdues lors du changement de flow.`);
      return;
    }
    
    console.log('Found original data:', originalData);

    // Find edges that were connected to the subflow node from external nodes
    const externalIncomingEdges = edges.filter(e => 
      e.target === subFlowNodeId && e.source !== subFlowNodeId
    );
    const externalOutgoingEdges = edges.filter(e => 
      e.source === subFlowNodeId && e.target !== subFlowNodeId
    );

    // Remove the sub-flow node
    const updatedNodes = nodes.filter(n => n.id !== subFlowNodeId);
    
    // Remove edges connected to the sub-flow node
    const updatedEdges = edges.filter(e => 
      e.source !== subFlowNodeId && e.target !== subFlowNodeId
    );

    // Restore original nodes with proper callbacks
    const restoredNodes = originalData.nodes.map(node => {
      // Reattach callbacks based on node type
      if (node.type === 'textNode') {
        const nodeId = node.id;
        nodeCallbacksRef.current[nodeId] = {
          onTextChange: (newText) => {
            setNodes(prevNodes => {
              const updated = prevNodes.map(n =>
                n.id === nodeId
                  ? { ...n, data: { ...n.data, text: newText } }
                  : n
              );
              nodesRef.current = updated;
              onNodesChange?.(updated);
              return updated;
            });
          }
        };
        return {
          ...node,
          data: {
            ...node.data,
            onTextChange: (newText) => nodeCallbacksRef.current[nodeId].onTextChange(newText)
          }
        };
      } else if (node.type === 'conditionalFlowNode') {
        const nodeId = node.id;
        nodeCallbacksRef.current[nodeId] = {
          onConditionTypeChange: newType => {
            setNodes(prev => {
              const updated = prev.map(nd =>
                nd.id === nodeId
                  ? { ...nd, data: { ...nd.data, conditionType: newType } }
                  : nd
              );
              nodesRef.current = updated;
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
              nodesRef.current = updated;
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
              nodesRef.current = updated;
              onNodesChange?.(updated);
              return updated;
            });
          }
        };
        return {
          ...node,
          data: {
            ...node.data,
            onConditionTypeChange: newType => nodeCallbacksRef.current[nodeId].onConditionTypeChange(newType),
            onValueChange: newVal => nodeCallbacksRef.current[nodeId].onValueChange(newVal),
            onInputValueChange: newInputValue => nodeCallbacksRef.current[nodeId].onInputValueChange(newInputValue)
          }
        };
      }
      // Return node as-is for other types
      return node;
    });

    // Reconnect external edges to the appropriate nodes in the expanded subflow
    const reconnectedEdges = [];
    
    // Handle incoming edges (connect to start node of subflow)
    externalIncomingEdges.forEach(edge => {
      if (originalData.nodes.length > 0) {
        const startNode = originalData.nodes[0]; // Assuming first node is start
        reconnectedEdges.push({
          ...edge,
          target: startNode.id,
          targetHandle: 'execution',
          id: `${edge.id}-reconnected`
        });
      }
    });

    // Handle outgoing edges (connect from end node of subflow)
    externalOutgoingEdges.forEach(edge => {
      if (originalData.nodes.length > 0) {
        const endNode = originalData.nodes[originalData.nodes.length - 1]; // Assuming last node is end
        reconnectedEdges.push({
          ...edge,
          source: endNode.id,
          sourceHandle: 'execution',
          id: `${edge.id}-reconnected`
        });
      }
    });

    // Combine all nodes and edges
    const finalNodes = [...updatedNodes, ...restoredNodes];
    const finalEdges = [...updatedEdges, ...originalData.edges, ...reconnectedEdges];

    console.log('Final nodes after expansion:', finalNodes.length);
    console.log('Final edges after expansion:', finalEdges.length);

    // Update state
    setNodes(finalNodes);
    setEdges(finalEdges);
    
    // Remove from collapsed state
    const newCollapsedSubFlows = new Map(collapsedSubFlows);
    newCollapsedSubFlows.delete(subFlowNodeId);
    setCollapsedSubFlows(newCollapsedSubFlows);

    // Update refs
    nodesRef.current = finalNodes;

    if (onNodesChange) onNodesChange(finalNodes);
    if (onEdgesChange) onEdgesChange(finalEdges);
  }, [nodes, edges, originalNodesAndEdges, collapsedSubFlows, canEdit, onNodesChange, onEdgesChange]);

      /* ---------- keep latest expand handler ---------- */
    const expandSubFlowHandlerRef = useRef();
    // on pointe toujours vers la version la plus récente, synchronement
    expandSubFlowHandlerRef.current = expandSubFlowHandler;

  // Function to collapse a sub-flow (placeholder for future implementation)
  const collapseSubFlowHandler = useCallback((subFlowNodeId) => {
    // This would be used when expanding and then wanting to collapse again
    console.log('Collapse sub-flow:', subFlowNodeId);
  }, []);

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
              onExpand:   id => expandSubFlowHandlerRef.current(id),
              onCollapse: id => collapseSubFlowHandler(id)
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

  // Throttled version of node changes to improve performance during dragging
  const throttledApply = useRef(
    throttle((changes) => {
      setNodes(prev => {
        // Only apply changes if they're actually different
        const next = applyNodeChanges(changes, prev);
        nodesRef.current = next;            // garde la référence à jour
        return next;
      });

      // on ne notifie le parent qu'à la fin du drag
      if (changes.some(c => c.type === 'position' && c.dragging === false)) {
        onNodesChange?.(nodesRef.current);
      }
    }, 16)                                  // ~60 fps
  ).current;

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
      
      if (window.confirm('Do you want to delete this connection?')) {
        const updatedEdges = edges.filter((e) => e.id !== edge.id);
        setEdges(updatedEdges);
        if (onEdgesChange) onEdgesChange(updatedEdges);
        if (onEdgeDelete) onEdgeDelete(edge, updatedEdges);
        
        // Check if the deleted edge was connected to an API node body field
        if (edge.targetHandle?.startsWith('body-')) {
          // Update the API node bindings
          const updatedNodes = updateApiNodeBindings(nodes, updatedEdges, edge.target);
          setNodes(updatedNodes);
          if (onNodesChange) onNodesChange(updatedNodes);
        }
        
        // No automatic saving - changes are stored in local state only
      }
    },
    [edges, nodes, setEdges, setNodes, onEdgesChange, onEdgeDelete, onNodesChange, canEdit]
  );
  
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
      
      // Check if the source node is connected to a starting node
      const isSourceConnected = connectedIdsRef.current.has(params.source);
      
      const newEdge = {
        id: edgeId,
        source: params.source,
        target: params.target,
        sourceHandle,
        targetHandle,
        style: isExecutionLink && isSourceConnected ? CONNECTED_EXECUTION_LINK_STYLE : 
               isExecutionLink ? EXECUTION_LINK_STYLE : DATA_LINK_STYLE,
        animated: isExecutionLink && isSourceConnected, // Only animate connected execution links
        type: isExecutionLink ? 'smoothstep' : 'default', // Smoother curves for execution links
        data: {
          isExecutionLink: isExecutionLink,
          isConnected: isSourceConnected,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: isExecutionLink ? 15 : 12,
          height: isExecutionLink ? 15 : 12,
          color: isExecutionLink && isSourceConnected ? '#4CAF50' : linkColor,
        },
        labelStyle: { fill: '#333', fontWeight: 500, fontSize: 10 },
        labelBgStyle: { fill: '#fff', fillOpacity: 0.8 },
        className: 'new-connection', // Add class for connection animation
      };

      // Set the animating edge ID to trigger the connection animation
      if (isExecutionLink) {
        setAnimatingEdgeId(edgeId);
        
        // Clear the animation after a delay
        setTimeout(() => {
          // Remove the new-connection class after animation completes
          setEdges(eds => 
            eds.map(e => 
              e.id === edgeId ? { ...e, className: isSourceConnected ? 'connected-edge' : '' } : e
            )
          );
          
          setAnimatingEdgeId(null);
        }, 1000);
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
      
      // No automatic saving - changes are stored in local state only
      
      // If this is an execution link and the source is connected to a starting node,
      // check if the target node is now connected and update it
      if (isExecutionLink && isSourceConnected) {
        setTimeout(() => {
          // Manually update connected nodes after connection without triggering a full re-render
          const newAdjacency = buildAdjacency(updatedEdges);
          adjacencyRef.current = newAdjacency;
          
          const newConnectedIds = markReachable(startingIds, newAdjacency);
          connectedIdsRef.current = newConnectedIds;
          
          // Only update state if the connected nodes actually changed
          if (!connectedIdsRef.current.has(params.target) !== !connectedIds.has(params.target)) {
            setConnectedIds(newConnectedIds);
          }
        }, 100);
      }
    },
    [edges, nodes, setEdges, setNodes, onConnect, onNodesChange, connectedIds, canEdit]
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
        const newNode = {
          id: `condition-node-${Date.now()}`,
          type: 'conditionNode',
          position,
          data: {
            conditionText: condition.conditionText,
            returnText: condition.returnText,
            isStartingPoint: true,
            emailAttributes: {
              email_id: 'email-123', // Added email_id field
              fromEmail: 'sender@example.com',
              fromDisplayName: 'Sender Name',
              toEmail: 'recipient@example.com',
              toDisplayName: 'Recipient Name',
              subject: 'Email Subject',
              date: new Date().toISOString(),
              content: 'Email content preview...',
              attachments: [],
              cc: [],
              bcc: [],
            },
          },
        };
        let updatedNodes = nodes.concat(newNode);
        // Removed the code that sets other condition nodes' isStartingPoint to false
        // This allows multiple starting points to be active simultaneously
        setNodes(updatedNodes);
        if (onNodesChange) onNodesChange(updatedNodes);
        
        // Log successful condition node creation
        console.log('✅ [DIAGRAM EDITOR] Condition node created:', condition.conditionText);
        return;
      }

      // Ajout d'un nœud sendingMail ou text
      const nodeType = event.dataTransfer.getData('application/nodeType');
      if (nodeType === 'sendingMailNode') {
        const newNode = {
          id: `sending-mail-node-${Date.now()}`,
          type: 'sendingMailNode',
          position,
          data: {
            emailAttributes: {
              account_id: '',
              fromEmail: 'sender@example.com',
              fromDisplayName: 'Sender Name',
              toEmail: 'recipient@example.com',
              toDisplayName: 'Recipient Name',
              subject: 'Email Subject',
              content: 'Email content...',
              reply_to: '',
              cc: [],
              bcc: [],
              custom_headers: [],
            },
          },
        };
        const updatedNodes = nodes.concat(newNode);
        setNodes(updatedNodes);
        if (onNodesChange) onNodesChange(updatedNodes);
      } else if (nodeType === 'textNode') {
        const nodeId = `text-node-${Date.now()}`;
        
        // Create the node without inline callbacks
        const newNode = {
          id: nodeId,
          type: 'textNode',
          position,
          data: {
            text: 'Enter text here...',
            onTextChange: null, // Will be set via ref
          },
        };
        
        // Store the callback in the ref
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
        
        // Set the callback reference
        newNode.data.onTextChange = (newText) => nodeCallbacksRef.current[nodeId].onTextChange(newText);
        
        const updatedNodes = nodes.concat(newNode);
        setNodes(updatedNodes);
        if (onNodesChange) onNodesChange(updatedNodes);
      } else if (nodeType === 'intNode') {
        const nodeId = `int-node-${Date.now()}`;
        
        // Create the node without inline callbacks
        const newNode = {
          id: nodeId,
          type: 'intNode',
          position,
          data: {
            value: 0,
            onValueChange: null, // Will be set via ref
          },
        };
        
        // Store the callback in the ref
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
        
        // Set the callback reference
        newNode.data.onValueChange = (newValue) => nodeCallbacksRef.current[nodeId].onValueChange(newValue);
        
        const updatedNodes = nodes.concat(newNode);
        setNodes(updatedNodes);
        if (onNodesChange) onNodesChange(updatedNodes);
      } else if (nodeType === 'emailAttachmentNode') {
        const newNode = {
          id: `email-attachment-node-${Date.now()}`,
          type: 'emailAttachmentNode',
          position,
          data: {
            emailAttributes: {
              account_id: '',
              email_id: '',
              attachment_id: ''
            },
          },
        };
        const updatedNodes = nodes.concat(newNode);
        setNodes(updatedNodes);
        if (onNodesChange) onNodesChange(updatedNodes);
      } else if (nodeType === 'ocrNode') {
        const newNode = {
          id: `ocr-node-${Date.now()}`,
          type: 'ocrNode',
          position,
          data: {
            ocrAttributes: {
              attachment_data: null,
              language: 'auto',
              enhance_image: false
            },
          },
        };
        const updatedNodes = nodes.concat(newNode);
        setNodes(updatedNodes);
        if (onNodesChange) onNodesChange(updatedNodes);
      } else if (nodeType === 'consoleLogNode') {
        const newNode = {
          id: `console-log-node-${Date.now()}`,
          type: 'consoleLogNode',
          position,
          data: {},
        };
        const updatedNodes = nodes.concat(newNode);
        setNodes(updatedNodes);
        if (onNodesChange) onNodesChange(updatedNodes);
      } else if (nodeType === 'aiNode') {
        const nodeId = `ai-node-${Date.now()}`;
        
        // Create the node without inline callbacks
        const newNode = {
          id: nodeId,
          type: 'aiNode',
          position,
          data: {
            prompt: 'Enter your prompt here...',
            input: '',
            output: '',
            onPromptChange: null, // Will be set via ref
            onInputChange: null, // Will be set via ref
          },
        };
        
        // Store the callbacks in the ref
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
        
        // Set the callback references
        newNode.data.onPromptChange = (newPrompt) => nodeCallbacksRef.current[nodeId].onPromptChange(newPrompt);
        newNode.data.onInputChange = (newInput) => nodeCallbacksRef.current[nodeId].onInputChange(newInput);
        
        const updatedNodes = nodes.concat(newNode);
        setNodes(updatedNodes);
        if (onNodesChange) onNodesChange(updatedNodes);
      } else if (nodeType === 'conditionalFlowNode') {
        const nodeId = `conditional-flow-node-${Date.now()}`;
        
        // Create the node without inline callbacks
        const newNode = {
          id: nodeId,
          type: 'conditionalFlowNode',
          position,
          data: {
            conditionType: 'equals',
            value: '',
            inputValue: '',
            onConditionTypeChange: null, // Will be set via ref
            onValueChange: null, // Will be set via ref
            onInputValueChange: null, // Will be set via ref
          },
        };
        
        // Store the callbacks in the ref
        nodeCallbacksRef.current[nodeId] = {
          onConditionTypeChange: (newType) => {
            setNodes(prevNodes => {
              const updated = prevNodes.map(node =>
                node.id === nodeId
                  ? { ...node, data: { ...node.data, conditionType: newType } }
                  : node
              );
              // Update our ref
              nodesRef.current = updated;
              // Notify the parent INSIDE setNodes
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
              // Update our ref
              nodesRef.current = updated;
              // Notify the parent INSIDE setNodes
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
              // Update our ref
              nodesRef.current = updated;
              // Notify the parent INSIDE setNodes
              onNodesChange?.(updated);
              return updated;
            });
          }
        };
        
        // Set the callback references
        newNode.data.onConditionTypeChange = (newType) => nodeCallbacksRef.current[nodeId].onConditionTypeChange(newType);
        newNode.data.onValueChange = (newValue) => nodeCallbacksRef.current[nodeId].onValueChange(newValue);
        newNode.data.onInputValueChange = (newInputValue) => nodeCallbacksRef.current[nodeId].onInputValueChange(newInputValue);
        
        const updatedNodes = nodes.concat(newNode);
        setNodes(updatedNodes);
        if (onNodesChange) onNodesChange(updatedNodes);
      } else if (nodeType === 'switchNode') {
        const nodeId = `switch-node-${Date.now()}`;
        
        // Create the node without inline callbacks
        const newNode = {
          id: nodeId,
          type: 'switchNode',
          position,
          data: {
            cases: [
              { id: '1', value: '', label: 'Case 1' },
              { id: '2', value: '', label: 'Case 2' }
            ],
            onCasesChange: null, // Will be set via ref
          },
        };
        
        // Store the callbacks in the ref
        nodeCallbacksRef.current[nodeId] = {
          onCasesChange: (newCases) => {
            setNodes(prevNodes => {
              const updated = prevNodes.map(node =>
                node.id === nodeId
                  ? { ...node, data: { ...node.data, cases: newCases } }
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
        
        // Set the callback references
        newNode.data.onCasesChange = (newCases) => nodeCallbacksRef.current[nodeId].onCasesChange(newCases);
        
        const updatedNodes = nodes.concat(newNode);
        setNodes(updatedNodes);
        if (onNodesChange) onNodesChange(updatedNodes);
      } else if (nodeType === 'logicalOperatorNode') {
        const nodeId = `logical-operator-node-${Date.now()}`;
        
        // Create the node without inline callbacks
        const newNode = {
          id: nodeId,
          type: 'logicalOperatorNode',
          position,
          data: {
            operatorType: 'AND',
            inputCount: 2,
            onOperatorTypeChange: null, // Will be set via ref
            onInputCountChange: null, // Will be set via ref
          },
        };
        
        // Store the callbacks in the ref
        nodeCallbacksRef.current[nodeId] = {
          onOperatorTypeChange: (newType) => {
            setNodes(prevNodes => {
              const updated = prevNodes.map(node =>
                node.id === nodeId
                  ? { ...node, data: { ...node.data, operatorType: newType } }
                  : node
              );
              // Update our ref
              nodesRef.current = updated;
              // Notify the parent INSIDE setNodes
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
              // Update our ref
              nodesRef.current = updated;
              // Notify the parent INSIDE setNodes
              onNodesChange?.(updated);
              return updated;
            });
          }
        };
        
        // Set the callback references
        newNode.data.onOperatorTypeChange = (newType) => nodeCallbacksRef.current[nodeId].onOperatorTypeChange(newType);
        newNode.data.onInputCountChange = (newCount) => nodeCallbacksRef.current[nodeId].onInputCountChange(newCount);
        
        const updatedNodes = nodes.concat(newNode);
        setNodes(updatedNodes);
        if (onNodesChange) onNodesChange(updatedNodes);
      } else if (nodeType === 'booleanNode') {
        const nodeId = `boolean-node-${Date.now()}`;
        
        // Create the node without inline callbacks
        const newNode = {
          id: nodeId,
          type: 'booleanNode',
          position,
          data: {
            value: false,
            onValueChange: null, // Will be set via ref
          },
        };
        
        // Store the callback in the ref
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
        
        // Set the callback reference
        newNode.data.onValueChange = (newValue) => nodeCallbacksRef.current[nodeId].onValueChange(newValue);
        
        const updatedNodes = nodes.concat(newNode);
        setNodes(updatedNodes);
        if (onNodesChange) onNodesChange(updatedNodes);
      } else if (nodeType === 'tokenNode') {
        const nodeId = `token-node-${Date.now()}`;
        
        // Create the node without inline callbacks
        const newNode = {
          id: nodeId,
          type: 'tokenNode',
          position,
          data: {
            token: '',
            onTokenChange: null, // Will be set via ref
          },
        };
        
        // Store the callback in the ref
        nodeCallbacksRef.current[nodeId] = {
          onTokenChange: (newToken) => {
            setNodes(prevNodes => {
              const updated = prevNodes.map(node =>
                node.id === nodeId
                  ? { ...node, data: { ...node.data, token: newToken } }
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
        
        // Set the callback reference
        newNode.data.onTokenChange = (newToken) => nodeCallbacksRef.current[nodeId].onTokenChange(newToken);
        
        const updatedNodes = nodes.concat(newNode);
        setNodes(updatedNodes);
        if (onNodesChange) onNodesChange(updatedNodes);
      } else if (nodeType === 'base64Node') {
        const newNode = {
          id: `base64-node-${Date.now()}`,
          type: 'base64Node',
          position,
          data: {},
        };
        const updatedNodes = nodes.concat(newNode);
        setNodes(updatedNodes);
        if (onNodesChange) onNodesChange(updatedNodes);
      } else if (nodeType === 'mailBodyNode') {
        const nodeId = `mail-body-node-${Date.now()}`;
        
        // Create the node without inline callbacks
        const newNode = {
          id: nodeId,
          type: 'mailBodyNode',
          position,
          data: {
            content: '',
            onContentChange: null, // Will be set via ref
          },
        };
        
        // Store the callback in the ref
        nodeCallbacksRef.current[nodeId] = {
          onContentChange: (newContent) => {
            setNodes(prevNodes => {
              const updated = prevNodes.map(node =>
                node.id === nodeId
                  ? { ...node, data: { ...node.data, content: newContent } }
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
        
        // Set the callback reference
        newNode.data.onContentChange = (newContent) => nodeCallbacksRef.current[nodeId].onContentChange(newContent);
        
        const updatedNodes = nodes.concat(newNode);
        setNodes(updatedNodes);
        if (onNodesChange) onNodesChange(updatedNodes);
      } else if (nodeType === 'endNode') {
        const newNode = {
          id: `end-node-${Date.now()}`,
          type: 'endNode',
          position,
          data: {},
        };
        const updatedNodes = nodes.concat(newNode);
        setNodes(updatedNodes);
        if (onNodesChange) onNodesChange(updatedNodes);
      } else if (nodeType === 'apiNode') {
        // Get the API node data from the dataTransfer
        const apiNodeDataString = event.dataTransfer.getData('application/apiNodeData');
        if (apiNodeDataString) {
          try {
            const apiNodeData = JSON.parse(apiNodeDataString);
            const newNode = {
              id: `api-node-${Date.now()}`,
              type: 'apiNode',
              position,
              data: apiNodeData
            };
            const updatedNodes = nodes.concat(newNode);
            setNodes(updatedNodes);
            if (onNodesChange) onNodesChange(updatedNodes);
          } catch (error) {
            console.error('Error parsing API node data:', error);
          }
        }
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

  const startingPointNodes = useMemo(
    () =>
      nodes.filter(
        (node) =>
          node.type === 'conditionNode' && node.data.isStartingPoint === true
      ),
    [nodes]
  );

  // We no longer need to manually add connection indicators
  // They are now handled by CSS with .connected-node::after

  // No need for local DeleteButton component as we're importing it

  // Cache for previous node data to avoid unnecessary updates
  const prevNodesDataRef = useRef(new Map());
  
  // Memoize nodes with connection status to avoid unnecessary re-renders
  const memoNodes = useMemo(() => {
    // Create a stable reference to the connected nodes set
    const connectedNodesSet = connectedIdsRef.current;
    const result = nodes.map(n => {
      const connected = connectedNodesSet.has(n.id);
      const isSelected = n.id === selectedNodeId;
      const className = `${connected ? 'connected-node' : ''} ${isSelected ? 'selected-node' : ''}`;
      
      // Check if we need to update this node's data
      const prevNodeData = prevNodesDataRef.current.get(n.id);
      const prevConnected = prevNodeData?.isConnectedToStartingNode;
      const prevSelected = prevNodeData?.isSelected;
      
      // Only create a new data object if something has changed
      if (!prevNodeData || 
          prevConnected !== connected || 
          prevSelected !== isSelected) {
        
        // Create new data object only when needed
        const newData = {
          ...n.data,
          isConnectedToStartingNode: connected,
          isSelected,
          // Use a stable reference to the delete button component
          deleteButton: isSelected ? <DeleteButton id={n.id} onDelete={handleNodeDelete} /> : null
        };
        
        // Store the current state for future comparison
        prevNodesDataRef.current.set(n.id, {
          isConnectedToStartingNode: connected,
          isSelected
        });
        
        return {
          ...n,
          className,
          data: newData
        };
      }
      
      // If nothing changed, return the node with minimal updates
      return {
        ...n,
        className,
        data: {
          ...n.data,
          deleteButton: isSelected ? <DeleteButton id={n.id} onDelete={handleNodeDelete} /> : null
        }
      };
    });
    
    // Clean up any nodes that no longer exist
    const currentNodeIds = new Set(nodes.map(n => n.id));
    for (const nodeId of prevNodesDataRef.current.keys()) {
      if (!currentNodeIds.has(nodeId)) {
        prevNodesDataRef.current.delete(nodeId);
      }
    }
    
    return result;
  }, [nodes, selectedNodeId, DeleteButton]); // Removed connectedIds from dependencies

  // Cache for previous edge data to avoid unnecessary updates
  const prevEdgesDataRef = useRef(new Map());
  
  // Memoize edges with connection styling
  const computedEdges = useMemo(() => {
    // Create a stable reference to the connected nodes set
    const connectedNodesSet = connectedIdsRef.current;
    
    const result = edges.map(e => {
      if (e.data?.isExecutionLink) {
        const connected =
          connectedNodesSet.has(e.source) && connectedNodesSet.has(e.target);
        
        // Check if we need to update this edge
        const prevEdgeData = prevEdgesDataRef.current.get(e.id);
        const prevConnected = prevEdgeData?.connected;
        
        // Only create a new edge object if the connection status has changed
        if (!prevEdgeData || prevConnected !== connected) {
          // Store the current state for future comparison
          prevEdgesDataRef.current.set(e.id, { connected });
          
          return {
            ...e,
            style: connected ? CONNECTED_EXECUTION_LINK_STYLE : EXECUTION_LINK_STYLE,
            animated: connected,
            className: connected ? 'connected-edge' : ''
          };
        }
      }
      return e;
    });
    
    // Clean up any edges that no longer exist
    const currentEdgeIds = new Set(edges.map(e => e.id));
    for (const edgeId of prevEdgesDataRef.current.keys()) {
      if (!currentEdgeIds.has(edgeId)) {
        prevEdgesDataRef.current.delete(edgeId);
      }
    }
    
    return result;
  }, [edges]); // Removed connectedIds from dependencies

  return (
    <div
      ref={reactFlowWrapper}
      className="diagram-editor"
      style={{ width: '100%', height: '100%', position: 'relative' }}
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
          {nodes.length < 80 && <MiniMap />}
          <Background variant="dots" gap={12} size={1} />
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
    </div>
  );
};

export default DiagramEditor;
