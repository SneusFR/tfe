import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AIFlowBuilderDocumentation from './AIFlowBuilderDocumentation';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Handle,
} from 'reactflow';
import 'reactflow/dist/style.css';
import '../styles/Documentation.css';

// Custom node types for the interactive demos
const CustomNode = ({ data, selected }) => {
  // Map node classes to their type codes for the badge
  const nodeTypeMap = {
    'node-email-trigger': 'EMAIL',
    'node-condition': 'COND',
    'node-ocr': 'OCR',
    'node-api': 'API',
    'node-email-send': 'SEND',
    'node-text': 'TXT',
    'node-int': 'INT',
    'node-end': 'END'
  };
  
  // Get the type code for this node
  const nodeType = nodeTypeMap[data.nodeClass] || '';
  
  return (
    <div className={`interactive-node ${data.nodeClass} ${selected ? 'selected' : ''}`}>
      <div className="interactive-node-header" data-type={nodeType}>{data.label}</div>
      <div className="interactive-node-content">{data.content}</div>
      
      {/* Execution flow handles (top/bottom) */}
      <Handle
        type="target"
        position="top"
        id="execution-in"
        style={{ background: '#fff', borderColor: '#555', top: 0, width: 10, height: 10 }}
      />
      <Handle
        type="source"
        position="bottom"
        id="execution-out"
        style={{ background: '#fff', borderColor: '#555', bottom: 0, width: 10, height: 10 }}
      />
      
      {/* Data attribute handles (left/right) */}
      <Handle
        type="target"
        position="left"
        id="data-in"
        style={{ background: '#03a9f4', borderColor: '#0277bd', left: -5, width: 10, height: 10 }}
      />
      <Handle
        type="source"
        position="right"
        id="data-out"
        style={{ background: '#03a9f4', borderColor: '#0277bd', right: -5, width: 10, height: 10 }}
      />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

// Context menu for nodes
const ContextMenu = ({ x, y, onClose, onDelete }) => {
  useEffect(() => {
    const handleClickOutside = () => onClose();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  return (
    <div 
      className="demo-context-menu"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="demo-context-menu-item" onClick={onDelete}>
        Delete
      </div>
    </div>
  );
};

// Demo configurations
const basicWorkflowNodes = [
  {
    id: '1',
    type: 'custom',
    position: { x: 50, y: 100 },
    data: { 
      label: 'Email Trigger', 
      content: 'When a new email arrives',
      nodeClass: 'node-email-trigger'
    },
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 300, y: 50 },
    data: { 
      label: 'Condition', 
      content: 'Contains attachment?',
      nodeClass: 'node-condition'
    },
  },
  {
    id: '3',
    type: 'custom',
    position: { x: 550, y: 100 },
    data: { 
      label: 'OCR Processing', 
      content: 'Extract text from image',
      nodeClass: 'node-ocr'
    },
  },
];

const basicWorkflowEdges = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    sourceHandle: 'execution-out',
    targetHandle: 'execution-in',
    animated: true,
    style: { stroke: '#555', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#555',
    },
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    sourceHandle: 'execution-out',
    targetHandle: 'execution-in',
    animated: true,
    label: 'Yes',
    labelStyle: { fill: '#333', fontWeight: 500 },
    labelBgStyle: { fill: '#fff' },
    style: { stroke: '#555', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#555',
    },
  },
];

const attributeConnectionNodes = [
  {
    id: '1',
    type: 'custom',
    position: { x: 50, y: 100 },
    data: { 
      label: 'Text Node', 
      content: 'Output: "Hello World"',
      nodeClass: 'node-text'
    },
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 350, y: 100 },
    data: { 
      label: 'API Call', 
      content: 'Input: message',
      nodeClass: 'node-api'
    },
  },
];

const attributeConnectionEdges = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    sourceHandle: 'data-out',
    targetHandle: 'data-in',
    animated: true,
    label: 'Text → message',
    labelStyle: { fill: '#333', fontWeight: 500 },
    labelBgStyle: { fill: '#fff' },
    style: { stroke: '#03a9f4', strokeWidth: 2, strokeDasharray: '5,5' },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#03a9f4',
    },
  },
];

const nodeTypesDemo = [
  {
    id: '1',
    type: 'custom',
    position: { x: 50, y: 50 },
    data: { 
      label: 'Email Trigger', 
      content: 'Start workflow on email',
      nodeClass: 'node-email-trigger'
    },
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 50, y: 150 },
    data: { 
      label: 'Condition', 
      content: 'Decision based on data',
      nodeClass: 'node-condition'
    },
  },
  {
    id: '3',
    type: 'custom',
    position: { x: 250, y: 50 },
    data: { 
      label: 'OCR Processing', 
      content: 'Extract text from images',
      nodeClass: 'node-ocr'
    },
  },
  {
    id: '4',
    type: 'custom',
    position: { x: 250, y: 150 },
    data: { 
      label: 'API Call', 
      content: 'Connect to external services',
      nodeClass: 'node-api'
    },
  },
  {
    id: '5',
    type: 'custom',
    position: { x: 450, y: 50 },
    data: { 
      label: 'Send Email', 
      content: 'Send email with results',
      nodeClass: 'node-email-send'
    },
  },
  {
    id: '6',
    type: 'custom',
    position: { x: 450, y: 150 },
    data: { 
      label: 'Text Node', 
      content: 'Process text data',
      nodeClass: 'node-text'
    },
  },
  {
    id: '7',
    type: 'custom',
    position: { x: 650, y: 50 },
    data: { 
      label: 'Int Node', 
      content: 'Process numeric data',
      nodeClass: 'node-int'
    },
  },
  {
    id: '8',
    type: 'custom',
    position: { x: 650, y: 150 },
    data: { 
      label: 'End Node', 
      content: 'Terminate workflow',
      nodeClass: 'node-end'
    },
  },
];

