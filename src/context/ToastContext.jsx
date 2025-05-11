import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, Stack } from '@mui/material';

// Create context
const ToastContext = createContext();

// Toast types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// Custom hook to use the toast context
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Add a new toast
  const showToast = useCallback((message, type = TOAST_TYPES.INFO, duration = 5000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  // Shorthand methods for different toast types
  const showSuccess = useCallback((message, duration) => 
    showToast(message, TOAST_TYPES.SUCCESS, duration), [showToast]);
  
  const showError = useCallback((message, duration) => 
    showToast(message, TOAST_TYPES.ERROR, duration), [showToast]);
  
  const showWarning = useCallback((message, duration) => 
    showToast(message, TOAST_TYPES.WARNING, duration), [showToast]);
  
  const showInfo = useCallback((message, duration) => 
    showToast(message, TOAST_TYPES.INFO, duration), [showToast]);

  // Remove a toast by id
  const hideToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Handle close event from Snackbar
  const handleClose = useCallback((event, reason, id) => {
    if (reason === 'clickaway') {
      return;
    }
    hideToast(id);
  }, [hideToast]);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        hideToast,
      }}
    >
      {children}
      <Stack spacing={2} sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000 }}>
        {toasts.map((toast) => (
          <Snackbar
            key={toast.id}
            open={true}
            autoHideDuration={toast.duration}
            onClose={(event, reason) => handleClose(event, reason, toast.id)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert
              onClose={() => hideToast(toast.id)}
              severity={toast.type}
              variant="filled"
              sx={{ width: '100%' }}
            >
              {toast.message}
            </Alert>
          </Snackbar>
        ))}
      </Stack>
    </ToastContext.Provider>
  );
};

export default ToastContext;
