import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
} from 'react-native-reanimated'
import { useAppTheme } from '../utils/ThemeProvider'

interface PremiumAuthButtonProps {
  label: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'social'
  icon?: React.ReactNode
}

export default function PremiumAuthButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  icon,
}: PremiumAuthButtonProps) {
  const { theme } = useAppTheme()
  const scale = useSharedValue(1)

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 10, mass: 1, stiffness: 100 })
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, mass: 1, stiffness: 100 })
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const getBackgroundColor = () => {
    if (disabled) return theme.colors.muted
    if (variant === 'primary') return theme.colors.emerald
    if (variant === 'secondary') return theme.colors.surface
    if (variant === 'social') return theme.colors.background
    return theme.colors.emerald
  }

  const getTextColor = () => {
    if (variant === 'primary') return theme.colors.surface
    if (variant === 'secondary') return theme.colors.text
    if (variant === 'social') return theme.colors.text
    return theme.colors.surface
  }

  const getBorderColor = () => {
    if (variant === 'secondary' || variant === 'social') return theme.colors.line
    return 'transparent'
  }

  const styles = StyleSheet.create({
    buttonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 56,
      borderRadius: 16,
      backgroundColor: getBackgroundColor(),
      borderWidth: variant !== 'primary' ? 1 : 0,
      borderColor: getBorderColor(),
      shadowColor: variant === 'primary' ? theme.colors.emerald : 'transparent',
      shadowOpacity: variant === 'primary' ? 0.3 : 0,
      shadowRadius: variant === 'primary' ? 20 : 0,
      shadowOffset: { width: 0, height: 12 },
      elevation: variant === 'primary' ? 6 : 0,
      opacity: disabled ? 0.6 : 1,
    },
    label: {
      color: getTextColor(),
      fontSize: 16,
      fontWeight: '700',
      marginLeft: icon ? 8 : 0,
    },
    iconContainer: {
      marginRight: 4,
    },
  })

  return (
    <Animated.View style={[animatedStyle, { width: '100%' }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={styles.buttonContainer}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text style={styles.label}>{loading ? 'Loading...' : label}</Text>
      </Pressable>
    </Animated.View>
  )
}
