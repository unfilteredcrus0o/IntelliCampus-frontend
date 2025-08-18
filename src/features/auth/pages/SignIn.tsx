import { TextField, Button, Typography, Paper, Box, Link } from '@mui/material';
import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SignInPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div style={{ padding: 20 , marginTop: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 64px)'}}>
      <Paper elevation={6} sx={{ p: 4, maxWidth: 400, width: '100%', m: 'auto', display: 'flex', justifyContent: 'center' }}>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>Sign In</Typography>
        <TextField label="Email" type="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField label="Password" type="password" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button variant="contained" size="large" type="submit" fullWidth>Sign In</Button>
        <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
          Don't have an account?{' '}
          <Link 
            component="button" 
            variant="body2" 
            onClick={() => navigate('/signup')}
            sx={{ cursor: 'pointer' }}
          >
            Sign up here
          </Link>
        </Typography>
      </Box>
    </Paper>
    </div>
  );
};

export default SignInPage;