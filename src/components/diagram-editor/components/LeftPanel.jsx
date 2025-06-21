import React from 'react';
import { Panel } from 'reactflow';
import BackendConfigSelector from '../../settings/BackendConfigSelector';

/**
 * LeftPanel component that displays the left panel of the diagram editor
 * Currently contains the BackendConfigSelector
 */
const LeftPanel = () => {
  return (
    <Panel position="top-left" style={{ marginTop: '10px' }}>
      <BackendConfigSelector />
    </Panel>
  );
};

export default LeftPanel;
