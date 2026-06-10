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
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useAppTheme } from '../../utils/ThemeProvider'
import PremiumAuthButton from '../../components/PremiumAuthButton'
import PremiumAuthInput from '../../components/PremiumAuthInput'

interface PremiumForgotPasswordScreenProps {
  navigation: any
}

export default function PremiumForgotPasswordScreen({
  navigation,
}: PremiumForgotPasswordScreenProps) {
  const { theme } = useAppTheme()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  // Animated values
  const cardOpacity = useSharedValue(0)
  const cardY = useSharedValue(40)
  const successOpacity = useSharedValue(0)
  const successScale = useSharedValue(0.5)
  const checkmarkRotate = useSharedValue(-45)
  const confettiOpacity1 = useSharedValue(0)
  const confettiOpacity2 = useSharedValue(0)
  const confettiOpacity3 = useSharedValue(0)

  React.useEffect(() => {
    if (!submitted) {
      // Form entrance
      cardOpacity.value = withDelay(
        200,
        withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
      )
      cardY.value = withDelay(
        200,
        withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
      )
    } else {
      // Success animation
      successScale.value = withDelay(
        300,
        withSpring(1, { damping: 8, mass: 1, stiffness: 80 })
      )
      successOpacity.value = withTiming(1, { duration: 400 })
      checkmarkRotate.value = withDelay(
        500,
        withTiming(0, { duration: 600, easing: Easing.out(Easing.back(1)) })
      )

      // Confetti animation
      confettiOpacity1.value = withDelay(
        800,
        withTiming(0, { duration: 1000 }, () => {
          confettiOpacity1.value = 0
        })
      )
      confettiOpacity2.value = withDelay(
        1000,
        withTiming(0, { duration: 1000 }, () => {
          confettiOpacity2.value = 0
        })
      )
      confettiOpacity3.value = withDelay(
        1200,
        withTiming(0, { duration: 1000 }, () => {
          confettiOpacity3.value = 0
        })
      )
    }
  }, [submitted])

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardY.value }],
  }))

  const successAnimatedStyle = useAnimatedStyle(() => ({
    opacity: successOpacity.value,
    transform: [{ scale: successScale.value }],
  }))

  const checkmarkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${checkmarkRotate.value}deg` }],
  }))

  const confetti1AnimatedStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity1.value,
    transform: [
      { translateY: interpolate(confettiOpacity1.value, [1, 0], [0, -200], Extrapolate.CLAMP) },
      { translateX: interpolate(confettiOpacity1.value, [1, 0], [0, -100], Extrapolate.CLAMP) },
    ],
  }))

  const confetti2AnimatedStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity2.value,
    transform: [
      { translateY: interpolate(confettiOpacity2.value, [1, 0], [0, -200], Extrapolate.CLAMP) },
      { translateX: interpolate(confettiOpacity2.value, [1, 0], [0, 100], Extrapolate.CLAMP) },
    ],
  }))

  const confetti3AnimatedStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity3.value,
    transform: [
      { translateY: interpolate(confettiOpacity3.value, [1, 0], [0, -200], Extrapolate.CLAMP) },
    ],
  }))

  const validateEmail = (emailValue: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)
  }

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    if (!validateEmail(email)) {
      setError('Invalid email address')
      return
    }

    try {
      setLoading(true)
      setError('')
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setSubmitted(true)
      // In real app: call resetPassword API
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    setSubmitted(false)
    setEmail('')
    setError('')
    navigation.goBack()
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

    // Form card
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
    description: {
      fontSize: 14,
      color: theme.colors.textSoft,
      lineHeight: 20,
      marginBottom: 20,
    },

    // Success state
    successContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 300,
    },
    successIcon: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.colors.emerald,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
      shadowColor: theme.colors.emerald,
      shadowOpacity: 0.3,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 8,
    },
    successTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    successDescription: {
      fontSize: 14,
      color: theme.colors.textSoft,
      textAlign: 'center',
      marginBottom: 28,
      lineHeight: 20,
    },
    successMessage: {
      fontSize: 13,
      color: theme.colors.emerald,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 20,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: `${theme.colors.emerald}15`,
    },

    // Confetti
    confettiContainer: {
      position: 'absolute',
      width: 30,
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    confetti: {
      width: 20,
      height: 20,
      borderRadius: 10,
    },
  })

  if (submitted) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Success State */}
          <Animated.View
            style={[successAnimatedStyle, styles.successContainer]}
          >
            {/* Confetti particles */}
            <Animated.View
              style={[
                confetti1AnimatedStyle,
                styles.confettiContainer,
                { top: '30%', left: '20%' },
              ]}
            >
              <View
                style={[
                  styles.confetti,
                  { backgroundColor: theme.colors.emerald },
                ]}
              />
            </Animated.View>
            <Animated.View
              style={[
                confetti2AnimatedStyle,
                styles.confettiContainer,
                { top: '30%', right: '20%' },
              ]}
            >
              <View
                style={[styles.confetti, { backgroundColor: theme.colors.navy }]}
              />
            </Animated.View>
            <Animated.View
              style={[
                confetti3AnimatedStyle,
                styles.confettiContainer,
                { top: '40%', left: '50%' },
              ]}
            >
              <View
                style={[styles.confetti, { backgroundColor: theme.colors.emerald }]}
              />
            </Animated.View>

            {/* Success icon */}
            <View style={styles.successIcon}>
              <Animated.View style={checkmarkAnimatedStyle}>
                <Ionicons
                  name="checkmark"
                  size={50}
                  color={theme.colors.surface}
                />
              </Animated.View>
            </View>

            {/* Success message */}
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successDescription}>
              We've sent a password reset link to {email}
            </Text>

            <View
              style={[
                styles.card,
                { backgroundColor: `${theme.colors.emerald}10` },
              ]}
            >
              <Text style={styles.successMessage}>
                Follow the link in the email to reset your password. It expires in 24 hours.
              </Text>
            </View>

            {/* Back to login button */}
            <PremiumAuthButton
              label="Back to Login"
              onPress={handleBackToLogin}
            />
          </Animated.View>
        </ScrollView>
      </View>
    )
  }

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
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address to receive reset instructions
          </Text>
        </View>

        {/* Form Card */}
        <Animated.View style={[cardAnimatedStyle, styles.card]}>
          <Text style={styles.description}>
            Enter the email address associated with your FairShare account, and we'll send you a link to reset your password.
          </Text>

          <PremiumAuthInput
            label="Email"
            icon="mail"
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => {
              setEmail(text)
              if (error) setError('')
            }}
            error={error}
          />

          {/* Reset Button */}
          <PremiumAuthButton
            label="Send Reset Link"
            onPress={handleResetPassword}
            loading={loading}
            disabled={loading}
          />

          {/* Back to login link */}
          <Pressable
            style={{ marginTop: 16, alignItems: 'center' }}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: theme.colors.emerald, fontWeight: '600' }}>
              Remember your password? Sign in
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
