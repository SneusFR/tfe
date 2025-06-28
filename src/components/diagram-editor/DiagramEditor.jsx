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
import ConnectionErrorModal from './components/ConnectionErrorModal';
import DiagramToolbar from './components/DiagramToolbar';
import NoFlowOverlay from './components/NoFlowOverlay';
import LeftPanel from './components/LeftPanel';
import DiagramCanvas from './components/DiagramCanvas';
import DeleteButton from '../common/DeleteButton';
import { throttle, debounce } from 'lodash';
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
import { useLoadFlow } from './hooks/useLoadFlow';
import { useEdges } from './hooks/useEdges';
import { useNodeSelection } from './hooks/useNodeSelection';
import { useNodeDrop } from './hooks/useNodeDrop';
import { useAIGenerator } from './hooks/useAIGenerator';
import { useSaveFlow } from './hooks/useSaveFlow';
import { useReactFlowInit } from './hooks/useReactFlowInit';
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
  const [deleteConnectionModalOpen, setDeleteConnectionModalOpen] = useState(false);
  const [edgeToDelete, setEdgeToDelete] = useState(null);
  
  // Add class to body when diagram editor is active
  useEffect(() => {
    document.body.classList.add('diagram-editor-active');
    return () => {
      document.body.classList.remove('diagram-editor-active');
    };
  }, []);
  
  const reactFlowWrapper = useRef(null);
  // State for selection mode and selected nodes
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedNodesForSelection, setSelectedNodesForSelection] = useState([]);
  
  // Declare selectedNodeId state before using it in useDiagramPerformance
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  
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
  
  // Use the ReactFlow initialization hook
  const {
    reactFlowInstance,
    setReactFlowInstance,
    onInit
  } = useReactFlowInit(nodes);
  
  // Use the node selection hook
  const {
    handleNodeClick,
    handleNodeDelete
  } = useNodeSelection({
    nodes,
    edges,
    setNodes,
    setEdges,
    canEdit,
    onNodesChange,
    onEdgesChange,
    selectedNodeId,
    setSelectedNodeId
  });
  
  // Use the subflows hook
  const { 
    createSubFlows, 
    expandSubFlowRef,
    collapsedSubFlows,
    setCollapsedSubFlows,
    originalNodesAndEdges,
    setOriginalNodesAndEdges
  } = useSubFlows(nodes, edges, setNodes, setEdges, onNodesChange, onEdgesChange, canEdit);

  // Use the load flow hook
  const { prevFlowId } = useLoadFlow(
    currentFlow,
    {
      nodes,
      edges,
      setNodes,
      setEdges,
      nodesRef,
      nodeCallbacksRef,
      onNodesChange,
      onEdgesChange,
      setCollapsedSubFlows,
      setOriginalNodesAndEdges,
      expandSubFlowRef
    }
  );

  // Reset selected node when flow changes
  useEffect(() => {
    if (currentFlow && currentFlow.id !== prevFlowId.current) {
      setSelectedNodeId(null);
    }
  }, [currentFlow, prevFlowId]);

  // Use the edges hook
  const { 
    handleEdgesChange, 
    handleConnect, 
    connectionErrorModalOpen, 
    errorMessage, 
    handleCloseErrorModal 
  } = useEdges({
    nodes,
    edges,
    setNodes,
    setEdges,
    canEdit,
    onEdgesChange,
    onNodesChange,
    onConnect,
    setAnimatingEdge
  });
  
  // Use the node drop hook
  const { onDrop, onDragOver } = useNodeDrop({
    reactFlowInstance,
    nodes,
    setNodes,
    onNodesChange,
    canEdit,
    nodeCallbacksRef,
    nodesRef
  });
  
  // Use the save flow hook
  const {
    handleSave,
    loading,
    snackbarProps,
    setMessage,
    setSeverity,
    setOpen
  } = useSaveFlow({
    currentFlow,
    nodes,
    edges,
    canEdit,
    saveCurrentFlow
  });
  
  // Use the AI generator hook
  const { 
    aiFlowBuilderOpen, 
    openAIGenerator, 
    closeAIGenerator,
    onFlowGenerated
  } = useAIGenerator({
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    canEdit,
    reactFlowInstance,
    setMessage,
    setSeverity,
    setOpen
  });

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
  

  // We let React-Flow handle the selection and add the .selected class automatically

  




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
      {!currentFlow && <NoFlowOverlay toggleFlowModal={toggleFlowModal} />}
      <ReactFlowProvider>
<FlowProvider
  nodes={nodes}
  edges={edges}
  flowId={currentFlow?.id}
  subFlowOriginals={originalNodesAndEdges}   
>
  {/* Create a memoized version of nodes with the delete handler added */}
  {(() => {
    // Use useMemo to prevent unnecessary re-renders
    const nodesWithDelete = useMemo(() => {
      return nodes.map(n => ({
        ...n,
        data: {
          ...n.data,
          onDelete: handleNodeDelete
        }
      }));
    }, [nodes, handleNodeDelete]);
    
    return (
      <DiagramCanvas
        nodes={nodesWithDelete}
        edges={computedEdges}
        onNodesChange={throttledApply}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onEdgeClick={handleEdgeClick}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={onInit}
        selectionMode={selectionMode}
        throttledSelectionChange={throttledSelectionChange}
      >
    {/* Diagram Toolbar */}
    <DiagramToolbar 
      currentFlow={currentFlow}
      nodes={nodes}
      canEdit={canEdit}
      hasAccess={hasAccess}
      loading={loading}
      createSubFlows={createSubFlows}
      handleSave={handleSave}
      toggleFlowModal={toggleFlowModal}
      setAiFlowBuilderOpen={openAIGenerator}
    />
    
    {/* Left Panel */}
    <LeftPanel />
      </DiagramCanvas>
    );
  })()}
          
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
        open={snackbarProps.open}
        autoHideDuration={6000}
        onClose={snackbarProps.onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={snackbarProps.onClose} severity={snackbarProps.severity} sx={{ width: '100%' }}>
          {snackbarProps.message}
        </Alert>
      </Snackbar>
      
      {/* AI Flow Builder Dialog */}
      <AIFlowBuilder 
        open={aiFlowBuilderOpen}
        onClose={closeAIGenerator}
        nodes={nodes}
        edges={edges}
        onFlowGenerated={onFlowGenerated}
      />
      
      {/* Custom Delete Connection Modal */}
      <DeleteConnectionModal 
        isOpen={deleteConnectionModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
      
      {/* Connection Error Modal */}
      <ConnectionErrorModal 
        isOpen={connectionErrorModalOpen}
        onClose={handleCloseErrorModal}
        message={errorMessage}
      />
    </div>
  );
};

// Create a memoized version of the DiagramEditor component with custom equality check
export default memo(DiagramEditor, (prev, next) =>
  prev.nodes === next.nodes && prev.edges === next.edges
);
