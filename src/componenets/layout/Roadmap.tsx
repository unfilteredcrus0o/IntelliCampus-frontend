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
} from "@mui/material";
import * as Constants from "../../constants";
import { useNavigate } from "react-router-dom";

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
      const response = await fetch(ROADMAP_ENDPOINTS.CREATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.roadmap_id && data.status === "ready") {
        navigate(`/roadmap/${data.roadmap_id}`);
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
    <Paper elevation={4} sx={{ p: 4, maxWidth: 500, margin: "auto", mt: 5 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Roadmap Builder
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "flex", flexDirection: "column", gap: 3 }}
      >
        <Autocomplete
          multiple
          options={topicsList}
          value={selectedTopics}
          onChange={(event, newValue) => setSelectedTopics(newValue)}
          renderInput={(params) => (
            <TextField {...params} label="Select Topics" placeholder="Topics" />
          )}
        />

        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Skill Level
          </Typography>
          <RadioGroup
            row
            value={skillLevel}
            onChange={(e) => setSkillLevel(e.target.value)}
          >
            <FormControlLabel value="basic" control={<Radio />} label="Basic" />
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

        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Duration
          </Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Hours"
              type="number"
              value={hours === "" ? "" : Number(hours)}
              onChange={handleHoursChange}
              inputProps={{ min: 0, max: 1000 }}
              fullWidth
            />
            <TextField
              label="Minutes"
              type="number"
              value={minutes === "" ? "" : Number(minutes)}
              onChange={handleMinutesChange}
              inputProps={{ min: 0, max: 59 }}
              fullWidth
            />
          </Stack>
        </Box>

       <Button variant="contained" type="submit" disabled={loading || !isFormValid}>
          Submit
        </Button>

        {loading && <CircularProgress sx={{ alignSelf: "center" }} />}
      </Box>

      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
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
  );
};

export default RoadmapScreen;
