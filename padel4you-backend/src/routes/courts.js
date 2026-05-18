const express = require('express');
const { verifyToken } = require('../middleware/auth');
const database = require('../config/database');

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(verifyToken);

// ===== GET: Obtener todas las pistas activas =====
router.get('/', async (req, res) => {
  try {
    const result = await database.query(
      `SELECT id, name, type, level, price_per_session, is_active
       FROM courts
       WHERE is_active = true
       ORDER BY id`,
      []
    );

    res.json({
      success: true,
      courts: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo pistas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo pistas'
    });
  }
});

// ===== GET: Obtener pista específica =====
router.get('/:courtId', async (req, res) => {
  try {
    const { courtId } = req.params;

    // Validar que es un número
    if (isNaN(courtId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de pista inválido'
      });
    }

    const result = await database.query(
      `SELECT id, name, type, level, price_per_session, is_active
       FROM courts
       WHERE id = $1 AND is_active = true`,
      [parseInt(courtId)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pista no encontrada'
      });
    }

    res.json({
      success: true,
      court: result.rows[0]
    });
  } catch (error) {
    console.error('Error obteniendo pista:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo pista'
    });
  }
});

module.exports = router;
