import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUserRole } from '../utils/api';
import EmployeeDashboard from '../DashBoard/EmployeeDashboard';
import ManagerDashboard from '../DashBoard/ManagerDashboard';
import SuperAdminDashboard from '../DashBoard/SuperAdminDashboard';
import { CircularProgress, Box, Typography } from '@mui/material';

const RoleDashboard: React.FC = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Give a small delay to ensure user data is loaded
    const timer = setTimeout(() => {
      const role = getCurrentUserRole();
      setUserRole(role);
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        height="50vh"
      >
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading your dashboard...
        </Typography>
      </Box>
    );
  }

  // If no role is found, redirect to login
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  // Route to appropriate dashboard based on role
  switch (userRole.toLowerCase()) {
    case 'employee':
      return <EmployeeDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'superadmin':
      return <SuperAdminDashboard />;
    default:
      return (
        <Box 
          display="flex" 
          flexDirection="column"
          justifyContent="center" 
          alignItems="center" 
          height="50vh"
        >
          <Typography variant="h6" color="error">
            Unknown user role: {userRole}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Please contact your administrator.
          </Typography>
        </Box>
      );
  }
};

export default RoleDashboard;
