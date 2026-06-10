# FairShare - Complete Project Setup Guide

## Project Structure

```
FairShare/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Data models
│   │   ├── routes/          # API routes
│   │   ├── schemas/         # Validation schemas
│   │   ├── middleware/      # Custom middleware
│   │   ├── utils/           # Utility functions
│   │   ├── db/              # Database connection
│   │   ├── index.js         # Server entry point
│   │   └── socket.js        # WebSocket configuration
│   ├── prisma/              # Prisma ORM
│   ├── sql/                 # Database initialization
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── frontend/
│   ├── screens/
│   │   ├── LoginScreen.tsx       # Authentication screen
│   │   ├── HomeScreen.tsx        # Dashboard / home screen
│   │   ├── GroupsScreen.tsx      # Groups management
│   │   ├── ExpensesScreen.tsx    # Expense tracking
│   │   └── SettlementsScreen.tsx # Settlement tracking
│   ├── utils/
│   │   └── api.ts                # API service
│   ├── App.tsx                   # Main app navigation
│   ├── app.json                  # Expo configuration
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
└── README.md
```

## Frontend Features (React Native + Expo)

### ✅ Completed
- **Authentication**: Login and registration system with AsyncStorage
- **Dashboard**: Overview with summary statistics and recent activity
- **Groups**: Create and manage expense groups
- **Expenses**: Track expenses with categories (food, utilities, entertainment, other)
- **Settlements**: Manage payment settlements between users
- **Cross-platform**: iOS, Android, and Web support via Expo
- **API Integration**: Complete API service with all endpoints
- **Error Handling**: Alert-based error messages and loading states
- **Form Validation**: Input validation with user feedback

### Screens Created
1. **LoginScreen.tsx** - Authentication with login/register toggle
2. **HomeScreen.tsx** - Dashboard with statistics and navigation
3. **GroupsScreen.tsx** - Group management with creation form
4. **ExpensesScreen.tsx** - Expense tracking with category picker
5. **SettlementsScreen.tsx** - Settlement management and history

### Tech Stack
- **React Native**: Mobile application framework
- **Expo**: Development platform and CLI
- **React Navigation**: Screen navigation
- **AsyncStorage**: Local device storage for tokens
- **TypeScript**: Type-safe code
- **Fetch API**: API communication

## Setup Instructions

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
```

4. Update `.env` with database credentials

5. Initialize database:
```bash
npm run db:init  # or use Prisma migrations
```

6. Start the server:
```bash
npm run dev
```

Backend will run on `http://localhost:3000`

### Frontend Setup (React Native + Expo)

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
```

4. Update `.env` if needed (default API URL: `http://localhost:3000/api`)

5. Start the Expo development server:
```bash
npm start
# or
npx expo start
```

6. Choose how to run:
   - **iOS Simulator** (macOS): Press `i`
   - **Android Emulator**: Press `a`
   - **Web Browser**: Press `w`
   - **Expo Go App**: Scan QR code with Expo Go

## Development Workflow

### Running Both Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Then:
- Open Expo Go on your phone and scan the QR code, OR
- Press `i` for iOS Simulator or `a` for Android Emulator

## API Endpoints Available

### Authentication
- `POST /api/users/login` - User login
- `POST /api/users/register` - User registration
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

### Groups
- `GET /api/groups` - List all groups
- `POST /api/groups` - Create new group
- `GET /api/groups/:id` - Get group details
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group

### Expenses
- `GET /api/expenses` - List all expenses
- `POST /api/expenses` - Create new expense
- `GET /api/expenses/:id` - Get expense details
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Settlements
- `GET /api/settlements` - List all settlements
- `PUT /api/settlements/:id` - Mark settlement as paid

## Features to Implement

### Backend
- [ ] User authentication with JWT
- [ ] Database models and migrations
- [ ] Expense splitting algorithms
- [ ] Settlement calculations
- [ ] Real-time notifications with WebSocket

### Frontend (React Native)
- [ ] Group member management
- [ ] Expense split options (equal, itemized, percentage)
- [ ] Advanced filtering and search
- [ ] User profile management
- [ ] Offline sync capability
- [ ] Push notifications
- [ ] Real-time updates with WebSockets
- [ ] Dark mode support

## Project Notes

- **Frontend Framework**: React Native with Expo (cross-platform mobile)
- **API Base URL**: Default is `http://localhost:3000/api` (configurable via `.env`)
- **Authentication**: Token-based with AsyncStorage persistence
- **Navigation**: React Navigation with native stack navigator
- **Platform Support**: iOS, Android, and Web (via Expo)
- **Android Emulator API URL**: Use `10.0.2.2:3000` instead of `localhost:3000`

## Environment Variables

### Backend (.env)
```
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
PORT=3000
```

### Frontend (.env)
```
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

## Troubleshooting

### API Connection Issues
- Ensure backend is running on `http://localhost:3000`
- Check `.env` file for correct API URL
- On Android emulator, use `10.0.2.2:3000` instead of `localhost:3000`

### Build Issues
```bash
# Clear Expo cache
npm start -- --clear

# Reset Expo
npx expo start -c
```

### Port Already in Use
```bash
# Kill process on port 3000 (backend)
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows
```

## Next Steps

1. Implement backend authentication and database models
2. Test API endpoints with Postman or similar
3. Connect and verify frontend-backend communication
4. Add form validation on frontend
5. Implement error handling
6. Add loading states and optimistic updates
7. Implement real-time features with WebSockets
8. Add unit tests
9. Build for iOS and Android with Expo
10. Deploy to production

## Support

For questions or issues, refer to the README.md files in both backend and frontend directories.
