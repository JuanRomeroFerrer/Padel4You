const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const database = require('../config/database');
const { generateToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// ===== RATE LIMITING PARA LOGIN =====
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos
  message: 'Demasiados intentos de login, intenta en 15 minutos',
  skipSuccessfulRequests: true
});

// ===== REGISTER =====
router.post('/register',
  loginLimiter,
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Contraseña mínimo 8 caracteres'),
  body('name').trim().notEmpty().withMessage('Nombre requerido'),
  body('phone').matches(/^\+?[0-9\s\-()]{7,}$/).withMessage('Teléfono inválido'),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validación fallida',
          errors: errors.array()
        });
      }

      const { email, password, name, phone } = req.body;

      // Verificar si el usuario ya existe
      const existingUser = await database.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }

      // Hash de contraseña
      const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || 12));

      // Crear usuario
      const result = await database.query(
        `INSERT INTO users (email, password_hash, name, phone, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING id, email, name`,
        [email, hashedPassword, name, phone]
      );

      const user = result.rows[0];
      const token = generateToken(user.id, user.email);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({
        success: false,
        message: 'Error registrando usuario'
      });
    }
  }
);

// ===== LOGIN =====
router.post('/login',
  loginLimiter,
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Contraseña requerida'),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validación fallida',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Buscar usuario
      const result = await database.query(
        'SELECT id, email, name, password_hash FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        // No revelar si email existe o contraseña es incorrecta
        return res.status(401).json({
          success: false,
          message: 'Email o contraseña incorrectos'
        });
      }

      const user = result.rows[0];

      // Verificar contraseña
      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Email o contraseña incorrectos'
        });
      }

      // Registrar login
      await database.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );

      const token = generateToken(user.id, user.email);

      res.json({
        success: true,
        message: 'Login exitoso',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error en login'
      });
    }
  }
);

// ===== LOGOUT =====
// Endpoint para cerrar sesión (invalidar token en cliente)
router.post('/logout', (req, res) => {
  // En una implementación más robusta, se agregaría token a una blacklist
  // Por ahora, el cliente debe limpiar el token del localStorage
  res.json({
    success: true,
    message: 'Sesión cerrada exitosamente'
  });
});

module.exports = router;
