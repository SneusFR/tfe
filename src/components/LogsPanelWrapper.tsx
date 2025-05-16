import React, { useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useFlowManager } from '../context/FlowManagerContext';
import FlowLogsPanel from './FlowLogsPanel';

// -- LogsPanelWrapper.tsx
const LogsPanelWrapper: React.FC = () => {
  const { currentFlow, loading } = useFlowManager();
  
  useEffect(() => {
    console.log('[LogsPanelWrapper] mount, currentFlow =', currentFlow);
  }, [currentFlow]);

  if (loading) return <CircularProgress sx={{ m: 6 }} />;
  if (!currentFlow) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Sélectionnez (ou créez) un flow pour afficher les logs
        </Typography>
      </Box>
    );
  }
  // Add console.log to debug the flow object structure
  console.log('Current Flow:', currentFlow);
  
  // Use _id as fallback if id is not available
  const flowId = currentFlow.id || currentFlow._id;
  return <FlowLogsPanel flowId={flowId} />;
};

export default LogsPanelWrapper;
