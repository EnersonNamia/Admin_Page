const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../models/database');

const router = express.Router();

// Get all recommendations with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', user_id = '', course_id = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        r.*,
        u.full_name as user_name,
        u.email as user_email,
        c.course_name,
        c.required_strand
      FROM recommendations r
      JOIN users u ON r.user_id = u.user_id
      JOIN courses c ON r.course_id = c.course_id
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM recommendations r WHERE 1=1';
    const params = [];
    const countParams = [];
    let paramIndex = 1;

    // Add status filter
    if (status) {
      query += ` AND r.status = $${paramIndex}`;
      countQuery += ` AND status = $${paramIndex}`;
      params.push(status);
      countParams.push(status);
      paramIndex += 1;
    }

    // Add user filter
    if (user_id) {
      query += ` AND r.user_id = $${paramIndex}`;
      countQuery += ` AND user_id = $${paramIndex}`;
      params.push(user_id);
      countParams.push(user_id);
      paramIndex += 1;
    }

    // Add course filter
    if (course_id) {
      query += ` AND r.course_id = $${paramIndex}`;
      countQuery += ` AND course_id = $${paramIndex}`;
      params.push(course_id);
      countParams.push(course_id);
      paramIndex += 1;
    }

    query += ` ORDER BY r.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const recommendations = await pool.query(query, params);
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      recommendations: recommendations.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recommendations', message: error.message });
  }
});

// Get recommendation by ID
router.get('/:id', async (req, res) => {
  try {
    const recommendations = await pool.query(`
      SELECT 
        r.*,
        u.full_name as user_name,
        u.email as user_email,
        u.gwa,
        u.strand,
        c.course_name,
        c.description as course_description,
        c.required_strand,
        c.minimum_gwa
      FROM recommendations r
      JOIN users u ON r.user_id = u.user_id
      JOIN courses c ON r.course_id = c.course_id
      WHERE r.recommendation_id = $1
    `, [req.params.id]);

    if (recommendations.rows.length === 0) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    res.json(recommendations.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recommendation', message: error.message });
  }
});

// Create new recommendation
router.post('/', [
  body('user_id').isInt().withMessage('Valid user ID is required'),
  body('course_id').isInt().withMessage('Valid course ID is required'),
  body('confidence_score').isFloat({ min: 0, max: 100 }).withMessage('Confidence score must be between 0 and 100'),
  body('reasoning').notEmpty().withMessage('Reasoning is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { user_id, course_id, confidence_score, reasoning } = req.body;

    // Check if user exists
    const users = await pool.query('SELECT user_id FROM users WHERE user_id = $1', [user_id]);
    if (users.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if course exists
    const courses = await pool.query('SELECT course_id FROM courses WHERE course_id = $1', [course_id]);
    if (courses.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const result = await pool.query(
      'INSERT INTO recommendations (user_id, course_id, confidence_score, reasoning, status) VALUES ($1, $2, $3, $4, $5) RETURNING recommendation_id',
      [user_id, course_id, confidence_score, reasoning, 'pending']
    );

    res.status(201).json({
      message: 'Recommendation created successfully',
      recommendation_id: result.rows[0].recommendation_id
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create recommendation', message: error.message });
  }
});

// Update recommendation status
router.put('/:id/status', [
  body('status').isIn(['pending', 'accepted', 'rejected']).withMessage('Status must be pending, accepted, or rejected')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;

    const result = await pool.query(
      'UPDATE recommendations SET status = $1, updated_at = NOW() WHERE recommendation_id = $2',
      [status, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    res.json({ message: 'Recommendation status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update recommendation status', message: error.message });
  }
});

// Delete recommendation
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM recommendations WHERE recommendation_id = $1', [req.params.id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    res.json({ message: 'Recommendation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete recommendation', message: error.message });
  }
});

// Get recommendation statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalRecommendations = await pool.query('SELECT COUNT(*) as count FROM recommendations');
    
    const statusDistribution = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM recommendations
      GROUP BY status
    `);

    const courseRecommendations = await pool.query(`
      SELECT 
        c.course_name,
        c.course_id,
        COUNT(r.recommendation_id) as total_recommendations,
        COUNT(CASE WHEN r.status = 'accepted' THEN 1 END) as accepted_count,
        COUNT(CASE WHEN r.status = 'rejected' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN r.status = 'pending' THEN 1 END) as pending_count,
        ROUND(AVG(r.confidence_score)::numeric, 2) as avg_confidence
      FROM courses c
      LEFT JOIN recommendations r ON c.course_id = r.course_id
      GROUP BY c.course_id, c.course_name
      HAVING COUNT(r.recommendation_id) > 0
      ORDER BY total_recommendations DESC
      LIMIT 10
    `);

    const confidenceStats = await pool.query(`
      SELECT 
        ROUND(AVG(confidence_score)::numeric, 2) as avg_confidence,
        MIN(confidence_score) as min_confidence,
        MAX(confidence_score) as max_confidence,
        ROUND(STDDEV(confidence_score)::numeric, 2) as std_confidence
      FROM recommendations
    `);

    const recentActivity = await pool.query(`
      SELECT 
        r.recommendation_id,
        u.full_name as user_name,
        c.course_name,
        r.status,
        r.confidence_score,
        r.created_at
      FROM recommendations r
      JOIN users u ON r.user_id = u.user_id
      JOIN courses c ON r.course_id = c.course_id
      ORDER BY r.created_at DESC
      LIMIT 10
    `);

    res.json({
      total_recommendations: parseInt(totalRecommendations.rows[0].count),
      status_distribution: statusDistribution.rows.reduce((acc, item) => {
        acc[item.status] = item.count;
        return acc;
      }, {}),
      course_recommendations: courseRecommendations.rows,
      confidence_stats: confidenceStats.rows[0],
      recent_activity: recentActivity.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recommendation statistics', message: error.message });
  }
});

