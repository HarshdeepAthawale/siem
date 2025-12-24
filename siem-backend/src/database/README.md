# Database Utilities

This folder contains MongoDB-related scripts, utilities, and configurations.

## Structure

- `models/` - Mongoose models for Event and Alert collections
- `scripts/` - Database initialization and utility scripts
- `mongo.js` - MongoDB connection utilities

## Usage

### Initialize Database

```bash
npm run db:init
```

or

```bash
node src/database/scripts/init.js
```

### Seed Sample Data

```bash
npm run db:seed
```

or

```bash
node src/database/scripts/seed.js
```

### Clear Database

```bash
npm run db:clear
```

or

```bash
node src/database/scripts/clear.js
```

## Scripts

- **init.js** - Creates all database indexes for optimal query performance
- **seed.js** - Inserts sample events and alerts for testing
- **clear.js** - Removes all events and alerts from the database (with confirmation)

