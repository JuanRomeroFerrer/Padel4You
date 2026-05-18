const jwt = require('jsonwebtoken');

module.exports = {
  verifyToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Token no proporcionado'
        });
      }

      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        req.userEmail = decoded.email;
        next();
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Token expirado'
          });
        }
        return res.status(401).json({
          success: false,
          message: 'Token inválido'
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error verificando token'
      });
    }
  },

  generateToken(userId, email) {
    return jwt.sign(
      {
        id: userId,
        email: email,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
  }
};
