import { useState, useEffect, useRef } from "react";
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  Tabs, 
  Tab, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  IconButton, 
  Divider, 
  Switch, 
  FormControlLabel, 
  InputAdornment, 
  Snackbar, 
  Alert, 
  Paper, 
  Container,
  Tooltip
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import SendIcon from "@mui/icons-material/Send";
import UserMenu from "../auth/UserMenu";
import BackendConfigSidebar from "./BackendConfigSidebar";

/** ------------------------------------------------------------------------
 *  Helper for a key / value editable list (headers, custom params, …)
 *  ---------------------------------------------------------------------*/
function KeyValueTable({ items, onChange, headerKey = "Key", headerValue = "Value" }) {
  const update = (idx, field, value) => {
    const next = items.map((row, i) => (i === idx ? { ...row, [field]: value } : row));
    onChange(next);
  };
  
  return (
    <motion.div 
      className="space-y-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {items.map((row, idx) => (
        <motion.div 
          key={idx} 
          className="grid grid-cols-12 gap-2 items-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: idx * 0.05 }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={5}>
              <TextField
                fullWidth
                placeholder={headerKey}
                value={row.key}
                onChange={e => update(idx, "key", e.target.value)}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={5}>
              <TextField
                fullWidth
                placeholder={headerValue}
                value={row.value}
                onChange={e => update(idx, "value", e.target.value)}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={2}>
              <Tooltip title="Delete row">
                <IconButton
                  color="error"
                  size="small"
                  onClick={() => onChange(items.filter((_, i) => i !== idx))}
                  aria-label="Delete row"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </motion.div>
      ))}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          type="button"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => onChange([...items, { key: "", value: "" }])}
          sx={{ mt: 1 }}
          size="small"
        >
          Add row
        </Button>
      </motion.div>
    </motion.div>
  );
}

/** ------------------------------------------------------------------------
 *  Main component
 *  ---------------------------------------------------------------------*/
