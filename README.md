# EtherFi Anomaly Detection System

A production-quality autonomous system that monitors EtherFi protocol on-chain data in real-time, detects anomalies using Claude AI for pattern recognition, and displays findings on a React dashboard.

## 🎯 Project Overview

This system provides:
- **Real-time Blockchain Monitoring**: Collects EtherFi protocol data every 5 minutes
- **AI-Powered Anomaly Detection**: Claude Sonnet 4 analyzes patterns every 30 minutes
- **Live Dashboard**: React-based UI with WebSocket updates
- **No Mock Data**: 100% real blockchain data and AI analysis

## 🏗️ Technical Stack

- **Backend**: Node.js with Express
- **Database**: PostgreSQL 16 (with connection pooling)
- **Frontend**: React 18 with WebSocket for real-time updates
- **Blockchain**: ethers.js v6 with Alchemy API
- **AI**: Anthropic Claude API (Sonnet 4)
- **Logging**: Winston structured logging

## 📊 Data Sources Tracked

1. **Total Value Locked (TVL)** in EtherFi
2. **Unique stakers** count
3. **Top 20 whale wallets** and movements (PRIORITY 1)
4. **Withdrawal queue** size/time (PRIORITY 2)
5. **Transaction volume** - deposits/withdrawals (PRIORITY 3)
6. **eETH/ETH price ratio** - peg health (PRIORITY 4)
7. **Validator performance** metrics (PRIORITY 5)
8. **Gas prices** for EtherFi transactions
9. **Twitter sentiment** analysis

## 🚀 Quick Start

### Prerequisites

- Node.js v12.22.9+ (v18+ recommended)
- PostgreSQL 16
- WSL (Windows Subsystem for Linux)

### Installation

1. **Clone and navigate to the project**:
   ```bash
   cd /home/user/EtherFi-Anomaly-Analysis
   ```

2. **Install backend dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Start PostgreSQL** (if not running):
   ```bash
   pg_ctlcluster 16 main start
   ```

4. **Initialize the database**:
   ```bash
   npm run init-db
   ```

5. **Test database connection**:
   ```bash
   npm test
   ```

## 📁 Project Structure

```
etherfi-anomaly-detector/
├── backend/
│   ├── src/
│   │   ├── collectors/         # Blockchain & Twitter data collectors
│   │   ├── analysis/           # AI anomaly detection engine
│   │   ├── database/           # PostgreSQL connection & queries
│   │   │   ├── schema.sql      # Complete database schema
│   │   │   ├── db-connection.js
│   │   │   ├── queries.js
│   │   │   ├── init-schema.js  # Schema initialization script
│   │   │   └── test-connection.js
│   │   ├── api/                # Express routes & WebSocket
│   │   ├── utils/              # Logger & error handling
│   │   └── server.js           # Main entry point
│   ├── config/
│   │   └── contracts.js        # EtherFi contract ABIs & addresses
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── services/           # API & WebSocket clients
│   │   └── App.jsx
│   └── package.json
├── .env                        # Environment variables
└── README.md
```

## 🗄️ Database Schema

The system uses PostgreSQL with the following main tables:

### `time_series_data`
Stores all metrics collected every 5 minutes:
- TVL (USD and ETH)
- Staker counts
- Transaction volumes
- Withdrawal queue metrics
- Peg deviation
- Gas prices
- Validator counts

### `whale_wallets`
Tracks top 20 eETH holders:
- Current balance
- 24h/7d/30d changes
- Transaction history
- Labels (exchange, contract, etc.)

### `anomalies`
AI-detected anomalies:
- Type (whale_movement, peg_deviation, tvl_change, etc.)
- Severity (LOW, MEDIUM, HIGH, CRITICAL)
- Confidence score
- Claude's analysis and recommendations
- Historical comparisons

### `twitter_sentiment`
Social media sentiment tracking:
- Tweet content and metadata
- Sentiment scores (-1.0 to 1.0)
- Engagement metrics

### `validator_metrics`
Validator performance data:
- Active/exited/slashed validators
- APR/APY estimates
- Rewards and penalties

## 🔑 EtherFi Contract Addresses (Mainnet)

- **eETH Token**: `0x35fA164735182de50811E8e2E824cFb9B6118ac2`
- **Liquidity Pool**: `0x308861A430be4cce5502d0A12724771Fc6DaF216`
- **Staking Manager**: `0x3d320286E014C3e1ce99Af6d6B00f0C1D63E3000`
- **Withdrawal Queue**: `0x7d5706f6ef3F89B3951E23e557CDFBC3239D4E2c`

## 📋 Phase 1 Status: ✅ COMPLETED

**Completed Tasks:**
- [x] Project structure created
- [x] Package.json files configured
- [x] PostgreSQL database schema designed and created
- [x] Contract addresses and ABIs configured
- [x] Database connection module with pooling implemented
- [x] Environment variables configured
- [x] Database connectivity tested successfully
- [x] All 5 database tests passed

**Database Tables Created:**
- time_series_data
- whale_wallets
- anomalies
- twitter_sentiment
- validator_metrics

**Test Results:**
```
✅ Connection test passed
✅ Health check passed
✅ Stats query passed
✅ Insert test passed
✅ Query test passed
```

## 🔄 Development Phases

### ✅ Phase 1: Database & Configuration (COMPLETED)
- Database schema creation
- Contract configuration
- Connection pooling
- Testing

### 📝 Phase 2: Historical Data Loader (NEXT)
- Fetch 30 days of historical data
- Establish baseline patterns
- Populate whale wallet list
- Store historical metrics

### 📝 Phase 3-10: Coming Soon
- Real-time data collection
- Twitter sentiment analysis
- Claude AI integration
- Express API server
- WebSocket real-time updates
- React dashboard
- Chat interface
- Error handling & logging

## 🛠️ Available NPM Scripts (Backend)

```bash
npm start           # Start the backend server
npm run dev         # Start with nodemon (auto-reload)
npm test            # Test database connection
npm run init-db     # Initialize database schema
npm run load-history # Load 30 days of historical data
```

## 🔐 Environment Variables

The `.env` file contains:
- API keys (Alchemy, Anthropic, Etherscan, Twitter)
- Database configuration
- Server ports
- Collection intervals
- Network settings

## 📝 Logging

Winston-based structured logging:
- **Console**: Colored output for development
- **Files**:
  - `logs/error.log` - Error messages only
  - `logs/combined.log` - All log levels
- **Rotation**: 5MB max file size, 5 files retained

## 🎯 Success Criteria

The system must:
- [x] Collect real blockchain data every 5 minutes
- [ ] Store 30 days of historical baseline
- [ ] Run Claude analysis every 30 minutes
- [ ] Detect at least one real anomaly pattern
- [ ] Display live updates on React dashboard
- [ ] Handle errors gracefully with clear messages
- [ ] Work locally on WSL without deployment

## 🤝 Contributing

This is a hackathon project. Focus areas:
1. Real blockchain data integration
2. Accurate AI anomaly detection
3. Real-time dashboard updates
4. Production-quality code

## 📄 License

MIT

## 🔗 Resources

- [EtherFi Protocol](https://www.ether.fi/)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [Alchemy API](https://www.alchemy.com/)
- [ethers.js Documentation](https://docs.ethers.org/)

---

**Last Updated**: November 9, 2025
**Current Phase**: Phase 1 Complete ✅ - Ready for Phase 2
