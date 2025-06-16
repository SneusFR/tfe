import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useFlow } from '../../context/FlowContext';
import { useFlowAccess } from '../../hooks/useFlowAccess.js';
import { Box, Tabs, Tab, Typography, Paper } from '@mui/material';
import { 
  ViewList as ListViewIcon,
  AccountTree as TreeViewIcon
} from '@mui/icons-material';
import ExecutionLogsVisualizer from '../execution-logs/ExecutionLogsVisualizer';

// Original imports for the list view
import { useExecutionLogs } from '../../hooks/useExecutionLogs.js';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Chip,
  Skeleton,
  Stack,
  Pagination,
  Alert,
  Tooltip,
  FormHelperText,
  Collapse,
  Card,
  CardContent,
  Divider,
  Badge,
  Fade,
  alpha,
  useTheme
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
  Refresh as RefreshIcon, 
  Delete as DeleteIcon, 
  FileCopy as CopyIcon, 
  Code as CodeIcon,
  Description as FileTextIcon,
  CalendarToday as CalendarIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FilterAlt as FilterIcon,
  Search as SearchIcon,
  ContentCopy as ContentCopyIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  BugReport as DebugIcon
} from '@mui/icons-material';
import { cn } from '../../utils/classNames.js';

// Level badge colors, styles and icons - using fixed color values to avoid MUI errors
const levelConfig = {
  info: { 
    bgcolor: '#1976d2', // primary blue
    color: 'white',
    lightBg: '#e3f2fd',
    icon: <InfoIcon fontSize="small" />,
    label: 'Info'
  },
  debug: { 
    bgcolor: '#757575', // grey
    color: 'white',
    lightBg: '#f5f5f5',
    icon: <DebugIcon fontSize="small" />,
    label: 'Debug'
  },
  warn: { 
    bgcolor: '#ed6c02', // warning orange
    color: 'black',
    lightBg: '#fff4e5',
    icon: <WarningIcon fontSize="small" />,
    label: 'Warning'
  },
  error: { 
    bgcolor: '#d32f2f', // error red
    color: 'white',
    lightBg: '#fdecea',
    icon: <ErrorIcon fontSize="small" />,
    label: 'Error'
  },
};

