module.exports = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // Error de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Datos inválidos',
      errors: err.errors
    });
  }

  // Error de base de datos
  if (err.code === '23505') { // Unique violation
    return res.status(409).json({
      success: false,
      message: 'Datos duplicados'
    });
  }

  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({
      success: false,
      message: 'Referencia inválida'
    });
  }

  if (err.code === '40P01') { // Deadlock
    return res.status(503).json({
      success: false,
      message: 'Base de datos congestionada, intenta más tarde'
    });
  }

  // Error de autenticación
  if (err.status === 401) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado'
    });
  }

  // Error de permisos
  if (err.status === 403) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para esta acción'
    });
  }

  // Error genérico
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Error del servidor'
      : err.message
  });
};
