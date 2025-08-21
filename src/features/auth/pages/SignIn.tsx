import { TextField, Button, Typography, Box, Link, Alert } from '@mui/material';
import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignIn.css';

const SignInPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });
      console.log('Login success:', res.data);
      setSuccessMessage('Login successful!');  
      
      if (res.data.token) {
        sessionStorage.setItem('authToken', res.data.token);
      } else if (res.data.access_token) {
        sessionStorage.setItem('authToken', res.data.access_token);
      } else {
        console.log('No token found in response. Available fields:', Object.keys(res.data));
      }
      const userName = email.split('@')[0];
      sessionStorage.setItem('user', JSON.stringify({ name: userName, email }));
      sessionStorage.setItem('isAuthenticated', 'true');
      
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setSuccessMessage('');
    }
  };

  return (
    <Box className="signin-container"
    >
      <Box className="signin-form-card"
      >
        <Typography 
          variant="h4" 
          className="signin-title"
        >
          LOGIN
        </Typography>

        <Typography 
          variant="body2" 
          className="signin-description"
        >
          Sign in with Email and Password
        </Typography>

        {successMessage && (
          <Alert severity="success" className="signin-success-alert">
            {successMessage}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} className="signin-form">
          <TextField 
            label="Email" 
            type="email" 
            fullWidth 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            className="signin-email-field"
          />
          <TextField 
            label="Password" 
            type="password" 
            fullWidth 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            className="signin-password-field"
          />
          
                      <Button 
              variant="contained" 
              size="large" 
              type="submit" 
              fullWidth
              className="signin-submit-button"
            >
            Sign In
          </Button>
        </Box>

        <Typography variant="body2" className="signin-bottom-text">
          Don't have an account?{' '}
          <Link 
            component="button" 
            variant="body2" 
            onClick={() => navigate('/signup')}
            className="signin-signup-link"
          >
            Sign up here
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default SignInPage;