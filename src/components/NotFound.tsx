import React from 'react';
import { Typography, Button, Box, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="calc(100vh - 64px)"
        textAlign="center"
      >
        <Typography variant="h1" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          The page you're looking for doesn't exist.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/')}
        >
          Go to Home
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound;
