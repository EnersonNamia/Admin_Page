import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UsersPage.css';

const API_BASE_URL = 'http://localhost:5000/api';

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [strandFilter, setStrandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userTestHistory, setUserTestHistory] = useState([]);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    strand: 'STEM',
    gwa: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, search, strandFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/users`);
      setUsers(response.data.users || []);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (search) {
      filtered = filtered.filter(u =>
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (strandFilter) {
      filtered = filtered.filter(u => u.strand === strandFilter);
    }

    if (statusFilter === 'active') {
      filtered = filtered.filter(u => u.is_active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(u => !u.is_active);
    }

    setFilteredUsers(filtered);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/users`, formData);
      setFormData({ full_name: '', email: '', strand: 'STEM', gwa: '' });
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/users/${userId}`);
      fetchUsers();
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const handleViewDetails = async (user) => {
    setSelectedUser(user);
    try {
      const response = await axios.get(`${API_BASE_URL}/users/${user.user_id}/test-history`);
      setUserTestHistory(response.data.test_history || []);
      setShowDetailModal(true);
    } catch (err) {
      setError('Failed to load user details');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await axios.patch(`${API_BASE_URL}/users/${userId}/status`, {
        is_active: !currentStatus
      });
      fetchUsers();
      setShowDetailModal(false);
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getInactivityDays = (lastActive) => {
    if (!lastActive) return 'Never';
    const lastActiveDate = new Date(lastActive);
    const now = new Date();
    const diffMs = now - lastActiveDate;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return diffMins === 0 ? 'Just now' : `${diffMins} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return diffDays === 0 ? 'Today' : `${diffDays}d ago`;
    }
  };

  const getOnlineStatus = (lastActive) => {
    if (!lastActive) return 'Offline';
    const lastActiveDate = new Date(lastActive);
    const now = new Date();
    const diffMins = Math.floor((now - lastActiveDate) / (1000 * 60));
    // Online if logged in within last 30 minutes
    return diffMins < 30 ? 'Online' : 'Offline';
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1><i className="fas fa-users"></i> Users Management</h1>
        <p>Manage student accounts and profiles</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      <div className="filter-section">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select
          value={strandFilter}
          onChange={(e) => setStrandFilter(e.target.value)}
          className="strand-select"
        >
          <option value="">All Strands</option>
          <option value="STEM">STEM</option>
          <option value="HUMSS">HUMSS</option>
          <option value="ABM">ABM</option>
          <option value="TVL">TVL</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-select"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="fas fa-plus"></i> Add User
        </button>
      </div>

      {loading ? (
        <div className="loading-center">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-inbox"></i>
          <p>No users found</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Strand</th>
                <th>GWA</th>
                <th>Tests Taken</th>
                <th>Last Active</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.user_id}>
                  <td><strong>{user.full_name}</strong></td>
                  <td>{user.email}</td>
                  <td><span className="badge">{user.strand}</span></td>
                  <td>{user.gwa || 'N/A'}</td>
                  <td className="text-center">{user.tests_taken || 0}</td>
                  <td className="text-sm">{getInactivityDays(user.last_login)}</td>
                  <td>
                    <span className={`status ${getOnlineStatus(user.last_login) === 'Online' ? 'active' : 'inactive'}`}>
                      {getOnlineStatus(user.last_login)}
                    </span>
                  </td>
                  <td className="actions">
                    <button 
                      className="btn btn-sm btn-info"
                      onClick={() => handleViewDetails(user)}
                      title="View details"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button className="btn btn-sm btn-secondary">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteUser(user.user_id)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showDetailModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fas fa-user-circle"></i> User Details</h2>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Name:</span>
                  <span className="value">{selectedUser.full_name}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Email:</span>
                  <span className="value">{selectedUser.email}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Strand:</span>
                  <span className="value"><span className="badge">{selectedUser.strand}</span></span>
                </div>
                <div className="detail-item">
                  <span className="label">GWA:</span>
                  <span className="value">{selectedUser.gwa || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Tests Taken:</span>
                  <span className="value">{selectedUser.tests_taken || 0}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Last Test:</span>
                  <span className="value">{selectedUser.last_test_date ? formatDate(selectedUser.last_test_date) : 'Never'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Last Login:</span>
                  <span className="value">{selectedUser.last_login ? formatDate(selectedUser.last_login) : 'Never'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Online Status:</span>
                  <span className={`status ${getOnlineStatus(selectedUser.last_login) === 'Online' ? 'active' : 'inactive'}`}>
                    {getOnlineStatus(selectedUser.last_login)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Account Status:</span>
                  <span className={`status ${selectedUser.is_active ? 'active' : 'inactive'}`}>
                    {selectedUser.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="test-history" style={{marginTop: '30px'}}>
                <h3><i className="fas fa-history"></i> Test History</h3>
                {userTestHistory.length === 0 ? (
                  <p className="empty-text">No tests taken yet</p>
                ) : (
                  <div className="history-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Test Name</th>
                          <th>Score</th>
                          <th>Percentage</th>
                          <th>Date Taken</th>
                          <th>Time Taken</th>
                          <th>Recommended Course</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userTestHistory.map((attempt) => (
                          <tr key={attempt.attempt_id}>
                            <td>{attempt.test_name}</td>
                            <td>{attempt.score}/{attempt.total_questions}</td>
                            <td>
                              <span className={`percentage ${attempt.percentage >= 75 ? 'good' : attempt.percentage >= 50 ? 'fair' : 'poor'}`}>
                                {attempt.percentage}%
                              </span>
                            </td>
                            <td>{formatDate(attempt.attempt_date)}</td>
                            <td>{attempt.time_taken ? `${attempt.time_taken} min` : 'N/A'}</td>
                            <td><span className="badge" style={{background: '#2ecc71'}}>{attempt.recommended_course || 'Pending'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {userTestHistory.length > 0 && (
                <div className="test-details" style={{marginTop: '30px'}}>
                  <h3><i className="fas fa-book-open"></i> Test Details & Recommendations</h3>
                  {userTestHistory.map((attempt) => (
                    <div key={attempt.attempt_id} className="test-detail-card" style={{
                      background: '#2a3f5f',
                      padding: '15px',
                      borderRadius: '8px',
                      marginBottom: '15px',
                      borderLeft: `4px solid ${attempt.percentage >= 75 ? '#2ecc71' : attempt.percentage >= 50 ? '#f39c12' : '#e74c3c'}`
                    }}>
                      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '12px'}}>
                        <div>
                          <strong>{attempt.test_name}</strong>
                          <p style={{fontSize: '12px', color: '#94a3b8', margin: '5px 0 0 0'}}>
                            {formatDate(attempt.attempt_date)}
                          </p>
                        </div>
                        <div>
                          <span style={{fontSize: '14px', color: '#94a3b8'}}>Score: </span>
                          <span style={{fontSize: '16px', fontWeight: 'bold', color: '#3498db'}}>
                            {attempt.score}/{attempt.total_questions} ({attempt.percentage}%)
                          </span>
                        </div>
                      </div>
                      <div style={{borderTop: '1px solid #334155', paddingTop: '12px'}}>
                        <p style={{margin: '0 0 8px 0', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600'}}>
                          Recommended Course
                        </p>
                        <p style={{margin: '0 0 8px 0', fontSize: '14px', color: '#2ecc71', fontWeight: '600'}}>
                          {attempt.recommended_course}
                        </p>
                        {attempt.recommendation_reason && attempt.recommendation_reason !== 'N/A' && (
                          <>
                            <p style={{margin: '8px 0', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600'}}>
                              Reason
                            </p>
                            <p style={{margin: '0', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5'}}>
                              {attempt.recommendation_reason}
                            </p>
                          </>
                        )}
                        {attempt.confidence_score > 0 && (
                          <p style={{margin: '8px 0 0 0', fontSize: '12px', color: '#94a3b8'}}>
                            Confidence: <span style={{color: '#3498db', fontWeight: '600'}}>{(attempt.confidence_score * 100).toFixed(1)}%</span>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className={`btn ${selectedUser.is_active ? 'btn-warning' : 'btn-success'}`}
                onClick={() => handleToggleStatus(selectedUser.user_id, selectedUser.is_active)}
              >
                <i className={`fas fa-${selectedUser.is_active ? 'ban' : 'check'}`}></i>
                {selectedUser.is_active ? 'Deactivate Account' : 'Activate Account'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fas fa-user-plus"></i> Add New User</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Strand</label>
                  <select
                    value={formData.strand}
                    onChange={(e) => setFormData({ ...formData, strand: e.target.value })}
                  >
                    <option value="STEM">STEM</option>
                    <option value="HUMSS">HUMSS</option>
                    <option value="ABM">ABM</option>
                    <option value="TVL">TVL</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>GWA (General Weighted Average)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.gwa}
                    onChange={(e) => setFormData({ ...formData, gwa: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersPage;
