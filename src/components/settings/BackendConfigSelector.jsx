import { useState, useEffect } from "react";
import { 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Typography, 
  CircularProgress, 
  Button, 
  Tooltip
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useFlow } from "../../context/FlowContext";
import { useFlowManager } from "../../context/FlowManagerContext";
import SettingsIcon from "@mui/icons-material/Settings";

export default function BackendConfigSelector() {
  const navigate = useNavigate();
  const { backendConfigId, setBackendConfigId, backendConfigs, loading, flowId } = useFlow();
  const { currentFlowId } = useFlowManager();
  const [selectedId, setSelectedId] = useState(backendConfigId || "");

  // Update local state when context changes
  useEffect(() => {
    setSelectedId(backendConfigId || '');
  }, [backendConfigId]);

  // Handle selection change
  const handleChange = (event) => {
    const newId = event.target.value;
    setSelectedId(newId);
    setBackendConfigId(newId);
  };

  // Navigate to backend settings
  const handleOpenSettings = () => {
    navigate("/settings/backend");
  };

  // No longer using the concept of "active" config
  // The selected config is the one that will be used

  return (
    <Box sx={{ 
      display: "flex", 
      alignItems: "center", 
      gap: 1,
      p: 1,
      borderRadius: 1,
      bgcolor: "background.paper",
      boxShadow: 1
    }}>
      <Typography variant="body2" sx={{ mr: 1, whiteSpace: "nowrap" }}>
        Backend:
      </Typography>
      
      {loading ? (
        <CircularProgress size={20} sx={{ mx: 2 }} />
      ) : (
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <Select
            value={selectedId}
            onChange={handleChange}
            displayEmpty
            renderValue={(selected) => {
              if (!selected) {
                return "Select configuration";
              }
              
              const config = backendConfigs.find(c => c.id === selected);
              return config ? config.name : "Unknown configuration";
            }}
          >
            <MenuItem value="">
              <em>Select a configuration</em>
            </MenuItem>
            
            {backendConfigs.map((config) => (
              <MenuItem key={config.id} value={config.id}>
                {config.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      
      <Tooltip title="Manage backend configurations">
        <Button
          size="small"
          variant="outlined"
          onClick={handleOpenSettings}
          sx={{ minWidth: 40, width: 40, height: 40, p: 0 }}
        >
          <SettingsIcon fontSize="small" />
        </Button>
      </Tooltip>
    </Box>
  );
}
