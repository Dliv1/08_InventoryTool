import React, { useState, useEffect } from 'react';
import './App.css';

import { loginAdmin, registerAdmin } from './api/auth';

function Dashboard() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle login process
  async function handleLogin() {
    try {
      const response = await loginAdmin(username, password);
      const token = response.data.token;
      setToken(token);
      localStorage.setItem('token', token);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Login failed');
    }
  }

  // Handle admin registration
  async function handleRegister() {
    try {
      const response = await registerAdmin(username, password);
      const token = response.data.token;
      setToken(token);
      localStorage.setItem('token', token);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Registration failed');
    }
  }

  return token ? (
    <div className="dashboard-container">
      <div className="inventory-card">
        <h2 className="dashboard-title">Inventory Management</h2>
        <ul>
          <li>Item 1 - Quantity: 10</li>
          <li>Item 2 - Quantity: 20</li>
          <li>Item 3 - Quantity: 30</li>
        </ul>
        <button>Add Item</button>
        <button>Withdraw Item</button>
      </div>
    </div>
  ) : (
    <div className="login-container">
      <div className="login-card">
        <h2>Admin Login</h2>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="button-group">
          <button onClick={handleLogin}>Login</button>
          <button onClick={handleRegister}>Register</button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