// -- FlowLogsPanel.jsx
const FlowLogsPanel = ({ flowId }) => {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState('visual'); // 'visual' or 'list'
  
  useEffect(() => {
    console.log('[FlowLogsPanel] mount, props.flowId =', flowId);
  }, [flowId]);

  // Guard: check if flowId is defined
  if (!flowId) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Sélectionnez (ou créez) un flow pour afficher les logs
        </Typography>
      </Box>
    );
  }

  // Access control
  const { hasAccess: isOwner } = useFlowAccess('owner');
  
  // Filter state
  const [filterLevel, setFilterLevel] = useState(undefined);
  const [filterSince, setFilterSince] = useState(undefined);
  const [filterUntil, setFilterUntil] = useState(undefined);
  const [filterText, setFilterText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Expanded rows state
  const [expandedRows, setExpandedRows] = useState({});
  
  // Dialog states
  const [selectedLog, setSelectedLog] = useState(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  
  // Initial filter and page state
  const initialFilter = useMemo(() => ({
    flowId,
    level: filterLevel,
    since: filterSince?.toISOString(),
    until: filterUntil?.toISOString(),
  }), [flowId, filterLevel, filterSince, filterUntil]);
  
  const initialPageState = {
    page: 1,
    limit: 20,
    total: 0,
    sort: "-createdAt",
  };
  
  // Use the custom hook for logs
  const {
    logs,
    pageState,
    loading,
    error,
    updateFilter,
    setPage,
    deleteLogs,
    refetch,
  } = useExecutionLogs(initialFilter, initialPageState);
  
  // Toggle row expansion
  const toggleRowExpansion = (logId) => {
    setExpandedRows(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };
  
  // Apply filters
  const handleApplyFilters = useCallback(() => {
    updateFilter({
      level: filterLevel,
      since: filterSince?.toISOString(),
      until: filterUntil?.toISOString(),
    });
  }, [updateFilter, filterLevel, filterSince, filterUntil]);
  
  // Reset filters
  const handleResetFilters = useCallback(() => {
    setFilterLevel(undefined);
    setFilterSince(undefined);
    setFilterUntil(undefined);
    setFilterText('');
    updateFilter({
      level: undefined,
      since: undefined,
      until: undefined,
    });
  }, [updateFilter]);
  
  // Clear logs
  const handleClearLogs = useCallback(() => {
    deleteLogs({ flowId });
  }, [deleteLogs, flowId]);
  
  // Format date for display
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss', { locale: fr });
    } catch (e) {
      return dateString;
    }
  };
  
  // Format payload for display
  const formatPayload = (payload) => {
    if (!payload) return '';
    try {
      return JSON.stringify(JSON.parse(payload), null, 2);
    } catch (e) {
      return payload;
    }
  };
  
  // Copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };
  
  // Filter logs by text
  const filteredLogs = useMemo(() => {
    if (!filterText) return logs;
    
    return logs.filter(log => 
      log.message?.toLowerCase().includes(filterText.toLowerCase()) ||
      log.nodeId?.toLowerCase().includes(filterText.toLowerCase()) ||
      log.nodeType?.toLowerCase().includes(filterText.toLowerCase()) ||
      log.payload?.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [logs, filterText]);
  
  // Calculate total pages
  const totalPages = Math.ceil(pageState.total / pageState.limit);
  
  // Render loading skeleton
  const renderSkeleton = () => (
    <Box sx={{ p: 2, width: '100%' }}>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 1 }} />
      </Stack>
      <Stack spacing={1}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" width="100%" height={60} sx={{ borderRadius: 1 }} />
        ))}
      </Stack>
    </Box>
  );
  
  // Render empty state
  const renderEmptyState = () => (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        py: 6, 
        textAlign: 'center' 
      }}
    >
      <FileTextIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h6">Aucun log pour l'instant</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Les logs apparaîtront ici lorsque le flow sera exécuté.
      </Typography>
    </Box>
  );
  
  // Render log item
  const renderLogItem = (log) => {
    const isExpanded = expandedRows[log.id] || false;
    const levelInfo = levelConfig[log.level] || levelConfig.debug;
    
    return (
      <Card 
        key={log.id} 
        sx={{ 
          mb: 1, 
          borderRadius: 1,
          boxShadow: 'none',
          border: 1,
          borderColor: 'divider',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: 1,
            borderColor: 'transparent'
          }
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {/* Log header */}
          <Box 
            sx={{ 
              p: 1.5, 
              display: 'flex', 
              alignItems: 'center',
              bgcolor: isExpanded ? alpha(levelInfo.bgcolor, 0.05) : 'white',
              borderBottom: isExpanded ? 1 : 0,
              borderColor: 'divider',
              cursor: 'pointer'
            }}
            onClick={() => toggleRowExpansion(log.id)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
              <Chip 
                icon={levelInfo.icon}
                label={levelInfo.label}
                size="small"
                sx={{ 
                  bgcolor: levelInfo.bgcolor, 
                  color: levelInfo.color,
                  mr: 2,
                  '& .MuiChip-icon': {
                    color: levelInfo.color
                  }
                }}
              />
              
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 500,
                    overflow: 'visible',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    mb: 0.5
                  }}
                >
                  {log.message}
                </Typography>
                
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    color: 'text.secondary',
                    fontSize: '0.75rem'
                  }}
                >
                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                    {formatDate(log.timestamp)}
                  </Typography>
                  
                  {log.nodeType && (
                    <Typography variant="caption">
                      {log.nodeType}
                    </Typography>
                  )}
                  
                  {log.nodeId && (
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      {log.nodeId}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
            
            <IconButton 
              size="small" 
              sx={{ ml: 1 }}
              onClick={(e) => {
                e.stopPropagation();
                toggleRowExpansion(log.id);
              }}
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          
          {/* Expanded content */}
          <Collapse in={isExpanded}>
            <Box sx={{ p: 2, bgcolor: alpha(levelInfo.bgcolor, 0.03) }}>
              {/* Message section */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2">Message</Typography>
                  <Tooltip title="Copier le message">
                    <IconButton 
                      size="small"
                      onClick={() => copyToClipboard(log.message || "")}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 1.5, 
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {log.message}
                </Paper>
              </Box>
              
              {/* Payload section (if available) */}
              {log.payload && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">Payload</Typography>
                    <Tooltip title="Copier le payload">
                      <IconButton 
                        size="small"
                        onClick={() => copyToClipboard(log.payload || "")}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 1.5, 
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      maxHeight: 300, 
                      overflow: 'auto',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem'
                    }}
                  >
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {formatPayload(log.payload)}
                    </pre>
                  </Paper>
                </Box>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    );
  };
  
  // View mode tabs
  const renderViewModeTabs = () => (
    <Paper 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        borderRadius: '12px 12px 0 0',
        boxShadow: 'none',
        borderBottom: 1,
        borderColor: 'divider',
        overflow: 'hidden',
        bgcolor: theme.palette.background.paper,
      }}
    >
      <Tabs 
        value={viewMode} 
        onChange={(_, newValue) => setViewMode(newValue)}
        indicatorColor="primary"
        textColor="primary"
        variant="fullWidth"
        sx={{
          minHeight: '56px',
          width: '100%',
          '& .MuiTab-root': {
            minHeight: '56px',
            fontWeight: 600,
            fontSize: '0.95rem',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.04),
            },
          },
          '& .Mui-selected': {
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            color: theme.palette.primary.main,
          },
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0',
          }
        }}
      >
        <Tab 
          value="visual" 
          label="Visualisation" 
          icon={<TreeViewIcon />} 
          iconPosition="start"
          sx={{
            gap: 1.5,
            '& .MuiSvgIcon-root': {
              fontSize: '1.25rem',
            }
          }}
        />
        <Tab 
          value="list" 
          label="Liste" 
          icon={<ListViewIcon />} 
          iconPosition="start"
          sx={{
            gap: 1.5,
            '& .MuiSvgIcon-root': {
              fontSize: '1.25rem',
            }
          }}
        />
      </Tabs>
    </Paper>
  );
  
  // Render the visual view (ExecutionLogsVisualizer)
  const renderVisualView = () => (
    <Box sx={{ 
      height: 'calc(100% - 48px)',
      width: '100%',
    }}>
      <ExecutionLogsVisualizer flowId={flowId} />
    </Box>
  );
  
  // Render the list view (original implementation)
  const renderListView = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 48px)', bgcolor: 'background.default' }}>
      {/* Header with title and actions */}
      <Box sx={{ 
        bgcolor: 'background.paper', 
        p: 2,
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 1
      }}>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Logs d'exécution
        </Typography>
        
        <Stack direction="row" spacing={1}>
          <Tooltip title="Rafraîchir les logs">
            <IconButton 
              color="primary"
              onClick={refetch}
              sx={{ borderRadius: 1 }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Filtres">
            <IconButton 
              color={showFilters ? "primary" : "default"}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ 
                borderRadius: 1,
                bgcolor: showFilters ? alpha(theme.palette.primary.main, 0.1) : 'transparent'
              }}
            >
              <FilterIcon />
            </IconButton>
          </Tooltip>
          
          {isOwner && (
            <Tooltip title="Effacer tous les logs">
              <IconButton 
                color="error"
                onClick={() => setOpenDeleteDialog(true)}
                sx={{ borderRadius: 1 }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>
      
      {/* Filter panel */}
      <Collapse in={showFilters}>
        <Box sx={{ 
          bgcolor: alpha(theme.palette.primary.main, 0.03),
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
        }}>
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            spacing={2} 
            alignItems={{ xs: 'stretch', md: 'center' }}
            sx={{ mb: 2 }}
          >
            {/* Search filter */}
            <TextField
              placeholder="Rechercher dans les logs..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                sx: { borderRadius: 1 }
              }}
            />
            
            {/* Level filter */}
            <FormControl sx={{ minWidth: 150 }} size="small">
              <InputLabel id="level-filter-label">Niveau</InputLabel>
              <Select
                labelId="level-filter-label"
                value={filterLevel || ''}
                label="Niveau"
                onChange={(e) => setFilterLevel(e.target.value || undefined)}
                displayEmpty
                sx={{ borderRadius: 1 }}
              >
                <MenuItem value="">Tous les niveaux</MenuItem>
                <MenuItem value="info">
                  <Stack direction="row" spacing={1} alignItems="center">
                    {levelConfig.info.icon}
                    <Typography>Info</Typography>
                  </Stack>
                </MenuItem>
                <MenuItem value="debug">
                  <Stack direction="row" spacing={1} alignItems="center">
                    {levelConfig.debug.icon}
                    <Typography>Debug</Typography>
                  </Stack>
                </MenuItem>
                <MenuItem value="warn">
                  <Stack direction="row" spacing={1} alignItems="center">
                    {levelConfig.warn.icon}
                    <Typography>Warning</Typography>
                  </Stack>
                </MenuItem>
                <MenuItem value="error">
                  <Stack direction="row" spacing={1} alignItems="center">
                    {levelConfig.error.icon}
                    <Typography>Error</Typography>
                  </Stack>
                </MenuItem>
              </Select>
            </FormControl>
            
            {/* Date range filters */}
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker
                label="Depuis"
                value={filterSince}
                onChange={(date) => setFilterSince(date || undefined)}
                slotProps={{
                  textField: {
                    variant: 'outlined',
                    size: 'small',
                    sx: { width: 150, borderRadius: 1 }
                  }
                }}
              />
            </LocalizationProvider>
            
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker
                label="Jusqu'à"
                value={filterUntil}
                onChange={(date) => setFilterUntil(date || undefined)}
                slotProps={{
                  textField: {
                    variant: 'outlined',
                    size: 'small',
                    sx: { width: 150, borderRadius: 1 }
                  }
                }}
              />
            </LocalizationProvider>
          </Stack>
          
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button 
              variant="outlined" 
              size="small"
              onClick={handleResetFilters}
              sx={{ borderRadius: 1 }}
            >
              Réinitialiser
            </Button>
            <Button 
              variant="contained" 
              size="small"
              onClick={handleApplyFilters}
              sx={{ borderRadius: 1 }}
            >
              Appliquer
            </Button>
          </Stack>
        </Box>
      </Collapse>
      
      {/* Logs content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {loading ? (
          renderSkeleton()
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        ) : filteredLogs.length === 0 ? (
          renderEmptyState()
        ) : (
          <Box>
            {filteredLogs.map(renderLogItem)}
          </Box>
        )}
      </Box>
      
      {/* Pagination */}
      {!loading && logs.length > 0 && (
        <Box sx={{ 
          bgcolor: 'background.paper', 
          p: 2, 
          borderTop: 1, 
          borderColor: 'divider',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between'
        }}>
          <Typography variant="body2" color="text.secondary">
            {filterText ? `${filteredLogs.length} sur ${pageState.total} résultats` : `${pageState.total} résultats`}
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Pagination
              count={totalPages}
              page={pageState.page}
              onChange={(_, page) => setPage(page)}
              showFirstButton
              showLastButton
              size="small"
              shape="rounded"
            />
          </Stack>
        </Box>
      )}
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Êtes-vous sûr ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Cette action va supprimer définitivement tous les logs de ce flow.
            Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenDeleteDialog(false)}
            sx={{ borderRadius: 1 }}
          >
            Annuler
          </Button>
          <Button 
            onClick={() => {
              handleClearLogs();
              setOpenDeleteDialog(false);
            }} 
            color="error" 
            variant="contained"
            autoFocus
            sx={{ borderRadius: 1 }}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      width: '100%',
      bgcolor: 'background.default',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      {renderViewModeTabs()}
      {viewMode === 'visual' ? renderVisualView() : renderListView()}
    </Box>
  );
};

export default FlowLogsPanel;
