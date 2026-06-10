import React, { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons } from '@expo/vector-icons'
import { login, register } from '../utils/api'
import { useAppTheme } from '../utils/ThemeProvider'

export default function FairShareAuthScreen({ navigation }: any) {
  const { theme } = useAppTheme()
  const [isSignup, setIsSignup] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim() || (isSignup && !name.trim())) {
      Alert.alert('Missing info', 'Please complete all fields.')
      return
    }

    try {
      setLoading(true)
      const response = isSignup
        ? await register({ name: name.trim(), email: email.trim(), password })
        : await login({ email: email.trim(), password })

      await AsyncStorage.setItem('token', response.token)
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] })
    } catch (error: any) {
      Alert.alert('Authentication failed', error.message || 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: theme.colors.background },
    container: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 28 },
    backdropTop: { position: 'absolute', top: -70, right: -20, width: 200, height: 200, borderRadius: 100, backgroundColor: theme.colors.navyTint },
    backdropBottom: { position: 'absolute', bottom: 40, left: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: theme.colors.emeraldTint },
    hero: { marginTop: 24, marginBottom: 22 },
    heroBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line },
    heroBadgeText: { color: theme.colors.textSoft, fontSize: 12, fontWeight: '600' },
    title: { marginTop: 16, color: theme.colors.text, fontSize: 38, lineHeight: 42, fontWeight: '800', letterSpacing: -1 },
    subtitle: { marginTop: 12, color: theme.colors.textSoft, fontSize: 15, lineHeight: 22, maxWidth: 340 },
    formCard: { backgroundColor: theme.colors.surface, borderRadius: 28, padding: 18, borderWidth: 1, borderColor: theme.colors.line, shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 6 },
    toggleRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
    togglePill: { flex: 1, paddingVertical: 12, borderRadius: 999, backgroundColor: (theme as any).colors.surfaceSoft || theme.colors.surface, alignItems: 'center' },
    togglePillActive: { backgroundColor: theme.colors.navy },
    toggleText: { color: theme.colors.textSoft, fontSize: 14, fontWeight: '700' },
    toggleTextActive: { color: theme.colors.surface },
    sectionLabel: { color: theme.colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
    sectionCopy: { marginTop: 6, color: theme.colors.textSoft, fontSize: 14, lineHeight: 20, marginBottom: 18 },
    fieldWrap: { marginBottom: 14 },
    fieldLabel: { marginBottom: 8, color: theme.colors.textSoft, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
    input: { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.md, paddingHorizontal: 16, paddingVertical: 14, color: theme.colors.text, fontSize: 15 },
    submitButton: { marginTop: 8, height: 54, borderRadius: 16, backgroundColor: theme.colors.emerald, alignItems: 'center', justifyContent: 'center', shadowColor: theme.colors.emerald, shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 4 },
    submitButtonPressed: { transform: [{ scale: 0.99 }] },
    submitText: { color: theme.colors.surface, fontSize: 16, fontWeight: '800' },
    footerRow: { marginTop: 16, flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    footerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: (theme as any).colors.surfaceSoft || theme.colors.surface },
    footerBadgeText: { color: theme.colors.textSoft, fontSize: 12, fontWeight: '700' },
  })

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.backdropTop} />
        <View style={styles.backdropBottom} />

        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Ionicons name="flash" size={18} color={theme.colors.emerald} />
            <Text style={styles.heroBadgeText}>Real-time split clarity</Text>
          </View>
          <Text style={styles.title}>FairShare</Text>
          <Text style={styles.subtitle}>
            Premium mobile expense sharing designed for groups that want less friction and cleaner finances.
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.toggleRow}>
            <Pressable style={[styles.togglePill, !isSignup && styles.togglePillActive]} onPress={() => setIsSignup(false)}>
              <Text style={[styles.toggleText, !isSignup && styles.toggleTextActive]}>Login</Text>
            </Pressable>
            <Pressable style={[styles.togglePill, isSignup && styles.togglePillActive]} onPress={() => setIsSignup(true)}>
              <Text style={[styles.toggleText, isSignup && styles.toggleTextActive]}>Sign up</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Welcome back</Text>
          <Text style={styles.sectionCopy}>{isSignup ? 'Create your account to start sharing expenses.' : 'Sign in to continue your shared balances.'}</Text>

          {isSignup && (
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput style={styles.input} placeholder="Alex Morgan" placeholderTextColor={theme.colors.mutedSoft} value={name} onChangeText={setName} editable={!loading} />
            </View>
          )}

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor={theme.colors.mutedSoft} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} editable={!loading} />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={theme.colors.mutedSoft} secureTextEntry value={password} onChangeText={setPassword} editable={!loading} />
          </View>

          <Pressable style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color={theme.colors.surface} /> : <Text style={styles.submitText}>{isSignup ? 'Create account' : 'Continue'}</Text>}
          </Pressable>

          <View style={styles.footerRow}>
            <View style={styles.footerBadge}>
              <Ionicons name="shield-checkmark-outline" size={15} color={theme.colors.emerald} />
              <Text style={styles.footerBadgeText}>Secure sync</Text>
            </View>
            <View style={styles.footerBadge}>
              <Ionicons name="people-outline" size={15} color={theme.colors.navy} />
              <Text style={styles.footerBadgeText}>Shared groups</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

 
