import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerAdmin } from '../../api/auth';
import { 
  TextField, 
  Button, 
  Container, 
  Typography, 
  Box, 
  Paper,
  Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function Register({ setToken }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await registerAdmin(username, password);
      localStorage.setItem('token', response.data.token); // Store token
      setToken(response.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Username may be taken.');
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography component="h1" variant="h4" gutterBottom>
            Admin Registration
          </Typography>
          
          <Paper elevation={2} sx={{ p: 4, width: '100%', mt: 3, borderRadius: 2 }}>
            {error && <Typography color="error" sx={{ mb: 2, textAlign: 'center' }}>{error}</Typography>}
            
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button 
                type="submit" 
                fullWidth 
                variant="contained" 
                sx={{ mt: 3, mb: 2, py: 1.5 }}
              >
                Create Admin Account
              </Button>
              
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button 
                  color="primary"
                  onClick={handleBackToLogin}
                  startIcon={<ArrowBackIcon />}
                  size="small"
                >
                  Back to Login
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Paper>
    </Container>
  );
}