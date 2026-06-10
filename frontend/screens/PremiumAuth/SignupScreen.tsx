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
  Image,
  Dimensions,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAppTheme } from '../../utils/ThemeProvider'
import PremiumAuthButton from '../../components/PremiumAuthButton'
import PremiumAuthInput from '../../components/PremiumAuthInput'
import { register } from '../../utils/api'

const { width } = Dimensions.get('window')

interface PremiumSignupScreenProps {
  navigation: any
}

export default function PremiumSignupScreen({
  navigation,
}: PremiumSignupScreenProps) {
  const { theme } = useAppTheme()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ 
    name?: string
    email?: string
    password?: string
    confirmPassword?: string
    terms?: string
  }>({})

  // Animated values
  const cardOpacity = useSharedValue(0)
  const cardY = useSharedValue(40)
  const termsOpacity = useSharedValue(0)
  const termsY = useSharedValue(20)

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

    // Terms entrance
    termsOpacity.value = withDelay(
      600,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    )
    termsY.value = withDelay(
      600,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
    )
  }, [])

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardY.value }],
  }))

  const termsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: termsOpacity.value,
    transform: [{ translateY: termsY.value }],
  }))

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri)
    }
  }

  const validateForm = () => {
    const newErrors: typeof errors = {}
    if (!fullName.trim()) newErrors.name = 'Full name is required'
    if (!email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = 'Invalid email address'
    if (!password.trim()) newErrors.password = 'Password is required'
    else if (password.length < 8)
      newErrors.password = 'Password must be at least 8 characters'
    else if (!/[A-Z]/.test(password))
      newErrors.password = 'Password must include uppercase letters'
    else if (!/[0-9]/.test(password))
      newErrors.password = 'Password must include numbers'
    if (confirmPassword !== password)
      newErrors.confirmPassword = 'Passwords do not match'
    if (!agreedToTerms) newErrors.terms = 'You must agree to terms'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSignup = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      const response = await register({
        name: fullName.trim(),
        email: email.trim(),
        password,
      })
      await AsyncStorage.setItem('token', response.token)
      // persist name/email for profile fallback
      await AsyncStorage.setItem('userName', fullName.trim())
      await AsyncStorage.setItem('userEmail', email.trim())
      Alert.alert('Success', 'Account created successfully!', [
        {
          text: 'OK',
          onPress: () =>
            navigation.reset({ index: 0, routes: [{ name: 'Main' }] }),
        },
      ])
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message || 'Please try again.')
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
    },
    header: {
      marginBottom: 24,
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

    // Profile avatar
    avatarSection: {
      alignItems: 'center',
      marginBottom: 28,
    },
    avatarContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.colors.emeraldTint,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 2,
      borderColor: theme.colors.emerald,
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarInitials: {
      fontSize: 40,
      fontWeight: '700',
      color: theme.colors.emerald,
    },
    avatarButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.emerald,
    },
    avatarButtonText: {
      color: theme.colors.surface,
      fontSize: 12,
      fontWeight: '700',
    },

    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.colors.line,
      marginBottom: 20,
      shadowColor: '#0F172A',
      shadowOpacity: 0.08,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },

    termsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 20,
    },
    termsCheckbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: theme.colors.line,
      justifyContent: 'center',
      alignItems: 'center',
    },
    termsCheckboxChecked: {
      backgroundColor: theme.colors.emerald,
      borderColor: theme.colors.emerald,
    },
    termsLabel: {
      flex: 1,
      fontSize: 13,
      color: theme.colors.textSoft,
      lineHeight: 18,
    },
    termsLink: {
      color: theme.colors.emerald,
      fontWeight: '700',
    },
    termsError: {
      color: '#EF4444',
      fontSize: 12,
      fontWeight: '500',
      marginBottom: 12,
    },

    loginLink: {
      marginTop: 16,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 4,
    },
    loginLinkText: {
      fontSize: 14,
      color: theme.colors.textSoft,
    },
    loginLinkBold: {
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join FairShare today</Text>
        </View>

        {/* Profile Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarInitials}>
                {fullName.charAt(0).toUpperCase() || '?'}
              </Text>
            )}
          </View>
          <Pressable style={styles.avatarButton} onPress={pickImage}>
            <Text style={styles.avatarButtonText}>Upload Photo</Text>
          </Pressable>
        </View>

        {/* Signup Form Card */}
        <Animated.View style={[cardAnimatedStyle, styles.card]}>
          <PremiumAuthInput
            label="Full Name"
            icon="person"
            placeholder="John Doe"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text)
              if (errors.name) setErrors({ ...errors, name: undefined })
            }}
            error={errors.name}
          />

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
            hint="Min 8 chars, 1 uppercase, 1 number"
            value={password}
            onChangeText={(text) => {
              setPassword(text)
              if (errors.password) setErrors({ ...errors, password: undefined })
            }}
            error={errors.password}
          />

          <PremiumAuthInput
            label="Confirm Password"
            icon="lock-closed"
            placeholder="••••••••"
            isPassword
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text)
              if (errors.confirmPassword)
                setErrors({ ...errors, confirmPassword: undefined })
            }}
            error={errors.confirmPassword}
          />
        </Animated.View>

        {/* Terms and Conditions */}
        <Animated.View style={termsAnimatedStyle}>
          <Pressable
            style={styles.termsContainer}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
          >
            <View
              style={[
                styles.termsCheckbox,
                agreedToTerms && styles.termsCheckboxChecked,
              ]}
            >
              {agreedToTerms && (
                <Ionicons
                  name="checkmark"
                  size={16}
                  color={theme.colors.surface}
                />
              )}
            </View>
            <Text style={styles.termsLabel}>
              I agree to the{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </Pressable>
          {errors.terms && (
            <Text style={styles.termsError}>{errors.terms}</Text>
          )}

          {/* Sign Up Button */}
          <PremiumAuthButton
            label="Create Account"
            onPress={handleSignup}
            loading={loading}
            disabled={loading}
          />

          {/* Login Link */}
          <View style={styles.loginLink}>
            <Text style={styles.loginLinkText}>Already have an account?</Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLinkBold}>Sign In</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
