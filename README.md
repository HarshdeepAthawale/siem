# Full-Stack SIEM Platform

Production-grade Security Information and Event Management (SIEM) platform built with MongoDB, Node.js, and Next.js.

## Architecture

### Backend (`siem-backend/`)
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Pipeline**: Collector → Parser → Normalizer → MongoDB → Detection Engine → Alerts

### Frontend (`siem-frontend/`)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Theme**: Dark SOC/Cybersecurity theme

## Quick Start

### Prerequisites
- Node.js (LTS)
- MongoDB (local or remote)

### Backend Setup

```bash
cd siem-backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm start
```

Backend runs on `http://localhost:3000`

### Frontend Setup

```bash
cd siem-frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with backend API URL (default: http://localhost:3000/api)
npm run dev
```

Frontend runs on `http://localhost:3000`

## Features

### Backend
- MongoDB connection with proper indexing
- Event ingestion pipeline (File collector, SSH/HTTP parsers)
- Detection engine with MongoDB aggregations
- SSH brute force detection rule
- REST API (health, logs, alerts, metrics)
- Winston logging

### Frontend
- SOC-themed dark dashboard
- Real-time metrics and charts
- Event logs with filtering and pagination
- Alerts management interface
- Metrics and analytics page
- Responsive design

## Detection Rules

- **SSH Brute Force**: Detects multiple failed SSH login attempts from the same IP within a configurable time window (default: 5 attempts in 2 minutes)

## Project Structure

```
siem/
├── siem-backend/          # Node.js backend
│   ├── src/
│   │   ├── collectors/    # Log collectors
│   │   ├── parsers/       # Log parsers
│   │   ├── normalizer/    # Event normalizer
│   │   ├── detectors/     # Detection rules
│   │   ├── database/      # MongoDB models
│   │   ├── api/           # REST API routes
│   │   └── main.js        # Entry point
│   └── package.json
├── siem-frontend/         # Next.js frontend
│   ├── app/               # Pages
│   ├── components/        # React components
│   ├── lib/               # Utilities & API client
│   └── package.json
└── README.md
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/logs` - Query events (filters: ip, severity, type, from, to)
- `GET /api/alerts` - Query alerts (filters: severity, ip, from, to)
- `GET /api/metrics` - Dashboard metrics and aggregations

## Design System

- **Background**: `#0b0f1a`
- **Panels**: `#111827`
- **Borders**: `#1f2937`
- **Accent**: Cyan/Electric Blue (`#00d9ff`)

## Notes

- Backend uses MongoDB aggregation pipelines for efficient detection
- All queries are indexed for performance
- Frontend auto-refreshes data every 30 seconds
- Sample log file is created automatically if missing

## Security Considerations

This is a demonstration SIEM platform. For production use:
- Implement authentication and authorization
- Use HTTPS/TLS
- Secure MongoDB connections
- Add rate limiting
- Implement proper error handling and logging
- Add input validation and sanitization

