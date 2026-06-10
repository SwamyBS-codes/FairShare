import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAppTheme } from '../utils/ThemeProvider'

export default function FairShareSplashScreen({ navigation }: any) {
  const { theme } = useAppTheme()
  const fadeAnim = React.useRef(new Animated.Value(0)).current
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current
  const [devToken, setDevToken] = useState<string | null>(null)

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()

    const checkAuth = async () => {
      setTimeout(async () => {
        const token = await AsyncStorage.getItem('token')
        console.log('Splash token:', token)
        setDevToken(token)
        // Basic validation: accept only a JWT-like token (three parts) to avoid
        // accidental redirects from stray or placeholder values in storage.
        const looksLikeJwt = typeof token === 'string' && token.split('.').length === 3
        if (looksLikeJwt) {
          navigation.replace('Main')
        } else {
          navigation.replace('Auth')
        }
      }, 2000)
    }

    checkAuth()
  }, [fadeAnim, scaleAnim, navigation])

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' },
    logoWrapper: { alignItems: 'center' },
    logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 24, ...theme.shadows.lg },
    logoText: { fontSize: 40, fontWeight: '800', color: '#FFFFFF' },
    appName: { fontSize: 32, fontWeight: '800', color: theme.colors.text, marginBottom: 8, letterSpacing: -0.5 },
    tagline: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: '500' },
    bottomSection: { position: 'absolute', bottom: 80, flexDirection: 'row', alignItems: 'center' },
    loadingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary, opacity: 0.4 },
    devRow: { position: 'absolute', bottom: 22, flexDirection: 'row', gap: 12 },
    devButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#111827' },
    devButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    devTokenText: { position: 'absolute', bottom: 120, maxWidth: 280, textAlign: 'center', color: theme.colors.textSecondary, fontSize: 12 },
  })

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>₹</Text>
        </View>
        <Text style={styles.appName}>FairShare</Text>
        <Text style={styles.tagline}>Split expenses, stay fair</Text>
      </Animated.View>

      <View style={styles.bottomSection}>
        <View style={styles.loadingDot} />
        <View style={[styles.loadingDot, { marginLeft: 8 }]} />
        <View style={[styles.loadingDot, { marginLeft: 8 }]} />
      </View>
      {__DEV__ && (
        <>
          {devToken ? <Text style={styles.devTokenText}>Token: {devToken}</Text> : null}
          <View style={styles.devRow}>
            <Pressable
              style={styles.devButton}
              onPress={async () => {
                const t = await AsyncStorage.getItem('token')
                setDevToken(t)
                console.log('Dev show token:', t)
              }}
            >
              <Text style={styles.devButtonText}>Dev: Show token</Text>
            </Pressable>

            <Pressable
              style={styles.devButton}
              onPress={async () => {
                await AsyncStorage.removeItem('token')
                setDevToken(null)
                console.log('Dev cleared token')
                navigation.replace('Auth')
              }}
            >
              <Text style={styles.devButtonText}>Dev: Clear token</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  )
}


