# NFT APP

A NestJS application for tracking ETH balances of NFT owners at specific timestamps using blockchain crawling and caching mechanisms.

## Features

- 🔍 **Real-time NFT Monitoring**: Continuously crawls and indexes NFT transfer events from the Ethereum blockchain
- 💰 **Historical Balance Analytics**: Retrieve ETH balances of all NFT holders at any specific point in time
- ⚡ **Lightning-fast Caching**: Redis-powered caching system for instant retrieval of previously computed balance data
- 🔄 **Optimized Batch Operations**: Smart batching of Web3 requests to minimize RPC calls and maximize throughput
- 📊 **Time-travel Queries**: Access complete historical ownership and balance data across the entire blockchain timeline

## Tech Stack

- **Backend**: NestJS, TypeScript
- **Database**: MySQL with TypeORM
- **Cache**: Redis
- **Blockchain**: Web3.js for Ethereum interaction

## Prerequisites

- Node.js (v18+)
- Yarn package manager
- Ethereum RPC endpoint

## Quick Start

### 1. Environment Setup

Create `.env` file from example:

```bash
cp .env.example .env
```

Configure your environment variables:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=nft-app

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Blockchain
RPC_URL=thisisrpcurl
RPC_X_API_KEY=thisisrpcxapikey
NFT_CONTRACT=thisisnftcontract

# Application
APP_PORT=3000
APP_NAME=nft-app
APP_VERSION=v1
SAVE_BLOCK_NUMBER=20
```

### 2. Start Infrastructure

Run Docker Compose to start MySQL and Redis:

```bash
docker-compose up -d
```

This will start:

- MySQL database on port 3306
- Redis cache on port 6379

### 3. Database Migration

Run database migrations to create required tables:

```bash
yarn typeorm:migrate
```

This creates:

- `latest_block` table for tracking crawler progress
- `transfer` table for NFT transfer events

### 4. Start Application

For api server:

```bash
yarn start:dev
```

For crawler:

```bash
yarn console:watch crawler
```

## API Endpoints

### Get ETH Balances

```http
GET /api/v1/wallet-eth-balance?timestamp=1640995200000
```

**Parameters:**

- `timestamp` (required): Unix timestamp in milliseconds

**Response:**

```json
{
  "code": 200,
  "data": {
    "blockNumber": 13916166,
    "owners": {
      "0x1234...": "1.5",
      "0x5678...": "0.25",
      "0x9abc...": "10.0"
    }
  }
}
```

### Swagger Documentation

Access API documentation at:

```
http://localhost:3000/api/v1/swagger
```

## Architecture

### Data Flow

1. **Crawler Process**:

   - Monitors blockchain for NFT transfer events
   - Stores transfer data and block timestamps in MySQL
   - Caches block-timestamp mappings in Redis

2. **Balance Query Process**:
   - Finds appropriate block number for given timestamp
   - Identifies current NFT owners at that block
   - Batch queries ETH balances via Web3 RPC
   - Caches results for frequently accessed data

### Database Schema

**transfer table:**

```sql
- id: Primary key
- tokenId: NFT token identifier
- from: Sender address
- to: Receiver address
- blockNumber: Block where transfer occurred
- blockTimestamp: Block timestamp
- txHash: Transaction hash
```

**latest_block table:**

```sql
- id: Primary key
- contractAddress: NFT contract address
- block: Latest processed block number
```

### Caching Strategy

- **Redis Sorted Sets**: Store block-timestamp mappings for O(log N) lookups
- **Balance Cache**: Cache ETH balances for blocks older than `SAVE_BLOCK_NUMBER`
- **Automatic Expiration**: TTL-based cache invalidation

## Development

### Available Scripts

```bash
# Development
yarn start:dev          # Start backend in watch mode
yarn console:dev        # Run crawler in development

# Production
yarn build              # Build application
yarn start:prod         # Start production backend
yarn console:prod       # Run production crawler

# Database
yarn typeorm:create     # Create new migration
yarn typeorm:migrate    # Run migrations
yarn typeorm:revert     # Revert last migration

# Testing
yarn test               # Run unit tests
yarn test:e2e           # Run e2e tests
yarn lint               # Lint code
```

### Project Structure

```
src/
├── configs/            # Configuration files (database, redis, etc.)
├── database/           # Database layer
│   ├── entities/       # TypeORM entities (Transfer, LatestBlock)
│   ├── migrations/     # Database migrations
│   └── repositories/   # Data access repositories
├── modules/            # Feature modules (Clean Architecture)
│   ├── crawler/        # NFT transfer crawler module
│   │   ├── usecases/   # Business logic layer
│   │   │   ├── crawl-execution.usecase.ts        # Main orchestration
│   │   │   └── internal/                         # Internal usecases
│   │   │       ├── determine-block-range.usecase.ts
│   │   │       ├── fetch-contract-events.usecase.ts
│   │   │       ├── process-transfer-events.usecase.ts
│   │   │       ├── save-events-to-db.usecase.ts
│   │   │       ├── cache-block-timestamps.usecase.ts
│   │   │       └── update-latest-block.usecase.ts
│   │   ├── crawler.console.ts                    # CLI interface
│   │   ├── crawler.module.ts                     # NestJS module
│   │   └── crawler.constant.ts                   # Constants
│   └── nft-app/        # NFT balance service module
│       ├── usecases/   # Business logic layer
│       │   ├── get-wallet-eth-balance.usecase.ts # Main orchestration
│       │   └── internal/                         # Internal usecases
│       │       ├── validate-timestamp.usecase.ts
│       │       ├── resolve-block-number.usecase.ts
│       │       ├── cache-management.usecase.ts
│       │       ├── get-distinct-owners.usecase.ts
│       │       ├── process-owner-balances.usecase.ts
│       │       └── retry-missing-wallets.usecase.ts
│       ├── nft-app.controller.ts                 # HTTP API endpoints
│       ├── nft-app.service.ts                    # Service layer (delegates to usecases)
│       ├── nft-app.module.ts                     # NestJS module
│       └── nft-app.interface.ts                  # TypeScript interfaces
├── shared/             # Shared utilities and cross-cutting concerns
│   ├── filters/        # Exception filters
│   ├── helpers/        # Utility functions (Web3, etc.)
│   ├── interceptors/   # Request/response interceptors
│   ├── middlewares/    # Custom middlewares (bot blocker, etc.)
│   └── pipes/          # Validation pipes
├── main.ts             # Backend API server entry point
└── console.main.ts     # Crawler CLI entry point
```

## Monitoring & Troubleshooting

### Health Checks

- **Backend**: `GET http://localhost:3000/api/v1/health`
- **Database**: Check MySQL connection on port 3306
- **Redis**: Check Redis connection on port 6379
