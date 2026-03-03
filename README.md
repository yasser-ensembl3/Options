# Options Model

Montreal Exchange options trading dashboard with data scraping, analytics charts, and AI-powered investment analysis. Scrapes all listed options from m-x.ca, stores them in PostgreSQL with daily history, and provides a dark mode professional interface with interactive visualizations.

## What It Does

```
mx_scraper.py (Python)
    │
    ├── Fetch 200+ companies from m-x.ca
    ├── Scrape options data (Calls + Puts) for each
    ├── Scrape underlying stock prices
    └── Upsert into PostgreSQL (daily history)
    │
    ▼
Next.js Dashboard (/dark)
    │
    ├── Symbol selector → auto-load from PostgreSQL
    ├── 4 interactive charts (Recharts)
    ├── Filters & sorting (8 filters, 6 sort columns)
    ├── Tab system for multi-symbol comparison
    ├── Export: PDF (with charts) + JSON
    └── AI analysis via OpenAI GPT-4o
```

## Architecture

```
Options model/
├── mx_scraper.py                      # Python scraper (Montreal Exchange → PostgreSQL)
├── app/
│   ├── api/
│   │   ├── options/
│   │   │   ├── route.ts               # Main API — query PostgreSQL for options
│   │   │   ├── symbols/route.ts       # Dynamic symbol list from DB
│   │   │   └── export-today/route.ts  # Export all data created today
│   │   ├── stock-price/route.ts       # Fetch stock price from DB
│   │   ├── analyze/route.ts           # AI analysis via OpenAI GPT-4o
│   │   └── scrape/route.ts            # Legacy n8n webhook proxy (unused)
│   ├── dark/
│   │   ├── page.tsx                   # Main dashboard (dark mode)
│   │   └── print-preview/page.tsx     # PDF export preview
│   ├── page.tsx                       # Legacy page (redirects to /dark)
│   ├── layout.tsx                     # Root layout
│   └── globals.css                    # TailwindCSS styles
├── components/
│   ├── DataFilters.tsx                # Filter UI (legacy, built into dark mode)
│   ├── OptionsTable.tsx               # Table display (legacy)
│   └── AIAnalysis.tsx                 # AI analysis display (legacy)
├── backup_n8n_config/                 # Archived n8n config (replaced by PostgreSQL)
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Data Collection — mx_scraper.py

Python async scraper that collects all options from the Montreal Exchange website.

**How it works:**

1. Fetches the full company list from `m-x.ca/en/trading/data/options-list`
2. For each company (10 concurrent via asyncio):
   - Parses `<tr class="parent" data-row>` elements containing JSON option data
   - Extracts both Call and Put options (20+ fields each)
   - Scrapes underlying stock price from `quote-info` div
3. Batch-inserts into PostgreSQL every 10 companies (upsert on conflict)

**Fields extracted per option:** symbol, quotes (call/put), expiration_date, strike_price, bid/ask price, bid/ask size, open/high/low price, last_close_price, net_change, settlement_price, volatility, open_interest, nb_trades, is_option, is_weekly, scrape_date.

**Performance:** ~145 seconds for 200+ companies, 12,000+ options per run.

```bash
python mx_scraper.py
```

## Dashboard Features

### Charts (Recharts)

| Chart | What It Shows |
|-------|---------------|
| Volatility Smile | Implied volatility by strike price |
| Volume by Strike | Top 15 most liquid strikes |
| IV Term Structure | IV evolution across expiration dates |
| Call/Put Ratio | Market sentiment indicator |

### Filters & Sorting

8 filters: Type (Call/Put), Date range (min/max), Strike range (min/max), Volatility range (min/max), Weekly/Standard flag.

6 sort columns: Date, Strike, Volatility, Open Interest, Bid, Ask — with asc/desc toggle.

### Export

- **PDF**: High-quality chart capture via html2canvas + jsPDF
- **JSON (current view)**: Filtered and sorted data
- **JSON (all data)**: All options scraped today from database

### AI Analysis

Sends options data to OpenAI GPT-4o for investment recommendations: market overview, buy/avoid suggestions with risk levels, strategic recommendations. Rendered as formatted Markdown.

### Tab System

Each symbol search creates a new tab. Multiple symbols can be compared side-by-side. Tabs persist with independent data and filters.

## Database Setup

### Prerequisites

- PostgreSQL installed and running on localhost:5432

### Create Database and Tables

```sql
-- Create database
CREATE DATABASE mondb_test;

-- Connect to the database
\c mondb_test

-- Create options table
CREATE TABLE db_option (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR NOT NULL,
    quotes VARCHAR,
    expiration_date DATE,
    strike_price NUMERIC,
    bid_price NUMERIC,
    ask_price NUMERIC,
    bid_size NUMERIC,
    ask_size NUMERIC,
    open_price NUMERIC,
    high_price NUMERIC,
    low_price NUMERIC,
    last_close_price NUMERIC,
    net_change NUMERIC,
    settlement_price NUMERIC,
    volatility NUMERIC,
    open_interest NUMERIC,
    nb_trades NUMERIC,
    is_option BOOLEAN,
    is_weekly BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    scrape_date DATE NOT NULL,
    UNIQUE (symbol, scrape_date)
);

-- Create stock price table
CREATE TABLE db_stock_price (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR NOT NULL,
    last_price NUMERIC,
    bid_price NUMERIC,
    ask_price NUMERIC,
    scrape_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (symbol, scrape_date)
);
```

## Setup

### Prerequisites

- Node.js 18+
- Python 3.10+ (for scraper)
- PostgreSQL running locally

### Installation

```bash
# Frontend
npm install

# Python scraper dependencies
pip install httpx beautifulsoup4 psycopg2-binary

# Environment
cp .env.example .env.local
# Edit .env.local with your credentials
```

### Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `POSTGRES_HOST` | Yes | PostgreSQL host (default: localhost) |
| `POSTGRES_PORT` | Yes | PostgreSQL port (default: 5432) |
| `POSTGRES_USER` | Yes | PostgreSQL user |
| `POSTGRES_PASSWORD` | No | PostgreSQL password (empty for local) |
| `POSTGRES_DB` | Yes | Database name (default: mondb_test) |
| `POSTGRES_TABLE` | No | Options table name (default: db_option) |
| `OPENAI_API_KEY` | No | OpenAI API key for AI analysis |

### Running

```bash
# 1. Scrape data into PostgreSQL
python mx_scraper.py

# 2. Start the dashboard
npm run dev
# Open http://localhost:3000/dark
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/options` | GET | Fetch options (90-day filter or export=all) |
| `/api/options` | POST | Fetch options for a specific symbol |
| `/api/options/symbols` | GET | List unique symbols from database |
| `/api/options/export-today` | GET | Export all data scraped today |
| `/api/stock-price` | GET | Fetch stock price for a symbol |
| `/api/analyze` | POST | Send options to OpenAI GPT-4o for analysis |

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS 3.4 |
| Charts | Recharts |
| PDF Export | jsPDF + html2canvas |
| Database | PostgreSQL (pg driver) |
| AI | OpenAI GPT-4o |
| Scraper | Python (asyncio, httpx, BeautifulSoup, psycopg2) |
