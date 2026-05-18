require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const database = require('./config/database');
const securityMiddleware = require('./middleware/security');
const errorHandler = require('./middleware/errorHandler');

// Rutas
const authRoutes = require('./routes/auth');
const courtsRoutes = require('./routes/courts');
const reservationsRoutes = require('./routes/reservations');
const availabilityRoutes = require('./routes/availability');
const healthRoutes = require('./routes/health');

const app = express();

// ===== SEGURIDAD HEADERS =====
app.use(helmet());

// ===== CORS CONFIGURADO =====
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ===== BODY PARSER =====
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// ===== RATE LIMITING GLOBAL =====
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Demasiadas solicitudes, intenta más tarde',
  standardHeaders: true,
  legacyHeaders: false
});
app.use(globalLimiter);

// ===== MIDDLEWARE DE SEGURIDAD PERSONALIZADO =====
app.use(securityMiddleware);

// ===== RUTAS PÚBLICAS =====
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

// ===== RUTAS PROTEGIDAS (requieren autenticación) =====
app.use('/api/courts', courtsRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/availability', availabilityRoutes);

// ===== MANEJO DE RUTAS NO ENCONTRADAS =====
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// ===== MANEJO GLOBAL DE ERRORES =====
app.use(errorHandler);

// ===== INICIAR SERVIDOR =====
const PORT = process.env.PORT || 3000;

database.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Servidor Padel4You escuchando en puerto ${PORT}`);
      console.log(`📍 Ambiente: ${process.env.NODE_ENV}`);
    });

    // ===== JOB: LIMPIAR HOLDS EXPIRADOS CADA 1 MINUTO =====
    setInterval(async () => {
      try {
        const result = await database.query(`
          UPDATE reservations
          SET status = 'cancelled', updated_at = NOW()
          WHERE status = 'pending' AND hold_until < NOW()
        `);

        if (result.rowCount > 0) {
          console.log(`🧹 Holds expirados limpiados: ${result.rowCount} reservas`);
        }
      } catch (err) {
        console.error('❌ Error limpiando holds expirados:', err);
      }
    }, 60000); // 1 minuto

    console.log('⏰ Job de limpieza de holds iniciado (cada 1 minuto)');
  })
  .catch(err => {
    console.error('❌ Error conectando a la base de datos:', err);
    process.exit(1);
  });

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Error no manejado:', err);
  process.exit(1);
});

module.exports = app;
