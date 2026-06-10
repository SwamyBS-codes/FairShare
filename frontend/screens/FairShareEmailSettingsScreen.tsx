import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useAppTheme } from '../utils/ThemeProvider'

export default function EmailSettingsScreen() {
  const { theme } = useAppTheme()

  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: 20, paddingTop: 80 },
    title: { fontSize: 22, fontWeight: '800', color: theme.colors.text, marginBottom: 16 },
    imgPlaceholder: { height: 360, borderRadius: 12, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.line },
    imgText: { color: theme.colors.textSoft, fontSize: 18 },
    note: { marginTop: 12, color: theme.colors.textSoft },
  })
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Email settings</Text>
      <View style={styles.imgPlaceholder}>
        <Text style={styles.imgText}>img 1</Text>
      </View>
      <Text style={styles.note}>This page is a placeholder for the email settings image (img 1).</Text>
    </ScrollView>
  )
}

