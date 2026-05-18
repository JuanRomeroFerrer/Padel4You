const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Error inesperado en pool de conexiones', err);
});

module.exports = {
  async connect() {
    const client = await pool.connect();
    try {
      await client.query('SELECT NOW()');
      console.log('✅ Conectado a PostgreSQL');
    } finally {
      client.release();
    }
  },

  async query(text, params = []) {
    const start = Date.now();
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      if (duration > 1000) {
        console.warn(`⚠️ Query lenta (${duration}ms):`, text.substring(0, 50));
      }
      return result;
    } catch (error) {
      console.error('❌ Error en query:', error);
      throw error;
    }
  },

  async transaction(callback) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  getPool() {
    return pool;
  }
};
