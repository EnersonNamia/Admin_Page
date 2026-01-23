# FeedbackForm.js Correction Guide

## 🔧 The Issue

Your student app's FeedbackForm component is using **incorrect endpoint URLs**:

| Component | Current | Correct | Status |
|-----------|---------|---------|--------|
| Backend URL | `localhost:8000` ❌ | `localhost:5000` ✅ | **WRONG** |
| Endpoint Path | `/feedback/submit` ❌ | `/api/feedback/submit` ✅ | **WRONG** |
| Full URL | `http://localhost:8000/feedback/submit` | `http://localhost:5000/api/feedback/submit` | **BROKEN** |

---

## ✅ The Fix

### Change This (Line ~28):
```javascript
const endpoint = '/feedback/submit';

// Then later (Line ~45):
const response = await fetch(`http://localhost:8000${endpoint}`, {
```

### To This:
```javascript
const backendUrl = 'http://localhost:5000/api/feedback/submit';

// Then later (Line 45):
const response = await fetch(backendUrl, {
```

---

## 📋 Complete Updated Code Block

Replace this section in your FeedbackForm.js (the `handleSubmit` function, lines 20-70):

```javascript
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
```

---

## 🎯 Key Changes

### Change 1: Backend URL
```diff
- const endpoint = '/feedback/submit';
- const response = await fetch(`http://localhost:8000${endpoint}`, {
+ const backendUrl = 'http://localhost:5000/api/feedback/submit';
+ const response = await fetch(backendUrl, {
```

### Change 2: Logging (Optional but helpful)
```javascript
console.log('Sending feedback payload to:', backendUrl);
console.log('Payload:', payload);
```

---

## 🧪 Testing After Fix

1. **Open Student App** in browser
2. **Open DevTools** (F12) → Console tab
3. **Click "Rate Recommendation"** button
4. **Submit feedback** with a rating
5. **Check Console** for these logs:
   ```
   Sending feedback payload to: http://localhost:5000/api/feedback/submit
   Payload: {...your data...}
   [FeedbackForm] Response status: 200
   [FeedbackForm] Response ok: true
   [FeedbackForm] Success response: {...}
   ✅ Thank You! message should appear
   ```

---

## ✅ Verification Checklist

After applying the fix:

- [ ] Backend running on port 5000 (`python main.py`)
- [ ] Student app running
- [ ] FeedbackForm.js updated with correct URL
- [ ] Console shows `http://localhost:5000/api/feedback/submit`
- [ ] Feedback submission succeeds (no error alert)
- [ ] "Thank You" message appears
- [ ] Admin panel shows submitted feedback

---

## 🐛 If It Still Doesn't Work

1. **Check Browser Console (F12)**
   - Look for error messages
   - Network tab → Click on feedback request
   - Check Request URL and Response

2. **Check Backend Logs**
   - Terminal where `python main.py` is running
   - Look for any error messages

3. **Verify Backend is Running**
   - Test: `http://localhost:5000/docs` (should show API docs)
   - Test: `http://localhost:5000/api/feedback/stats/overview` (should return data)

4. **Common Issues**
   - ❌ Port 5000 not in use → Start backend
   - ❌ CORS error → Backend needs to allow student app's origin
   - ❌ 404 error → Endpoint path is wrong (should be `/api/feedback/submit`)
   - ❌ 500 error → Backend validation failed (check rating is 1-5)

---

## 📁 Files to Update

Replace your current file:
```
[Your Student App]/src/components/FeedbackForm.js
```

With the corrected version provided as: `FEEDBACK_FORM_CORRECTED.jsx`

---

## 🎉 Expected Result

After the fix, when students submit feedback:

```
Student App → POST http://localhost:5000/api/feedback/submit
                ↓
Backend validates & inserts into database
                ↓
Student sees "✅ Thank You!" message
                ↓
Modal auto-closes after 5 seconds
                ↓
Admin panel immediately shows the feedback
```

---

**Status**: ✅ Ready to fix!
**Time to apply**: ~30 seconds
**Impact**: Enables all feedback submissions
