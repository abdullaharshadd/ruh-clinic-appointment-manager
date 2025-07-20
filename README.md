## 🐳 Docker Configuration

### Development vs Production

**Development Mode (Default):**
```bash
docker-compose up -d
```
- Hot reload for frontend and backend
- Source code mounted as volumes
- Development dependencies included
- Debug logging enabled

**Production Mode:**
```bash
docker-compose --profile production up -d
```
- Optimized builds with multi-stage Dockerfiles
- Nginx reverse proxy with load balancing
- Redis caching enabled
- Production security headers
- Minimal container sizes

### Docker Services

| Service | Port | Purpose | Health Check |
|---------|------|---------|--------------|
| postgres | 5432 | Database | `pg_isready` |
| backend | 5000 | API Server | `/api/health` |
| frontend | 3000 | React App | HTTP 200 |
| nginx | 80/443 | Load Balancer | `/health` |
| redis | 6379 | Cache | Redis ping |

### Docker Volumes
- `postgres_data`: Database persistence
- `redis_data`: Cache persistence (production)
- `./backend:/app`: Backend hot reload (development)
- `./frontend:/app`: Frontend hot reload (development)# Wellness Platform - Take-Home Assignment

A full-stack wellness clinic management system built with Node.js (TypeScript) and React for managing clients and appointments through an external API integration.

## 🚀 Quick Start (Recommended: Docker)

### Prerequisites
- Docker & Docker Compose
- Postman (for mock API setup)

### Docker Setup (Fastest Way)

1. **Clone and navigate to project:**
```bash
git clone <your-repo>
cd wellness-platform
```

2. **Set up environment:**
```bash
cp .env.docker .env
```
Edit `.env` and set your Postman mock server URL:
```bash
MOCK_API_URL=https://your-postman-mock-server-id.mock.pstmn.io
```

3. **Start all services:**
```bash
# Make script executable
chmod +x scripts/docker-setup.sh

# Start everything
./scripts/docker-setup.sh start
```

4. **Access the application:**
- 🌐 Frontend: http://localhost:3000
- 🔗 Backend API: http://localhost:5000/api
- 🗄️ Database: localhost:5432

### Docker Commands
```bash
./scripts/docker-setup.sh start    # Start all services
./scripts/docker-setup.sh stop     # Stop all services
./scripts/docker-setup.sh logs     # View logs
./scripts/docker-setup.sh status   # Check health
./scripts/docker-setup.sh sync     # Sync data from API
./scripts/docker-setup.sh clean    # Clean up resources
```

### Alternative: Manual Setup

<details>
<summary>Click to expand manual setup instructions</summary>

#### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

#### Backend Setup
1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
```

4. **Start the backend server:**
```bash
npm run dev
```

#### Frontend Setup
1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the frontend:**
```bash
npm start
```

</details>

## 🏗️ Architecture & Tech Stack

### Docker Architecture
```
┌─────────────────────────────────────────────────┐
│                Load Balancer                    │
│                (Nginx - Production)             │
└─────────────┬───────────────────────────────────┘
              │
┌─────────────┼───────────────────────────────────┐
│             │        Wellness Network           │
│   ┌─────────▼─────────┐  ┌─────────────────────┐ │
│   │    Frontend       │  │      Backend        │ │
│   │  (React:3000)     │  │  (Node.js:5000)     │ │
│   └───────────────────┘  └─────────┬───────────┘ │
│                                    │             │
│   ┌─────────────────────┐  ┌───────▼───────────┐ │
│   │      Redis          │  │    PostgreSQL     │ │
│   │   (Cache:6379)      │  │   (Database:5432) │ │
│   └─────────────────────┘  └───────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Services Overview
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: PostgreSQL 15 with automatic initialization
- **Reverse Proxy**: Nginx (production mode)
- **Caching**: Redis (optional, production mode)
- **Orchestration**: Docker Compose with health checks

### Container Features
- 🏥 **Health Checks**: All services include health monitoring
- 🔄 **Auto Restart**: Services restart automatically on failure  
- 📊 **Development Mode**: Hot reload for frontend and backend
- 🔒 **Production Ready**: Optimized builds with security headers
- 📈 **Scalable**: Ready for horizontal scaling
- 🗄️ **Data Persistence**: PostgreSQL and Redis data volumes

