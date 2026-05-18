const crypto = require('crypto');

module.exports = (req, res, next) => {
  // ===== PREVENIR INYECCIÓN SQL =====
  // El pool de PostgreSQL con parámetros bound previene esto

  // ===== SANITIZAR INPUT =====
  // Eliminar caracteres peligrosos
  req.sanitize = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  };

  // ===== PREVENIR CSRF (aunque usamos JWT) =====
  // Validar origen de solicitud
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
  const origin = req.get('origin');

  if (req.method !== 'GET' && origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({
      success: false,
      message: 'Origen no autorizado'
    });
  }

  // ===== HEADER DE SEGURIDAD PERSONALIZADO =====
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // ===== LOGGING DE SEGURIDAD =====
  if (req.method !== 'GET') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${req.ip}`);
  }

  next();
};
