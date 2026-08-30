# EtherFi Anomaly Analysis

Early prototype for an EtherFi monitoring and anomaly-detection pipeline. This repository captures the initial database, contract-configuration, and backend scaffolding work that informed the fuller hackathon implementation in [`CBC-hackathon-EtherFi`](https://github.com/kaus-h/CBC-hackathon-EtherFi).

## Prototype scope

The repository establishes the data model and backend foundation for tracking protocol telemetry such as:

- total value locked
- staker counts
- whale-wallet activity
- withdrawal signals
- eETH and ETH peg health
- validator metrics
- gas prices
- sentiment data

## Implemented foundation

- PostgreSQL schema for time-series metrics, whale wallets, anomalies, sentiment, and validator data
- Connection pooling and database query helpers
- EtherFi contract addresses and ABI configuration
- Node.js backend project structure
- Logging and error-handling utilities
- Database initialization and connectivity tests

## Planned architecture

The prototype was designed to evolve into a system with:

1. recurring on-chain data collection
2. historical baseline generation
3. statistical anomaly filtering
4. Claude-assisted analysis
5. Express API access
6. WebSocket updates
7. a React monitoring dashboard

The later `CBC-hackathon-EtherFi` repository contains substantially more of that end-to-end implementation.

## Tech stack

- Node.js
- Express
- PostgreSQL
- ethers.js
- Alchemy API
- Anthropic Claude API integration plan
- Winston logging

## Repository structure

```text
backend/
  src/
    collectors/
    analysis/
    database/
    api/
    utils/
  config/
frontend/
```

## Local setup

```bash
cd backend
npm install
npm run init-db
npm test
```

A local PostgreSQL instance and the required environment variables are needed for database and API integrations.

## Why this repository remains public

This repo shows the system's earlier architecture and schema decisions. For the stronger recruiter-facing implementation, see [`CBC-hackathon-EtherFi`](https://github.com/kaus-h/CBC-hackathon-EtherFi).

## License

MIT