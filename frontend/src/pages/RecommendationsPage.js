import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/recommendations`);
      setRecommendations(response.data.rows || []);
    } catch (err) {
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (recId, newStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/recommendations/${recId}/status`, { status: newStatus });
      fetchRecommendations();
    } catch (err) {
      setError('Failed to update status');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1><i className="fas fa-lightbulb"></i> Recommendations</h1>
        <p>Track and manage course recommendations</p>
      </div>

      {error && <div className="alert alert-error"><i className="fas fa-exclamation-circle"></i>{error}</div>}

      {loading ? (
        <div className="loading-center"><div className="spinner"></div><p>Loading recommendations...</p></div>
      ) : recommendations.length === 0 ? (
        <div className="empty-state"><i className="fas fa-inbox"></i><p>No recommendations yet</p></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr><th>User ID</th><th>Course ID</th><th>Score</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {recommendations.map((rec) => (
                <tr key={rec.recommendation_id}>
                  <td>{rec.user_id}</td>
                  <td>{rec.course_id}</td>
                  <td>{rec.confidence_score}%</td>
                  <td><span className={`status ${rec.status}`}>{rec.status}</span></td>
                  <td>
                    <select onChange={(e) => updateStatus(rec.recommendation_id, e.target.value)} defaultValue={rec.status} style={{padding: '6px', borderRadius: '4px'}}>
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RecommendationsPage;
