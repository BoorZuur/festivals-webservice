// always allow if requesting options
export default function requireAcceptJson(req, res, next) {
    if (req.header('Accept') !== 'application/json' && req.method !== 'OPTIONS') {
        return res.status(406).json({error: 'Accept header must allow application/json'});
    }
    next();
}