# Teen CRM Backend - Production API Server

A production-ready Node.js backend for the Teen CRM system, built with TypeScript, Express.js, and PostgreSQL.

## 🚀 Quick Start

### Docker Compose (Recommended)
```bash
# Copy environment template
cp .env.example .env
# Edit .env with your configuration

# Start all services
docker-compose up -d

# Run migrations and seed data
docker-compose exec app npm run db:migrate
docker-compose exec app npm run db:seed

# View logs
docker-compose logs -f app
```

### Development Setup
```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env for development

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate:dev

# Seed sample data
npm run db:seed

# Start development server
npm run dev
```

## 📋 Environment Configuration

### Required Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/teen_crm"

# JWT Security (CHANGE IN PRODUCTION!)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-key-min-32-chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Password Hashing
BCRYPT_ROUNDS=12

# Server
NODE_ENV=production
PORT=3001

# CORS
CORS_ORIGIN="https://your-frontend-domain.com,https://another-domain.com"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # per window

# Business Configuration
WON_PAYOUT_AMOUNT=9.00
LIVE_PAYOUT_AMOUNT=7.00

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_PATH="./uploads"

# Logging
LOG_LEVEL="info"
LOG_FILE_PATH="./logs"
```

### Optional Services
```bash
# Email Service (for notifications)
EMAIL_SERVICE="gmail"  # or "sendgrid", "smtp"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="Teen CRM <noreply@teen-crm.com>"

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

## 🗄️ Database Management

### Migrations
```bash
# Create new migration
npm run db:migrate:dev

# Deploy migrations (production)
npm run db:migrate

# Reset database (development)
npm run db:reset
```

### Seeding
```bash
# Seed sample data
npm run db:seed

# View database in browser
npm run db:studio
```

## 🔐 Authentication & Security

### JWT Token Flow
1. **Login**: `POST /api/auth/login` returns access + refresh tokens
2. **API Calls**: Include `Authorization: Bearer {accessToken}` header
3. **Refresh**: Use `POST /api/auth/refresh` with refresh token when access token expires
4. **Logout**: `POST /api/auth/logout` to invalidate tokens on client

### Role-Based Access
- **ADMIN**: Full system access, user management, all merchants
- **REP**: Limited to assigned merchants and own activities

### Security Features
- Password hashing with bcrypt (configurable rounds)
- JWT with refresh token rotation
- Rate limiting (configurable per endpoint)
- CORS protection (environment-based origins)
- Helmet security headers
- Input validation with Joi schemas
- SQL injection prevention with Prisma
- Audit logging for all data changes

## 📊 API Endpoints

### Health & Monitoring
```
GET /health              - Basic health check
GET /api/health          - Detailed service health
GET /api                 - API documentation
```

### Authentication
```
POST /api/auth/login                    - User login
POST /api/auth/register                 - Create user (Admin)
POST /api/auth/refresh                  - Refresh tokens
GET  /api/auth/me                       - Current user
PATCH /api/auth/profile                 - Update profile
PATCH /api/auth/change-password         - Change password
GET  /api/auth/users                    - List users (Admin)
PATCH /api/auth/users/:id/status        - Update user status (Admin)
```

### Merchant Management
```
GET    /api/merchants                   - List merchants
GET    /api/merchants/:id               - Get merchant details
POST   /api/merchants                   - Create merchant
PUT    /api/merchants/:id               - Update merchant
DELETE /api/merchants/:id               - Delete merchant (Admin)
GET    /api/merchants/stats/overview    - Merchant statistics
```

### Pipeline Management
```
GET   /api/pipeline/:merchantId         - Get pipeline details
PATCH /api/pipeline/:merchantId/stage   - Update stage (triggers payouts)
PATCH /api/pipeline/:merchantId/next-action - Update next action
GET   /api/pipeline/overdue             - Overdue actions
GET   /api/pipeline/stats/conversion    - Conversion statistics
```

### Onboarding Workflow
```
GET   /api/onboarding/:merchantId       - Get onboarding status
PATCH /api/onboarding/:merchantId       - Update requirements
PATCH /api/onboarding/:merchantId/status - Update status (Admin)
GET   /api/onboarding/stats/progress    - Progress statistics
GET   /api/onboarding/pending-qa        - Pending QA items (Admin)
```

### Activity Management
```
GET    /api/activities                  - List activities
GET    /api/activities/:id              - Get activity details
GET    /api/activities/merchant/:id     - Merchant activities
POST   /api/activities                  - Create activity
PUT    /api/activities/:id              - Update activity
DELETE /api/activities/:id              - Delete activity
GET    /api/activities/stats/summary    - Activity statistics
GET    /api/activities/rep/:id/performance - Rep performance (Admin)
```

### Analytics & Reporting
```
GET /api/analytics/dashboard            - Dashboard analytics
GET /api/analytics/rep-performance      - Rep performance metrics (Admin)
GET /api/analytics/trends               - Trend analysis
GET /api/analytics/export               - Export data (CSV)
```

