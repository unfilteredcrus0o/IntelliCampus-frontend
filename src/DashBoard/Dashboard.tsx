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
import { ROADMAP_ENDPOINTS } from "../constants";

interface Enrollment {
  id: string;
  title: string;
  status: string;
  progress_percentage: number;
}

const Dashboard: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const getStatusFromPercentage = (percentage: number): string => {
    if (percentage === 0) return "ready";
    if (percentage === 100) return "completed";
    return "in progress";
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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

  const getProgressColor = (progress: number) => {
    if (progress >= 1 && progress <= 35) return "#f44336"; // Red
    if (progress > 35 && progress <= 50) return "#2196f3"; // Blue
    return "#4caf50"; // Green
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

  useEffect(() => {
    const fetchEnrollments = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await makeAuthenticatedRequest(
          ROADMAP_ENDPOINTS.ENROLLEMENTS,
          { method: "GET" }
        );
        const data = await response.json();

        if (Array.isArray(data)) {
          setEnrollments(data);
        } else if (Array.isArray(data?.data)) {
          setEnrollments(data.data);
        } else {
          setEnrollments([]);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to fetch enrollments");
        setEnrollments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
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
            Your Enrollments
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
              No enrollments found.
            </Typography>
          ) : (
            <Grid container spacing={3} justifyContent="center" sx={{ mt: 4 }}>
              {enrollments.map((enrollment) => {
                const calculatedStatus = getStatusFromPercentage(enrollment.progress_percentage);
                return (
                <Grid  key={enrollment.id} component="div">
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
                    <Tooltip title={enrollment.title} placement="top" arrow>
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
                        title={enrollment.title}
                      >
                        {enrollment.title}
                      </Typography>
                      
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "0.7rem",
                          opacity: 0.7,
                          fontWeight: 400,
                        }}
                      >
                        Progress: {enrollment.progress_percentage}%
                      </Typography>
                    </Box>

                    <Button
                      className="continue-btn"
                      variant="contained"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/roadmap/${enrollment.id}`);
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
                      {getButtonLabel(calculatedStatus)}
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

export default Dashboard;
