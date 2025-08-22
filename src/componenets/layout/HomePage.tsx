import React from "react";
import { Typography, Container, Box, Button, Grid, Card, CardContent, Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import './HomePage.css';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box className="homepage-wrapper">
      {/* Hero Section */}
      <Container maxWidth="lg" className="homepage-hero-container">
      <Box className="homepage-hero-section">
          <Chip 
            label="🚀 Transform Your Learning Journey" 
            className="homepage-hero-chip"
            variant="outlined"
          />
          
        <Typography
            variant="h1"
          className="homepage-main-title"
        >
            Welcome to <span className="homepage-brand">IntelliCampus</span>
        </Typography>

        <Typography
          variant="h5"
          className="homepage-tagline"
        >
            Your AI-powered learning companion that creates personalized roadmaps 
            and tracks your progress every step of the way
        </Typography>

          <Box className="homepage-cta-buttons">
            <Button
              variant="contained"
              size="large"
              className="homepage-primary-btn"
              onClick={() => navigate('/signup')}
            >
              Start Learning Today
            </Button>
            <Button
              variant="outlined"
              size="large"
              className="homepage-secondary-btn"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </Box>
      </Box>
      </Container>

      {/* Features Section */}
      <Container maxWidth="lg" className="homepage-features-container">
        <Typography variant="h3" className="homepage-section-title">
          Why Choose IntelliCampus?
        </Typography>
        
        <Box className="homepage-features-grid">
          <Box className="homepage-feature-item">
            <Card className="homepage-feature-card">
              <CardContent>
                <Box className="homepage-feature-icon">🎯</Box>
                <Typography variant="h5" className="homepage-feature-title">
                  AI-Powered Roadmaps
                </Typography>
                <Typography variant="body1" className="homepage-feature-description">
                  Get intelligent learning paths crafted by advanced AI, tailored to your unique goals, 
                  skill level, and learning preferences. Dynamic adaptation as you progress.
                </Typography>
                <Box className="homepage-feature-accent"></Box>
              </CardContent>
            </Card>
          </Box>

          <Box className="homepage-feature-item">
            <Card className="homepage-feature-card homepage-feature-card-premium">
              <CardContent>
                <Box className="homepage-feature-icon">📊</Box>
                <Typography variant="h5" className="homepage-feature-title">
                  Smart Analytics
                </Typography>
                <Typography variant="body1" className="homepage-feature-description">
                  Real-time insights with predictive analytics, completion forecasts, 
                  and personalized recommendations to optimize your learning efficiency.
                </Typography>
                <Box className="homepage-feature-accent"></Box>
              </CardContent>
            </Card>
          </Box>

          <Box className="homepage-feature-item">
            <Card className="homepage-feature-card">
              <CardContent>
                <Box className="homepage-feature-icon">⚡</Box>
                <Typography variant="h5" className="homepage-feature-title">
                  Interactive Learning
                </Typography>
                <Typography variant="body1" className="homepage-feature-description">
                  Immersive experiences with hands-on labs, coding challenges, 
                  and real-world projects that build practical, job-ready skills.
          </Typography>
                <Box className="homepage-feature-accent"></Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>

      {/* How It Works Section */}
      <Container maxWidth="lg" className="homepage-how-it-works">
        <Typography variant="h3" className="homepage-section-title">
          How It Works
        </Typography>
        
        <Box className="homepage-steps-grid">
          <Box className="homepage-step">
            <Box className="homepage-step-wrapper">
              <Box className="homepage-step-number">1</Box>
              <Typography variant="h6" className="homepage-step-title">
                Discover Your Path
              </Typography>
              <Typography variant="body1" className="homepage-step-description">
                Our AI analyzes your goals and creates a personalized learning journey 
                optimized for your success.
              </Typography>
              <Box className="homepage-step-line"></Box>
            </Box>
          </Box>

          <Box className="homepage-step">
            <Box className="homepage-step-wrapper">
              <Box className="homepage-step-number">2</Box>
              <Typography variant="h6" className="homepage-step-title">
                Learn & Build
              </Typography>
              <Typography variant="body1" className="homepage-step-description">
                Engage with interactive content, complete hands-on projects, 
                and build real-world expertise.
              </Typography>
              <Box className="homepage-step-line"></Box>
            </Box>
          </Box>

          <Box className="homepage-step">
            <Box className="homepage-step-wrapper">
              <Box className="homepage-step-number">3</Box>
              <Typography variant="h6" className="homepage-step-title">
                Master & Achieve
              </Typography>
              <Typography variant="body1" className="homepage-step-description">
                Track your progress with smart analytics and celebrate 
                milestones on your learning journey.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Stats Section */}
      <Container maxWidth="lg" className="homepage-stats-section">
        <Box className="homepage-stats-grid">
          <Box className="homepage-stat">
            <Typography variant="h3" className="homepage-stat-number">100+</Typography>
            <Typography variant="body1" className="homepage-stat-label">Expert Courses</Typography>
          </Box>
          <Box className="homepage-stat">
            <Typography variant="h3" className="homepage-stat-number">5K+</Typography>
            <Typography variant="body1" className="homepage-stat-label">Global Learners</Typography>
          </Box>
          <Box className="homepage-stat">
            <Typography variant="h3" className="homepage-stat-number">98%</Typography>
            <Typography variant="body1" className="homepage-stat-label">Success Rate</Typography>
          </Box>
          <Box className="homepage-stat">
            <Typography variant="h3" className="homepage-stat-number">24/7</Typography>
            <Typography variant="body1" className="homepage-stat-label">AI Support</Typography>
          </Box>
        </Box>
      </Container>

      {/* Call to Action */}
      <Container maxWidth="lg" className="homepage-cta-section">
        <Box className="homepage-final-cta">
          <Typography variant="h3" className="homepage-cta-title">
            Ready to Start Your Learning Journey?
          </Typography>
          <Typography variant="h6" className="homepage-cta-subtitle">
            Join thousands of learners who are already mastering new skills with IntelliCampus
          </Typography>
          <Button
            variant="contained"
            size="large"
            className="homepage-cta-button"
            onClick={() => navigate('/signup')}
          >
            Get Started Free
          </Button>
        </Box>
      </Container>
      </Box>
  );
};

export default HomePage;
