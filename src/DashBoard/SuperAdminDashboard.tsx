import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  IconButton,
} from "@mui/material";

import { useNavigate } from "react-router-dom";
import { makeAuthenticatedRequest } from "../utils/api";
import { ROADMAP_ENDPOINTS, SUPER_ADMIN } from "../constants";

interface Enrollment {
  id: string;
  title: string;
  status: string;
  progress_percentage: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  manager_id?: string;
  enrollments_count: number;
  avg_progress: number;
}

interface SystemStats {
  total_users: number;
  total_courses: number;
  total_enrollments: number;
  avg_completion_rate: number;
  active_learners: number;
}

const SuperAdminDashboard: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();
  const currentUser = sessionStorage.getItem('user') ? JSON.parse(sessionStorage.getItem('user')) : {};

  const getStatusFromPercentage = (percentage: number): string => {
    if (percentage === 0) return "ready";
    if (percentage === 100) return "completed";
    return "in progress";
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "superadmin":
        return "error";
      case "manager":
        return "warning";
      case "employee":
        return "primary";
      default:
        return "default";
    }
  };

 useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all users and all enrollments concurrently 🚀
        const [usersResponse, enrollmentsResponse] = await Promise.all([
          makeAuthenticatedRequest(SUPER_ADMIN.ALL_EMPLOYEES, { method: "GET" }),
          makeAuthenticatedRequest(ROADMAP_ENDPOINTS.ENROLLEMENTS, { method: "GET" }),
        ]);

        const rawUsers = await usersResponse.json();
        const rawEnrollments = await enrollmentsResponse.json();
        
        const allUsers = Array.isArray(rawUsers) ? rawUsers : (Array.isArray(rawUsers?.data) ? rawUsers.data : []);
        const allEnrollments = Array.isArray(rawEnrollments) ? rawEnrollments : (Array.isArray(rawEnrollments?.data) ? rawEnrollments.data : []);

        // Group enrollments by user ID for easy lookup
        const userEnrollmentsMap = new Map();
        allEnrollments.forEach((enrollment) => {
          if (!userEnrollmentsMap.has(enrollment.user_id)) {
            userEnrollmentsMap.set(enrollment.user_id, []);
          }
          userEnrollmentsMap.get(enrollment.user_id).push(enrollment);
        });

        // Enrich user data with enrollment stats
        const enrichedUsers = allUsers.map((user) => {
          const userEnrollments = userEnrollmentsMap.get(user.id) || [];
          const enrollments_count = userEnrollments.length;
          const totalProgress = userEnrollments.reduce((sum, current) => sum + (current.progress_percentage || 0), 0);
          const avg_progress = enrollments_count > 0 ? totalProgress / enrollments_count : 0;

          return {
            ...user,
            enrollments_count,
            avg_progress,
          };
        });

        setUsers(enrichedUsers);
        setEnrollments(allEnrollments.filter((e) => e.user_id === currentUser?.id));
        
        // Update system stats based on fetched data
        const totalEnrollments = allEnrollments.length;
        const totalUsers = allUsers.length;
        const avgCompletionRate = totalEnrollments > 0 
          ? allEnrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / totalEnrollments
          : 0;
        
        // This is a placeholder as you don't have a total courses API
        const totalCourses = new Set(allEnrollments.map(e => e.roadmap_id)).size;

        setSystemStats({
          total_users: totalUsers,
          total_courses: totalCourses,
          total_enrollments: totalEnrollments,
          avg_completion_rate: avgCompletionRate,
          active_learners: new Set(allEnrollments.map(e => e.user_id)).size,
        });

      } catch (err: any) {
        console.error("Dashboard data fetch failed:", err);
        setError("Failed to load dashboard data. Please try again.");
        setEnrollments([]);
        setUsers([]);
        setSystemStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser?.id]);

  const SystemOverviewTab = () => (
    <Box>
      {systemStats && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <Card sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>

              <Typography variant="h4" sx={{ fontWeight: 600, color: "primary.main" }}>
                {systemStats.total_users}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Users
              </Typography>
            </Card>
          </Box>
          
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <Card sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>

              <Typography variant="h4" sx={{ fontWeight: 600, color: "warning.main" }}>
                {systemStats.total_courses}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Courses
              </Typography>
            </Card>
          </Box>

          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <Card sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>

              <Typography variant="h4" sx={{ fontWeight: 600, color: "success.main" }}>
                {systemStats.total_enrollments}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Enrollments
              </Typography>
            </Card>
          </Box>

          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <Card sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: "info.main" }}>
                {systemStats.avg_completion_rate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Completion
              </Typography>
            </Card>
          </Box>

          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <Card sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: "secondary.main" }}>
                {systemStats.active_learners}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Learners
              </Typography>
            </Card>
          </Box>
        </Box>
      )}
    </Box>
  );

const UserManagementTab = () => (
  <Box>
    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        User Management
      </Typography>
      <Button variant="contained">
        Add New User
      </Button>
    </Box>

    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: "grey.50" }}>
            <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Enrollments</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Avg Progress</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} sx={{ "&:hover": { backgroundColor: "grey.50" } }}>
              <TableCell>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ mr: 2, bgcolor: "primary.light" }}>
                    {user.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {user.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Chip 
                  label={(user.role || 'unknown').toUpperCase()}
                  size="small" 
                  color={getRoleColor(user.role || 'unknown')}
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">{user.enrollments_count} courses</Typography>
              </TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    {user.avg_progress.toFixed(1)}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={user.avg_progress} 
                    sx={{ height: 4, borderRadius: 2 }}
                  />
                </Box>
              </TableCell>
              <TableCell>
                <IconButton size="small" color="primary">
                  ✏️
                </IconButton>
                <IconButton size="small" color="error">
                  🗑️
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
);

  const MyLearningTab = () => (
    <Box>
      {enrollments.length === 0 ? (
        <Typography align="center" color="text.secondary" mt={4}>
          No personal enrollments found.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center', mt: 2 }}>
          {enrollments.map((enrollment) => {
            const calculatedStatus = getStatusFromPercentage(enrollment.progress_percentage);
            return (
              <Box key={enrollment.id} sx={{ flex: '0 0 300px' }}>
                <Card
                  sx={{
                    width: 300,
                    height: 160,
                    borderRadius: 3,
                    overflow: "hidden",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
                    },
                  }}
                  onClick={() => navigate(`/roadmap/${enrollment.id}`)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="body2" sx={{ fontSize: "0.75rem", opacity: 0.8, mb: 1 }}>
                      {calculatedStatus}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1rem", mb: 1 }}>
                      {enrollment.title}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: "0.7rem", opacity: 0.7 }}>
                      Progress: {enrollment.progress_percentage}%
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );

  return (
    <Box p={3}>
      <Card sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: "#333" }}>
            SuperAdmin Dashboard
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" mt={6}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography align="center" color="error" mt={6}>
              {error}
            </Typography>
          ) : (
            <>
              <Tabs 
                value={tabValue} 
                onChange={(_, newValue) => setTabValue(newValue)}
                sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
              >
                <Tab label="System Overview" />
                <Tab label="User Management" />
                <Tab label="My Learning" />
              </Tabs>

              {tabValue === 0 && <SystemOverviewTab />}
              {tabValue === 1 && <UserManagementTab />}
              {tabValue === 2 && <MyLearningTab />}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SuperAdminDashboard;
