# Student Feedback Submission - Implementation Guide

## ✅ What Was Added to Enable Feedback Submission

### Backend Changes

**New POST Endpoint**: `/api/feedback/submit`

**Location**: `backend_python/routes/feedback.py`

**Endpoint Details**:
```
POST /api/feedback/submit
Content-Type: application/json

Request Body:
{
  "recommendation_id": 1,      // ID of the recommendation being rated
  "user_id": 1,               // ID of the student submitting feedback
  "rating": 5,                // Star rating: 1-5
  "feedback_text": "Great course!"  // Optional comment (can be null/empty)
}

Response (Success):
{
  "success": true,
  "message": "Feedback submitted successfully",
  "feedback_id": 1,
  "created_at": "2024-01-23T10:30:00"
}

Response (Error):
{
  "detail": "Error message here"
}
```

### Request Validation

The endpoint validates:
- ✅ Rating must be between 1-5
- ✅ Recommendation must exist in database
- ✅ User must be a valid user_id
- ✅ Feedback text is optional (can be empty or null)

### CORS Configuration Updated

**File**: `backend_python/.env`

**Updated to allow**:
- `http://localhost:3000` (admin panel)
- `http://localhost:3001` (student app - primary)
- `http://localhost:3002` (alternate port)
- `http://127.0.0.1:3000`
- `http://127.0.0.1:3001`
- `http://127.0.0.1:3002`

This allows the student app to communicate with the backend from any of these localhost ports.

---

## 🔧 How to Use This Endpoint

### From Student App (JavaScript/Axios)

```javascript
const submitFeedback = async (recommendationId, userId, rating, feedbackText) => {
  try {
    const response = await axios.post(
      'http://localhost:5000/api/feedback/submit',
      {
        recommendation_id: recommendationId,
        user_id: userId,
        rating: rating,  // 1-5
        feedback_text: feedbackText || null
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Feedback submitted:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to submit feedback:', error.response?.data);
    throw error;
  }
};

// Usage in your rating modal:
handleSubmitFeedback = async () => {
  await submitFeedback(
    this.state.recommendationId,
    this.state.userId,
    this.state.rating,
    this.state.comments
  );
};
```

### From Student App (React Hooks)

```javascript
import axios from 'axios';

const handleFeedbackSubmit = async (recommendationId, userId, rating, feedback) => {
  try {
    const response = await axios.post(
      'http://localhost:5000/api/feedback/submit',
      {
        recommendation_id: recommendationId,
        user_id: userId,
        rating: rating,
        feedback_text: feedback
      }
    );
    
    alert('Thank you for your feedback!');
    closeModal();
  } catch (error) {
    alert('Failed to submit feedback. Please try again.');
  }
};
```

---

## 🎯 What Happens After Submission

1. **Data is Stored**: Feedback is saved to PostgreSQL `recommendation_feedback` table
2. **Timestamp Recorded**: `created_at` is automatically set to submission time
3. **Admin Access**: Feedback becomes immediately visible in admin panel `/feedback` page
4. **Filtering Available**: Admins can filter by rating, search by name/text

---

## 🐛 Troubleshooting Student Feedback Submission

### Error: "Failed to submit feedback"

**Possible Causes**:
1. **Backend not running**
   - Solution: Start backend with `python main.py`
   - Check: `http://localhost:5000/docs` should work

2. **CORS error in browser console**
   - Solution: Backend is updated to allow your student app's port
   - Make sure you're on one of these URLs:
     - `localhost:3000`
     - `localhost:3001`
     - `localhost:3002`

3. **Invalid rating value**
   - Solution: Ensure rating is integer between 1-5
   - Don't send rating as string like "5", use number: 5

4. **Recommendation doesn't exist**
   - Solution: Make sure recommendation_id is valid
   - Check using admin panel Recommendations page

5. **User doesn't exist**
   - Solution: Make sure user_id is valid student ID
   - Check using admin panel Users page

### Error: "Recommendation not found"
- The recommendation_id you're sending doesn't exist
- Go to Admin → Recommendations to find valid IDs

### Error: "Rating must be between 1 and 5"
- Validate rating before sending
- Use number type, not string

---

## 📊 Admin Panel Integration

After students submit feedback, admins can view it:

**Admin Panel**:
1. Click "Feedback" in sidebar (💬 icon)
2. View all submitted feedback with:
   - Star ratings (1-5)
   - Student names
   - Recommendation course names
   - Comments
   - Submission date/time
3. Filter by rating, search by name
4. View detailed feedback in modal

---

## 🔄 Data Flow

```
Student App
    ↓
[Rate Recommendation Modal]
    ↓
Click "Submit Feedback"
    ↓
POST /api/feedback/submit
    ↓
FastAPI Backend (feedback.py)
    ↓
Validation (rating 1-5, recommendation exists)
    ↓
PostgreSQL Database
    ↓
recommendation_feedback table
    ↓
↓
Admin Panel
    ↓
GET /api/feedback
    ↓
Display in Feedback Page
```

---

## 📋 Summary of Changes

| Component | What Was Added | Status |
|-----------|-----------------|--------|
| Backend Endpoint | POST /api/feedback/submit | ✅ Added |
| Database | recommendation_feedback table | ✅ Exists |
| Pydantic Model | FeedbackSubmission validation | ✅ Added |
| CORS Settings | Multiple localhost ports | ✅ Updated |
| Admin Viewing | GET endpoints & FeedbackPage | ✅ Already done |
| Error Handling | Input validation & messages | ✅ Added |

---

## ✅ Ready to Use

The student app can now submit feedback! 

**Steps**:
1. Student rates a recommendation (1-5 stars)
2. Student adds optional comment
3. Student clicks "Submit Feedback"
4. Data sent to: `POST http://localhost:5000/api/feedback/submit`
5. Admin can view feedback in admin panel

---

## 📞 Need More Help?

**Verify endpoint is working**:
```bash
# Test with curl
curl -X POST http://localhost:5000/api/feedback/submit \
  -H "Content-Type: application/json" \
  -d '{"recommendation_id": 1, "user_id": 1, "rating": 5, "feedback_text": "Test"}'
```

**Check admin feedback page**:
- Visit: `http://localhost:3002/feedback` (or 3000 / 3001)
- Login if needed
- Click "Feedback" in sidebar
- Should see submitted feedback with statistics

---

**Status**: ✅ Student feedback submission is fully functional!
