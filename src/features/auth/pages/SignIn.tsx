import { TextField, Button, Typography, Paper, Box } from '@mui/material';
import { useState } from 'react';

const SignInPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div style={{ padding: 20 , marginTop: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 64px)'}}>
      <Paper elevation={6} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>Sign In</Typography>
      <Box component="form" noValidate autoComplete="off" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField label="Email" type="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField label="Password" type="password" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button variant="contained" size="large" type="submit" fullWidth>Sign In</Button>
      </Box>
    </Paper>
    </div>
  );
};

export default SignInPage;