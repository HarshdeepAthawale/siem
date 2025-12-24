# SIEM Frontend

Production-grade SIEM dashboard built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **SOC-themed Dark UI**: Professional cybersecurity dashboard design
- **Real-time Dashboard**: Metrics, charts, and recent alerts
- **Event Logs**: Searchable and filterable event log viewer
- **Alerts Management**: Alert triage and review interface
- **Metrics & Analytics**: Detailed security metrics visualization

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure API URL:
```bash
cp .env.local.example .env.local
# Edit .env.local with your backend API URL
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
siem-frontend/
├── app/              # Next.js app router pages
├── components/       # React components
│   ├── layout/      # Layout components (Sidebar)
│   ├── dashboard/   # Dashboard components
│   └── ui/          # UI components (Card)
├── lib/             # Utilities and API client
└── styles/          # Global styles
```

## Pages

- `/` - Dashboard with metrics and charts
- `/logs` - Event logs with filtering
- `/alerts` - Security alerts
- `/metrics` - Detailed metrics and analytics

