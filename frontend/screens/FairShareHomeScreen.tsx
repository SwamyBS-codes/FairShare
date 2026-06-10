import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, TextInput, Image } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { getDashboard, getUserProfile } from '../utils/api'
import { formatMoney } from '../utils/fairshare'
import { useAppTheme } from '../utils/ThemeProvider'
import { getRootNavigation } from '../utils/navigation'
import AsyncStorage from '@react-native-async-storage/async-storage'

const emptySummary = {
  totalGroups: 0,
  totalExpenses: 0,
  youOwe: 0,
  owedToYou: 0,
  balance: 0,
}

// AvatarStack will be created inside the component so it can access theme

export default function FairShareHomeScreen({ navigation }: any) {
  const { theme } = useAppTheme()
  const rootNavigation = getRootNavigation(navigation)
  const [loading, setLoading] = React.useState(true)
  const [dashboard, setDashboard] = React.useState<any>({
    summary: emptySummary,
    groups: [],
    recentActivity: [],
  })
  const [user, setUser] = React.useState<any>(null)
  const [searchVisible, setSearchVisible] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const searchInputRef = React.useRef<any>(null)

  const loadDashboard = React.useCallback(async () => {
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem('token')
      if (!token) throw new Error('No token found')
      const [data, profile] = await Promise.all([getDashboard(token), getUserProfile(token)])
      setDashboard(data)
      setUser(profile?.user || null)
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    React.useCallback(() => {
      loadDashboard()
    }, [loadDashboard])
  )

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.emerald} />
      </View>
    )
  }

  function AvatarStack({ members, accent }: { members: ({ id: number | string; name: string } | string)[]; accent: string }) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}>
        {members.slice(0, 3).map((member, index) => {
          const name = typeof member === 'string' ? member : member.name
          return (
            <View
              key={`${name}-${index}`}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: theme.colors.background,
                marginLeft: index === 0 ? 0 : -10,
                backgroundColor: index === 0 ? accent : theme.colors.surface,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '800', color: index === 0 ? theme.colors.surface : theme.colors.text }}>{name.slice(0, 2).toUpperCase()}</Text>
            </View>
          )
        })}
      </View>
    )
  }

  const summary = dashboard.summary || emptySummary
  const groups = dashboard.groups || []
  const recentActivity = dashboard.recentActivity || []

  const displayedGroups = searchVisible && searchQuery.trim() ? groups.filter((g: any) => (g.name || '').toLowerCase().includes(searchQuery.trim().toLowerCase())) : groups.slice(0, 3)

  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 120 },
    loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    kicker: { color: theme.colors.emerald, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 6 },
    headerTitle: { color: theme.colors.text, fontSize: 26, lineHeight: 30, fontWeight: '800', letterSpacing: -0.6, maxWidth: 240 },
    syncPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.surface, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: theme.colors.line },
    syncDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.emerald },
    syncText: { color: theme.colors.textSoft, fontSize: 12, fontWeight: '700' },
    heroCard: { backgroundColor: theme.colors.navy, borderRadius: 28, padding: 20, marginBottom: 16, shadowColor: '#0F172A', shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: 14 }, elevation: 10 },
    heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    balanceLabel: { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    balanceValue: { color: theme.colors.surface, fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -1 },
    balanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999 },
    balanceBadgeText: { color: theme.colors.surface, fontSize: 12, fontWeight: '700' },
    heroCopy: { marginTop: 14, color: 'rgba(255,255,255,0.82)', fontSize: 14, lineHeight: 21 },
    quickStats: { marginTop: 18, flexDirection: 'row', gap: 10 },
    quickStatCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 18, padding: 14 },
    quickStatLabel: { color: 'rgba(255,255,255,0.66)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
    quickStatValue: { marginTop: 8, color: theme.colors.surface, fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
    quickStatDanger: { color: '#FFD7D4' },
    quickStatSuccess: { color: '#B8F1D7' },
    actionRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    primaryAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.emerald, borderRadius: 18, paddingVertical: 14 },
    primaryActionText: { color: theme.colors.surface, fontSize: 14, fontWeight: '800' },
    secondaryAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.surface, borderRadius: 18, paddingVertical: 14, borderWidth: 1, borderColor: theme.colors.line },
    secondaryActionText: { color: theme.colors.navy, fontSize: 14, fontWeight: '800' },
    sectionCard: { backgroundColor: theme.colors.surface, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: theme.colors.line, marginBottom: 14, shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    sectionTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
    sectionLink: { color: theme.colors.textSoft, fontSize: 12, fontWeight: '700' },
    activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.colors.line },
    activityIconWrap: { width: 38, height: 38, borderRadius: 14, backgroundColor: theme.colors.navy, alignItems: 'center', justifyContent: 'center' },
    activityTextWrap: { flex: 1 },
    activityTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
    activityDetail: { marginTop: 4, color: theme.colors.textSoft, fontSize: 12, lineHeight: 18 },
    activityMeta: { alignItems: 'flex-end' },
    activityAmount: { fontSize: 14, fontWeight: '800' },
    activityPositive: { color: theme.colors.success },
    activityNegative: { color: theme.colors.danger },
    activityTime: { marginTop: 4, color: theme.colors.mutedSoft, fontSize: 11, fontWeight: '600' },
    groupCard: { backgroundColor: theme.colors.background, borderRadius: 20, padding: 16, marginBottom: 10 },
    groupTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    groupTitleWrap: { flex: 1, paddingRight: 12 },
    groupName: { color: theme.colors.text, fontSize: 15, fontWeight: '800' },
    groupSummary: { marginTop: 4, color: theme.colors.textSoft, fontSize: 12, fontWeight: '600' },
    groupAmount: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
    groupPositive: { color: theme.colors.success },
    groupNegative: { color: theme.colors.danger },
    groupBottomRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    avatarStack: { flexDirection: 'row', alignItems: 'center', paddingLeft: 10 },
    avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.background },
    avatarText: { fontSize: 10, fontWeight: '800' },
    groupMeta: { flex: 1, color: theme.colors.textSoft, fontSize: 12, fontWeight: '600', textAlign: 'right' },
    emptyText: { color: theme.colors.textSoft, fontSize: 13, lineHeight: 19 },
  })

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        {/* Left header intentionally removed per request */}
        <View />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {searchVisible ? (
            <TextInput
              ref={searchInputRef}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search groups"
              placeholderTextColor={theme.colors.muted}
              style={{ width: 180, height: 36, borderRadius: 8, paddingHorizontal: 12, backgroundColor: theme.colors.surface, color: theme.colors.text }}
            />
          ) : (
            <Pressable onPress={() => {
              setSearchVisible(true)
              setTimeout(() => searchInputRef.current?.focus?.(), 200)
            }} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="search" size={18} color={theme.colors.muted} />
            </Pressable>
          )}

          <Pressable onPress={() => {
            // Open create modal in Groups screen
            console.log('[HomeScreen] Navigating to Groups with openCreate param');
            rootNavigation.navigate('Main', { screen: 'Groups', params: { openCreate: true } })
          }} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="person-add-outline" size={18} color={theme.colors.muted} />
          </Pressable>
        </View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.balanceLabel}>Total balance</Text>
            <Text style={styles.balanceValue}>{formatMoney(summary.balance || 0)}</Text>
          </View>
          <View style={[styles.balanceBadge, { paddingHorizontal: 12 }]}> 
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={{ width: 36, height: 36, borderRadius: 18 }} />
            ) : (
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: theme.colors.navy, fontWeight: '800' }}>{(user?.name || 'U').slice(0,2).toUpperCase()}</Text>
              </View>
            )}
            <View style={{ marginLeft: 8 }}>
              <Text style={{ color: theme.colors.surface, fontSize: 12, fontWeight: '800' }}>{user?.name || user?.email || 'User'}</Text>
              {user?.email ? <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 11 }}>{user.email}</Text> : null}
            </View>
          </View>
        </View>
        <Text style={styles.heroCopy}>Your live account summary updates from the backend every time you open this screen.</Text>

        <View style={styles.quickStats}>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatLabel}>You owe</Text>
            <Text style={[styles.quickStatValue, styles.quickStatDanger]}>{formatMoney(summary.youOwe || 0)}</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatLabel}>Owed to you</Text>
            <Text style={[styles.quickStatValue, styles.quickStatSuccess]}>{formatMoney(summary.owedToYou || 0)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.primaryAction} onPress={() => rootNavigation.navigate('Balance')}>
          <Ionicons name="stats-chart-outline" size={18} color={theme.colors.surface} />
          <Text style={styles.primaryActionText}>Balance summary</Text>
        </Pressable>
        <Pressable style={styles.secondaryAction} onPress={() => rootNavigation.navigate('AddExpense')}>
          <Ionicons name="add" size={18} color={theme.colors.navy} />
          <Text style={styles.secondaryActionText}>Add expense</Text>
        </Pressable>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent transactions</Text>
          <Text style={styles.sectionLink}>{recentActivity.length} live</Text>
        </View>

        {recentActivity.length === 0 ? (
          <Text style={styles.emptyText}>No recent activity yet. Add an expense or settlement to populate this feed.</Text>
        ) : (
          recentActivity.map((item) => (
            <View key={item.id} style={styles.activityRow}>
              <View style={styles.activityIconWrap}>
                <Ionicons name={item.type === 'settlement' ? 'swap-horizontal' : 'receipt-outline'} size={18} color={theme.colors.surface} />
              </View>
              <View style={styles.activityTextWrap}>
                <Text style={styles.activityTitle}>{item.title}</Text>
                <Text style={styles.activityDetail}>{item.detail}</Text>
              </View>
              <View style={styles.activityMeta}>
                <Text style={[styles.activityAmount, item.amount > 0 ? styles.activityPositive : styles.activityNegative]}>
                  {formatMoney(item.amount)}
                </Text>
                <Text style={styles.activityTime}>{item.date}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top groups</Text>
          <Text style={styles.sectionLink}>{groups.length} live</Text>
        </View>

        {displayedGroups.length === 0 ? (
          <Text style={styles.emptyText}>You are not in any groups yet.</Text>
        ) : displayedGroups.map((group) => (
          <Pressable key={group.id} style={styles.groupCard} onPress={() => {
            console.log('[HomeScreen] Navigating to Groups with groupId:', group.id);
            rootNavigation.navigate('Main', { screen: 'Groups', params: { groupId: group.id } });
          }}>
            <View style={styles.groupTopRow}>
              <View style={styles.groupTitleWrap}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupSummary}>{group.memberCount} members</Text>
              </View>
              <Text style={[styles.groupAmount, group.balance >= 0 ? styles.groupPositive : styles.groupNegative]}>
                {group.balance >= 0 ? '+' : '-'}{formatMoney(Math.abs(group.balance || 0))}
              </Text>
            </View>
            <View style={styles.groupBottomRow}>
              <AvatarStack members={group.members || []} accent={theme.colors.navy} />
              <Text style={styles.groupMeta}>
                {group.latestExpense ? `${group.latestExpense.description || 'Latest expense'} · ${new Date(group.latestExpense.createdAt).toLocaleDateString()}` : 'No expenses yet'}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  )
}


