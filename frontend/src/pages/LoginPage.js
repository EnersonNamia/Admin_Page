import React, { useState } from 'react';
import axios from 'axios';
import './LoginPage.css';

const API_BASE_URL = 'http://localhost:5000/api';

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // For demo purposes, accept default admin credentials
      if (email === 'admin@system.com' && password === 'admin123') {
        const adminData = {
          id: 1,
          full_name: 'System Administrator',
          email: 'admin@system.com',
          role: 'admin'
        };
        onLogin('demo-token-12345', adminData);
        return;
      }

      // Try to authenticate with backend
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });

      if (response.data.token) {
        onLogin(response.data.token, response.data.user);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Invalid email or password. Try admin@system.com / admin123'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <i className="fas fa-graduation-cap"></i>
            <h1>Course Recommendation System</h1>
            <p>Admin Dashboard</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-error">
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">
                <i className="fas fa-envelope"></i> Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <i className="fas fa-lock"></i> Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-login"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Logging in...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i>
                  Login
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>Demo Credentials:</p>
            <code>Email: admin@system.com</code>
            <code>Password: admin123</code>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
