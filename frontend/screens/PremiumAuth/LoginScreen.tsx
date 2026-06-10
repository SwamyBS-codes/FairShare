import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAppTheme } from '../../utils/ThemeProvider'
import PremiumAuthButton from '../../components/PremiumAuthButton'
import PremiumAuthInput from '../../components/PremiumAuthInput'
import { login } from '../../utils/api'

interface PremiumLoginScreenProps {
  navigation: any
}

export default function PremiumLoginScreen({
  navigation,
}: PremiumLoginScreenProps) {
  const { theme } = useAppTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  // Animated values
  const cardOpacity = useSharedValue(0)
  const cardY = useSharedValue(40)
  const socialOpacity = useSharedValue(0)
  const socialY = useSharedValue(20)

  React.useEffect(() => {
    // Card entrance
    cardOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    )
    cardY.value = withDelay(
      200,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
    )

    // Social buttons entrance
    socialOpacity.value = withDelay(
      600,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    )
    socialY.value = withDelay(
      600,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
    )
  }, [])

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardY.value }],
  }))

  const socialAnimatedStyle = useAnimatedStyle(() => ({
    opacity: socialOpacity.value,
    transform: [{ translateY: socialY.value }],
  }))

  const validateForm = () => {
    const newErrors: typeof errors = {}
    if (!email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = 'Invalid email address'
    if (!password.trim()) newErrors.password = 'Password is required'
    else if (password.length < 6)
      newErrors.password = 'Password must be at least 6 characters'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      const response = await login({ email: email.trim(), password })
      await AsyncStorage.setItem('token', response.token)
      // persist email for profile fallback
      await AsyncStorage.setItem('userEmail', email.trim())
      if (rememberMe) {
        await AsyncStorage.setItem('rememberEmail', email.trim())
      }
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] })
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      paddingBottom: 32,
      justifyContent: 'center',
    },
    header: {
      marginBottom: 32,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.colors.text,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSoft,
      marginTop: 8,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.colors.line,
      marginBottom: 24,
      shadowColor: '#0F172A',
      shadowOpacity: 0.08,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
    rememberContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
      paddingVertical: 8,
    },
    rememberLabel: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '600',
    },
    rememberCheckbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: theme.colors.line,
      justifyContent: 'center',
      alignItems: 'center',
    },
    rememberCheckboxChecked: {
      backgroundColor: theme.colors.emerald,
      borderColor: theme.colors.emerald,
    },
    forgotLink: {
      alignSelf: 'flex-end',
      marginBottom: 24,
    },
    forgotLinkText: {
      fontSize: 14,
      color: theme.colors.emerald,
      fontWeight: '600',
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.line,
    },
    dividerText: {
      paddingHorizontal: 12,
      fontSize: 13,
      color: theme.colors.textSoft,
      fontWeight: '600',
    },
    socialContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    socialButton: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.line,
      justifyContent: 'center',
      alignItems: 'center',
    },
    signupLink: {
      marginTop: 20,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 4,
    },
    signupLinkText: {
      fontSize: 14,
      color: theme.colors.textSoft,
    },
    signupLinkBold: {
      fontWeight: '700',
      color: theme.colors.emerald,
    },
  })

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to your FairShare account
          </Text>
        </View>

        {/* Login Form Card */}
        <Animated.View style={[cardAnimatedStyle, styles.card]}>
          <PremiumAuthInput
            label="Email"
            icon="mail"
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => {
              setEmail(text)
              if (errors.email) setErrors({ ...errors, email: undefined })
            }}
            error={errors.email}
          />

          <PremiumAuthInput
            label="Password"
            icon="lock-closed"
            placeholder="••••••••"
            isPassword
            value={password}
            onChangeText={(text) => {
              setPassword(text)
              if (errors.password) setErrors({ ...errors, password: undefined })
            }}
            error={errors.password}
          />

          <Pressable
            style={styles.rememberContainer}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <Text style={styles.rememberLabel}>Remember me</Text>
            <View
              style={[
                styles.rememberCheckbox,
                rememberMe && styles.rememberCheckboxChecked,
              ]}
            >
              {rememberMe && (
                <Ionicons name="checkmark" size={16} color={theme.colors.surface} />
              )}
            </View>
          </Pressable>

          {/* Forgot Password Link */}
          <Pressable
            style={styles.forgotLink}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotLinkText}>Forgot Password?</Text>
          </Pressable>

          {/* Login Button */}
          <PremiumAuthButton
            label="Sign In"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
          />
        </Animated.View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Login */}
        <Animated.View style={socialAnimatedStyle}>
          <View style={styles.socialContainer}>
            <Pressable style={styles.socialButton}>
              <Ionicons name="logo-google" size={20} color={theme.colors.text} />
            </Pressable>
            <Pressable style={styles.socialButton}>
              <Ionicons name="logo-apple" size={20} color={theme.colors.text} />
            </Pressable>
            <Pressable style={styles.socialButton}>
              <Ionicons name="logo-facebook" size={20} color={theme.colors.text} />
            </Pressable>
          </View>

          {/* Sign Up Link */}
          <View style={styles.signupLink}>
            <Text style={styles.signupLinkText}>Don't have an account?</Text>
            <Pressable onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupLinkBold}>Sign Up</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
