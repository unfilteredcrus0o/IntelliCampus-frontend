import React, { useState } from "react";
import {
  Autocomplete,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  CircularProgress,
  Typography,
  Paper,
  Box,
  Stack,
  Snackbar,
  Alert,
  Container,
  Chip,
} from "@mui/material";
import * as Constants from "../../constants";
import { useNavigate } from "react-router-dom";
import { makeAuthenticatedRequest } from "../../utils/api";
import "./Roadmap.css";

const topicsList = ["Python", "Git", "JavaScript", "React", "CSS"];

const RoadmapScreen: React.FC = () => {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState("");
  const [hours, setHours] = useState<number | "">("");
  const [minutes, setMinutes] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const { ROADMAP_ENDPOINTS } = Constants;
  const navigate = useNavigate();
  const isFormValid =
  selectedTopics.length > 0 &&
  skillLevel !== "" &&
  ((Number(hours) || 0) > 0 || (Number(minutes) || 0) > 0);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const totalMinutes = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
    const formattedDuration = `${Math.floor(totalMinutes / 60)}h ${
      totalMinutes % 60
    }m`;

    const payload = {
      selectedTopics,
      skillLevel,
      duration: formattedDuration,
    };
    try {
      const response = await makeAuthenticatedRequest(ROADMAP_ENDPOINTS.CREATE, {
        method: "POST",
        body: payload,
      });

      const data = await response.json();
      if (data.roadmap_id && data.status === "ready") {
        navigate(`/roadmap/${data.roadmap_id}`);
      } else {
        console.error("Unexpected response:", data);
      }
    } catch (error) {
      console.error("Error submitting roadmap:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Allow empty input
    if (raw === "") {
      setHours("");
      return;
    }

    // Allow only digits
    if (!/^\d+$/.test(raw)) return;

    const value = parseInt(raw, 10);

    if (value > 1000) {
      setToastOpen(true);
      return;
    }

    setHours(value);
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const value =
      raw === "" ? "" : Math.max(0, Math.min(59, parseInt(raw, 10)));
    setMinutes(value);
  };

  return (
    <div className="roadmap-container">
      <Container maxWidth="sm">
        <Paper elevation={4} className="roadmap-form-paper">
          <div className="roadmap-header">
            <Typography variant="h4" component="h1">
              Roadmap Builder
            </Typography>
          </div>

          <div className="roadmap-form-content">
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            >
              {/* Topics Selection */}
              <Box className="form-section">
                <Typography variant="h6" className="form-section-title">
                  Select Learning Topics
                </Typography>
                <Autocomplete
                  multiple
                  options={topicsList}
                  value={selectedTopics}
                  onChange={(event, newValue) => setSelectedTopics(newValue)}
                  className="topics-autocomplete"
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Choose your interests" 
                      placeholder="e.g., Python, React, JavaScript" 
                      helperText="Select one or more topics you want to learn"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        key={option}
                        label={option}
                        {...getTagProps({ index })}
                        sx={{
                          background: "linear-gradient(135deg, #a01441 0%, #c8185a 100%)",
                          color: "white",
                          borderRadius: "16px",
                          fontWeight: 600,
                          "& .MuiChip-deleteIcon": {
                            color: "rgba(255, 255, 255, 0.8)",
                            "&:hover": {
                              color: "white",
                            },
                          },
                        }}
                      />
                    ))
                  }
                />
              </Box>

              {/* Skill Level */}
              <Box className="form-section">
                <Typography variant="h6" className="form-section-title">
                  Current Skill Level
                </Typography>
                <RadioGroup
                  row
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  className="skill-level-group"
                >
                  <FormControlLabel 
                    value="basic" 
                    control={<Radio />} 
                    label="Beginner" 
                  />
                  <FormControlLabel
                    value="intermediate"
                    control={<Radio />}
                    label="Intermediate"
                  />
                  <FormControlLabel
                    value="advanced"
                    control={<Radio />}
                    label="Advanced"
                  />
                </RadioGroup>
              </Box>

              {/* Duration */}
              <Box className="form-section">
                <Typography variant="h6" className="form-section-title">
                  Study Duration
                </Typography>
                <Stack direction="row" spacing={2} className="duration-inputs">
                  <TextField
                    label="Hours"
                    type="number"
                    value={hours === "" ? "" : Number(hours)}
                    onChange={handleHoursChange}
                    inputProps={{ min: 0, max: 1000 }}
                    fullWidth
                    helperText="Hours per week"
                  />
                  <TextField
                    label="Minutes"
                    type="number"
                    value={minutes === "" ? "" : Number(minutes)}
                    onChange={handleMinutesChange}
                    inputProps={{ min: 0, max: 59 }}
                    fullWidth
                    helperText="Additional minutes"
                  />
                </Stack>
              </Box>

              {/* Submit Button */}
              <Button 
                variant="contained" 
                type="submit" 
                disabled={loading || !isFormValid}
                className="submit-button"
                size="large"
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                    Creating Your Roadmap...
                  </>
                ) : (
                  "Create My Learning Roadmap"
                )}
              </Button>

              {loading && (
                <Box sx={{ textAlign: "center", mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Generating personalized learning path...
                  </Typography>
                </Box>
              )}
            </Box>
          </div>

          <Snackbar
            open={toastOpen}
            autoHideDuration={4000}
            onClose={() => setToastOpen(false)}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
            className="warning-snackbar"
          >
            <Alert
              severity="warning"
              onClose={() => setToastOpen(false)}
              sx={{ width: "100%" }}
            >
              Please limit the time to less than 1000 hours for efficient learning.
            </Alert>
          </Snackbar>
        </Paper>
      </Container>
    </div>
  );
};

export default RoadmapScreen;
