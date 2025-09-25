import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  LinearProgress,
  Chip,
  Button,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  ExpandMore,
  ExpandLess,
  Person,
  Group,
  TrendingUp,
  Search,
  PlayArrow,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import { makeAuthenticatedRequest, getCurrentUserRole } from "../utils/api";
import { ROADMAP_ENDPOINTS, USER_ENDPOINTS, ASSIGNMENT_ENDPOINTS } from "../constants";

interface Enrollment {
  id?: string;
  roadmap_id: string;
  user_id: string;
  enrolled_at: string;
  total_topics: number;
  completed_topics?: number;
  title?: string;
  course_title?: string;
  status?: string;
  progress_percentage?: number;
  is_assigned?: boolean;
  due_date?: string;
  start_date?: string;
  assigned_to?: string;
  assigned_by?: string;
  assignment_type?: string;
  assigner_name?: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  country?: string;
  image_url?: string;
  enrollments: Enrollment[];
  totalProgress: number;
}

const ManagerDashboard: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [managerCourses, setManagerCourses] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0); // Start with My Courses
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [dueDateFilter, setDueDateFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [enrollingRoadmapId, setEnrollingRoadmapId] = useState<string | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const userRole = getCurrentUserRole();

  // Get unique countries from employees
  const availableCountries = Array.from(
    new Set(employees.map(emp => emp.country).filter(Boolean))
  );

  // Helper functions for manager's course categorization
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

  // Helper function to calculate manager's overall progress
  const calculateManagerProgress = (): number => {
    if (managerCourses.length === 0) return 0;
    
    let totalTopics = 0;
    let totalCompletedProgress = 0;
    
    managerCourses.forEach(course => {
      const courseTopics = course.total_topics || 0;
      const courseProgress = course.progress_percentage || 0;
      
      if (courseTopics > 0) {
        totalTopics += courseTopics;
        totalCompletedProgress += (courseProgress / 100) * courseTopics;
      }
    });
    
    const overallProgress = totalTopics > 0 ? (totalCompletedProgress / totalTopics) * 100 : 0;
    return Math.round(overallProgress);
  };

  // Helper function to get upcoming course dates for calendar highlighting
  const getUpcomingCourseDates = () => {
    return managerCourses
      .filter(isUpcomingCourse)
      .map(course => course.start_date)
      .filter(Boolean)
      .map(dateStr => {
        const date = new Date(dateStr!);
        return date.getDate();
      });
  };

  // Filter employees based on selected filters (memoized to prevent unnecessary re-renders)
  const filteredEmployees = React.useMemo(() => {
    return employees.filter(employee => {
      let matchesCountry = true;
      let matchesDueDate = true;
      let matchesSearch = true;

      if (countryFilter) {
        matchesCountry = employee.country === countryFilter;
      }

      if (dueDateFilter === "this_week") {
        const today = new Date();
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() + 7);
        
        matchesDueDate = employee.enrollments.some(enrollment => {
          if (!enrollment.due_date) return false;
          const dueDate = new Date(enrollment.due_date);
          return dueDate >= today && dueDate <= weekEnd;
        });
      }

      if (searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase();
        matchesSearch = 
          employee.name.toLowerCase().includes(searchLower) ||
          employee.email.toLowerCase().includes(searchLower);
      }

      return matchesCountry && matchesDueDate && matchesSearch;
    });
  }, [employees, countryFilter, dueDateFilter, searchQuery]);

  const totalEmployees = employees.length;
  const employeesWithDueDatesThisWeek = employees.filter(employee => {
    const today = new Date();
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);
    
    return employee.enrollments.some(enrollment => {
      if (!enrollment.due_date) return false;
      const dueDate = new Date(enrollment.due_date);
      return dueDate >= today && dueDate <= weekEnd;
    });
  }).length;

