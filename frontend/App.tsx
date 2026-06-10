import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, View } from 'react-native'
import { theme as staticTheme } from './utils/fairshare'
import { ThemeProvider, useAppTheme } from './utils/ThemeProvider'
import SplashScreen from './screens/FairShareSplashScreen'
import HomeScreen from './screens/FairShareHomeScreen'
import GroupsScreen from './screens/GroupsScreen'
import SettlementsScreen from './screens/FairShareSettlementsScreen'
import BalanceScreen from './screens/FairShareBalanceScreen'
import ActivityScreen from './screens/FairShareActivityScreen'
import ProfileScreen from './screens/FairShareProfileScreen'
import EmailSettingsScreen from './screens/FairShareEmailSettingsScreen'
import AddExpenseModal from './screens/FairShareAddExpenseModal'
import AnalyticsScreen from './screens/FairShareAnalyticsScreen'
import ExpenseDetailsScreen from './screens/FairShareExpenseDetailsScreen'
import MembersScreen from './screens/FairShareMembersScreen'
import QRScannerScreen from './screens/QRScannerScreen'
import {
  PremiumWelcomeScreen,
  PremiumLoginScreen,
  PremiumSignupScreen,
  PremiumForgotPasswordScreen,
} from './screens/PremiumAuth'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()
const AuthStack = createNativeStackNavigator()

function MainTabsInner({ navigation }: any) {
  const [activeTab, setActiveTab] = React.useState('Home')
  const { theme } = useAppTheme()

  return (
    <View style={[styles.shell, { backgroundColor: theme.colors.background }]}> 
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: theme.colors.emerald,
          tabBarInactiveTintColor: theme.colors.muted,
          tabBarLabelStyle: styles.tabLabel,
          tabBarStyle: [styles.tabBar, { backgroundColor: theme.colors.surface }],
          tabBarIcon: ({ color, size, focused }) => {
            const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
              Home: focused ? 'grid' : 'grid-outline',
              Groups: focused ? 'people' : 'people-outline',
              Settlements: focused ? 'swap-horizontal' : 'swap-horizontal-outline',
              Activity: focused ? 'pulse' : 'pulse-outline',
              Profile: focused ? 'person' : 'person-outline',
            }

            return <Ionicons name={icons[route.name]} size={size} color={color} />
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} listeners={() => ({
          focus: () => setActiveTab('Home'),
        })} />
        <Tab.Screen name="Groups" component={GroupsScreen} listeners={({ navigation }) => ({
          focus: () => setActiveTab('Groups'),
          tabPress: () => {
            // Navigate to Groups and request the create modal (do not prevent default)
            navigation.navigate('Groups', { openCreate: true })
          }
        })} />
        <Tab.Screen name="Settlements" component={SettlementsScreen} listeners={() => ({
          focus: () => setActiveTab('Settlements'),
        })} />
        <Tab.Screen name="Activity" component={ActivityScreen} listeners={() => ({
          focus: () => setActiveTab('Activity'),
        })} />
        <Tab.Screen name="Profile" component={ProfileScreen} listeners={() => ({
          focus: () => setActiveTab('Profile'),
        })} />
      </Tab.Navigator>

  

  
    </View>
  )
}

function MainTabs(props: any) { return <MainTabsInner {...props} /> }

function PremiumAuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen
        name="Welcome"
        component={PremiumWelcomeScreen}
        options={{ animation: 'none' }}
      />
      <AuthStack.Screen name="Login" component={PremiumLoginScreen} />
      <AuthStack.Screen name="Signup" component={PremiumSignupScreen} />
      <AuthStack.Screen name="ForgotPassword" component={PremiumForgotPasswordScreen} />
    </AuthStack.Navigator>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  )
}

function MainApp() {
  const { theme, mode } = useAppTheme()
  return (
    <NavigationContainer>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Group screenOptions={{ presentation: 'card' }}>
          <Stack.Screen
            name="Auth"
            component={PremiumAuthNavigator}
            options={{ animation: 'none' }}
          />
        </Stack.Group>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="EmailSettings" component={EmailSettingsScreen} />
        <Stack.Screen name="Balance" component={BalanceScreen} />
        <Stack.Screen name="GroupMembers" component={MembersScreen} />
        <Stack.Screen name="QRScanner" component={QRScannerScreen} />
        <Stack.Screen name="Analytics" component={AnalyticsScreen} />
        <Stack.Screen name="ExpenseDetails" component={ExpenseDetailsScreen} />
        <Stack.Screen
          name="AddExpense"
          component={AddExpenseModal}
          options={{ presentation: 'transparentModal', animation: 'fade' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  tabBar: {
    height: 78,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 0,
    backgroundColor: staticTheme.colors.surface,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 18,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 42,
    alignSelf: 'center',
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: staticTheme.colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
})

