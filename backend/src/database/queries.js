/**
 * Database Query Functions
 * All SQL queries organized by domain
 */

const { query, transaction } = require('./db-connection');

// ==================== TIME SERIES DATA ====================

/**
 * Insert new time series data point
 */
async function insertTimeSeriesData(data) {
  const sql = `
    INSERT INTO time_series_data (
      timestamp, tvl_usd, tvl_eth, tvl_change_percent,
      unique_stakers, new_stakers_24h,
      deposit_count_24h, withdrawal_count_24h, total_volume_eth_24h, avg_transaction_size_eth,
      withdrawal_queue_size, withdrawal_queue_eth, avg_withdrawal_wait_time_hours,
      eeth_eth_price_ratio, peg_deviation_percent,
      avg_gas_price_gwei, median_gas_price_gwei,
      total_validators, active_validators,
      data_source, collection_status, error_message
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
    )
    ON CONFLICT (timestamp) DO UPDATE SET
      tvl_usd = EXCLUDED.tvl_usd,
      tvl_eth = EXCLUDED.tvl_eth,
      unique_stakers = EXCLUDED.unique_stakers,
      collection_status = EXCLUDED.collection_status
    RETURNING id, timestamp
  `;

  const values = [
    data.timestamp || new Date(),
    data.tvl_usd,
    data.tvl_eth,
    data.tvl_change_percent,
    data.unique_stakers,
    data.new_stakers_24h,
    data.deposit_count_24h,
    data.withdrawal_count_24h,
    data.total_volume_eth_24h,
    data.avg_transaction_size_eth,
    data.withdrawal_queue_size,
    data.withdrawal_queue_eth,
    data.avg_withdrawal_wait_time_hours,
    data.eeth_eth_price_ratio,
    data.peg_deviation_percent,
    data.avg_gas_price_gwei,
    data.median_gas_price_gwei,
    data.total_validators,
    data.active_validators,
    data.data_source || 'blockchain',
    data.collection_status || 'success',
    data.error_message || null,
  ];

  const result = await query(sql, values);
  return result.rows[0];
}

/**
 * Get time series data for a time range
 */
async function getTimeSeriesData(hours = 24, limit = null) {
  const sql = `
    SELECT * FROM time_series_data
    WHERE timestamp >= NOW() - INTERVAL '${hours} hours'
    ORDER BY timestamp DESC
    ${limit ? `LIMIT ${limit}` : ''}
  `;

  const result = await query(sql);
  return result.rows;
}

/**
 * Get latest metrics
 */
async function getLatestMetrics() {
  const sql = 'SELECT * FROM latest_metrics';
  const result = await query(sql);
  return result.rows[0];
}

/**
 * Get baseline statistics (for anomaly detection)
 */
async function getBaselineStats(days = 30) {
  const sql = `
    SELECT
      AVG(tvl_usd) as avg_tvl_usd,
      STDDEV(tvl_usd) as stddev_tvl_usd,
      AVG(unique_stakers) as avg_stakers,
      STDDEV(unique_stakers) as stddev_stakers,
      AVG(withdrawal_queue_size) as avg_queue_size,
      STDDEV(withdrawal_queue_size) as stddev_queue_size,
      AVG(peg_deviation_percent) as avg_peg_deviation,
      STDDEV(peg_deviation_percent) as stddev_peg_deviation,
      AVG(total_volume_eth_24h) as avg_volume,
      STDDEV(total_volume_eth_24h) as stddev_volume,
      MIN(timestamp) as period_start,
      MAX(timestamp) as period_end,
      COUNT(*) as data_points
    FROM time_series_data
    WHERE timestamp >= NOW() - INTERVAL '${days} days'
    AND collection_status = 'success'
  `;

  const result = await query(sql);
  return result.rows[0];
}

// ==================== WHALE WALLETS ====================

/**
 * Upsert whale wallet data
 */
