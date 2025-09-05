import React, { useState, useEffect } from 'react';
import { AppBar, Tabs, Tab, Toolbar, Typography, Avatar, Box, Menu, MenuItem, IconButton } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

const NavTabs: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{name: string, email: string} | null>(null);
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
        <Typography 
          variant="h6" 
          className="navbar-logo"
          onClick={() => navigate('/')}
        >
          IntelliCampus
        </Typography>
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
          <Box className="navbar-avatar-container">
            <IconButton 
              onClick={handleAvatarClick} 
              className="navbar-avatar-button"
            >
              <Avatar className="navbar-avatar">
                {user.name.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
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
              <MenuItem onClick={handleMenuClose}>
                <Avatar className="navbar-menu-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="body1" className="navbar-user-text">
                  Hi, {user.name}
                </Typography>
              </MenuItem>
              <MenuItem 
                onClick={handleLogout}
                className="navbar-logout-item"
              >
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
