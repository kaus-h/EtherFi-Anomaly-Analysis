/**
 * Database Connection Test Script
 * Verifies database connectivity and performs basic operations
 */

const {
  testConnection,
  healthCheck,
  closePool,
  query,
} = require('./db-connection');

const {
  insertTimeSeriesData,
  getLatestMetrics,
  getDatabaseStats,
} = require('./queries');

async function main() {
  console.log('='.repeat(60));
  console.log('Database Connection & Functionality Test');
  console.log('='.repeat(60));
  console.log();

  try {
    // Test 1: Basic connection
    console.log('[Test 1/5] Testing database connection...');
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    console.log('✅ Connection test passed\n');

    // Test 2: Health check
    console.log('[Test 2/5] Running health check...');
    const health = await healthCheck();
    console.log('Health status:', JSON.stringify(health, null, 2));
    console.log('✅ Health check passed\n');

    // Test 3: Database stats
    console.log('[Test 3/5] Fetching database statistics...');
    const stats = await getDatabaseStats();
    console.log('Database statistics:', JSON.stringify(stats, null, 2));
    console.log('✅ Stats query passed\n');

    // Test 4: Insert test data
    console.log('[Test 4/5] Inserting test time series data...');
    const testData = {
      timestamp: new Date(),
      tvl_usd: 1000000,
      tvl_eth: 500,
      unique_stakers: 100,
      deposit_count_24h: 10,
      withdrawal_count_24h: 5,
      collection_status: 'test',
    };

    const inserted = await insertTimeSeriesData(testData);
    console.log('Inserted test data:', inserted);
    console.log('✅ Insert test passed\n');

    // Test 5: Query test data
    console.log('[Test 5/5] Querying latest metrics...');
    const latest = await getLatestMetrics();
    console.log('Latest metrics:', JSON.stringify(latest, null, 2));
    console.log('✅ Query test passed\n');

    // Cleanup test data
    console.log('Cleaning up test data...');
    await query("DELETE FROM time_series_data WHERE collection_status = 'test'");
    console.log('✅ Cleanup completed\n');

    console.log('='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log();
    console.log('Database is ready for use.');
    console.log();

  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error('Error:', error.message);
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
