# 🚀 Quick Start Guide - FairShare

## Project Overview

FairShare is now set up with:
- **Backend**: Node.js/Express API server
- **Frontend**: React Native mobile app (iOS, Android, Web via Expo)

## ⚡ Quick Start (5 minutes)

### 1. Start Backend

```bash
cd backend
npm install  # if not already done
npm run dev
```

The backend will start on `http://localhost:3000`

### 2. Start Frontend

In a new terminal:

```bash
cd frontend
npm install  # if not already done
npm start
```

### 3. Run the Mobile App

Choose one of the following:

**iOS Simulator** (macOS only):
```bash
Press 'i' in the Expo terminal
```

**Android Emulator**:
```bash
Press 'a' in the Expo terminal
```

**Web Browser** (for quick testing):
```bash
Press 'w' in the Expo terminal
```

**Physical Phone** (iOS or Android):
1. Install "Expo Go" app from App Store or Play Store
2. Scan the QR code displayed in the terminal

## 📱 Frontend Structure

```
frontend/
├── App.tsx                 # Navigation setup & authentication
├── screens/
│   ├── LoginScreen.tsx     # Login/Register
│   ├── HomeScreen.tsx      # Dashboard
│   ├── GroupsScreen.tsx    # Groups management
│   ├── ExpensesScreen.tsx  # Expense tracking
│   └── SettlementsScreen.tsx # Settlement management
├── utils/
│   └── api.ts              # API calls
└── app.json                # Expo config
```

## 🔐 Authentication Flow

1. User opens the app
2. If no token in storage → shows LoginScreen
3. User enters credentials → API call
4. Token stored in AsyncStorage
5. Navigate to HomeScreen (Dashboard)

## 🌐 API Communication

All API calls go through `utils/api.ts`:
- Base URL: `http://localhost:3000/api`
- Token: Sent in Authorization header
- Error handling: Alert dialogs

## 🎯 Key Features

✅ **Login/Register** - User authentication
✅ **Dashboard** - Statistics overview
✅ **Groups** - Create & manage groups
✅ **Expenses** - Track expenses by category
✅ **Settlements** - Manage payments

## 🛠️ Environment Setup

### .env file (frontend)
```
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

### For Android Emulator
If using Android Emulator and getting connection errors, change the API URL to:
```
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api
```

## 📝 Typical Development Workflow

1. **Make API call changes** → Edit `utils/api.ts`
2. **Update screen UI** → Edit component in `screens/`
3. **Test on device/simulator** → Changes reload automatically (HMR)
4. **Check backend** → Verify API endpoint is working

## 🐛 Common Issues

### Connection Refused
- ✅ Check backend is running on port 3000
- ✅ Check `EXPO_PUBLIC_API_URL` in `.env`
- ✅ On Android emulator, use `10.0.2.2` instead of `localhost`

### Blank Screen
- Clear cache: `npm start -- --clear`
- Restart: Kill terminal and run `npm start` again

### Port Already in Use
```bash
# Windows: Find and kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -i :3000
kill -9 <PID>
```

## 📚 Available Scripts

### Frontend
```bash
npm start          # Start Expo dev server
npm run android    # Run on Android emulator
npm run ios        # Run on iOS simulator
npm run web        # Run in web browser
```

### Backend
```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run db:init    # Initialize database
```

## 🔗 API Endpoints

### Auth
- `POST /users/login` - Login
- `POST /users/register` - Register

### Dashboard
- `GET /dashboard` - Get stats

### Groups
- `GET /groups` - List groups
- `POST /groups` - Create group

### Expenses
- `GET /expenses` - List expenses
- `POST /expenses` - Create expense

### Settlements
- `GET /settlements` - List settlements
- `PUT /settlements/:id` - Mark as paid

## 🎓 What's Next?

1. Test the app in your simulator
2. Implement backend endpoints if not done
3. Test API integration
4. Add form validation
5. Implement error handling
6. Add loading states
7. Test on physical device
8. Build for production

## 💡 Tips

- **Hot Reload**: Changes auto-reload in Expo
- **Debugger**: Use React DevTools with Expo
- **Logs**: Check console in Expo terminal
- **Device**: Shake phone to open Expo menu

## 📞 Need Help?

- Expo docs: https://docs.expo.dev
- React Native: https://reactnative.dev
- React Navigation: https://reactnavigation.org

---

**Happy coding! 🎉**
