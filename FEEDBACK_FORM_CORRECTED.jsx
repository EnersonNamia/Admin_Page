import React, { useState } from 'react';
import './FeedbackForm.css';

function FeedbackForm({ recommendation, userId, onSubmit, onClose }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isOverallFeedback = recommendation?.overall === true;
  
  console.log('[FeedbackForm] userId from props:', userId);
  console.log('[FeedbackForm] isOverallFeedback:', isOverallFeedback);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setLoading(true);

    try {
      // CORRECTED: Use correct backend URL and endpoint path
      const backendUrl = 'http://localhost:5000/api/feedback/submit';
      
      const payload = isOverallFeedback 
        ? { 
            rating: rating, 
            feedback_text: feedbackText || null,
            user_id: userId || null
          }
        : {
            recommendation_id: recommendation.recommendation_id,
            user_id: userId || null,
            rating: rating,
            feedback_text: feedbackText || null
          };

      console.log('Sending feedback payload to:', backendUrl);
      console.log('Payload:', payload);

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('[FeedbackForm] Response status:', response.status);
      console.log('[FeedbackForm] Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('[FeedbackForm] Success response:', data);
        setSubmitted(true);
        if (onSubmit) {
          onSubmit(data);
        }
        // Auto close after 5 seconds
        setTimeout(() => onClose && onClose(), 5000);
      } else {
        try {
          const errorData = await response.json();
          console.error('[FeedbackForm] Error response body:', errorData);
          alert(`Error submitting feedback: ${errorData.detail || 'Unknown error'}`);
        } catch(parseError) {
          console.error('[FeedbackForm] Error parsing response:', parseError);
          const responseText = await response.text();
          console.error('[FeedbackForm] Response text:', responseText);
          alert(`Error submitting feedback: HTTP ${response.status}`);
        }
      }
    } catch (error) {
      console.error('[FeedbackForm] Fetch error:', error);
      alert('Failed to submit feedback: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="feedback-form">
        <div className="feedback-success">
          <h3>✅ Thank You!</h3>
          <p>Your feedback helps us improve recommendations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-form">
      <div className="feedback-overlay" onClick={onClose}></div>
      <div className="feedback-modal">
        <div className="feedback-header">
          <h2>Rate This Recommendation</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="feedback-content">
          <div className="course-info">
            <h3>{isOverallFeedback ? 'Rate Your Recommendations' : recommendation.course_name}</h3>
            {!isOverallFeedback && <p>{recommendation.reasoning}</p>}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="rating-section">
              <label>{isOverallFeedback ? 'How helpful were these recommendations?' : 'How helpful was this recommendation?'}</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`star ${star <= (hoverRating || rating) ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    ★
                  </span>
                ))}
              </div>
              <div className="rating-labels">
                <span>Not helpful</span>
                <span className="current-rating">
                  {rating > 0 ? ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating - 1] : 'Select rating'}
                </span>
                <span>Very helpful</span>
              </div>
            </div>

            <div className="feedback-text-section">
              <label htmlFor="feedback">Additional Comments (Optional)</label>
              <textarea
                id="feedback"
                placeholder="Share your thoughts..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                maxLength={500}
              />
              <small>{feedbackText.length}/500 characters</small>
            </div>

            <div className="feedback-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Skip
              </button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default FeedbackForm;
