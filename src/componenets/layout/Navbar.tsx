import React, { useState, useEffect } from 'react';
import { AppBar, Tabs, Tab, Toolbar, Typography, Avatar, Box, Menu, MenuItem, IconButton } from '@mui/material';
import { Settings, Logout } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

const NavTabs: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{name: string, email: string, image_url?: string} | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    const authStatus = sessionStorage.getItem('isAuthenticated') === 'true';
    const userData = sessionStorage.getItem('user');
    
    setIsAuthenticated(authStatus);
    if (authStatus && userData) {
      setUser(JSON.parse(userData));
    } else {
      setUser(null);
    }
  }, [location]);

  const getTabs = () => {
    if (isAuthenticated) {
      return [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Roadmap', path: '/roadmap' }
      ];
    } else {
      return [
        { label: 'Login', path: '/login' }
      ];
    }
  };

  const tabs = getTabs();
  const currentTab = tabs.findIndex(tab => tab.path === location.pathname);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    navigate(tabs[newValue].path);
  };
  
  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setUser(null);
    setAnchorEl(null);
    navigate('/');
  };

  return (
    <AppBar position="static" className="navbar-appbar">
      <Toolbar>
        <Box className="navbar-brand" onClick={() => navigate('/')}>
          <img 
            src="/logo.png" 
            alt="IntelliCampus Logo" 
            className="navbar-logo-image"
            onLoad={() => console.log('Logo loaded successfully')}
            onError={(e) => {
              console.log('Logo failed to load from /logo.png');
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <Typography 
            variant="h6" 
            className="navbar-logo-text"
          >
            IntelliCampus
          </Typography>
        </Box>
        <Tabs
          value={currentTab === -1 ? false : currentTab}
          onChange={handleChange}
          textColor="inherit"
          TabIndicatorProps={{
            style: { display: 'none' }
          }}
          className="navbar-tabs"
        >
          {tabs.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>

        {isAuthenticated && user && (
          <Box className="navbar-profile-container">
            <Box 
              onClick={handleAvatarClick} 
              className="navbar-profile-card"
            >
              <Avatar 
                className="navbar-avatar"
                src={user.image_url}
                alt={user.name}
              >
                {!user.image_url && user.name.charAt(0).toUpperCase()}
              </Avatar>
              <Box className="navbar-profile-text">
                <Typography className="navbar-profile-greeting">
                  Good Day,
                </Typography>
                <Typography className="navbar-profile-name">
                  {user.name}
                </Typography>
              </Box>
            </Box>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              onClick={handleMenuClose}
              PaperProps={{
                elevation: 8,
                className: "navbar-menu"
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem 
                onClick={() => {
                  handleMenuClose();
                  navigate('/profile-settings');
                }}
                className="navbar-menu-item"
              >
                <Settings sx={{ mr: 1, fontSize: '1.2rem' }} />
                <Typography variant="body1">
                  Profile Settings
                </Typography>
              </MenuItem>
              
              <MenuItem 
                onClick={handleLogout}
                className="navbar-logout-item"
              >
                <Logout sx={{ mr: 1, fontSize: '1.2rem' }} />
                <Typography variant="body1">
                  Logout
                </Typography>
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default NavTabs;
