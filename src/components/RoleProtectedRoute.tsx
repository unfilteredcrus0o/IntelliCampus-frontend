import React from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUserRole, isAuthenticated } from '../utils/api';
import { Box, Typography } from '@mui/material';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ 
  children, 
  allowedRoles, 
  redirectTo = "/dashboard" 
}) => {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const userRole = getCurrentUserRole();

  // If no role is found, redirect to login
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  // Check if user's role is in the allowed roles
  const hasPermission = allowedRoles.some(role => 
    role.toLowerCase() === userRole.toLowerCase()
  );

  if (!hasPermission) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        height="50vh"
        p={3}
      >
        <Typography variant="h5" color="error" sx={{ mb: 2 }}>
          Access Denied
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary">
          You don't have permission to access this page.
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 1 }}>
          Your role: <strong>{userRole}</strong>
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary">
          Required roles: <strong>{allowedRoles.join(', ')}</strong>
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;
