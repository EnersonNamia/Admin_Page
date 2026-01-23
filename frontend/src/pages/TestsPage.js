import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

function TestsPage() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ test_name: '', description: '' });

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/tests`);
      setTests(response.data.tests || []);
    } catch (err) {
      setError('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTest = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/tests`, formData);
      setFormData({ test_name: '', description: '' });
      setShowModal(false);
      fetchTests();
    } catch (err) {
      setError('Failed to add test');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1><i className="fas fa-clipboard-check"></i> Tests Management</h1>
        <p>Create and manage assessment tests</p>
      </div>

      {error && <div className="alert alert-error"><i className="fas fa-exclamation-circle"></i>{error}</div>}

      <div className="filter-section">
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="fas fa-plus"></i> Create Test
        </button>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner"></div><p>Loading tests...</p></div>
      ) : tests.length === 0 ? (
        <div className="empty-state"><i className="fas fa-inbox"></i><p>No tests created yet</p></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Test Name</th><th>Description</th><th>Created</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr key={test.test_id}>
                  <td><strong>{test.test_name}</strong></td>
                  <td>{test.description || 'N/A'}</td>
                  <td>{new Date(test.created_at).toLocaleDateString()}</td>
                  <td className="actions"><button className="btn btn-sm btn-secondary"><i className="fas fa-edit"></i></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fas fa-plus-circle"></i> Create Test</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleAddTest}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Test Name</label>
                  <input type="text" value={formData.test_name} onChange={(e) => setFormData({ ...formData, test_name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Test</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TestsPage;
