# Orbit Tracking Mobile App

React Native + Expo mobile app for field users to track location and manage customers.

## 📱 Features

- **Authentication** - JWT-based login with remember me
- **Customer Management** - View, add, edit, delete assigned customers
- **Real-time Location Tracking** - Background GPS tracking (10-25s intervals)
- **Offline Support** - Queues locations when offline, syncs when online
- **Settings** - Configure tracking preferences, notifications, data export
- **APK Distribution** - Build APK for direct installation on Android devices

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Expo CLI (`npm install -g @expo/cli`)
- EAS CLI (`npm install -g eas-cli`)
- Android Studio (for emulator) or physical Android device

### Installation

```bash
cd mobile
npm install
```

### Development

```bash
# Start Expo dev server
npm start

# Run on Android
npm run android

# Run on iOS (requires macOS)
npm run ios

# Run on Web
npm run web
```

### Build APK

```bash
# Login to EAS (first time only)
eas login

# Configure project (first time only)
eas build:configure

# Build preview APK (for testing)
npm run build:android

# Build production APK/AAB
npm run build:android:prod
```

## 📁 Project Structure

```
mobile/
├── app/                    # Expo Router file-based routing
│   ├── _layout.tsx         # Root layout with auth check
│   ├── index.tsx           # Entry point (redirects to login or tabs)
│   ├── auth/
│   │   ├── _layout.tsx
│   │   └── login.tsx       # Login screen
│   └── (tabs)/             # Tab navigation
│       ├── _layout.tsx
│       ├── customers.tsx   # Customer list & management
│       ├── tracking.tsx    # Real-time location tracking
│       └── settings.tsx    # App settings
├── components/             # Reusable UI components
├── hooks/                  # Custom React hooks
├── store/                  # Zustand state stores
│   ├── authStore.ts        # Authentication state
│   ├── customerStore.ts    # Customer data
│   └── locationStore.ts    # Location tracking
├── utils/                  # Utility functions
│   ├── api.ts              # Axios API client
│   └── socket.ts           # Socket.io client
├── types/                  # TypeScript type definitions
│   ├── auth.ts
│   ├── customer.ts
│   ├── location.ts
│   └── reports.ts
├── constants/              # App constants
├── assets/                 # Images, fonts, etc.
├── app.json                # Expo configuration
├── eas.json                # EAS Build configuration
├── tsconfig.json           # TypeScript configuration
└── package.json
```

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```env
EXPO_PUBLIC_API_URL=http://your-backend-url:3000/api
```

### Backend Connection

The app connects to the backend via:
- REST API: `EXPO_PUBLIC_API_URL`
- WebSocket: Same host as REST API (port 3000)

Update `app.json` and `utils/api.ts` with your backend URL.

## 📦 Building APK

### Using EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure project
eas build:configure

# Build APK for testing
eas build -p android --profile preview

# Build for production (AAB for Play Store)
eas build -p android --profile production
```

### Local Build (Requires Android SDK)

```bash
# Generate native code
npx expo prebuild

# Build APK
cd android
./gradlew assembleRelease
```

## 🔐 Permissions

The app requires these Android permissions:
- `ACCESS_FINE_LOCATION` - Precise GPS location
- `ACCESS_COARSE_LOCATION` - Approximate location
- `ACCESS_BACKGROUND_LOCATION` - Background tracking
- `FOREGROUND_SERVICE` - Keep tracking alive
- `FOREGROUND_SERVICE_LOCATION` - Location foreground service
- `WAKE_LOCK` - Prevent sleep during tracking
- `INTERNET` - Network communication
- `RECEIVE_BOOT_COMPLETED` - Restart tracking on boot

## 🏗️ Architecture

### State Management (Zustand)

- **authStore** - User auth, tokens, login/logout
- **customerStore** - Customer CRUD, search, filters
- **locationStore** - GPS tracking, offline queue, socket

### Real-time Communication

- **Socket.io** for real-time location broadcasting
- Automatic reconnection with exponential backoff
- Token refresh handling

### Offline Support

- Locations queued in memory when offline
- Automatic flush when connection restored
- Background sync via Expo TaskManager

## 🧪 Testing

```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Unit tests (when added)
npm test
```

## 📄 License

MIT License

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request