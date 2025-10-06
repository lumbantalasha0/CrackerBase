# BEMACHO Crackers Manager

## Overview

This is a professional business management web application for crackers manufacturing and retail businesses. The system provides comprehensive tools for inventory management, sales tracking, expense monitoring, ingredient calculations, and business analytics. Built with a modern tech stack, it features a clean, productivity-focused interface inspired by tools like Linear and Notion, with warm golden tones representing the baking industry.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern component patterns
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: Shadcn/ui component library with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom design system and CSS variables for theming
- **State Management**: React Query (TanStack Query) for server state management with optimistic updates
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Design**: RESTful API endpoints with consistent error handling and validation
- **Schema Validation**: Zod schemas shared between client and server for data consistency
- **Build System**: ESBuild for server bundling with external package handling

### Data Layer Design
- **ORM**: Drizzle ORM with schema-first approach for type safety
- **Database Schema**: Relational design with tables for customers, inventory movements, sales, expenses, expense categories, and ingredients
- **Migrations**: Drizzle Kit for database schema migrations and version control
- **Connection Pooling**: Built-in connection pooling through Neon's serverless architecture
- **Data Validation**: Shared Zod schemas between frontend and backend for consistent validation

### Component Architecture
- **Design System**: Custom component library built on Shadcn/ui with consistent styling patterns
- **Layout System**: Responsive layout with collapsible sidebar navigation
- **Data Tables**: Reusable DataTable component with sorting, filtering, and CRUD operations
- **Form Modals**: Standardized FormModal component for data entry across all modules
- **Stats Cards**: Unified StatsCard component for displaying key metrics with action buttons

### Authentication & Security
- **PIN Protection**: 4-digit PIN authentication system (default PIN: 4207)
- **Session Management**: Session-based authentication with sessionStorage
- **Input Validation**: Server-side validation using Zod schemas for all API endpoints
- **Error Handling**: Centralized error handling with user-friendly error messages
- **Type Safety**: End-to-end TypeScript for compile-time error prevention
- **Database Security**: Settings table stores encrypted application PIN

## External Dependencies

### Core Framework Dependencies
- **React (18.2.0)**: Core UI library with modern hooks and concurrent features
- **Express.js**: Web application framework for Node.js backend
- **TypeScript**: Static type checking for enhanced developer experience
- **Vite**: Next-generation build tool for frontend development

### Database & ORM
- **@neondatabase/serverless (^0.10.4)**: Serverless PostgreSQL database driver
- **drizzle-orm (^0.39.1)**: Type-safe ORM with excellent TypeScript integration
- **drizzle-zod (^0.7.0)**: Zod integration for schema validation
- **connect-pg-simple (^10.0.0)**: PostgreSQL session store for Express

### UI & Styling Libraries
- **@radix-ui/react-* (multiple packages)**: Accessible component primitives for complex UI patterns
- **tailwindcss**: Utility-first CSS framework for rapid UI development
- **class-variance-authority (^0.7.1)**: Variant-based component styling
- **clsx (^2.1.1)** & **tailwind-merge**: Conditional class name utilities

### Data Management
- **@tanstack/react-query (^5.60.5)**: Server state management with caching and synchronization
- **@hookform/resolvers (^3.10.0)**: Form validation resolver for React Hook Form
- **zod**: Schema validation library for runtime type checking

### Development & Build Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production builds
- **@replit/vite-plugin-***: Replit-specific development plugins for enhanced debugging

### Email Integration
- **@sendgrid/mail (^8.1.6)**: Email service for report distribution and notifications

### Utility Libraries
- **date-fns (^3.6.0)**: Date manipulation and formatting utilities
- **nanoid**: Secure unique ID generation
- **cmdk (^1.1.1)**: Command palette component for enhanced user experience

## Recent Changes (October 2025)

### Database Migration to Neon PostgreSQL
- Successfully migrated from Supabase to Neon Database (serverless PostgreSQL)
- Implemented Drizzle ORM for type-safe database operations
- All database queries now use Drizzle ORM instead of raw SQL
- Database schema pushed successfully with 7 tables

### Security Enhancement
- Added PIN-based authentication system
- Default PIN: 4207 (can be changed in Settings)
- Session-based authentication protects all routes
- PIN stored securely in settings table

### Performance & UI/UX Optimizations (October 2025)
**Performance Improvements:**
- Optimized React Query configuration for better caching
- Memoized expensive component operations
- Improved bundle size and load performance

**Design Enhancements:**
- Added smooth animations and transitions throughout the app
- Implemented skeleton loading states for better perceived performance
- Enhanced button interactions with hover effects and active states
- Improved mobile navigation with animated slide-in menu and backdrop
- Made sidebar sticky for better desktop navigation

**Responsive Design:**
- Fixed DataTable overflow issues on mobile devices
- Improved form modals with better spacing and mobile-friendly layouts
- Enhanced touch targets and mobile usability
- Added responsive grid layouts for stats cards

**Visual Polish:**
- Updated color scheme with better contrast and consistency
- Added subtle shadows and elevation for depth
- Improved typography hierarchy and readability
- Enhanced input fields with smooth transitions and hover states
- Added loading skeletons for better user feedback

**Accessibility:**
- Added comprehensive data-testid attributes for all interactive elements
- Improved keyboard navigation and focus states
- Enhanced screen reader support with proper ARIA labels