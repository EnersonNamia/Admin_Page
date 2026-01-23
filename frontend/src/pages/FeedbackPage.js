import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './FeedbackPage.css';

const FeedbackPage = () => {
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  const [filters, setFilters] = useState({
    rating: '',
    search: '',
    user_id: ''
  });
  const [viewMode, setViewMode] = useState('table'); // table or card
  const [loading, setLoading] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const token = localStorage.getItem('token');

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Fetch feedback data
  const fetchFeedback = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.rating && { rating: filters.rating }),
        ...(filters.search && { search: filters.search }),
        ...(filters.user_id && { user_id: filters.user_id })
      });

      const response = await axios.get(`${API_BASE_URL}/feedback?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFeedback(response.data.feedback || []);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
      setFeedback([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, filters, token, API_BASE_URL]);

  // Fetch feedback statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/feedback/stats/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch feedback stats:', error);
    }
  }, [token, API_BASE_URL]);

  // Initial load
  useEffect(() => {
    fetchFeedback(1);
    fetchStats();
  }, [fetchFeedback, fetchStats]);

  // Re-fetch when filters change
  useEffect(() => {
    fetchFeedback(1);
  }, [filters, fetchFeedback]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handlePageChange = (newPage) => {
    fetchFeedback(newPage);
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setPagination(prev => ({ ...prev, limit: newLimit }));
    fetchFeedback(1);
  };

  const clearFilters = () => {
    setFilters({ rating: '', search: '', user_id: '' });
  };

  const StarRating = ({ rating, size = 'medium' }) => {
    const sizeClass = size === 'small' ? 'star-small' : 'star-medium';
    return (
      <div className={`star-rating ${sizeClass}`}>
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : 'empty'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const renderTableView = () => (
    <div className="feedback-table-container">
      <table className="feedback-table">
        <thead>
          <tr>
            <th>Rating</th>
            <th>Student</th>
            <th>Course</th>
            <th>Feedback</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {feedback.length > 0 ? (
            feedback.map(item => (
              <tr key={item.feedback_id}>
                <td>
                  <StarRating rating={item.rating} size="small" />
                </td>
                <td>
                  <div className="student-info">
                    <div className="student-name">{item.user_name}</div>
                    <div className="student-email">{item.user_email}</div>
                  </div>
                </td>
                <td className="course-name">{item.course_name}</td>
                <td>
                  <div className="feedback-preview">
                    {item.feedback_text ? item.feedback_text.substring(0, 60) + (item.feedback_text.length > 60 ? '...' : '') : 'No feedback'}
                  </div>
                </td>
                <td className="date">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>
                <td>
                  <button
                    className="view-btn"
                    onClick={() => setSelectedFeedback(item)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="empty-state">
                No feedback found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderCardView = () => (
    <div className="feedback-cards-container">
      {feedback.length > 0 ? (
        feedback.map(item => (
          <div key={item.feedback_id} className="feedback-card">
            <div className="card-header">
              <StarRating rating={item.rating} />
              <div className="card-date">
                {new Date(item.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="card-content">
              <div className="student-section">
                <strong>{item.user_name}</strong>
                <span className="student-email">{item.user_email}</span>
              </div>
              <div className="course-section">
                <strong>Course:</strong> {item.course_name}
              </div>
              <div className="feedback-section">
                <strong>Feedback:</strong>
                <p>{item.feedback_text || 'No feedback provided'}</p>
              </div>
              <button
                className="view-btn"
                onClick={() => setSelectedFeedback(item)}
              >
                View Details
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="empty-state">No feedback found</div>
      )}
    </div>
  );

  return (
    <div className="feedback-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-title">
          <h1>Student Feedback</h1>
          <p>View and manage student feedback on recommendations</p>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.total_feedback}</div>
            <div className="stat-label">Total Feedback</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.average_rating.toFixed(1)}</div>
            <div className="stat-label">Average Rating</div>
          </div>
          <div className="stat-card positive">
            <div className="stat-number">{stats.positive_feedback}</div>
            <div className="stat-label">Positive (4-5 ⭐)</div>
          </div>
          <div className="stat-card neutral">
            <div className="stat-number">{stats.neutral_feedback}</div>
            <div className="stat-label">Neutral (3 ⭐)</div>
          </div>
          <div className="stat-card negative">
            <div className="stat-number">{stats.negative_feedback}</div>
            <div className="stat-label">Negative (1-2 ⭐)</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.feedback_with_comments}</div>
            <div className="stat-label">With Comments</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Filter by Rating:</label>
          <select
            name="rating"
            value={filters.rating}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars ⭐⭐⭐⭐⭐</option>
            <option value="4">4 Stars ⭐⭐⭐⭐</option>
            <option value="3">3 Stars ⭐⭐⭐</option>
            <option value="2">2 Stars ⭐⭐</option>
            <option value="1">1 Star ⭐</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            name="search"
            placeholder="Search by student name or feedback..."
            value={filters.search}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>

        <button
          className="clear-btn"
          onClick={clearFilters}
        >
          Clear Filters
        </button>
      </div>

      {/* View Mode & Pagination Controls */}
      <div className="controls-section">
        <div className="view-mode-toggle">
          <button
            className={`mode-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Table View"
          >
            📊 Table
          </button>
          <button
            className={`mode-btn ${viewMode === 'card' ? 'active' : ''}`}
            onClick={() => setViewMode('card')}
            title="Card View"
          >
            📇 Cards
          </button>
        </div>

        <div className="pagination-controls">
          <label>Items per page:</label>
          <select
            value={pagination.limit}
            onChange={handleLimitChange}
            className="limit-select"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="loading">Loading feedback...</div>
      ) : (
        <>
          {viewMode === 'table' ? renderTableView() : renderCardView()}

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="page-btn"
              >
                ← Previous
              </button>

              <div className="page-info">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </div>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="page-btn"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedFeedback && (
        <div className="modal-overlay" onClick={() => setSelectedFeedback(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Feedback Details</h2>
              <button className="close-btn" onClick={() => setSelectedFeedback(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <label>Rating:</label>
                <StarRating rating={selectedFeedback.rating} />
              </div>
              <div className="detail-row">
                <label>Student:</label>
                <div>
                  <div>{selectedFeedback.user_name}</div>
                  <div className="detail-email">{selectedFeedback.user_email}</div>
                </div>
              </div>
              <div className="detail-row">
                <label>Course:</label>
                <div>{selectedFeedback.course_name}</div>
              </div>
              <div className="detail-row">
                <label>Recommendation Reason:</label>
                <div className="detail-reasoning">{selectedFeedback.recommendation_reasoning}</div>
              </div>
              <div className="detail-row">
                <label>Feedback:</label>
                <div className="detail-feedback">
                  {selectedFeedback.feedback_text || 'No feedback provided'}
                </div>
              </div>
              <div className="detail-row">
                <label>Submitted:</label>
                <div>{new Date(selectedFeedback.created_at).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;
