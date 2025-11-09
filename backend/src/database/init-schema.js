/**
 * Database Schema Initialization Script
 * Run this to create all tables and initial data
 */

const { initializeSchema, testConnection, closePool } = require('./db-connection');

async function main() {
  console.log('='.repeat(60));
  console.log('EtherFi Anomaly Detection - Database Initialization');
  console.log('='.repeat(60));
  console.log();

  try {
    // Test connection first
    console.log('[1/2] Testing database connection...');
    const connected = await testConnection();

    if (!connected) {
      console.error('❌ Failed to connect to database');
      console.error('Please check your database configuration in .env file');
      process.exit(1);
    }

    console.log('✅ Database connection successful\n');

    // Initialize schema
    console.log('[2/2] Initializing database schema...');
    await initializeSchema();
    console.log('✅ Database schema initialized successfully\n');

    console.log('='.repeat(60));
    console.log('✅ Database setup completed successfully!');
    console.log('='.repeat(60));
    console.log();
    console.log('Next steps:');
    console.log('  1. Run "npm run load-history" to fetch historical data');
    console.log('  2. Run "npm start" to start the backend server');
    console.log();

  } catch (error) {
    console.error('\n❌ Database initialization failed:');
    console.error(error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
