import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar({ token, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isStudentView = location.pathname === '/student';

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Retrievers Essentials {isStudentView ? 'Student' : 'Admin'} Portal
        </Typography>
        
        {token ? (
          // Logged in as admin
          <>
            <Button 
              color="inherit" 
              onClick={() => navigate('/dashboard')}
              disabled={!isStudentView}
            >
              Admin Dashboard
            </Button>
            <Button 
              color="inherit" 
              onClick={() => navigate('/student')}
              disabled={isStudentView}
            >
              Student View
            </Button>
            <Button color="inherit" onClick={onLogout}>Logout</Button>
          </>
        ) : (
          // Not logged in
          <>
            {!isStudentView && (
              <Button color="inherit" onClick={() => navigate('/login')}>Admin Login</Button>
            )}
            <Button 
              color="inherit" 
              onClick={() => navigate('/student')}
              disabled={isStudentView}
            >
              {isStudentView ? 'Student View' : 'Continue as Student'}
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}