async function upsertWhaleWallet(data) {
  const sql = `
    INSERT INTO whale_wallets (
      address, current_balance_eeth, current_balance_usd,
      balance_24h_ago, balance_7d_ago, balance_30d_ago,
      change_24h_eeth, change_24h_percent, change_7d_eeth, change_7d_percent,
      total_deposits, total_withdrawals,
      last_transaction_hash, last_transaction_time,
      rank_position, label, is_contract, is_exchange,
      last_updated
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW()
    )
    ON CONFLICT (address) DO UPDATE SET
      current_balance_eeth = EXCLUDED.current_balance_eeth,
      current_balance_usd = EXCLUDED.current_balance_usd,
      change_24h_eeth = EXCLUDED.change_24h_eeth,
      change_24h_percent = EXCLUDED.change_24h_percent,
      rank_position = EXCLUDED.rank_position,
      last_updated = NOW()
    RETURNING id, address
  `;

  const values = [
    data.address,
    data.current_balance_eeth,
    data.current_balance_usd,
    data.balance_24h_ago,
    data.balance_7d_ago,
    data.balance_30d_ago,
    data.change_24h_eeth,
    data.change_24h_percent,
    data.change_7d_eeth,
    data.change_7d_percent,
    data.total_deposits || 0,
    data.total_withdrawals || 0,
    data.last_transaction_hash,
    data.last_transaction_time,
    data.rank_position,
    data.label,
    data.is_contract || false,
    data.is_exchange || false,
  ];

  const result = await query(sql, values);
  return result.rows[0];
}

/**
 * Get top whale wallets
 */
async function getTopWhales(limit = 20) {
  const sql = `
    SELECT * FROM whale_wallets
    ORDER BY current_balance_eeth DESC
    LIMIT $1
  `;

  const result = await query(sql, [limit]);
  return result.rows;
}

/**
 * Get recent whale movements
 */
async function getRecentWhaleMovements() {
  const sql = 'SELECT * FROM recent_whale_movements';
  const result = await query(sql);
  return result.rows;
}

// ==================== ANOMALIES ====================

/**
 * Insert detected anomaly
 */
async function insertAnomaly(data) {
  const sql = `
    INSERT INTO anomalies (
      anomaly_type, severity, confidence,
      title, description, recommendation,
      affected_metrics,
      baseline_data, recent_data, statistical_significance,
      historical_comparison, similar_past_events,
      claude_prompt, claude_response, analysis_duration_ms,
      status
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
    )
    RETURNING id, detected_at
  `;

  const values = [
    data.anomaly_type,
    data.severity,
    data.confidence,
    data.title,
    data.description,
    data.recommendation,
    data.affected_metrics || [],
    JSON.stringify(data.baseline_data),
    JSON.stringify(data.recent_data),
    data.statistical_significance,
    data.historical_comparison,
    JSON.stringify(data.similar_past_events),
    data.claude_prompt,
    JSON.stringify(data.claude_response),
    data.analysis_duration_ms,
    data.status || 'active',
  ];

  const result = await query(sql, values);
  return result.rows[0];
}

/**
 * Get active anomalies
 */
async function getActiveAnomalies() {
  const sql = 'SELECT * FROM active_anomalies';
  const result = await query(sql);
  return result.rows;
}

/**
 * Get all anomalies with filters
 */
async function getAnomalies(filters = {}) {
  let sql = 'SELECT * FROM anomalies WHERE 1=1';
  const values = [];
  let paramCount = 1;

  if (filters.status) {
    sql += ` AND status = $${paramCount}`;
    values.push(filters.status);
    paramCount++;
  }

  if (filters.severity) {
    sql += ` AND severity = $${paramCount}`;
    values.push(filters.severity);
    paramCount++;
  }

  if (filters.type) {
    sql += ` AND anomaly_type = $${paramCount}`;
    values.push(filters.type);
    paramCount++;
  }

  if (filters.since) {
    sql += ` AND detected_at >= $${paramCount}`;
    values.push(filters.since);
    paramCount++;
  }

  sql += ` ORDER BY detected_at DESC`;

  if (filters.limit) {
    sql += ` LIMIT $${paramCount}`;
    values.push(filters.limit);
  }

  const result = await query(sql, values);
  return result.rows;
}

/**
 * Get anomaly by ID
 */
async function getAnomalyById(id) {
  const sql = `
    UPDATE anomalies
    SET view_count = view_count + 1, last_viewed_at = NOW()
    WHERE id = $1
    RETURNING *
  `;

  const result = await query(sql, [id]);
  return result.rows[0];
}

// ==================== TWITTER SENTIMENT ====================

/**
 * Insert twitter sentiment data
 */
