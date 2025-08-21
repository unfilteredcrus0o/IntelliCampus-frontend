import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { makeAuthenticatedRequest } from "../utils/api";
import { ROADMAP_ENDPOINTS } from "../constants";

interface Enrollment {
  id: string;
  title: string;
  status: string;
  progress: number;
}

const Dashboard: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "ready":
        return "#2196f3";
      case "completed":
        return "#4caf50";
      case "in progress":
        return "#f44336";
      default:
        return "#9e9e9e";
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
        } else if (Array.isArray(data.data)) {
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
          borderRadius: 3,
          boxShadow: 4,
          background:
            "linear-gradient(360deg,rgb(161, 157, 157) 0%, #ebedee 30%,rgb(161, 157, 157)) 100%",
        }}
      >
        <CardContent>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ fontWeight: 600, textAlign: "center", mb: 3 }}
          >
            Your Enrollments
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" mt={4}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography align="center" color="error">
              {error}
            </Typography>
          ) : !Array.isArray(enrollments) || enrollments.length === 0 ? (
            <Typography align="center" color="text.secondary">
              No enrollments found.
            </Typography>
          ) : (
            <Grid container spacing={3} justifyContent="center">
              {enrollments.map((enrollment) => (
                <Grid item key={enrollment.id} xs={12} sm={6} md={4}>
                  <Card
                    sx={{
                      width: 400,
                      height: 220,
                      borderRadius: 4,
                      overflow: "hidden",
                      position: "relative",
                      background: "#A01441",
                      color: "white",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      textAlign: "center",
                      transition: "all 0.4s ease",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                      cursor: "pointer",
                      "&:hover": {
                        transform: "translateY(-8px) scale(1.04)",
                        boxShadow: "0 14px 36px rgba(0,0,0,0.4)",
                        background:
                          "linear-gradient(135deg, #A01441 0%, #C02555 100%)",
                      },
                      "&:hover .continue-btn": {
                        opacity: 1,
                        transform: "translateY(0)",
                      },
                    }}
                  >
                    {/* Status Badge */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: 14,
                        right: 14,
                        px: 2,
                        py: 0.6,
                        borderRadius: "20px",
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                        backgroundColor: getStatusColor(enrollment.status),
                        color: "white",
                        textTransform: "capitalize",
                        boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
                      }}
                    >
                      {enrollment.status}
                    </Box>

                    {/* Title */}
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        fontSize: "1rem",
                        letterSpacing: "0.5px",
                        textShadow: "1px 1px 4px rgba(0,0,0,0.4)",
                        color: "#fff",
                        px: 2,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        wordWrap: "break-word",
                        mb: 2,
                      }}
                      title={enrollment.title}
                    >
                      {enrollment.title}
                    </Typography>

                    {/* Continue Button */}
                    <Button
                      className="continue-btn"
                      variant="contained"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/roadmap", { state: { enrollment } });
                      }}
                      sx={{
                        position: "absolute",
                        bottom: 16,
                        right: 16,
                        borderRadius: "20px",
                        background: "#fff",
                        color: "#A01441",
                        fontWeight: "bold",
                        textTransform: "none",
                        px: 3,
                        py: 0.6,
                        opacity: 0,
                        transform: "translateY(10px)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          background: "#f0f0f0",
                        },
                      }}
                    >
                      {getButtonLabel(enrollment.status)}
                    </Button>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
