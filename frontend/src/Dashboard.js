import React, { useState, useEffect } from 'react';
import './App.css';

const adminUsername = 'admin'; // Hardcoded admin username
const adminPassword = 'admin123'; // Hardcoded admin password

function Dashboard() {
  const [adminToken, setAdminToken] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle login process
  function handleLogin() {
    if (username === adminUsername && password === adminPassword) {
      setAdminToken('dummy-token'); // Simulate token setting on successful login
      setErrorMessage('');
    } else {
      setErrorMessage('Invalid username or password!');
    }
  }

  return adminToken ? (
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
        <button onClick={handleLogin}>Login</button>
      </div>
    </div>
  );
}

export default Dashboard;
