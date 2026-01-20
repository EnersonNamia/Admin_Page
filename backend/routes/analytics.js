const express = require('express');
const { db } = require('../models/database');

const router = express.Router();

// Get system analytics overview
router.get('/system/overview', async (req, res) => {
  try {
    // Total counts
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
    const courseCount = await pool.query('SELECT COUNT(*) as count FROM courses');
    const testCount = await pool.query('SELECT COUNT(*) as count FROM tests');
    const recommendationCount = await pool.query('SELECT COUNT(*) as count FROM recommendations');
    const questionCount = await pool.query('SELECT COUNT(*) as count FROM questions');

    // Recent activity (last 30 days)
    const recentUsers = await pool.query(`
      SELECT COUNT(*) as count FROM users 
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);
    const recentRecommendations = await pool.query(`
      SELECT COUNT(*) as count FROM recommendations 
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);

    // System performance metrics
    const recommendationAccuracy = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        ROUND((COUNT(CASE WHEN status = 'accepted' THEN 1 END)::numeric / COUNT(*)) * 100, 2) as acceptance_rate
      FROM recommendations
    `);

    res.json({
      system_overview: {
        total_users: parseInt(userCount.rows[0].count),
        total_courses: parseInt(courseCount.rows[0].count),
        total_tests: parseInt(testCount.rows[0].count),
        total_recommendations: parseInt(recommendationCount.rows[0].count),
        total_questions: parseInt(questionCount.rows[0].count)
      },
      recent_activity: {
        new_users_30d: parseInt(recentUsers.rows[0].count),
        new_recommendations_30d: parseInt(recentRecommendations.rows[0].count)
      },
      system_performance: recommendationAccuracy.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch system analytics', message: error.message });
  }
});

// Get user analytics
router.get('/users/analytics', async (req, res) => {
  try {
    // User distribution by strand
    const strandDistribution = await pool.query(`
      SELECT strand, COUNT(*) as count
      FROM users
      GROUP BY strand
      ORDER BY count DESC
    `);

    // GWA distribution
    const gwaDistribution = await pool.query(`
      SELECT 
        CASE 
          WHEN gwa >= 95 THEN '95-100'
          WHEN gwa >= 90 THEN '90-94'
          WHEN gwa >= 85 THEN '85-89'
          WHEN gwa >= 80 THEN '80-84'
          ELSE '75-79'
        END as gwa_range,
        COUNT(*) as count
      FROM users
      GROUP BY gwa_range
      ORDER BY gwa_range DESC
    `);

    // User registration trend (last 12 months)
    const registrationTrend = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month
    `);

    res.json({
      strand_distribution: strandDistribution.rows,
      gwa_distribution: gwaDistribution.rows,
      registration_trend: registrationTrend.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user analytics', message: error.message });
  }
});

// Get course analytics
router.get('/courses/analytics', async (req, res) => {
  try {
    // Course popularity (by recommendations)
    const coursePopularity = await pool.query(`
      SELECT 
        c.course_name,
        c.course_id,
        c.required_strand,
        COUNT(r.recommendation_id) as recommendation_count,
        COUNT(CASE WHEN r.status = 'accepted' THEN 1 END) as accepted_count,
        ROUND((COUNT(CASE WHEN r.status = 'accepted' THEN 1 END)::numeric / NULLIF(COUNT(r.recommendation_id), 0)) * 100, 2) as acceptance_rate,
        ROUND(AVG(r.confidence_score)::numeric, 2) as avg_confidence
      FROM courses c
      LEFT JOIN recommendations r ON c.course_id = r.course_id
      GROUP BY c.course_id, c.course_name, c.required_strand
      ORDER BY recommendation_count DESC
      LIMIT 20
    `);

    // Course distribution by strand
    const strandCourses = await pool.query(`
      SELECT required_strand, COUNT(*) as count
      FROM courses
      GROUP BY required_strand
      ORDER BY count DESC
    `);

    // Course recommendation trends (last 6 months)
    const recommendationTrends = await pool.query(`
      SELECT 
        TO_CHAR(r.created_at, 'YYYY-MM') as month,
        c.course_name,
        COUNT(*) as recommendations
      FROM recommendations r
      JOIN courses c ON r.course_id = c.course_id
      WHERE r.created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(r.created_at, 'YYYY-MM'), c.course_id, c.course_name
      ORDER BY month, recommendations DESC
    `);

    res.json({
      course_popularity: coursePopularity.rows,
      strand_distribution: strandCourses.rows,
      recommendation_trends: recommendationTrends.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch course analytics', message: error.message });
  }
});

// Get recommendation analytics
router.get('/recommendations/analytics', async (req, res) => {
  try {
    // Recommendation status breakdown
    const statusBreakdown = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM recommendations
      GROUP BY status
    `);

    // Confidence score distribution
    const confidenceDistribution = await pool.query(`
      SELECT 
        CASE 
          WHEN confidence_score >= 90 THEN '90-100%'
          WHEN confidence_score >= 80 THEN '80-89%'
          WHEN confidence_score >= 70 THEN '70-79%'
          WHEN confidence_score >= 60 THEN '60-69%'
          ELSE 'Below 60%'
        END as confidence_range,
        COUNT(*) as count
      FROM recommendations
      GROUP BY confidence_range
      ORDER BY confidence_range DESC
    `);

    // Monthly recommendation trends
    const monthlyTrends = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as total_recommendations,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
      FROM recommendations
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month
    `);

    // Top performing recommendations
    const topPerforming = await pool.query(`
      SELECT 
        u.full_name,
        c.course_name,
        r.confidence_score,
        r.status,
        r.created_at
      FROM recommendations r
      JOIN users u ON r.user_id = u.user_id
      JOIN courses c ON r.course_id = c.course_id
      WHERE r.status = 'accepted' AND r.confidence_score >= 85
      ORDER BY r.confidence_score DESC
      LIMIT 10
    `);

    res.json({
      status_breakdown: statusBreakdown.rows,
      confidence_distribution: confidenceDistribution.rows,
      monthly_trends: monthlyTrends.rows,
      top_performing: topPerforming.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recommendation analytics', message: error.message });
  }
});

// Get test analytics
router.get('/tests/analytics', async (req, res) => {
  try {
    // Test usage statistics
    const testStats = await pool.query(`
      SELECT 
        t.test_name,
        t.test_id,
        COUNT(q.question_id) as question_count,
        t.created_at
      FROM tests t
      LEFT JOIN questions q ON t.test_id = q.test_id
      GROUP BY t.test_id, t.test_name, t.created_at
      ORDER BY question_count DESC
    `);

    // Trait tag distribution
    const traitDistribution = await pool.query(`
      SELECT trait_tag, COUNT(*) as count
      FROM questions
      GROUP BY trait_tag
      ORDER BY count DESC
    `);

    // Question complexity analysis (by option count)
    const questionComplexity = await pool.query(`
      SELECT 
        CASE 
          WHEN option_count <= 2 THEN '2 options'
          WHEN option_count = 3 THEN '3 options'
          WHEN option_count = 4 THEN '4 options'
          WHEN option_count >= 5 THEN '5+ options'
        END as complexity_level,
        COUNT(*) as question_count
      FROM (
        SELECT 
          q.question_id,
          COUNT(o.option_id) as option_count
        FROM questions q
        LEFT JOIN options o ON q.question_id = o.question_id
        GROUP BY q.question_id
      ) as question_options
      GROUP BY complexity_level
      ORDER BY complexity_level
    `);

    res.json({
      test_statistics: testStats.rows,
      trait_distribution: traitDistribution.rows,
      question_complexity: questionComplexity.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch test analytics', message: error.message });
  }
});

// Get activity timeline
router.get('/activity/timeline', async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const activities = await pool.query(`
      SELECT 'user_registration' as activity_type, full_name as description, created_at
      FROM users
      WHERE created_at >= NOW() - INTERVAL '1 day' * $1
      
      UNION ALL
      
      SELECT 'recommendation_created' as activity_type, 
             CONCAT('Recommendation for ', u.full_name, ' -> ', c.course_name) as description,
             r.created_at
      FROM recommendations r
      JOIN users u ON r.user_id = u.user_id
      JOIN courses c ON r.course_id = c.course_id
      WHERE r.created_at >= NOW() - INTERVAL '1 day' * $1
      
      ORDER BY created_at DESC
      LIMIT 50
    `, [parseInt(days)]);

    res.json({
      activities: activities.rows,
      period_days: parseInt(days)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity timeline', message: error.message });
  }
});

// Get performance metrics
router.get('/performance/metrics', async (req, res) => {
  try {
    // System efficiency metrics
    const efficiency = await pool.query(`
      SELECT 
        COUNT(DISTINCT u.user_id) as active_users,
        COUNT(DISTINCT c.course_id) as recommended_courses,
        ROUND(AVG(r.confidence_score)::numeric, 2) as avg_confidence,
        ROUND((COUNT(CASE WHEN r.status = 'accepted' THEN 1 END)::numeric / COUNT(*)) * 100, 2) as success_rate
      FROM recommendations r
      JOIN users u ON r.user_id = u.user_id
      JOIN courses c ON r.course_id = c.course_id
      WHERE r.created_at >= NOW() - INTERVAL '30 days'
    `);

    // Response time simulation (would be actual metrics in production)
    const performanceMetrics = {
      avg_recommendation_time: '1.2s',
      system_uptime: '99.8%',
      database_performance: 'Excellent',
      recommendation_accuracy: efficiency.rows[0].success_rate + '%'
    };

    res.json({
      efficiency_metrics: efficiency.rows[0],
      performance_metrics: performanceMetrics
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch performance metrics', message: error.message });
  }
});

module.exports = router;