export default function BackendSettings() {
  const { isAuthenticated, api } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [tabValue, setTabValue] = useState("general");
  const [showPassword, setShowPassword] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const refetchConfigs = useRef(null);
  
  const [form, setForm] = useState({
    name: "",
    description: "",
    baseUrl: "",
    timeout: 10000,
    retries: 0,
    authType: "none",
    auth: {},
    defaultHeaders: [],
    compression: false,
    proxy: { host: "", port: "" },
    tlsSkipVerify: false,
    isActive: false,
    test: {
      method: "get",
      path: "",
      body: "",
      response: null,
    },
  });

  // Fetch backend configuration if ID is provided
  useEffect(() => {
    if (id && id !== 'new') {
      const fetchConfig = async () => {
        try {
          const response = await api.get(`/api/backend-configs/${id}`);
          // Merge with existing form state instead of overwriting
          setForm(prev => ({ 
            ...prev, 
            ...response.data 
          }));
        } catch (error) {
          console.error('Error fetching backend config:', error);
          setSnackbar({
            open: true,
            message: `Error: ${error.message || 'Failed to load configuration'}`,
            severity: "error"
          });
        }
      };
      
      fetchConfig();
    }
  }, [id, api]);

  const authOptions = [
    { value: "none",        label: "None" },
    { value: "bearer",      label: "Bearer token" },
    { value: "basic",       label: "Basic auth" },
    { value: "apiKey",      label: "API key" },
    { value: "oauth2_cc",   label: "OAuth2 – Client credentials" },
    { value: "cookie",      label: "Cookie session" },
    { value: "custom",      label: "Custom headers" },
  ];

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  
  const handleTabChange = (_, newValue) => {
    setTabValue(newValue);
  };
  
  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };
  
  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!form.name || !form.baseUrl) {
        setSnackbar({
          open: true,
          message: "Name and Base URL are required fields",
          severity: "error"
        });
        return;
      }

      // Determine if this is a create or update operation
      const isUpdate = form.id ? true : false;
      
      // Make the API call
      const endpoint = isUpdate ? `/api/backend-configs/${form.id}` : '/api/backend-configs';
      const method = isUpdate ? 'put' : 'post';
      
      const response = await api.request({
        url: endpoint,
        method: method,
        data: form
      });
      
      const result = response.data;
      
      // Update the form with the returned ID if this was a create operation
      if (!isUpdate && result.id) {
        setForm(prev => ({ ...prev, id: result.id }));
        // Navigate to the new config's URL
        navigate(`/settings/backend/${result.id}`, { replace: true });
      }
      
      // Refresh the sidebar
      if (refetchConfigs.current) {
        refetchConfigs.current();
      }
      
      setSnackbar({
        open: true,
        message: `Backend configuration ${isUpdate ? 'updated' : 'created'} successfully!`,
        severity: "success"
      });
    } catch (error) {
      console.error('Error saving backend configuration:', error);
      setSnackbar({
        open: true,
        message: `Error: ${error.response?.data?.message || error.message}`,
        severity: "error"
      });
    }
  };

  // Handle setting a configuration as active
  const handleSetActive = async () => {
    try {
      if (!form.id) return;
      
      await api.patch(`/api/backend-configs/${form.id}/active`);
      
      // Update the form
      setForm(prev => ({ ...prev, isActive: true }));
      
      // Refresh the sidebar
      if (refetchConfigs.current) {
        refetchConfigs.current();
      }
      
      setSnackbar({
        open: true,
        message: "Backend configuration set as active",
        severity: "success"
      });
    } catch (error) {
      console.error('Error setting active configuration:', error);
      setSnackbar({
        open: true,
        message: `Error: ${error.response?.data?.message || error.message}`,
        severity: "error"
      });
    }
  };
  
  const handleCancel = () => {
    // Reset form to initial state
    navigate(-1);
  };
  
  const handleTest = async () => {
    // Simulate API test
    setSnackbar({
      open: true,
      message: "Test request sent successfully!",
      severity: "info"
    });
    
    // Simulate response after delay
    setTimeout(() => {
      setForm(prev => ({
        ...prev,
        test: {
          ...prev.test,
          response: {
            status: 200,
            data: { message: "API connection successful", timestamp: new Date().toISOString() }
          }
        }
      }));
    }, 1000);
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  /* -------------------------------------------------------------------- */
  /* UI                                                                   */
  /* -------------------------------------------------------------------- */
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header with navigation */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <IconButton 
                onClick={() => navigate(-1)} 
                sx={{ mr: 2 }}
                color="primary"
              >
                <ArrowBackIcon />
              </IconButton>
            </motion.div>
            <Typography variant="h4" component="h1" fontWeight="500">
              Backend Settings
            </Typography>
          </Box>
          {isAuthenticated && <UserMenu />}
        </Box>
        
        <Grid container spacing={3}>
          {/* Sidebar */}
          <Grid item xs={12} md={3}>
            <BackendConfigSidebar 
              selectedId={form.id} 
              refetchConfigs={refetchConfigs}
            />
          </Grid>
          
          {/* Main content */}
          <Grid item xs={12} md={9}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Paper 
                elevation={3} 
                sx={{ 
                  borderRadius: 2, 
                  overflow: "hidden",
                  transition: "box-shadow 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)"
                  }
                }}
              >
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                variant="fullWidth"
                sx={{
                  "& .MuiTab-root": {
                    py: 2,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: "rgba(142, 68, 173, 0.04)"
                    }
                  }
                }}
              >
                <Tab label="General" value="general" />
                <Tab label="Authentication" value="auth" />
                <Tab label="Advanced" value="advanced" />
                <Tab label="Test" value="test" />
              </Tabs>
            </Box>
            
            <CardContent sx={{ p: 4 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={tabValue}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* --------------------------- General ------------------------ */}
                  {tabValue === "general" && (
                    <Box component="section" className="space-y-4">
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            label="Display name *"
                            fullWidth
                            value={form.name}
                            onChange={e => handleChange("name", e.target.value)}
                            required
                            variant="outlined"
                            helperText="A name to identify this backend"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            label="Base URL *"
                            fullWidth
                            value={form.baseUrl}
                            onChange={e => handleChange("baseUrl", e.target.value)}
                            required
                            variant="outlined"
                            helperText="The base URL for API requests"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Description"
                            fullWidth
                            value={form.description}
                            onChange={e => handleChange("description", e.target.value)}
                            multiline
                            rows={3}
                            variant="outlined"
                            helperText="Optional description of this backend"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            label="Timeout (ms)"
                            type="number"
                            fullWidth
                            value={form.timeout}
                            onChange={e => handleChange("timeout", Number(e.target.value))}
                            InputProps={{ inputProps: { min: 0 } }}
                            variant="outlined"
                            helperText="Request timeout in milliseconds"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            label="Retries"
                            type="number"
                            fullWidth
                            value={form.retries}
                            onChange={e => handleChange("retries", Number(e.target.value))}
                            InputProps={{ inputProps: { min: 0 } }}
                            variant="outlined"
                            helperText="Number of retry attempts"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                            Default headers
                          </Typography>
                          <KeyValueTable
                            items={form.defaultHeaders}
                            onChange={headers => handleChange("defaultHeaders", headers)}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {/* --------------------------- Auth --------------------------- */}
                  {tabValue === "auth" && (
                    <Box component="section" className="space-y-6">
                      <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel id="auth-type-label">Authentication type</InputLabel>
                        <Select
                          labelId="auth-type-label"
                          value={form.authType}
                          onChange={e => handleChange("authType", e.target.value)}
                          label="Authentication type"
                        >
                          {authOptions.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <AnimatePresence mode="wait">
                        <motion.div
                          key={form.authType}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                        >
                          {/* Bearer token */}
                          {form.authType === "bearer" && (
                            <Grid container spacing={3}>
                              <Grid item xs={12} md={4}>
                                <TextField
                                  label="Prefix"
                                  placeholder="Bearer"
                                  fullWidth
                                  value={form.auth.prefix ?? "Bearer"}
                                  onChange={e =>
                                    setForm(prev => ({
                                      ...prev,
                                      auth: { ...prev.auth, prefix: e.target.value },
                                    }))
                                  }
                                  variant="outlined"
                                />
                              </Grid>
                              <Grid item xs={12} md={8}>
                                <TextField
                                  label="Token *"
                                  fullWidth
                                  type={showPassword.token ? "text" : "password"}
                                  value={form.auth.token ?? ""}
                                  onChange={e => setForm(prev => ({ 
                                    ...prev, 
                                    auth: { ...prev.auth, token: e.target.value } 
                                  }))}
                                  required
                                  variant="outlined"
                                  InputProps={{
                                    endAdornment: (
                                      <InputAdornment position="end">
                                        <IconButton
                                          onClick={() => togglePasswordVisibility("token")}
                                          edge="end"
                                        >
                                          {showPassword.token ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                      </InputAdornment>
                                    )
                                  }}
                                />
                              </Grid>
                            </Grid>
                          )}

                          {/* Basic auth */}
                          {form.authType === "basic" && (
                            <Grid container spacing={3}>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  label="Username *"
                                  fullWidth
                                  value={form.auth.username ?? ""}
                                  onChange={e => setForm(prev => ({ 
                                    ...prev, 
                                    auth: { ...prev.auth, username: e.target.value } 
                                  }))}
                                  required
                                  variant="outlined"
                                />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  label="Password *"
                                  fullWidth
                                  type={showPassword.password ? "text" : "password"}
                                  value={form.auth.password ?? ""}
                                  onChange={e => setForm(prev => ({ 
                                    ...prev, 
                                    auth: { ...prev.auth, password: e.target.value } 
                                  }))}
                                  required
                                  variant="outlined"
                                  InputProps={{
                                    endAdornment: (
                                      <InputAdornment position="end">
                                        <IconButton
                                          onClick={() => togglePasswordVisibility("password")}
                                          edge="end"
                                        >
                                          {showPassword.password ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                      </InputAdornment>
                                    )
                                  }}
                                />
                              </Grid>
                            </Grid>
                          )}

                          {/* API key */}
                          {form.authType === "apiKey" && (
                            <Grid container spacing={3}>
                              <Grid item xs={12} md={4}>
                                <FormControl fullWidth>
                                  <InputLabel>Location</InputLabel>
                                  <Select
                                    value={form.auth.location ?? "header"}
                                    onChange={e => setForm(prev => ({ 
                                      ...prev, 
                                      auth: { ...prev.auth, location: e.target.value } 
                                    }))}
                                    label="Location"
                                  >
                                    <MenuItem value="header">Header</MenuItem>
                                    <MenuItem value="query">Query‑string</MenuItem>
                                    <MenuItem value="cookie">Cookie</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <TextField
                                  label="Param / header name *"
                                  fullWidth
                                  value={form.auth.paramName ?? ""}
                                  onChange={e => setForm(prev => ({ 
                                    ...prev, 
                                    auth: { ...prev.auth, paramName: e.target.value } 
                                  }))}
                                  required
                                  variant="outlined"
                                />
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <TextField
                                  label="API Key *"
                                  fullWidth
                                  type={showPassword.apiKey ? "text" : "password"}
                                  value={form.auth.apiKey ?? ""}
                                  onChange={e => setForm(prev => ({ 
                                    ...prev, 
                                    auth: { ...prev.auth, apiKey: e.target.value } 
                                  }))}
                                  required
                                  variant="outlined"
                                  InputProps={{
                                    endAdornment: (
                                      <InputAdornment position="end">
                                        <IconButton
                                          onClick={() => togglePasswordVisibility("apiKey")}
                                          edge="end"
                                        >
                                          {showPassword.apiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                      </InputAdornment>
                                    )
                                  }}
                                />
                              </Grid>
                            </Grid>
                          )}

                          {/* OAuth2 client‑credentials */}
                          {form.authType === "oauth2_cc" && (
                            <Grid container spacing={3}>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  label="Token URL *"
                                  fullWidth
                                  value={form.auth.tokenUrl ?? ""}
                                  onChange={e => setForm(prev => ({ 
                                    ...prev, 
                                    auth: { ...prev.auth, tokenUrl: e.target.value } 
                                  }))}
                                  required
                                  variant="outlined"
                                />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  label="Scope(s) (space‑sep)"
                                  fullWidth
                                  value={form.auth.scopes ?? ""}
                                  onChange={e => setForm(prev => ({ 
                                    ...prev, 
                                    auth: { ...prev.auth, scopes: e.target.value } 
                                  }))}
                                  variant="outlined"
                                />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  label="Client ID *"
                                  fullWidth
                                  value={form.auth.clientId ?? ""}
                                  onChange={e => setForm(prev => ({ 
                                    ...prev, 
                                    auth: { ...prev.auth, clientId: e.target.value } 
                                  }))}
                                  required
                                  variant="outlined"
                                />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  label="Client Secret *"
                                  fullWidth
                                  type={showPassword.clientSecret ? "text" : "password"}
                                  value={form.auth.clientSecret ?? ""}
                                  onChange={e => setForm(prev => ({ 
                                    ...prev, 
                                    auth: { ...prev.auth, clientSecret: e.target.value } 
                                  }))}
                                  required
                                  variant="outlined"
                                  InputProps={{
                                    endAdornment: (
                                      <InputAdornment position="end">
                                        <IconButton
                                          onClick={() => togglePasswordVisibility("clientSecret")}
                                          edge="end"
                                        >
                                          {showPassword.clientSecret ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                      </InputAdornment>
                                    )
                                  }}
                                />
                              </Grid>
                            </Grid>
                          )}

                          {/* Cookie session */}
                          {form.authType === "cookie" && (
                            <Grid container spacing={3}>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  label="Cookie name *"
                                  fullWidth
                                  value={form.auth.cookieName ?? ""}
                                  onChange={e => setForm(prev => ({ 
                                    ...prev, 
                                    auth: { ...prev.auth, cookieName: e.target.value } 
                                  }))}
                                  required
                                  variant="outlined"
                                />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  label="Cookie value *"
                                  fullWidth
                                  type={showPassword.cookieValue ? "text" : "password"}
                                  value={form.auth.cookieValue ?? ""}
                                  onChange={e => setForm(prev => ({ 
                                    ...prev, 
                                    auth: { ...prev.auth, cookieValue: e.target.value } 
                                  }))}
                                  required
                                  variant="outlined"
                                  InputProps={{
                                    endAdornment: (
                                      <InputAdornment position="end">
                                        <IconButton
                                          onClick={() => togglePasswordVisibility("cookieValue")}
                                          edge="end"
                                        >
                                          {showPassword.cookieValue ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                      </InputAdornment>
                                    )
                                  }}
                                />
                              </Grid>
                            </Grid>
                          )}

                          {/* Custom headers */}
                          {form.authType === "custom" && (
                            <Box>
                              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                                Custom Authentication Headers
                              </Typography>
                              <KeyValueTable
                                items={form.auth.customHeaders ?? []}
                                onChange={rows => setForm(prev => ({ 
                                  ...prev, 
                                  auth: { ...prev.auth, customHeaders: rows } 
                                }))}
                                headerKey="Header"
                                headerValue="Value"
                              />
                            </Box>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </Box>
                  )}

                  {/* ----------------------- Advanced --------------------------- */}
                  {tabValue === "advanced" && (
                    <Box component="section" className="space-y-6">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={form.compression}
                            onChange={e => handleChange("compression", e.target.checked)}
                            color="primary"
                          />
                        }
                        label={
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Typography>Send </Typography>
                            <Box component="code" sx={{ mx: 0.5, p: 0.5, bgcolor: "grey.100", borderRadius: 1 }}>
                              Accept‑Encoding: gzip
                            </Box>
                          </Box>
                        }
                      />

                      <Typography variant="subtitle1" sx={{ mt: 3, mb: 2, fontWeight: 500 }}>
                        Proxy Configuration
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                          <TextField
                            label="Proxy host"
                            fullWidth
                            value={form.proxy.host}
                            onChange={e =>
                              setForm(prev => ({ ...prev, proxy: { ...prev.proxy, host: e.target.value } }))
                            }
                            variant="outlined"
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            label="Port"
                            fullWidth
                            type="number"
                            value={form.proxy.port}
                            onChange={e =>
                              setForm(prev => ({ ...prev, proxy: { ...prev.proxy, port: e.target.value } }))
                            }
                            variant="outlined"
                          />
                        </Grid>
                      </Grid>

                      <Box sx={{ mt: 3 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={form.tlsSkipVerify}
                              onChange={e => handleChange("tlsSkipVerify", e.target.checked)}
                              color="warning"
                            />
                          }
                          label={
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <Typography>Skip SSL certificate validation</Typography>
                              <Typography color="warning.main" sx={{ ml: 1 }}>
                                (⚠️ Not recommended)
                              </Typography>
                            </Box>
                          }
                        />
                      </Box>
                    </Box>
                  )}

                  {/* ------------------------- Test ----------------------------- */}
                  {tabValue === "test" && (
                    <Box component="section" className="space-y-4">
                      <Grid container spacing={2} alignItems="flex-end">
                        <Grid item xs={12} md={2}>
                          <FormControl fullWidth>
                            <InputLabel>Method</InputLabel>
                            <Select
                              value={form.test?.method || 'get'}
                              onChange={e => setForm(prev => ({ 
                                ...prev, 
                                test: { ...prev.test, method: e.target.value } 
                              }))}
                              label="Method"
                            >
                              {['get', 'post', 'put', 'patch', 'delete'].map(m => (
                                <MenuItem key={m} value={m}>{m.toUpperCase()}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={8}>
                          <TextField
                            label="Path"
                            placeholder="/users/me"
                            fullWidth
                              value={form.test?.path || ''}
                            onChange={e => setForm(prev => ({ 
                              ...prev, 
                              test: { ...prev.test, path: e.target.value } 
                            }))}
                            variant="outlined"
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            <Button
                              fullWidth
                              variant="contained"
                              color="primary"
                              startIcon={<SendIcon />}
                              onClick={handleTest}
                            >
                              Send
                            </Button>
                          </motion.div>
                        </Grid>
                      </Grid>
                      
                      <AnimatePresence>
                        {(form.test.method === 'post' || form.test.method === 'put' || form.test.method === 'patch') && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Box sx={{ mt: 3 }}>
                              <TextField
                                label="Body (JSON)"
                                fullWidth
                                multiline
                                rows={6}
                                value={form.test?.body || ''}
                                onChange={e => setForm(prev => ({ 
                                  ...prev, 
                                  test: { ...prev.test, body: e.target.value } 
                                }))}
                                placeholder='{"foo":"bar"}'
                                variant="outlined"
                              />
                            </Box>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <AnimatePresence>
                        {form.test.response && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                          >
                            <Paper 
                              sx={{ 
                                p: 2, 
                                mt: 3, 
                                bgcolor: "grey.50", 
                                borderRadius: 1,
                                maxHeight: "300px",
                                overflow: "auto"
                              }}
                            >
                              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                                Response
                              </Typography>
                              <Box 
                                component="pre" 
                                sx={{ 
                                  p: 2, 
                                  bgcolor: "grey.900", 
                                  color: "grey.100", 
                                  borderRadius: 1,
                                  overflow: "auto",
                                  fontSize: "0.875rem"
                                }}
                              >
                                {JSON.stringify(form.test.response, null, 2)}
                              </Box>
                            </Paper>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Box>
                  )}
                </motion.div>
              </AnimatePresence>
              
                <Divider sx={{ my: 4 }} />
                
                <Box sx={{ display: "flex", justifyContent: "space-between", px: 4, pb: 4 }}>
                  <Box>
                    {form.id && (
                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Button
                          variant="outlined"
                          color={form.isActive ? 'success' : 'primary'}
                          disabled={form.isActive}
                          onClick={handleSetActive}
                          sx={{ mr: 2 }}
                        >
                          {form.isActive ? 'Active' : 'Set active'}
                        </Button>
                      </motion.div>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button 
                        variant="outlined" 
                        color="secondary" 
                        onClick={handleCancel}
                        startIcon={<CancelIcon />}
                      >
                        Cancel
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleSubmit}
                        startIcon={<SaveIcon />}
                      >
                        Save settings
                      </Button>
                    </motion.div>
                  </Box>
                </Box>
              </CardContent>
            </Paper>
          </motion.div>
        </Grid>
      </Grid>
      
      {/* Feedback snackbar */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  </Container>
  );
}
