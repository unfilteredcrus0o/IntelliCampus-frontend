import React from 'react';
import { AppBar, Tabs, Tab, Toolbar, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

const NavTabs: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabPaths = ['/dashboard', '/', '/login', '/signup'];

  const currentTab = tabPaths.indexOf(location.pathname);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    navigate(tabPaths[newValue]);
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          IntelliCampus
        </Typography>
        <Tabs
          value={currentTab === -1 ? false : currentTab}
          onChange={handleChange}
          textColor="inherit"
          indicatorColor="secondary"
        >
          <Tab label="Dashboard" />
          <Tab label="Home" />
          <Tab label="Login" />
          <Tab label="Sign Up" />
        </Tabs>
      </Toolbar>
    </AppBar>
  );
};

export default NavTabs;
