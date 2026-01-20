const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const { db } = require('../models/database');

const router = express.Router();

// Get all users with pagination and search
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', strand = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT user_id, full_name, email, strand, gwa, created_at FROM users WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const params = [];
    const countParams = [];
    let paramIndex = 1;

    // Add search filter
    if (search) {
      query += ` AND (full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex + 1})`;
      countQuery += ` AND (full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex + 1})`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
      countParams.push(searchParam, searchParam);
      paramIndex += 2;
    }

    // Add strand filter
    if (strand) {
      query += ` AND strand = $${paramIndex}`;
      countQuery += ` AND strand = $${paramIndex}`;
      params.push(strand);
      countParams.push(strand);
      paramIndex += 1;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const users = await pool.query(query, params);
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      users: users.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users', message: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const users = await pool.query(
      'SELECT user_id, full_name, email, strand, gwa, created_at FROM users WHERE user_id = $1',
      [req.params.id]
    );

    if (users.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user', message: error.message });
  }
});

// Create new user
router.post('/', [
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('strand').notEmpty().withMessage('Strand is required'),
  body('gwa').isFloat({ min: 75, max: 100 }).withMessage('GWA must be between 75 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { full_name, email, password, strand, gwa } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (full_name, email, password, strand, gwa) VALUES ($1, $2, $3, $4, $5) RETURNING user_id',
      [full_name, email, hashedPassword, strand, gwa]
    );

    res.status(201).json({
      message: 'User created successfully',
      user_id: result.rows[0].user_id
    });
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create user', message: error.message });
    }
  }
});

// Update user
router.put('/:id', [
  body('full_name').optional().notEmpty().withMessage('Full name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('strand').optional().notEmpty().withMessage('Strand cannot be empty'),
  body('gwa').optional().isFloat({ min: 75, max: 100 }).withMessage('GWA must be between 75 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { full_name, email, strand, gwa } = req.body;

    const result = await pool.query(
      'UPDATE users SET full_name = COALESCE($1, full_name), email = COALESCE($2, email), strand = COALESCE($3, strand), gwa = COALESCE($4, gwa) WHERE user_id = $5',
      [full_name, email, strand, gwa, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update user', message: error.message });
    }
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM users WHERE user_id = $1', [req.params.id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user', message: error.message });
  }
});

// Get user statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalUsers = await pool.query('SELECT COUNT(*) as count FROM users');
    
    const strandDistribution = await pool.query(`
      SELECT strand, COUNT(*) as count
      FROM users
      GROUP BY strand
    `);

    const gwaStats = await pool.query(`
      SELECT 
        ROUND(AVG(gwa)::numeric, 2) as average_gwa,
        MIN(gwa) as min_gwa,
        MAX(gwa) as max_gwa,
        COUNT(CASE WHEN gwa >= 95 THEN 1 END) as high_achievers
      FROM users
    `);

    const recentUsers = await pool.query(`
      SELECT full_name, email, strand, gwa, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `);

    res.json({
      total_users: parseInt(totalUsers.rows[0].count),
      strand_distribution: strandDistribution.rows.reduce((acc, item) => {
        acc[item.strand] = item.count;
        return acc;
      }, {}),
      gwa_statistics: gwaStats.rows[0],
      recent_users: recentUsers.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user statistics', message: error.message });
  }
});

module.exports = router;