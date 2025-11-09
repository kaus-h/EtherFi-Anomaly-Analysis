-- EtherFi Anomaly Detection System Database Schema
-- PostgreSQL 12+

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS anomalies CASCADE;
DROP TABLE IF EXISTS twitter_sentiment CASCADE;
DROP TABLE IF EXISTS whale_wallets CASCADE;
DROP TABLE IF EXISTS time_series_data CASCADE;
DROP TABLE IF EXISTS validator_metrics CASCADE;

-- Time series data table - stores all metrics collected every 5 minutes
CREATE TABLE time_series_data (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- TVL Metrics
    tvl_usd NUMERIC(20, 2),
    tvl_eth NUMERIC(20, 8),
    tvl_change_percent NUMERIC(10, 4),

    -- Staker Metrics
    unique_stakers INTEGER,
    new_stakers_24h INTEGER,

    -- Transaction Metrics
    deposit_count_24h INTEGER,
    withdrawal_count_24h INTEGER,
    total_volume_eth_24h NUMERIC(20, 8),
    avg_transaction_size_eth NUMERIC(20, 8),

    -- Withdrawal Queue Metrics
    withdrawal_queue_size INTEGER,
    withdrawal_queue_eth NUMERIC(20, 8),
    avg_withdrawal_wait_time_hours NUMERIC(10, 2),

    -- Peg Health Metrics
    eeth_eth_price_ratio NUMERIC(10, 8),
    peg_deviation_percent NUMERIC(10, 4),

    -- Gas Metrics
    avg_gas_price_gwei NUMERIC(10, 2),
    median_gas_price_gwei NUMERIC(10, 2),

    -- Validator Metrics Summary
    total_validators INTEGER,
    active_validators INTEGER,

    -- Metadata
    data_source VARCHAR(50) DEFAULT 'blockchain',
    collection_status VARCHAR(20) DEFAULT 'success',
    error_message TEXT,

    CONSTRAINT unique_timestamp UNIQUE (timestamp)
);

-- Index for time-based queries
CREATE INDEX idx_time_series_timestamp ON time_series_data(timestamp DESC);
CREATE INDEX idx_time_series_tvl ON time_series_data(tvl_usd);
CREATE INDEX idx_time_series_peg ON time_series_data(peg_deviation_percent);

-- Whale wallets - Top 20 tracked addresses
CREATE TABLE whale_wallets (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) NOT NULL,
    first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Current Holdings
    current_balance_eeth NUMERIC(20, 8),
    current_balance_usd NUMERIC(20, 2),

    -- Historical Tracking
    balance_24h_ago NUMERIC(20, 8),
    balance_7d_ago NUMERIC(20, 8),
    balance_30d_ago NUMERIC(20, 8),

    -- Change Metrics
    change_24h_eeth NUMERIC(20, 8),
    change_24h_percent NUMERIC(10, 4),
    change_7d_eeth NUMERIC(20, 8),
    change_7d_percent NUMERIC(10, 4),

    -- Activity Metrics
    total_deposits INTEGER DEFAULT 0,
    total_withdrawals INTEGER DEFAULT 0,
    last_transaction_hash VARCHAR(66),
    last_transaction_time TIMESTAMPTZ,

    -- Ranking
    rank_position INTEGER,

    -- Labels (if known)
    label VARCHAR(100),
    is_contract BOOLEAN DEFAULT FALSE,
    is_exchange BOOLEAN DEFAULT FALSE,

    CONSTRAINT unique_address UNIQUE (address)
);

-- Indexes for whale wallet queries
CREATE INDEX idx_whale_address ON whale_wallets(address);
CREATE INDEX idx_whale_balance ON whale_wallets(current_balance_eeth DESC);
CREATE INDEX idx_whale_rank ON whale_wallets(rank_position);
CREATE INDEX idx_whale_change ON whale_wallets(change_24h_percent DESC);

-- Twitter sentiment data
CREATE TABLE twitter_sentiment (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Tweet Data
    tweet_id VARCHAR(100),
    tweet_text TEXT,
    author_username VARCHAR(100),
    author_followers INTEGER,

    -- Sentiment Scores
    sentiment_score NUMERIC(3, 2), -- -1.0 to 1.0
    sentiment_label VARCHAR(20), -- positive, negative, neutral
    confidence NUMERIC(3, 2), -- 0.0 to 1.0

    -- Engagement Metrics
    retweet_count INTEGER,
    like_count INTEGER,
    reply_count INTEGER,

    -- Categorization
    keywords TEXT[], -- Array of matched keywords
    is_influential BOOLEAN DEFAULT FALSE,

    CONSTRAINT unique_tweet UNIQUE (tweet_id)
);

-- Index for sentiment queries
CREATE INDEX idx_sentiment_timestamp ON twitter_sentiment(timestamp DESC);
CREATE INDEX idx_sentiment_score ON twitter_sentiment(sentiment_score);
CREATE INDEX idx_sentiment_label ON twitter_sentiment(sentiment_label);

