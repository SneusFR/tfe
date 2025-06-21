import React from 'react';
import { Panel, useReactFlow } from 'reactflow';
import { Tooltip } from '@mui/material';
import { Psychology as AIIcon } from '@mui/icons-material';

/**
 * DiagramToolbar component that displays flow information and action buttons
 */
const DiagramToolbar = ({
  currentFlow,
  nodes,
  canEdit,
  hasAccess,
  loading,
  createSubFlows,
  handleSave,
  toggleFlowModal,
  setAiFlowBuilderOpen
}) => {
  const { fitView } = useReactFlow();

  return (
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
              onClick={() => fitView({ padding: 0.2 })}
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
  );
};

export default DiagramToolbar;
