import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';

// ──────────────────────────────────────────────────────────────
// UI & pages
// ──────────────────────────────────────────────────────────────
import HomePage from './pages/HomePage';
import DiagramEditor from './components/DiagramEditor';
import EmailBrowser from './components/EmailBrowser';
import FlowLogsPanel from './components/FlowLogsPanel.jsx';
import LogsPanelWrapper from './components/LogsPanelWrapper.jsx';
import CollaboratorsManager from './components/CollaboratorsManager';
import ModernSidebar from './components/ModernSidebar';
import FlowModal from './components/FlowModal';
import FlowVersionSelector from './components/FlowVersionSelector';
import BackendSettings from './components/settings/BackendSettings';
import DocumentationPage from './pages/DocumentationPage';

// Auth & header
import { useAuth } from './context/AuthContext';
import LoginButton from './components/auth/LoginButton';
import UserMenu from './components/auth/UserMenu';
import AuthPage from './components/auth/AuthPage';

// Contexts / stores
import { FlowProvider } from './context/FlowContext';
import { FlowManagerProvider, useFlowManager } from './context/FlowManagerContext';
import { NodeFieldsProvider } from './context/NodeFieldsContext';
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
      // Extract the request body schema for POST, PUT, and PATCH methods
      let bodySchema = null;
      let defaultBody = {};
      
      if (['post', 'put', 'patch'].includes(method) && operation.requestBody) {
        const contentType = operation.requestBody.content?.['application/json'];
        if (contentType && contentType.schema) {
          bodySchema = contentType.schema;
          
          // If the schema is a reference, resolve it
          if (bodySchema.$ref) {
            const refPath = bodySchema.$ref.replace('#/', '').split('/');
            let resolvedSchema = spec;
            
            for (const part of refPath) {
              resolvedSchema = resolvedSchema[part];
            }
            
            bodySchema = resolvedSchema;
          }
        }
      }
      
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
          bodySchema, // Add the body schema
          defaultBody, // Add empty default body
          bindings: {}, // Add empty bindings
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
  const handleCreateCondition = async ({ data }) => {
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
    
    // Add the condition to the store and return the result
    const newCondition = await conditionStore.addCondition({ 
      conditionText: data.conditionText, 
      returnText: data.returnText 
    });
    
    console.log('✅ [APP] Condition created:', newCondition);
    return newCondition;
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <NodeFieldsProvider>
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
                <button
                  className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
                  onClick={() => setActiveTab('logs')}
                >
                  Logs
                </button>
                <button
                  className={`tab-button ${activeTab === 'collaborations' ? 'active' : ''}`}
                  onClick={() => setActiveTab('collaborations')}
                >
                  Collaborations
                </button>
              </div>
              {isAuthenticated ? <UserMenu /> : <LoginButton />}
            </div>
          </header>

          {/* ─────── Main layout ─────── */}
          <main className="app-content">
            {/* Modern Sidebar */}
            <ModernSidebar
              apiSpec={apiSpec}
              apiInventoryNodes={apiInventoryNodes}
              onApiImport={handleApiImport}
              onCreateCondition={handleCreateCondition}
              activeTab={activeTab}
            />

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
                </div>
              ) : activeTab === 'emails' ? (
                <EmailBrowser />
              ) : activeTab === 'logs' ? (
                <div className="logs-container">
                  <LogsPanelWrapper />
                </div>
              ) : activeTab === 'collaborations' ? (
                <div className="collaborations-container">
                  <CollaboratorsManager onClose={() => {}} />
                </div>
              ) : (
                <div className="logs-container">
                  <LogsPanelWrapper />
                </div>
              )}
            </div>
          </main>

          {/* Global modals / selectors */}
          <FlowModal />
          <FlowVersionSelector />
        </div>
      </FlowProvider>
    </NodeFieldsProvider>
  );
};

// -----------------------------------------------------------------------------
// Backend Settings Wrapper
// -----------------------------------------------------------------------------
const BackendSettingsWrapper = () => {
  const { currentFlowId } = useFlowManager();
  
  return (
    <NodeFieldsProvider>
      <FlowProvider nodes={[]} edges={[]} flowId={currentFlowId}>
        <BackendSettings />
      </FlowProvider>
    </NodeFieldsProvider>
  );
};

// -----------------------------------------------------------------------------
// Protected Route Component
// -----------------------------------------------------------------------------
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  if (!isAuthenticated) {
    // Redirect to the login page, but save the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
};

// -----------------------------------------------------------------------------
// 🌐  Routes
// -----------------------------------------------------------------------------
function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/documentation" element={<DocumentationPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/editor" element={
        <ProtectedRoute>
          <FlowManagerProvider>
            <EditorApp />
          </FlowManagerProvider>
        </ProtectedRoute>
      } />
      <Route path="/settings/backend" element={
        <ProtectedRoute>
          <FlowManagerProvider>
            <BackendSettingsWrapper />
          </FlowManagerProvider>
        </ProtectedRoute>
      } />
      <Route path="/settings/backend/:id" element={
        <ProtectedRoute>
          <FlowManagerProvider>
            <BackendSettingsWrapper />
          </FlowManagerProvider>
        </ProtectedRoute>
      } />
      <Route path="/settings/backend/new" element={
        <ProtectedRoute>
          <FlowManagerProvider>
            <BackendSettingsWrapper />
          </FlowManagerProvider>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
