import express from 'express';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.options('/profile', (req, res) => {
    res.header('Allow', 'GET,OPTIONS');
    res.header('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Accept,Authorization');
    res.status(204).send();
})

router.get('/profile', verifyToken, (req, res) => {
    res.json({
        username: req.user.username,
    });
});

export default router;