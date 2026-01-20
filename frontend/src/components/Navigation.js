import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

function Navigation({ admin, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: 'fas fa-chart-line' },
    { path: '/users', label: 'Users', icon: 'fas fa-users' },
    { path: '/courses', label: 'Courses', icon: 'fas fa-book' },
    { path: '/tests', label: 'Tests', icon: 'fas fa-clipboard-check' },
    { path: '/recommendations', label: 'Recommendations', icon: 'fas fa-lightbulb' },
    { path: '/analytics', label: 'Analytics', icon: 'fas fa-analytics' },
  ];

  return (
    <nav className={`navbar ${sidebarOpen ? 'open' : 'collapsed'}`}>
      <div className="navbar-top">
        <div className="navbar-brand">
          <i className="fas fa-graduation-cap"></i>
          {sidebarOpen && <span>CRS Admin</span>}
        </div>
        <button
          className="toggle-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <i className="fas fa-bars"></i>
        </button>
      </div>

      <ul className="nav-menu">
        {menuItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              title={item.label}
            >
              <i className={item.icon}></i>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          </li>
        ))}
      </ul>

      <div className="navbar-footer">
        <div className={`admin-info ${!sidebarOpen ? 'collapsed' : ''}`}>
          {sidebarOpen && (
            <>
              <p className="admin-name">{admin?.full_name || 'Admin'}</p>
              <p className="admin-email">{admin?.email || 'admin@system.com'}</p>
            </>
          )}
        </div>
        <button className="logout-btn" onClick={onLogout} title="Logout">
          <i className="fas fa-sign-out-alt"></i>
          {sidebarOpen && <span>Logout</span>}
        </button>
      </div>
    </nav>
  );
}

export default Navigation;
