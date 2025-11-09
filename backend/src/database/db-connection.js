/**
 * PostgreSQL Database Connection Pool
 * Manages database connections with automatic reconnection and health checks
 */

const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'etherfi_anomaly',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',

  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  min: 2, // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return error after 5 seconds if connection cannot be established
  maxUses: 7500, // Close and replace a connection after it has been used 7500 times

  // Performance settings
  statement_timeout: 30000, // 30 second query timeout
  query_timeout: 30000,

  // SSL settings (disable for local development)
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

// Create connection pool
const pool = new Pool(dbConfig);

// Pool event handlers
pool.on('connect', (client) => {
  console.log('[DB] New client connected to database');
});

pool.on('error', (err, client) => {
  console.error('[DB] Unexpected error on idle client', err);
  process.exit(-1);
});

pool.on('remove', (client) => {
  console.log('[DB] Client removed from pool');
});

/**
 * Execute a query with automatic error handling
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    // Log slow queries (>1 second)
    if (duration > 1000) {
      console.warn(`[DB] Slow query detected (${duration}ms):`, text.substring(0, 100));
    }

    return result;
  } catch (error) {
    console.error('[DB] Query error:', error.message);
    console.error('[DB] Query text:', text);
    console.error('[DB] Query params:', params);
    throw error;
  }
}

/**
 * Get a client from the pool for transaction support
 * @returns {Promise<Object>} Database client
 */
async function getClient() {
  const client = await pool.connect();
  const originalRelease = client.release.bind(client);

  // Wrap release to add logging
  client.release = () => {
    client.release = originalRelease;
    return client.release();
  };

  return client;
}

/**
 * Execute a transaction with automatic rollback on error
 * @param {Function} callback - Async function that receives client as parameter
 * @returns {Promise<any>} Result of the callback
 */
async function transaction(callback) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[DB] Transaction rolled back due to error:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Test database connectivity
 * @returns {Promise<boolean>} True if connected successfully
 */
async function testConnection() {
  try {
    const result = await query('SELECT NOW() as current_time, version() as pg_version');
    console.log('[DB] Connection successful!');
    console.log('[DB] Current time:', result.rows[0].current_time);
    console.log('[DB] PostgreSQL version:', result.rows[0].pg_version);
    return true;
  } catch (error) {
    console.error('[DB] Connection failed:', error.message);
    return false;
  }
}

/**
 * Initialize database schema from SQL file
 * @returns {Promise<boolean>} True if successful
 */
async function initializeSchema() {
  const fs = require('fs');
  const path = require('path');

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('[DB] Initializing database schema...');
    await query(schemaSql);
    console.log('[DB] Schema initialized successfully!');
    return true;
  } catch (error) {
    console.error('[DB] Failed to initialize schema:', error.message);
    throw error;
  }
}

/**
 * Check database health
 * @returns {Promise<Object>} Health status
 */
async function healthCheck() {
  try {
    const poolStats = {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount,
    };

    const result = await query(`
      SELECT
        (SELECT COUNT(*) FROM time_series_data) as time_series_count,
        (SELECT COUNT(*) FROM whale_wallets) as whale_count,
        (SELECT COUNT(*) FROM anomalies WHERE status = 'active') as active_anomalies,
        (SELECT MAX(timestamp) FROM time_series_data) as last_collection
    `);

    return {
      status: 'healthy',
      pool: poolStats,
      data: result.rows[0],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Gracefully close all database connections
 * @returns {Promise<void>}
 */
async function closePool() {
  try {
    await pool.end();
    console.log('[DB] Connection pool closed gracefully');
  } catch (error) {
    console.error('[DB] Error closing connection pool:', error.message);
    throw error;
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('[DB] Received SIGINT, closing database connections...');
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[DB] Received SIGTERM, closing database connections...');
  await closePool();
  process.exit(0);
});

module.exports = {
  query,
  getClient,
  transaction,
  testConnection,
  initializeSchema,
  healthCheck,
  closePool,
  pool, // Export pool for direct access if needed
};
