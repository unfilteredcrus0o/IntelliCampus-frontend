import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Button,
  Tooltip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { makeAuthenticatedRequest } from "../utils/api";
import { ROADMAP_ENDPOINTS, ASSIGNMENT_ENDPOINTS } from "../constants";

interface Enrollment {
  roadmap_id: string;
  user_id: string;
  enrolled_at: string;
  total_topics: number;
  // Additional fields we'll fetch
  title?: string;
  status?: string;
  progress_percentage?: number;
  is_assigned?: boolean;
  assigned_by?: string;
  assigner_name?: string;
  due_date?: string;
}

interface Assignment {
  assignment_id: string;
  roadmap_id: string;
  roadmap_title: string;
  assigned_by: string;
  assigner_name: string;
  due_date?: string;
  assigned_at: string;
  status: string;
}

const EmployeeDashboard: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollingRoadmapId, setEnrollingRoadmapId] = useState<string | null>(null);
  const navigate = useNavigate();

  const getStatusFromPercentage = (percentage: number, isAssigned: boolean): string => {
    if (isAssigned && percentage === 0) return "assigned";
    if (percentage === 0) return "ready";
    if (percentage === 100) return "completed";
    return "in progress";
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "assigned":
        return "#ff9800"; // Orange for assigned
      case "ready":
        return "darkgrey";
      case "completed":
        return "#4984a8";
      case "in progress":
        return "#a01441";
      default:
        return "#9e9e9e";
    }
  };

  const getCardBackground = (status: string) => {
    switch (status.toLowerCase()) {
      case "assigned":
        return "linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)"; // Orange gradient for assigned
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
      case "assigned":
        return "Start Assigned Course";
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
    // If it's an assigned course that hasn't been started, enroll first
    if (enrollment.status === 'assigned' && enrollment.progress_percentage === 0) {
      setEnrollingRoadmapId(enrollment.roadmap_id);
      try {
        const response = await makeAuthenticatedRequest(
          ROADMAP_ENDPOINTS.ENROLL(enrollment.roadmap_id),
          { method: "POST" }
        );
        
        if (response.ok) {
          const enrollmentResult = await response.json();
          console.log("Successfully enrolled:", enrollmentResult);
          // Refresh the dashboard data to show updated status
          fetchDashboardData();
        } else {
          const errorData = await response.json();
          console.error("Enrollment failed:", errorData);
          setError(errorData.detail || "Failed to enroll in course");
        }
      } catch (err: any) {
        console.error("Error enrolling in course:", err);
        setError(err.message || "Failed to enroll in course");
      } finally {
        setEnrollingRoadmapId(null);
      }
    }
    
    // Navigate to the roadmap
    navigate(`/roadmap/${enrollment.roadmap_id}`);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch both enrollments and assignments in parallel
      const [enrollmentResponse, assignmentResponse] = await Promise.all([
        makeAuthenticatedRequest(ROADMAP_ENDPOINTS.ENROLLEMENTS, { method: "GET" }),
        makeAuthenticatedRequest(ASSIGNMENT_ENDPOINTS.GET_MY_ASSIGNMENTS, { method: "GET" })
      ]);

      const enrollmentData = await enrollmentResponse.json();
      const assignmentData = await assignmentResponse.json();

      let enrollmentList: any[] = [];
      if (Array.isArray(enrollmentData)) {
        enrollmentList = enrollmentData;
      } else if (Array.isArray(enrollmentData?.data)) {
        enrollmentList = enrollmentData.data;
      }

      let assignmentList: Assignment[] = [];
      if (assignmentData?.assignments && Array.isArray(assignmentData.assignments)) {
        assignmentList = assignmentData.assignments;
      }

      // Create a map of enrolled roadmap IDs for quick lookup
      const enrolledRoadmapIds = new Set(enrollmentList.map(e => e.roadmap_id));

      // Merge assignments with enrollments, marking assigned but not enrolled courses
      const combinedCourses = [...enrollmentList];

      // Add assignments that are not yet enrolled
      for (const assignment of assignmentList) {
        if (!enrolledRoadmapIds.has(assignment.roadmap_id)) {
          combinedCourses.push({
            roadmap_id: assignment.roadmap_id,
            user_id: '', // Current user - not needed from assignment
            enrolled_at: assignment.assigned_at,
            total_topics: 0, // Will be fetched below
            is_assigned: true,
            assigned_by: assignment.assigned_by,
            assigner_name: assignment.assigner_name,
            due_date: assignment.due_date,
            title: assignment.roadmap_title,
            status: 'assigned',
            progress_percentage: 0
          });
        } else {
          // Mark existing enrollments as also being assigned
          const existingIndex = combinedCourses.findIndex(e => e.roadmap_id === assignment.roadmap_id);
          if (existingIndex !== -1) {
            combinedCourses[existingIndex].is_assigned = true;
            combinedCourses[existingIndex].assigned_by = assignment.assigned_by;
            combinedCourses[existingIndex].assigner_name = assignment.assigner_name;
            combinedCourses[existingIndex].due_date = assignment.due_date;
          }
        }
      }

      // Fetch additional details for each course
      const enrichedCourses = await Promise.all(
        combinedCourses.map(async (course) => {
          try {
            const roadmapResponse = await makeAuthenticatedRequest(
              ROADMAP_ENDPOINTS.GET_BY_ID(course.roadmap_id),
              { method: "GET" }
            );
            const roadmapData = await roadmapResponse.json();

            return {
              ...course,
              title: roadmapData.title || course.title || "Unknown Course",
              status: course.status === 'assigned' ? 'assigned' : (roadmapData.status || "ready"),
              progress_percentage: roadmapData.progress?.progress_percentage || course.progress_percentage || 0,
              total_topics: roadmapData.total_topics || course.total_topics || 0
            };
          } catch (err) {
            console.error(`Failed to fetch details for roadmap ${course.roadmap_id}:`, err);
            return {
              ...course,
              title: course.title || "Unknown Course",
              status: course.status || "ready",
              progress_percentage: course.progress_percentage || 0,
            };
          }
        })
      );

      setEnrollments(enrichedCourses);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch dashboard data");
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <Box p={3}>
      <Card
        sx={{
          p: 3,
          borderRadius: 0,
          boxShadow: 0,
          position: "relative",
          background: "white",
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            sx={{ 
              position: "absolute",
              top: 16,
              left: 130,
              fontWeight: 500,
              fontSize: "1.1rem",
              color: "#333"
            }}
          >
            Employee Dashboard - Your Learning Progress
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" mt={6}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography align="center" color="error" mt={6}>
              {error}
            </Typography>
          ) : !enrollments || enrollments.length === 0 ? (
            <Typography align="center" color="text.secondary" mt={6}>
              No courses or assignments found. Contact your manager to get assigned to courses.
            </Typography>
          ) : (
            <Grid container spacing={3} justifyContent="center" sx={{ mt: 4 }}>
                                {enrollments.map((enrollment) => {
                const calculatedStatus = enrollment.status === 'assigned' ? 'assigned' : 
                  getStatusFromPercentage(enrollment.progress_percentage || 0, enrollment.is_assigned || false);
                return (
                <Grid key={enrollment.roadmap_id} component="div">
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
                          backgroundColor: getStatusColor(calculatedStatus),
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
                          mb: enrollment.is_assigned ? 0.5 : 0,
                        }}
                      >
                        Progress: {enrollment.progress_percentage || 0}%
                      </Typography>
                      
                      {enrollment.is_assigned && (
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: "0.65rem",
                            opacity: 0.8,
                            fontWeight: 500,
                            fontStyle: "italic",
                          }}
                        >
                          Assigned by: {enrollment.assigner_name}
                          {enrollment.due_date && (
                            <span style={{ display: "block" }}>
                              Due: {new Date(enrollment.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </Typography>
                      )}
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
                          Enrolling...
                        </>
                      ) : (
                        getButtonLabel(calculatedStatus)
                      )}
                    </Button>
                  </Card>
                </Grid>
              );
              })}
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmployeeDashboard;
