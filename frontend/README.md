# Course Recommendation System - React Admin Interface

A professional React-based admin dashboard for the College Course Recommendation System, built with vanilla CSS and axios for API integration.

## 📋 Features

- **Dashboard** - System overview with statistics and quick links
- **User Management** - Create, view, edit, and delete student accounts
- **Course Management** - Manage available college courses and programs
- **Test Management** - Create and manage assessment questionnaires
- **Recommendations Tracking** - Monitor and update recommendation statuses
- **Analytics** - View system performance metrics and statistics
- **Authentication** - Secure login with JWT tokens
- **Responsive Design** - Works on desktop, tablet, and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Backend API running on `http://localhost:5000`

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The app will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## 🔐 Default Login Credentials

- **Email:** admin@system.com
- **Password:** admin123

## 📁 Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Navigation.js       # Sidebar navigation
│   │   └── Navigation.css
│   ├── pages/
│   │   ├── LoginPage.js        # Authentication page
│   │   ├── Dashboard.js        # Dashboard overview
│   │   ├── UsersPage.js        # User management
│   │   ├── CoursesPage.js      # Course management
│   │   ├── TestsPage.js        # Test management
│   │   ├── RecommendationsPage.js
│   │   ├── AnalyticsPage.js
│   │   └── *.css               # Page styles
│   ├── styles/
│   │   ├── index.css           # Global styles
│   │   └── App.css             # App-specific styles
│   ├── App.js                  # Main app component
│   └── index.js                # Entry point
├── package.json
└── README.md
```

## 🎨 UI Components

- **Navigation** - Collapsible sidebar with menu items
- **Cards** - Stat cards, content cards
- **Tables** - Data tables with sorting and filtering
- **Forms** - Input validation and submission
- **Modals** - Add/edit dialogs
- **Buttons** - Primary, secondary, danger, success styles
- **Alerts** - Success, error, and info messages

## 🔌 API Integration

The frontend connects to the backend API at:

```
http://localhost:5000/api
```

### Available Endpoints

```
GET    /users                    - Get all users
POST   /users                    - Create new user
DELETE /users/:id                - Delete user

GET    /courses                  - Get all courses
POST   /courses                  - Create course
DELETE /courses/:id              - Delete course

GET    /tests                    - Get all tests
POST   /tests                    - Create test

GET    /recommendations          - Get recommendations
PUT    /recommendations/:id      - Update recommendation

GET    /analytics               - Get system analytics
```

## 🎯 Features Breakdown

### Dashboard
- System statistics (users, courses, tests, recommendations)
- System information and status
- Quick feature overview

### Users Management
- View all students
- Add new users
- Search and filter by strand
- Edit user information
- Delete users

### Courses Management
- List all available courses
- Add new courses
- Search and filter courses
- Edit course details
- Delete courses

### Tests Management
- Create assessment tests
- Add questions to tests
- View test details
- Manage test questionnaires

### Recommendations
- View generated recommendations
- Filter by status (pending, accepted, rejected)
- Update recommendation status
- View recommendation reasoning

### Analytics
- System-wide statistics
- User engagement metrics
- Course popularity
- Recommendation effectiveness

## 🔐 Authentication

- JWT token-based authentication
- Tokens stored in localStorage
- Automatic logout on token expiration
- Protected routes and API calls

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: 768px
- Collapsible sidebar on mobile
- Optimized table views
- Touch-friendly buttons

## 🎨 Styling

- Vanilla CSS (no Bootstrap or Tailwind)
- CSS Variables for theming
- Consistent color scheme
- Smooth transitions and animations
- Font: Inter (Google Fonts)
- Icons: Font Awesome 6.4.0

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
# Serves optimized build in ./build
```

### Deploy to Server
```bash
# Copy build folder to your web server
cp -r build/* /var/www/html/
```

## 🛠 Technologies Used

- **React 18.2** - UI library
- **React Router 6** - Navigation and routing
- **Axios** - HTTP client
- **Vanilla CSS** - Styling
- **Font Awesome** - Icons
- **LocalStorage** - Token persistence

## 📝 Configuration

### Backend URL

Edit `API_BASE_URL` in component files:

```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

### Color Scheme

Customize in `src/styles/index.css`:

```css
:root {
  --primary-color: #2c3e50;
  --secondary-color: #3498db;
  --success-color: #27ae60;
  --danger-color: #e74c3c;
  /* ... more colors */
}
```

## 🐛 Troubleshooting

### Backend not connecting
- Ensure backend is running on `http://localhost:5000`
- Check CORS settings in backend
- Verify API endpoints are accessible

### Login issues
- Try default credentials: admin@system.com / admin123
- Check browser console for errors
- Clear localStorage: `localStorage.clear()`

### Styling issues
- Clear browser cache
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Check CSS file imports

## 📊 Capstone Requirements Met

✅ Rule-Based Filtering (in recommendations)
✅ Decision Tree Analysis (in recommendations engine)
✅ User Authentication and Authorization
✅ Admin Dashboard with Statistics
✅ User/Course/Test Management
✅ Recommendation Generation and Tracking
✅ System Analytics
✅ User-Friendly Interface
✅ Responsive Design
✅ API Integration

## 🔄 Integration with User Page

The admin interface connects to the same backend as the user page:

- **Admin:** http://localhost:3000 (React)
- **Backend:** http://localhost:5000 (Node.js/Express)
- **Database:** SQLite (shared between admin and user pages)

Both admin and user interfaces share the same API and database.

## 📖 Additional Resources

- [React Documentation](https://react.dev)
- [React Router Documentation](https://reactrouter.com)
- [Axios Documentation](https://axios-http.com)
- [Font Awesome Icons](https://fontawesome.com)

## 👥 Support

For issues or questions, refer to the main project documentation or contact the development team.

## 📄 License

This project is part of the College Course Recommendation System Capstone.

---

**Created:** January 2025
**Version:** 1.0.0
**Status:** Production Ready
