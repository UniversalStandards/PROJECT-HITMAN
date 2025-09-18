# Development Setup Guide

## Prerequisites

- Node.js 20.x or higher
- PostgreSQL database (local or cloud)
- npm or yarn package manager

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/UniversalStandards/PROJECT-HITMAN.git
   cd PROJECT-HITMAN
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   **Required for development:**
   - `DATABASE_URL`: PostgreSQL connection string
   - `SESSION_SECRET`: Random secret for session encryption
   - `NODE_ENV=development`

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes

## Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL database connection string
- `SESSION_SECRET` - Secret key for session encryption

### Optional (for production features)
- Payment providers (Stripe, PayPal, etc.)
- Banking APIs (Unit, Dwolla, Modern Treasury)
- Compliance services (LexisNexis, Thomson Reuters)
- Document storage (AWS S3)

## Development Notes

- The application uses Vite for fast development builds
- TypeScript is used throughout for type safety
- Database schema is managed with Drizzle ORM
- UI components use shadcn/ui design system
- Payment processing is disabled by default in development

## Troubleshooting

### Database Connection Issues
1. Ensure PostgreSQL is running
2. Check DATABASE_URL format: `postgresql://user:password@host:port/database`
3. Verify database user has proper permissions

### Build Issues
1. Run `npm run check` to see TypeScript errors
2. Ensure all required dependencies are installed
3. Clear node_modules and reinstall if needed

### Development Server Won't Start
1. Check port 3000 is available
2. Verify all environment variables are set
3. Check console for specific error messages

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Build**: Vite + esbuild
- **Authentication**: Replit Auth (configurable)

## Production Deployment

For production deployment, additional environment variables and external service configurations are required. See `.env.example` for the complete list.