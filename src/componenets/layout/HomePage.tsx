import React from "react";
import { Typography, Container, Button, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container
      maxWidth="md"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        textAlign: "center",
      }}
    >
      <Typography variant="h2" gutterBottom>
        IntelliCampus
      </Typography>

      <Typography variant="h6" paragraph>
        IntelliCampus is your intelligent learning companion, designed to
        transform the way you master new skills. Generate personalized roadmaps
        for any topic, follow step-by-step milestones, and engage with
        interactive materials, quizzes, and coding challenges — all tailored to
        your pace and style.
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        <Button variant="contained" size="large" onClick={() => navigate("/roadmap")}>
          Get Started
        </Button>
        <Button variant="outlined" size="large">
          Learn More
        </Button>
      </Stack>
    </Container>
  );
};

export default HomePage;
