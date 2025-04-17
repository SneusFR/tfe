import { useState, useEffect } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';

const LoadingButton = ({ 
  loading, 
  children, 
  onClick, 
  variant = 'contained', 
  color = 'primary',
  fullWidth = false,
  ...props 
}) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      style={{ width: fullWidth ? '100%' : 'auto' }}
    >
      <Button
        variant={variant}
        color={color}
        disabled={loading}
        onClick={onClick}
        fullWidth={fullWidth}
        sx={{
          position: 'relative',
          minHeight: '36px',
          ...props.sx
        }}
        {...props}
      >
        {loading ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <CircularProgress 
              size={24} 
              color="inherit" 
              sx={{ 
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginTop: '-12px',
                marginLeft: '-12px'
              }} 
            />
          </motion.div>
        ) : null}
        <motion.span
          animate={{ 
            opacity: loading ? 0 : 1,
            scale: loading ? 0.8 : 1
          }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.span>
      </Button>
    </motion.div>
  );
};

export default LoadingButton;
