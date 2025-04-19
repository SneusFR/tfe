import { useState } from 'react';
import { 
  Box, 
  IconButton, 
  Menu, 
  MenuItem, 
  Typography, 
  Avatar, 
  Tooltip, 
  Divider,
  Badge
} from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';

const UserMenu = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    logout();
    handleClose();
  };
  
  const handleSettings = () => {
    navigate('/settings');
    handleClose();
  };
  
  // Generate avatar initials from display name or email
  const getInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    } else if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };
  
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <Box sx={{ ml: 2 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Tooltip title="Account settings">
          <IconButton
            onClick={handleClick}
            size="small"
            aria-controls={open ? 'account-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
          >
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot"
              color="success"
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: '#8e44ad',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}
              >
                {getInitials()}
              </Avatar>
            </Badge>
          </IconButton>
        </Tooltip>
      </motion.div>
      
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 3,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
            mt: 1.5,
            borderRadius: 2,
            minWidth: 180,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {user?.displayName || 'User'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
            {user?.email}
          </Typography>
        </Box>
        
        <Divider />
        
        <MenuItem onClick={handleClose} sx={{ gap: 1 }}>
          <PersonIcon fontSize="small" />
          My Profile
        </MenuItem>
        
        <MenuItem onClick={handleSettings} sx={{ gap: 1 }}>
          <SettingsIcon fontSize="small" />
          Settings
        </MenuItem>
        
        <MenuItem onClick={handleLogout} sx={{ gap: 1 }}>
          <LogoutIcon fontSize="small" />
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default UserMenu;
