import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Chip,
  Button,
  Tooltip,
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
  const [enrollingRoadmapId, setEnrollingRoadmapId] = useState<string | null>(null);
  const navigate = useNavigate();
  const currentUser = sessionStorage.getItem('user') ? JSON.parse(sessionStorage.getItem('user')) : {};  

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

  const getButtonLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "Revisit Course";
      case "in progress":
        return "Resume";
      case "ready":
        return "Start Course";
      default:
        return "Continue";
    }
  };

  const handleCourseClick = async (enrollment: Enrollment) => {
    // Navigate to the roadmap
    navigate(`/roadmap/${enrollment.roadmap_id}`);
  };

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const enrollmentResponse = await makeAuthenticatedRequest(
        ROADMAP_ENDPOINTS.ENROLLEMENTS,
        { method: "GET" }
      );
      
      const allEnrollmentData = await enrollmentResponse.json();
      console.log("All raw enrollment data:", allEnrollmentData);

      const enrollmentsArray = Array.isArray(allEnrollmentData) 
        ? allEnrollmentData 
        : (Array.isArray(allEnrollmentData?.data) ? allEnrollmentData.data : []);

      if (enrollmentsArray.length === 0) {
        setEnrollments([]);
        setTeamMembers([]);
        setLoading(false);
        return; 
      }

      // Group enrollments by user ID
      const userEnrollmentsMap = new Map();
      const uniqueRoadmapIds = new Set<string>();
      
      enrollmentsArray.forEach(enrollment => {
        if (!userEnrollmentsMap.has(enrollment.user_id)) {
          userEnrollmentsMap.set(enrollment.user_id, []);
        }
        userEnrollmentsMap.get(enrollment.user_id).push(enrollment);
        uniqueRoadmapIds.add(enrollment.roadmap_id);
      });

      // Fetch ALL roadmap details in a single Promise.all call for efficiency
      const roadmapDetailsPromises = Array.from(uniqueRoadmapIds).map(id => 
        makeAuthenticatedRequest(ROADMAP_ENDPOINTS.GET_BY_ID(id), { method: "GET" })
          .then(res => res.json())
          .catch(err => {
            console.error(`Failed to fetch roadmap details for ID ${id}:`, err);
            return { id, error: true };
          })
      );

      const allRoadmapDetails = await Promise.all(roadmapDetailsPromises);
      const roadmapDetailsMap = new Map();
      allRoadmapDetails.forEach(details => {
        if (!details.error) {
          roadmapDetailsMap.set(details.id, details);
        }
      });
      console.log("Fetched roadmap details:", roadmapDetailsMap);

      // Enrich enrollments with roadmap details and separate them
      const myEnrichedEnrollments: Enrollment[] = [];
      const teamMembersMap = new Map<string, TeamMember>();

      userEnrollmentsMap.forEach((enrollmentsForUser, userId) => {
        const enrichedEnrollments = enrollmentsForUser.map(enrollment => {
          const roadmapDetails = roadmapDetailsMap.get(enrollment.roadmap_id);
          const progressPercentage = roadmapDetails?.progress?.progress_percentage ?? enrollment.progress_percentage ?? 0;
          
          return {
            ...enrollment,
            title: roadmapDetails?.title || "Unknown Course",
            status: getStatusFromPercentage(progressPercentage),
            progress_percentage: progressPercentage,
          };
        });

        if (userId === currentUser?.id) {
          myEnrichedEnrollments.push(...enrichedEnrollments);
        } else {
          if (!teamMembersMap.has(userId)) {
            teamMembersMap.set(userId, {
              id: userId,
              name: `${userId}`, 
              email: `${userId}@gmail.com`, 
              role: "employee", 
              enrollments: []
            });
          }
          const teamMember = teamMembersMap.get(userId)!;
          teamMember.enrollments.push(...enrichedEnrollments);
        }
      });

      setEnrollments(myEnrichedEnrollments);
      setTeamMembers(Array.from(teamMembersMap.values()));
      console.log(Array.from(teamMembersMap.values()))
      
    } catch (err: unknown) {
      console.error("Dashboard data fetch failed:", err);
      setError("Failed to load dashboard data. Please try again.");
      setEnrollments([]);
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [currentUser?.id]);

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
                    width: 350,
                    height: 200,
                    borderRadius: 3,
                    overflow: "hidden",
                    position: "relative",
                    background: getCardBackground(calculatedStatus),
                    color: "white",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    textAlign: "left",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                    cursor: "pointer",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
                    },
                    "&:hover .continue-btn": {
                      opacity: 1,
                      transform: "translateY(0)",
                    },
                  }}
                >
                  <Tooltip title={enrollment.title || "Course"} placement="top" arrow>
                    <Box
                      sx={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        backgroundColor: getStatusColor(calculatedStatus) === "success" ? "#4caf50" : 
                                       getStatusColor(calculatedStatus) === "primary" ? "#2196f3" : "#9e9e9e",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          transform: "scale(1.2)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                        },
                        "&::before": {
                          content: '""',
                          width: 8,
                          height: 8,
                          backgroundColor: "rgba(255,255,255,0.9)",
                          borderRadius: "50%",
                        },
                      }}
                    />
                  </Tooltip>

                  <Box sx={{ p: 2, pt: 3 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        opacity: 0.8,
                        textTransform: "capitalize",
                        mb: 1,
                      }}
                    >
                      {calculatedStatus}
                    </Typography>
                    
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        fontSize: "1.1rem",
                        lineHeight: 1.3,
                        color: "#fff",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        wordWrap: "break-word",
                        mb: 1,
                      }}
                      title={enrollment.title || "Course"}
                    >
                      {enrollment.title || "Course"}
                    </Typography>
                    
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: "0.7rem",
                        opacity: 0.7,
                        fontWeight: 400,
                      }}
                    >
                      Progress: {enrollment.progress_percentage || 0}%
                    </Typography>
                  </Box>

                  <Button
                    className="continue-btn"
                    variant="contained"
                    disabled={enrollingRoadmapId === enrollment.roadmap_id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCourseClick(enrollment);
                    }}
                    sx={{
                      position: "absolute",
                      bottom: 16,
                      right: 16,
                      borderRadius: "16px",
                      background: "rgba(255,255,255,0.2)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      color: "#fff",
                      fontWeight: 600,
                      textTransform: "none",
                      fontSize: "0.8rem",
                      px: 2.5,
                      py: 0.8,
                      opacity: 0,
                      transform: "translateY(10px)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        background: "rgba(255,255,255,0.3)",
                        transform: "translateY(0) scale(1.05)",
                      },
                    }}
                  >
                    {enrollingRoadmapId === enrollment.roadmap_id ? (
                      <>
                        <CircularProgress size={16} sx={{ mr: 1, color: "inherit" }} />
                        Loading...
                      </>
                    ) : (
                      getButtonLabel(calculatedStatus)
                    )}
                  </Button>
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