// Get recommendations by user
router.get('/user/:userId', async (req, res) => {
  try {
    const recommendations = await pool.query(`
      SELECT 
        r.*,
        c.course_name,
        c.required_strand,
        c.minimum_gwa
      FROM recommendations r
      JOIN courses c ON r.course_id = c.course_id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
    `, [req.params.userId]);

    res.json(recommendations.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user recommendations', message: error.message });
  }
});

// Get recommendations by course
router.get('/course/:courseId', async (req, res) => {
  try {
    const recommendations = await pool.query(`
      SELECT 
        r.*,
        u.full_name as user_name,
        u.email as user_email,
        u.strand,
        u.gwa
      FROM recommendations r
      JOIN users u ON r.user_id = u.user_id
      WHERE r.course_id = $1
      ORDER BY r.created_at DESC
    `, [req.params.courseId]);

    res.json(recommendations.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch course recommendations', message: error.message });
  }
});

// Generate recommendations for user
router.post('/generate', [
  body('user_id').isInt().withMessage('Valid user ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { user_id } = req.body;

    // Get user details
    const users = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
    if (users.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users.rows[0];

    // Get eligible courses based on user's GWA and strand
    const courses = await pool.query(`
      SELECT * FROM courses 
      WHERE required_strand = $1 AND minimum_gwa <= $2
      ORDER BY minimum_gwa DESC
    `, [user.strand, user.gwa]);

    if (courses.rows.length === 0) {
      return res.status(404).json({ error: 'No eligible courses found for this user' });
    }

    // Create recommendations with confidence scores
    const recommendations = [];
    for (const course of courses.rows) {
      // Simple confidence calculation based on GWA difference
      const gwaBuffer = user.gwa - course.minimum_gwa;
      let confidence = Math.min(95, 60 + (gwaBuffer * 2)); // Base 60% + bonus for higher GWA
      
      const reasoning = `Student meets requirements with GWA of ${user.gwa} (required: ${course.minimum_gwa}) and matching strand (${user.strand}).`;

      const result = await pool.query(
        'INSERT INTO recommendations (user_id, course_id, confidence_score, reasoning, status) VALUES ($1, $2, $3, $4, $5) RETURNING recommendation_id',
        [user_id, course.course_id, confidence, reasoning, 'pending']
      );

      recommendations.push({
        recommendation_id: result.rows[0].recommendation_id,
        course_name: course.course_name,
        confidence_score: confidence
      });
    }

    res.status(201).json({
      message: `Generated ${recommendations.length} recommendations for ${user.full_name}`,
      recommendations
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate recommendations', message: error.message });
  }
});

module.exports = router;