import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// ──────────────────────────────────────────────────────────────
// UI & pages
// ──────────────────────────────────────────────────────────────
import HomePage from './components/HomePage';
import ApiImporter from './components/ApiImporter';
import DiagramEditor from './components/DiagramEditor';
import NodesInventory from './components/NodesInventory';
import EmailBrowser from './components/EmailBrowser';
import ConditionCreator from './components/ConditionCreator';
import ConditionManager from './components/ConditionManager';
import TaskManager from './components/TaskManager';
import FlowModal from './components/FlowModal';
import FlowVersionSelector from './components/FlowVersionSelector';

// Auth & header
import { useAuth } from './context/AuthContext';
import LoginButton from './components/auth/LoginButton';
import UserMenu from './components/auth/UserMenu';

// Contexts / stores
import { FlowProvider } from './context/FlowContext';
import { FlowManagerProvider } from './context/FlowManagerContext';
import conditionStore from './store/conditionStore';

// -----------------------------------------------------------------------------
// 🖥️  Editor sub‑app
// -----------------------------------------------------------------------------
const EditorApp = () => {
  const { isAuthenticated } = useAuth();

  // diagram state
  const [apiSpec, setApiSpec] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [apiInventoryNodes, setApiInventoryNodes] = useState([]);
  const [activeTab, setActiveTab] = useState('diagram');

  // reset on first mount (optional but explicit)
  useEffect(() => {
    setNodes([]);
    setEdges([]);
    setApiInventoryNodes([]);
  }, []);

  // ────────────────────────────────────────────────────────────
  // API import → generate inventory nodes
  // ────────────────────────────────────────────────────────────
  const handleApiImport = (spec) => {
    setApiSpec(spec);
    const { nodes: generated } = generateNodesFromApiSpec(spec);
    setApiInventoryNodes(generated); // only inventory, not canvas
  };

  const generateNodesFromApiSpec = (spec) => {
    const nodes = [];
    if (!spec.paths) return { nodes, edges: [] };

    // collect & sort endpoints
    const endpoints = Object.entries(spec.paths).flatMap(([path, item]) =>
      Object.entries(item)
        .filter(([m]) => ['get', 'post', 'put', 'patch', 'delete'].includes(m))
        .map(([method, operation]) => ({ path, method, operation }))
    );

    endpoints.sort((a, b) =>
      a.path === b.path
        ? ['get', 'post', 'put', 'patch', 'delete'].indexOf(a.method) -
          ['get', 'post', 'put', 'patch', 'delete'].indexOf(b.method)
        : a.path.localeCompare(b.path)
    );

    endpoints.forEach(({ path, method, operation }, idx) => {
      nodes.push({
        id: `api-${idx + 1}`,
        type: 'apiNode',
        data: {
          label: `${method.toUpperCase()} ${path}`,
          method,
          path,
          summary: operation.summary || '',
          description: operation.description || '',
          parameters: operation.parameters || [],
          requestBody: operation.requestBody || null,
          responses: operation.responses || {},
        },
      });
    });
    return { nodes, edges: [] };
  };

  // ────────────────────────────────────────────────────────────
  // Callbacks from DiagramEditor
  // ────────────────────────────────────────────────────────────
  const handleNodesChange = setNodes;
  const handleEdgesChange = setEdges;
  const handleConnect = setEdges;
  const handleEdgeDelete = (_, eds) => setEdges(eds);

  // ---------------------------------------------------------------------------
  // Condition creation helper
  // ---------------------------------------------------------------------------
  const handleCreateCondition = ({ data }) => {
    const id = `condition-${Date.now()}`;
    const last = nodes[nodes.length - 1];
    const newNode = {
      id,
      type: 'conditionNode',
      position: { x: last ? last.position.x + 250 : 100, y: last ? last.position.y : 100 },
      data: {
        conditionText: data.conditionText,
        returnText: data.returnText,
        isStartingPoint: false,
      },
    };
    setNodes([...nodes, newNode]);
    conditionStore.addCondition({ conditionText: data.conditionText, returnText: data.returnText });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <FlowManagerProvider>
      <FlowProvider nodes={nodes} edges={edges}>
        <div className="app-container">
          {/* ─────── Header ─────── */}
          <header className="app-header">
            <h1>Mailflow Editor</h1>
            <div className="header-right">
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
              {isAuthenticated ? <UserMenu /> : <LoginButton />}
            </div>
          </header>

          {/* ─────── Main layout ─────── */}
          <main className="app-content">
            {/* Sidebar */}
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
                  <p>Endpoints: {apiInventoryNodes.length}</p>
                </div>
              )}
            </div>

            {/* Content area */}
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
                  <NodesInventory apiNodes={apiInventoryNodes} />
                </div>
              ) : (
                <EmailBrowser />
              )}
            </div>
          </main>

          {/* Global modals / selectors */}
          <FlowModal />
          <FlowVersionSelector />
        </div>
      </FlowProvider>
    </FlowManagerProvider>
  );
};

// -----------------------------------------------------------------------------
// 🌐  Routes
// -----------------------------------------------------------------------------
function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/editor" element={<EditorApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
