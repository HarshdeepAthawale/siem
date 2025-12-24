# SIEM Backend

Production-grade SIEM backend built with Node.js, Express, and MongoDB.

## Features

- **Event Ingestion Pipeline**: Collector → Parser → Normalizer → MongoDB
- **Detection Engine**: MongoDB aggregation-based detection rules
- **SSH Brute Force Detection**: Configurable threshold and time window
- **REST API**: Health, logs, alerts, and metrics endpoints
- **MongoDB Optimized**: Proper indexing and aggregation pipelines

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure MongoDB connection:
```bash
# Run the setup script to create .env with MongoDB Atlas connection
npm run setup

# OR manually create .env file (see SETUP.md for details)
```

**Note**: MongoDB Atlas connection string is already configured. The setup script will create the `.env` file automatically.

3. Run the backend:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend will connect to MongoDB Atlas automatically. Make sure your MongoDB Atlas cluster:
- Has IP whitelist configured (allow `0.0.0.0/0` for testing)
- Is running and accessible

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/logs` - Query events (supports pagination, filters: ip, severity, type, from, to)
- `GET /api/alerts` - Query alerts (supports pagination, filters: severity, ip, from, to)
- `GET /api/metrics` - Dashboard metrics and aggregations

## Detection Rules

- **SSH Brute Force**: Detects multiple failed SSH login attempts from the same IP within a configurable time window.

## MongoDB Utilities

The `mongodb/` folder contains database management scripts:

- **Initialize Database**: `npm run db:init` - Creates indexes and verifies database setup
- **Seed Sample Data**: `npm run db:seed` - Populates database with sample events and alerts
- **Clear Database**: `npm run db:clear` - Removes all events and alerts (with confirmation)

## Project Structure

```
siem-backend/
├── src/
│   ├── collectors/     # Log collectors
│   ├── parsers/        # Log parsers
│   ├── normalizer/     # Event normalizer
│   ├── detectors/      # Detection rules
│   ├── database/       # MongoDB models and connection
│   ├── api/            # REST API routes
│   ├── config/         # Configuration
│   ├── utils/          # Utilities (logger)
│   └── main.js         # Entry point
├── mongodb/            # MongoDB utilities and scripts
│   ├── scripts/        # Database management scripts
│   └── README.md       # MongoDB utilities documentation
├── logs/               # Log files
└── package.json
```

