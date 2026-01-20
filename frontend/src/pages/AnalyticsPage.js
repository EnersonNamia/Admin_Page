import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

function AnalyticsPage() {
  const [analytics, setAnalytics] = useState({
    users: 0,
    courses: 0,
    tests: 0,
    recommendations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [users, courses, tests, recs] = await Promise.all([
        axios.get(`${API_BASE_URL}/users`).catch(() => ({ data: { rows: [] } })),
        axios.get(`${API_BASE_URL}/courses`).catch(() => ({ data: { rows: [] } })),
        axios.get(`${API_BASE_URL}/tests`).catch(() => ({ data: { rows: [] } })),
        axios.get(`${API_BASE_URL}/recommendations`).catch(() => ({ data: { rows: [] } })),
      ]);

      setAnalytics({
        users: users.data?.rows?.length || 0,
        courses: courses.data?.rows?.length || 0,
        tests: tests.data?.rows?.length || 0,
        recommendations: recs.data?.rows?.length || 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1><i className="fas fa-chart-bar"></i> Analytics</h1>
        <p>System performance and statistics</p>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner"></div><p>Loading analytics...</p></div>
      ) : (
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px'}}>
          <div className="card">
            <h3>Total Users</h3>
            <p style={{fontSize: '32px', fontWeight: 'bold', color: '#3498db'}}>{analytics.users}</p>
          </div>
          <div className="card">
            <h3>Total Courses</h3>
            <p style={{fontSize: '32px', fontWeight: 'bold', color: '#2ecc71'}}>{analytics.courses}</p>
          </div>
          <div className="card">
            <h3>Total Tests</h3>
            <p style={{fontSize: '32px', fontWeight: 'bold', color: '#f39c12'}}>{analytics.tests}</p>
          </div>
          <div className="card">
            <h3>Total Recommendations</h3>
            <p style={{fontSize: '32px', fontWeight: 'bold', color: '#9b59b6'}}>{analytics.recommendations}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalyticsPage;
