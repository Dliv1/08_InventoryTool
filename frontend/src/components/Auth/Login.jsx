import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../../api/auth';
import { 
  TextField, 
  Button, 
  Container, 
  Typography, 
  Box, 
  Paper,
  Divider,
  Stack
} from '@mui/material';

export default function Login({ setToken }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await loginAdmin(username, password);
      localStorage.setItem('token', response.data.token); // Store token
      setToken(response.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  const handleStudentAccess = () => {
    navigate('/student');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography component="h1" variant="h4" gutterBottom>
            Inventory System
          </Typography>
          
          <Paper elevation={2} sx={{ p: 4, width: '100%', mt: 3, borderRadius: 2 }}>
            <Typography component="h2" variant="h5" align="center" gutterBottom>
              Admin Login
            </Typography>
            
            {error && <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>{error}</Typography>}
            
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
                Admin Sign In
              </Button>
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button 
                  color="primary"
                  onClick={handleRegister}
                  size="small"
                >
                  Don't have an account? Register as Admin
                </Button>
              </Box>
            </Box>
          </Paper>

          
          <Box sx={{ mt: 4, textAlign: 'center', width: '100%' }}>
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">OR</Typography>
            </Divider>
            <Button
              variant="outlined"
              fullWidth
              onClick={handleStudentAccess}
              sx={{ py: 1.5 }}
            >
              Continue as Student
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Students can browse inventory and add items to cart without logging in.
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}