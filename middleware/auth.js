import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export const verifyToken = (req, res, next) => {
    // Get auth header
    const authHeader = req.headers.authorization;

    // Check if auth header exists
    if (!authHeader) {
        res.setHeader('WWW-Authenticate', 'Bearer realm="Festivals API"');
        return res.status(401).json({
            error: 'Authorization header is required'
        });
    }

    // Check if Bearer token
    if (!authHeader.startsWith('Bearer ')) {
        res.setHeader('WWW-Authenticate', 'Bearer realm="Festivals API"');
        return res.status(401).json({
            error: 'Authorization must be Bearer token'
        });
    }

    try {
        // Extract token
        const token = authHeader.split(' ')[1];

        // Verify token and attach user info to req
        req.user = jwt.verify(token, JWT_SECRET);

        next();
    } catch (error) {
        res.setHeader('WWW-Authenticate', 'Bearer realm="Festivals API"');
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token has expired'
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Invalid token'
            });
        } else {
            return res.status(401).json({
                error: 'Token verification failed'
            });
        }
    }
};