useEffect(() => {
    const fetchEmployeesData = async () => {
    setLoading(true);
    setError(null);
    try {
        // Fetch employees under this manager
        const employeesResponse = await makeAuthenticatedRequest(
          USER_ENDPOINTS.GET_EMPLOYEES,
        { method: "GET" }
      );
      
        if (!employeesResponse.ok) {
          throw new Error("Failed to fetch employees");
        }

        const employeesData = await employeesResponse.json();

        // Fetch assignments for all employees
        const assignmentsResponse = await makeAuthenticatedRequest(
          ASSIGNMENT_ENDPOINTS.GET_MY_ASSIGNMENTS,
          { method: "GET" }
        );

        let assignmentsData = [];
        if (assignmentsResponse.ok) {
          assignmentsData = await assignmentsResponse.json();
        }

        // Fetch enrollments for all employees
        const enrollmentsResponse = await makeAuthenticatedRequest(
          ROADMAP_ENDPOINTS.ENROLLEMENTS,
          { method: "GET" }
        );

        let enrollmentsData = [];
        if (enrollmentsResponse.ok) {
          enrollmentsData = await enrollmentsResponse.json();
        }

        // Get current user ID (manager)
        const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
        const managerId = currentUser.id;

        // Separate manager's own courses and team member courses
        const allEnrollments = Array.isArray(enrollmentsData) ? enrollmentsData : [];
        
        // Manager's own courses (includes self-created and courses assigned to manager by superadmin)
        const managerOwnCourses = allEnrollments
          .filter((enrollment: any) => {
            // Must be the manager's enrollment
            if (enrollment.user_id !== managerId) return false;
            
            // Include courses assigned to the manager (by superadmin) OR self-created courses
            const isAssignedToManager = enrollment.assigned_to === managerId;
            const isSelfCreatedNotAssigned = (!enrollment.assigned_to || enrollment.assigned_to === null) &&
              !allEnrollments.some((otherEnrollment: any) => 
                otherEnrollment.roadmap_id === enrollment.roadmap_id &&
                otherEnrollment.user_id !== managerId &&
                otherEnrollment.assigned_to && 
                otherEnrollment.assigned_to !== null
              );
            
            return isAssignedToManager || isSelfCreatedNotAssigned;
          })
          .map((enrollment: any) => ({
            ...enrollment,
            title: enrollment.course_title || enrollment.title || "Unknown Course",
          }));

        setManagerCourses(managerOwnCourses);

        // Process team member data (only courses assigned to others)
        const processedEmployees: Employee[] = employeesData.map((emp: any) => {
          // Get enrollments for this employee (only courses assigned to them)
          const userEnrollments = allEnrollments.filter((enrollment: any) => 
            enrollment.user_id === emp.id && 
            enrollment.assigned_to && 
            enrollment.assigned_to !== null
          );

          // Get assignments for this employee
          const userAssignments = Array.isArray(assignmentsData)
            ? assignmentsData.filter((assignment: any) => 
                userEnrollments.some((enrollment: any) => enrollment.roadmap_id === assignment.roadmap_id)
              )
            : [];

          // Enrich enrollments with assignment data
          const enrichedEnrollments = userEnrollments.map((enrollment: any) => {
            const assignment = userAssignments.find((assign: any) => 
              assign.roadmap_id === enrollment.roadmap_id
            );
          
          return {
            ...enrollment,
              title: enrollment.course_title || enrollment.title || "Unknown Course",
              is_assigned: !!assignment,
              due_date: assignment?.due_date,
              assigner_name: assignment?.assigner_name,
          };
        });

          // Calculate total progress
          const totalProgress = enrichedEnrollments.length > 0
            ? enrichedEnrollments.reduce((sum: number, enrollment: any) => 
                sum + (enrollment.progress_percentage || 0), 0) / enrichedEnrollments.length
            : 0;

          return {
            id: emp.id,
            name: emp.name,
            email: emp.email,
            role: emp.role || "employee",
            country: emp.country || "Unknown",
            image_url: emp.image_url,
            enrollments: enrichedEnrollments,
            totalProgress: Math.round(totalProgress),
          };
        });

        setEmployees(processedEmployees);
      
    } catch (err: unknown) {
        // Handle fetch errors gracefully
      setError("Failed to load dashboard data. Please try again.");
        setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

    fetchEmployeesData();
  }, []);


  // Statistics Cards Component
  const StatisticsCards = () => (
    <Box sx={{ display: "flex", gap: 3, mb: 4, flexWrap: "wrap" }}>
      <Card sx={{ 
        p: 3, 
        bgcolor: "white", 
        border: "1px solid #e0e0e0", 
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)", 
        flex: 1, 
        minWidth: 250,
        borderRadius: 3,
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          transform: "translateY(-2px)"
        }
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: "#f8f9fa", color: "#333", width: 56, height: 56, borderRadius: 2 }}>
            <Group fontSize="large" />
          </Avatar>
    <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5, color: "#1a1a1a", fontSize: "2.5rem" }}>
              {totalEmployees}
            </Typography>
            <Typography variant="body1" sx={{ color: "#666", fontWeight: 500 }}>
              Total Employees
            </Typography>
          </Box>
        </Box>
      </Card>
      
      <Card sx={{ 
        p: 3, 
        bgcolor: "white", 
        border: "1px solid #e0e0e0", 
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)", 
        flex: 1, 
        minWidth: 250,
        borderRadius: 3,
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          transform: "translateY(-2px)"
        }
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: "#f8f9fa", color: "#333", width: 56, height: 56, borderRadius: 2 }}>
            <TrendingUp fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5, color: "#1a1a1a", fontSize: "2.5rem" }}>
              {employeesWithDueDatesThisWeek}
            </Typography>
            <Typography variant="body1" sx={{ color: "#666", fontWeight: 500 }}>
              Due This Week
            </Typography>
          </Box>
        </Box>
      </Card>

      <Card sx={{ 
        p: 3, 
        bgcolor: "white", 
        border: "1px solid #e0e0e0", 
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)", 
        flex: 1, 
        minWidth: 250,
        borderRadius: 3,
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          transform: "translateY(-2px)"
        }
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: "#f8f9fa", color: "#333", width: 56, height: 56, borderRadius: 2 }}>
            <Person fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5, color: "#1a1a1a", fontSize: "2.5rem" }}>
              {filteredEmployees.length}
            </Typography>
            <Typography variant="body1" sx={{ color: "#666", fontWeight: 500 }}>
              Active Now
            </Typography>
          </Box>
        </Box>
      </Card>
    </Box>
  );

  const toggleRowExpansion = (employeeId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(employeeId)) {
      newExpanded.delete(employeeId);
        } else {
      newExpanded.add(employeeId);
    }
    setExpandedRows(newExpanded);
  };

  // Simple search handler without complex memoization
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Ensure focus is maintained
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 0);
  };

  const getStatusFromPercentage = (percentage: number, isAssigned: boolean): string => {
    if (isAssigned && percentage === 0) return "assigned";
    if (percentage === 0) return "ready";
    if (percentage === 100) return "completed";
    return "in progress";
  };

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

  const handleCourseClick = async (course: Enrollment) => {
    // Navigate directly without any alerts or confirmations
    // If it's an assigned course that hasn't been started, enroll first
    if (course.status === 'assigned' && course.progress_percentage === 0) {
      setEnrollingRoadmapId(course.roadmap_id);
      try {
        const response = await makeAuthenticatedRequest(
          ROADMAP_ENDPOINTS.ENROLL(course.roadmap_id),
          { method: "POST" }
        );
        
        if (response.ok) {
          const enrollmentResult = await response.json();
          // Refresh the manager courses data
          const updatedCourse = { ...course, status: 'in_progress', progress_percentage: 1 };
          setManagerCourses(prev => prev.map(c => c.roadmap_id === course.roadmap_id ? updatedCourse : c));
        } else {
          const errorData = await response.json();
          setError(errorData.detail || "Failed to enroll in course");
        }
      } catch (err: any) {
        setError(err.message || "Failed to enroll in course");
      } finally {
        setEnrollingRoadmapId(null);
      }
    }
    
    // Navigate to the roadmap directly
    navigate(`/roadmap/${course.roadmap_id}`);
  };

  // Header Controls Component - Simplified approach
  const HeaderControls = (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#1a1a1a", fontSize: "1.25rem" }}>
          Employees ({filteredEmployees.length})
        </Typography>
      </Box>
      
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: "flex-start" }}>
        <TextField
          inputRef={searchInputRef}
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={handleSearchChange}
          size="small"
          sx={{ 
            minWidth: 300,
            bgcolor: "white",
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              "&:hover fieldset": {
                borderColor: "#333",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#333",
              },
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "#666" }} />
              </InputAdornment>
            ),
          }}
        />
        
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>Country</InputLabel>
          <Select
            value={countryFilter}
            label="Country"
            onChange={(e) => setCountryFilter(e.target.value)}
            sx={{
              bgcolor: "white",
              borderRadius: 2,
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#333",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#333",
              },
            }}
          >
            <MenuItem value="">All Countries</MenuItem>
            {availableCountries.map((country) => (
              <MenuItem key={country} value={country}>
                {country}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>Due Date</InputLabel>
          <Select
            value={dueDateFilter}
            label="Due Date"
            onChange={(e) => setDueDateFilter(e.target.value)}
            sx={{
              bgcolor: "white",
              borderRadius: 2,
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#333",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#333",
              },
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="this_week">Due This Week</MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </Box>
  );

  // My Courses Tab Component
  const MyCoursesTab = () => {
    return (
      <Box 
        sx={{
          minHeight: "calc(100vh - 48px)",
          backgroundColor: "rgb(240,240,242)",
        }}
      >
        {/* Dark Section that connects to navbar - Course Cards */}
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

          {managerCourses.length === 0 ? (
            <Typography align="center" sx={{ color: "rgba(255,255,255,0.7)" }} mt={6}>
              No courses found.
            </Typography>
          ) : managerCourses.filter(course => !isUpcomingCourse(course)).length === 0 ? (
            <Typography align="center" sx={{ color: "rgba(255,255,255,0.7)" }} mt={6}>
              No active courses. Check "Upcoming Courses" section for scheduled courses.
        </Typography>
      ) : (
            <>
              {/* Course Cards Scrollable Container */}
              <Box
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
                {managerCourses.filter(course => !isUpcomingCourse(course)).map((course) => {
                  const calculatedStatus = getStatusFromPercentage(course.progress_percentage || 0, course.status === 'assigned');
            return (
                <Card
                      key={course.roadmap_id}
                      onClick={() => handleCourseClick(course)}
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
                          onClick={(e: React.MouseEvent) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCourseClick(course);
                          }}
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
                          {enrollingRoadmapId === course.roadmap_id ? (
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
                          {course.title || "Course"}
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
                            {course.total_topics ? 
                              `${course.total_topics - Math.ceil((course.progress_percentage || 0) * course.total_topics / 100)} topics left` :
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
                                width: `${course.progress_percentage || 0}%`,
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
                            {course.progress_percentage || 0}%
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
            <Card sx={{
              p: 2,
              borderRadius: 3,
              background: "rgb(240,240,242)",
              boxShadow: `8px 8px 16px rgba(163, 177, 198, 0.6), -8px -8px 16px rgba(255, 255, 255, 0.8)`,
              height: "200px",
              display: "flex",
              flexDirection: "column"
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "#2c3e50", mb: 1, fontSize: "1rem" }}>
                Due Today ({managerCourses.filter(isDueToday).length})
              </Typography>
              <Box sx={{ width: "100%", height: 1, backgroundColor: "rgba(0,0,0,0.1)", mb: 2 }} />
              
              <Box sx={{ flex: 1 }}>
                {managerCourses.filter(isDueToday).length === 0 ? (
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column" }}>
                    <Typography variant="body2" sx={{ color: "#999", fontSize: "0.9rem", textAlign: "center" }}>
                      All clear for today!
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {managerCourses.filter(isDueToday).slice(0, 3).map((course, index) => (
                      <Box key={course.roadmap_id} sx={{ display: "flex", alignItems: "center", gap: 2, p: 1, borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: "#2c3e50", minWidth: "20px" }}>
                          {index + 1}.
                        </Typography>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: "#2c3e50", mb: 0.5 }}>
                            {course.title}
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Chip label={course.status === "in_progress" ? "In progress" : "New"} size="small"
                              sx={{ backgroundColor: course.status === "in_progress" ? "#fff3cd" : "#d1ecf1",
                                    color: course.status === "in_progress" ? "#856404" : "#0c5460", fontSize: "0.7rem", height: 20 }} />
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
                </Card>

            {/* 2. My Tasks Due This Week */}
            <Card sx={{
              p: 2,
              borderRadius: 3,
              background: "rgb(240,240,242)",
              boxShadow: `8px 8px 16px rgba(163, 177, 198, 0.6), -8px -8px 16px rgba(255, 255, 255, 0.8)`,
              height: "200px",
              display: "flex",
              flexDirection: "column"
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "#2c3e50", mb: 1, fontSize: "1rem" }}>
                Due This Week ({managerCourses.filter(isDueThisWeek).length})
              </Typography>
              <Box sx={{ width: "100%", height: 1, backgroundColor: "rgba(0,0,0,0.1)", mb: 2 }} />
              
              <Box sx={{ flex: 1 }}>
                {managerCourses.filter(isDueThisWeek).length === 0 ? (
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column" }}>
                    <Typography variant="caption" sx={{ color: "#ccc", fontSize: "0.8rem", textAlign: "center" }}>
                      No urgent tasks due this week. Perfect time to get ahead!
                    </Typography>
              </Box>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {managerCourses.filter(isDueThisWeek).slice(0, 3).map((course, index) => (
                      <Box key={course.roadmap_id} sx={{ display: "flex", alignItems: "center", gap: 2, p: 1, borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: "#2c3e50", minWidth: "20px" }}>
                          {index + 1}.
                        </Typography>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: "#2c3e50", mb: 0.5 }}>
                            {course.title}
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Chip label={course.status === "in_progress" ? "In progress" : "New"} size="small"
                              sx={{ backgroundColor: course.status === "in_progress" ? "#fff3cd" : "#d1ecf1",
                                    color: course.status === "in_progress" ? "#856404" : "#0c5460", fontSize: "0.7rem", height: 20 }} />
                            {course.due_date && (
                              <Typography variant="caption" sx={{ color: "#6c757d", fontSize: "0.7rem" }}>
                                {new Date(course.due_date).toLocaleDateString()}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Card>

            {/* 3. Completed Tasks */}
            <Card sx={{
              p: 2,
              borderRadius: 3,
              background: "rgb(240,240,242)",
              boxShadow: `8px 8px 16px rgba(163, 177, 198, 0.6), -8px -8px 16px rgba(255, 255, 255, 0.8)`,
              height: "200px",
              display: "flex",
              flexDirection: "column"
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "#2c3e50", mb: 1, fontSize: "1rem" }}>
                Completed ({managerCourses.filter(isCompletedCourse).length})
              </Typography>
              <Box sx={{ width: "100%", height: 1, backgroundColor: "rgba(0,0,0,0.1)", mb: 2 }} />
              
              <Box sx={{ flex: 1 }}>
                {managerCourses.filter(isCompletedCourse).length === 0 ? (
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column" }}>
                    <Typography variant="body2" sx={{ color: "#999", fontSize: "0.9rem", textAlign: "center" }}>
                      Your achievements await!
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {managerCourses.filter(isCompletedCourse).slice(0, 4).map((course, index) => (
                      <Box key={course.roadmap_id} sx={{ display: "flex", alignItems: "center", gap: 2, p: 1, borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: "#2c3e50", minWidth: "20px" }}>
                          {index + 1}.
                        </Typography>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: "#2c3e50", mb: 0.5 }}>
                            {course.title}
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Chip label="Completed" size="small"
                              sx={{ backgroundColor: "#d4edda", color: "#155724", fontSize: "0.7rem", height: 20 }} />
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Card>

            {/* 4. Average Progress */}
            <Card sx={{
              p: 2,
              borderRadius: 3,
              background: "rgb(240,240,242)",
              boxShadow: `8px 8px 16px rgba(163, 177, 198, 0.6), -8px -8px 16px rgba(255, 255, 255, 0.8)`,
              display: "flex",
              flexDirection: "column"
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "#2c3e50", mb: 1, fontSize: "1rem" }}>
                Average Progress
              </Typography>
              
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "center", backgroundColor: "transparent" }}>
                <Box sx={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", mb: 2, backgroundColor: "transparent" }}>
                  <CircularProgress variant="determinate" value={100} size={80} thickness={6}
                    sx={{ color: "#f0f0f0", position: "absolute" }} />
                  <CircularProgress variant="determinate" value={calculateManagerProgress()} size={80} thickness={6}
                    sx={{ color: "#4a90e2", '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }} />
                  <Box sx={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center", backgroundColor: "transparent" }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "#2c3e50", lineHeight: 1, fontSize: "1.3rem" }}>
                      {calculateManagerProgress()}%
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 2, backgroundColor: "transparent" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, backgroundColor: "#4a90e2", borderRadius: "50%" }} />
                    <Typography variant="caption" sx={{ color: "#6c757d", fontSize: "0.7rem" }}>New</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, backgroundColor: "#f39c12", borderRadius: "50%" }} />
                    <Typography variant="caption" sx={{ color: "#6c757d", fontSize: "0.7rem" }}>In progress</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, backgroundColor: "#27ae60", borderRadius: "50%" }} />
                    <Typography variant="caption" sx={{ color: "#6c757d", fontSize: "0.7rem" }}>Completed</Typography>
                  </Box>
                </Box>
              </Box>
            </Card>

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
                    onClick={() => {
                      const prevMonth = new Date(currentDate);
                      prevMonth.setMonth(prevMonth.getMonth() - 1);
                      setCurrentDate(prevMonth);
                    }}
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
                    onClick={() => {
                      const nextMonth = new Date(currentDate);
                      nextMonth.setMonth(nextMonth.getMonth() + 1);
                      setCurrentDate(nextMonth);
                    }}
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
                        const upcomingCourseDates = new Set(
                          managerCourses
                            .filter(course => {
                              if (!course.start_date) return false;
                              const courseDate = new Date(course.start_date);
                              return courseDate.getMonth() === currentMonth && 
                                     courseDate.getFullYear() === currentYear &&
                                     isUpcomingCourse(course);
                            })
                            .map(course => new Date(course.start_date!).toDateString())
                        );
                        
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
                                width: 36,
                                height: 36,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: 1,
                                cursor: "pointer",
                                fontSize: "0.85rem",
                                fontWeight: isToday ? 700 : hasUpcomingCourse ? 600 : 400,
                                color: !isCurrentMonth ? "#ddd" : isToday ? "white" : hasUpcomingCourse ? "white" : "#333",
                                backgroundColor: isToday ? "#333" : hasUpcomingCourse ? "#1976d2" : "transparent",
                                border: hasUpcomingCourse && !isToday ? "2px solid #1976d2" : "none",
                                "&:hover": {
                                  backgroundColor: !isCurrentMonth ? "transparent" : isToday ? "#333" : hasUpcomingCourse ? "#1565c0" : "rgba(0,0,0,0.05)"
                                }
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
                    Course Schedule ({managerCourses.filter(isUpcomingCourse).length})
                  </Typography>
                  
                  {managerCourses.filter(isUpcomingCourse).length === 0 ? (
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
                      {managerCourses
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
                              border: "1px solid #e3f2fd",
                              backgroundColor: "rgba(227, 242, 253, 0.3)",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                              transition: "all 0.2s ease",
                              "&:hover": {
                                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                                transform: "translateY(-1px)"
                              }
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                              <Box sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                backgroundColor: "#1976d2",
                                mt: 1,
                                flexShrink: 0
                              }} />
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: "#1a1a1a", mb: 0.5 }}>
                                  {course.title}
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                  <Chip 
                                    label="Upcoming" 
                                    size="small" 
                                    sx={{ 
                                      backgroundColor: "#1976d2", 
                                      color: "white", 
                                      fontSize: "0.6rem", 
                                      height: 16,
                                      fontWeight: 500,
                                      "& .MuiChip-label": { px: 1 }
                                    }} 
                                  />
                                  <Typography variant="caption" sx={{ color: "#666" }}>
                                    {course.total_topics} topics
                                  </Typography>
                                </Box>
                                <Typography variant="caption" sx={{ color: "#1976d2", fontSize: "0.7rem", fontWeight: 500 }}>
                                  📅 Starts: {course.start_date ? new Date(course.start_date).toLocaleDateString('en-US', { 
                                    month: 'short', day: 'numeric' 
                                  }) : "TBD"}
                                </Typography>
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

  // Team Progress Tab Component
  const TeamProgressTab = () => (
    <Box>
      <StatisticsCards />
      {HeaderControls}
      
      {filteredEmployees.length === 0 ? (
        <Typography align="center" color="text.secondary" mt={4}>
          No employees found with the selected filters.
        </Typography>
      ) : (
        <TableContainer 
          component={Paper} 
          sx={{ 
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)", 
            border: "1px solid #e0e0e0",
            borderRadius: 3,
            overflow: "hidden"
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8f9fa" }}>
                <TableCell sx={{ fontWeight: 600, color: "#1a1a1a", py: 2 }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#1a1a1a", py: 2 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#1a1a1a", py: 2 }}>Progress</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#1a1a1a", py: 2 }}>Courses</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#1a1a1a", py: 2 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <React.Fragment key={employee.id}>
                  <TableRow 
                    sx={{ 
                      "&:hover": { bgcolor: "#f5f5f5" },
                      borderBottom: "1px solid #e0e0e0"
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                         <Avatar 
                           src={employee.image_url}
                           alt={employee.name}
                      sx={{
                             width: 40, 
                             height: 40, 
                             bgcolor: "#f5f5f5", 
                             color: "#333",
                             fontSize: "0.9rem"
                           }}
                         >
                           {!employee.image_url && employee.name.charAt(0).toUpperCase()}
                         </Avatar>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: "#333" }}>
                            {employee.name}
                </Typography>
                          <Typography variant="body2" sx={{ color: "#666" }}>
                            {employee.email}
                </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={employee.enrollments.length > 0 ? "Active" : "Inactive"}
                        size="small"
                        sx={{
                          bgcolor: employee.enrollments.length > 0 ? "#e8f5e8" : "#f5f5f5",
                          color: employee.enrollments.length > 0 ? "#2e7d32" : "#666",
                          fontWeight: 500
                        }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 120 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={employee.totalProgress}
                      sx={{
                            flex: 1, 
                            height: 6, 
                            borderRadius: 3,
                            bgcolor: "#f0f0f0",
                            "& .MuiLinearProgress-bar": {
                              bgcolor: "#333"
                            }
                          }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "#333", minWidth: "40px" }}>
                          {employee.totalProgress}%
                </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {employee.enrollments.slice(0, 3).map((_, index) => (
                          <Avatar
                            key={index}
                      sx={{
                              width: 24, 
                              height: 24, 
                              bgcolor: "#f0f0f0", 
                              color: "#666",
                              fontSize: "0.7rem"
                            }}
                          >
                            {index + 1}
                          </Avatar>
                        ))}
                        {employee.enrollments.length > 3 && (
                          <Typography variant="body2" sx={{ color: "#666", ml: 1 }}>
                            +{employee.enrollments.length - 3}
                    </Typography>
                        )}
                  </Box>
                    </TableCell>
                    
                    <TableCell>
                      <IconButton 
                        onClick={() => toggleRowExpansion(employee.id)}
                        sx={{ color: "#666" }}
                      >
                        {expandedRows.has(employee.id) ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell colSpan={6} sx={{ p: 0, border: "none" }}>
                      <Collapse in={expandedRows.has(employee.id)} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 3, bgcolor: "#fafafa", borderTop: "1px solid #e0e0e0" }}>
                          {employee.enrollments.length === 0 ? (
                            <Typography color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                              No active courses
                  </Typography>
                ) : (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                              {employee.enrollments.map((enrollment) => {
                                const status = getStatusFromPercentage(
                                  enrollment.progress_percentage || 0,
                                  enrollment.is_assigned || false
                                );
                                
                                return (
                                  <Box key={enrollment.roadmap_id} sx={{ flex: "1 1 calc(50% - 8px)", minWidth: 300 }}>
                                     <Card 
                                       variant="outlined" 
                    sx={{
                                         p: 2.5, 
                                         bgcolor: "white",
                                         border: "1px solid #e0e0e0",
                                         boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                         borderRadius: 2,
                                         transition: "all 0.2s ease",
                      "&:hover": {
                                           boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                           transform: "translateY(-1px)"
                                         }
                                       }}
                                     >
                                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1, color: "#333" }}>
                                          {enrollment.title || "Unknown Course"}
                    </Typography>
                              <Chip 
                                          label={status}
                                size="small" 
                                          sx={{
                                            bgcolor: status === "completed" ? "#e8f5e8" : 
                                                   status === "in progress" ? "#e3f2fd" : 
                                                   status === "assigned" ? "#fff3e0" : "#f5f5f5",
                                            color: status === "completed" ? "#2e7d32" : 
                                                  status === "in progress" ? "#1976d2" : 
                                                  status === "assigned" ? "#f57c00" : "#666",
                                            fontWeight: 500
                                          }}
                              />
                            </Box>

                                      <Box sx={{ mb: 2 }}>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                          <Typography variant="caption" sx={{ color: "#666" }}>
                                            Progress
                                          </Typography>
                                          <Typography variant="caption" sx={{ fontWeight: 600, color: "#333" }}>
                                            {enrollment.progress_percentage || 0}%
                                          </Typography>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                          value={enrollment.progress_percentage || 0}
                    sx={{
                                            height: 4, 
                                            borderRadius: 2,
                                            bgcolor: "#f0f0f0",
                                            "& .MuiLinearProgress-bar": {
                                              bgcolor: "#333"
                                            }
                                          }}
                                        />
                                      </Box>

                                      {enrollment.is_assigned && enrollment.due_date && (
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                                          <Typography variant="caption" sx={{ color: "#666" }}>
                                            Due: {new Date(enrollment.due_date).toLocaleDateString()}
                                          </Typography>
                                        </Box>
                                      )}

                                      <Box sx={{ mt: 1 }}>
                                        <Typography variant="caption" sx={{ color: "#666" }}>
                                          Topics: {enrollment.completed_topics || 0} / {enrollment.total_topics || 0}
                                        </Typography>
                                      </Box>
              </Card>
            </Box>
            );
          })}
        </Box>
      )}
    </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );

  return (
    <Box p={3}>
      <Card sx={{ p: 3, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
        <CardContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Typography variant="h4" sx={{ fontWeight: 600, color: "#1a1a1a", mb: 3 }}>
                Manager Dashboard
              </Typography>
              
              <Tabs 
                value={tabValue} 
                onChange={(event, newValue) => {
                  setTabValue(newValue);
                }}
                sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
              >
                <Tab label="My Courses" />
                <Tab label="Team Progress" />
              </Tabs>

              {tabValue === 0 && <MyCoursesTab />}
              {tabValue === 1 && <TeamProgressTab />}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ManagerDashboard;
