import { useState } from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  Tabs, 
  Tab, 
  Typography, 
  useMediaQuery, 
  useTheme,
  Alert
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './Login';
import Register from './Register';
import { useAuth } from '../../context/AuthContext';

const AuthPage = ({ onAuthSuccess }) => {
  const [activeTab, setActiveTab] = useState(0);
  const { isAuthenticated, user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleAuthSuccess = () => {
    if (onAuthSuccess) {
      onAuthSuccess();
    }
  };
  
  return (
    <Container component="main" maxWidth="sm" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
          {isAuthenticated ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h5" component="h1" gutterBottom>
                  Welcome, {user?.displayName || 'User'}!
                </Typography>
                <Alert severity="success" sx={{ mt: 2 }}>
                  You are successfully logged in.
                </Alert>
              </Box>
            </motion.div>
          ) : (
            <>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange} 
                  variant={isMobile ? 'fullWidth' : 'standard'}
                  centered
                  sx={{
                    '& .MuiTabs-indicator': {
                      backgroundColor: '#8e44ad',
                    },
                    '& .Mui-selected': {
                      color: '#8e44ad !important',
                    }
                  }}
                >
                  <Tab 
                    label={
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Login
                      </motion.div>
                    } 
                    id="auth-tab-0" 
                    aria-controls="auth-tabpanel-0" 
                  />
                  <Tab 
                    label={
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Register
                      </motion.div>
                    } 
                    id="auth-tab-1" 
                    aria-controls="auth-tabpanel-1" 
                  />
                </Tabs>
              </Box>
              
              <AnimatePresence mode="wait">
                <Box 
                  role="tabpanel"
                  id={`auth-tabpanel-${activeTab}`}
                  aria-labelledby={`auth-tab-${activeTab}`}
                  sx={{ minHeight: '400px' }}
                >
                  {activeTab === 0 ? (
                    <Login onSuccess={handleAuthSuccess} />
                  ) : (
                    <Register onSuccess={handleAuthSuccess} />
                  )}
                </Box>
              </AnimatePresence>
            </>
          )}
        </Paper>
      </motion.div>
    </Container>
  );
};

export default AuthPage;
