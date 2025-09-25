import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Button,
  Paper,
  LinearProgress,
  Chip,
} from "@mui/material";
import { 
  PlayArrow, 
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { makeAuthenticatedRequest, getCurrentUserRole } from "../utils/api";
import { ROADMAP_ENDPOINTS, ASSIGNMENT_ENDPOINTS } from "../constants";

interface Enrollment {
  roadmap_id: string;
  user_id: string;
  enrolled_at: string;
  total_topics: number;
  // Additional fields we'll fetch
  title?: string;
  course_title?: string;
  status?: string;
  progress_percentage?: number;
  completed_topics?: number;
  is_assigned?: boolean;
  assigned_by?: string;
  assigner_name?: string;
  due_date?: string;
  start_date?: string;
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userRole = getCurrentUserRole();

  const getStatusFromPercentage = (percentage: number, isAssigned: boolean): string => {
    if (isAssigned && percentage === 0) return "assigned";
    if (percentage === 0) return "ready";
    if (percentage === 100) return "completed";
    return "in progress";
  };

  // Helper functions for course categorization based on dates
  const isUpcomingCourse = (course: Enrollment): boolean => {
    if (!course.start_date) return false;
    const today = new Date();
    const startDate = new Date(course.start_date);
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    return startDate > today;
  };

  const isDueToday = (course: Enrollment): boolean => {
    if (!course.due_date || !course.start_date) return false;
    const today = new Date();
    const startDate = new Date(course.start_date);
    const dueDate = new Date(course.due_date);
    
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    // Course must have started, be due today, and not completed
    const hasStarted = startDate <= today;
    const isDueToday = dueDate.getTime() === today.getTime();
    const isNotCompleted = course.status !== "completed" && course.progress_percentage !== 100;
    
    return hasStarted && isDueToday && isNotCompleted;
  };

  const isDueThisWeek = (course: Enrollment): boolean => {
    if (!course.due_date || !course.start_date) return false;
    const today = new Date();
    const startDate = new Date(course.start_date);
    const dueDate = new Date(course.due_date);
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);
    
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    weekEnd.setHours(23, 59, 59, 999);
    
    // Course must have started, be due this week, and not completed
    const hasStarted = startDate <= today;
    const isDueThisWeek = dueDate >= today && dueDate <= weekEnd;
    const isNotCompleted = course.status !== "completed" && course.progress_percentage !== 100;
    
    return hasStarted && isDueThisWeek && isNotCompleted;
  };

  const isCompletedCourse = (course: Enrollment): boolean => {
    return course.status === "completed" || course.progress_percentage === 100;
  };

  // Helper function to get upcoming course start dates for calendar highlighting
  const getUpcomingCourseDates = (month: number, year: number): Set<string> => {
    const courseDates = new Set<string>();
    enrollments
      .filter(isUpcomingCourse)
      .forEach(course => {
        if (course.start_date) {
          const startDate = new Date(course.start_date);
          if (startDate.getMonth() === month && startDate.getFullYear() === year) {
            courseDates.add(startDate.toDateString());
          }
        }
      });
    return courseDates;
  };

  // Helper function to calculate overall average progress based on all topics
  const calculateOverallProgress = (): number => {
    if (enrollments.length === 0) return 0;
    
    // Calculate total topics and total progress across all courses
    let totalTopics = 0;
    let totalCompletedProgress = 0;
    
    enrollments.forEach(course => {
      const courseTopics = course.total_topics || 0;
      const courseProgress = course.progress_percentage || 0;
      
      if (courseTopics > 0) {
        totalTopics += courseTopics;
        // Calculate how many topics worth of progress this course contributes
        totalCompletedProgress += (courseProgress / 100) * courseTopics;
      }
    });
    
    // Debug: Log the calculation details
    console.log('Progress Calculation Details:', {
      totalTopics,
      totalCompletedProgress,
      courses: enrollments.map(e => ({
        title: e.title,
        total_topics: e.total_topics,
        progress_percentage: e.progress_percentage,
        contribution: e.total_topics ? (e.progress_percentage || 0) / 100 * e.total_topics : 0
      }))
    });
    
    // Calculate the overall average based on topic-weighted progress
    const overallProgress = totalTopics > 0 ? (totalCompletedProgress / totalTopics) * 100 : 0;
    const roundedProgress = Math.round(overallProgress);
    
    console.log(`Overall Progress: ${overallProgress}%, Rounded: ${roundedProgress}%`);
    
    return roundedProgress;
  };

  // Helper function to get card background color based on status
  const getCardBackgroundColor = (status: string) => {
    switch (status) {
      case "completed":
        return "rgb(79,140,178)";
      case "in progress":
        return "rgb(184,33,80)";
      case "ready":
        return "rgb(95,95,95)";
      case "assigned":
        return "rgb(95,95,95)"; // Same as ready since assigned is read-only
      default:
        return "rgb(95,95,95)"; // Default neumorphic color
    }
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

  // Calendar navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
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
              title: roadmapData.title || course.course_title || course.title || "Unknown Course",
              status: course.status === 'assigned' ? 'assigned' : (roadmapData.status || "ready"),
              progress_percentage: roadmapData.progress?.progress_percentage || course.progress_percentage || 0,
              total_topics: roadmapData.total_topics || course.total_topics || 0
            };
          } catch (err) {
            console.error(`Failed to fetch details for roadmap ${course.roadmap_id}:`, err);
            return {
              ...course,
              title: course.course_title || course.title || "Unknown Course",
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

  // Ultra smooth horizontal scrolling with momentum
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let scrollVelocity = 0;
    let animationFrameId: number | null = null;
    let lastScrollTime = 0;

    const smoothScrollAnimation = (currentTime: number) => {
      const deltaTime = currentTime - lastScrollTime;
      
      if (deltaTime > 16) { // ~60fps
        // Apply velocity with friction
        if (Math.abs(scrollVelocity) > 0.1) {
          const currentScroll = container.scrollLeft;
          const maxScroll = container.scrollWidth - container.clientWidth;
          
          // Apply velocity with bounds
          const newScroll = Math.max(0, Math.min(maxScroll, currentScroll + scrollVelocity));
          container.scrollLeft = newScroll;
          
          // Apply friction (adjust for desired deceleration)
          scrollVelocity *= 0.92;
          
          lastScrollTime = currentTime;
        } else {
          // Stop animation when velocity is negligible
          scrollVelocity = 0;
          animationFrameId = null;
          return;
        }
      }
      
      // Continue animation
      animationFrameId = requestAnimationFrame(smoothScrollAnimation);
    };

    const handleWheel = (e: WheelEvent) => {
      // Only handle when there's horizontal overflow
      if (container.scrollWidth > container.clientWidth) {
        // Check if this is horizontal scroll input (trackpad/shift+wheel)
        const isHorizontalScroll = Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;
        
        if (isHorizontalScroll) {
          e.preventDefault();
          e.stopPropagation();
          
          // Use horizontal delta or shifted vertical delta
          const wheelDelta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
          const scrollSensitivity = 0.8;
          
          // Add to velocity (allows momentum building)
          scrollVelocity += wheelDelta * scrollSensitivity;
          
          // Cap maximum velocity for control
          const maxVelocity = 25;
          scrollVelocity = Math.max(-maxVelocity, Math.min(maxVelocity, scrollVelocity));
          
          // Start animation if not already running
          if (!animationFrameId) {
            lastScrollTime = performance.now();
            animationFrameId = requestAnimationFrame(smoothScrollAnimation);
          }
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [enrollments]);

  return (
      <Box 
        sx={{
        minHeight: "calc(100vh - 48px)",
        backgroundColor: "rgb(240,240,242)",
        }}
      >
        {/* Dark Section that connects to navbar */}
        <Box 
          sx={{
            backgroundColor: "rgb(240,240,242)", // Dark background like navbar
            pt: 3, // Top padding
            px: 3, // Horizontal padding
            pb: 3, // Bottom padding
            borderRadius: "0 0 30px 30px", // Rounded bottom corners
            mb: 3, // Margin bottom for separation
            boxShadow:`
                      8px 8px 16px rgba(163, 177, 198, 0.6),
                      -8px -8px 16px rgba(255, 255, 255, 0.8)
                    `
          }}
        >
          <Typography
            variant="h1"
            sx={{ 
              fontWeight: 600,
              color: "rgb(44,62,80)", // White text on dark background
              mb: 3,
              fontSize: "1.4rem"
            }}
          >
          Courses
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" mt={6}>
              <CircularProgress sx={{ color: "white" }} />
            </Box>
          ) : error ? (
            <Typography align="center" sx={{ color: "#ff6b6b" }} mt={6}>
              {error}
            </Typography>
          ) : !enrollments || enrollments.length === 0 ? (
            <Typography align="center" sx={{ color: "rgba(255,255,255,0.7)" }} mt={6}>
              No courses or assignments found.
            </Typography>
          ) : enrollments.filter(enrollment => !isUpcomingCourse(enrollment)).length === 0 ? (
            <Typography align="center" sx={{ color: "rgba(255,255,255,0.7)" }} mt={6}>
              No active courses. Check "Upcoming Courses" section for scheduled courses.
            </Typography>
          ) : (
            <>
          {/* Course Cards Scrollable Container */}
                <Box
                  ref={scrollContainerRef}
                  sx={{
                    display: "flex",
                    gap: 3,
                    overflowX: "auto",
                    overflowY: "visible",
                    pb: 2,
                    pt: 1,
                    scrollBehavior: "auto",
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": {
                      display: "none",
                    },
                    WebkitOverflowScrolling: "touch",
                    touchAction: "pan-x",
                  }}
                >
                                {enrollments.filter(enrollment => !isUpcomingCourse(enrollment)).map((enrollment) => {
                const calculatedStatus = enrollment.status === 'assigned' ? 'assigned' : 
                  getStatusFromPercentage(enrollment.progress_percentage || 0, enrollment.is_assigned || false);
                return (
                  <Card
                  key={enrollment.roadmap_id}
                  onClick={() => handleCourseClick(enrollment)}
                    sx={{
                     minWidth: 320,
                     width: 320,
                     height: 180,
                      borderRadius: 3,
                    background: getCardBackgroundColor(calculatedStatus),
                    boxShadow: `
                      8px 8px 16px rgba(163, 177, 198, 0.6),
                      -8px -8px 16px rgba(255, 255, 255, 0.8)
                    `,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    position: "relative",
                      overflow: "hidden",
                    flexShrink: 0,
                      "&:hover": {
                      boxShadow: `
                        12px 12px 24px rgba(163, 177, 198, 0.8),
                        -12px -12px 24px rgba(255, 255, 255, 0.9)
                      `,
                      transform: "translateY(-2px)",
                      },
                    }}
                  >
                  <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", position: "relative" }}>
                     {/* Top Right Shiny White Caret/Arrow */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 16,
                          right: 16,
                         width: 32,
                         height: 32,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                         zIndex: 2,
                           backgroundColor: "rgba(255, 255, 255, 0.2)",
                           borderRadius: "50%",
                           backdropFilter: "blur(8px)",
                           border: "1px solid rgba(255, 255, 255, 0.3)",
                           boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
                           transition: "all 0.3s ease",
                          "&:hover": {
                             backgroundColor: "rgba(255, 255, 255, 0.3)",
                             transform: "scale(1.1)",
                             boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
                           }
                       }}
                     >
                       {enrollingRoadmapId === enrollment.roadmap_id ? (
                         <CircularProgress size={18} sx={{ color: "white" }} />
                       ) : (
                         <PlayArrow sx={{ 
                           color: "white", 
                           fontSize: 20,
                           filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))"
                         }} />
                       )}
                     </Box>

                     {/* Course Title */}
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                         color: (calculatedStatus === "completed" || calculatedStatus === "in progress" || calculatedStatus === "ready" || calculatedStatus === "assigned") ? "white" : "#333",
                         mb: 1.5,
                          fontSize: "1.1rem",
                          lineHeight: 1.3,
                         pr: 4,
                         minHeight: "2.6rem",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                         overflow: "hidden",
                         textOverflow: "ellipsis",
                        }}
                      >
                        {enrollment.title || "Course"}
                      </Typography>
                      
                    {/* Status and Topics Info */}
                    <Box sx={{ mb: 2 }}>
                       <Typography
                         variant="body2"
                         sx={{
                           color: (calculatedStatus === "completed" || calculatedStatus === "in progress" || calculatedStatus === "ready" || calculatedStatus === "assigned") ? "rgba(255,255,255,0.9)" : "#666", 
                           fontSize: "0.85rem",
                           mb: 0.5,
                           display: "flex",
                           alignItems: "center",
                           "&::before": {
                             content: '"•"',
                             marginRight: 1,
                             color: (calculatedStatus === "completed" || calculatedStatus === "in progress" || calculatedStatus === "ready" || calculatedStatus === "assigned") ? "rgba(255,255,255,0.7)" : getStatusColor(calculatedStatus),
                             fontWeight: "bold",
                             fontSize: "0.8rem",
                           }
                         }}
                       >
                         Status: {calculatedStatus === "in progress" ? "In Progress" : calculatedStatus.charAt(0).toUpperCase() + calculatedStatus.slice(1)}
                       </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                           color: (calculatedStatus === "completed" || calculatedStatus === "in progress" || calculatedStatus === "ready" || calculatedStatus === "assigned") ? "rgba(255,255,255,0.9)" : "#666", 
                           fontSize: "0.85rem",
                           display: "flex",
                           alignItems: "center",
                           "&::before": {
                             content: '"•"',
                             marginRight: 1,
                             color: (calculatedStatus === "completed" || calculatedStatus === "in progress" || calculatedStatus === "ready" || calculatedStatus === "assigned") ? "rgba(255,255,255,0.7)" : getStatusColor(calculatedStatus),
                             fontWeight: "bold",
                             fontSize: "0.8rem",
                           }
                         }}
                       >
                        {enrollment.total_topics ? 
                          `${enrollment.total_topics - Math.ceil((enrollment.progress_percentage || 0) * enrollment.total_topics / 100)} topics left` :
                          "24 topics left"
                        }
                      </Typography>
                    </Box>
                      
                     {/* Progress Bar and Percentage on Same Line */}
                     <Box sx={{ mt: "auto", mb: 0.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        {/* Progress Bar */}
                        <Box 
                          sx={{ 
                            width: "70%", 
                            height: 6, 
                            backgroundColor: "rgba(255, 255, 255, 0.2)",
                            borderRadius: 3,
                            overflow: "hidden",
                            position: "relative"
                          }}
                        >
                          <Box 
                            sx={{
                              width: `${enrollment.progress_percentage || 0}%`,
                              height: "100%",
                              backgroundColor: "white",
                              borderRadius: 3,
                              transition: "width 0.3s ease"
                            }}
                          />
                        </Box>
                        
                        {/* Percentage Text */}
                        <Typography
                         variant="h2" 
                         sx={{
                           fontWeight: 700, 
                           color: (calculatedStatus === "completed" || calculatedStatus === "in progress" || calculatedStatus === "ready" || calculatedStatus === "assigned") ? "white" : "#333",
                           fontSize: "1.2rem",
                           lineHeight: 0.9,
                         }}
                       >
                        {enrollment.progress_percentage || 0}%
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
            </>
          )}
        </Box>
        
        {/* Light Background Section for Dashboard and Upcoming */}
        <Box sx={{ p: 3 }}>
          {/* Bottom Section - Left: 4 Grid Dashboard, Right: Upcoming */}
          <Box sx={{ display: "flex", gap: 3, flexWrap: { xs: "wrap", lg: "nowrap" }, mb: 3 }}>
            
            {/* Left Side - 4 Grid Dashboard */}
            <Box sx={{ flex: { xs: "1 1 100%", lg: "2 1 66%" } }}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: "rgb(240,240,242)",
                  boxShadow: `
                    8px 8px 16px rgba(163, 177, 198, 0.6),
                    -8px -8px 16px rgba(255, 255, 255, 0.8)
                  `,
                }}
              >
  

                {/* 4 Grid Dashboard */}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
                
                  {/* 1. My Tasks Due Today */}
                  <Paper
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      background: "rgb(240,240,242)",
                      boxShadow: `
                        8px 8px 16px rgba(163, 177, 198, 0.6),
                        -8px -8px 16px rgba(255, 255, 255, 0.8)
                      `,
                      height: "200px",
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600, color: "#2c3e50", mb: 1, fontSize: "1rem" }}>
                      Due Today ({enrollments.filter(isDueToday).length})
                    </Typography>
                    {/* Separator Line */}
                    <Box sx={{ width: "100%", height: 1, backgroundColor: "rgba(0,0,0,0.1)", mb: 2 }} />
                    
                     <Box sx={{ flex: 1 }}>
                       {enrollments.filter(isDueToday).length === 0 ? (
                         <Box sx={{ 
                           display: "flex", 
                           alignItems: "center", 
                           justifyContent: "center", 
                           height: "200px",
                           flexDirection: "column",
                           gap: 2,
                           backgroundColor: "transparent"
                         }}>
                           <Typography variant="body2" sx={{ color: "#999", fontSize: "0.9rem", textAlign: "center" }}>
                             All clear for today!
                           </Typography>
                         </Box>
                       ) : (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          {enrollments
                            .filter(isDueToday)
                            .slice(0, 3)
                            .map((course, index) => (
                              <Box key={course.roadmap_id} sx={{ display: "flex", alignItems: "center", gap: 2, p: 1, borderRadius: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: "#2c3e50", minWidth: "20px" }}>
                                  {index + 1}.
                                </Typography>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500, color: "#2c3e50", mb: 0.5 }}>
                                    {course.title || `Course ${index + 1}`}
                                  </Typography>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Chip
                                      label={course.status === "in_progress" ? "In progress" : "New"}
                                      size="small"
                                      sx={{
                                        backgroundColor: course.status === "in_progress" ? "#fff3cd" : "#d1ecf1",
                                        color: course.status === "in_progress" ? "#856404" : "#0c5460",
                                        fontSize: "0.7rem",
                                        height: 20
                                      }}
                                    />
                                    <Typography variant="caption" sx={{ color: "#6c757d", fontSize: "0.7rem" }}>
                                      {new Date().toLocaleDateString()}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            ))}
                        </Box>
                      )}
                    </Box>
                  </Paper>

                  {/* 2. My Tasks Due This Week */}
                  <Paper
                          sx={{
                      p: 2,
                      borderRadius: 3,
                      background: "rgb(240,240,242)",
                      boxShadow: `
                        8px 8px 16px rgba(163, 177, 198, 0.6),
                        -8px -8px 16px rgba(255, 255, 255, 0.8)
                      `,
                      height: "200px",
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600, color: "#2c3e50", mb: 1, fontSize: "1rem" }}>
                      Due This Week ({enrollments.filter(isDueThisWeek).length})
                    </Typography>
                    {/* Separator Line */}
                    <Box sx={{ width: "100%", height: 1, backgroundColor: "rgba(0,0,0,0.1)", mb: 2 }} />
                    
                     <Box sx={{ flex: 1 }}>
                       {enrollments.filter(isDueThisWeek).length === 0 ? (
                         <Box sx={{ 
                           display: "flex", 
                           alignItems: "center", 
                           justifyContent: "center", 
                           height: "200px",
                           flexDirection: "column",
                           gap: 2,
                           backgroundColor: "transparent"
                         }}>
                           <Typography variant="caption" sx={{ color: "#ccc", fontSize: "0.8rem", textAlign: "center" }}>
                             No urgent tasks due this week. Perfect time to get ahead!
                           </Typography>
                         </Box>
                       ) : (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          {enrollments
                            .filter(isDueThisWeek)
                            .slice(0, 3)
                            .map((course, index) => (
                              <Box key={course.roadmap_id} sx={{ display: "flex", alignItems: "center", gap: 2, p: 1, borderRadius: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: "#2c3e50", minWidth: "20px" }}>
                                  {index + 1}.
                                </Typography>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500, color: "#2c3e50", mb: 0.5 }}>
                                    {course.title || `Course ${index + 1}`}
                                  </Typography>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Chip
                                      label={course.status === "in_progress" ? "In progress" : "New"}
                                      size="small"
                                      sx={{
                                        backgroundColor: course.status === "in_progress" ? "#fff3cd" : "#d1ecf1",
                                        color: course.status === "in_progress" ? "#856404" : "#0c5460",
                                        fontSize: "0.7rem",
                                        height: 20
                                      }}
                                    />
                                    {(userRole === "manager" || userRole === "superadmin") && (
                                      <Typography variant="caption" sx={{ color: "#6c757d", fontSize: "0.7rem" }}>
                                        {course.due_date ? new Date(course.due_date).toLocaleDateString() : "No due date"}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              </Box>
                            ))}
                        </Box>
                      )}
                    </Box>
                  </Paper>

                  {/* 3. Completed Tasks */}
                  <Paper
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      background: "rgb(240,240,242)",
                      boxShadow: `
                        8px 8px 16px rgba(163, 177, 198, 0.6),
                        -8px -8px 16px rgba(255, 255, 255, 0.8)
                      `,
                      height: "200px",
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600, color: "#2c3e50", mb: 1, fontSize: "1rem" }}>
                      Completed ({enrollments.filter(isCompletedCourse).length})
                    </Typography>
                    {/* Separator Line */}
                    <Box sx={{ width: "100%", height: 1, backgroundColor: "rgba(0,0,0,0.1)", mb: 2 }} />
                    
                     <Box sx={{ flex: 1 }}>
                       {enrollments.filter(isCompletedCourse).length === 0 ? (
                         <Box sx={{ 
                           display: "flex", 
                           alignItems: "center", 
                           justifyContent: "center", 
                           height: "200px",
                           flexDirection: "column",
                           gap: 2,
                           backgroundColor: "transparent"
                         }}>
                           <Typography variant="body2" sx={{ color: "#999", fontSize: "0.9rem", textAlign: "center" }}>
                             Your achievements await!
                           </Typography>
                         </Box>
                       ) : (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          {enrollments
                            .filter(isCompletedCourse)
                            .slice(0, 4)
                            .map((course, index) => (
                              <Box key={course.roadmap_id} sx={{ display: "flex", alignItems: "center", gap: 2, p: 1, borderRadius: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: "#2c3e50", minWidth: "20px" }}>
                                  {index + 1}.
                                </Typography>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500, color: "#2c3e50", mb: 0.5 }}>
                                    {course.title || `Course ${index + 1}`}
                                  </Typography>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Chip
                                      label="Completed"
                                      size="small"
                                      sx={{
                                        backgroundColor: "#d4edda",
                                        color: "#155724",
                                        fontSize: "0.7rem",
                                        height: 20
                                      }}
                                    />
                                    <Typography variant="caption" sx={{ color: "#6c757d", fontSize: "0.7rem" }}>
                                      {new Date().toLocaleDateString()}
                        </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            ))}
                        </Box>
                      )}
                    </Box>
                  </Paper>

                  {/* 4. Progress Overview - Project: All - Statuses */}
                  <Paper
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      background: "rgb(240,240,242)",
                      boxShadow: `
                        8px 8px 16px rgba(163, 177, 198, 0.6),
                        -8px -8px 16px rgba(255, 255, 255, 0.8)
                      `,
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600, color: "#2c3e50", mb: 1, fontSize: "1rem" }}>
                      Average Progress
                    </Typography>
                    {/* Separator Line */}

                    
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "center", backgroundColor: "transparent" }}>
                      {/* Circular Progress Container */}
                      <Box sx={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", mb: 2, backgroundColor: "transparent" }}>
                        {/* Background Circle */}
                        <CircularProgress
                          variant="determinate"
                          value={100}
                          size={80}
                          thickness={6}
                          sx={{
                            color: "#f0f0f0",
                            position: "absolute"
                          }}
                        />
                        {/* Progress Circle */}
                        <CircularProgress
                          variant="determinate"
                          value={calculateOverallProgress()}
                          size={80}
                          thickness={6}
                          sx={{
                            color: "#4a90e2",
                            '& .MuiCircularProgress-circle': {
                              strokeLinecap: 'round',
                            }
                          }}
                        />
                        {/* Center Text */}
                        <Box sx={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center", backgroundColor: "transparent" }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: "#2c3e50", lineHeight: 1, fontSize: "1.3rem" }}>
                            {calculateOverallProgress()}%
                          </Typography>
                        </Box>
                      </Box>

                      {/* Legend */}
                      <Box sx={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 2, backgroundColor: "transparent" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box sx={{ width: 12, height: 12, backgroundColor: "#4a90e2", borderRadius: "50%" }} />
                          <Typography variant="caption" sx={{ color: "#6c757d", fontSize: "0.7rem" }}>
                            New
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box sx={{ width: 12, height: 12, backgroundColor: "#f39c12", borderRadius: "50%" }} />
                          <Typography variant="caption" sx={{ color: "#6c757d", fontSize: "0.7rem" }}>
                            In progress
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box sx={{ width: 12, height: 12, backgroundColor: "#27ae60", borderRadius: "50%" }} />
                          <Typography variant="caption" sx={{ color: "#6c757d", fontSize: "0.7rem" }}>
                            Completed
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box sx={{ width: 12, height: 12, backgroundColor: "#95a5a6", borderRadius: "50%" }} />
                          <Typography variant="caption" sx={{ color: "#6c757d", fontSize: "0.7rem" }}>
                            Cancelled
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>

                </Box>
              </Paper>
            </Box>

            {/* Right Side - Upcoming Courses */}
            <Box sx={{ flex: { xs: "1 1 100%", lg: "1 1 33%" } }}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: "rgb(240,240,242)",
                  boxShadow: `
                    8px 8px 16px rgba(163, 177, 198, 0.6),
                    -8px -8px 16px rgba(255, 255, 255, 0.8)
                  `,
                }}
              >
                {/* Header */}
                <Typography variant="h6" sx={{ fontWeight: 600, color: "#2c3e50", mb: 2, textAlign: "left" }}>
                  Upcoming Courses
                </Typography>
                
                {/* Separator Line */}
                <Box sx={{ width: "100%", height: 1, backgroundColor: "rgba(0,0,0,0.1)", mb: 3 }} />

                {/* Calendar Header with Navigation */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                  <Button 
                    size="small" 
                    sx={{ 
                      minWidth: 32, 
                      width: 32, 
                      height: 32, 
                      borderRadius: 2,
                      backgroundColor: "rgba(0,0,0,0.05)",
                      "&:hover": { backgroundColor: "rgba(0,0,0,0.1)" }
                    }}
                    onClick={goToPreviousMonth}
                  >
                    ‹
                  </Button>
                  
                  <Typography variant="body1" sx={{ fontWeight: 600, color: "#2c3e50" }}>
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </Typography>

                    <Button
                    size="small" 
                    sx={{ 
                      minWidth: 32, 
                      width: 32, 
                      height: 32, 
                      borderRadius: 2,
                      backgroundColor: "rgba(0,0,0,0.05)",
                      "&:hover": { backgroundColor: "rgba(0,0,0,0.1)" }
                    }}
                    onClick={goToNextMonth}
                  >
                    ›
                  </Button>
                </Box>
                
                {/* Calendar Grid - Centered */}
                <Box sx={{ mb: 4, display: "flex", justifyContent: "center" }}>
                  <Box sx={{ width: "100%", maxWidth: 280 }}>
                    {/* Day Headers */}
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, mb: 2 }}>
                      {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
                        <Box key={day} sx={{ textAlign: "center" }}>
                          <Typography 
                            variant="caption" 
                      sx={{
                              fontSize: "0.75rem", 
                        fontWeight: 600,
                              color: "#666",
                              textTransform: "uppercase"
                            }}
                          >
                            {day}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    
                    {/* Dynamic Calendar Days */}
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
                      {(() => {
                        const today = new Date();
                        const currentMonth = currentDate.getMonth();
                        const currentYear = currentDate.getFullYear();
                        const firstDay = new Date(currentYear, currentMonth, 1);
                        const startDate = new Date(firstDay);
                        startDate.setDate(startDate.getDate() - (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1));
                        
                        // Get upcoming course dates for this month
                        const upcomingCourseDates = getUpcomingCourseDates(currentMonth, currentYear);
                        
                        const days = [];
                        for (let i = 0; i < 42; i++) {
                          const currentDateCalc = new Date(startDate);
                          currentDateCalc.setDate(startDate.getDate() + i);
                          const isCurrentMonth = currentDateCalc.getMonth() === currentMonth;
                          const isToday = currentDateCalc.toDateString() === today.toDateString();
                          const hasUpcomingCourse = upcomingCourseDates.has(currentDateCalc.toDateString());
                          
                          days.push(
                            <Box
                              key={i}
                              sx={{
                                width: 32,
                                height: 32,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "50%",
                                backgroundColor: isToday 
                                  ? "#2c3e50" 
                                  : hasUpcomingCourse 
                                    ? "#e3f2fd" 
                                    : "transparent",
                                color: isToday 
                                  ? "white" 
                                  : hasUpcomingCourse 
                                    ? "#1976d2" 
                                    : isCurrentMonth ? "#333" : "#ccc",
                                fontSize: "0.8rem",
                                fontWeight: isToday || hasUpcomingCourse ? 600 : 400,
                                cursor: isCurrentMonth ? "pointer" : "default",
                                transition: "all 0.2s ease",
                                border: hasUpcomingCourse ? "2px solid #1976d2" : "none",
                                "&:hover": isCurrentMonth ? {
                                  backgroundColor: isToday 
                                    ? "#2c3e50" 
                                    : hasUpcomingCourse 
                                      ? "#bbdefb" 
                                      : "rgba(44, 62, 80, 0.1)",
                                  transform: "scale(1.1)",
                                } : {},
                              }}
                            >
                              {currentDateCalc.getDate()}
                            </Box>
                          );
                        }
                        return days;
                      })()}
                    </Box>
                  </Box>
                </Box>

                {/* Separator Line */}
                <Box 
                  sx={{ 
                    width: "100%", 
                    height: 1, 
                    backgroundColor: "rgba(0,0,0,0.1)", 
                    mb: 3 
                  }} 
                />

                {/* Upcoming Courses List */}
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "#2c3e50", mb: 2, fontSize: "1rem" }}>
                    Course Schedule ({enrollments.filter(isUpcomingCourse).length})
                  </Typography>
                  
                  {enrollments.filter(isUpcomingCourse).length === 0 ? (
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "120px" }}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: "#999", 
                            fontSize: "0.9rem",
                            mb: 1
                          }}
                        >
                          No upcoming courses scheduled!
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: "#ccc", 
                            fontSize: "0.8rem",
                            fontStyle: "italic"
                          }}
                        >
                          New course schedules will appear here.
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {enrollments
                        .filter(isUpcomingCourse)
                        .sort((a, b) => {
                          if (!a.start_date || !b.start_date) return 0;
                          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
                        })
                        .map((course, index) => (
                          <Box
                            key={course.roadmap_id}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              backgroundColor: "rgba(227, 242, 253, 0.3)",
                              border: "1px solid #e3f2fd",
                              transition: "all 0.2s ease",
                              "&:hover": {
                                backgroundColor: "rgba(227, 242, 253, 0.5)",
                                transform: "translateY(-1px)",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                              }
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  backgroundColor: "#1976d2",
                                  mt: 1,
                                  flexShrink: 0
                                }}
                              />
                              <Box sx={{ flex: 1 }}>
                                <Typography 
                                  variant="body1" 
                                  sx={{ 
                                    fontWeight: 600, 
                                    color: "#2c3e50", 
                                    mb: 0.5,
                                    fontSize: "0.95rem"
                                  }}
                                >
                                  {course.title || `Course ${index + 1}`}
                                </Typography>
                                
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                  <Chip
                                    label="Upcoming"
                                    size="small"
                                    sx={{
                                      backgroundColor: "#1976d2",
                                      color: "white",
                                      fontSize: "0.7rem",
                                      height: 20,
                                      fontWeight: 500
                                    }}
                                  />
                                  {course.total_topics && (
                                    <Typography variant="caption" sx={{ color: "#666", fontSize: "0.75rem" }}>
                                      {course.total_topics} topics
                                    </Typography>
                                  )}
                                </Box>
                                
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <Typography variant="caption" sx={{ color: "#1976d2", fontSize: "0.75rem", fontWeight: 500 }}>
                                    📅 Starts: {course.start_date ? new Date(course.start_date).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric',
                                      year: 'numeric'
                                    }) : "TBD"}
                                  </Typography>
                                  {course.due_date && (
                                    <Typography variant="caption" sx={{ color: "#666", fontSize: "0.75rem" }}>
                                      • Due: {new Date(course.due_date).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric' 
                                      })}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                        ))}
                    </Box>
                  )}
                </Box>
              </Paper>
            </Box>

          </Box>
        </Box>
    </Box>
  );
};

export default EmployeeDashboard;