const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is missing in production!');
    }
    return 'dev-insecure-fallback-secret-for-local-testing-only-12345';
  }
  return secret;
};

const signToken = (payload, expiresIn) => {
  const secret = getJwtSecret();
  const options = {
    expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || '1h',
  };
  return jwt.sign(payload, secret, options);
};

const verifyToken = (token) => {
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
};

module.exports = {
  signToken,
  verifyToken,
};
