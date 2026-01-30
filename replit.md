# Sand Scribe - Replit Agent Guidelines

## Overview

Sand Scribe is a romantic communication app that enables users to send heartfelt messages to a loved one's BLE-connected display device. The app follows a message queue architecture where senders compose messages that get stored on a server, and receivers fetch pending messages to deliver them to a physical ESP32 display device via Bluetooth Low Energy.

The application has two distinct modes:
- **Sender Mode**: Compose and queue messages (no Bluetooth required)
- **Receiver Mode**: Connect to ESP32 via BLE, fetch pending messages, and send to display

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54 (new architecture enabled)
- **Navigation**: React Navigation v7 with bottom tabs and native stack overlays
  - Tab-based main navigation (Send, Receive, History)
  - Stack overlays for modal screens
- **State Management**: TanStack React Query for server state and data fetching
- **Styling**: StyleSheet API with a custom beach-themed design system (BeachColors)
- **Animations**: React Native Reanimated for fluid animations and haptic feedback via expo-haptics
- **UI Components**: Custom component library with ThemedText, ThemedView, Cards, and gradient backgrounds

### Backend Architecture
- **Runtime**: Node.js with Express.js 5
- **Language**: TypeScript compiled with tsx (development) and esbuild (production)
- **API Design**: RESTful JSON API for message queue operations
  - `POST /api/messages` - Queue new message
  - `GET /api/messages/pending` - Fetch pending messages
  - `GET /api/messages/delivered` - Fetch delivered messages  
  - `PATCH /api/messages/:id/deliver` - Mark message as delivered

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Defined in `shared/schema.ts` with Zod validation via drizzle-zod
- **Current Implementation**: In-memory storage (MemStorage class) with PostgreSQL schema ready for database provisioning
- **Tables**: Users and Messages tables defined

### Path Aliases
- `@/` maps to `./client/`
- `@shared/` maps to `./shared/`

### Build System
- **Development**: Expo with Metro bundler, tsx for server
- **Production**: Custom build script for static Expo web builds, esbuild for server bundling
- **Scripts**: Separate expo and server dev commands that run concurrently

## External Dependencies

### Third-Party Services
- **Bluetooth Low Energy**: Simulated BLE service for Expo Go (real implementation would require react-native-ble-plx with development build)
  - Target device: ESP32 with specific service/characteristic UUIDs
  - Device name: "Helen's Display"

### Key NPM Packages
- **expo-linear-gradient**: Gradient backgrounds for beach theme
- **expo-haptics**: Tactile feedback on interactions
- **expo-blur**: iOS blur effects for tab bar and headers
- **@tanstack/react-query**: Server state management
- **drizzle-orm** + **drizzle-zod**: Database ORM with validation
- **react-native-reanimated**: Animation library
- **react-native-keyboard-controller**: Keyboard-aware scroll views

### Fonts
- **Pacifico**: Decorative font for app title
- **Nunito**: Body text font

### Database
- PostgreSQL (via DATABASE_URL environment variable)
- Drizzle Kit for migrations (`./migrations` directory)