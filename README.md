# TokoFlow

A modern inventory and sales management system built with Next.js and Supabase.

## Overview

TokoFlow is a web-based application that replaces the traditional spreadsheet-based inventory management system. It provides real-time inventory tracking, sales processing, and comprehensive reporting capabilities.

## Features

- **Product Management**: Track products with SKU, stock levels, and costs
- **Sales Processing**: Input and process sales transactions with automatic profit calculation
- **Inventory Control**: Real-time stock updates with negative stock alerts
- **Bundle Products**: Support for product compositions (bundles/packages)
- **Multi-Channel Sales**: Different fee structures for various marketplaces
- **Incoming Goods**: Track and process incoming inventory
- **Reporting**: Sales by channel, product performance, and stock alerts

## Database Schema

The system uses PostgreSQL (via Supabase) with the following main tables:
- Products and inventory
- Sales transactions
- Incoming goods records
- Product costs and compositions
- Marketplace fee configurations

See `DATABASE_SCHEMA.md` for complete details.

## Setup Instructions

1. **Clone the repository**
   ```bash
   cd C:\startup\tokoflow
   ```

2. **Environment Setup**
   - Copy `.env.example` to `.env.local`
   - The Supabase credentials are already configured

3. **Database**
   - Database tables and functions are already set up in Supabase
   - Sample data has been loaded

4. **Install Dependencies** (when Next.js app is created)
   ```bash
   npm install
   ```

5. **Run Development Server** (when Next.js app is created)
   ```bash
   npm run dev
   ```

## Project Structure

```
tokoflow/
├── DATABASE_SCHEMA.md      # Complete database documentation
├── ERD.md                  # Entity relationship diagram
├── SETUP_COMPLETE.md       # Setup completion details
├── supabase-api-examples.js # API usage examples
├── .env.example            # Environment variables template
└── README.md              # This file
```

## API Examples

See `supabase-api-examples.js` for examples of how to:
- Add sales input
- Process pending sales
- Manage inventory
- Generate reports

## Business Logic

The system replicates the original spreadsheet logic:

1. **Sales Processing**:
   - Calculate revenue, costs, and profit
   - Update inventory (decrease stock)
   - Update component inventory for bundles
   - Clear input quantity after processing

2. **Inventory Management**:
   - Track stock levels (can go negative)
   - Process incoming goods
   - Alert on low/negative stock

3. **Financial Calculations**:
   - Modal cost + packing cost
   - Affiliate commission (percentage of revenue)
   - Marketplace fees (channel-specific)
   - Net profit calculation

## Security

- Row Level Security (RLS) enabled on all tables
- User authentication via Supabase Auth
- Transactions tracked by user

## Next Steps

- Build Next.js frontend components
- Implement authentication flow
- Create user interface for all operations
- Add real-time updates
- Implement additional reporting features

## Support

For database-related queries, refer to the Supabase documentation.
For application issues, check the error logs and database advisors.
