import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useFlow } from '../context/FlowContext';
import { useFlowAccess } from '../hooks/useFlowAccess';
import { useExecutionLogs } from '../hooks/useExecutionLogs';
import { LogEntry, LogLevel } from '../api/executionLogs';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
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
  Box,
  Typography,
  Stack,
  Pagination,
  Alert,
  Tooltip,
  FormHelperText
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
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { cn } from '../utils/classNames';

// Level badge colors and styles
const levelColors = {
  info: { bgcolor: 'primary.main', color: 'white' },
  debug: { bgcolor: 'grey.500', color: 'white' },
  warn: { bgcolor: 'warning.main', color: 'black' },
  error: { bgcolor: 'error.main', color: 'white' },
};

interface FlowLogsPanelProps {
  flowId: string;
}

// -- FlowLogsPanel.tsx
const FlowLogsPanel: React.FC<FlowLogsPanelProps> = ({ flowId }) => {
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
  const [filterLevel, setFilterLevel] = useState<LogLevel | undefined>(undefined);
  const [filterSince, setFilterSince] = useState<Date | undefined>(undefined);
  const [filterUntil, setFilterUntil] = useState<Date | undefined>(undefined);
  
  // Dialog states
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [openDetailDialog, setOpenDetailDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  
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
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss', { locale: fr });
    } catch (e) {
      return dateString;
    }
  };
  
  // Format payload for display
  const formatPayload = (payload?: string) => {
    if (!payload) return '';
    try {
      return JSON.stringify(JSON.parse(payload), null, 2);
    } catch (e) {
      return payload;
    }
  };
  
  // Copy payload to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(pageState.total / pageState.limit);
  
  // Render loading skeleton
  const renderSkeleton = () => (
    <Box sx={{ p: 2, width: '100%' }}>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Skeleton variant="rectangular" width={100} height={40} />
        <Skeleton variant="rectangular" width={100} height={40} />
        <Skeleton variant="rectangular" width={100} height={40} />
      </Stack>
      <Stack spacing={1}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" width="100%" height={48} />
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
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Filter bar */}
      <Box sx={{ 
        bgcolor: 'background.paper', 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 2
      }}>
        {/* Level filter */}
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="level-filter-label">Niveau</InputLabel>
          <Select
            labelId="level-filter-label"
            value={filterLevel || ''}
            label="Niveau"
            onChange={(e) => setFilterLevel(e.target.value as LogLevel || undefined)}
            displayEmpty
          >
            <MenuItem value="">Tous les niveaux</MenuItem>
            <MenuItem value="info">Info</MenuItem>
            <MenuItem value="debug">Debug</MenuItem>
            <MenuItem value="warn">Warn</MenuItem>
            <MenuItem value="error">Error</MenuItem>
          </Select>
        </FormControl>
        
        {/* Since date filter */}
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
          <DatePicker
            label="Depuis"
            value={filterSince}
            onChange={(date) => setFilterSince(date || undefined)}
            slotProps={{
              textField: {
                variant: 'outlined',
                sx: { width: 150 }
              }
            }}
          />
        </LocalizationProvider>
        
        {/* Until date filter */}
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
          <DatePicker
            label="Jusqu'à"
            value={filterUntil}
            onChange={(date) => setFilterUntil(date || undefined)}
            slotProps={{
              textField: {
                variant: 'outlined',
                sx: { width: 150 }
              }
            }}
          />
        </LocalizationProvider>
        
        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
          <Button 
            variant="contained" 
            onClick={handleApplyFilters}
          >
            Appliquer
          </Button>
          <Button 
            variant="outlined" 
            onClick={handleResetFilters}
          >
            Réinitialiser
          </Button>
          <Button 
            variant="outlined" 
            onClick={refetch} 
            startIcon={<RefreshIcon />}
            sx={{ ml: 1 }}
          >
            Rafraîchir
          </Button>
          
          {/* Clear logs button (only for owners) */}
          {isOwner && (
            <>
              <Button 
                variant="contained" 
                color="error" 
                startIcon={<DeleteIcon />}
                onClick={() => {
                  // Open confirmation dialog
                  setOpenDeleteDialog(true);
                }}
              >
                Effacer les logs
              </Button>
              
              {/* Confirmation dialog */}
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
                  <Button onClick={() => setOpenDeleteDialog(false)}>Annuler</Button>
                  <Button 
                    onClick={() => {
                      handleClearLogs();
                      setOpenDeleteDialog(false);
                    }} 
                    color="error" 
                    autoFocus
                  >
                    Supprimer
                  </Button>
                </DialogActions>
              </Dialog>
            </>
          )}
        </Box>
      </Box>
      
      {/* Logs table */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          renderSkeleton()
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
        ) : logs.length === 0 ? (
          renderEmptyState()
        ) : (
          <TableContainer component={Paper} sx={{ height: '100%', boxShadow: 'none' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell width={180}>Timestamp</TableCell>
                  <TableCell width={100}>Niveau</TableCell>
                  <TableCell width={120}>Node ID</TableCell>
                  <TableCell width={120}>Type</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell width={80} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {formatDate(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={log.level}
                        size="small"
                        sx={levelColors[log.level] || { bgcolor: 'grey.500', color: 'white' }}
                      />
                    </TableCell>
                    <TableCell>{log.nodeId || "-"}</TableCell>
                    <TableCell>{log.nodeType || "-"}</TableCell>
                    <TableCell sx={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.message}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Voir les détails">
                        <IconButton 
                          size="small"
                          onClick={() => {
                            setSelectedLog(log);
                            setOpenDetailDialog(true);
                          }}
                        >
                          <CodeIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {/* Detail dialog */}
                      <Dialog
                        open={openDetailDialog && selectedLog?.id === log.id}
                        onClose={() => setOpenDetailDialog(false)}
                        maxWidth="lg"
                        fullWidth
                      >
                        <DialogTitle>Détails du log</DialogTitle>
                        <DialogContent>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            {formatDate(log.timestamp)} - {log.nodeType} ({log.nodeId})
                          </Typography>
                          
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>Message</Typography>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                              {log.message}
                            </Paper>
                          </Box>
                          
                          {log.payload && (
                            <Box sx={{ mt: 3 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle1">Payload</Typography>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<CopyIcon />}
                                  onClick={() => copyToClipboard(log.payload || "")}
                                >
                                  Copier
                                </Button>
                              </Box>
                              <Paper 
                                variant="outlined" 
                                sx={{ 
                                  p: 2, 
                                  bgcolor: 'grey.50', 
                                  maxHeight: 400, 
                                  overflow: 'auto',
                                  fontFamily: 'monospace',
                                  fontSize: '0.75rem'
                                }}
                              >
                                <pre style={{ margin: 0 }}>
                                  {formatPayload(log.payload)}
                                </pre>
                              </Paper>
                            </Box>
                          )}
                        </DialogContent>
                        <DialogActions>
                          <Button onClick={() => setOpenDetailDialog(false)}>Fermer</Button>
                        </DialogActions>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
            {pageState.total} résultats
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Pagination
              count={totalPages}
              page={pageState.page}
              onChange={(_, page) => setPage(page)}
              showFirstButton
              showLastButton
              size="small"
            />
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default FlowLogsPanel;
