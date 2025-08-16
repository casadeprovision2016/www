# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CCCP (Casa de Provisão) is a church management system currently in the architectural planning phase. The project consists of documentation outlining a full-stack application architecture but does not yet contain actual implementation code.

## Current State

This repository contains **architectural documentation only**:
- `README.md`: Comprehensive architectural plan for a React + Node.js + Supabase church management system
- `db.md`: Detailed database schema documentation describing 12 tables for managing users, events, donations, ministries, etc.

**No implementation exists yet** - the frontend/, api/, and other directories mentioned in the README are planned but not created.

## Architecture Overview

**Planned Technology Stack:**
- **Frontend**: React 18 + TypeScript + Vite + ShadCN/UI + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth + JWT
- **Storage**: Supabase Storage for files/images
- **Cache**: Redis via Upstash (free tier)
- **Deployment**: Docker + Cloudflare Tunnel

## Database Schema

The system centers around a `users` table connected to:
- `events` and `event_registrations` - Event management
- `members` - Church membership tracking
- `donations` and `contributions` - Financial management
- `ministries` and `ministry_members` - Ministry organization
- `pastoral_visits` - Pastoral care tracking
- `live_streams` - Streaming management
- `notifications` - User notifications
- `organization` - Church settings

## Planned Development Commands

According to the README, when implemented:
- **Frontend**: `npm run dev` (Vite dev server on port 3000)
- **Backend**: `npm run dev` (Express server on port 4444)
- **Full stack**: `docker-compose up -d` (complete Docker deployment)
- **Health check**: `bash scripts/health-check.sh`
- **Deploy**: `bash scripts/deploy.sh`

## Key Implementation Notes

When this project is implemented:

1. **Security Focus**: Plan includes comprehensive security measures (rate limiting, input sanitization with Zod, DOMPurify for XSS prevention, JWT authentication)

2. **Monorepo Structure**: Planned directory structure:
   ```
   cccp/
   ├── frontend/ (React app)
   ├── api/ (Node.js API)
   ├── shared/types/ (TypeScript definitions)
   └── scripts/ (deployment and maintenance)
   ```

3. **API Architecture**: RESTful API with endpoints for events, donations, members, ministries, streams, and reports

4. **Background Jobs**: Planned cron jobs for automated reports, backups, and maintenance

5. **Zero-Cost Deployment**: Architecture designed to run on free tiers of Supabase, Upstash Redis, and Cloudflare

## Development Guidelines

When implementing this project:
- Follow TypeScript strict mode for type safety
- Use Zod schemas for API validation
- Implement proper error handling and logging with Winston
- Use React Query for API state management
- Follow the security patterns outlined in the architecture document
- Maintain the modular structure described in the README

## Next Steps

This is a planning repository. Implementation should begin with:
1. Setting up the monorepo structure
2. Creating the backend API with authentication
3. Building the React frontend
4. Implementing the database migrations
5. Setting up Docker containerization