import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getDashboard } from '../utils/api'
import { formatMoney } from '../utils/fairshare'
import { useAppTheme } from '../utils/ThemeProvider'

export default function FairShareBalanceScreen({ navigation }: any) {
  const { theme } = useAppTheme()
  const [loading, setLoading] = React.useState(true)
  const [dashboard, setDashboard] = React.useState<any>({ summary: {}, balances: [] })

  const loadBalance = React.useCallback(async () => {
    const token = await AsyncStorage.getItem('token')
    if (!token) throw new Error('No token found')
    const data = await getDashboard(token)
    setDashboard(data)
  }, [])

  useFocusEffect(
    React.useCallback(() => {
      let active = true
      const run = async () => {
        try {
          setLoading(true)
          await loadBalance()
        } finally {
          if (active) setLoading(false)
        }
      }

      run()
      return () => {
        active = false
      }
    }, [loadBalance])
  )

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.emerald} />
      </View>
    )
  }

  const summary = dashboard.summary || {}
  const balances = dashboard.balances || []

  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 120 },
    loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
    backButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingRight: 8 },
    backText: { color: theme.colors.text, fontSize: 13, fontWeight: '700' },
    headerTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
    headerSpacer: { width: 56 },
    heroCard: { backgroundColor: theme.colors.navy, borderRadius: 28, padding: 20, marginBottom: 14 },
    heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.9 },
    heroValue: { marginTop: 12, color: theme.colors.surface, fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.7 },
    heroCopy: { marginTop: 10, color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 21 },
    summaryRow: { marginTop: 18, flexDirection: 'row', gap: 10 },
    summaryCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 18, padding: 14 },
    summaryTitle: { color: 'rgba(255,255,255,0.68)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7 },
    summaryValue: { marginTop: 8, fontSize: 18, fontWeight: '800' },
    summaryDanger: { color: '#FFD7D4' },
    summarySuccess: { color: '#B8F1D7' },
    sectionCard: { backgroundColor: theme.colors.surface, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: theme.colors.line, marginBottom: 14, shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    sectionTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '800' },
    sectionLink: { color: theme.colors.textSoft, fontSize: 12, fontWeight: '700' },
    balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.colors.line },
    avatar: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    incomingAvatar: { backgroundColor: theme.colors.emeraldTint },
    outgoingAvatar: { backgroundColor: theme.colors.navyTint },
    balanceTextWrap: { flex: 1 },
    balanceTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
    balanceDetail: { marginTop: 4, color: theme.colors.textSoft, fontSize: 12 },
    balanceMeta: { alignItems: 'flex-end' },
    balanceAmount: { color: theme.colors.text, fontSize: 15, fontWeight: '800' },
    balanceDue: { marginTop: 4, color: theme.colors.mutedSoft, fontSize: 11, fontWeight: '600' },
    chartCard: { height: 180, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 12 },
    chartColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
    chartBar: { width: 20, borderRadius: 999, backgroundColor: theme.colors.emerald },
    chartLabel: { marginTop: 10, color: theme.colors.textSoft, fontSize: 12, fontWeight: '700' },
    emptyText: { color: theme.colors.textSoft, fontSize: 13, lineHeight: 19 },
  })

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
          <Text style={styles.backText}>Home</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Balance summary</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Net position</Text>
        <Text style={styles.heroValue}>{summary.balance >= 0 ? `You are owed ${formatMoney(summary.balance || 0)}` : `You owe ${formatMoney(Math.abs(summary.balance || 0))}`}</Text>
        <Text style={styles.heroCopy}>See the total picture of who owes whom before you settle the next transfer.</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>You owe</Text>
            <Text style={[styles.summaryValue, styles.summaryDanger]}>{formatMoney(summary.youOwe || 0)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Owed to you</Text>
            <Text style={[styles.summaryValue, styles.summarySuccess]}>{formatMoney(summary.owedToYou || 0)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Who owes whom</Text>
          <Text style={styles.sectionLink}>Live updates</Text>
        </View>

        {balances.length === 0 ? (
          <Text style={styles.emptyText}>No outstanding balances yet.</Text>
        ) : balances.map((item) => (
          <View key={item.id} style={styles.balanceRow}>
            <View style={[styles.avatar, item.trend === 'incoming' ? styles.incomingAvatar : styles.outgoingAvatar]}>
              <Ionicons name={item.trend === 'incoming' ? 'arrow-down' : 'arrow-up'} size={16} color={item.trend === 'incoming' ? theme.colors.emerald : theme.colors.navy} />
            </View>
            <View style={styles.balanceTextWrap}>
              <Text style={styles.balanceTitle}>{item.from} to {item.to}</Text>
              <Text style={styles.balanceDetail}>{item.due}</Text>
            </View>
            <View style={styles.balanceMeta}>
              <Text style={styles.balanceAmount}>{formatMoney(item.amount)}</Text>
              <Text style={styles.balanceDue}>{item.trend === 'incoming' ? 'Pending receipt' : 'Pending payment'}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Analytics</Text>
          <Text style={styles.sectionLink}>This month</Text>
        </View>

        <View style={styles.chartCard}>
          {[58, 74, 44, 88, 62, 80].map((value, index) => (
            <View key={`${index}-${value}`} style={styles.chartColumn}>
              <View style={[styles.chartBar, { height: value }]} />
              <Text style={styles.chartLabel}>{['M', 'T', 'W', 'T', 'F', 'S'][index]}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}