// Interactive Demo Component
const InteractiveDemo = ({ title, initialNodes, initialEdges, height = 300 }) => {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedNodes, setSelectedNodes] = useState([]);

  // Handle node selection
  useEffect(() => {
    const selected = nodes.filter(node => node.selected).map(node => node.id);
    setSelectedNodes(selected);
  }, [nodes]);

  // Handle keyboard events (delete)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Delete' && selectedNodes.length > 0) {
        deleteSelectedNodes();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodes]);

  // Delete selected nodes
  const deleteSelectedNodes = useCallback(() => {
    setNodes(nodes => nodes.filter(node => !selectedNodes.includes(node.id)));
    setEdges(edges => edges.filter(edge => 
      !selectedNodes.includes(edge.source) && !selectedNodes.includes(edge.target)
    ));
    setContextMenu(null);
  }, [selectedNodes, setNodes, setEdges]);

  // Handle node right-click for context menu
  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    
    // Select the node if not already selected
    if (!node.selected) {
      setNodes(nds => 
        nds.map(n => ({
          ...n,
          selected: n.id === node.id
        }))
      );
    }
    
    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    
    setContextMenu({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
      nodeId: node.id
    });
  }, [setNodes]);

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onInit = useCallback((instance) => {
    setReactFlowInstance(instance);
    instance.fitView({ padding: 0.2 });
  }, []);

  // Handle drag & drop functionality
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      // Create a new node with random color
      const nodeClasses = ['node-email-trigger', 'node-condition', 'node-ocr', 'node-api', 'node-email-send', 'node-text'];
      const randomNodeClass = nodeClasses[Math.floor(Math.random() * nodeClasses.length)];
      
      const newNode = {
        id: `node-${Date.now()}`,
        type: 'custom',
        position,
        data: {
          label: 'New Node',
          content: 'Drag me around!',
          nodeClass: randomNodeClass,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  // Reset demo
  const resetDemo = () => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2 });
    }
    setContextMenu(null);
  };

  return (
    <div className="interactive-demo">
      <div className="interactive-demo-header">
        <h3 className="interactive-demo-title">{title}</h3>
      </div>
      <div className="interactive-demo-content">
        <div 
          className="interactive-flow-container" 
          ref={reactFlowWrapper}
          style={{ height: `${height}px` }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={onInit}
            nodeTypes={nodeTypes}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeContextMenu={onNodeContextMenu}
            deleteKeyCode="Delete"
            multiSelectionKeyCode="Control"
            selectionKeyCode="Shift"
            fitView
            attributionPosition="bottom-right"
          >
            <Background color="#aaa" gap={16} />
            <Controls showInteractive={false} />
            {contextMenu && (
              <ContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                onClose={closeContextMenu}
                onDelete={deleteSelectedNodes}
              />
            )}
          </ReactFlow>
        </div>
        <div className="interactive-controls">
          <div 
            className="interactive-button"
            draggable 
            onDragStart={(e) => {
              e.dataTransfer.setData('application/reactflow', 'custom-node');
              e.dataTransfer.effectAllowed = 'move';
            }}
          >
            + Drag to add node
          </div>
          <button className="interactive-button" onClick={resetDemo}>
            Reset Demo
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Documentation Component
const DocumentationPage = () => {
  const [activeSection, setActiveSection] = useState('introduction');

  // Scroll to section when clicking on sidebar links
  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Update active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('.documentation-section');
      let currentSection = 'introduction';
      
      sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (window.scrollY >= sectionTop - 200 && 
            window.scrollY < sectionTop + sectionHeight - 200) {
          currentSection = section.id;
        }
      });
      
      setActiveSection(currentSection);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="documentation-container">
      {/* Sidebar */}
      <div className="documentation-sidebar">
        <div className="documentation-sidebar-header">
          <h2>Documentation</h2>
        </div>
        <nav className="documentation-nav">
          <div className="documentation-nav-section">
            <h3>Getting Started</h3>
            <ul className="documentation-nav-list">
              <li className="documentation-nav-item">
                <a 
                  href="#introduction" 
                  className={`documentation-nav-link ${activeSection === 'introduction' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); scrollToSection('introduction'); }}
                >
                  Introduction
                </a>
              </li>
              <li className="documentation-nav-item">
                <a 
                  href="#basic-concepts" 
                  className={`documentation-nav-link ${activeSection === 'basic-concepts' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); scrollToSection('basic-concepts'); }}
                >
                  Basic Concepts
                </a>
              </li>
            </ul>
          </div>
          
          <div className="documentation-nav-section">
            <h3>Core Features</h3>
            <ul className="documentation-nav-list">
              <li className="documentation-nav-item">
                <a 
                  href="#creating-workflows" 
                  className={`documentation-nav-link ${activeSection === 'creating-workflows' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); scrollToSection('creating-workflows'); }}
                >
                  Creating Workflows
                </a>
              </li>
              <li className="documentation-nav-item">
                <a 
                  href="#node-management" 
                  className={`documentation-nav-link ${activeSection === 'node-management' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); scrollToSection('node-management'); }}
                >
                  Node Management
                </a>
              </li>
              <li className="documentation-nav-item">
                <a 
                  href="#connecting-attributes" 
                  className={`documentation-nav-link ${activeSection === 'connecting-attributes' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); scrollToSection('connecting-attributes'); }}
                >
                  Connecting Attributes
                </a>
              </li>
              <li className="documentation-nav-item">
                <a 
                  href="#saving-workflows" 
                  className={`documentation-nav-link ${activeSection === 'saving-workflows' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); scrollToSection('saving-workflows'); }}
                >
                  Saving Workflows
                </a>
              </li>
            </ul>
          </div>
          
          <div className="documentation-nav-section">
            <h3>Advanced Features</h3>
            <ul className="documentation-nav-list">
              <li className="documentation-nav-item">
                <a 
                  href="#ai-flow-builder" 
                  className={`documentation-nav-link ${activeSection === 'ai-flow-builder' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); scrollToSection('ai-flow-builder'); }}
                >
                  AI Flow Builder
                </a>
              </li>
              <li className="documentation-nav-item">
                <a 
                  href="#permissions" 
                  className={`documentation-nav-link ${activeSection === 'permissions' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); scrollToSection('permissions'); }}
                >
                  Managing Permissions
                </a>
              </li>
              <li className="documentation-nav-item">
                <a 
                  href="#api-integration" 
                  className={`documentation-nav-link ${activeSection === 'api-integration' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); scrollToSection('api-integration'); }}
                >
                  API Integration
                </a>
              </li>
              <li className="documentation-nav-item">
                <a 
                  href="#backend-config" 
                  className={`documentation-nav-link ${activeSection === 'backend-config' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); scrollToSection('backend-config'); }}
                >
                  Backend Configuration
                </a>
              </li>
            </ul>
          </div>
          
          <div className="documentation-nav-section">
            <h3>Node Types</h3>
            <ul className="documentation-nav-list">
              <li className="documentation-nav-item">
                <a 
                  href="#node-types" 
                  className={`documentation-nav-link ${activeSection === 'node-types' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); scrollToSection('node-types'); }}
                >
                  Overview
                </a>
              </li>
              <li className="documentation-nav-item">
                <a 
                  href="#trigger-nodes" 
                  className={`documentation-nav-link ${activeSection === 'trigger-nodes' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); scrollToSection('trigger-nodes'); }}
                >
                  Trigger Nodes
                </a>
              </li>
              <li className="documentation-nav-item">
                <a 
                  href="#processing-nodes" 
                  className={`documentation-nav-link ${activeSection === 'processing-nodes' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); scrollToSection('processing-nodes'); }}
                >
                  Processing Nodes
                </a>
              </li>
              <li className="documentation-nav-item">
                <a 
                  href="#output-nodes" 
                  className={`documentation-nav-link ${activeSection === 'output-nodes' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); scrollToSection('output-nodes'); }}
                >
                  Output Nodes
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="documentation-content">
        {/* Introduction Section */}
        <section id="introduction" className="documentation-section">
          <h2>Introduction</h2>
          <p>
            Welcome to the Mailflow documentation! This guide will help you understand how to use our powerful visual workflow automation tool to create, manage, and execute email-based workflows without writing a single line of code.
          </p>
          <p>
            Mailflow allows you to visually design complex automation workflows by connecting different types of nodes, each with specific functionality. Whether you're processing incoming emails, extracting data from attachments, making API calls, or sending automated responses, Mailflow provides an intuitive interface to build your custom workflow.
          </p>
          
          <div className="table-of-contents">
            <h3>In this documentation</h3>
            <ul>
              <li><a href="#basic-concepts">Basic Concepts</a> - Understanding the core elements of Mailflow</li>
              <li><a href="#creating-workflows">Creating Workflows</a> - How to build your first workflow</li>
              <li><a href="#node-management">Node Management</a> - Adding, moving, and deleting nodes</li>
              <li><a href="#connecting-attributes">Connecting Attributes</a> - Linking data between nodes</li>
              <li><a href="#node-types">Node Types</a> - Detailed explanation of all available nodes</li>
            </ul>
          </div>
          
          <InteractiveDemo 
            title="Try it! Drag nodes to rearrange the workflow" 
            initialNodes={basicWorkflowNodes} 
            initialEdges={basicWorkflowEdges} 
          />
        </section>
        
        {/* Basic Concepts Section */}
        <section id="basic-concepts" className="documentation-section">
          <h2>Basic Concepts</h2>
          <p>
            Before diving into creating workflows, it's important to understand the basic concepts and terminology used in Mailflow:
          </p>
          
          <h3>Nodes</h3>
          <p>
            Nodes are the building blocks of your workflow. Each node represents a specific action or process, such as receiving an email, making a decision, processing data, or sending a response. Nodes have inputs and outputs that can be connected to create a flow of data through your workflow.
          </p>
          
          <h3>Edges</h3>
          <p>
            Edges are the connections between nodes that define how data flows through your workflow. They represent the path that data takes from one node to another.
          </p>
          
          <h3>Attributes</h3>
          <p>
            Attributes are the properties of nodes that can be connected to create data relationships. For example, the output text from a Text node can be connected to the input message of an API Call node.
          </p>
          
          <h3>Workflows</h3>
          <p>
            A workflow is a complete process defined by a collection of connected nodes. Workflows typically start with a trigger node (like Email Trigger) and end with an action node (like Send Email).
          </p>
          
          <div className="tip">
            <strong>Tip:</strong> Start simple! Begin with a basic workflow with just a few nodes, test it thoroughly, and then gradually add more complexity as needed.
          </div>
        </section>
        
        {/* Creating Workflows Section */}
        <section id="creating-workflows" className="documentation-section">
          <h2>Creating Workflows</h2>
          <p>
            Creating a new workflow in Mailflow is straightforward. This section will guide you through the process of setting up your first workflow.
          </p>
          
          <h3>Starting a New Workflow</h3>
          <p>
            To create a new workflow:
          </p>
          <ol>
            <li>Navigate to the Diagram Editor tab in the main application</li>
            <li>Click the "New Flow" button in the top menu</li>
            <li>Enter a name for your workflow in the dialog that appears</li>
            <li>Click "Create" to initialize your new workflow</li>
          </ol>
          
          <h3>Adding Your First Node</h3>
          <p>
            Every workflow needs a starting point. In most cases, this will be a trigger node that initiates the workflow when a specific event occurs.
          </p>
          <ol>
            <li>Open the sidebar by clicking the sidebar icon if it's not already visible</li>
            <li>Navigate to the "Starting Points" tab</li>
            <li>Drag an "Email Trigger" node onto the canvas</li>
            <li>Position it where you want it to appear in your workflow</li>
          </ol>
          
          <h3>Building Your Workflow</h3>
          <p>
            Once you have your trigger node, you can start adding processing nodes and output nodes to build your workflow:
          </p>
          <ol>
            <li>Add a processing node (like a Condition node) by dragging it from the sidebar onto the canvas</li>
            <li>Connect your trigger node to the processing node by clicking and dragging from an output handle to an input handle</li>
            <li>Continue adding and connecting nodes to complete your workflow logic</li>
          </ol>
          
          <div className="warning">
            <strong>Note:</strong> Make sure your workflow has a clear path from start to finish. Disconnected nodes won't be executed during workflow runs.
          </div>
          
          <InteractiveDemo 
            title="Build a Simple Workflow" 
            initialNodes={[
              {
                id: '1',
                type: 'custom',
                position: { x: 50, y: 100 },
                data: { 
                  label: 'Email Trigger', 
                  content: 'When a new email arrives',
                  nodeClass: 'node-email-trigger'
                },
              }
            ]} 
            initialEdges={[]} 
          />
        </section>
        
        {/* Node Management Section */}
        <section id="node-management" className="documentation-section">
          <h2>Node Management</h2>
          <p>
            Effective node management is essential for creating clean, functional workflows. This section covers how to add, move, configure, and delete nodes in your workflow.
          </p>
          
          <h3>Moving Nodes</h3>
          <p>
            To move a node within your workflow canvas:
          </p>
          <ol>
            <li>Click and hold on the node you want to move</li>
            <li>Drag the node to its new position</li>
            <li>Release to place the node</li>
          </ol>
          <p>
            The connections (edges) between nodes will automatically adjust to follow the node's new position.
          </p>
          
          <h3>Configuring Nodes</h3>
          <p>
            Most nodes have configurable properties that determine their behavior:
          </p>
          <ol>
            <li>Click on a node to select it</li>
            <li>The node's properties will appear in the properties panel on the right</li>
            <li>Modify the properties as needed</li>
            <li>Changes are automatically saved</li>
          </ol>
          
          <h3>Deleting Nodes</h3>
          <p>
            To remove a node from your workflow:
          </p>
          <ol>
            <li>Select the node you want to delete</li>
            <li>Press the Delete key on your keyboard, or</li>
            <li>Right-click on the node and select "Delete" from the context menu</li>
          </ol>
          <p>
            When you delete a node, all connections to and from that node will also be removed.
          </p>
          
          <div className="tip">
            <strong>Tip:</strong> You can select multiple nodes at once by holding Shift while clicking on nodes, or by dragging a selection box around them. This allows you to move or delete multiple nodes simultaneously.
          </div>
          
          <InteractiveDemo 
            title="Try Moving and Deleting Nodes" 
            initialNodes={[
              {
                id: '1',
                type: 'custom',
                position: { x: 50, y: 100 },
                data: { 
                  label: 'Email Trigger', 
                  content: 'When a new email arrives',
                  nodeClass: 'node-email-trigger'
                },
              },
              {
                id: '2',
                type: 'custom',
                position: { x: 300, y: 100 },
                data: { 
                  label: 'Text Node', 
                  content: 'Process email subject',
                  nodeClass: 'node-text'
                },
              },
              {
                id: '3',
                type: 'custom',
                position: { x: 550, y: 100 },
                data: { 
                  label: 'Send Email', 
                  content: 'Forward to manager',
                  nodeClass: 'node-email-send'
                },
              }
            ]} 
            initialEdges={[
              {
                id: 'e1-2',
                source: '1',
                target: '2',
                sourceHandle: 'execution-out',
                targetHandle: 'execution-in',
                animated: true,
                style: { stroke: '#555', strokeWidth: 2 },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  width: 15,
                  height: 15,
                  color: '#555',
                },
              },
              {
                id: 'e2-3',
                source: '2',
                target: '3',
                sourceHandle: 'execution-out',
                targetHandle: 'execution-in',
                animated: true,
                style: { stroke: '#555', strokeWidth: 2 },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  width: 15,
                  height: 15,
                  color: '#555',
                },
              }
            ]} 
          />
        </section>
        
        {/* Connecting Attributes Section */}
        <section id="connecting-attributes" className="documentation-section">
          <h2>Connecting Attributes</h2>
          <p>
            One of the most powerful features of Mailflow is the ability to connect attributes between different nodes, allowing data to flow through your workflow. This section explains how to create these connections.
          </p>
          
          <h3>Understanding Node Attributes</h3>
          <p>
            Each node type has specific attributes that can be inputs (receiving data) or outputs (sending data). For example:
          </p>
          <ul>
            <li>An Email Trigger node has output attributes like "subject", "body", and "attachments"</li>
            <li>A Text Node has input attributes that can receive text and output attributes that can send processed text</li>
            <li>An API Call node has input attributes for parameters and output attributes for the API response</li>
          </ul>
          
          <h3>Creating Attribute Connections</h3>
          <p>
            To connect attributes between nodes:
          </p>
          <ol>
            <li>Click on a node to select it</li>
            <li>In the properties panel, locate the attribute you want to connect</li>
            <li>Click the connection icon next to the attribute</li>
            <li>Select the target node and attribute from the dropdown menu</li>
            <li>Click "Connect" to establish the connection</li>
          </ol>
          <p>
            Alternatively, you can use the visual connection method:
          </p>
          <ol>
            <li>Hover over a node to see its connection points</li>
            <li>Click and drag from an output connection point to an input connection point on another node</li>
            <li>Release to create the connection</li>
          </ol>
          
          <h3>Managing Attribute Connections</h3>
          <p>
            To modify or remove attribute connections:
          </p>
          <ol>
            <li>Select the connection line between nodes</li>
            <li>Press Delete to remove the connection, or</li>
            <li>Right-click on the connection and select "Delete" from the context menu</li>
          </ol>
          <p>
            You can also modify connections through the properties panel by clicking on a node and updating its connection settings.
          </p>
          
          <div className="tip">
            <strong>Tip:</strong> Hover over a connection line to see a tooltip showing which attributes are connected between the nodes.
          </div>
          
          <InteractiveDemo 
            title="Connecting Node Attributes" 
            initialNodes={attributeConnectionNodes} 
            initialEdges={attributeConnectionEdges} 
          />
        </section>
        
        {/* Saving Workflows Section */}
        <section id="saving-workflows" className="documentation-section">
          <h2>Saving Workflows</h2>
          <p>
            Properly saving your workflows ensures that your work is preserved and can be executed when needed. This section covers how to save, version, and manage your workflows.
          </p>
          
          <h3>Auto-Save Feature</h3>
          <p>
            Mailflow includes an auto-save feature that periodically saves your workflow as you make changes. You'll see a "Saved" indicator in the top right corner when auto-save completes.
          </p>
          
          <h3>Manual Saving</h3>
          <p>
            To manually save your workflow:
          </p>
          <ol>
            <li>Click the "Save" button in the top menu</li>
            <li>If this is a new workflow, you'll be prompted to enter a name</li>
            <li>Click "Save" in the dialog to confirm</li>
          </ol>
          
          <h3>Version Control</h3>
          <p>
            Mailflow includes basic version control for your workflows:
          </p>
          <ol>
            <li>Click the "Versions" button in the top menu</li>
            <li>You'll see a list of previous versions with timestamps</li>
            <li>Select a version to view or restore it</li>
          </ol>
          
          <h3>Exporting and Importing Workflows</h3>
          <p>
            You can export your workflows to share them or create backups:
          </p>
          <ol>
            <li>Click the "Export" button in the top menu</li>
            <li>Choose a location to save the workflow file</li>
            <li>The workflow will be saved as a JSON file</li>
          </ol>
          <p>
            To import a workflow:
          </p>
          <ol>
            <li>Click the "Import" button in the top menu</li>
            <li>Select a workflow JSON file from your computer</li>
            <li>The workflow will be loaded into the editor</li>
          </ol>
          
          <div className="tip">
            <strong>Tip:</strong> Regularly export important workflows as backups, especially before making significant changes.
          </div>
        </section>
        
        {/* AI Flow Builder Section */}
        <AIFlowBuilderDocumentation />
        
        {/* Permissions Section */}
        <section id="permissions" className="documentation-section">
          <h2>Managing Permissions</h2>
          <p>
            Mailflow allows you to control who can view, edit, and execute your workflows through a comprehensive permissions system.
          </p>
          
          <h3>Collaboration Roles</h3>
          <p>
            Mailflow supports the following collaboration roles:
          </p>
          <ul>
            <li><strong>Owner:</strong> Has full control over the workflow, including deleting it and managing permissions</li>
            <li><strong>Editor:</strong> Can view and modify the workflow, but cannot delete it or manage permissions</li>
            <li><strong>Viewer:</strong> Can only view the workflow and its execution history, but cannot make changes</li>
            <li><strong>Executor:</strong> Can run the workflow but cannot view or edit its structure</li>
          </ul>
          
          <h3>Sharing Workflows</h3>
          <p>
            To share a workflow with other users:
          </p>
          <ol>
            <li>Click the "Share" button in the top menu</li>
            <li>Enter the email address of the user you want to share with</li>
            <li>Select the appropriate role from the dropdown menu</li>
            <li>Click "Add" to grant access</li>
          </ol>
          
          <h3>Managing Existing Permissions</h3>
          <p>
            To view and modify existing permissions:
          </p>
          <ol>
            <li>Click the "Share" button in the top menu</li>
            <li>You'll see a list of users who currently have access</li>
            <li>Change a user's role using the dropdown menu next to their name</li>
            <li>Remove access by clicking the "Remove" button</li>
          </ol>
          
          <div className="warning">
            <strong>Note:</strong> Once you transfer ownership of a workflow to another user, you cannot reclaim ownership unless the new owner transfers it back to you.
          </div>
        </section>
        
        {/* API Integration Section */}
        <section id="api-integration" className="documentation-section">
          <h2>API Integration</h2>
          <p>
            Mailflow allows you to connect your workflows to external services through API integration, expanding the capabilities of your automation.
          </p>
          
          <h3>Importing an API</h3>
          <p>
            To import an API into Mailflow:
          </p>
          <ol>
            <li>Navigate to the "API" tab in the sidebar</li>
            <li>Click the "Import API" button</li>
            <li>You can either:
              <ul>
                <li>Upload an OpenAPI/Swagger specification file</li>
                <li>Enter the URL of a publicly accessible API specification</li>
                <li>Manually enter API details</li>
              </ul>
            </li>
            <li>Click "Import" to add the API to your inventory</li>
          </ol>
          
          <h3>Using API Nodes</h3>
          <p>
            Once you've imported an API, you can use API nodes in your workflows:
          </p>
          <ol>
            <li>Drag an API node from the "API" tab in the sidebar onto your canvas</li>
            <li>Select the API endpoint you want to use from the dropdown menu</li>
            <li>Configure the request parameters, headers, and body as needed</li>
            <li>Connect the API node's inputs to other nodes in your workflow</li>
            <li>Use the API node's outputs in subsequent nodes</li>
          </ol>
          
          <h3>Authentication</h3>
          <p>
            Mailflow supports various authentication methods for API calls:
          </p>
          <ul>
            <li><strong>API Key:</strong> Add your API key as a header or query parameter</li>
            <li><strong>Basic Auth:</strong> Enter your username and password</li>
            <li><strong>OAuth 2.0:</strong> Configure OAuth settings and authorize the connection</li>
            <li><strong>No Auth:</strong> For public APIs that don't require authentication</li>
          </ul>
          
          <div className="tip">
            <strong>Tip:</strong> Store sensitive authentication information like API keys in the secure credentials manager rather than hardcoding them in your workflow.
          </div>
          
          <InteractiveDemo 
            title="API Integration Example" 
            initialNodes={[
              {
                id: '1',
                type: 'custom',
                position: { x: 50, y: 100 },
                data: { 
                  label: 'Email Trigger', 
                  content: 'New support request',
                  nodeClass: 'node-email-trigger'
                },
              },
              {
                id: '2',
                type: 'custom',
                position: { x: 300, y: 100 },
                data: { 
                  label: 'Text Node', 
                  content: 'Extract ticket details',
                  nodeClass: 'node-text'
                },
              },
              {
                id: '3',
                type: 'custom',
                position: { x: 550, y: 100 },
                data: { 
                  label: 'API Call', 
                  content: 'Create ticket in help desk',
                  nodeClass: 'node-api'
                },
              }
            ]} 
            initialEdges={[
              {
                id: 'e1-2',
                source: '1',
                target: '2',
                sourceHandle: 'execution-out',
                targetHandle: 'execution-in',
                animated: true,
                style: { stroke: '#555', strokeWidth: 2 },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  width: 15,
                  height: 15,
                  color: '#555',
                },
              },
              {
                id: 'e2-3',
                source: '2',
                target: '3',
                sourceHandle: 'execution-out',
                targetHandle: 'execution-in',
                animated: true,
                style: { stroke: '#555', strokeWidth: 2 },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  width: 15,
                  height: 15,
                  color: '#555',
                },
              }
            ]} 
          />
        </section>
        
        {/* Backend Configuration Section */}
        <section id="backend-config" className="documentation-section">
          <h2>Backend Configuration</h2>
          <p>
            For advanced users, Mailflow allows you to configure backend settings to customize how your workflows are executed and integrated with other systems.
          </p>
          
          <h3>Accessing Backend Settings</h3>
          <p>
            To access the backend configuration:
          </p>
          <ol>
            <li>Click on your profile icon in the top right corner</li>
            <li>Select "Settings" from the dropdown menu</li>
            <li>Navigate to the "Backend" tab</li>
          </ol>
          
          <h3>Email Server Configuration</h3>
          <p>
            Configure your email server settings to enable email triggers and actions:
          </p>
          <ol>
            <li>Enter your IMAP server details for incoming emails</li>
            <li>Enter your SMTP server details for outgoing emails</li>
            <li>Provide authentication credentials</li>
            <li>Test the connection to ensure it's working properly</li>
          </ol>
          
          <h3>Execution Environment</h3>
          <p>
            Customize how your workflows are executed:
          </p>
          <ul>
            <li><strong>Execution Mode:</strong> Choose between synchronous and asynchronous execution</li>
            <li><strong>Timeout Settings:</strong> Set maximum execution time for workflows and individual nodes</li>
            <li><strong>Retry Configuration:</strong> Configure automatic retry behavior for failed nodes</li>
            <li><strong>Logging Level:</strong> Set the detail level for workflow execution logs</li>
          </ul>
          
          <h3>API Webhook Configuration</h3>
          <p>
            Set up webhooks to trigger workflows from external systems:
          </p>
          <ol>
            <li>Enable the webhook feature in the backend settings</li>
            <li>Generate a unique webhook URL for each workflow that needs to be triggered externally</li>
            <li>Configure security settings such as authentication tokens or IP restrictions</li>
            <li>Copy the webhook URL to use in your external systems</li>
          </ol>
          
          <div className="warning">
            <strong>Important:</strong> Backend configuration changes may require a system restart to take effect. Always make these changes during maintenance windows if you're running production workflows.
          </div>
        </section>
        
        {/* Node Types Overview Section */}
        <section id="node-types" className="documentation-section">
          <h2>Node Types Overview</h2>
          <p>
            Mailflow offers a variety of node types to build your workflows. Each node type serves a specific purpose and has unique properties and capabilities.
          </p>
          
          <h3>Node Categories</h3>
          <p>
            Nodes in Mailflow are organized into the following categories:
          </p>
          <ul>
            <li><strong>Trigger Nodes:</strong> Start a workflow when a specific event occurs</li>
            <li><strong>Processing Nodes:</strong> Transform, filter, or analyze data</li>
            <li><strong>Decision Nodes:</strong> Control the flow based on conditions</li>
            <li><strong>Action Nodes:</strong> Perform actions based on the processed data</li>
            <li><strong>Integration Nodes:</strong> Connect with external systems and APIs</li>
          </ul>
          
          <InteractiveDemo 
            title="Node Types Gallery" 
            initialNodes={nodeTypesDemo} 
            initialEdges={[]} 
            height={250}
          />
          
          <p>
            The following sections provide detailed information about each node type, including their purpose, configuration options, inputs, and outputs.
          </p>
        </section>
        
        {/* Trigger Nodes Section */}
        <section id="trigger-nodes" className="documentation-section">
          <h2>Trigger Nodes</h2>
          <p>
            Trigger nodes are the starting points of your workflows. They monitor for specific events and initiate the workflow when those events occur.
          </p>
          
          <h3>Email Trigger</h3>
          <p>
            The Email Trigger node starts a workflow when a new email arrives in the monitored inbox.
          </p>
          <ul>
            <li><strong>Configuration Options:</strong>
              <ul>
                <li>Email account to monitor</li>
                <li>Folder to check (e.g., Inbox, Custom folder)</li>
                <li>Filter criteria (sender, subject, has attachments, etc.)</li>
                <li>Polling interval</li>
              </ul>
            </li>
            <li><strong>Outputs:</strong>
              <ul>
                <li>Email subject</li>
                <li>Email body (text and HTML)</li>
                <li>Sender information</li>
                <li>Recipients</li>
                <li>Attachments</li>
                <li>Metadata (date, importance, etc.)</li>
              </ul>
            </li>
          </ul>
          
          <h3>Scheduled Trigger</h3>
          <p>
            The Scheduled Trigger node starts a workflow at specified times or intervals.
          </p>
          <ul>
            <li><strong>Configuration Options:</strong>
              <ul>
                <li>Schedule type (one-time, recurring)</li>
                <li>Frequency (hourly, daily, weekly, monthly)</li>
                <li>Specific time and date</li>
                <li>Custom cron expression for advanced scheduling</li>
              </ul>
            </li>
            <li><strong>Outputs:</strong>
              <ul>
                <li>Trigger timestamp</li>
                <li>Execution count</li>
                <li>Next scheduled run</li>
              </ul>
            </li>
          </ul>
          
          <h3>Webhook Trigger</h3>
          <p>
            The Webhook Trigger node starts a workflow when an HTTP request is received at a specific endpoint.
          </p>
          <ul>
            <li><strong>Configuration Options:</strong>
              <ul>
                <li>HTTP method (GET, POST, PUT, etc.)</li>
                <li>Authentication requirements</li>
                <li>Custom headers</li>
              </ul>
            </li>
            <li><strong>Outputs:</strong>
              <ul>
                <li>Request body</li>
                <li>Query parameters</li>
                <li>Headers</li>
                <li>Client IP</li>
                <li>Timestamp</li>
              </ul>
            </li>
          </ul>
          
          <div className="tip">
            <strong>Tip:</strong> You can combine multiple trigger nodes in a single workflow to start the same process from different entry points.
          </div>
        </section>
        
        {/* Processing Nodes Section */}
        <section id="processing-nodes" className="documentation-section">
          <h2>Processing Nodes</h2>
          <p>
            Processing nodes transform, filter, or analyze data as it flows through your workflow.
          </p>
          
          <h3>Text Node</h3>
          <p>
            The Text Node processes and manipulates text data.
          </p>
          <ul>
            <li><strong>Configuration Options:</strong>
              <ul>
                <li>Text operation (extract, replace, format, etc.)</li>
                <li>Regular expression patterns</li>
                <li>Format templates</li>
                <li>Case conversion</li>
              </ul>
            </li>
            <li><strong>Inputs:</strong> Any text data from previous nodes</li>
            <li><strong>Outputs:</strong> Processed text</li>
          </ul>
          
          <h3>OCR Node</h3>
          <p>
            The OCR (Optical Character Recognition) Node extracts text from images and documents.
          </p>
          <ul>
            <li><strong>Configuration Options:</strong>
              <ul>
                <li>Language selection</li>
                <li>Recognition quality</li>
                <li>Output format</li>
                <li>Region of interest</li>
              </ul>
            </li>
            <li><strong>Inputs:</strong> Image files or document attachments</li>
            <li><strong>Outputs:</strong> Extracted text, confidence score</li>
          </ul>
          
          <h3>Condition Node</h3>
          <p>
            The Condition Node evaluates expressions and directs the flow based on the results.
          </p>
          <ul>
            <li><strong>Configuration Options:</strong>
              <ul>
                <li>Condition expression</li>
                <li>Comparison operators</li>
                <li>Multiple conditions with AND/OR logic</li>
              </ul>
            </li>
            <li><strong>Inputs:</strong> Any data to be evaluated</li>
            <li><strong>Outputs:</strong> True/False paths</li>
          </ul>
          
          <h3>Switch Node</h3>
          <p>
            The Switch Node routes the workflow based on multiple possible values of an input.
          </p>
          <ul>
            <li><strong>Configuration Options:</strong>
              <ul>
                <li>Input value to evaluate</li>
                <li>Case values</li>
                <li>Default case</li>
              </ul>
            </li>
            <li><strong>Inputs:</strong> Value to switch on</li>
            <li><strong>Outputs:</strong> Multiple paths based on cases</li>
          </ul>
          
          <div className="tip">
            <strong>Tip:</strong> Chain multiple processing nodes together to create complex data transformations that would otherwise require custom coding.
          </div>
        </section>
        
        {/* Output Nodes Section */}
        <section id="output-nodes" className="documentation-section">
          <h2>Output Nodes</h2>
          <p>
            Output nodes perform actions based on the processed data, such as sending emails, making API calls, or storing data.
          </p>
          
          <h3>Send Email Node</h3>
          <p>
            The Send Email Node sends emails based on workflow data.
          </p>
          <ul>
            <li><strong>Configuration Options:</strong>
              <ul>
                <li>Recipients (To, CC, BCC)</li>
                <li>Subject</li>
                <li>Body (text and HTML)</li>
                <li>Attachments</li>
                <li>Priority and flags</li>
              </ul>
            </li>
            <li><strong>Inputs:</strong> Email content, recipient information</li>
            <li><strong>Outputs:</strong> Send status, message ID</li>
          </ul>
          
          <h3>API Call Node</h3>
          <p>
            The API Call Node makes HTTP requests to external services.
          </p>
          <ul>
            <li><strong>Configuration Options:</strong>
              <ul>
                <li>HTTP method</li>
                <li>URL</li>
                <li>Headers</li>
                <li>Query parameters</li>
                <li>Request body</li>
                <li>Authentication</li>
              </ul>
            </li>
            <li><strong>Inputs:</strong> Request parameters, body data</li>
            <li><strong>Outputs:</strong> Response body, status code, headers</li>
          </ul>
          
          <h3>End Node</h3>
          <p>
            The End Node explicitly marks the end of a workflow path and can return a final result.
          </p>
          <ul>
            <li><strong>Configuration Options:</strong>
              <ul>
                <li>Result value</li>
                <li>Success/failure status</li>
                <li>Completion message</li>
              </ul>
            </li>
            <li><strong>Inputs:</strong> Any final data to be returned</li>
            <li><strong>Outputs:</strong> None (terminal node)</li>
          </ul>
          
          <div className="warning">
            <strong>Note:</strong> While workflows can have multiple output nodes, it's a good practice to ensure all paths eventually lead to an End Node for proper workflow termination.
          </div>
        </section>
      </div>
    </div>
  );
};

export default DocumentationPage;
