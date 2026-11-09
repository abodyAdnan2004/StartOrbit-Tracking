# Orbit Tracking

Real-time location tracking system with a web dashboard, backend API, and mobile app for field users.

## 🏗️ Architecture

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│  Mobile App     │ ◄─────────────────► │  Backend API    │
│  (React Native) │   Location Updates  │  (Node.js/      │
│  - Login        │                     │   Express)      │
│  - Customers    │                     │  - Auth (JWT)   │
│  - Location     │                     │  - Users/CRUD   │
│    Tracking     │                     │  - Customers    │
└─────────────────┘                     │  - Locations    │
                                        │  - Reports      │
                                        └────────┬────────┘
                                                 │ REST API
                                                 ▼
                                        ┌─────────────────┐
                                        │  Frontend       │
                                        │  (Nuxt 4)       │
                                        │  - Dashboard    │
                                        │  - Real-time Map│
                                        │  - User Mgmt    │
                                        │  - Customer Mgmt│
                                        └─────────────────┘
```

## 📁 Project Structure

```
orbit-tracking/
├── frontend/          # Nuxt 4 Dashboard
│   ├── features/      # Feature modules (auth, departments, etc.)
│   ├── common/        # Shared components, services, utils
│   └── server/        # Server-side code
├── backend/           # Node.js/Express API
│   ├── src/
│   │   ├── routes/    # API routes (auth, users, customers, locations, reports)
│   │   ├── middleware/# Auth, error handling
│   │   ├── utils/     # JWT, password, validation
│   │   ├── socket/    # Socket.io handlers
│   │   └── index.js   # Entry point
│   ├── prisma/        # Database schema & seed
│   └── docker/        # Docker configuration
├── mobile/            # React Native + Expo App (to be created)
└── docker-compose.yml # Full stack deployment
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (production) or SQLite (development)
- npm/pnpm

### Development Setup

```bash
# Clone and install
git clone <repository-url>
cd orbit-tracking
npm run install:all

# Setup backend
cd backend
cp .env.example .env
# Edit .env with your settings
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# Start all services
cd ..
npm run dev
```

### Docker Development

```bash
# Start backend + database
npm run docker:dev

# Or production stack
npm run docker:up
```

## 🔧 Backend API

### Base URL
```
Development: http://localhost:3000/api
Production:  https://your-domain.com/api
```

### Authentication

All API routes (except `/auth/login` and `/auth/register`) require a Bearer token:

```bash
Authorization: Bearer <access_token>
```

### Endpoints

#### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login with username/email + password |
| POST | `/auth/register` | Register new user (admin only) |
| GET | `/auth/me` | Get current user profile |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout (revoke refresh token) |
| POST | `/auth/change-password` | Change password |

#### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List users (paginated, filtered) |
| GET | `/users/:id` | Get user by ID |
| POST | `/users` | Create user (admin) |
| PUT | `/users/:id` | Update user |
| DELETE | `/users/:id` | Deactivate user |
| GET | `/users/:id/customers` | Get user's customers |

#### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customers` | List customers (paginated, filtered) |
| GET | `/customers/:id` | Get customer by ID |
| POST | `/customers` | Create customer |
| PUT | `/customers/:id` | Update customer |
| DELETE | `/customers/:id` | Deactivate customer |
| GET | `/customers/:id/locations` | Get customer's location history |

#### Locations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/locations` | Ingest location (single or batch) |
| GET | `/locations` | Get location history |
| GET | `/locations/latest` | Get latest location per user |
| GET | `/locations/user/:userId` | Get user's locations |
| GET | `/locations/stats/distance/:userId` | Get distance/steps stats |

#### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/dashboard` | Dashboard summary with leaderboards |
| GET | `/reports/customers-added` | Top users by customers created |
| GET | `/reports/steps-walked` | Top users by distance/steps |
| GET | `/reports/active-users` | Top users by activity score |
| GET | `/reports/activation-tracking` | User login/activation tracking |
| GET | `/reports/user/:userId/activity` | Detailed user activity |
| GET | `/reports/heatmap` | Location heatmap data |

### WebSocket Events

Connect to `ws://localhost:3000` with Socket.io client:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: 'your-jwt-token' }
});

// Authenticate
socket.emit('authenticate', 'your-jwt-token');

// Listen for real-time location updates
socket.on('location:update', (data) => {
  console.log('Location update:', data);
  // { userId, userName, latitude, longitude, accuracy, speed, heading, timestamp, customerId }
});

// Send location from mobile
socket.emit('location:update', {
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 10,
  speed: 1.5,
  heading: 90,
  customerId: 1
});

// Subscribe to specific user
socket.emit('subscribe:user', userId);
```

## 📱 Mobile App (React Native + Expo)

*To be created - see [MOBILE.md](mobile/README.md) when available*

### Features
- Login with JWT authentication
- View assigned customers
- Add/edit customer data
- Real-time location tracking (10-25s intervals)
- Background location updates
- Offline queue with sync
- Settings screen

### Build APK
```bash
cd mobile
npm install
eas build -p android --profile preview
```

## 🗄️ Database

### Schema (Prisma)

- **User** - Employees with roles (admin, manager, user)
- **Role** - System roles with permissions
- **Customer** - Assigned to users, with contact info
- **Location** - GPS points with metadata, linked to user/customer
- **RefreshToken** - JWT refresh token rotation

### Default Users (after seed)

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | password123 |
| Manager | manager | password123 |
| Field | john_doe | password123 |
| Field | jane_smith | password123 |
| Field | mike_wilson | password123 |
| Field | sarah_jones | password123 |

## 🐳 Docker Deployment

### Development
```bash
docker-compose -f backend/docker-compose.dev.yml up -d
```

### Production
```bash
# Set environment variables
export POSTGRES_PASSWORD=secure_password
export JWT_SECRET=$(openssl rand -base64 32)
export JWT_REFRESH_SECRET=$(openssl rand -base64 32)
export FRONTEND_URL=https://your-domain.com

docker-compose -f backend/docker-compose.yml up -d
```

## 📊 Reports & Analytics

The system provides comprehensive analytics:

1. **Highest Added** - Users ranked by customers created
2. **Most Steps Walked** - Users ranked by GPS distance (Haversine formula)
3. **Most Active User** - Combined score of location frequency + recency
4. **Activation Tracking** - Login timestamps, active/idle status, last location

## 🔐 Security

- JWT access tokens (15 min expiry)
- Refresh token rotation (7 days, stored in DB)
- Password hashing with bcrypt (12 rounds)
- Role-based access control (RBAC)
- Rate limiting (100 req/15min)
- Helmet.js security headers
- CORS configured for frontend domain

## 🧪 Testing

```bash
# Backend API tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📝 Environment Variables

See `.env.example` in each workspace:

- `backend/.env.example` - Backend configuration
- `frontend/.env.example` - Frontend configuration

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙋 Support

For issues and questions:
- Create a GitHub Issue
- Check existing documentation
- Review API endpoint specifications above