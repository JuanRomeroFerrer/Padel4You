-- ===== CREAR TABLAS PARA PADEL4YOU =====

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  subscription_plan VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_email ON users(email);

-- Tabla de Pistas
CREATE TABLE IF NOT EXISTS courts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(100),
  level VARCHAR(100),
  price_per_session DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_courts_active ON courts(is_active);

-- Tabla de Reservas (LA MÁS IMPORTANTE PARA SEGURIDAD)
CREATE TABLE IF NOT EXISTS reservations (
  id VARCHAR(50) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  court_id INTEGER NOT NULL REFERENCES courts(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
    -- 'pending' = en hold (3 minutos)
    -- 'confirmed' = pagada y confirmada
    -- 'completed' = ya pasó
    -- 'cancelled' = cancelada
  source VARCHAR(20),
    -- 'web' o 'desktop'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  hold_until TIMESTAMP,
    -- Cuándo expira el hold (pending se cancela automáticamente)
  synced_at TIMESTAMP,
  is_synced BOOLEAN DEFAULT false,

  -- CONSTRAINT: No permitir 2 reservas confirmadas en el mismo horario
  UNIQUE(court_id, date, start_time) WHERE status IN ('confirmed', 'pending')
);

-- Índices para optimizar queries
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_court_id ON reservations(court_id);
CREATE INDEX idx_reservations_date ON reservations(date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_hold ON reservations(hold_until) WHERE status = 'pending';

-- Tabla de Auditoría (para rastrear cambios)
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100),
  reservation_id VARCHAR(50),
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- ===== FUNCIÓN PARA LIMPIAR HOLDS EXPIRADOS =====
-- Esta función es llamada desde Node.js cada 1 minuto (en server.js)
-- NO tiene trigger automático en PostgreSQL porque:
-- 1. Las columnas hold_until no cambian (no hay UPDATE para disparar triggers)
-- 2. Es más eficiente limpiar desde la aplicación Node.js
CREATE OR REPLACE FUNCTION cancel_expired_holds()
RETURNS void AS $$
BEGIN
  UPDATE reservations
  SET status = 'cancelled', updated_at = NOW()
  WHERE status = 'pending'
    AND hold_until < NOW();
END;
$$ LANGUAGE plpgsql;

-- ===== TRIGGER PARA REGISTRAR INSERCIONES DE RESERVAS =====
CREATE OR REPLACE FUNCTION log_reservation_create()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (user_id, action, reservation_id, details)
  VALUES (
    NEW.user_id,
    'RESERVATION_CREATED',
    NEW.id,
    jsonb_build_object(
      'status', NEW.status,
      'date', NEW.date,
      'time', NEW.start_time,
      'source', NEW.source,
      'price', NEW.price
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===== TRIGGER PARA REGISTRAR ACTUALIZACIONES DE RESERVAS =====
CREATE OR REPLACE FUNCTION log_reservation_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo registrar si cambió el status
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO audit_log (user_id, action, reservation_id, details)
    VALUES (
      NEW.user_id,
      'RESERVATION_STATUS_CHANGED',
      NEW.id,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'date', NEW.date,
        'time', NEW.start_time,
        'source', NEW.source
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_reservation_create
AFTER INSERT ON reservations
FOR EACH ROW
EXECUTE FUNCTION log_reservation_create();

CREATE TRIGGER trg_log_reservation_update
AFTER UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION log_reservation_update();

-- ===== DATOS INICIALES =====
INSERT INTO courts (name, type, level, price_per_session, is_active)
VALUES
  ('Pista 1', 'Cristal panorámico', 'Todos los niveles', 20.00, true),
  ('Pista 2', 'Cristal panorámico', 'Intermedio / Avanzado', 20.00, true),
  ('Pista 3', 'Muro lateral', 'Principiante', 20.00, true)
ON CONFLICT DO NOTHING;

-- ===== VIEWS ÚTILES PARA REPORTES =====
CREATE OR REPLACE VIEW v_reservations_summary AS
SELECT
  DATE(r.date) as fecha,
  c.name as pista,
  COUNT(*) as total_reservas,
  COUNT(CASE WHEN r.status = 'confirmed' THEN 1 END) as confirmadas,
  COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completadas,
  COUNT(CASE WHEN r.status = 'cancelled' THEN 1 END) as canceladas,
  SUM(r.price) as ingresos
FROM reservations r
JOIN courts c ON r.court_id = c.id
GROUP BY DATE(r.date), c.name;

-- ===== COMENTARIOS DE SEGURIDAD =====
COMMENT ON COLUMN reservations.hold_until IS 'Tiempo hasta el cual la reserva está en "hold" (pending). Si pasa este tiempo sin confirmar, se cancela automáticamente.';
COMMENT ON COLUMN reservations.status IS 'Estados: pending (en hold 3 min), confirmed (pagada), completed (pasada), cancelled';
COMMENT ON CONSTRAINT reservations_court_id_date_start_time_key ON reservations IS 'Previene overbooking: no permitir 2 reservas confirmadas o en hold en el mismo slot';
