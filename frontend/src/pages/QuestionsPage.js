import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './QuestionsPage.css';

const API_BASE_URL = 'http://localhost:5000/api';

function QuestionsPage() {
  const [questions, setQuestionsData] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [testFilter, setTestFilter] = useState('');
  const [tests, setTests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState('table');
  const [formData, setFormData] = useState({
    test_id: '',
    question_text: '',
    question_order: 1,
    question_type: 'multiple_choice',
  });

  useEffect(() => {
    fetchQuestions();
    fetchTests();
  }, [page, pageSize]);

  useEffect(() => {
    filterQuestions();
  }, [questions, search, testFilter]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/tests/questions/list/all`, {
        params: {
          page: page,
          limit: pageSize,
          test_id: testFilter || undefined
        }
      });
      setQuestionsData(response.data.questions || []);
      setTotalPages(response.data.pagination.pages || 1);
    } catch (err) {
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const fetchTests = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tests?limit=100`);
      setTests(response.data.tests || []);
    } catch (err) {
      console.error('Failed to load tests');
    }
  };

  const filterQuestions = () => {
    let filtered = questions;
    if (search) {
      filtered = filtered.filter(q =>
        q.question_text.toLowerCase().includes(search.toLowerCase()) ||
        q.test_name.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredQuestions(filtered);
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/tests/questions`, formData);
      setFormData({ test_id: '', question_text: '', question_order: 1, question_type: 'multiple_choice' });
      setShowModal(false);
      fetchQuestions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add question');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question and all its options?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/tests/questions/${questionId}`);
      fetchQuestions();
      setShowDetailModal(false);
    } catch (err) {
      setError('Failed to delete question');
    }
  };

  const handleViewDetails = async (question) => {
    setSelectedQuestion(question);
    setShowDetailModal(true);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1><i className="fas fa-question-circle"></i> Questions Management</h1>
        <p>Manage test questions and answers</p>
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
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select
          value={testFilter}
          onChange={(e) => { setTestFilter(e.target.value); setPage(1); }}
          className="test-select"
        >
          <option value="">All Tests</option>
          {tests.map(test => (
            <option key={test.test_id} value={test.test_id}>{test.test_name}</option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="fas fa-plus"></i> Add Question
        </button>
      </div>

      <div className="page-size-selector" style={{marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center'}}>
        <label>Show:</label>
        <select value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1); }} style={{padding: '5px 10px'}}>
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
        <div style={{marginLeft: 'auto', display: 'flex', gap: '5px'}}>
          <button 
            className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('table')}
          >
            <i className="fas fa-table"></i> Table
          </button>
          <button 
            className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('grid')}
          >
            <i className="fas fa-th"></i> Grid
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-center">
          <div className="spinner"></div>
          <p>Loading questions...</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-inbox"></i>
          <p>No questions found</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Question</th>
                <th>Type</th>
                <th>Options</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((question) => (
                <tr key={question.question_id}>
                  <td><span className="badge">{question.test_name}</span></td>
                  <td className="question-text">{question.question_text}</td>
                  <td><span className="type-badge">{question.question_type}</span></td>
                  <td className="text-center">{question.option_count}</td>
                  <td className="text-center">{question.question_order}</td>
                  <td className="actions">
                    <button 
                      className="btn btn-sm btn-info"
                      onClick={() => handleViewDetails(question)}
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteQuestion(question.question_id)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="questions-grid">
          {filteredQuestions.map((question) => (
            <div key={question.question_id} className="question-card">
              <div className="question-card-header">
                <span className="badge">{question.test_name}</span>
                <span className="type-badge">{question.question_type}</span>
              </div>
              <div className="question-card-body">
                <p className="question-text">{question.question_text}</p>
                <div className="question-meta">
                  <span>Q {question.question_order}</span>
                  <span>{question.option_count} options</span>
                </div>
              </div>
              <div className="question-card-footer">
                <button 
                  className="btn btn-sm btn-info"
                  onClick={() => handleViewDetails(question)}
                >
                  <i className="fas fa-eye"></i> View
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDeleteQuestion(question.question_id)}
                >
                  <i className="fas fa-trash"></i> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination" style={{marginTop: '20px', display: 'flex', gap: '5px', justifyContent: 'center', alignItems: 'center'}}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setPage(1)}
            disabled={page === 1}
          >
            First
          </button>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </button>
          <span style={{padding: '0 10px'}}>Page {page} of {totalPages}</span>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </button>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
          >
            Last
          </button>
        </div>
      )}

      {showDetailModal && selectedQuestion && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fas fa-question-circle"></i> Question Details</h2>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>Question</h3>
                <p className="question-display">{selectedQuestion.question_text}</p>
              </div>

              <div className="detail-section">
                <h3>Properties</h3>
                <div className="properties-grid">
                  <div className="property">
                    <span className="label">Test:</span>
                    <span className="value">{selectedQuestion.test_name}</span>
                  </div>
                  <div className="property">
                    <span className="label">Type:</span>
                    <span className="value"><span className="type-badge">{selectedQuestion.question_type}</span></span>
                  </div>
                  <div className="property">
                    <span className="label">Order:</span>
                    <span className="value">Question {selectedQuestion.question_order}</span>
                  </div>
                  <div className="property">
                    <span className="label">Options:</span>
                    <span className="value">{selectedQuestion.option_count} options</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-danger"
                onClick={() => handleDeleteQuestion(selectedQuestion.question_id)}
              >
                <i className="fas fa-trash"></i> Delete Question
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
              <h2><i className="fas fa-plus-circle"></i> Add New Question</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleAddQuestion}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Test</label>
                  <select
                    value={formData.test_id}
                    onChange={(e) => setFormData({ ...formData, test_id: parseInt(e.target.value) })}
                    required
                  >
                    <option value="">Choose a test...</option>
                    {tests.map(test => (
                      <option key={test.test_id} value={test.test_id}>{test.test_name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Question Text</label>
                  <textarea
                    value={formData.question_text}
                    onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                    placeholder="Enter the question..."
                    required
                    rows="4"
                  ></textarea>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Question Type</label>
                    <select
                      value={formData.question_type}
                      onChange={(e) => setFormData({ ...formData, question_type: e.target.value })}
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="true_false">True/False</option>
                      <option value="short_answer">Short Answer</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Question Order</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.question_order}
                      onChange={(e) => setFormData({ ...formData, question_order: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuestionsPage;