## 📁 Project Structure
```
wellness-platform/
├── docker-compose.yml         # Docker orchestration
├── .env.docker               # Docker environment template
├── init-db.sql              # Database initialization
├── scripts/
│   └── docker-setup.sh      # Convenient Docker management
├── nginx/                   # Nginx configuration (production)
│   ├── nginx.conf
│   └── default.conf
├── backend/
│   ├── Dockerfile          # Backend container
│   ├── src/
│   │   ├── config/         # Configuration files (Swagger, etc.)
│   │   ├── database/       # Database connection and initialization
│   │   ├── services/       # Business logic and external API wrapper
│   │   ├── routes/         # Express routes and controllers  
│   │   ├── scripts/        # Data synchronization scripts
│   │   ├── types/          # TypeScript interfaces
│   │   └── server.ts       # Main server file
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
└── frontend/
    ├── Dockerfile          # Frontend container
    ├── nginx.conf          # Frontend nginx config
    ├── src/
    │   ├── components/     # React components
    │   ├── services/       # API service layer
    │   ├── types/          # TypeScript interfaces
    │   ├── styles/         # CSS and styling
    │   └── App.tsx         # Main React application
    ├── package.json
    └── public/
```

## 📚 API Documentation

### Endpoints

#### Health Check
- `GET /api/health` - Server health status

#### Clients
- `GET /api/clients` - Get all clients
- `GET /api/clients?search=term` - Search clients by name, email, or phone
- `GET /api/clients/:id` - Get specific client

#### Appointments
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/upcoming` - Get upcoming appointments only
- `GET /api/appointments/:id` - Get specific appointment
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

#### Data Synchronization
- `POST /api/sync` - Manual data sync from external API

### Response Format
All API responses follow this format:
```json
{
  "success": boolean,
  "data": any,
  "message": string
}
```

## 🔄 Data Synchronization

The system implements a robust data synchronization strategy:

1. **Automatic Sync:** Runs every 15 minutes via cron job
2. **Manual Sync:** Available through `/api/sync` endpoint
3. **Initial Sync:** Runs 5 seconds after server startup
4. **Upsert Strategy:** Uses PostgreSQL ON CONFLICT to handle duplicates
5. **Error Handling:** Comprehensive error logging and recovery

## 🎯 Features Implemented

### Core Features ✅
- [x] Backend API wrapper for external service integration
- [x] PostgreSQL database with proper schema
- [x] Periodic data synchronization (every 15 minutes)
- [x] Client list with search functionality
- [x] Appointment list with filtering (upcoming, today, all)
- [x] Create new appointments form with validation
- [x] Responsive React UI with modern design

### Bonus Features ✅
- [x] Edit and cancel appointments
- [x] Search and filter clients
- [x] Real-time data updates using React Query
- [x] Comprehensive error handling and loading states
- [x] Professional UI/UX with Tailwind CSS
- [x] TypeScript throughout the stack
- [x] Proper form validation

### Additional Enhancements ✅
- [x] Dashboard with key metrics and upcoming appointments
- [x] Mobile-responsive design
- [x] Client selection with visual feedback
- [x] Appointment status tracking
- [x] Notes support for appointments
- [x] Date/time validation (no past appointments)
- [x] Professional navigation and layout

## 🔧 External API Integration

### Postman Mock Server Setup

1. **Import Collection:** Download from the provided Google Drive link
2. **Create Mock Server:** Follow Postman's mock server setup guide
3. **Update Environment:** Replace `https://mock.api` with your mock server URL
4. **Configure Backend:** Set `MOCK_API_URL` in your `.env` file

### Expected API Endpoints
The system expects these endpoints from the mock server:
- `GET /clients` - Returns array of client objects
- `GET /appointments` - Returns array of appointment objects  
- `POST /appointments` - Creates new appointment
- `PUT /appointments/:id` - Updates appointment
- `DELETE /appointments/:id` - Cancels appointment

## 🚨 Error Handling

