import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getSettlements } from '../utils/api'
import { formatMoney } from '../utils/fairshare'
import { useAppTheme } from '../utils/ThemeProvider'

export default function FairShareSettlementsScreen({ navigation }: any) {
  const { theme } = useAppTheme()
  const [loading, setLoading] = React.useState(true)
  const [settlements, setSettlements] = React.useState<any[]>([])

  useFocusEffect(
    React.useCallback(() => {
      let active = true
      const run = async () => {
        try {
          setLoading(true)
          const token = await AsyncStorage.getItem('token')
          if (!token) throw new Error('No token found')
          const result = await getSettlements(token)
          if (active) setSettlements(result.settlements || [])
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

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.emerald} />
      </View>
    )
  }

  const pending = settlements.filter((item) => !item.settled)
  const completed = settlements.filter((item) => item.settled)

  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 120 },
    loadingState: { flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
    kicker: { color: theme.colors.emerald, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 6 },
    headerTitle: { color: theme.colors.text, fontSize: 25, fontWeight: '800', letterSpacing: -0.6 },
    iconButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.line },
    summaryCard: { backgroundColor: theme.colors.navy, borderRadius: 28, padding: 20, marginBottom: 14 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
    summaryValue: { marginTop: 8, color: theme.colors.surface, fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
    summaryPill: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999 },
    summaryPillText: { color: theme.colors.surface, fontSize: 12, fontWeight: '700' },
    summaryCopy: { marginTop: 12, color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 21 },
    sectionCard: { backgroundColor: theme.colors.surface, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: theme.colors.line, marginBottom: 14 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    sectionTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '800' },
    sectionLink: { color: theme.colors.textSoft, fontSize: 12, fontWeight: '700' },
    settlementRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.colors.line },
    rowIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: theme.colors.emerald, alignItems: 'center', justifyContent: 'center' },
    rowTextWrap: { flex: 1 },
    rowTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
    rowDetail: { marginTop: 4, color: theme.colors.textSoft, fontSize: 12 },
    rowMeta: { alignItems: 'flex-end' },
    rowAmount: { color: theme.colors.text, fontSize: 15, fontWeight: '800' },
    rowStatus: { marginTop: 4, color: theme.colors.mutedSoft, fontSize: 11, fontWeight: '600' },
    historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.colors.line },
    historyBullet: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.emerald },
    historyTextWrap: { flex: 1 },
    historyTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
    historyDetail: { marginTop: 4, color: theme.colors.textSoft, fontSize: 12 },
    historyAmount: { color: theme.colors.success, fontSize: 14, fontWeight: '800' },
    emptyText: { color: theme.colors.textSoft, fontSize: 13, lineHeight: 19 },
  })

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.kicker}>Settlements</Text>
          <Text style={styles.headerTitle}>Who owes whom</Text>
        </View>
        <Pressable style={styles.iconButton} onPress={() => navigation.navigate('AddExpense')}>
          <Ionicons name="cash-outline" size={18} color={theme.colors.navy} />
        </Pressable>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>Open transfers</Text>
            <Text style={styles.summaryValue}>{pending.length}</Text>
          </View>
          <View style={styles.summaryPill}>
            <Text style={styles.summaryPillText}>Auto updated</Text>
          </View>
        </View>
        <Text style={styles.summaryCopy}>Settle the pending transfers with one tap and keep the ledger clean.</Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pending</Text>
          <Text style={styles.sectionLink}>{pending.length} items</Text>
        </View>

        {pending.length === 0 ? <Text style={styles.emptyText}>No pending settlements.</Text> : pending.map((item) => (
          <View key={item.id} style={styles.settlementRow}>
            <View style={styles.rowIcon}>
              <Ionicons name="swap-horizontal" size={18} color={theme.colors.surface} />
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>{item.from} → {item.to}</Text>
              <Text style={styles.rowDetail}>{item.group || 'Direct settlement'} · {item.date}</Text>
            </View>
            <View style={styles.rowMeta}>
              <Text style={styles.rowAmount}>{formatMoney(item.amount)}</Text>
              <Text style={styles.rowStatus}>{item.settled ? 'Completed' : 'Pending'}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Completed</Text>
          <Text style={styles.sectionLink}>{completed.length} items</Text>
        </View>

        {completed.length === 0 ? <Text style={styles.emptyText}>No completed settlements yet.</Text> : completed.map((item) => (
          <View key={item.id} style={styles.historyRow}>
            <View style={styles.historyBullet} />
            <View style={styles.historyTextWrap}>
              <Text style={styles.historyTitle}>{item.from} settled with {item.to}</Text>
              <Text style={styles.historyDetail}>{item.group || 'Direct settlement'} · {item.date}</Text>
            </View>
            <Text style={styles.historyAmount}>{formatMoney(item.amount)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}


