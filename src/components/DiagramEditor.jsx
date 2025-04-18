import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo
} from 'react';
import { throttle } from 'lodash';
import { buildAdjacency, markReachable } from '../utils/graph';
import FlowMenuButton from './FlowMenuButton';
import { useFlowManager } from '../context/FlowManagerContext';
import BackendConfigSelector from './settings/BackendConfigSelector';
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

import ApiNode from './ApiNode';
import ConditionNode from './ConditionNode';
import SendingMailNode from './SendingMailNode';
import EmailAttachmentNode from './EmailAttachmentNode';
import TextNode from './TextNode';
import IntNode from './IntNode';
import OcrNode from './OcrNode';
import ConsoleLogNode from './ConsoleLogNode';
import conditionStore from '../store/conditionStore';

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
  sendingMailNode: SendingMailNode,
  emailAttachmentNode: EmailAttachmentNode,
  textNode: TextNode,
  intNode: IntNode,
  ocrNode: OcrNode,
  consoleLogNode: ConsoleLogNode,
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
  const { currentFlow, saveCurrentFlow } = useFlowManager();
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
  
  // Store node callbacks in a ref to prevent recreation on each render
  const nodeCallbacksRef = useRef({});
  
  // Reference to track current nodes state
  const nodesRef = useRef([]);
  
  // Reference to track previous flow ID
  const prevFlowId = useRef();

  // Effet pour charger les nœuds et les arêtes lorsque le flow courant change
  useEffect(() => {
    if (!currentFlow) return;
    if (currentFlow.id === prevFlowId.current) return;
    prevFlowId.current = currentFlow.id;

    // Get the version to use (either the current version or the flow itself for backward compatibility)
    const version = currentFlow.versions?.[currentFlow.currentVersionIndex] || currentFlow;
    
    // Load nodes
    if (version.nodes) {
      setNodes(version.nodes);
      if (onNodesChange) onNodesChange(version.nodes);
    } else {
      setNodes([]);
      if (onNodesChange) onNodesChange([]);
    }
    
    // Load edges with default sourceHandle/targetHandle if needed
    if (version.edges) {
      const processedEdges = version.edges.map(edge => {
        // If sourceHandle or targetHandle is missing, add default values based on the edge type
        if (!edge.sourceHandle || !edge.targetHandle) {
          const isExecutionLink = edge.data?.isExecutionLink;
          return {
            ...edge,
            sourceHandle: edge.sourceHandle || (isExecutionLink ? 'execution' : `${edge.source}-out`),
            targetHandle: edge.targetHandle || (isExecutionLink ? 'execution' : `${edge.target}-in`)
          };
        }
        return edge;
      });
      
      // Clean up edges without handles to eliminate warnings
      const sanitisedEdges = processedEdges.filter(e => e.sourceHandle && e.targetHandle);
      setEdges(sanitisedEdges);
      if (onEdgesChange) onEdgesChange(sanitisedEdges);
    } else {
      setEdges([]);
      if (onEdgesChange) onEdgesChange([]);
    }
  }, [currentFlow?.id, setNodes, setEdges, onNodesChange, onEdgesChange]);

  // Throttled version of node changes to improve performance during dragging
  const throttledApply = useRef(
    throttle((changes) => {
      setNodes(prev => {
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
      const updatedEdges = applyEdgeChanges(changes, edges);
      setEdges(updatedEdges);
      if (onEdgesChange) onEdgesChange(updatedEdges);
      
      // No automatic saving - changes are stored in local state only
    },
    [edges, setEdges, onEdgesChange]
  );

  const handleEdgeClick = useCallback(
    (event, edge) => {
      if (window.confirm('Do you want to delete this connection?')) {
        const updatedEdges = edges.filter((e) => e.id !== edge.id);
        setEdges(updatedEdges);
        if (onEdgesChange) onEdgesChange(updatedEdges);
        if (onEdgeDelete) onEdgeDelete(edge, updatedEdges);
        
        // No automatic saving - changes are stored in local state only
      }
    },
    [edges, setEdges, onEdgesChange, onEdgeDelete]
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
      const edgeId = `edge-${Date.now()}`;
      
      // Add default handles if missing
      const sourceHandle = params.sourceHandle ?? 'default-out';
      const targetHandle = params.targetHandle ?? 'default-in';
      
      // Determine if this is an execution link or a data link
      // Execution links connect handles with IDs 'execution'
      const isExecutionLink = 
        sourceHandle === 'execution' && 
        targetHandle === 'execution';
      
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
    [edges, nodes, setEdges, setNodes, onConnect, connectedIds]
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
            setNodes((prevNodes) =>
              prevNodes.map((n) =>
                n.id === nodeId ? { ...n, data: { ...n.data, text: newText } } : n
              )
            );
            if (onNodesChange) {
              onNodesChange(
                prevNodes => prevNodes.map((n) =>
                  n.id === nodeId ? { ...n, data: { ...n.data, text: newText } } : n
                )
              );
            }
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
            setNodes((prevNodes) =>
              prevNodes.map((n) =>
                n.id === nodeId ? { ...n, data: { ...n.data, value: newValue } } : n
              )
            );
            if (onNodesChange) {
              onNodesChange(
                prevNodes => prevNodes.map((n) =>
                  n.id === nodeId ? { ...n, data: { ...n.data, value: newValue } } : n
                )
              );
            }
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
    [reactFlowInstance, nodes, setNodes, onNodesChange]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

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

  // Memoize nodes with connection status to avoid unnecessary re-renders
  const memoNodes = useMemo(() => nodes.map(n => {
    const connected = connectedIdsRef.current.has(n.id);
    return {
      ...n,
      className: connected ? 'connected-node' : '',
      data: { ...n.data, isConnectedToStartingNode: connected }
    };
  }), [nodes, connectedIds]); // Only depends on nodes and connectedIds state (not the ref)

  // Memoize edges with connection styling
  const computedEdges = useMemo(
    () =>
      edges.map(e => {
        if (e.data?.isExecutionLink) {
          const connected =
            connectedIdsRef.current.has(e.source) && connectedIdsRef.current.has(e.target);
          return {
            ...e,
            style: connected ? CONNECTED_EXECUTION_LINK_STYLE : EXECUTION_LINK_STYLE,
            animated: connected,
            className: connected ? 'connected-edge' : ''
          };
        }
        return e;
      }),
    [edges, connectedIds] // Only depends on edges and connectedIds state (not the ref)
  );

  return (
    <div
      ref={reactFlowWrapper}
      className="diagram-editor"
      style={{ width: '100%', height: '100%' }}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <ReactFlowProvider>
        <ReactFlow
          nodes={memoNodes}
          edges={computedEdges}
          onNodesChange={throttledApply}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onEdgeClick={handleEdgeClick}
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
              <h3>API Diagram</h3>
              <p>{nodes.length} endpoints loaded</p>
              {nodes.length > 0 && (
                <button
                  className="fit-view-button"
                  onClick={() => {
                    document.querySelector('.react-flow__controls-fitview')?.click();
                  }}
                >
                  Fit View
                </button>
              )}
            </div>
          </Panel>
          
          <Panel position="top-left" style={{ marginTop: '10px' }}>
            <BackendConfigSelector />
          </Panel>
        </ReactFlow>
        
        {/* bouton menu + save : n'est PLUS dans <Panel> */}
        <FlowMenuButton />
      </ReactFlowProvider>
    </div>
  );
};

export default DiagramEditor;
