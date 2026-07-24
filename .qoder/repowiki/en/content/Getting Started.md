# Getting Started

<cite>
**Referenced Files in This Document**
- [README.md](file://README.md)
- [package.json](file://package.json)
- [Dockerfile](file://Dockerfile)
- [docker-compose.yml](file://docker-compose.yml)
- [src/server.ts](file://src/server.ts)
- [src/start.ts](file://src/start.ts)
- [vite.config.ts](file://vite.config.ts)
- [bunfig.toml](file://bunfig.toml)
- [nginx.conf](file://nginx.conf)
- [components.json](file://components.json)
- [tsconfig.json](file://tsconfig.json)
- [playwright.config.ts](file://playwright.config.ts)
- [src/routes/index.tsx](file://src/routes/index.tsx)
- [src/routes/cart.tsx](file://src/routes/cart.tsx)
- [src/routes/quote.tsx](file://src/routes/quote.tsx)
- [src/routes/trade-account.tsx](file://src/routes/trade-account.tsx)
- [src/components/shopify/ProductDetail.tsx](file://src/components/shopify/ProductDetail.tsx)
- [src/components/shopify/AddToCartButton.tsx](file://src/components/shopify/AddToCartButton.tsx)
- [src/components/shopify/AddToQuoteButton.tsx](file://src/components/shopify/AddToQuoteButton.tsx)
- [src/components/shopify/BuildQuoteFromCartButton.tsx](file://src/components/shopify/BuildQuoteFromCartButton.tsx)
- [src/lib/config.server.ts](file://src/lib/config.server.ts)
- [src/lib/quote.ts](file://src/lib/quote.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Overview](#project-overview)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Environment Configuration](#environment-configuration)
6. [Development Setup](#development-setup)
7. [Running the Application](#running-the-application)
8. [Key Features](#key-features)
9. [Common Development Tasks](#common-development-tasks)
10. [Troubleshooting](#troubleshooting)
11. [Deployment](#deployment)
12. [Conclusion](#conclusion)

## Introduction

SpareAutomation is a specialized e-commerce platform designed as a Shopify-integrated automation equipment marketplace. The platform serves industrial automation companies by providing a comprehensive online storefront that seamlessly integrates with Shopify's robust e-commerce infrastructure while offering industry-specific features tailored to automation equipment sales.

The platform enables businesses to showcase their automation products, manage inventory through Shopify, handle customer quotes for complex equipment configurations, and support trade account relationships with bulk purchasing capabilities. It bridges the gap between traditional B2B automation sales processes and modern e-commerce experiences.

## Project Overview

SpareAutomation is built using modern web technologies and follows a component-based architecture:

### Technology Stack
- **Frontend**: React with TypeScript and Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom UI components
- **Runtime**: Bun for high-performance JavaScript execution
- **E-commerce Integration**: Shopify Storefront API for product management and cart functionality
- **Containerization**: Docker for consistent deployment environments
- **Testing**: Playwright for end-to-end testing

### Architecture Highlights
- **Shopify Integration**: Real-time product synchronization and cart management
- **Quote System**: Advanced quotation generation for complex equipment configurations
- **Trade Accounts**: B2B-focused account management with special pricing
- **Responsive Design**: Mobile-first approach for accessibility across devices
- **SEO Optimized**: Built-in search engine optimization for better visibility

```mermaid
graph TB
subgraph "Client Layer"
WebApp[React Web Application]
AdminPanel[Admin Interface]
end
subgraph "Business Logic"
QuoteEngine[Quote Generation Engine]
TradeAccount[Trade Account Manager]
ProductSync[Product Synchronization]
end
subgraph "External Services"
ShopifyAPI[Shopify Storefront API]
PaymentGateway[Payment Processing]
EmailService[Email Notifications]
end
subgraph "Infrastructure"
Database[(Database)]
Cache[Redis Cache]
CDN[Content Delivery Network]
end
WebApp --> QuoteEngine
WebApp --> TradeAccount
WebApp --> ProductSync
AdminPanel --> QuoteEngine
AdminPanel --> TradeAccount
QuoteEngine --> ShopifyAPI
TradeAccount --> ShopifyAPI
ProductSync --> ShopifyAPI
QuoteEngine --> Database
TradeAccount --> Database
ProductSync --> Database
QuoteEngine --> Cache
TradeAccount --> Cache
```

**Diagram sources**
- [src/server.ts:1-50](file://src/server.ts#L1-L50)
- [src/lib/config.server.ts:1-30](file://src/lib/config.server.ts#L1-L30)

## Prerequisites

Before setting up SpareAutomation, ensure you have the following prerequisites installed:

### Required Software
- **Node.js**: Version 18.0 or higher (recommended: latest LTS version)
- **Bun**: Latest stable version for optimal performance
- **Docker**: Version 20.10 or higher for containerized deployment
- **Git**: For version control and cloning the repository

### Shopify Account Requirements
- **Shopify Partner Account**: Access to your Shopify store administration
- **Storefront API Credentials**: Generated from your Shopify admin panel
- **Private App Permissions**: Read/write access to products, orders, and customers
- **Webhook Configuration**: For real-time order and inventory updates

### System Requirements
- **Minimum RAM**: 4GB (8GB recommended for development)
- **Storage**: 10GB free space for development environment
- **Network**: Internet connection for Shopify API access and package downloads

## Installation

### Local Development Setup

#### Step 1: Clone the Repository
```bash
git clone https://github.com/spareautomation/platform.git
cd spareautomation
```

#### Step 2: Install Dependencies
```bash
# Using Bun (recommended)
bun install

# Alternative using npm
npm install

# Alternative using yarn
yarn install
```

#### Step 3: Environment Setup
Create a copy of the environment configuration file:
```bash
cp .env.example .env
```

### Containerized Deployment

#### Option 1: Docker Compose (Recommended)
```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d
```

#### Option 2: Manual Docker Build
```bash
# Build the application image
docker build -t spareautomation:latest .

# Run the container
docker run -p 3000:3000 --env-file .env spareautomation:latest
```

## Environment Configuration

### Essential Environment Variables

Create and configure your `.env` file with the following required variables:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Your Shopify Storefront API token | `shpat_xxxxxxxxxxxxxxxxxxxxxxxx` | Yes |
| `SHOPIFY_STORE_DOMAIN` | Your Shopify store domain | `your-store.myshopify.com` | Yes |
| `APP_SECRET_KEY` | Application encryption key | Random 32-character string | Yes |
| `DATABASE_URL` | Database connection string | `postgresql://user:pass@localhost:5432/dbname` | Yes |
| `REDIS_URL` | Redis cache connection | `redis://localhost:6379` | No |
| `NODE_ENV` | Environment mode | `development` or `production` | Yes |
| `PORT` | Application port | `3000` | No |

### Shopify Configuration

Generate your Shopify Storefront API credentials:

1. Log in to your Shopify Admin Panel
2. Navigate to Apps → Develop apps for your store
3. Create a new app or use an existing one
4. Configure Storefront API access with read permissions
5. Generate the Storefront Access Token
6. Copy the token to your `.env` file

### Security Best Practices

- Never commit your `.env` file to version control
- Use different environment variables for development and production
- Rotate API keys regularly
- Enable HTTPS in production environments
- Set up proper CORS policies for your domain

## Development Setup

### Initial Development Server

Start the development server with hot reloading:

```bash
# Using Bun
bun dev

# Using npm
npm run dev

# Using yarn
yarn dev
```

The development server will automatically:
- Compile TypeScript files
- Bundle assets with Vite
- Restart on file changes
- Provide detailed error messages
- Enable debugging tools

### Database Setup

For local development, set up a PostgreSQL database:

```bash
# Using Docker for PostgreSQL
docker run --name spareautomation-db -e POSTGRES_DB=spareautomation -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15

# Initialize database schema
bun run db:migrate
```

### Testing Environment

Run the test suite:

```bash
# Unit tests
bun test

# End-to-end tests
bun test:e2e

# Test coverage
bun test:coverage
```

## Running the Application

### Development Mode

The development server provides enhanced debugging capabilities:

```bash
# Start development server
bun dev

# Start with specific port
bun dev --port 8080

# Start with debug logging
DEBUG=* bun dev
```

Access the application at `http://localhost:3000`

### Production Build

Create optimized production builds:

```bash
# Build for production
bun run build

# Preview production build locally
bun run preview

# Serve production build
bun run serve
```

### Docker Deployment

Deploy using Docker Compose:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up --build
```

## Key Features

### Product Management

The platform integrates seamlessly with Shopify's product management system:

- **Real-time Sync**: Products automatically sync with Shopify inventory
- **Bulk Operations**: Import/export products via CSV
- **Category Management**: Organize products into collections
- **Media Support**: High-resolution images and product videos
- **Variant Handling**: Support for multiple sizes, colors, and configurations

```mermaid
sequenceDiagram
participant Admin as "Admin Panel"
participant Shopify as "Shopify API"
participant Platform as "SpareAutomation"
participant Customer as "Customer Browser"
Admin->>Shopify : Update Product Info
Shopify-->>Platform : Webhook Notification
Platform->>Platform : Update Local Cache
Customer->>Platform : Request Product Details
Platform->>Shopify : Fetch Product Data
Shopify-->>Platform : Product Information
Platform-->>Customer : Display Updated Product
```

**Diagram sources**
- [src/components/shopify/ProductDetail.tsx:1-100](file://src/components/shopify/ProductDetail.tsx#L1-L100)
- [src/lib/config.server.ts:1-50](file://src/lib/config.server.ts#L1-L50)

### Cart Functionality

Advanced shopping cart system supporting both individual and bulk purchases:

- **Persistent Carts**: Cart data persists across sessions
- **Quantity Management**: Easy quantity adjustments
- **Save for Later**: Ability to save items for future purchase
- **Bulk Discounts**: Automatic discount calculations
- **Multi-currency Support**: International pricing display

### Quote Generation System

Specialized quotation system for complex equipment configurations:

- **Dynamic Pricing**: Real-time price calculations based on specifications
- **Configuration Builder**: Interactive equipment configurator
- **PDF Export**: Professional quote documents
- **Approval Workflow**: Multi-level approval process
- **Version Control**: Track quote revisions and history

```mermaid
flowchart TD
Start([Customer Request]) --> Config[Equipment Configuration]
Config --> Pricing[Price Calculation]
Pricing --> Review[Quote Review]
Review --> Approval{Approval Required?}
Approval --> |Yes| Manager[Manager Approval]
Approval --> |No| Generate[Generate Quote PDF]
Manager --> Approve{Approved?}
Approve --> |Yes| Generate
Approve --> |No| Revise[Revise Quote]
Revise --> Pricing
Generate --> Send[Send to Customer]
Send --> End([Quote Complete])
```

**Diagram sources**
- [src/lib/quote.ts:1-150](file://src/lib/quote.ts#L1-L150)
- [src/components/shopify/BuildQuoteFromCartButton.tsx:1-100](file://src/components/shopify/BuildQuoteFromCartButton.tsx#L1-L100)

### Trade Account System

B2B-focused account management with advanced features:

- **Tiered Pricing**: Different price levels for different account types
- **Credit Limits**: Manage credit limits and payment terms
- **Bulk Ordering**: Streamlined bulk purchase workflows
- **Account Hierarchies**: Support for organizational structures
- **Purchase History**: Detailed transaction tracking

## Common Development Tasks

### Adding New Products

Products are managed through Shopify but can be synchronized programmatically:

1. Add products in Shopify Admin
2. Configure product variants and pricing
3. Upload product images and descriptions
4. Set up product collections and categories
5. Verify synchronization in SpareAutomation

### Creating Custom Components

Extend the platform with custom React components:

1. Create component in `src/components/`
2. Implement TypeScript interfaces
3. Add styling with Tailwind CSS
4. Test component functionality
5. Integrate into relevant routes

### Modifying Quote Logic

Customize the quote generation system:

1. Edit quote calculation logic in `src/lib/quote.ts`
2. Update pricing rules and discounts
3. Modify PDF template generation
4. Test quote scenarios
5. Deploy changes to production

### Database Schema Changes

Modify the database structure:

1. Create migration file
2. Define schema changes
3. Run migration script
4. Update related code
5. Test data integrity

## Troubleshooting

### Common Setup Issues

#### Shopify API Connection Problems
- **Issue**: Cannot connect to Shopify API
- **Solution**: Verify Storefront API token and store domain
- **Check**: Ensure API permissions are correctly configured

#### Database Connection Errors
- **Issue**: Database connection failures
- **Solution**: Check DATABASE_URL format and service availability
- **Verify**: PostgreSQL service is running and accessible

#### Port Conflicts
- **Issue**: Port already in use
- **Solution**: Change PORT environment variable or kill conflicting process
- **Alternative**: Use different port numbers for development

#### Docker Build Failures
- **Issue**: Container build errors
- **Solution**: Check Docker daemon status and network connectivity
- **Debug**: Use `docker-compose logs` for detailed error information

### Performance Optimization

#### Slow Page Loads
- **Enable**: Browser caching and CDN
- **Optimize**: Image compression and lazy loading
- **Monitor**: API response times and database queries

#### Memory Issues
- **Increase**: Node.js memory allocation
- **Optimize**: Large object handling and garbage collection
- **Monitor**: Memory usage patterns

### Debugging Techniques

#### Enable Debug Logging
```bash
# Set debug environment variable
export DEBUG=*
bun dev
```

#### Browser Developer Tools
- Use Network tab to inspect API calls
- Check Console for JavaScript errors
- Monitor Performance metrics

#### Server-side Debugging
- Review application logs
- Check error boundaries
- Monitor database query performance

## Deployment

### Production Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] Monitoring and logging enabled
- [ ] Backup procedures established
- [ ] Performance monitoring active

### Environment-Specific Configuration

#### Development Environment
- Verbose logging enabled
- Hot reload active
- Debug tools available
- Mock services for external APIs

#### Staging Environment
- Production-like configuration
- Automated testing pipeline
- Performance profiling
- User acceptance testing

#### Production Environment
- Minimal logging
- High availability setup
- Load balancing configured
- Disaster recovery procedures

### Monitoring and Maintenance

#### Health Checks
Implement health check endpoints for monitoring:
- Application status
- Database connectivity
- External service availability
- Resource utilization

#### Backup Strategy
- Regular database backups
- File storage backup
- Configuration backup
- Disaster recovery testing

## Conclusion

SpareAutomation provides a comprehensive solution for automation equipment e-commerce, combining the power of Shopify's infrastructure with industry-specific features. The platform's modular architecture allows for easy customization and scaling, while the extensive feature set supports both B2C and B2B sales models.

By following this getting started guide, you'll have a fully functional development environment ready for customization and extension. The platform's robust foundation ensures reliable operation while providing the flexibility needed to meet evolving business requirements.

Remember to maintain security best practices, implement proper monitoring, and follow the established development workflow to ensure smooth operation and growth of your automation equipment marketplace.