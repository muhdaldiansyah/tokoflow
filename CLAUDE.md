# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application (runs prebuild.js first to clean environment)
- `npm run start` - Start production server
- `npm run lint` - Run Next.js linting
- `npm run verify-imports` - Verify import statements are valid

## Architecture Overview

Tokoflow is a Next.js 15 inventory and sales management system with the following key architectural patterns:

### Route Organization
- **Route Groups**: Uses Next.js App Router with grouped routes:
  - `(private)` - Protected routes requiring authentication (dashboard, inventory, sales, etc.)
  - `(public)` - Public routes (landing pages, auth, etc.)
- **Middleware**: Authentication handled via Supabase middleware that redirects unauthenticated users

### Database & Authentication
- **Supabase Integration**: Primary backend using Supabase for database and auth
- **Database Layer**: Organized in `lib/database/` with client/server separation
- **Auth Layer**: Supabase authentication with email/password

### Key Directories
- `app/(private)/` - All authenticated application features (dashboard, inventory, sales, products, etc.)
- `app/(public)/` - Public pages (landing, auth, documentation)
- `app/api/` - API routes organized by feature (products, sales, inventory, etc.)
- `lib/` - Shared utilities, database clients, auth helpers, services
- `app/components/` - Reusable UI components and analytics

### Technology Stack
- **Framework**: Next.js 15 with App Router and Turbopack in development
- **Styling**: Tailwind CSS with custom configuration
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with email/password
- **UI**: Lucide React icons, Framer Motion animations, Sonner for toasts
- **Language**: Mixed JavaScript/TypeScript (TypeScript config available but not strictly enforced)

### Build Process
- **Prebuild**: Runs `prebuild.js` to clean `.next` and cache directories, ensures required directories exist
- **Postinstall**: Runs `postinstall.js` after package installation

### Business Logic
Tokoflow handles:
- Multi-channel inventory management
- Sales tracking and profit calculation
- Product composition and cost management
- Marketplace fee calculations
- Stock adjustments and incoming goods processing
- Analytics and reporting dashboards

The system is designed for Indonesian UMKM (small-medium businesses) with marketplace integrations for Shopee, Tokopedia, and TikTok Shop.