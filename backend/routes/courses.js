const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../models/database');

const router = express.Router();

// Get all courses with pagination and search
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', strand = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM courses WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM courses WHERE 1=1';
    const params = [];
    const countParams = [];
    let paramIndex = 1;

    // Add search filter
    if (search) {
      query += ` AND (course_name ILIKE $${paramIndex} OR description ILIKE $${paramIndex + 1})`;
      countQuery += ` AND (course_name ILIKE $${paramIndex} OR description ILIKE $${paramIndex + 1})`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
      countParams.push(searchParam, searchParam);
      paramIndex += 2;
    }

    // Add strand filter
    if (strand) {
      query += ` AND required_strand = $${paramIndex}`;
      countQuery += ` AND required_strand = $${paramIndex}`;
      params.push(strand);
      countParams.push(strand);
      paramIndex += 1;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const courses = await pool.query(query, params);
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      courses: courses.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses', message: error.message });
  }
});

// Get course by ID
router.get('/:id', async (req, res) => {
  try {
    const courses = await pool.query('SELECT * FROM courses WHERE course_id = $1', [req.params.id]);

    if (courses.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(courses.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch course', message: error.message });
  }
});

// Create new course
router.post('/', [
  body('course_name').notEmpty().withMessage('Course name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('required_strand').notEmpty().withMessage('Required strand is required'),
  body('minimum_gwa').isFloat({ min: 75, max: 100 }).withMessage('Minimum GWA must be between 75 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { course_name, description, required_strand, minimum_gwa } = req.body;

    const result = await pool.query(
      'INSERT INTO courses (course_name, description, required_strand, minimum_gwa) VALUES ($1, $2, $3, $4) RETURNING course_id',
      [course_name, description, required_strand, minimum_gwa]
    );

    res.status(201).json({
      message: 'Course created successfully',
      course_id: result.rows[0].course_id
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create course', message: error.message });
  }
});

// Update course
router.put('/:id', [
  body('course_name').optional().notEmpty().withMessage('Course name cannot be empty'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty'),
  body('required_strand').optional().notEmpty().withMessage('Required strand cannot be empty'),
  body('minimum_gwa').optional().isFloat({ min: 75, max: 100 }).withMessage('Minimum GWA must be between 75 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { course_name, description, required_strand, minimum_gwa } = req.body;

    const result = await pool.query(
      'UPDATE courses SET course_name = COALESCE($1, course_name), description = COALESCE($2, description), required_strand = COALESCE($3, required_strand), minimum_gwa = COALESCE($4, minimum_gwa), updated_at = NOW() WHERE course_id = $5',
      [course_name, description, required_strand, minimum_gwa, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ message: 'Course updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update course', message: error.message });
  }
});

// Delete course
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM courses WHERE course_id = $1', [req.params.id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete course', message: error.message });
  }
});

// Get course statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalCourses = await pool.query('SELECT COUNT(*) as count FROM courses');
    
    const strandDistribution = await pool.query(`
      SELECT required_strand as strand, COUNT(*) as count
      FROM courses
      GROUP BY required_strand
    `);

    const popularCourses = await pool.query(`
      SELECT 
        c.course_name,
        c.course_id,
        COUNT(r.recommendation_id) as recommendation_count,
        COUNT(CASE WHEN r.status = 'accepted' THEN 1 END) as accepted_count,
        ROUND((COUNT(CASE WHEN r.status = 'accepted' THEN 1 END)::numeric / NULLIF(COUNT(r.recommendation_id), 0)) * 100, 2) as acceptance_rate
      FROM courses c
      LEFT JOIN recommendations r ON c.course_id = r.course_id
      GROUP BY c.course_id, c.course_name
      ORDER BY recommendation_count DESC
      LIMIT 10
    `);

    res.json({
      total_courses: parseInt(totalCourses.rows[0].count),
      strand_distribution: strandDistribution.rows.reduce((acc, item) => {
        acc[item.strand] = item.count;
        return acc;
      }, {}),
      popular_courses: popularCourses.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch course statistics', message: error.message });
  }
});

// Get courses by strand
router.get('/strand/:strand', async (req, res) => {
  try {
    const courses = await pool.query(
      'SELECT * FROM courses WHERE required_strand = $1 ORDER BY course_name',
      [req.params.strand]
    );

    res.json(courses.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses by strand', message: error.message });
  }
});

module.exports = router;