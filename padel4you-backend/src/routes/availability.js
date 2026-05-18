const express = require('express');
const { verifyToken } = require('../middleware/auth');
const database = require('../config/database');

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(verifyToken);

// ===== CONSTANTES =====
const DAYS_ES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sab'];
const MORNING_SLOTS = ['09:00', '10:30', '12:00'];
const AFTERNOON_SLOTS = ['16:00', '17:30', '19:00', '20:30', '22:00'];

// ===== GET: Obtener horarios disponibles para una pista y fecha =====
router.get('/courts/:courtId/date/:date', async (req, res) => {
  try {
    const { courtId, date } = req.params;

    // Validar formato de fecha (YYYY-MM-DD)
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de fecha inválido (YYYY-MM-DD)'
      });
    }

    const dateObj = new Date(date + 'T00:00:00Z');
    const dayOfWeek = dateObj.getUTCDay();

    // Validar que no sea pasado
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(date) < today) {
      return res.status(400).json({
        success: false,
        message: 'No puedes reservar fechas pasadas'
      });
    }

    // Cerrado los domingos (dayOfWeek = 0)
    if (dayOfWeek === 0) {
      return res.json({
        success: true,
        date,
        availableSlots: [],
        message: 'Cerrado los domingos'
      });
    }

    // Determinar horarios según día
    let slots = [];
    if (dayOfWeek === 6) { // Sábado
      slots = MORNING_SLOTS;
    } else {
      slots = [...MORNING_SLOTS, ...AFTERNOON_SLOTS];
    }

    // Obtener reservas de ese día (excluyendo canceladas y expiradas)
    const result = await database.query(
      `SELECT start_time
       FROM reservations
       WHERE court_id = $1
         AND date = $2
         AND status IN ('confirmed', 'pending')
         AND hold_until > NOW()`,
      [parseInt(courtId), date]
    );

    const occupiedSlots = result.rows.map(r => r.start_time);
    const availableSlots = slots.filter(slot => !occupiedSlots.includes(slot));

    res.json({
      success: true,
      date,
      day: DAYS_ES[dayOfWeek],
      availableSlots,
      occupiedSlots,
      totalSlots: slots.length,
      availableCount: availableSlots.length
    });
  } catch (error) {
    console.error('Error obteniendo disponibilidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo disponibilidad'
    });
  }
});

module.exports = router;
