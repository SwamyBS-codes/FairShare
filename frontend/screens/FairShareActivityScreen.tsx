import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getDashboard, getExpenses, getSettlements } from '../utils/api'
import { formatMoney } from '../utils/fairshare'
import { useAppTheme } from '../utils/ThemeProvider'

export default function FairShareActivityScreen() {
  const { theme } = useAppTheme()
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useFocusEffect(
    React.useCallback(() => {
      let active = true
      const run = async () => {
        try {
          setLoading(true)
          const token = await AsyncStorage.getItem('token')
          if (!token) throw new Error('No token found')

          if (selectedFilter === 'Expenses') {
            const res = await getExpenses(token)
            if (active) setRecentActivity((res.expenses || []).map((e:any) => ({ id: `expense-${e.id}`, type: 'expense', title: e.description || 'Expense', detail: `in ${e.group?.name || 'group'}`, date: new Date(e.createdAt).toLocaleString(), amount: Number(e.amount) })))
            return
          }

          if (selectedFilter === 'Settlements') {
            const res = await getSettlements(token)
            if (active) setRecentActivity((res.settlements || []).map((s:any) => ({ id: `settlement-${s.id}`, type: 'settlement', title: `${s.paidBy?.name} → ${s.paidTo?.name}`, detail: s.note || '', date: new Date(s.createdAt).toLocaleString(), amount: Number(s.amount) })))
            return
          }

          // Default: All (dashboard feed)
          const data = await getDashboard(token)
          if (active) setRecentActivity(data.recentActivity || [])
        } finally {
          if (active) setLoading(false)
        }
      }

      run()
      return () => {
        active = false
      }
    }, [selectedFilter])
  )

  const activityFilters = ['All', 'Expenses', 'Settlements']

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.emerald} />
      </View>
    )
  }

  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 120 },
    loadingState: { flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
    kicker: { color: theme.colors.emerald, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 6 },
    headerTitle: { color: theme.colors.text, fontSize: 25, fontWeight: '800', letterSpacing: -0.6 },
    livePill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.surface, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: theme.colors.line },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.emerald },
    liveText: { color: theme.colors.textSoft, fontSize: 12, fontWeight: '700' },
    feedCard: { backgroundColor: theme.colors.navy, borderRadius: 28, padding: 20, marginBottom: 16 },
    feedCopy: { color: 'rgba(255,255,255,0.84)', fontSize: 14, lineHeight: 21 },
    filterRow: { flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
    filterPill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line },
    filterPillActive: { backgroundColor: theme.colors.navy, borderColor: theme.colors.navy },
    filterText: { color: theme.colors.textSoft, fontSize: 12, fontWeight: '700' },
    filterTextActive: { color: theme.colors.surface },
    timelineCard: { backgroundColor: theme.colors.surface, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: theme.colors.line },
    timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14, borderTopWidth: 1, borderTopColor: theme.colors.line },
    activityIconWrap: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.navy },
    iconEmerald: { backgroundColor: theme.colors.emerald },
    iconSuccess: { backgroundColor: theme.colors.success },
    iconWarning: { backgroundColor: theme.colors.warning },
    iconNavy: { backgroundColor: theme.colors.navy },
    rowContent: { flex: 1 },
    rowTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '800' },
    rowDetail: { marginTop: 4, color: theme.colors.textSoft, fontSize: 12, lineHeight: 18 },
    rowFooter: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rowTime: { color: theme.colors.mutedSoft, fontSize: 11, fontWeight: '600' },
    rowAmount: { fontSize: 14, fontWeight: '800' },
    amountPositive: { color: theme.colors.success },
    amountNegative: { color: theme.colors.danger },
    emptyText: { color: theme.colors.textSoft, fontSize: 13, lineHeight: 19 },
  })

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.kicker}>Activity</Text>
          <Text style={styles.headerTitle}>Real-time feed</Text>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>

      <View style={styles.feedCard}>
        <Text style={styles.feedCopy}>Track every settlement, expense, and adjustment in a single elegant timeline.</Text>
      </View>

      <View style={styles.filterRow}>
        {activityFilters.map((item) => (
          <Pressable
            key={item}
            style={[styles.filterPill, selectedFilter === item && styles.filterPillActive]}
            onPress={() => setSelectedFilter(item)}
          >
            <Text style={[styles.filterText, selectedFilter === item && styles.filterTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.timelineCard}>
        {recentActivity.length === 0 ? (
          <Text style={styles.emptyText}>No activity yet. Add expenses or settlements to populate the feed.</Text>
        ) : recentActivity.map((item) => (
          <View key={item.id} style={styles.timelineRow}>
            <View style={[styles.activityIconWrap, item.type === 'settlement' ? styles.iconEmerald : styles.iconNavy]}>
              <Ionicons name={item.type === 'settlement' ? 'swap-horizontal' : 'receipt-outline'} size={18} color={theme.colors.surface} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowDetail}>{item.detail}</Text>
              <View style={styles.rowFooter}>
                <Text style={styles.rowTime}>{item.date}</Text>
                <Text style={[styles.rowAmount, item.amount > 0 ? styles.amountPositive : styles.amountNegative]}>
                  {formatMoney(item.amount)}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

