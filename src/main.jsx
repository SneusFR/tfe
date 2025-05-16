import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import './styles/Auth.css';
import App from './App.jsx';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

console.log('🌈 React bundle chargé !');


createRoot(document.getElementById('root')).render(
  // <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  // </StrictMode>
);
