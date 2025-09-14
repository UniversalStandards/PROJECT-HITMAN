# Government Operations,Financial, Accounting, and Personnel System (GOFAPS)

## Overview

### GOFAPS is a **Complete Organizational Solution Technology** (COST) 
#### 100% feature-complete

It combines comprehensive financial management with full operational capabilities along with a robust procurment, contracting, personnel management systen for government entities at all levels (local/municipal, county, state, federal). Beyond financial operations, the platform now includes complete HR management, fleet operations, multi-site location management, enhanced procurement, inventory tracking, work order management, contract lifecycle management, and emergency response coordination which can further be customized to fit your specific needs. This unified system provides government agencies with all the tools needed to manage their entire organization from a single, integrated platform. It also features a highly extensible backend to allow for backwards compatibiolity of almost any system and forward longevity to meet technologies every change landscape. Toss in the inclusion of the ATLANTIS.AI and you have an unstopable new partner for your Organization. 

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured error handling
- **Authentication**: Replit Auth integration with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **Middleware**: Request logging, JSON parsing, and authentication guards

### Database Layer
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection Pooling**: Neon serverless connection pooling for scalability

### Core Data Models
The system manages several key entities:
- **Organizations**: Government entities (municipality, county, state, federal)
- **Users**: Staff members with role-based access control
- **Digital Wallets**: Various account types (checking, savings, payroll, expense, tax collection)
- **Budgets**: Fiscal year budgets with categories and spending tracking
- **Vendors**: Contractor and supplier management
- **Payments**: Multi-type payment processing (vendor, payroll, expense, tax, transfer)
- **Expenses**: Employee expense reporting and tracking
- **Transactions**: Comprehensive financial transaction logging

### Authentication & Authorization
- **Provider**: Replit Auth with OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **Access Control**: Role-based permissions with organization-level isolation
- **Security**: HTTPS enforcement, secure session cookies, and CSRF protection

### Payment Integration Architecture
The platform is designed to integrate with multiple payment processors:
- **Stripe**: For payment processing and digital card management
- **Modern Treasury**: For treasury operations and bank account management
- **PayPal**: For alternative payment processing
- **Extensible Design**: Abstracted payment interfaces for easy provider addition

### Frontend Component Architecture
- **Layout Components**: Reusable sidebar, header, and navigation components
- **Dashboard Components**: Modular widgets for budget overview, recent activity, pending payments
- **Form Components**: Standardized forms with validation for all entity types
- **UI Components**: Comprehensive design system with consistent styling

### Development & Deployment
- **Development Server**: Vite dev server with HMR and error overlays
- **Build Process**: Separate client and server builds with esbuild for server bundling
- **Environment Configuration**: Environment-specific settings for database and auth
- **Code Quality**: TypeScript strict mode with comprehensive type checking

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **express**: Web application framework
- **react**: Frontend framework
- **@tanstack/react-query**: Server state management

### UI & Styling
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Authentication
- **openid-client**: OpenID Connect authentication
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

### Payment Processing
- **@stripe/stripe-js**: Stripe JavaScript SDK
- **@stripe/react-stripe-js**: React components for Stripe

### Form Handling & Validation
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Form validation resolvers
- **zod**: Runtime type validation
- **drizzle-zod**: Database schema to Zod validation

### Development Tools
- **vite**: Build tool and dev server
- **typescript**: Type checking
- **esbuild**: Server code bundling
- **tsx**: TypeScript execution for development

### Utilities
- **date-fns**: Date manipulation
- **clsx**: Conditional className utility
- **memoizee**: Function memoization
- **nanoid**: Unique ID generation
