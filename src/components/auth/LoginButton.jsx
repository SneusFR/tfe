import { useState } from 'react';
import { Button, Dialog, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import AuthPage from './AuthPage';
import CloseIcon from '@mui/icons-material/Close';

const LoginButton = () => {
  const [open, setOpen] = useState(false);
  
  const handleOpen = () => {
    setOpen(true);
  };
  
  const handleClose = () => {
    setOpen(false);
  };
  
  const handleAuthSuccess = () => {
    // Close the dialog after successful authentication
    setTimeout(() => {
      setOpen(false);
    }, 1500); // Give time to see the success message
  };
  
  return (
    <>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="contained"
          onClick={handleOpen}
          sx={{
            backgroundColor: '#8e44ad',
            '&:hover': {
              backgroundColor: '#7d3c98'
            },
            fontWeight: 'bold'
          }}
        >
          Login
        </Button>
      </motion.div>
      
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: 'transparent',
            boxShadow: 'none',
            overflow: 'visible'
          }
        }}
      >
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'grey.500',
            bgcolor: 'white',
            zIndex: 1,
            '&:hover': {
              bgcolor: 'grey.200',
            }
          }}
        >
          <CloseIcon />
        </IconButton>
        
        <AuthPage onAuthSuccess={handleAuthSuccess} />
      </Dialog>
    </>
  );
};

export default LoginButton;
