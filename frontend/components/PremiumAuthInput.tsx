import React, { useState } from 'react'
import { 
  TextInput, 
  View, 
  StyleSheet, 
  Text, 
  Pressable,
  TextInputProps,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useAppTheme } from '../utils/ThemeProvider'

interface PremiumAuthInputProps extends TextInputProps {
  label?: string
  icon?: keyof typeof Ionicons.glyphMap
  error?: string
  isPassword?: boolean
  hint?: string
}

export default function PremiumAuthInput({
  label,
  icon,
  error,
  isPassword = false,
  hint,
  value,
  onChangeText,
  ...props
}: PremiumAuthInputProps) {
  const { theme } = useAppTheme()
  const [showPassword, setShowPassword] = useState(!isPassword)
  
  const focusAnim = useSharedValue(0)
  const scaleAnim = useSharedValue(1)

  const handleFocus = () => {
    focusAnim.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    })
    scaleAnim.value = withTiming(1.02, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    })
  }

  const handleBlur = () => {
    focusAnim.value = withTiming(0, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    })
    scaleAnim.value = withTiming(1, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    })
  }

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }))

  const animatedBorderStyle = useAnimatedStyle(() => {
    return {
      borderColor: focusAnim.value === 1 
        ? theme.colors.emerald 
        : error ? '#EF4444' : theme.colors.line,
    }
  })

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    labelContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSoft,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    hint: {
      fontSize: 11,
      color: theme.colors.textSoft,
      fontWeight: '500',
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      borderWidth: 1.5,
      borderRadius: 12,
      borderColor: theme.colors.line,
      backgroundColor: theme.colors.background,
      height: 52,
    },
    icon: {
      marginRight: 10,
      color: theme.colors.textSoft,
    },
    input: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: '500',
      paddingVertical: 0,
    },
    // (web removed) inputWeb styles removed for mobile-only
    passwordToggle: {
      padding: 8,
      marginLeft: 8,
    },
    passwordIcon: {
      color: theme.colors.textSoft,
    },
    errorText: {
      marginTop: 6,
      fontSize: 12,
      color: '#EF4444',
      fontWeight: '500',
    },
  }) as any

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {hint && <Text style={styles.hint}>{hint}</Text>}
        </View>
      )}

      <Animated.View
        style={[
          animatedContainerStyle,
          styles.inputWrapper,
          animatedBorderStyle,
          error && { borderColor: '#EF4444' },
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            style={styles.icon}
          />
        )}

        <TextInput
          style={styles.input}
          placeholderTextColor={theme.colors.textSoft}
          secureTextEntry={isPassword && !showPassword}
          onFocus={handleFocus}
          onBlur={handleBlur}
          value={value}
          onChangeText={onChangeText}
          {...props}
        />

        {isPassword && (
          <Pressable
            style={styles.passwordToggle}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              style={styles.passwordIcon}
            />
          </Pressable>
        )}
      </Animated.View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
}
