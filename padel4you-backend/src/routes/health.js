const express = require('express');
const database = require('../config/database');

const router = express.Router();

// ===== GET: Health check del servidor =====
router.get('/', async (req, res) => {
  try {
    // Verificar conexión a BD
    const dbCheck = await database.query('SELECT NOW()');

    res.json({
      success: true,
      status: 'online',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'offline',
      message: 'Base de datos no disponible'
    });
  }
});

module.exports = router;
