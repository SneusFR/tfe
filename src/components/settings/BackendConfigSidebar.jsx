import { useState, useEffect } from "react";
import { 
  Box, 
  List, 
  ListItem, 
  ListItemButton,
  ListItemText, 
  Typography, 
  Button, 
  Chip, 
  Divider, 
  CircularProgress, 
  Paper
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useFlowManager } from "../../context/FlowManagerContext";
import backendConfigStore from "../../store/backendConfigStore";
import AddIcon from "@mui/icons-material/Add";
import { motion } from "framer-motion";

export default function BackendConfigSidebar({ onSelectConfig, selectedId, refetchConfigs }) {
  const { currentFlowId } = useFlowManager();
  const navigate = useNavigate();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch backend configurations
  const fetchConfigs = async () => {
    if (!currentFlowId) return;     // ① attendre que l'ID existe
    
    setLoading(true);
    try {
      // Set the current flow ID in the store
      backendConfigStore.setCurrentFlowId(currentFlowId);
      
      // Get all backend configs
      const configs = await backendConfigStore.getAll();
      setConfigs(configs);
      setError(null);
    } catch (err) {
      console.error('Error fetching backend configs:', err);
      setError('Failed to load backend configurations');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (!currentFlowId) return;     // ① attendre que l'ID existe
    fetchConfigs();
  }, [currentFlowId]);

  // Set up refetchConfigs function
  useEffect(() => {
    if (refetchConfigs) {
      refetchConfigs.current = fetchConfigs;
    }
  }, [refetchConfigs]);

  // Handle adding a new configuration
  const handleAddConfig = () => {
    navigate('/settings/backend/new');
  };

  // Handle selecting a configuration
  const handleSelectConfig = (configId) => {
    if (onSelectConfig) {
      onSelectConfig(configId);
    }
    navigate(`/settings/backend/${configId}`);
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        height: '100%', 
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'box-shadow 0.3s ease',
        "&:hover": {
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
        }
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight="500">
          My Backends
        </Typography>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress size={30} />
        </Box>
      ) : error ? (
        <Box sx={{ p: 2, color: 'error.main' }}>
          <Typography>{error}</Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {configs.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="text.secondary">No backends configured</Typography>
            </Box>
          ) : (
            configs.map((config) => (
              <motion.div
                key={config.id}
                whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ListItem disablePadding>
                  <ListItemButton
                    selected={selectedId === config.id}
                    onClick={() => handleSelectConfig(config.id)}
                    sx={{ 
                      borderLeft: selectedId === config.id ? 3 : 0, 
                      borderColor: 'primary.main',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" fontWeight={500}>
                            {config.name}
                          </Typography>
                        </Box>
                      }
                      secondary={config.baseUrl}
                    />
                  </ListItemButton>
                </ListItem>
                <Divider />
              </motion.div>
            ))
          )}
        </List>
      )}
      
      <Box sx={{ p: 2 }}>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            fullWidth
            onClick={handleAddConfig}
          >
            Add Config
          </Button>
        </motion.div>
      </Box>
    </Paper>
  );
}
