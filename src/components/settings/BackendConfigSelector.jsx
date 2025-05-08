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

  // Get the active config
  const activeConfig = backendConfigs.find(config => config.isActive);

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
          <InputLabel id="backend-config-select-label">Configuration</InputLabel>
          <Select
            labelId="backend-config-select-label"
            value={selectedId}
            label="Configuration"
            onChange={handleChange}
            displayEmpty
            renderValue={(selected) => {
              if (!selected) {
                return (
                  <Typography variant="body2" color="text.secondary">
                    {activeConfig ? `${activeConfig.name} (Active)` : "Select configuration"}
                  </Typography>
                );
              }
              
              const config = backendConfigs.find(c => c.id === selected);
              return (
                <Typography variant="body2">
                  {config ? config.name : "Unknown configuration"}
                  {config && config.isActive && " (Active)"}
                </Typography>
              );
            }}
          >
            <MenuItem value="">
              <em>{activeConfig ? `${activeConfig.name} (Active)` : "Use active configuration"}</em>
            </MenuItem>
            
            {backendConfigs.map((config) => (
              <MenuItem key={config.id} value={config.id}>
                {config.name}
                {config.isActive && " (Active)"}
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
