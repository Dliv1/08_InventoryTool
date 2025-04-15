import React from 'react';
import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import Navbar from './components/Shared/Navbar';
import ProtectedRoute from './components/Shared/ProtectedRoute';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export default function App() {
    const [token, setToken] = useState(() => {
        // Initialize token from localStorage if available
        return localStorage.getItem('token') || '';
      });

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Navbar token={token} onLogout={handleLogout} />
        <Routes>
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/register" element={<Register setToken={setToken} />} />
          <Route path="/dashboard" element={
            <ProtectedRoute token={token}>
              <Dashboard token={token} />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
