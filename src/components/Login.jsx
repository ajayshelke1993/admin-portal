// src/components/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import './styles/Login.css';
const BASE_URL = import.meta.env.VITE_API_URL;

const Login = () => {
  const { login } = useAuth(); // Get login function from context
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      console.log(import.meta.env.VITE_API_URL);
      const response = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }), // Send username and password
      });

      const data = await response.json();

      if (data.success) {
        login(data.user.name_short, data.user.admin,data.user.active); // Call login function to set authenticated state// Navigate to the admin portal on successful login
        navigate('/home');
      } else {
        setError(data.message); // Set error message from response
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Server error. Please try again later.'); // Generic error message
    }
  };

  return (
    <div className="login-container login-page">
      <h2>Login to Admin Portal</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <h6>USERNAME: admin , PASSWORD: admin123</h6>
          <h6>USERNAME: staff , PASSWORD: staff123</h6>
          <label htmlFor="username">Username: {console.log(import.meta.env)}</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
