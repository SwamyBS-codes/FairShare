# FairShare - React Native Mobile App

A modern React Native mobile application for sharing and tracking expenses using Expo.

## 🎯 Features

- **User Authentication**: Login and registration system
- **Dashboard**: Overview with summary statistics and recent activity
- **Group Management**: Create and manage expense groups
- **Expense Tracking**: Add and track expenses with categories
- **Settlement Management**: Track and manage payment settlements
- **Cross-platform**: Works on iOS and Android via Expo

## 🛠️ Tech Stack

- **React Native**: Mobile application framework
- **Expo**: Development platform for React Native
- **React Navigation**: Navigation library for React Native
- **Async Storage**: Local device storage
- **TypeScript**: Type-safe JavaScript

## 📁 Project Structure

\\\
frontend/
├── screens/
│   ├── LoginScreen.tsx          # Authentication screen
│   ├── HomeScreen.tsx           # Dashboard / home screen
│   ├── GroupsScreen.tsx         # Groups management
│   ├── ExpensesScreen.tsx       # Expense tracking
│   └── SettlementsScreen.tsx    # Settlement tracking
├── utils/
│   └── api.ts                   # API service
├── App.tsx                      # Main app navigation
├── app.json                     # Expo configuration
└── package.json                 # Dependencies
\\\

## 🚀 Installation

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Expo CLI: \
pm install -g expo-cli\

### Setup

1. Navigate to the frontend directory:
\\\ash
cd frontend
\\\

2. Install dependencies:
\\\ash
npm install
\\\

3. Create \.env\ file from \.env.example\:
\\\ash
cp .env.example .env
\\\

4. Update the API URL if needed (default: \http://localhost:3000/api\)

## 📱 Running the App

### Development Mode

Start the Expo development server:
\\\ash
npm start
# or
npx expo start
\\\

### Run on specific platform

**iOS Simulator** (macOS only):
\\\ash
npm run ios
\\\

**Android Emulator**:
\\\ash
npm run android
\\\

**Web** (for testing):
\\\ash
npm run web
\\\

### Using Expo Go App

1. Install Expo Go from App Store or Play Store
2. Scan the QR code from the terminal when running \
pm start\

## 🔑 API Integration

The app communicates with the backend API at \http://localhost:3000/api\.

### Available API Endpoints

#### Authentication
- \POST /users/login\ - User login
- \POST /users/register\ - User registration
- \GET /users/profile\ - Get user profile

#### Dashboard
- \GET /dashboard\ - Get dashboard statistics

#### Groups
- \GET /groups\ - List all groups
- \POST /groups\ - Create new group

#### Expenses
- \GET /expenses\ - List all expenses
- \POST /expenses\ - Create new expense

#### Settlements
- \GET /settlements\ - List all settlements
- \PUT /settlements/:id\ - Mark settlement as paid

## 🎨 UI Components

All screens are built with React Native components:
- **View**: Container component
- **Text**: Text rendering
- **TextInput**: Input fields
- **TouchableOpacity**: Buttons and interactive elements
- **ScrollView**: Scrollable containers
- **ActivityIndicator**: Loading spinner
- **Picker**: Select/dropdown component
- **Alert**: Dialog/alert popups

## 📦 Environment Variables

\\\env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
\\\

## 🔄 State Management

The app uses:
- React hooks (\useState\, \useEffect\, \useFocusEffect\)
- AsyncStorage for persistent user tokens
- React Navigation for navigation state

## 📋 Features Implemented

✅ User authentication with login/register
✅ Dashboard with statistics
✅ Group management interface
✅ Expense tracking
✅ Settlement management
✅ Error handling with alerts
✅ Loading states
✅ Form validation

## 🚧 Features to Implement

- [ ] User profile management
- [ ] Group member management
- [ ] Advanced expense splitting
- [ ] Expense filters and search
- [ ] Push notifications
- [ ] Offline mode with data sync
- [ ] Export/share reports
- [ ] Real-time updates with WebSocket
- [ ] Dark mode support
- [ ] Multi-language support

## 🐛 Debugging

### Enable debug mode in Expo
\\\ash
npx expo start --dev-client
\\\

### Common Issues

**API Connection Issues:**
- Ensure backend is running on \http://localhost:3000\
- Check \.env\ file for correct API URL
- On Android emulator, use \10.0.2.2:3000\ instead of \localhost:3000\

**Build Issues:**
- Clear cache: \
pm start -- --clear\
- Reset Expo: \
px expo start -c\

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [React Navigation Documentation](https://reactnavigation.org)

## 📄 License

MIT