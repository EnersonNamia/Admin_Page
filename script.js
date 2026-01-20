// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.sidebarCollapsed = false;
        this.users = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.generateSampleData();
        this.loadUsers();
        this.updateStats();
        this.loadActivity();
        this.loadSystemStatus();
    }

    setupEventListeners() {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        sidebarToggle?.addEventListener('click', () => this.toggleSidebar());

        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
            });
        });

        // Modal controls
        this.setupModalControls();

        // Search functionality
        this.setupSearchFunctionality();

        // Form submissions
        this.setupFormSubmissions();

        // Filter controls
        this.setupFilters();

        // Global search
        const globalSearch = document.getElementById('globalSearch');
        globalSearch?.addEventListener('input', (e) => this.handleGlobalSearch(e.target.value));

        // Logout functionality
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn?.addEventListener('click', () => this.handleLogout());

        // Database actions
        this.setupDatabaseActions();
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        this.sidebarCollapsed = !this.sidebarCollapsed;
        
        if (this.sidebarCollapsed) {
            sidebar.classList.add('collapsed');
        } else {
            sidebar.classList.remove('collapsed');
        }
    }

    switchSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelector(`[data-section="${sectionName}"]`).parentElement.classList.add('active');

        // Update content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        document.getElementById(sectionName)?.classList.add('active');

        // Update page title and breadcrumb
        const pageTitle = document.getElementById('pageTitle');
        const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
        
        const sectionTitles = {
            'dashboard': 'Dashboard',
            'users': 'User Management',
            'content': 'Content Management',
            'analytics': 'Analytics',
            'settings': 'Settings',
            'database': 'Database',
            'reports': 'Reports'
        };

        if (pageTitle) pageTitle.textContent = sectionTitles[sectionName] || sectionName;
        if (breadcrumbCurrent) breadcrumbCurrent.textContent = sectionTitles[sectionName] || sectionName;

        this.currentSection = sectionName;

        // Load section-specific data
        this.loadSectionData(sectionName);
    }

    loadSectionData(sectionName) {
        switch (sectionName) {
            case 'users':
                this.loadUsers();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
            case 'database':
                this.loadDatabaseInfo();
                break;
            case 'reports':
                this.loadReports();
                break;
        }
    }

    generateSampleData() {
        // Generate sample user data
        const sampleNames = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown', 'Lisa Davis', 'Tom Wilson', 'Emma Taylor', 'Alex Johnson', 'Maria Garcia'];
        const roles = ['admin', 'user', 'moderator'];
        const statuses = ['active', 'inactive', 'banned'];

        this.users = Array.from({ length: 25 }, (_, i) => ({
            id: i + 1,
            name: sampleNames[i % sampleNames.length],
            email: `user${i + 1}@example.com`,
            role: roles[Math.floor(Math.random() * roles.length)],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString()
        }));
    }

    loadUsers() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedUsers = this.users.slice(startIndex, endIndex);

        tbody.innerHTML = paginatedUsers.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="status ${user.role === 'admin' ? 'warning' : user.role === 'moderator' ? 'success' : ''}">${user.role}</span></td>
                <td><span class="status ${user.status === 'active' ? 'success' : user.status === 'inactive' ? 'warning' : 'danger'}">${user.status}</span></td>
                <td>${user.created}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="adminDashboard.editUser(${user.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteUser(${user.id})">Delete</button>
                </td>
            </tr>
        `).join('');

        this.updatePagination();
    }

    updatePagination() {
        const pagination = document.getElementById('usersPagination');
        if (!pagination) return;

        const totalPages = Math.ceil(this.users.length / this.itemsPerPage);
        const currentPage = this.currentPage;

        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `<button ${currentPage === 1 ? 'disabled' : ''} onclick="adminDashboard.goToPage(${currentPage - 1})">Previous</button>`;
        
        // Page numbers
        for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
            paginationHTML += `<button class="${i === currentPage ? 'active' : ''}" onclick="adminDashboard.goToPage(${i})">${i}</button>`;
        }
        
        // Next button
        paginationHTML += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="adminDashboard.goToPage(${currentPage + 1})">Next</button>`;
        
        pagination.innerHTML = paginationHTML;
    }

    goToPage(page) {
        this.currentPage = page;
        this.loadUsers();
    }

    setupModalControls() {
        // Add User Modal
        const addUserBtn = document.getElementById('addUserBtn');
        const addUserModal = document.getElementById('addUserModal');
        const modalClose = document.querySelector('.modal-close');
        const modalCancel = document.querySelector('.modal-cancel');

        addUserBtn?.addEventListener('click', () => {
            addUserModal?.classList.add('active');
        });

        [modalClose, modalCancel].forEach(btn => {
            btn?.addEventListener('click', () => {
                addUserModal?.classList.remove('active');
            });
        });

        // Close modal when clicking outside
        addUserModal?.addEventListener('click', (e) => {
            if (e.target === addUserModal) {
                addUserModal.classList.remove('active');
            }
        });
    }

    setupSearchFunctionality() {
        const userSearch = document.getElementById('userSearch');
        userSearch?.addEventListener('input', (e) => {
            this.filterUsers();
        });
    }

    setupFormSubmissions() {
        const addUserForm = document.getElementById('addUserForm');
        addUserForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddUser();
        });

        // Settings forms
        document.querySelectorAll('.settings-form').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSettingsUpdate(e.target);
            });
        });
    }

    setupFilters() {
        const roleFilter = document.getElementById('roleFilter');
        const statusFilter = document.getElementById('statusFilter');

        [roleFilter, statusFilter].forEach(filter => {
            filter?.addEventListener('change', () => this.filterUsers());
        });
    }

    filterUsers() {
        const searchTerm = document.getElementById('userSearch')?.value.toLowerCase() || '';
        const roleFilter = document.getElementById('roleFilter')?.value || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';

        this.filteredUsers = this.users.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchTerm) || 
                                 user.email.toLowerCase().includes(searchTerm);
            const matchesRole = !roleFilter || user.role === roleFilter;
            const matchesStatus = !statusFilter || user.status === statusFilter;

            return matchesSearch && matchesRole && matchesStatus;
        });

        this.users = this.filteredUsers.length > 0 ? this.filteredUsers : this.users;
        this.currentPage = 1;
        this.loadUsers();
    }

    handleAddUser() {
        const form = document.getElementById('addUserForm');
        const formData = new FormData(form);
        
        const newUser = {
            id: this.users.length + 1,
            name: document.getElementById('userName').value,
            email: document.getElementById('userEmail').value,
            role: document.getElementById('userRole').value,
            status: 'active',
            created: new Date().toLocaleDateString()
        };

        this.users.unshift(newUser);
        this.loadUsers();
        
        // Close modal and reset form
        document.getElementById('addUserModal').classList.remove('active');
        form.reset();
        
        this.showNotification('User added successfully!', 'success');
    }

    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            // Pre-fill form with user data
            document.getElementById('userName').value = user.name;
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userRole').value = user.role;
            
            // Show modal
            document.getElementById('addUserModal').classList.add('active');
            
            // Change form submission to edit mode
            const form = document.getElementById('addUserForm');
            form.onsubmit = (e) => {
                e.preventDefault();
                this.handleEditUser(userId);
            };
        }
    }

    handleEditUser(userId) {
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            this.users[userIndex] = {
                ...this.users[userIndex],
                name: document.getElementById('userName').value,
                email: document.getElementById('userEmail').value,
                role: document.getElementById('userRole').value
            };
            
            this.loadUsers();
            document.getElementById('addUserModal').classList.remove('active');
            this.showNotification('User updated successfully!', 'success');
            
            // Reset form submission
            const form = document.getElementById('addUserForm');
            form.onsubmit = (e) => {
                e.preventDefault();
                this.handleAddUser();
            };
        }
    }

    deleteUser(userId) {
        if (confirm('Are you sure you want to delete this user?')) {
            this.users = this.users.filter(u => u.id !== userId);
            this.loadUsers();
            this.showNotification('User deleted successfully!', 'success');
        }
    }

    handleSettingsUpdate(form) {
        // Simulate settings update
        this.showNotification('Settings updated successfully!', 'success');
        
        // You would typically send this data to your backend
        const formData = new FormData(form);
        console.log('Settings updated:', Object.fromEntries(formData));
    }

    setupDatabaseActions() {
        const backupBtn = document.getElementById('backupBtn');
        const optimizeBtn = document.getElementById('optimizeBtn');

        backupBtn?.addEventListener('click', () => this.handleDatabaseBackup());
        optimizeBtn?.addEventListener('click', () => this.handleDatabaseOptimize());
    }

    handleDatabaseBackup() {
        this.showNotification('Database backup started...', 'info');
        
        // Simulate backup process
        setTimeout(() => {
            this.showNotification('Database backup completed successfully!', 'success');
        }, 3000);
    }

    handleDatabaseOptimize() {
        this.showNotification('Database optimization started...', 'info');
        
        // Simulate optimization process
        setTimeout(() => {
            this.showNotification('Database optimization completed!', 'success');
        }, 2000);
    }

    updateStats() {
        // Update dashboard statistics
        const stats = {
            totalUsers: this.users.length,
            pageViews: 45678,
            databaseSize: '2.4GB',
            uptime: '99.9%'
        };

        // Update stat cards if they exist
        const statCards = document.querySelectorAll('.stat-card');
        if (statCards.length >= 4) {
            statCards[0].querySelector('h3').textContent = stats.totalUsers.toLocaleString();
            statCards[1].querySelector('h3').textContent = stats.pageViews.toLocaleString();
            statCards[2].querySelector('h3').textContent = stats.databaseSize;
            statCards[3].querySelector('h3').textContent = stats.uptime;
        }
    }

    loadActivity() {
        // Load recent activity (this would typically come from your backend)
        const activities = [
            {
                icon: 'fa-user-plus',
                text: 'New user registered: john.doe@email.com',
                time: '2 hours ago'
            },
            {
                icon: 'fa-edit',
                text: 'Content updated: Homepage banner',
                time: '4 hours ago'
            },
            {
                icon: 'fa-database',
                text: 'Database backup completed',
                time: '6 hours ago'
            }
        ];

        // Update activity list if it exists
        const activityList = document.querySelector('.activity-list');
        if (activityList) {
            activityList.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas ${activity.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <p>${activity.text}</p>
                        <span class="activity-time">${activity.time}</span>
                    </div>
                </div>
            `).join('');
        }
    }

    loadSystemStatus() {
        // Load system status (this would typically come from your backend)
        const statuses = [
            { name: 'Web Server', status: 'online', value: 'Online' },
            { name: 'Database', status: 'online', value: 'Online' },
            { name: 'Email Service', status: 'warning', value: 'Limited' },
            { name: 'File Storage', status: 'online', value: 'Online' }
        ];

        const statusList = document.querySelector('.status-list');
        if (statusList) {
            statusList.innerHTML = statuses.map(status => `
                <div class="status-item">
                    <div class="status-indicator ${status.status}"></div>
                    <span>${status.name}</span>
                    <span class="status-value">${status.value}</span>
                </div>
            `).join('');
        }
    }

    loadAnalytics() {
        // Load analytics data (placeholder for chart implementation)
        const chartContainer = document.getElementById('trafficChart');
        if (chartContainer) {
            chartContainer.innerHTML = '<div style="text-align: center; padding: 50px; color: #64748b;">Traffic Chart<br><small>Chart implementation would go here</small></div>';
        }
    }

    loadDatabaseInfo() {
        // Update database information
        console.log('Loading database information...');
        // This would typically fetch real database stats from your backend
    }

    loadReports() {
        // Load reports data
        console.log('Loading reports...');
        // This would typically fetch report data from your backend
    }

    handleGlobalSearch(query) {
        if (query.length < 2) return;
        
        // Implement global search across different sections
        console.log('Global search:', query);
        
        // Example: search in users
        if (this.currentSection === 'users') {
            document.getElementById('userSearch').value = query;
            this.filterUsers();
        }
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            // Clear any stored session data
            localStorage.clear();
            sessionStorage.clear();
            
            // Redirect to login page or show login modal
            this.showNotification('Logged out successfully', 'info');
            
            // In a real application, you would redirect to login page
            // window.location.href = '/login';
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;

        // Add styles for notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            padding: 1rem;
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            min-width: 300px;
            border-left: 4px solid ${this.getNotificationColor(type)};
        `;

        document.body.appendChild(notification);

        // Close button functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.remove();
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    getNotificationColor(type) {
        const colors = {
            'success': 'var(--success-color)',
            'error': 'var(--danger-color)',
            'warning': 'var(--warning-color)',
            'info': 'var(--primary-color)'
        };
        return colors[type] || colors.info;
    }

    // Utility method for making API calls (placeholder)
    async apiCall(endpoint, method = 'GET', data = null) {
        try {
            const config = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            };

            if (data && method !== 'GET') {
                config.body = JSON.stringify(data);
            }

            const response = await fetch(`/api${endpoint}`, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            this.showNotification('An error occurred. Please try again.', 'error');
            throw error;
        }
    }

    // Method to export data (placeholder implementation)
    exportData(format = 'csv', data = null) {
        if (!data) data = this.users;
        
        let content = '';
        let mimeType = '';
        let filename = '';

        switch (format.toLowerCase()) {
            case 'csv':
                content = this.convertToCSV(data);
                mimeType = 'text/csv';
                filename = 'export.csv';
                break;
            case 'json':
                content = JSON.stringify(data, null, 2);
                mimeType = 'application/json';
                filename = 'export.json';
                break;
            default:
                this.showNotification('Unsupported export format', 'error');
                return;
        }

        this.downloadFile(content, filename, mimeType);
        this.showNotification(`Data exported as ${format.toUpperCase()}`, 'success');
    }

    convertToCSV(data) {
        if (!data.length) return '';
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
        ].join('\n');
        
        return csvContent;
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}

// Initialize the admin dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});

// Additional utility functions
function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
}

function formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K for global search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('globalSearch')?.focus();
    }
    
    // Escape key to close modals
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});