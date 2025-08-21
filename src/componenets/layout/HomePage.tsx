import React from "react";
import { Typography, Container, Box } from "@mui/material";
import './HomePage.css';

const HomePage: React.FC = () => {
  return (
    <Container
      maxWidth="md"
      className="homepage-container"
    >
      <Box className="homepage-hero-section">
        <Typography
          variant="h2"
          gutterBottom
          className="homepage-main-title"
        >
          IntelliCampus
        </Typography>

        <Typography
          variant="h5"
          className="homepage-tagline"
        >
          Your intelligent learning companion for mastering new skills
        </Typography>

        <Typography
          variant="h6"
          className="homepage-description"
        >
          Generate personalized roadmaps, track your progress, and engage with
          interactive content tailored to your learning pace and style.
        </Typography>
      </Box>

      {/* Features Section */}
      <Box className="homepage-features-section">
        <Box className="homepage-feature-box">
          <Typography variant="h3" className="homepage-feature-emoji">🎓</Typography>
          <Typography variant="h6" className="homepage-feature-title-smart">
            Smart Learning
          </Typography>
        </Box>
        <Box className="homepage-feature-box">
          <Typography variant="h3" className="homepage-feature-emoji">📊</Typography>
          <Typography variant="h6" className="homepage-feature-title-progress">
            Track Progress
          </Typography>
        </Box>
        <Box className="homepage-feature-box">
          <Typography variant="h3" className="homepage-feature-emoji">💡</Typography>
          <Typography variant="h6" className="homepage-feature-title-interactive">
            Interactive
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default HomePage;
