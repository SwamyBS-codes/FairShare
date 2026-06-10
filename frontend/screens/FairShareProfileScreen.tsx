import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View, Linking, Image } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native'
import { getDashboard, getExpenses, getUserProfile, updateUserProfile } from '../utils/api'
import { formatMoney } from '../utils/fairshare'
import { getRootNavigation } from '../utils/navigation'
import { useAppTheme } from '../utils/ThemeProvider'

export default function FairShareProfileScreen({ navigation }: any) {
  const rootNavigation = getRootNavigation(navigation)
  const { theme, mode, toggle } = useAppTheme()
  const [pushEnabled, setPushEnabled] = useState(true)
  const [biometricEnabled, setBiometricEnabled] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [profilePhotoUri, setProfilePhotoUri] = useState('')
  const [summary, setSummary] = useState<any>({ totalGroups: 0, monthlySpend: 0 })

  useFocusEffect(
    React.useCallback(() => {
      let active = true
      const run = async () => {
        try {
          setLoading(true)
          const token = await AsyncStorage.getItem('token')
          if (!token) throw new Error('No token found')
          const [profileData, dashboard, expenses] = await Promise.all([getUserProfile(token), getDashboard(token), getExpenses(token)])
          if (!active) return

          const now = new Date()
          const currentMonthSpend = (expenses || []).reduce((sum: number, expense: any) => {
            const createdAt = expense?.createdAt ? new Date(expense.createdAt) : null
            if (!createdAt) return sum
            const sameMonth = createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()
            return sameMonth ? sum + Number(expense.amount || 0) : sum
          }, 0)

          setProfile(profileData.user)
          setSummary({
            totalGroups: dashboard?.groups?.length || dashboard?.summary?.totalGroups || 0,
            monthlySpend: currentMonthSpend,
          })
          // load persisted toggles
          const push = await AsyncStorage.getItem('pushEnabled')
          const bio = await AsyncStorage.getItem('biometricEnabled')
          const photo = await AsyncStorage.getItem('profilePhotoUri')
          if (push !== null) setPushEnabled(push === 'true')
          if (bio !== null) setBiometricEnabled(bio === 'true')
          if (photo) setProfilePhotoUri(photo)
          // fallback to persisted registration info if API doesn't return name/email
          const storedName = await AsyncStorage.getItem('userName')
          const storedEmail = await AsyncStorage.getItem('userEmail')
          if (!profileData.user?.name || !profileData.user?.email) {
            setProfile((p) => ({ ...(p || {}), name: storedName || p?.name, email: storedEmail || p?.email }))
          }
        } finally {
          if (active) setLoading(false)
        }
      }

      run()
      return () => {
        active = false
      }
    }, [])
  )

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token')
    rootNavigation.reset({ index: 0, routes: [{ name: 'Auth' }] })
  }

  const persistToggle = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, value ? 'true' : 'false')
    } catch {
      // ignore
    }
  }

  const handleSaveProfile = async () => {
    if (!newName.trim()) return Alert.alert('Error', 'Name cannot be empty')
    if (!newEmail.trim()) return Alert.alert('Error', 'Email cannot be empty')
    try {
      setSavingProfile(true)
      const token = await AsyncStorage.getItem('token')
      if (!token) throw new Error('No token')
      const res = await updateUserProfile(token, { name: newName.trim(), email: newEmail.trim() })
      setProfile(res.user)
      setEditingName(false)
      setNewName('')
      setNewEmail('')
      Alert.alert('Saved', 'Profile updated')
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePickPhoto = async () => {
    const result = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!result.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access to choose a profile picture.')
      return
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    })

    if (pickerResult.canceled || !pickerResult.assets?.length) return

    const uri = pickerResult.assets[0].uri
    setProfilePhotoUri(uri)
    await AsyncStorage.setItem('profilePhotoUri', uri)
  }

  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 120 },
    loadingState: { flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' },
    kicker: { color: theme.colors.emerald, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 6 },
    headerTitle: { color: theme.colors.text, fontSize: 25, fontWeight: '800', letterSpacing: -0.6, marginBottom: 18 },
    profileCard: { backgroundColor: theme.colors.navy, borderRadius: 28, padding: 22, alignItems: 'center', marginBottom: 14 },
    avatarCircle: { width: 72, height: 72, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
    avatarText: { color: theme.colors.surface, fontSize: 24, fontWeight: '800' },
    name: { color: theme.colors.surface, fontSize: 22, fontWeight: '800' },
    email: { marginTop: 4, color: 'rgba(255,255,255,0.76)', fontSize: 13 },
    planPill: { marginTop: 14, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' },
    planPillText: { color: theme.colors.surface, fontSize: 12, fontWeight: '700' },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    statCard: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: theme.colors.line },
    statValue: { color: theme.colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
    statLabel: { marginTop: 6, color: theme.colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7 },
    sectionCard: { backgroundColor: theme.colors.surface, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: theme.colors.line, marginBottom: 14 },
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 14 },
    settingIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' },
    settingTextWrap: { flex: 1 },
    settingLabel: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
    settingValue: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 12 },
    sectionTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '800', marginBottom: 10 },
    actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.line },
    actionIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    actionLabel: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
    actionSub: { marginTop: 2, color: theme.colors.textSecondary, fontSize: 12 },
    logoutButton: { marginTop: 6, backgroundColor: theme.colors.emeraldTint, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
    logoutText: { color: theme.colors.emeraldDark, fontSize: 14, fontWeight: '800' },
    createModalContainer: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    createModalContent: { backgroundColor: theme.colors.surface, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 24, width: '100%' },
    createModalTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text, marginBottom: 20, textAlign: 'center' },
    createModalInput: { borderWidth: 1, borderColor: theme.colors.line, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, marginBottom: 20, color: theme.colors.text, backgroundColor: theme.colors.background },
    createModalButton: { backgroundColor: theme.colors.navy, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
    createModalButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    createModalCancelButton: { paddingVertical: 12, alignItems: 'center' },
    createModalCancelText: { color: theme.colors.navy, fontSize: 15, fontWeight: '600' },
    buttonDisabled: { opacity: 0.6 },
  })

  if (loading) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator size="large" color={theme.colors.emerald} />
      </View>
    )
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>Profile</Text>
      <Text style={styles.headerTitle}>Settings and account</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          {profilePhotoUri ? (
            <Image source={{ uri: profilePhotoUri }} style={{ width: '100%', height: '100%', borderRadius: 24 }} />
          ) : (
            <Text style={styles.avatarText}>{(profile?.name || 'U').slice(0, 2).toUpperCase()}</Text>
          )}
        </View>
        <Pressable onPress={() => {
          setNewName(profile?.name || '')
          setNewEmail(profile?.email || '')
          setEditingName(true)
        }}>
          <Text style={styles.name}>{profile?.name || 'User'}</Text>
        </Pressable>
        <Text style={styles.email}>{profile?.email || 'No email available'}</Text>
        <Pressable onPress={handlePickPhoto} style={{ marginTop: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' }}>
          <Text style={{ color: theme.colors.surface, fontSize: 12, fontWeight: '700' }}>{profilePhotoUri ? 'Change profile photo' : 'Add profile photo'}</Text>
        </Pressable>
        {/* removed plan pill as requested */}
      </View>

      {/* Edit name modal */}
      <Modal visible={editingName} transparent animationType="slide" onRequestClose={() => setEditingName(false)}>
        <View style={styles.createModalContainer}>
          <View style={styles.createModalContent}>
            <Text style={styles.createModalTitle}>Edit profile</Text>
            <TextInput style={styles.createModalInput} value={newName} onChangeText={setNewName} placeholder="Your name" placeholderTextColor={theme.colors.mutedSoft} />
            <TextInput
              style={styles.createModalInput}
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={theme.colors.mutedSoft}
            />
            <Pressable style={[styles.createModalButton, savingProfile && styles.buttonDisabled]} onPress={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? <ActivityIndicator color="#fff" /> : <Text style={styles.createModalButtonText}>Save</Text>}
            </Pressable>
            <Pressable style={styles.createModalCancelButton} onPress={() => setEditingName(false)} disabled={savingProfile}>
              <Text style={styles.createModalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{summary.totalGroups || 0}</Text>
          <Text style={styles.statLabel}>Groups</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatMoney(summary.monthlySpend || 0)}</Text>
          <Text style={styles.statLabel}>Monthly spend</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Live'}</Text>
          <Text style={styles.statLabel}>Settled</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.toggleRow}>
          <View style={styles.settingIcon}>
            <Ionicons name="notifications-outline" size={18} color={theme.colors.navy} />
          </View>
          <View style={styles.settingTextWrap}>
            <Text style={styles.settingLabel}>Push notifications</Text>
            <Text style={styles.settingValue}>Expense and settlement alerts</Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={(v) => { setPushEnabled(v); persistToggle('pushEnabled', v) }}
            trackColor={{ false: theme.colors.line, true: theme.colors.emeraldTint }}
            thumbColor={pushEnabled ? theme.colors.emerald : '#FFFFFF'}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.settingIcon}>
            <Ionicons name="finger-print-outline" size={18} color={theme.colors.navy} />
          </View>
          <View style={styles.settingTextWrap}>
            <Text style={styles.settingLabel}>Biometric unlock</Text>
            <Text style={styles.settingValue}>Quick secure access</Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={(v) => { setBiometricEnabled(v); persistToggle('biometricEnabled', v) }}
            trackColor={{ false: theme.colors.line, true: theme.colors.emeraldTint }}
            thumbColor={biometricEnabled ? theme.colors.emerald : '#FFFFFF'}
          />
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.toggleRow}>
          <View style={styles.settingIcon}><Ionicons name="color-palette-outline" size={18} color={theme.colors.navy} /></View>
          <View style={styles.settingTextWrap}>
            <Text style={styles.settingLabel}>Dark mode</Text>
            <Text style={styles.settingValue}>Toggle dark / light appearance</Text>
          </View>
          <Switch
            value={mode === 'dark'}
            onValueChange={() => toggle()}
            trackColor={{ false: theme.colors.line, true: theme.colors.emeraldTint }}
            thumbColor={mode === 'dark' ? theme.colors.emerald : '#FFFFFF'}
          />
        </View>
      </View>

      <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Quick actions</Text>
            <Pressable style={styles.actionRow} onPress={() => navigation.navigate('EmailSettings')}>
              <View style={styles.actionIcon}><Ionicons name="mail-outline" size={18} color={theme.colors.navy} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionLabel}>Email settings</Text>
                <Text style={styles.actionSub}>Manage email & notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
            </Pressable>

            <Pressable style={styles.actionRow} onPress={() => { Linking.openURL('https://example.com/rate') }}>
              <View style={styles.actionIcon}><Ionicons name="star-outline" size={18} color={theme.colors.navy} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionLabel}>Rate FairShare</Text>
                <Text style={styles.actionSub}>Leave feedback or rate the app</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
            </Pressable>

            <Pressable style={styles.actionRow} onPress={() => { Linking.openURL('mailto:support@fairshare.app') }}>
              <View style={styles.actionIcon}><Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.colors.navy} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionLabel}>Contact FairShare</Text>
                <Text style={styles.actionSub}>Send a message to support</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
            </Pressable>

            <Pressable style={styles.logoutButton} onPress={() => Alert.alert('Sign out', 'Log out of FairShare?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Log out', style: 'destructive', onPress: handleLogout }])}>
              <Text style={styles.logoutText}>Log out</Text>
            </Pressable>
      </View>
    </ScrollView>
  )
}


