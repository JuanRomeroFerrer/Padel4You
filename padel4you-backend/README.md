# Padel4You Backend API

Backend seguro para el sistema de reservas de pádel con protección contra robos de reserva.

## 🔒 Características de Seguridad

✅ **Hold Temporal de 3 Minutos**
- Al reservar, el slot se retiene por 3 minutos
- Previene robos de reserva durante el pago
- Si no confirma en 3 min, se libera automáticamente

✅ **Autenticación JWT**
- Tokens con expiración (7 días)
- Validación en todas las rutas protegidas
- Logout automático al expirar

✅ **Protección Contra Ataques**
- Prevención de inyección SQL (queries parametrizadas)
- Rate limiting (máx 5 logins cada 15 min)
- CSRF protection
- Helmet para headers de seguridad

✅ **Transacciones ACID**
- Lock exclusivo en BD para evitar race conditions
- Rollback automático en errores
- Garantiza consistencia de datos

✅ **Validación de Entrada**
- Email, teléfono, fecha validados
- Rechazo de caracteres peligrosos
- Mensajes de error genéricos (no revelar si usuario existe)

✅ **Auditoría**
- Registro de todos los cambios en reservas
- IP de usuario, timestamp, acción

## 🚀 Instalación Local

```bash
# 1. Clonar o descargar el proyecto
cd padel4you-backend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 4. Crear base de datos en PostgreSQL
psql -U postgres -d padel4you_db -f database/schema.sql

# 5. Iniciar servidor
npm run dev
```

## 🌐 Desplegar en Railway

### Paso 1: Crear BD PostgreSQL en Railway

```bash
1. Ir a railway.app
2. Click "+ New Project"
3. Seleccionar "Database"
4. Elegir PostgreSQL
5. Copiar DATABASE_URL
```

### Paso 2: Crear Servicio Backend en Railway

```bash
1. "+ New Service" → "GitHub Repo" (conectar repo)
2. Seleccionar rama: main
3. Auto-deploy habilitado
4. Settings → Environment
5. Agregar variables:
   - DATABASE_URL (pegado desde paso 1)
   - NODE_ENV=production
   - JWT_SECRET=tu-secreto-aleatorio
   - BCRYPT_ROUNDS=12
   - CORS_ORIGIN=https://tu-web.railway.app,https://tu-dominio.com
```

### Paso 3: Crear Base de Datos

```bash
# Desde Railway CLI
railway link <PROJECT_ID>
railway run psql -f database/schema.sql
```

### Paso 4: Verificar Despliegue

```bash
GET https://tu-backend.railway.app/api/health

Respuesta:
{
  "success": true,
  "status": "online",
  "database": "connected"
}
```

## 📡 Endpoints API

### Autenticación (Público)

```
POST /api/auth/register
{
  "email": "usuario@example.com",
  "password": "micontraseña123",
  "name": "Juan García",
  "phone": "+34 612 345 678"
}

Respuesta:
{
  "success": true,
  "token": "eyJhbGc...",
  "user": { "id": 1, "email": "...", "name": "..." }
}
```

```
POST /api/auth/login
{
  "email": "usuario@example.com",
  "password": "micontraseña123"
}
```

### Pistas (Autenticado)

```
GET /api/courts
Respuesta: Lista de todas las pistas activas

GET /api/courts/:id
Respuesta: Detalles de una pista
```

### Disponibilidad (Autenticado)

```
GET /api/availability/courts/:courtId/date/:date

Ejemplo:
GET /api/availability/courts/1/date/2026-05-28

Respuesta:
{
  "success": true,
  "date": "2026-05-28",
  "day": "mié",
  "availableSlots": ["09:00", "10:30", "12:00"],
  "occupiedSlots": ["19:00", "20:30"],
  "availableCount": 3
}
```

### Reservas (Autenticado)

```
POST /api/reservations
{
  "courtId": 1,
  "date": "2026-05-28",
  "startTime": "19:00",
  "endTime": "20:30"
}

Respuesta (⚠️ RESERVA EN HOLD 3 MIN):
{
  "success": true,
  "message": "Reserva retenida por 3 minutos. Completa el pago para confirmarla.",
  "reservation": {
    "id": "R1A2B3C4",
    "status": "pending",
    "holdUntil": "2026-05-15T12:03:00Z",
    "holdDurationMinutes": 3,
    "price": 20.00
  }
}

PUT /api/reservations/:id/confirm
(Después del pago, cambiar status de "pending" a "confirmed")

GET /api/reservations
(Obtener mis reservas)

DELETE /api/reservations/:id
(Cancelar reserva)
```

