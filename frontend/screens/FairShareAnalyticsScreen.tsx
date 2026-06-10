import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native'
import { getExpenses } from '../utils/api'
import { formatMoney } from '../utils/fairshare'
import { useAppTheme } from '../utils/ThemeProvider'

export default function FairShareAnalyticsScreen({ navigation }: any) {
  const { theme } = useAppTheme()
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month')
  const [analytics, setAnalytics] = useState<any>({
    totalSpending: 0,
    averagePerExpense: 0,
    categoryBreakdown: [],
    topExpenses: [],
    monthlyTrend: [],
  })

  useFocusEffect(
    React.useCallback(() => {
      const loadAnalytics = async () => {
        try {
          setLoading(true)
          const token = await AsyncStorage.getItem('token')
          if (!token) throw new Error('No token found')

          const expensesData = await getExpenses(token)


          // Calculate analytics
          const expenses = expensesData || []
          const totalSpending = expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0)
          const avgPerExpense = expenses.length > 0 ? totalSpending / expenses.length : 0

          // Group by category (simulated)
          const categoryBreakdown = [
            { category: 'Groceries', amount: totalSpending * 0.35, percentage: 35 },
            { category: 'Dining', amount: totalSpending * 0.28, percentage: 28 },
            { category: 'Entertainment', amount: totalSpending * 0.22, percentage: 22 },
            { category: 'Transportation', amount: totalSpending * 0.15, percentage: 15 },
          ]

          // Top expenses
          const topExpenses = expenses.slice(0, 5).map((exp: any) => ({
            id: exp.id,
            description: exp.description,
            amount: exp.amount,
            date: new Date(exp.createdAt).toLocaleDateString(),
          }))

          // Monthly trend (simulated)
          const monthlyTrend = [
            { month: 'Jan', amount: totalSpending * 0.8 },
            { month: 'Feb', amount: totalSpending * 0.85 },
            { month: 'Mar', amount: totalSpending * 0.72 },
            { month: 'Apr', amount: totalSpending * 0.95 },
          ]

          setAnalytics({
            totalSpending,
            averagePerExpense: avgPerExpense,
            categoryBreakdown,
            topExpenses,
            monthlyTrend,
          })
        } finally {
          setLoading(false)
        }
      }

      loadAnalytics()
    }, [])
  )

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.emerald} />
      </View>
    )
  }

  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 120 },
    loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
    headerSection: { marginBottom: 24 },
    kicker: { color: theme.colors.primary, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 6 },
    headerTitle: { color: theme.colors.text, fontSize: 26, lineHeight: 30, fontWeight: '800', letterSpacing: -0.6 },
    periodSelector: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    periodButton: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line, alignItems: 'center' },
    periodButtonActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    periodText: { color: theme.colors.textSoft, fontSize: 13, fontWeight: '700' },
    periodTextActive: { color: theme.colors.surface },
    heroCard: { backgroundColor: theme.colors.navy, borderRadius: 24, padding: 20, marginBottom: 16, ...theme.shadows.lg },
    heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    heroValue: { color: theme.colors.surface, fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -1 },
    heroBadge: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
    heroStats: { flexDirection: 'row', gap: 12 },
    heroStatItem: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12 },
    heroStatLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    heroStatValue: { color: theme.colors.surface, fontSize: 16, fontWeight: '800' },
    card: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: theme.colors.line, ...theme.shadows.sm },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    cardTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
    cardLink: { color: theme.colors.textSoft, fontSize: 12, fontWeight: '700' },
    categoryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.colors.line },
    categoryInfo: { flex: 1, marginRight: 12 },
    categoryName: { color: theme.colors.text, fontSize: 14, fontWeight: '700', marginBottom: 8 },
    categoryBar: { height: 6, backgroundColor: theme.colors.background, borderRadius: 3, overflow: 'hidden' },
    categoryFill: { height: '100%', borderRadius: 3 },
    categoryMeta: { alignItems: 'flex-end' },
    categoryPercent: { color: theme.colors.textSoft, fontSize: 12, fontWeight: '700', marginBottom: 4 },
    categoryAmount: { color: theme.colors.text, fontSize: 13, fontWeight: '800' },
    expenseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.colors.line },
    expenseIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    expenseInfo: { flex: 1 },
    expenseTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
    expenseDate: { color: theme.colors.textSoft, fontSize: 12, marginTop: 2 },
    expenseAmount: { color: theme.colors.text, fontSize: 14, fontWeight: '800' },
    emptyText: { color: theme.colors.textSoft, fontSize: 14, fontStyle: 'italic', marginVertical: 8 },
    trendChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, height: 140, marginTop: 12 },
    trendBar: { flex: 1, alignItems: 'center', gap: 8 },
    trendBarFill: { width: '100%', backgroundColor: theme.colors.primary, borderRadius: 6 },
    trendLabel: { color: theme.colors.textSoft, fontSize: 11, fontWeight: '700' },
  })

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerSection}>
        <Text style={styles.kicker}>Analytics</Text>
        <Text style={styles.headerTitle}>Spending insights</Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['week', 'month', 'year'] as const).map((period) => (
          <Pressable
            key={period}
            style={[styles.periodButton, selectedPeriod === period && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[styles.periodText, selectedPeriod === period && styles.periodTextActive]}>
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Total Spending Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.heroLabel}>Total spending</Text>
            <Text style={styles.heroValue}>{formatMoney(analytics.totalSpending)}</Text>
          </View>
          <View style={styles.heroBadge}>
            <Ionicons name="trending-down-outline" size={18} color={theme.colors.emerald} />
          </View>
        </View>
        <View style={styles.heroStats}>
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatLabel}>Avg per expense</Text>
            <Text style={styles.heroStatValue}>{formatMoney(analytics.averagePerExpense)}</Text>
          </View>
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatLabel}>Transactions</Text>
            <Text style={styles.heroStatValue}>{analytics.topExpenses.length}+</Text>
          </View>
        </View>
      </View>

      {/* Category Breakdown */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Spending by category</Text>
          <Ionicons name="pie-chart-outline" size={18} color={theme.colors.textSoft} />
        </View>
        {analytics.categoryBreakdown.map((cat: any, idx: number) => (
          <View key={idx} style={styles.categoryRow}>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{cat.category}</Text>
              <View style={styles.categoryBar}>
                <View
                  style={[
                    styles.categoryFill,
                    {
                      width: `${cat.percentage}%`,
                      backgroundColor: [
                        theme.colors.primary,
                        theme.colors.interactive,
                        theme.colors.warning,
                        theme.colors.danger,
                      ][idx % 4],
                    },
                  ]}
                />
              </View>
            </View>
            <View style={styles.categoryMeta}>
              <Text style={styles.categoryPercent}>{cat.percentage}%</Text>
              <Text style={styles.categoryAmount}>{formatMoney(cat.amount)}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Top Expenses */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Top expenses</Text>
          <Text style={styles.cardLink}>{analytics.topExpenses.length}</Text>
        </View>
        {analytics.topExpenses.length === 0 ? (
          <Text style={styles.emptyText}>No expenses yet</Text>
        ) : (
          analytics.topExpenses.map((exp: any) => (
            <View key={exp.id} style={styles.expenseRow}>
              <View style={styles.expenseIcon}>
                <Ionicons name="receipt-outline" size={16} color={theme.colors.surface} />
              </View>
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseTitle}>{exp.description}</Text>
                <Text style={styles.expenseDate}>{exp.date}</Text>
              </View>
              <Text style={styles.expenseAmount}>{formatMoney(exp.amount)}</Text>
            </View>
          ))
        )}
      </View>

      {/* Monthly Trend */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Monthly trend</Text>
          <Ionicons name="line-chart-outline" size={18} color={theme.colors.textSoft} />
        </View>
        <View style={styles.trendChart}>
          {analytics.monthlyTrend.map((item: any, idx: number) => {
            const maxAmount = Math.max(...analytics.monthlyTrend.map((m: any) => m.amount))
            const height = (item.amount / maxAmount) * 100
            return (
              <View key={idx} style={styles.trendBar}>
                <View
                  style={[
                    styles.trendBarFill,
                    {
                      height: `${Math.max(height, 20)}%`,
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                />
                <Text style={styles.trendLabel}>{item.month}</Text>
              </View>
            )
          })}
        </View>
      </View>
    </ScrollView>
  )
}