async function insertTwitterSentiment(data) {
  const sql = `
    INSERT INTO twitter_sentiment (
      tweet_id, tweet_text, author_username, author_followers,
      sentiment_score, sentiment_label, confidence,
      retweet_count, like_count, reply_count,
      keywords, is_influential,
      timestamp
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
    )
    ON CONFLICT (tweet_id) DO UPDATE SET
      retweet_count = EXCLUDED.retweet_count,
      like_count = EXCLUDED.like_count,
      reply_count = EXCLUDED.reply_count
    RETURNING id
  `;

  const values = [
    data.tweet_id,
    data.tweet_text,
    data.author_username,
    data.author_followers,
    data.sentiment_score,
    data.sentiment_label,
    data.confidence,
    data.retweet_count,
    data.like_count,
    data.reply_count,
    data.keywords || [],
    data.is_influential || false,
    data.timestamp || new Date(),
  ];

  const result = await query(sql, values);
  return result.rows[0];
}

/**
 * Get sentiment statistics for a time period
 */
async function getSentimentStats(hours = 24) {
  const sql = `
    SELECT
      AVG(sentiment_score) as avg_sentiment,
      COUNT(*) FILTER (WHERE sentiment_label = 'positive') as positive_count,
      COUNT(*) FILTER (WHERE sentiment_label = 'negative') as negative_count,
      COUNT(*) FILTER (WHERE sentiment_label = 'neutral') as neutral_count,
      COUNT(*) as total_tweets,
      SUM(retweet_count) as total_retweets,
      SUM(like_count) as total_likes
    FROM twitter_sentiment
    WHERE timestamp >= NOW() - INTERVAL '${hours} hours'
  `;

  const result = await query(sql);
  return result.rows[0];
}

// ==================== VALIDATOR METRICS ====================

/**
 * Insert validator metrics
 */
async function insertValidatorMetrics(data) {
  const sql = `
    INSERT INTO validator_metrics (
      timestamp, total_validators, active_validators, exited_validators, slashed_validators,
      avg_effectiveness, total_rewards_eth, total_penalties_eth, net_rewards_eth,
      estimated_apr, estimated_apy,
      etherfi_apr, network_avg_apr, apr_vs_network
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
    )
    ON CONFLICT (timestamp) DO UPDATE SET
      active_validators = EXCLUDED.active_validators,
      estimated_apr = EXCLUDED.estimated_apr
    RETURNING id
  `;

  const values = [
    data.timestamp || new Date(),
    data.total_validators,
    data.active_validators,
    data.exited_validators,
    data.slashed_validators,
    data.avg_effectiveness,
    data.total_rewards_eth,
    data.total_penalties_eth,
    data.net_rewards_eth,
    data.estimated_apr,
    data.estimated_apy,
    data.etherfi_apr,
    data.network_avg_apr,
    data.apr_vs_network,
  ];

  const result = await query(sql, values);
  return result.rows[0];
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Clean up old data
 */
async function cleanupOldData() {
  const sql = 'SELECT cleanup_old_data()';
  await query(sql);
  console.log('[DB] Old data cleanup completed');
}

/**
 * Get database statistics
 */
async function getDatabaseStats() {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM time_series_data) as total_data_points,
      (SELECT COUNT(*) FROM whale_wallets) as total_whales,
      (SELECT COUNT(*) FROM anomalies) as total_anomalies,
      (SELECT COUNT(*) FROM anomalies WHERE status = 'active') as active_anomalies,
      (SELECT COUNT(*) FROM twitter_sentiment) as total_tweets,
      (SELECT MAX(timestamp) FROM time_series_data) as last_collection,
      (SELECT MAX(detected_at) FROM anomalies) as last_anomaly_detection
  `;

  const result = await query(sql);
  return result.rows[0];
}

module.exports = {
  // Time series
  insertTimeSeriesData,
  getTimeSeriesData,
  getLatestMetrics,
  getBaselineStats,

  // Whale wallets
  upsertWhaleWallet,
  getTopWhales,
  getRecentWhaleMovements,

  // Anomalies
  insertAnomaly,
  getActiveAnomalies,
  getAnomalies,
  getAnomalyById,

  // Twitter
  insertTwitterSentiment,
  getSentimentStats,

  // Validators
  insertValidatorMetrics,

  // Utilities
  cleanupOldData,
  getDatabaseStats,
};
