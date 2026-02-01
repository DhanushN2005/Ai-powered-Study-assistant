const { asyncHandler } = require('./error');

/**
 * Middleware to check if user has instructor role
 */
exports.authorizeInstructor = asyncHandler(async (req, res, next) => {
    if (req.user.role !== 'instructor') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Instructor privileges required.'
        });
    }
    next();
});

/**
 * Middleware to check if user has specific roles
 */
exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${roles.join(' or ')}`
            });
        }
        next();
    };
};
