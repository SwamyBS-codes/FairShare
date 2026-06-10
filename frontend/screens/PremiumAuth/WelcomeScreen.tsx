import React, { useEffect } from 'react'
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  Dimensions,
  ScrollView,
  SafeAreaView,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  Easing,
  withTiming,
  interpolate,
  useAnimatedReaction,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useAppTheme } from '../../utils/ThemeProvider'
import PremiumAuthButton from '../../components/PremiumAuthButton'

const { width, height } = Dimensions.get('window')

interface PremiumWelcomeScreenProps {
  navigation: any
}

export default function PremiumWelcomeScreen({
  navigation,
}: PremiumWelcomeScreenProps) {
  const { theme } = useAppTheme()

  // Animated values
  const logoScale = useSharedValue(0)
  const logoRotate = useSharedValue(-45)
  const taglineOpacity = useSharedValue(0)
  const taglineY = useSharedValue(30)
  const buttonsOpacity = useSharedValue(0)
  const buttonsY = useSharedValue(40)
  const floatShape1Y = useSharedValue(0)
  const floatShape2Y = useSharedValue(0)
  const floatShape3Y = useSharedValue(0)

  // Floating animation loop
  useEffect(() => {
    // Logo entrance
    logoScale.value = withDelay(
      200,
      withSpring(1, { damping: 8, mass: 1, stiffness: 80 })
    )
    logoRotate.value = withDelay(
      200,
      withTiming(0, { duration: 800, easing: Easing.out(Easing.back(1)) })
    )

    // Tagline entrance
    taglineOpacity.value = withDelay(
      600,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    )
    taglineY.value = withDelay(
      600,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
    )

    // Buttons entrance
    buttonsOpacity.value = withDelay(
      1000,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    )
    buttonsY.value = withDelay(
      1000,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
    )

    // Floating animation loop
    const floatingAnimation = (initialY: number) => {
      return withSequence(
        withDelay(
          1200,
          withTiming(initialY - 15, {
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        withTiming(initialY + 15, {
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(initialY, { duration: 3000, easing: Easing.inOut(Easing.sin) })
      )
    }

    floatShape1Y.value = withSequence(
      floatingAnimation(0),
      withTiming(0, { duration: 0 })
    )
    floatShape2Y.value = withSequence(
      floatingAnimation(0),
      withTiming(0, { duration: 0 })
    )
    floatShape3Y.value = withSequence(
      floatingAnimation(0),
      withTiming(0, { duration: 0 })
    )
  }, [])

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotate.value}deg` },
    ],
  }))

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineY.value }],
  }))

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsY.value }],
  }))

  const shape1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatShape1Y.value }],
  }))

  const shape2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatShape2Y.value }],
  }))

  const shape3AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatShape3Y.value }],
  }))

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      overflow: 'hidden',
    },
    contentContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 40,
    },
    // Floating background shapes
    floatingShape: {
      position: 'absolute',
      borderRadius: 200,
    },
    shape1: {
      width: 300,
      height: 300,
      top: -100,
      right: -50,
      backgroundColor: theme.colors.emeraldTint,
      opacity: 0.1,
    },
    shape2: {
      width: 250,
      height: 250,
      bottom: 100,
      left: -80,
      backgroundColor: theme.colors.navyTint,
      opacity: 0.12,
    },
    shape3: {
      width: 180,
      height: 180,
      bottom: 200,
      right: 20,
      backgroundColor: theme.colors.emerald,
      opacity: 0.08,
    },

    // Content
    logoContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.colors.emerald,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 32,
      shadowColor: theme.colors.emerald,
      shadowOpacity: 0.3,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 8,
    },
    logoIcon: {
      color: theme.colors.surface,
    },
    taglineContainer: {
      marginBottom: 40,
      alignItems: 'center',
    },
    title: {
      fontSize: 32,
      fontWeight: '800',
      color: theme.colors.text,
      letterSpacing: -1,
      marginBottom: 12,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 15,
      color: theme.colors.textSoft,
      lineHeight: 24,
      maxWidth: 320,
      textAlign: 'center',
    },
    badgeContainer: {
      marginTop: 24,
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'center',
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.line,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSoft,
    },
    buttonsContainer: {
      width: '100%',
      gap: 12,
    },
  })

  return (
    <View style={styles.container}>
      {/* Floating background shapes */}
      <Animated.View
        style={[
          styles.floatingShape,
          styles.shape1,
          shape1AnimatedStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.floatingShape,
          styles.shape2,
          shape2AnimatedStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.floatingShape,
          styles.shape3,
          shape3AnimatedStyle,
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated Logo */}
        <Animated.View style={[logoAnimatedStyle, styles.logoContainer]}>
          <Ionicons name="wallet" size={50} style={styles.logoIcon} />
        </Animated.View>

        {/* Animated Tagline */}
        <Animated.View
          style={[taglineAnimatedStyle, styles.taglineContainer]}
        >
          <Text style={styles.title}>FairShare</Text>
          <Text style={styles.subtitle}>
            Split Smartly. Share Fairly.
          </Text>
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={14} color={theme.colors.emerald} />
              <Text style={styles.badgeText}>Easy</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={14} color={theme.colors.emerald} />
              <Text style={styles.badgeText}>Secure</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="flash" size={14} color={theme.colors.emerald} />
              <Text style={styles.badgeText}>Fast</Text>
            </View>
          </View>
        </Animated.View>

        {/* Animated Buttons */}
        <Animated.View
          style={[buttonsAnimatedStyle, styles.buttonsContainer]}
        >
          <PremiumAuthButton
            label="Get Started"
            onPress={() => navigation.navigate('Login')}
          />
          <PremiumAuthButton
            label="I Already Have an Account"
            variant="secondary"
            onPress={() => navigation.navigate('Login')}
          />
        </Animated.View>
      </ScrollView>
    </View>
  )
}
