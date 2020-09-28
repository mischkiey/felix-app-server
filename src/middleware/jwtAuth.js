const UsersService = require('../routes/users/UsersService');

async function requireAuth(req, res, next) {
  const authToken = req.get('Authorization') || '';
  const db = req.app.get('db');

  let bearerToken;
  if (!authToken.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ error: 'Missing bearer token' });
  } else {
    bearerToken = authToken.slice('bearer '.length, authToken.length);
  }

  try {
    const payload = UsersService.verifyJwt(bearerToken);
    const user = await UsersService.getUserWithUsername(db, payload.sub);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized request'
      });
    }
 
    req.userId = user.id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized request' });
  }
}

module.exports = {
  requireAuth,
};
