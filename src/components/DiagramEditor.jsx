import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo
} from 'react';
import { useFlowManager } from '../context/FlowManagerContext';
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

// Déclaration des types de nœuds en dehors du composant
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
  const [connectedNodeIds, setConnectedNodeIds] = useState(new Set());
  const [animatingEdgeId, setAnimatingEdgeId] = useState(null);

  // Initialisation des nœuds et des arêtes à partir des props ou du flow courant
  useEffect(() => {
    if (initialNodes && initialNodes.length > 0) {
      setNodes(initialNodes);
    } else if (currentFlow) {
      // Check if the flow has versions
      if (currentFlow.versions) {
        const currentVersion = currentFlow.versions[currentFlow.currentVersionIndex];
        if (currentVersion && currentVersion.nodes && currentVersion.nodes.length > 0) {
          setNodes(currentVersion.nodes);
          if (onNodesChange) onNodesChange(currentVersion.nodes);
        }
      } else if (currentFlow.nodes && currentFlow.nodes.length > 0) {
        // Backward compatibility for flows without versions
        setNodes(currentFlow.nodes);
        if (onNodesChange) onNodesChange(currentFlow.nodes);
      }
    }
  }, [initialNodes, currentFlow, setNodes, onNodesChange]);

  useEffect(() => {
    if (initialEdges && initialEdges.length > 0) {
      setEdges(initialEdges);
    } else if (currentFlow) {
      // Check if the flow has versions
      if (currentFlow.versions) {
        const currentVersion = currentFlow.versions[currentFlow.currentVersionIndex];
        if (currentVersion && currentVersion.edges && currentVersion.edges.length > 0) {
          setEdges(currentVersion.edges);
          if (onEdgesChange) onEdgesChange(currentVersion.edges);
        }
      } else if (currentFlow.edges && currentFlow.edges.length > 0) {
        // Backward compatibility for flows without versions
        setEdges(currentFlow.edges);
        if (onEdgesChange) onEdgesChange(currentFlow.edges);
      }
    }
  }, [initialEdges, currentFlow, setEdges, onEdgesChange]);

  const handleNodesChange = useCallback(
    (changes) => {
      const updatedNodes = applyNodeChanges(changes, nodes);
      setNodes(updatedNodes);
      if (onNodesChange) onNodesChange(updatedNodes);
      
      // Save flow when nodes change
      if (currentFlow) {
        saveCurrentFlow(updatedNodes, edges);
      }
    },
    [nodes, edges, setNodes, onNodesChange, currentFlow, saveCurrentFlow]
  );

  const handleEdgesChange = useCallback(
    (changes) => {
      const updatedEdges = applyEdgeChanges(changes, edges);
      setEdges(updatedEdges);
      if (onEdgesChange) onEdgesChange(updatedEdges);
      
      // Save flow when edges change
      if (currentFlow) {
        saveCurrentFlow(nodes, updatedEdges);
      }
    },
    [nodes, edges, setEdges, onEdgesChange, currentFlow, saveCurrentFlow]
  );

  const handleEdgeClick = useCallback(
    (event, edge) => {
      if (window.confirm('Do you want to delete this connection?')) {
        const updatedEdges = edges.filter((e) => e.id !== edge.id);
        setEdges(updatedEdges);
        if (onEdgesChange) onEdgesChange(updatedEdges);
        if (onEdgeDelete) onEdgeDelete(edge, updatedEdges);
        
        // Save flow when an edge is deleted
        if (currentFlow) {
          saveCurrentFlow(nodes, updatedEdges);
        }
      }
    },
    [edges, nodes, setEdges, onEdgesChange, onEdgeDelete, currentFlow, saveCurrentFlow]
  );

  // Tous les handles sont compatibles entre eux
  const areHandlesCompatible = () => true;

  // Function to check if a node is connected to a starting node
  const isConnectedToStartingNode = useCallback((nodeId, visitedNodes = new Set()) => {
    // Prevent infinite loops from circular connections
    if (visitedNodes.has(nodeId)) return false;
    visitedNodes.add(nodeId);
    
    // Check if this is a starting node
    const node = nodes.find(n => n.id === nodeId);
    if (node?.type === 'conditionNode' && node.data.isStartingPoint === true) {
      return true;
    }
    
    // Check all incoming execution edges
    const incomingExecutionEdges = edges.filter(
      edge => edge.target === nodeId && 
              edge.targetHandle === 'execution' && 
              edge.sourceHandle === 'execution'
    );
    
    // Recursively check if any source node is connected to a starting node
    return incomingExecutionEdges.some(edge => 
      isConnectedToStartingNode(edge.source, new Set(visitedNodes))
    );
  }, [nodes, edges]);
  
  // Update connected nodes whenever nodes or edges change
  useEffect(() => {
    // Only run this effect if we have nodes and edges
    if (nodes.length === 0) return;
    
    const connected = new Set();
    
    // Check each node to see if it's connected to a starting node
    nodes.forEach(node => {
      if (node.type === 'conditionNode' && node.data.isStartingPoint === true) {
        connected.add(node.id); // Starting nodes are always "connected"
      } else if (isConnectedToStartingNode(node.id)) {
        connected.add(node.id);
      }
    });
    
    // Only update if the connected nodes have changed
    const connectedArray = Array.from(connected);
    const prevConnectedArray = Array.from(connectedNodeIds);
    
    if (JSON.stringify(connectedArray.sort()) !== JSON.stringify(prevConnectedArray.sort())) {
      setConnectedNodeIds(connected);
      
      // Update nodes with connected status
      setNodes(nodes => 
        nodes.map(node => ({
          ...node,
          className: connected.has(node.id) ? 'connected-node' : '',
          data: {
            ...node.data,
            isConnectedToStartingNode: connected.has(node.id)
          }
        }))
      );
      
      // Update edges to show connection status
      setEdges(edges => 
        edges.map(edge => {
          if (edge.data?.isExecutionLink) {
            const isConnected = connected.has(edge.source) && connected.has(edge.target);
            return {
              ...edge,
              style: isConnected ? CONNECTED_EXECUTION_LINK_STYLE : EXECUTION_LINK_STYLE,
              animated: isConnected, // Only animate connected execution links
              className: isConnected ? 'connected-edge' : ''
            };
          }
          return edge;
        })
      );
    }
  }, [nodes, edges, isConnectedToStartingNode, connectedNodeIds, setNodes, setEdges]);
  
  // Création d'une arête avec distinction entre lien d'exécution et lien de données
  const handleConnect = useCallback(
    (params) => {
      const edgeId = `edge-${Date.now()}`;
      
      // Determine if this is an execution link or a data link
      // Execution links connect handles with IDs 'execution'
      const isExecutionLink = 
        params.sourceHandle === 'execution' && 
        params.targetHandle === 'execution';
      
      const linkColor = isExecutionLink ? EXECUTION_LINK_COLOR : DATA_LINK_COLOR;
      
      // Check if the source node is connected to a starting node
      const isSourceConnected = connectedNodeIds.has(params.source);
      
      const newEdge = {
        id: edgeId,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
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
      
      // Save flow when a new connection is made
      if (currentFlow) {
        saveCurrentFlow(nodes, updatedEdges);
      }
      
      // If this is an execution link and the source is connected to a starting node,
      // check if the target node is now connected and update it
      if (isExecutionLink && isSourceConnected) {
        setTimeout(() => {
          // Trigger a re-evaluation of connected nodes
          const targetNode = nodes.find(n => n.id === params.target);
          if (targetNode && !connectedNodeIds.has(targetNode.id)) {
            // Force update to trigger the connected nodes effect
            setNodes([...nodes]);
          }
        }, 100);
      }
    },
    [edges, nodes, setEdges, setNodes, onConnect, currentFlow, saveCurrentFlow, connectedNodeIds]
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
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
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
        const newNode = {
          id: `text-node-${Date.now()}`,
          type: 'textNode',
          position,
          data: {
            text: 'Enter text here...',
            onTextChange: (newText) => {
              setNodes((prevNodes) =>
                prevNodes.map((n) =>
                  n.id === newNode.id ? { ...n, data: { ...n.data, text: newText } } : n
                )
              );
              if (onNodesChange) {
                onNodesChange((prevNodes) =>
                  prevNodes.map((n) =>
                    n.id === newNode.id ? { ...n, data: { ...n.data, text: newText } } : n
                  )
                );
              }
            },
          },
        };
        const updatedNodes = nodes.concat(newNode);
        setNodes(updatedNodes);
        if (onNodesChange) onNodesChange(updatedNodes);
      } else if (nodeType === 'intNode') {
        const newNode = {
          id: `int-node-${Date.now()}`,
          type: 'intNode',
          position,
          data: {
            value: 0,
            onValueChange: (newValue) => {
              setNodes((prevNodes) =>
                prevNodes.map((n) =>
                  n.id === newNode.id ? { ...n, data: { ...n.data, value: newValue } } : n
                )
              );
              if (onNodesChange) {
                onNodesChange((prevNodes) =>
                  prevNodes.map((n) =>
                    n.id === newNode.id ? { ...n, data: { ...n.data, value: newValue } } : n
                  )
                );
              }
            },
          },
        };
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

  // Add a connection indicator element to the DOM for each connected node
  useEffect(() => {
    // Clean up any existing indicators
    document.querySelectorAll('.connection-indicator').forEach(el => el.remove());
    
    // Add indicators for connected nodes
    setTimeout(() => {
      document.querySelectorAll('.connected-node').forEach(nodeEl => {
        const indicator = document.createElement('div');
        indicator.className = 'connection-indicator';
        indicator.title = 'Connected to starting node';
        nodeEl.appendChild(indicator);
      });
    }, 100);
  }, [connectedNodeIds]);

  return (
    <div
      ref={reactFlowWrapper}
      className="diagram-editor"
      style={{ width: '100%', height: '100%' }}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onEdgeClick={handleEdgeClick}
        nodeTypes={nodeTypes}
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
        <MiniMap />
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
      </ReactFlow>
    </div>
  );
};

export default DiagramEditor;
