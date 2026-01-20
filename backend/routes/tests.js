const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../models/database');

const router = express.Router();

// Get all tests with pagination and search
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM tests WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM tests WHERE 1=1';
    const params = [];
    const countParams = [];
    let paramIndex = 1;

    // Add search filter
    if (search) {
      query += ` AND test_name ILIKE $${paramIndex}`;
      countQuery += ` AND test_name ILIKE $${paramIndex}`;
      const searchParam = `%${search}%`;
      params.push(searchParam);
      countParams.push(searchParam);
      paramIndex += 1;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const tests = await pool.query(query, params);
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      tests: tests.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tests', message: error.message });
  }
});

// Get test by ID with questions and options
router.get('/:id', async (req, res) => {
  try {
    const tests = await pool.query('SELECT * FROM tests WHERE test_id = $1', [req.params.id]);

    if (tests.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const questions = await pool.query(
      'SELECT * FROM questions WHERE test_id = $1 ORDER BY question_order',
      [req.params.id]
    );

    // Get options for each question
    const questionsWithOptions = await Promise.all(questions.rows.map(async (question) => {
      const options = await pool.query(
        'SELECT * FROM options WHERE question_id = $1 ORDER BY option_order',
        [question.question_id]
      );
      return { ...question, options: options.rows };
    }));

    res.json({
      ...tests.rows[0],
      questions: questionsWithOptions
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch test', message: error.message });
  }
});

// Create new test
router.post('/', [
  body('test_name').notEmpty().withMessage('Test name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('questions').isArray({ min: 1 }).withMessage('At least one question is required'),
  body('questions.*.question_text').notEmpty().withMessage('Question text is required'),
  body('questions.*.trait_tag').notEmpty().withMessage('Trait tag is required'),
  body('questions.*.options').isArray({ min: 2 }).withMessage('At least two options are required'),
  body('questions.*.options.*.option_text').notEmpty().withMessage('Option text is required'),
  body('questions.*.options.*.trait_impact').isNumeric().withMessage('Trait impact must be a number')
], async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ errors: errors.array() });
    }

    const { test_name, description, questions } = req.body;

    // Create test
    const testResult = await client.query(
      'INSERT INTO tests (test_name, description) VALUES ($1, $2) RETURNING test_id',
      [test_name, description]
    );
    const testId = testResult.rows[0].test_id;

    // Create questions and options
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      const questionResult = await client.query(
        'INSERT INTO questions (test_id, question_text, trait_tag, question_order) VALUES ($1, $2, $3, $4) RETURNING question_id',
        [testId, question.question_text, question.trait_tag, i + 1]
      );
      const questionId = questionResult.rows[0].question_id;

      // Create options for this question
      for (let j = 0; j < question.options.length; j++) {
        const option = question.options[j];
        
        await client.query(
          'INSERT INTO options (question_id, option_text, trait_impact, option_order) VALUES ($1, $2, $3, $4)',
          [questionId, option.option_text, option.trait_impact, j + 1]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Test created successfully',
      test_id: testId
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to create test', message: error.message });
  } finally {
    client.release();
  }
});

// Update test
router.put('/:id', [
  body('test_name').optional().notEmpty().withMessage('Test name cannot be empty'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { test_name, description } = req.body;

    const result = await pool.query(
      'UPDATE tests SET test_name = COALESCE($1, test_name), description = COALESCE($2, description), updated_at = NOW() WHERE test_id = $3',
      [test_name, description, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    res.json({ message: 'Test updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update test', message: error.message });
  }
});

// Delete test
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM tests WHERE test_id = $1', [req.params.id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete test', message: error.message });
  }
});

// Get test statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalTests = await pool.query('SELECT COUNT(*) as count FROM tests');
    const totalQuestions = await pool.query('SELECT COUNT(*) as count FROM questions');

    const traitDistribution = await pool.query(`
      SELECT trait_tag, COUNT(*) as count
      FROM questions
      GROUP BY trait_tag
    `);

    const questionStats = await pool.query(`
      SELECT 
        t.test_name,
        t.test_id,
        COUNT(q.question_id) as question_count
      FROM tests t
      LEFT JOIN questions q ON t.test_id = q.test_id
      GROUP BY t.test_id, t.test_name
      ORDER BY question_count DESC
    `);

    res.json({
      total_tests: parseInt(totalTests.rows[0].count),
      total_questions: parseInt(totalQuestions.rows[0].count),
      trait_distribution: traitDistribution.rows.reduce((acc, item) => {
        acc[item.trait_tag] = item.count;
        return acc;
      }, {}),
      question_stats: questionStats.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch test statistics', message: error.message });
  }
});

// Get questions for a specific test
router.get('/:id/questions', async (req, res) => {
  try {
    const questions = await pool.query(
      'SELECT * FROM questions WHERE test_id = $1 ORDER BY question_order',
      [req.params.id]
    );

    res.json(questions.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch questions', message: error.message });
  }
});

// Add question to test
router.post('/:id/questions', [
  body('question_text').notEmpty().withMessage('Question text is required'),
  body('trait_tag').notEmpty().withMessage('Trait tag is required'),
  body('options').isArray({ min: 2 }).withMessage('At least two options are required'),
  body('options.*.option_text').notEmpty().withMessage('Option text is required'),
  body('options.*.trait_impact').isNumeric().withMessage('Trait impact must be a number')
], async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ errors: errors.array() });
    }

    const { question_text, trait_tag, options } = req.body;
    const testId = req.params.id;

    // Get the next question order
    const orderResult = await client.query(
      'SELECT COALESCE(MAX(question_order), 0) + 1 as next_order FROM questions WHERE test_id = $1',
      [testId]
    );
    const questionOrder = orderResult.rows[0].next_order;

    // Create question
    const questionResult = await client.query(
      'INSERT INTO questions (test_id, question_text, trait_tag, question_order) VALUES ($1, $2, $3, $4) RETURNING question_id',
      [testId, question_text, trait_tag, questionOrder]
    );
    const questionId = questionResult.rows[0].question_id;

    // Create options
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      
      await client.query(
        'INSERT INTO options (question_id, option_text, trait_impact, option_order) VALUES ($1, $2, $3, $4)',
        [questionId, option.option_text, option.trait_impact, i + 1]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Question added successfully',
      question_id: questionId
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to add question', message: error.message });
  } finally {
    client.release();
  }
});

// Delete question
router.delete('/questions/:questionId', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM questions WHERE question_id = $1', [req.params.questionId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete question', message: error.message });
  }
});

module.exports = router;