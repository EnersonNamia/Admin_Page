/**
 * Mock API Server for Admin Dashboard
 * This file simulates backend API responses for testing the admin panel
 * In a production environment, this would be replaced with actual backend services
 */

class MockAPIServer {
    constructor() {
        this.users = this.generateMockUsers();
        this.analytics = this.generateMockAnalytics();
        this.systemStatus = this.generateSystemStatus();
        this.activities = this.generateActivities();
        this.settings = this.getDefaultSettings();
    }

    // Generate mock user data
    generateMockUsers() {
        const names = [
            'John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown',
            'Lisa Davis', 'Tom Wilson', 'Emma Taylor', 'Alex Johnson', 'Maria Garcia',
            'Chris Lee', 'Anna Martinez', 'James Miller', 'Laura Rodriguez', 'Kevin White'
        ];
        
        const roles = ['admin', 'moderator', 'user'];
        const statuses = ['active', 'inactive', 'banned'];
        
        return Array.from({ length: 50 }, (_, i) => ({
            id: i + 1,
            name: names[i % names.length],
            email: `user${i + 1}@example.com`,
            role: roles[Math.floor(Math.random() * roles.length)],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
            lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${names[i % names.length]}`
        }));
    }

    // Generate mock analytics data
    generateMockAnalytics() {
        const dates = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
        }).reverse();

        return {
            traffic: {
                labels: dates,
                data: dates.map(() => Math.floor(Math.random() * 1000) + 500)
            },
            engagement: {
                avgSessionDuration: '4:32',
                bounceRate: '34.2%',
                pagesPerSession: 3.8,
                newVsReturning: {
                    new: 65,
                    returning: 35
                }
            },
            topPages: [
                { page: '/dashboard', views: 15420, percentage: 28.5 },
                { page: '/products', views: 12380, percentage: 22.9 },
                { page: '/about', views: 8950, percentage: 16.6 },
                { page: '/contact', views: 6720, percentage: 12.4 },
                { page: '/blog', views: 5430, percentage: 10.1 }
            ]
        };
    }

    // Generate system status
    generateSystemStatus() {
        return {
            webServer: { status: 'online', uptime: '99.9%', responseTime: '45ms' },
            database: { status: 'online', uptime: '99.8%', connections: 25 },
            emailService: { status: 'warning', uptime: '97.2%', queueSize: 12 },
            fileStorage: { status: 'online', uptime: '99.9%', usage: '68%' }
        };
    }

    // Generate recent activities
    generateActivities() {
        const activities = [
            { type: 'user_registered', description: 'New user registered', user: 'john.doe@email.com', time: new Date(Date.now() - 2 * 60 * 60 * 1000) },
            { type: 'content_updated', description: 'Homepage banner updated', user: 'admin@example.com', time: new Date(Date.now() - 4 * 60 * 60 * 1000) },
            { type: 'backup_completed', description: 'Database backup completed', user: 'system', time: new Date(Date.now() - 6 * 60 * 60 * 1000) },
            { type: 'user_login', description: 'Admin user logged in', user: 'admin@example.com', time: new Date(Date.now() - 8 * 60 * 60 * 1000) },
            { type: 'setting_changed', description: 'Security settings updated', user: 'admin@example.com', time: new Date(Date.now() - 12 * 60 * 60 * 1000) }
        ];

        return activities.map(activity => ({
            ...activity,
            id: Math.random().toString(36).substr(2, 9),
            icon: this.getActivityIcon(activity.type),
            timeAgo: this.getTimeAgo(activity.time)
        }));
    }

    getActivityIcon(type) {
        const icons = {
            'user_registered': 'fa-user-plus',
            'content_updated': 'fa-edit',
            'backup_completed': 'fa-database',
            'user_login': 'fa-sign-in-alt',
            'setting_changed': 'fa-cog'
        };
        return icons[type] || 'fa-info-circle';
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInMilliseconds = now - date;
        const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
        
        if (diffInHours < 1) {
            const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
            return `${diffInMinutes} minutes ago`;
        } else if (diffInHours < 24) {
            return `${diffInHours} hours ago`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays} days ago`;
        }
    }

    getDefaultSettings() {
        return {
            general: {
                siteName: 'Capstone Project',
                siteDescription: 'A comprehensive admin dashboard for managing your capstone project.',
                timezone: 'UTC',
                language: 'en',
                dateFormat: 'MM/DD/YYYY'
            },
            security: {
                twoFactorAuth: true,
                loginNotifications: false,
                sessionTimeout: 30,
                passwordExpiry: 90
            },
            notifications: {
                emailNotifications: true,
                pushNotifications: false,
                smsNotifications: false
            },
            backup: {
                autoBackup: true,
                backupInterval: 'daily',
                retentionPeriod: 30
            }
        };
    }

    // API Methods
    async getUsers(page = 1, limit = 10, search = '', role = '', status = '') {
        let filteredUsers = this.users;

        // Apply search filter
        if (search) {
            filteredUsers = filteredUsers.filter(user => 
                user.name.toLowerCase().includes(search.toLowerCase()) ||
                user.email.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Apply role filter
        if (role) {
            filteredUsers = filteredUsers.filter(user => user.role === role);
        }

        // Apply status filter
        if (status) {
            filteredUsers = filteredUsers.filter(user => user.status === status);
        }

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

        return {
            success: true,
            data: paginatedUsers,
            pagination: {
                page: page,
                limit: limit,
                total: filteredUsers.length,
                totalPages: Math.ceil(filteredUsers.length / limit)
            }
        };
    }

    async getUserById(id) {
        const user = this.users.find(u => u.id === parseInt(id));
        return {
            success: !!user,
            data: user,
            message: user ? 'User found' : 'User not found'
        };
    }

    async createUser(userData) {
        const newUser = {
            id: Math.max(...this.users.map(u => u.id)) + 1,
            ...userData,
            created: new Date().toISOString(),
            lastLogin: null,
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${userData.name}`
        };

        this.users.unshift(newUser);
        
        return {
            success: true,
            data: newUser,
            message: 'User created successfully'
        };
    }

    async updateUser(id, userData) {
        const userIndex = this.users.findIndex(u => u.id === parseInt(id));
        if (userIndex === -1) {
            return {
                success: false,
                message: 'User not found'
            };
        }

        this.users[userIndex] = { ...this.users[userIndex], ...userData };
        
        return {
            success: true,
            data: this.users[userIndex],
            message: 'User updated successfully'
        };
    }

    async deleteUser(id) {
        const userIndex = this.users.findIndex(u => u.id === parseInt(id));
        if (userIndex === -1) {
            return {
                success: false,
                message: 'User not found'
            };
        }

        this.users.splice(userIndex, 1);
        
        return {
            success: true,
            message: 'User deleted successfully'
        };
    }

    async getAnalytics(dateRange = 30) {
        // Simulate different data based on date range
        const analytics = { ...this.analytics };
        
        if (dateRange !== 30) {
            // Adjust data based on date range
            const factor = dateRange / 30;
            analytics.traffic.data = analytics.traffic.data.map(value => 
                Math.floor(value * factor)
            );
        }

        return {
            success: true,
            data: analytics
        };
    }

    async getSystemStatus() {
        return {
            success: true,
            data: this.systemStatus
        };
    }

    async getActivities(limit = 10) {
        return {
            success: true,
            data: this.activities.slice(0, limit)
        };
    }

    async getSettings() {
        return {
            success: true,
            data: this.settings
        };
    }

    async updateSettings(section, data) {
        if (this.settings[section]) {
            this.settings[section] = { ...this.settings[section], ...data };
            return {
                success: true,
                data: this.settings[section],
                message: 'Settings updated successfully'
            };
        } else {
            return {
                success: false,
                message: 'Settings section not found'
            };
        }
    }

    async getDatabaseInfo() {
        return {
            success: true,
            data: {
                size: '2.4 GB',
                sizeBytes: 2577580032,
                maxSize: '5 GB',
                maxSizeBytes: 5368709120,
                tables: [
                    { name: 'users', records: 1234, size: '45 MB' },
                    { name: 'content', records: 567, size: '123 MB' },
                    { name: 'analytics', records: 45678, size: '892 MB' },
                    { name: 'settings', records: 89, size: '2 MB' },
                    { name: 'backups', records: 12, size: '1.2 GB' }
                ],
                lastBackup: new Date().toISOString(),
                uptime: '99.9%'
            }
        };
    }

    async createBackup() {
        // Simulate backup creation
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    data: {
                        id: Math.random().toString(36).substr(2, 9),
                        filename: `backup_${new Date().toISOString().split('T')[0]}.sql`,
                        size: '2.4 GB',
                        created: new Date().toISOString(),
                        status: 'completed'
                    },
                    message: 'Backup created successfully'
                });
            }, 3000);
        });
    }

    async optimizeDatabase() {
        // Simulate database optimization
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    data: {
                        optimizedTables: 5,
                        spaceSaved: '245 MB',
                        duration: '00:02:15'
                    },
                    message: 'Database optimization completed'
                });
            }, 2000);
        });
    }

    // Simulate API request with random delays and occasional errors
    async simulateApiCall(endpoint, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            // Random delay between 100ms and 1000ms
            const delay = Math.random() * 900 + 100;
            
            setTimeout(() => {
                // Simulate 5% error rate
                if (Math.random() < 0.05) {
                    reject({
                        success: false,
                        error: 'Network error',
                        message: 'An unexpected error occurred'
                    });
                } else {
                    resolve(this.handleApiCall(endpoint, method, data));
                }
            }, delay);
        });
    }

    async handleApiCall(endpoint, method, data) {
        const [resource, id] = endpoint.split('/').filter(Boolean);
        
        switch (resource) {
            case 'users':
                if (method === 'GET' && id) {
                    return this.getUserById(id);
                } else if (method === 'GET') {
                    return this.getUsers(data?.page, data?.limit, data?.search, data?.role, data?.status);
                } else if (method === 'POST') {
                    return this.createUser(data);
                } else if (method === 'PUT' && id) {
                    return this.updateUser(id, data);
                } else if (method === 'DELETE' && id) {
                    return this.deleteUser(id);
                }
                break;
            case 'analytics':
                return this.getAnalytics(data?.dateRange);
            case 'system-status':
                return this.getSystemStatus();
            case 'activities':
                return this.getActivities(data?.limit);
            case 'settings':
                if (method === 'GET') {
                    return this.getSettings();
                } else if (method === 'PUT') {
                    return this.updateSettings(data?.section, data?.settings);
                }
                break;
            case 'database':
                if (endpoint.includes('info')) {
                    return this.getDatabaseInfo();
                } else if (endpoint.includes('backup') && method === 'POST') {
                    return this.createBackup();
                } else if (endpoint.includes('optimize') && method === 'POST') {
                    return this.optimizeDatabase();
                }
                break;
            default:
                return {
                    success: false,
                    error: 'Not found',
                    message: 'Endpoint not found'
                };
        }
    }
}

// Initialize mock API server
const mockAPI = new MockAPIServer();

// Export for use in main application
if (typeof window !== 'undefined') {
    window.mockAPI = mockAPI;
}