import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Chip,
} from "@mui/material";

import { useNavigate } from "react-router-dom";
import { makeAuthenticatedRequest } from "../utils/api";
import { ROADMAP_ENDPOINTS } from "../constants";

interface Enrollment {
  id?: string;
  roadmap_id: string;
  user_id: string;
  enrolled_at: string;
  total_topics: number;
  // Additional fields we'll fetch
  title?: string;
  status?: string;
  progress_percentage?: number;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  enrollments: Enrollment[];
}

const ManagerDashboard: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();

  const getStatusFromPercentage = (percentage: number): string => {
    if (percentage === 0) return "ready";
    if (percentage === 100) return "completed";
    return "in progress";
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "ready":
        return "default";
      case "completed":
        return "success";
      case "in progress":
        return "primary";
      default:
        return "default";
    }
  };

  const getCardBackground = (status: string) => {
    switch (status.toLowerCase()) {
      case "ready":
        return "linear-gradient(135deg, #696969 0%, #808080 100%)";
      case "completed":
        return "linear-gradient(135deg, #4984a8 0%, #5a9bc4 100%)";
      case "in progress":
        return "linear-gradient(135deg, #a01441 0%, #c02555 100%)";
      default:
        return "linear-gradient(135deg, #9e9e9e 0%, #bdbdbd 100%)";
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch manager's own enrollments
        const enrollmentResponse = await makeAuthenticatedRequest(
          ROADMAP_ENDPOINTS.ENROLLEMENTS,
          { method: "GET" }
        );
        const enrollmentData = await enrollmentResponse.json();

        let enrollmentList: any[] = [];
        if (Array.isArray(enrollmentData)) {
          enrollmentList = enrollmentData;
        } else if (Array.isArray(enrollmentData?.data)) {
          enrollmentList = enrollmentData.data;
        } else {
          setEnrollments([]);
        }

        // Fetch additional details for each enrollment
        const enrichedEnrollments = await Promise.all(
          enrollmentList.map(async (enrollment) => {
            try {
              const roadmapResponse = await makeAuthenticatedRequest(
                ROADMAP_ENDPOINTS.GET_BY_ID(enrollment.roadmap_id),
                { method: "GET" }
              );
              const roadmapData = await roadmapResponse.json();

              return {
                ...enrollment,
                title: roadmapData.title || "Unknown Course",
                status: roadmapData.status || "ready",
                progress_percentage: roadmapData.progress?.progress_percentage || 0,
              };
            } catch (err) {
              console.error(`Failed to fetch details for roadmap ${enrollment.roadmap_id}:`, err);
              return {
                ...enrollment,
                title: "Unknown Course",
                status: "ready",
                progress_percentage: 0,
              };
            }
          })
        );

        setEnrollments(enrichedEnrollments);

        // TODO: Fetch team members data - this would require a new API endpoint
        // For now, we'll use mock data
        setTeamMembers([
          {
            id: "emp1",
            name: "John Doe",
            email: "john.doe@company.com",
            role: "employee",
            enrollments: [
              { 
                id: "1", 
                roadmap_id: "rm1", 
                user_id: "emp1", 
                enrolled_at: "2024-01-01", 
                total_topics: 10,
                title: "React Fundamentals", 
                status: "in progress", 
                progress_percentage: 45 
              },
              { 
                id: "2", 
                roadmap_id: "rm2", 
                user_id: "emp1", 
                enrolled_at: "2024-01-01", 
                total_topics: 8,
                title: "JavaScript Advanced", 
                status: "completed", 
                progress_percentage: 100 
              }
            ]
          },
          {
            id: "emp2",
            name: "Jane Smith",
            email: "jane.smith@company.com",
            role: "employee",
            enrollments: [
              { 
                id: "3", 
                roadmap_id: "rm3", 
                user_id: "emp2", 
                enrolled_at: "2024-01-01", 
                total_topics: 12,
                title: "Python Basics", 
                status: "ready", 
                progress_percentage: 0 
              },
              { 
                id: "4", 
                roadmap_id: "rm4", 
                user_id: "emp2", 
                enrolled_at: "2024-01-01", 
                total_topics: 15,
                title: "Data Structures", 
                status: "in progress", 
                progress_percentage: 75 
              }
            ]
          }
        ]);

      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to fetch data");
        setEnrollments([]);
        setTeamMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const MyEnrollmentsTab = () => (
    <Box>
      {enrollments.length === 0 ? (
        <Typography align="center" color="text.secondary" mt={4}>
          No personal enrollments found.
        </Typography>
      ) : (
        <Box display="flex" flexWrap="wrap" gap={3} justifyContent="center" sx={{ mt: 2 }}>
          {enrollments.map((enrollment) => {
            const calculatedStatus = getStatusFromPercentage(enrollment.progress_percentage || 0);
            return (
              <Box key={enrollment.roadmap_id}>
                <Card
                  sx={{
                    width: 300,
                    height: 160,
                    borderRadius: 3,
                    overflow: "hidden",
                    background: getCardBackground(calculatedStatus),
                    color: "white",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
                    },
                  }}
                  onClick={() => navigate(`/roadmap/${enrollment.roadmap_id}`)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="body2" sx={{ fontSize: "0.75rem", opacity: 0.8, mb: 1 }}>
                      {calculatedStatus}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1rem", mb: 1 }}>
                      {enrollment.title || "Course"}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: "0.7rem", opacity: 0.7 }}>
                      Progress: {enrollment.progress_percentage || 0}%
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

  const TeamOverviewTab = () => (
    <Box>
      {teamMembers.length === 0 ? (
        <Typography align="center" color="text.secondary" mt={4}>
          No team members found.
        </Typography>
      ) : (
        <Box display="flex" flexWrap="wrap" gap={3} sx={{ mt: 2 }}>
          {teamMembers.map((member) => (
            <Box key={member.id} sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' } }}>
              <Card sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {member.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {member.email}
                </Typography>
                
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                  Current Enrollments:
                </Typography>
                
                {member.enrollments.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No active enrollments
                  </Typography>
                ) : (
                  <List dense>
                    {member.enrollments.map((enrollment) => (
                      <ListItem key={enrollment.id} sx={{ px: 0 }}>
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2">{enrollment.title}</Typography>
                              <Chip 
                                label={getStatusFromPercentage(enrollment.progress_percentage)} 
                                size="small" 
                                color={getStatusColor(getStatusFromPercentage(enrollment.progress_percentage))}
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                                <Typography variant="caption">Progress</Typography>
                                <Typography variant="caption">{enrollment.progress_percentage}%</Typography>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={enrollment.progress_percentage} 
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Card>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );

  return (
    <Box p={3}>
      <Card sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: "#333" }}>
            Manager Dashboard
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
                <Tab label="My Learning" />
                <Tab label="Team Overview" />
              </Tabs>

              {tabValue === 0 && <MyEnrollmentsTab />}
              {tabValue === 1 && <TeamOverviewTab />}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ManagerDashboard;
