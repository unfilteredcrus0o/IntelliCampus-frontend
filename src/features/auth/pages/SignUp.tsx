import { TextField, Button, Typography, Paper, Box } from '@mui/material';
import axios from 'axios';
import { useState } from 'react';

const SignUpPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
console.log(fullName, email, password, confirmPassword);
    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('/auth/register', {
        name,
        email,
        password,
        confirmPassword,
      });
      console.log('Register success:', res.data);
    } catch (err) {
      console.error('Register error:', err);
    }
  };

  return (
    <div style={{ padding: 20 , marginTop: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 64px)'}}>
       <Paper elevation={6} sx={{ p: 4, maxWidth: 400, width: '100%', m: 'auto', display: 'flex', justifyContent: 'center' }}>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>Sign Up</Typography>
        <TextField label="Full Name" fullWidth value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <TextField label="Email" type="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField label="Password" type="password" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} />
        <TextField label="Confirm Password" type="password" fullWidth value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        <Button variant="contained" size="large" type="submit" fullWidth>Sign Up</Button>
      </Box>
    </Paper>
    </div>
  );
};

export default SignUpPage;
