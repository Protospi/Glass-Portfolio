# Chat Application

## Overview

This is a modern full-stack chat application built with React frontend and Express backend. The application provides a clean, professional interface for users to have conversations, featuring a chat interface with message bubbles, typing indicators, and theme switching capabilities. The backend uses an in-memory storage system with plans for PostgreSQL integration via Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **UI Library**: Comprehensive shadcn/ui component system built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Theme System**: Custom theme provider supporting light/dark mode with localStorage persistence

### Backend Architecture
- **Runtime**: Node.js with Express framework
- **Language**: TypeScript with ES modules
- **Storage**: Currently using in-memory storage (MemStorage class) with interface ready for database integration
- **API Design**: RESTful endpoints for message operations with proper error handling and validation
- **Development**: Hot reload with Vite integration in development mode

### Data Storage Solutions
- **Current**: In-memory storage using Map data structures for users and messages
- **Planned**: PostgreSQL database with Drizzle ORM (configuration already present)
- **Schema**: Defined database schema for users and messages with proper relationships
- **Migration**: Drizzle migrations configured for schema changes

### Authentication and Authorization
- **Status**: Basic user schema defined but authentication not yet implemented
- **Preparation**: User model includes username/password fields for future auth implementation
- **Session Management**: connect-pg-simple package included for PostgreSQL session storage

### External Dependencies
- **Database**: Neon Database serverless PostgreSQL (configured but not active)
- **ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Validation**: Zod for runtime type validation and schema generation
- **UI Components**: Extensive Radix UI component collection for accessible interactions
- **Development Tools**: 
  - Replit-specific development banner and error handling
  - ESBuild for production bundling
  - PostCSS with Autoprefixer for CSS processing

The architecture follows a clean separation of concerns with shared TypeScript schemas between frontend and backend, ensuring type safety across the full stack. The modular design allows for easy expansion from in-memory storage to full database integration without breaking changes to the API interface.