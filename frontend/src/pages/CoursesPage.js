import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CoursesPage.css';

const API_BASE_URL = 'http://localhost:5000/api';

function CoursesPage() {
  const [courses, setCoursesData] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    course_name: '',
    course_code: '',
    description: '',
    strand: 'STEM',
    credits: '',
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, search]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/courses`);
      setCoursesData(response.data.rows || []);
    } catch (err) {
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;
    if (search) {
      filtered = filtered.filter(c =>
        c.course_name.toLowerCase().includes(search.toLowerCase()) ||
        c.course_code.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredCourses(filtered);
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/courses`, formData);
      setFormData({ course_name: '', course_code: '', description: '', strand: 'STEM', credits: '' });
      setShowModal(false);
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add course');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/courses/${courseId}`);
      fetchCourses();
    } catch (err) {
      setError('Failed to delete course');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1><i className="fas fa-book"></i> Courses Management</h1>
        <p>Manage available college courses</p>
      </div>

      {error && <div className="alert alert-error"><i className="fas fa-exclamation-circle"></i>{error}</div>}

      <div className="filter-section">
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="fas fa-plus"></i> Add Course
        </button>
      </div>

      {loading ? (
        <div className="loading-center">
          <div className="spinner"></div>
          <p>Loading courses...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-inbox"></i>
          <p>No courses found</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Name</th>
                <th>Strand</th>
                <th>Credits</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course) => (
                <tr key={course.course_id}>
                  <td><strong>{course.course_code}</strong></td>
                  <td>{course.course_name}</td>
                  <td><span className="badge">{course.strand}</span></td>
                  <td>{course.credits || 'N/A'}</td>
                  <td className="actions">
                    <button className="btn btn-sm btn-secondary"><i className="fas fa-edit"></i></button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteCourse(course.course_id)}>
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
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
              <h2><i className="fas fa-book-plus"></i> Add New Course</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleAddCourse}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Course Code</label>
                  <input type="text" value={formData.course_code} onChange={(e) => setFormData({ ...formData, course_code: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Course Name</label>
                  <input type="text" value={formData.course_name} onChange={(e) => setFormData({ ...formData, course_name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Strand</label>
                  <select value={formData.strand} onChange={(e) => setFormData({ ...formData, strand: e.target.value })}>
                    <option value="STEM">STEM</option>
                    <option value="HUMSS">HUMSS</option>
                    <option value="ABM">ABM</option>
                    <option value="TVL">TVL</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Credits</label>
                  <input type="number" value={formData.credits} onChange={(e) => setFormData({ ...formData, credits: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Course</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoursesPage;
