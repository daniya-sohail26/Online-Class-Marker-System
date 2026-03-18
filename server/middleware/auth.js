/**
 * Mock Auth Middleware
 * Since login is removed, this middleware always passes a default user
 */
export const authenticateToken = (req, res, next) => {
    // Mock user for teacher dashboard
    req.user = {
        id: 'teacher-123', // This shouldIdeally match some user in the DB
        role: 'teacher',
        email: 'teacher@example.com'
    };
    next();
};
