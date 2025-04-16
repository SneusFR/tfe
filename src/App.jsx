import { useState, useEffect } from 'react';
import './App.css';
import ApiImporter from './components/ApiImporter';
import DiagramEditor from './components/DiagramEditor';
import ConditionCreator from './components/ConditionCreator';
import ConditionManager from './components/ConditionManager';
import NodesInventory from './components/NodesInventory';
import TaskManager from './components/TaskManager';
import EmailBrowser from './components/EmailBrowser';
import conditionStore from './store/conditionStore';
import { FlowProvider } from './context/FlowContext';

function App() {
  const [apiSpec, setApiSpec] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [activeTab, setActiveTab] = useState('diagram'); // 'diagram' or 'emails'
  
  // Initialize with empty nodes and edges
  useEffect(() => {
    // Initialize with empty diagram
    setNodes([]);
    setEdges([]);
  }, []);

  const handleApiImport = (spec) => {
    // API spec imported
    setApiSpec(spec);
    
    // Generate nodes from the API spec
    const generatedNodes = generateNodesFromApiSpec(spec);
    // Generated nodes from API spec
    
    // Clear previous nodes before setting new ones
    setNodes([]);
    setTimeout(() => {
      setNodes(generatedNodes.nodes);
      setEdges(generatedNodes.edges);
    }, 50);
  };

  // Function to generate nodes from API spec
  const generateNodesFromApiSpec = (spec) => {
    const nodes = [];
    const edges = [];
    let nodeId = 1;
    
    // Calculate grid layout - more compact
    const nodeWidth = 200;
    const nodeHeight = 150;
    const horizontalGap = 50;
    const verticalGap = 50;
    const nodesPerRow = 3;
    const startX = 100;
    const startY = 100;
    
    // Process paths and their operations
    if (spec.paths) {
      // First, collect all endpoints
      const endpoints = [];
      
      Object.entries(spec.paths).forEach(([path, pathItem]) => {
        Object.entries(pathItem).forEach(([method, operation]) => {
          if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
            endpoints.push({ path, method, operation });
          }
        });
      });
      
      // Found endpoints in API spec
      
      // Sort endpoints by path and method for better organization
      endpoints.sort((a, b) => {
        if (a.path === b.path) {
          // Order by method: GET, POST, PUT, PATCH, DELETE
          const methodOrder = { get: 1, post: 2, put: 3, patch: 4, delete: 5 };
          return methodOrder[a.method] - methodOrder[b.method];
        }
        return a.path.localeCompare(b.path);
      });
      
      // Create nodes for each endpoint
      endpoints.forEach(({ path, method, operation }, index) => {
        // Calculate position based on grid layout
        const row = Math.floor(index / nodesPerRow);
        const col = index % nodesPerRow;
        
        const xPos = startX + col * (nodeWidth + horizontalGap);
        const yPos = startY + row * (nodeHeight + verticalGap);
        
        // Create a node for this endpoint
        const node = {
          id: `node-${nodeId}`,
          type: 'apiNode', // This must match the key in nodeTypes in DiagramEditor
          position: { x: xPos, y: yPos },
          data: {
            label: `${method.toUpperCase()} ${path}`,
            method,
            path,
            summary: operation.summary || '',
            description: operation.description || '',
            parameters: operation.parameters || [],
            requestBody: operation.requestBody || null,
            responses: operation.responses || {},
          }
        };
        
        // Node created for endpoint
        
        nodes.push(node);
        nodeId++;
      });
    }
    
    return { nodes, edges };
  };

  // Handle node changes from DiagramEditor
  const handleNodesChange = (updatedNodes) => {
    // Nodes updated in App
    setNodes(updatedNodes);
  };

  // Handle edge changes from DiagramEditor
  const handleEdgesChange = (updatedEdges) => {
    // Edges updated in App
    setEdges(updatedEdges);
  };
  
  // Handle new connections between nodes
  const handleConnect = (updatedEdges) => {
    // Connection made between nodes
    setEdges(updatedEdges);
  };
  
  // Handle edge deletion
  const handleEdgeDelete = (deletedEdge, updatedEdges) => {
    // Edge deleted
    setEdges(updatedEdges);
  };

  // Handle condition creation
  const handleCreateCondition = (conditionData) => {
    // Creating new condition
    
    // Generate a unique ID for the node
    const nodeId = `condition-${Date.now()}`;
    
    // Calculate position - place new condition nodes in a visible area
    const lastNode = nodes.length > 0 ? nodes[nodes.length - 1] : null;
    const xPos = lastNode ? lastNode.position.x + 250 : 100;
    const yPos = lastNode ? lastNode.position.y : 100;
    
    // Create a new node
    const newNode = {
      id: nodeId,
      type: 'conditionNode',
      position: { x: xPos, y: yPos },
      data: {
        conditionText: conditionData.data.conditionText,
        returnText: conditionData.data.returnText,
        isStartingPoint: false // Regular conditions created directly are not starting points
      }
    };
    
    // Add to diagram
    setNodes([...nodes, newNode]);
    
    // Save to condition store
    conditionStore.addCondition({
      conditionText: conditionData.data.conditionText,
      returnText: conditionData.data.returnText
    });
  };

  // Debug output for nodes
  // Debug output for nodes removed

  return (
    <FlowProvider nodes={nodes} edges={edges}>
      <div className="app-container">
      <header className="app-header">
        <h1>API Diagram Tool</h1>
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'diagram' ? 'active' : ''}`}
            onClick={() => setActiveTab('diagram')}
          >
            Diagram Editor
          </button>
          <button 
            className={`tab-button ${activeTab === 'emails' ? 'active' : ''}`}
            onClick={() => setActiveTab('emails')}
          >
            Emails
          </button>
        </div>
      </header>
      <main className="app-content">
        <div className="sidebar">
          <ApiImporter onApiImport={handleApiImport} />
          
          <div className="sidebar-section">
            <h3>Mail Conditions</h3>
            <div className="condition-controls">
              <ConditionCreator onCreateCondition={handleCreateCondition} />
              <ConditionManager />
              <TaskManager />
            </div>
          </div>
          
          {apiSpec && activeTab === 'diagram' && (
            <div className="api-info">
              <h3>Loaded API: {apiSpec.info?.title || 'Untitled API'}</h3>
              <p>{apiSpec.info?.description || ''}</p>
              <p>Version: {apiSpec.info?.version || 'Unknown'}</p>
              <p>Endpoints: {nodes.length}</p>
            </div>
          )}
        </div>
        <div className="content-container">
          {activeTab === 'diagram' ? (
            <div className="diagram-container">
              <DiagramEditor 
                nodes={nodes} 
                edges={edges} 
                onNodesChange={handleNodesChange} 
                onEdgesChange={handleEdgesChange}
                onConnect={handleConnect}
                onEdgeDelete={handleEdgeDelete}
              />
              <NodesInventory />
            </div>
          ) : (
            <EmailBrowser />
          )}
        </div>
      </main>
      </div>
    </FlowProvider>
  );
}

export default App;
