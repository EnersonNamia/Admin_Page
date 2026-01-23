import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const API_BASE_URL = 'http://localhost:5000/api';

function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalTests: 0,
    totalRecommendations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [users, courses, tests, recs] = await Promise.all([
        axios.get(`${API_BASE_URL}/users?limit=1`).catch(() => ({ data: { pagination: { total: 0 } } })),
        axios.get(`${API_BASE_URL}/courses?limit=1`).catch(() => ({ data: { pagination: { total: 0 } } })),
        axios.get(`${API_BASE_URL}/tests?limit=1`).catch(() => ({ data: { pagination: { total: 0 } } })),
        axios.get(`${API_BASE_URL}/recommendations?limit=1`).catch(() => ({ data: { pagination: { total: 0 } } })),
      ]);

      setStats({
        totalUsers: users.data?.pagination?.total || 0,
        totalCourses: courses.data?.pagination?.total || 0,
        totalTests: tests.data?.pagination?.total || 0,
        totalRecommendations: recs.data?.pagination?.total || 0,
      });
    } catch (err) {
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1><i className="fas fa-chart-line"></i> Dashboard</h1>
        <p>Welcome to the Course Recommendation Admin System</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-center">
          <div className="spinner"></div>
          <p>Loading statistics...</p>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon users">
                <i className="fas fa-users"></i>
              </div>
              <h3>Total Users</h3>
              <p className="stat-value">{stats.totalUsers}</p>
              <span className="stat-label">Registered Students</span>
            </div>

            <div className="stat-card">
              <div className="stat-icon courses">
                <i className="fas fa-book"></i>
              </div>
              <h3>Total Courses</h3>
              <p className="stat-value">{stats.totalCourses}</p>
              <span className="stat-label">Available Programs</span>
            </div>

            <div className="stat-card">
              <div className="stat-icon tests">
                <i className="fas fa-clipboard-check"></i>
              </div>
              <h3>Total Tests</h3>
              <p className="stat-value">{stats.totalTests}</p>
              <span className="stat-label">Assessment Modules</span>
            </div>

            <div className="stat-card">
              <div className="stat-icon recommendations">
                <i className="fas fa-lightbulb"></i>
              </div>
              <h3>Total Recommendations</h3>
              <p className="stat-value">{stats.totalRecommendations}</p>
              <span className="stat-label">Generated</span>
            </div>
          </div>

          <div className="dashboard-content">
            <div className="card">
              <div className="card-header">
                <h2>System Information</h2>
              </div>
              <div className="card-body">
                <div className="info-grid">
                  <div className="info-item">
                    <strong>System Name:</strong>
                    <span>College Course Recommendation System</span>
                  </div>
                  <div className="info-item">
                    <strong>Version:</strong>
                    <span>1.0.0</span>
                  </div>
                  <div className="info-item">
                    <strong>Algorithm:</strong>
                    <span>Rule-Based Logic + Decision Tree</span>
                  </div>
                  <div className="info-item">
                    <strong>Database:</strong>
                    <span>SQLite</span>
                  </div>
                  <div className="info-item">
                    <strong>Status:</strong>
                    <span className="status-online">Online</span>
                  </div>
                  <div className="info-item">
                    <strong>Target Users:</strong>
                    <span>Senior High School Students</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>Quick Features</h2>
              </div>
              <div className="features-list">
                <div className="feature-item">
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <strong>User Management</strong>
                    <p>Create, edit, and manage student profiles and accounts</p>
                  </div>
                </div>
                <div className="feature-item">
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <strong>Course Management</strong>
                    <p>Add, update, and organize course information</p>
                  </div>
                </div>
                <div className="feature-item">
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <strong>Assessment Tests</strong>
                    <p>Create customized tests and questionnaires</p>
                  </div>
                </div>
                <div className="feature-item">
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <strong>Recommendations</strong>
                    <p>Generate and track personalized course recommendations</p>
                  </div>
                </div>
                <div className="feature-item">
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <strong>Analytics</strong>
                    <p>View system performance and user statistics</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