### Backend
- Database connection errors with retry logic
- External API failures with proper error messages
- Validation errors with descriptive responses
- Unhandled exceptions caught by global error handler

### Frontend
- Network errors with retry options
- Loading states for all async operations
- Form validation with user-friendly messages
- Fallback UI for missing data

## 🧪 Testing the Application

### Quick Health Check
```bash
# Check all services are running
./scripts/docker-setup.sh status

# View real-time logs
./scripts/docker-setup.sh logs
```

### Manual Testing with Docker
1. **Access the application:** http://localhost:3000
2. **API Testing:** http://localhost:5000/api/health
3. **Database Connection:** `docker-compose exec postgres psql -U postgres -d wellness_platform`
4. **Backend Shell:** `docker-compose exec backend sh`
5. **View Database:** `docker-compose exec postgres psql -U postgres -d wellness_platform -c "SELECT * FROM clients;"`

### API Testing
Use the included Postman collection to test:
- All CRUD operations for appointments
- Client data retrieval
- Search functionality
- Error responses

## 📱 Mobile Responsiveness

The application is fully responsive and includes:
- Mobile navigation menu
- Touch-friendly buttons and interactions
- Responsive grid layouts
- Mobile-optimized forms
- Appropriate font sizes and spacing

## ⚡ Performance Optimizations

- React Query for efficient data caching and background updates
- Database indexing on frequently queried columns
- Debounced search to reduce API calls
- Lazy loading and code splitting ready
- Optimized bundle size with tree shaking

## 🔒 Security Considerations

- Input validation on both client and server
- SQL injection prevention through parameterized queries
- CORS configuration for cross-origin requests
- Environment variables for sensitive configuration
- Error messages that don't expose internal details

## 🚀 Deployment Ready

### Backend Deployment
- Environment-based configuration
- Health check endpoint for load balancers
- Graceful shutdown handling
- Production-ready error logging
- Database migration scripts included

### Frontend Deployment  
- Build process optimized for production
- Environment-specific API URLs
- Static asset optimization
- Service worker ready

## 📝 Assumptions Made

1. **Client Management:** Clients are managed in the external system; we only display and sync them locally
2. **Authentication:** No authentication required for this demo (would add JWT tokens in production)
3. **Time Zones:** All times stored in server's local timezone (would use UTC in production)
4. **Data Volume:** Designed for moderate data volumes (~1000s of clients/appointments)
5. **API Reliability:** External API may be temporarily unavailable; system gracefully handles this
6. **Business Rules:** Basic appointment validation (no double-booking checks implemented)

## ⏰ Time Breakdown

**Total Time Spent: 8 hours**

- **Backend Setup & API Integration:** 3 hours
  - Express server setup with TypeScript
  - PostgreSQL database design and connection
  - External API wrapper implementation
  - Data synchronization logic
  
- **Frontend Development:** 4 hours  
  - React application structure
  - Component development (Dashboard, ClientList, AppointmentList, CreateAppointment)
  - API integration with React Query
  - Form handling and validation
  - Responsive UI with Tailwind CSS
  
- **Testing & Documentation:** 1 hour
  - Manual testing of all features
  - README documentation
  - Code cleanup and optimization

## 🔮 Future Enhancements

If given more time, I would implement:

1. **Advanced Features:**
   - Real-time notifications for appointment updates
   - Calendar view for appointments
   - Bulk appointment operations
   - Email/SMS reminders
   - Advanced reporting and analytics

2. **Technical Improvements:**
   - Unit and integration tests
   - API rate limiting and caching
   - Database migrations system
   - Monitoring and logging infrastructure
   - Docker containerization

3. **UX Enhancements:**
   - Advanced filtering and sorting options
   - Drag-and-drop appointment rescheduling
   - Client profile pages with appointment history
   - Dark mode support
   - Offline functionality with service workers

## 📞 Contact

For any questions about this implementation, please reach out to omar@ruhcare.com

---

**Note:** This implementation demonstrates production-ready code practices including proper error handling, TypeScript usage, responsive design, and comprehensive documentation. The system is designed to be scalable and maintainable for a real-world healthcare environment.