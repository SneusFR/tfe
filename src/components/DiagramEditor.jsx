import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo
} from 'react';
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

import ApiNode from './ApiNode';
import ConditionNode from './ConditionNode';
import SendingMailNode from './SendingMailNode';
import TextNode from './TextNode';
import IntNode from './IntNode';
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

// Déclaration des types de nœuds en dehors du composant
const nodeTypes = {
  apiNode: ApiNode,
  conditionNode: ConditionNode,
  sendingMailNode: SendingMailNode,
  textNode: TextNode,
  intNode: IntNode,
};

const DiagramEditor = ({
  nodes: initialNodes,
  edges: initialEdges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onEdgeDelete,
}) => {
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [nodes, setNodes] = useNodesState(initialNodes || []);
  const [edges, setEdges] = useEdgesState(initialEdges || []);
  const reactFlowWrapper = useRef(null);

  // Initialisation des nœuds et des arêtes à partir des props
  useEffect(() => {
    if (initialNodes && initialNodes.length > 0) setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    if (initialEdges && initialEdges.length > 0) setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const handleNodesChange = useCallback(
    (changes) => {
      const updatedNodes = applyNodeChanges(changes, nodes);
      setNodes(updatedNodes);
      if (onNodesChange) onNodesChange(updatedNodes);
    },
    [nodes, setNodes, onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes) => {
      const updatedEdges = applyEdgeChanges(changes, edges);
      setEdges(updatedEdges);
      if (onEdgesChange) onEdgesChange(updatedEdges);
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
      }
    },
    [edges, setEdges, onEdgesChange, onEdgeDelete]
  );

  // Tous les handles sont compatibles entre eux
  const areHandlesCompatible = () => true;

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
      
      const newEdge = {
        id: edgeId,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        style: isExecutionLink ? EXECUTION_LINK_STYLE : DATA_LINK_STYLE,
        animated: isExecutionLink, // Only animate execution links
        type: isExecutionLink ? 'smoothstep' : 'default', // Smoother curves for execution links
        data: {
          isExecutionLink: isExecutionLink,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: isExecutionLink ? 15 : 12,
          height: isExecutionLink ? 15 : 12,
          color: linkColor,
        },
        labelStyle: { fill: '#333', fontWeight: 500, fontSize: 10 },
        labelBgStyle: { fill: '#fff', fillOpacity: 0.8 },
      };

      const updatedEdges = addEdge(newEdge, edges);
      setEdges(updatedEdges);
      if (onConnect) onConnect(updatedEdges);
    },
    [edges, setEdges, onConnect]
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
        updatedNodes = updatedNodes.map((node) =>
          node.id !== newNode.id && node.type === 'conditionNode' && node.data.isStartingPoint
            ? { ...node, data: { ...node.data, isStartingPoint: false } }
            : node
        );
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
      }
    },
    [reactFlowInstance, nodes, setNodes, onNodesChange]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const startingPointNode = useMemo(
    () =>
      nodes.find(
        (node) =>
          node.type === 'conditionNode' && node.data.isStartingPoint === true
      ),
    [nodes]
  );

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