## 🛡️ Sistema de Hold (3 Minutos)

### Flujo Seguro:

```
1. Usuario pulsa "Reservar" en web
   ├─ POST /api/reservations
   └─ Respuesta: status=pending, holdUntil=ahora+3min

2. Web REDIRIGE A PAGO
   └─ Usuario ve: "⏱️ Tienes 3 minutos para pagar"

3. DURANTE ESTOS 3 MINUTOS:
   ├─ Otro usuario NO puede reservar ese slot
   │  (verificación: hold_until > NOW() en BD)
   └─ Si otro intenta:
      └─ Respuesta 409: "Este horario está ocupado"

4. DESPUÉS DEL PAGO:
   ├─ Web hace: PUT /api/reservations/:id/confirm
   ├─ Status cambia: pending → confirmed
   └─ Reserva es permanente

5. SI NO PAGA EN 3 MIN:
   ├─ Trigger automático en BD
   ├─ Status: pending → cancelled
   └─ Slot queda libre para otros
```

## 🔐 Encabezados de Autenticación

Todas las rutas protegidas necesitan:

```
Authorization: Bearer eyJhbGc...token...
Content-Type: application/json
```

Ejemplo con curl:

```bash
curl -H "Authorization: Bearer eyJhbGc..." \
     -H "Content-Type: application/json" \
     https://api.padel4you.railway.app/api/courts
```

## 📊 Estructura de Carpetas

```
padel4you-backend/
├── src/
│   ├── server.js                    # Punto de entrada
│   ├── config/
│   │   └── database.js              # Conexión PostgreSQL
│   ├── middleware/
│   │   ├── auth.js                  # JWT
│   │   ├── security.js              # Protecciones
│   │   └── errorHandler.js          # Manejo errores
│   └── routes/
│       ├── auth.js                  # Login, registro
│       ├── courts.js                # Pistas
│       ├── reservations.js          # ⭐ RESERVAS (hold 3 min)
│       ├── availability.js          # Disponibilidad
│       └── health.js                # Health check
├── database/
│   └── schema.sql                   # Creación de tablas
├── .env.example                     # Variables de entorno
├── package.json
└── README.md
```

## 🐛 Solucionar Problemas

### "Error conectando a BD"
```bash
# Verificar DATABASE_URL
echo $DATABASE_URL

# Verificar formato:
postgresql://user:password@host:5432/database
```

### "CORS error en web"
```
Editar .env:
CORS_ORIGIN=https://tu-web.railway.app
```

### "Rate limit exceeded"
```
Esperar 15 minutos o cambiar valores en .env:
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📈 Monitoreo en Producción

### Logs en Railway

```bash
railway logs -s padel4you-backend
```

### Ver queries lentas

Backend registra queries > 1000ms automáticamente.

### Auditoría de cambios

```sql
SELECT * FROM audit_log
WHERE user_id = 1
ORDER BY created_at DESC
LIMIT 20;
```

## 🔄 Sincronización Desktop

El Desktop (Java) se conecta de esta forma:

```javascript
// Cada 15 segundos (Desktop):

GET /api/health
// Verificar si servidor está vivo

GET /api/availability/courts/:id/date/:date
// Descargar disponibilidad

POST /api/reservations/sync
// Sincronizar reservas locales pendientes
```

## 📝 Logs de Seguridad

Todas las acciones se registran:

```
[2026-05-15T12:00:15] POST /api/reservations - IP: 192.168.1.1
[2026-05-15T12:00:16] PUT /api/reservations/R1A2B3C4/confirm - IP: 192.168.1.1
```

## ✅ Checklist de Seguridad

- [x] Contraseñas hasheadas (bcrypt)
- [x] Autenticación JWT
- [x] Validación de entrada
- [x] Rate limiting
- [x] CSRF protection
- [x] Transacciones ACID
- [x] Auditoría
- [x] HTTPS/SSL (en Railway)
- [x] Hold temporal 3 min
- [x] Prevención race conditions
- [x] Headers de seguridad

## 🆘 Soporte

Si encuentras bugs de seguridad:
1. NO los publiques públicamente
2. Reporte a: soporte@padel4you.es
3. Describe el problema paso a paso