## 🏗️ Architecture

### Tech Stack
- **Runtime**: Node.js 18+ (LTS)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **Validation**: Joi
- **Logging**: Winston
- **Testing**: Jest + Supertest

### Project Structure
```
backend/
├── src/
│   ├── middleware/     # Authentication, validation, error handling
│   ├── routes/         # API route handlers
│   ├── types/          # TypeScript interfaces
│   ├── utils/          # Helper functions, logging
│   ├── scripts/        # Database seeding, utilities
│   └── server.ts       # Main application entry
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── migrations/     # Database migrations
├── uploads/            # File upload storage
├── logs/               # Application logs
└── docker-compose.yml  # Production deployment
```

### Business Logic Flow
```
1. User Authentication (JWT)
2. Merchant Creation (with Pipeline initialization)
3. Pipeline Stage Transitions (with validation)
4. Automated Payout Creation (Won: 9 JOD, Live: 7 JOD)
5. Onboarding Requirements Tracking
6. Activity Logging with Outcomes
7. Analytics and Reporting
```

## 🔧 Development

### Scripts
```bash
# Development
npm run dev              # Start with hot reload
npm run dev:debug        # Start with debugger
npm run type-check       # TypeScript compilation check
npm run lint             # ESLint code analysis
npm run lint:fix         # Auto-fix linting issues

# Production
npm run build            # Compile TypeScript
npm start                # Start production server
npm run prebuild         # Clean, lint, type-check

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate:dev   # Create and apply migration
npm run db:migrate       # Deploy migrations
npm run db:seed          # Seed sample data
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database (dev only)

# Testing
npm test                 # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Docker
npm run docker:build     # Build Docker image
npm run docker:up        # Start with Docker Compose
npm run docker:dev       # Development with Docker
npm run docker:logs      # View container logs
```

### Adding New Features
1. **Database Changes**: Update `prisma/schema.prisma` and run migration
2. **API Routes**: Add route files in `src/routes/`
3. **Validation**: Define Joi schemas in route files
4. **Types**: Add TypeScript interfaces in `src/types/`
5. **Tests**: Create test files alongside implementation
6. **Documentation**: Update API documentation

## 🚢 Deployment

### Production Checklist
- [ ] Set strong JWT secrets (min 32 characters)
- [ ] Configure production database URL
- [ ] Set up SSL certificates for HTTPS
- [ ] Configure CORS for your frontend domain
- [ ] Set appropriate rate limits
- [ ] Configure logging level (info/warn)
- [ ] Set up database backups
- [ ] Configure monitoring and alerting
- [ ] Test health check endpoints

### Docker Production
```bash
# Production deployment
docker-compose up -d

# View logs
docker-compose logs -f

# Scale backend instances
docker-compose up -d --scale app=3

# Update application
docker-compose pull
docker-compose up -d
```

### Manual Production
```bash
# Install dependencies
npm ci --only=production

# Build application
npm run build

# Run migrations
npm run db:migrate

# Start with PM2 (recommended)
pm2 start dist/server.js --name teen-crm-api

# Or start directly
npm start
```

## 📊 Monitoring

### Health Checks
- `GET /health` - Basic server health
- `GET /api/health` - Service health (database, cache)

### Logging
- Application logs: `./logs/app.log`
- Error logs: `./logs/error.log`
- Audit logs: `./logs/audit.log`
- Performance logs: `./logs/performance.log`

### Metrics to Monitor
- Response times
- Error rates
- Database connection pool
- Memory usage
- Active user sessions
- Pipeline conversion rates
- Payout processing

## 🔍 Troubleshooting

### Common Issues

**Database Connection**
```bash
# Check database connectivity
docker-compose exec postgres psql -U postgres -d teen_crm -c "\conninfo"

# View database logs
docker-compose logs postgres
```

**Authentication Issues**
```bash
# Verify JWT secrets are set
echo $JWT_SECRET

# Check token expiration in logs
docker-compose logs app | grep "token"
```

**Performance Issues**
```bash
# Check database query performance
npm run db:studio

# View application logs
docker-compose logs app | grep "duration"
```

## 📝 Sample Data

The seed script creates:
- 1 Admin user (admin@teen-crm.com)
- 2 Sales reps (sami@teen-crm.com, layla@teen-crm.com)
- 5 Sample merchants across different categories
- Pipeline stages for each merchant
- Sample activities and interactions
- Automated payouts for Won/Live merchants

Default password for all users: `admin123` (Admin), `rep123` (Reps)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make changes and add tests
4. Run linting and type checking: `npm run prebuild`
5. Run tests: `npm test`
6. Commit changes: `git commit -m "Add new feature"`
7. Push to branch: `git push origin feature/new-feature`
8. Submit a pull request

---

**Built with ❤️ for enterprise-scale merchant partnership management**