-- Validator performance metrics
CREATE TABLE validator_metrics (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Validator Performance
    total_validators INTEGER,
    active_validators INTEGER,
    exited_validators INTEGER,
    slashed_validators INTEGER,

    -- Performance Metrics
    avg_effectiveness NUMERIC(5, 4), -- 0.0 to 1.0
    total_rewards_eth NUMERIC(20, 8),
    total_penalties_eth NUMERIC(20, 8),
    net_rewards_eth NUMERIC(20, 8),

    -- APR/APY
    estimated_apr NUMERIC(10, 4),
    estimated_apy NUMERIC(10, 4),

    -- Comparison
    etherfi_apr NUMERIC(10, 4),
    network_avg_apr NUMERIC(10, 4),
    apr_vs_network NUMERIC(10, 4), -- Difference

    CONSTRAINT unique_validator_timestamp UNIQUE (timestamp)
);

CREATE INDEX idx_validator_timestamp ON validator_metrics(timestamp DESC);

-- Anomalies detected by Claude AI
CREATE TABLE anomalies (
    id SERIAL PRIMARY KEY,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Anomaly Classification
    anomaly_type VARCHAR(50) NOT NULL, -- whale_movement, peg_deviation, tvl_change, queue_spike, unusual_pattern
    severity VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    confidence NUMERIC(3, 2) NOT NULL, -- 0.0 to 1.0

    -- Details
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    recommendation TEXT,

    -- Affected Metrics
    affected_metrics TEXT[], -- Array of metric names

    -- Data Context
    baseline_data JSONB, -- 30-day baseline statistics
    recent_data JSONB, -- Recent data that triggered anomaly
    statistical_significance NUMERIC(10, 6),

    -- Historical Comparison
    historical_comparison TEXT,
    similar_past_events JSONB,

    -- AI Analysis
    claude_prompt TEXT, -- The prompt sent to Claude
    claude_response JSONB, -- Full Claude response
    analysis_duration_ms INTEGER,

    -- Status Tracking
    status VARCHAR(20) DEFAULT 'active', -- active, resolved, false_positive
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,

    -- User Interaction
    user_acknowledged BOOLEAN DEFAULT FALSE,
    user_notes TEXT,

    -- Metrics
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMPTZ
);

-- Indexes for anomaly queries
CREATE INDEX idx_anomaly_detected_at ON anomalies(detected_at DESC);
CREATE INDEX idx_anomaly_type ON anomalies(anomaly_type);
CREATE INDEX idx_anomaly_severity ON anomalies(severity);
CREATE INDEX idx_anomaly_status ON anomalies(status);
CREATE INDEX idx_anomaly_confidence ON anomalies(confidence DESC);

-- Create a view for latest metrics
CREATE OR REPLACE VIEW latest_metrics AS
SELECT
    timestamp,
    tvl_usd,
    tvl_eth,
    unique_stakers,
    withdrawal_queue_size,
    eeth_eth_price_ratio,
    peg_deviation_percent,
    total_volume_eth_24h,
    avg_gas_price_gwei
FROM time_series_data
ORDER BY timestamp DESC
LIMIT 1;

-- Create a view for active anomalies
CREATE OR REPLACE VIEW active_anomalies AS
SELECT
    id,
    detected_at,
    anomaly_type,
    severity,
    confidence,
    title,
    description,
    affected_metrics,
    recommendation
FROM anomalies
WHERE status = 'active'
ORDER BY
    CASE severity
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        WHEN 'LOW' THEN 4
    END,
    detected_at DESC;

-- Create a view for whale movements (last 24 hours)
CREATE OR REPLACE VIEW recent_whale_movements AS
SELECT
    address,
    label,
    current_balance_eeth,
    change_24h_eeth,
    change_24h_percent,
    last_transaction_time,
    rank_position
FROM whale_wallets
WHERE ABS(change_24h_percent) > 5 -- Significant movement threshold
ORDER BY ABS(change_24h_percent) DESC;

-- Create function to clean old data (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Keep time series data for 90 days
    DELETE FROM time_series_data
    WHERE timestamp < NOW() - INTERVAL '90 days';

    -- Keep sentiment data for 60 days
    DELETE FROM twitter_sentiment
    WHERE timestamp < NOW() - INTERVAL '60 days';

    -- Keep resolved anomalies for 90 days
    DELETE FROM anomalies
    WHERE status = 'resolved'
    AND resolved_at < NOW() - INTERVAL '90 days';

    -- Keep validator metrics for 90 days
    DELETE FROM validator_metrics
    WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions (adjust user as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO etherfi_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO etherfi_user;

-- Insert initial placeholder for testing (will be replaced with real data)
INSERT INTO time_series_data (
    timestamp,
    tvl_usd,
    tvl_eth,
    unique_stakers,
    collection_status
) VALUES (
    NOW(),
    0,
    0,
    0,
    'initial'
) ON CONFLICT (timestamp) DO NOTHING;

-- Success message
SELECT 'Database schema created successfully!' as status;
