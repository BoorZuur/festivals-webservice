import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

const envUsername = process.env.APP_USERNAME;
const envPassword = process.env.APP_PASSWORD;
const jwtSecret = process.env.JWT_SECRET;
const jwtExpires = '1h';

router.options('/login', (req, res) => {
    res.header('Allow', 'POST,OPTIONS')
    res.header('Access-Control-Allow-Methods', 'POST,OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Accept,Content-Type')
    res.status(204).send();
})

router.post('/login', (req, res) => {
    // Get Authorization header
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists
    if (!authHeader) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Festivals API"');
        return res.status(401).json({
            error: 'Authorization header is required'
        });
    }

    // Check if Basic authentication
    if (!authHeader.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Festivals API"');
        return res.status(401).json({
            error: 'Authorization must be Basic authentication'
        });
    }

    try {
        // Decode Base64 credentials
        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
        const [username, password] = credentials.split(':');

        // Validate credentials
        if (username !== envUsername || password !== envPassword) {
            res.setHeader('WWW-Authenticate', 'Basic realm="Festivals API"');
            return res.status(401).json({
                error: 'Invalid username or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { name: username },
            jwtSecret,
            { expiresIn: jwtExpires }
        );

        // Return token
        res.json({
            access_token: token,
            token_type: 'Bearer',
            expires_in: jwtExpires
        });
    } catch (error) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Festivals API"');
        return res.status(401).json({
            error: 'Invalid Authorization header format'
        });
    }
});

export default router;
