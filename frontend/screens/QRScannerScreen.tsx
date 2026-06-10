import React, { useState } from 'react'
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native'
import { Camera } from 'expo-camera'

// Simple error boundary to catch Camera render errors and show a message
class ErrorBoundary extends React.Component<any, { error: any }> {
  constructor(props: any) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: any) {
    return { error }
  }
  componentDidCatch(error: any, info: any) {
    console.log('[QRScanner] render error', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: '#fff', marginBottom: 12 }}>Camera failed to start.</Text>
          <Text style={{ color: '#ddd' }}>{String(this.state.error)}</Text>
        </View>
      )
    }
    return this.props.children
  }
}
import AsyncStorage from '@react-native-async-storage/async-storage'
import { addGroupMember, getUserProfile } from '../utils/api'
import { useAppTheme } from '../utils/ThemeProvider'

export default function QRScannerScreen({ navigation }: any) {
  const { theme } = useAppTheme()
  const [scanned, setScanned] = useState(false)
  const [permission, requestPermission] = Camera.useCameraPermissions()

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return
    setScanned(true)
    console.log('[QRScanner] scanned data:', data)
    try {
      // Expect either a plain groupId or a URL that ends with /join/{id}
      let groupId = data
      try {
        const url = new URL(data)
        const parts = url.pathname.split('/')
        groupId = parts[parts.length - 1]
      } catch {
        // not a URL — assume groupId plain
      }

      const token = await AsyncStorage.getItem('token')
      if (!token) throw new Error('No token')
      const profile = await getUserProfile(token)
      const userId = profile?.user?.id
      if (!userId) throw new Error('User ID not available')

      await addGroupMember(token, { groupId: Number(groupId), userId })
      Alert.alert('Joined', `Joined group ${groupId}`)
      // small delay to allow alert to show and camera to stop
      setTimeout(() => navigation.goBack(), 700)
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not join group from QR')
      setScanned(false)
    }
  }

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>Checking camera permission...</Text>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={{ color: theme.colors.text, textAlign: 'center', marginBottom: 16 }}>Camera access is required to scan a QR code.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.cancelButton}>
          <Text style={{ color: '#fff' }}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <Camera
          style={StyleSheet.absoluteFillObject}
          onBarCodeScanned={handleBarcodeScanned}
          barCodeScannerSettings={{ barCodeTypes: [Camera.Constants.BarCodeType.qr] } as any}
        />
        <View style={styles.topBar} />
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
            <Text style={{ color: '#fff' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ErrorBoundary>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { height: 80 },
  footer: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' },
  cancelButton: { backgroundColor: '#111827', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 8 }
})
