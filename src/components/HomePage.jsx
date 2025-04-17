import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import '../styles/HomePage.css';

// Custom node types for the demo
const CustomNode = ({ data }) => {
  return (
    <div className="demo-node" style={{ backgroundColor: data.color }}>
      <div className="demo-node-header">
        <div className="demo-node-title">{data.label}</div>
      </div>
      <div className="demo-node-content">{data.content}</div>
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const HomePage = () => {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  
  // Initial nodes for the interactive demo
  const initialNodes = [
    {
      id: '1',
      type: 'custom',
      position: { x: 100, y: 100 },
      data: { 
        label: 'Email Trigger', 
        content: 'When a new email arrives',
        color: '#8e44ad' 
      },
    },
    {
      id: '2',
      type: 'custom',
      position: { x: 350, y: 50 },
      data: { 
        label: 'Condition', 
        content: 'Contains attachment?',
        color: '#2980b9' 
      },
    },
    {
      id: '3',
      type: 'custom',
      position: { x: 600, y: 100 },
      data: { 
        label: 'OCR Processing', 
        content: 'Extract text from image',
        color: '#16a085' 
      },
    },
    {
      id: '4',
      type: 'custom',
      position: { x: 350, y: 200 },
      data: { 
        label: 'API Call', 
        content: 'Send data to external service',
        color: '#c0392b' 
      },
    },
    {
      id: '5',
      type: 'custom',
      position: { x: 600, y: 250 },
      data: { 
        label: 'Send Email', 
        content: 'Forward processed results',
        color: '#f39c12' 
      },
    },
  ];

  // Initial edges for the interactive demo
  const initialEdges = [
    {
      id: 'e1-2',
      source: '1',
      target: '2',
      animated: true,
      style: { stroke: '#8e44ad', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
        color: '#8e44ad',
      },
    },
    {
      id: 'e2-3',
      source: '2',
      target: '3',
      animated: true,
      label: 'Yes',
      labelStyle: { fill: '#333', fontWeight: 500 },
      labelBgStyle: { fill: '#fff' },
      style: { stroke: '#2980b9', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
        color: '#2980b9',
      },
    },
    {
      id: 'e2-4',
      source: '2',
      target: '4',
      animated: true,
      label: 'No',
      labelStyle: { fill: '#333', fontWeight: 500 },
      labelBgStyle: { fill: '#fff' },
      style: { stroke: '#2980b9', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
        color: '#2980b9',
      },
    },
    {
      id: 'e3-5',
      source: '3',
      target: '5',
      animated: true,
      style: { stroke: '#16a085', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
        color: '#16a085',
      },
    },
    {
      id: 'e4-5',
      source: '4',
      target: '5',
      animated: true,
      style: { stroke: '#c0392b', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
        color: '#c0392b',
      },
    },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Auto-animate nodes slightly to make the demo more dynamic
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes((nds) =>
        nds.map((node) => {
          // Add a small random movement to each node
          return {
            ...node,
            position: {
              x: node.position.x + (Math.random() * 2 - 1) * 0.5,
              y: node.position.y + (Math.random() * 2 - 1) * 0.5,
            },
          };
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [setNodes]);

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
      const colors = ['#8e44ad', '#2980b9', '#16a085', '#c0392b', '#f39c12', '#27ae60'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const newNode = {
        id: `node-${Date.now()}`,
        type: 'custom',
        position,
        data: {
          label: 'New Node',
          content: 'Drag me around!',
          color: randomColor,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="logo">
          <img src="/mailflow-logo.svg" alt="Mailflow Logo" className="logo-image" />
          <h1>Mailflow</h1>
        </div>
        <nav className="main-nav">
          <ul>
            <li><a href="#features">Features</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#about">About</a></li>
          </ul>
        </nav>
        <div className="header-actions">
          <Link to="/editor" className="btn btn-secondary">Log In</Link>
          <Link to="/editor" className="btn btn-primary">Try Editor</Link>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-content">
          <h1>Automate Your Email Workflows</h1>
          <p>
            Mailflow is a powerful visual automation tool that helps you create, manage, and execute
            email-based workflows without writing a single line of code.
          </p>
          <div className="hero-actions">
            <Link to="/editor" className="btn btn-primary btn-large">
              Start Building Now
            </Link>
            <a href="#features" className="btn btn-outline btn-large">
              Learn More
            </a>
          </div>
        </div>
        
        <div className="flow-demo-container" ref={reactFlowWrapper}>
          <div className="flow-demo-overlay">
            <div className="demo-instructions">
              <p>Try it! Drag nodes to rearrange the flow</p>
              <div className="node-example" 
                   draggable 
                   onDragStart={(e) => {
                     e.dataTransfer.setData('application/reactflow', 'custom-node');
                     e.dataTransfer.effectAllowed = 'move';
                   }}>
                <span>+ Drag to add node</span>
              </div>
            </div>
          </div>
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
            fitView
            attributionPosition="bottom-right"
          >
            <Background color="#aaa" gap={16} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      </section>

      <section id="features" className="features-section">
        <h2>Powerful Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📧</div>
            <h3>Email Automation</h3>
            <p>Create automated workflows triggered by incoming emails, with powerful filtering and routing capabilities.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <h3>Visual Flow Editor</h3>
            <p>Intuitive drag-and-drop interface to design complex workflows without coding knowledge.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>OCR Processing</h3>
            <p>Extract text from images and attachments automatically using advanced OCR technology.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔌</div>
            <h3>API Integration</h3>
            <p>Connect with external services and APIs to extend your workflow capabilities.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>Conditional Logic</h3>
            <p>Create sophisticated decision trees based on email content, metadata, or external data.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Task Management</h3>
            <p>Track and manage all your automated workflows from a centralized dashboard.</p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="how-it-works-section">
        <h2>How Mailflow Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Design Your Flow</h3>
            <p>Create your workflow using our intuitive visual editor. Drag and drop nodes to build your process.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Configure Triggers</h3>
            <p>Set up email triggers and conditions that will activate your workflow automatically.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Add Actions</h3>
            <p>Define what happens at each step - process attachments, call APIs, send emails, and more.</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Deploy & Monitor</h3>
            <p>Activate your workflow and monitor its performance through our dashboard.</p>
          </div>
        </div>
        <div className="cta-container">
          <Link to="/editor" className="btn btn-primary btn-large">
            Start Building Your Workflow
          </Link>
        </div>
      </section>

      <section id="about" className="about-section">
        <h2>About Mailflow</h2>
        <p>
          Mailflow was created to simplify email automation for businesses of all sizes. Our mission is to help teams save time and reduce errors by automating repetitive email-based tasks through an intuitive visual interface.
        </p>
        <p>
          Whether you're processing customer inquiries, handling document workflows, or integrating email with your business systems, Mailflow provides the tools you need to create efficient, reliable processes without complex coding.
        </p>
      </section>

      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <img src="/mailflow-logo.svg" alt="Mailflow Logo" className="logo-image-small" />
            <span>Mailflow</span>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#how-it-works">How It Works</a></li>
                <li><Link to="/editor">Editor</Link></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Resources</h4>
              <ul>
                <li><a href="#">Documentation</a></li>
                <li><a href="#">Tutorials</a></li>
                <li><a href="#">API Reference</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <ul>
                <li><a href="#about">About Us</a></li>
                <li><a href="#">Contact</a></li>
                <li><a href="#">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Mailflow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
