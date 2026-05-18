const express = require('express');
const { verifyToken } = require('../middleware/auth');
const database = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// ===== FUNCIÓN AUXILIAR: REGISTRAR EN AUDIT_LOG =====
async function logAudit(userId, action, reservationId, details, ipAddress) {
  try {
    await database.query(
      `INSERT INTO audit_log (user_id, action, reservation_id, details, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [userId, action, reservationId, JSON.stringify(details), ipAddress]
    );
  } catch (error) {
    console.error('Error registrando auditoría:', error);
    // No lanzar error, solo loguear
  }
}

// Aplicar autenticación a todas las rutas
router.use(verifyToken);

// ===== RATE LIMITING PARA CREAR RESERVAS =====
const reservationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 3, // máximo 3 reservas por minuto
  message: 'Demasiadas reservas, intenta más tarde',
  keyGenerator: (req) => req.userId // Por usuario
});

// ===== POST: CREAR RESERVA (CON HOLD DE 3 MINUTOS) =====
router.post('/',
  reservationLimiter,
  body('courtId').isInt({ min: 1 }),
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/),
  body('startTime').matches(/^\d{2}:\d{2}$/),
  body('endTime').matches(/^\d{2}:\d{2}$/),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: errors.array()
        });
      }

      const { courtId, date, startTime, endTime } = req.body;
      const userId = req.userId;

      // ===== VALIDACIONES =====

      // 1. Validar que la fecha no sea pasada
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const reservationDate = new Date(date + 'T00:00:00Z');
      if (reservationDate < today) {
        return res.status(400).json({
          success: false,
          message: 'No puedes reservar fechas pasadas'
        });
      }

      // 2. Validar que no sea domingo
      const dayOfWeek = reservationDate.getUTCDay();
      if (dayOfWeek === 0) {
        return res.status(400).json({
          success: false,
          message: 'El club está cerrado los domingos'
        });
      }

      // 3. Validar que la pista existe y está activa
      const courtCheck = await database.query(
        'SELECT id, price_per_session FROM courts WHERE id = $1 AND is_active = true',
        [courtId]
      );

      if (courtCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Pista no encontrada o inactiva'
        });
      }

      const courtPrice = courtCheck.rows[0].price_per_session;

      // ===== USAR TRANSACCIÓN PARA MÁXIMA SEGURIDAD =====
      const result = await database.transaction(async (client) => {
        // 4. LOCK: Obtener lock exclusivo en esa pista + fecha + hora
        const lockResult = await client.query(
          `SELECT 1 FROM reservations
           WHERE court_id = $1 AND date = $2 AND start_time = $3
           FOR UPDATE NOWAIT`,
          [courtId, date, startTime]
        );

        // 5. Verificar disponibilidad (incluyendo holds expirados)
        const existingRes = await client.query(
          `SELECT id, status, hold_until FROM reservations
           WHERE court_id = $1 AND date = $2 AND start_time = $3
           AND status IN ('confirmed', 'pending')
           AND hold_until > NOW()`,
          [courtId, date, startTime]
        );

        if (existingRes.rows.length > 0) {
          throw {
            status: 409,
            message: 'Este horario ya está ocupado (otro usuario está en proceso de pago)'
          };
        }

        // 6. Validar que el usuario no tiene más reservas de las permitidas
        const userReservations = await client.query(
          `SELECT COUNT(*) as count FROM reservations
           WHERE user_id = $1 AND date >= CURRENT_DATE
           AND status IN ('confirmed', 'pending')`,
          [userId]
        );

        const maxReservations = parseInt(process.env.MAX_RESERVATIONS_PER_USER || 5);
        if (userReservations.rows[0].count >= maxReservations) {
          throw {
            status: 400,
            message: `No puedes tener más de ${maxReservations} reservas activas`
          };
        }

        // 7. CREAR RESERVA CON STATUS 'pending' Y HOLD
        const reservationId = 'R' + uuidv4().substring(0, 8).toUpperCase();
        const holdDurationMinutes = parseInt(process.env.HOLD_DURATION_MINUTES || 3);

        const insertResult = await client.query(
          `INSERT INTO reservations
           (id, user_id, court_id, date, start_time, end_time, price,
            status, source, created_at, hold_until)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(),
                   NOW() + INTERVAL '${holdDurationMinutes} minutes')
           RETURNING id, status, hold_until, price`,
          [
            reservationId,
            userId,
            courtId,
            date,
            startTime,
            endTime,
            courtPrice,
            'pending', // ESTADO: pending (no confirmada)
            'web'
          ]
        );

        return {
          id: insertResult.rows[0].id,
          status: insertResult.rows[0].status,
          holdUntil: insertResult.rows[0].hold_until,
          price: insertResult.rows[0].price
        };
      });

      // Registrar en auditoría
      const ipAddress = req.ip || req.connection.remoteAddress;
      await logAudit(userId, 'RESERVATION_CREATED', result.id, {
        courtId,
        date,
        startTime,
        endTime,
        price: result.price,
        status: 'pending'
      }, ipAddress);

      res.status(201).json({
        success: true,
        message: `Reserva retenida por ${parseInt(process.env.HOLD_DURATION_MINUTES || 3)} minutos. Completa el pago para confirmarla.`,
        reservation: {
          id: result.id,
          status: result.status,
          holdUntil: result.holdUntil,
          holdDurationMinutes: parseInt(process.env.HOLD_DURATION_MINUTES || 3),
          nextAction: 'Procede al pago para confirmar'
        }
      });
    } catch (error) {
      console.error('Error creando reserva:', error);

      if (error.status) {
        return res.status(error.status).json({
          success: false,
          message: error.message
        });
      }

      if (error.code === '40P01') { // Deadlock
        return res.status(503).json({
          success: false,
          message: 'Demasiada demanda. Intenta en unos segundos.'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error creando reserva'
      });
    }
  }
);

// ===== PUT: CONFIRMAR RESERVA (después del pago) =====
router.put('/:reservationId/confirm', async (req, res) => {
  try {
    const { reservationId } = req.params;
    const userId = req.userId;

    // Verificar que la reserva pertenece al usuario
    const resCheck = await database.query(
      `SELECT id, status, hold_until FROM reservations
       WHERE id = $1 AND user_id = $2`,
      [reservationId, userId]
    );

    if (resCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }

    const reservation = resCheck.rows[0];

    // Validar que está en hold y no ha expirado
    if (reservation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Esta reserva no está en proceso de pago'
      });
    }

    if (new Date() > new Date(reservation.hold_until)) {
      return res.status(400).json({
        success: false,
        message: 'El hold ha expirado. Intenta hacer una nueva reserva.'
      });
    }

    // Confirmar reserva
    const updateResult = await database.query(
      `UPDATE reservations
       SET status = 'confirmed', hold_until = NULL
       WHERE id = $1
       RETURNING id, status, court_id, date, start_time, end_time`,
      [reservationId]
    );

    // Registrar en auditoría
    const ipAddress = req.ip || req.connection.remoteAddress;
    await logAudit(userId, 'RESERVATION_CONFIRMED', reservationId, {
      status: 'confirmed',
      previousStatus: 'pending'
    }, ipAddress);

    res.json({
      success: true,
      message: 'Reserva confirmada exitosamente',
      reservation: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Error confirmando reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirmando reserva'
    });
  }
});

// ===== GET: Obtener mis reservas =====
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;

    const result = await database.query(
      `SELECT r.id, r.court_id, c.name as court_name, r.date, r.start_time,
              r.end_time, r.price, r.status, r.created_at, r.hold_until
       FROM reservations r
       JOIN courts c ON r.court_id = c.id
       WHERE r.user_id = $1
       ORDER BY r.date DESC, r.start_time DESC
       LIMIT 50`,
      [userId]
    );

    res.json({
      success: true,
      reservations: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo reservas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo reservas'
    });
  }
});

// ===== DELETE: Cancelar reserva =====
router.delete('/:reservationId', async (req, res) => {
  try {
    const { reservationId } = req.params;
    const userId = req.userId;

    // Verificar que la reserva pertenece al usuario
    const resCheck = await database.query(
      `SELECT id, status, date, start_time FROM reservations
       WHERE id = $1 AND user_id = $2`,
      [reservationId, userId]
    );

    if (resCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }

    const reservation = resCheck.rows[0];

    // No permitir cancelar reservas completadas
    if (reservation.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'No puedes cancelar una reserva completada'
      });
    }

    // Validar que sea futuro (se puede cancelar hasta 24h antes)
    const reservationDateTime = new Date(reservation.date + 'T' + reservation.start_time);
    const hoursUntilReservation = (reservationDateTime - new Date()) / (1000 * 60 * 60);

    if (hoursUntilReservation < 0) {
      return res.status(400).json({
        success: false,
        message: 'No puedes cancelar una reserva pasada'
      });
    }

    // Cancelar
    await database.query(
      `UPDATE reservations SET status = 'cancelled' WHERE id = $1`,
      [reservationId]
    );

    // Registrar en auditoría
    const ipAddress = req.ip || req.connection.remoteAddress;
    await logAudit(userId, 'RESERVATION_CANCELLED', reservationId, {
      status: 'cancelled',
      previousStatus: reservation.status
    }, ipAddress);

    res.json({
      success: true,
      message: 'Reserva cancelada exitosamente'
    });
  } catch (error) {
    console.error('Error cancelando reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelando reserva'
    });
  }
});

module.exports = router;
