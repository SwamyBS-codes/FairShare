import React from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, TextInput, Share, Alert, Modal, Dimensions } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { BarChart } from 'react-native-chart-kit'
import QRCode from 'react-native-qrcode-svg'
import { getDashboard, getGroupDetails, getGroupExpenses, getGroupSettlements, getGroupBalance, createGroup, addGroupMember, getUserProfile, deleteGroup, leaveGroup } from '../utils/api'
import { formatMoney } from '../utils/fairshare'
import { useAppTheme } from '../utils/ThemeProvider'

export default function FairShareGroupsScreen({ navigation, route }: any) {
  const { theme } = useAppTheme()
  const initialGroupId = route?.params?.groupId ? String(route.params.groupId) : ''
  const [loading, setLoading] = React.useState(true)
  const [groups, setGroups] = React.useState<any[]>([])
  const [selectedGroup, setSelectedGroup] = React.useState<any>(null)
  const [groupDetail, setGroupDetail] = React.useState<any>(null)
  const [groupExpenses, setGroupExpenses] = React.useState<any[]>([])
  const [groupSettlements, setGroupSettlements] = React.useState<any[]>([])
  const [groupBalance, setGroupBalance] = React.useState<any>(null)
  const [detailTab, setDetailTab] = React.useState<'settle' | 'balances' | 'total' | 'charts' | 'whiteboard' | 'export'>('settle')
  const [whiteboardText, setWhiteboardText] = React.useState('')
  // Modal states for create/join
  const [showCreateModal, setShowCreateModal] = React.useState(false)
  const [showJoinModal, setShowJoinModal] = React.useState(false)
  const [groupName, setGroupName] = React.useState('')
  const [joinGroupId, setJoinGroupId] = React.useState('')
  const [creating, setCreating] = React.useState(false)
  const [joining, setJoining] = React.useState(false)
  const [deletingGroup, setDeletingGroup] = React.useState(false)
  const [showMembersSettings, setShowMembersSettings] = React.useState(false)
  const [groupType, setGroupType] = React.useState<'Trip' | 'Home' | 'Couple' | 'Other'>('Trip')
  const [leavingGroup, setLeavingGroup] = React.useState(false)
  const [memberSearchText, setMemberSearchText] = React.useState('')
  
  // Track the last opened groupId to detect changes
  const lastOpenedGroupId = React.useRef<string | null>(null)

  const openGroup = React.useCallback(async (group: any) => {
    const token = await AsyncStorage.getItem('token')
    if (!token) return
    setSelectedGroup(group)
    await AsyncStorage.setItem('lastGroupId', String(group.id))
    const [details, expenses, settlements, balance] = await Promise.all([
      getGroupDetails(token, String(group.id)),
      getGroupExpenses(token, String(group.id)),
      getGroupSettlements(token, String(group.id)),
      getGroupBalance(token, String(group.id))
    ])
    setGroupDetail(details.group)
    setGroupExpenses(expenses.expenses || [])
    setGroupSettlements(settlements.settlements || [])
    setGroupBalance(balance)
    // load persisted whiteboard for this group (if present)
    try {
      const wbKey = `whiteboard:${group.id}`
      const saved = await AsyncStorage.getItem(wbKey)
      if (saved) setWhiteboardText(saved)
    } catch {}
  }, [])

  // Compute monthly totals for Total tab (from earliest expense to current)
  const { months, totals } = React.useMemo(() => {
    if (!groupExpenses || groupExpenses.length === 0) return { months: [], totals: [] }
    const dates = groupExpenses.map((e: any) => new Date(e.createdAt))
    const min = new Date(Math.min(...dates.map((d) => d.getTime())))
    const max = new Date()

    function monthKey(d: Date) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    }

    // Build list of months from min to max
    const monthsList: string[] = []
    const temp = new Date(min.getFullYear(), min.getMonth(), 1)
    const end = new Date(max.getFullYear(), max.getMonth(), 1)
    while (temp <= end) {
      monthsList.push(monthKey(temp))
      temp.setMonth(temp.getMonth() + 1)
    }

    // totals per month
    const totalsMap: Record<string, number> = {}
    monthsList.forEach((m) => (totalsMap[m] = 0))
    groupExpenses.forEach((e: any) => {
      const k = monthKey(new Date(e.createdAt))
      totalsMap[k] = (totalsMap[k] || 0) + Number(e.amount || 0)
    })

    // We want current month first (descending)
    const ordered = monthsList.slice().reverse()
    const totalsArr = ordered.map((k) => totalsMap[k] || 0)
    const monthsLabel = ordered.map((k) => {
      const [y, m] = k.split('-')
      const dt = new Date(Number(y), Number(m) - 1, 1)
      return { key: k, label: dt.toLocaleString('en-US', { month: 'short' }) }
    })
    return { months: monthsLabel, totals: totalsArr }
  }, [groupExpenses])

  const screenWidth = Dimensions.get('window').width - 40
  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(25,118,168,${opacity})`,
    labelColor: (opacity = 1) => `rgba(255,255,255,${opacity * 0.7})`,
    style: { borderRadius: 8 },
  }

  const loadGroups = React.useCallback(async () => {
    const token = await AsyncStorage.getItem('token')
    if (!token) throw new Error('No token found')
    const data = await getDashboard(token)
    setGroups(data.groups || [])
  }, [])

  // When initialGroupId changes (user clicked different group from Home), open that group
  React.useEffect(() => {
    if (initialGroupId && initialGroupId !== lastOpenedGroupId.current) {
      console.log('[GroupsScreen] initialGroupId changed from', lastOpenedGroupId.current, 'to', initialGroupId)
      lastOpenedGroupId.current = initialGroupId
      
      // Clear current selection
      setSelectedGroup(null)
      setGroupDetail(null)
      setGroupExpenses([])
      setGroupSettlements([])
      setGroupBalance(null)
      setDetailTab('settle')
      setWhiteboardText('')
      
      // Load and open the new group
      const openNewGroup = async () => {
        try {
          const token = await AsyncStorage.getItem('token')
          if (!token) return
          
          // We need to load groups first to find the group with this ID
          const data = await getDashboard(token)
          const groupsData = data.groups || []
          const targetGroup = groupsData.find((g: any) => String(g.id) === String(initialGroupId))
          
          console.log('[GroupsScreen] Found target group:', targetGroup?.id, targetGroup?.name)
          
          if (targetGroup) {
            // Directly set the selected group and load its data
            setSelectedGroup(targetGroup)
            await AsyncStorage.setItem('lastGroupId', String(targetGroup.id))
            
            const [details, expenses, settlements, balance] = await Promise.all([
              getGroupDetails(token, String(targetGroup.id)),
              getGroupExpenses(token, String(targetGroup.id)),
              getGroupSettlements(token, String(targetGroup.id)),
              getGroupBalance(token, String(targetGroup.id))
            ])
            setGroupDetail(details.group)
            setGroupExpenses(expenses.expenses || [])
            setGroupSettlements(settlements.settlements || [])
            setGroupBalance(balance)
            
            // load persisted whiteboard
            try {
              const wbKey = `whiteboard:${targetGroup.id}`
              const saved = await AsyncStorage.getItem(wbKey)
              if (saved) setWhiteboardText(saved)
            } catch {}
          }
        } catch (err) {
          console.log('[GroupsScreen] Error opening new group:', err)
        }
      }
      
      openNewGroup()
    }
  }, [initialGroupId])

  useFocusEffect(
    React.useCallback(() => {
      let active = true
      const run = async () => {
        try {
          setLoading(true)
          const token = await AsyncStorage.getItem('token')
          if (!token) throw new Error('No token found')
          const data = await getDashboard(token)
          if (!active) return
          setGroups(data.groups || [])
          
          // Handle openCreate modal
          if (route?.params?.openCreate) {
            console.log('[GroupsScreen] Opening create modal')
            setShowCreateModal(true)
            try {
              navigation.setParams({ openCreate: undefined })
            } catch (err) {
              console.log('[GroupsScreen] Error clearing param:', err)
            }
          }
        } finally {
          if (active) setLoading(false)
        }
      }

      run()
      return () => {
        active = false
      }
    }, [route?.params?.openCreate, navigation])
  )

  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 120 },
    loadingState: { flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
    kicker: { color: theme.colors.emerald, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 6 },
    headerTitle: { color: theme.colors.text, fontSize: 25, fontWeight: '800', letterSpacing: -0.6 },
    iconButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.line },
    featureCard: { backgroundColor: theme.colors.navy, borderRadius: 28, padding: 20, marginBottom: 16 },
    featureRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    featureLabel: { color: 'rgba(255,255,255,0.68)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
    featureValue: { marginTop: 8, color: theme.colors.surface, fontSize: 28, fontWeight: '800', letterSpacing: -0.8 },
    featurePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999 },
    featurePillText: { color: theme.colors.surface, fontSize: 12, fontWeight: '700' },
    featureCopy: { marginTop: 12, color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 21 },
    membersChip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 8 },
    membersChipText: { color: theme.colors.surface, fontSize: 12, fontWeight: '700' },
    groupCard: { backgroundColor: theme.colors.surface, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: theme.colors.line, marginBottom: 12 },
    groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    groupTextWrap: { flex: 1, paddingRight: 12 },
    groupName: { color: theme.colors.text, fontSize: 16, fontWeight: '800' },
    groupCategory: { marginTop: 4, color: theme.colors.textSoft, fontSize: 12, fontWeight: '600' },
    groupAmount: { fontSize: 16, fontWeight: '800' },
    groupPositive: { color: theme.colors.success },
    groupNegative: { color: theme.colors.danger },
    groupSubRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    avatarStack: { flexDirection: 'row', alignItems: 'center', paddingLeft: 10 },
    avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.background },
    avatarText: { fontSize: 10, fontWeight: '800' },
    groupSummary: { flex: 1, color: theme.colors.textSoft, fontSize: 12, fontWeight: '600', textAlign: 'right' },
    groupActions: { marginTop: 14, flexDirection: 'row', gap: 10 },
    secondaryButton: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.line, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
    secondaryButtonText: { color: theme.colors.text, fontSize: 13, fontWeight: '700' },
    primaryButton: { flex: 1, borderRadius: 16, backgroundColor: theme.colors.emerald, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
    primaryButtonText: { color: theme.colors.surface, fontSize: 13, fontWeight: '800' },
    memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.colors.line },
    memberAvatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: theme.colors.emeraldTint, alignItems: 'center', justifyContent: 'center' },
    memberAvatarText: { color: theme.colors.emeraldDark, fontSize: 12, fontWeight: '800' },
    memberTextWrap: { flex: 1 },
    memberName: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
    memberEmail: { marginTop: 4, color: theme.colors.textSoft, fontSize: 12 },
    timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.colors.line },
    timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.emerald },
    timelineTextWrap: { flex: 1 },
    timelineTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
    timelineDetail: { marginTop: 4, color: theme.colors.textSoft, fontSize: 12 },
    timelineAmount: { fontSize: 14, fontWeight: '800' },
    emptyText: { color: theme.colors.textSoft, fontSize: 13, lineHeight: 19 },
    backButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    backText: { color: theme.colors.text, fontSize: 13, fontWeight: '700' },
    topTabsContainer: { flexDirection: 'row', gap: 8, marginBottom: 16, paddingHorizontal: 0, borderBottomWidth: 1, borderBottomColor: theme.colors.line },
    topTab: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    topTabActive: { borderBottomColor: theme.colors.navy },
    topTabText: { color: theme.colors.textSoft, fontSize: 12, fontWeight: '700' },
    topTabTextActive: { color: theme.colors.navy },
    whiteboardInput: { borderRadius: 12, borderWidth: 1, borderColor: theme.colors.line, backgroundColor: theme.colors.background, color: theme.colors.text, padding: 12, fontSize: 13, minHeight: 120, textAlignVertical: 'top', marginBottom: 12 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.colors.line },
    summaryLabel: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
    summaryAmount: { color: theme.colors.navy, fontSize: 16, fontWeight: '800' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionLink: { color: theme.colors.emerald, fontSize: 12, fontWeight: '700' },
    sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '800', marginBottom: 8 },
    floatingActions: { position: 'absolute', right: 16, bottom: 24, alignItems: 'flex-end' },
    floatingButton: { minWidth: 110, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.navy, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12, shadowColor: '#0F172A', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
    joinFloatingButton: { marginTop: 10, backgroundColor: theme.colors.emerald },
    floatingButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
    deleteIconButton: { borderColor: theme.colors.dangerTint, backgroundColor: '#FFF1F2' },
    settingsModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    settingsModalCard: { maxHeight: '85%', backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 24 },
    settingsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    settingsTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '800' },
    settingsQuickActions: { marginBottom: 14, gap: 8 },
    settingsAction: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.colors.background, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: theme.colors.line },
    settingsActionText: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
    settingsSectionTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '800', marginBottom: 8 },
    membersList: { maxHeight: 240, marginBottom: 12 },
    settingsMemberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.line },
    settingsButtonsRow: { flexDirection: 'row', gap: 10 },
    settingsDangerButton: { flex: 1, borderWidth: 1, borderColor: theme.colors.danger, borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF1F2' },
    settingsDangerText: { color: theme.colors.danger, fontSize: 13, fontWeight: '800' },
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

  function AvatarStack({ members, accent }: { members: ({ id: number | string; name: string } | string)[]; accent: string }) {
    return (
      <View style={styles.avatarStack}>
        {members.slice(0, 4).map((member, index) => {
          const name = typeof member === 'string' ? member : member.name
          return (
            <View
              key={`${name}-${index}`}
              style={[
                styles.avatar,
                { marginLeft: index === 0 ? 0 : -10, backgroundColor: index === 0 ? accent : theme.colors.surface },
              ]}
            >
              <Text style={[styles.avatarText, { color: index === 0 ? theme.colors.surface : theme.colors.text }]}>{name.slice(0, 2).toUpperCase()}</Text>
            </View>
          )
        })}
      </View>
    )
  }

  useFocusEffect(
    React.useCallback(() => {
      let active = true
      const run = async () => {
        try {
          setLoading(true)
          const token = await AsyncStorage.getItem('token')
          if (!token) throw new Error('No token found')
          const data = await getDashboard(token)
          if (!active) return
          setGroups(data.groups || [])
          
          // Don't auto-open a group if we're trying to show the create modal
          const shouldAutoOpen = !route?.params?.openCreate
          
          // PRIORITY: 
          // 1. If initialGroupId (from params), use that
          // 2. Otherwise, use lastGroupId if no group selected
          const preferredGroupId = initialGroupId || (shouldAutoOpen && !selectedGroup ? await AsyncStorage.getItem('lastGroupId') : null)
          
          console.log('[GroupsScreen] useFocusEffect - initialGroupId:', initialGroupId, 'preferredGroupId:', preferredGroupId, 'selectedGroup:', selectedGroup)
          
          if (preferredGroupId) {
            const group = (data.groups || []).find((item: any) => String(item.id) === String(preferredGroupId))
            console.log('[GroupsScreen] Found group:', group?.id, group?.name)
            if (group && !selectedGroup) await openGroup(group)
          }
        } finally {
          if (active) setLoading(false)
        }
      }

      run()
      return () => {
        active = false
      }
    }, [initialGroupId, loadGroups, openGroup, route?.params?.openCreate])
  )

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name')
      return
    }
    try {
      setCreating(true)
      const token = await AsyncStorage.getItem('token')
      if (!token) throw new Error('No token found')
      const res = await createGroup(token, { name: groupName.trim(), description: '', type: groupType })
      const newGroup = res?.group || res
      setGroupName('')
      setGroupType('Trip')
      setShowCreateModal(false)

      // If API returned the created group, open it directly
      if (newGroup && newGroup.id) {
        try {
          await AsyncStorage.setItem('lastGroupId', String(newGroup.id))
          setSelectedGroup(newGroup)
          const [details, expenses, settlements, balance] = await Promise.all([
            getGroupDetails(token, String(newGroup.id)),
            getGroupExpenses(token, String(newGroup.id)),
            getGroupSettlements(token, String(newGroup.id)),
            getGroupBalance(token, String(newGroup.id))
          ])
          setGroupDetail(details.group)
          setGroupExpenses(expenses.expenses || [])
          setGroupSettlements(settlements.settlements || [])
          setGroupBalance(balance)
          setDetailTab('settle')
        } catch (err) {
          // If opening fails, fallback to refreshing list
          await loadGroups()
        }
      } else {
        // Fallback: refresh groups list
        await loadGroups()
      }

      Alert.alert('Success', 'Group created successfully')
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not create group')
    } finally {
      setCreating(false)
    }
  }

  const handleJoinGroup = async () => {
    if (!joinGroupId.trim()) {
      Alert.alert('Error', 'Please enter a group ID')
      return
    }
    try {
      setJoining(true)
      const token = await AsyncStorage.getItem('token')
      if (!token) throw new Error('No token found')
      const profile = await getUserProfile(token)
      const userId = profile?.user?.id
      if (!userId) throw new Error('User ID not available')
      await addGroupMember(token, { groupId: Number(joinGroupId), userId })
      setJoinGroupId('')
      setShowJoinModal(false)
      await loadGroups()
      Alert.alert('Success', 'Joined group successfully')
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not join group')
    } finally {
      setJoining(false)
    }
  }

  const handleDeleteGroup = async () => {
    if (!selectedGroup?.id) return

    Alert.alert('Delete group', 'This will permanently delete this group and its data. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeletingGroup(true)
            const token = await AsyncStorage.getItem('token')
            if (!token) throw new Error('No token found')
            await deleteGroup(token, String(selectedGroup.id))

            setSelectedGroup(null)
            setGroupDetail(null)
            setGroupExpenses([])
            setGroupSettlements([])
            setGroupBalance(null)
            setDetailTab('settle')
            await loadGroups()
            Alert.alert('Success', 'Group deleted successfully')
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Could not delete this group')
          } finally {
            setDeletingGroup(false)
          }
        },
      },
    ])
  }

  const handleLeaveGroup = async () => {
    if (!selectedGroup?.id) return

    Alert.alert('Leave group', 'Are you sure you want to leave this group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            setLeavingGroup(true)
            const token = await AsyncStorage.getItem('token')
            if (!token) throw new Error('No token found')

            await leaveGroup(token, String(selectedGroup.id))
            setShowMembersSettings(false)
            setSelectedGroup(null)
            setGroupDetail(null)
            setGroupExpenses([])
            setGroupSettlements([])
            setGroupBalance(null)
            setDetailTab('settle')
            await loadGroups()
            Alert.alert('Success', 'You left the group')
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Could not leave this group')
          } finally {
            setLeavingGroup(false)
          }
        },
      },
    ])
  }

  if (loading) {
    return (
      <>
        <View style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.emerald} />
        </View>
        
        {/* Create Group Modal - Full screen */}
        <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
          <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.line }}>
              <Pressable onPress={() => { setShowCreateModal(false); setGroupName(''); setGroupType('Trip'); }}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </Pressable>
              <Text style={{ fontSize: 18, fontWeight: '800', color: theme.colors.text }}>Create a group</Text>
              <Pressable onPress={handleCreateGroup} disabled={creating || !groupName.trim()}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: creating || !groupName.trim() ? theme.colors.muted : theme.colors.emerald }}>Done</Text>
              </Pressable>
            </View>

            {/* Content */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 32, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
              {/* Group Name Input */}
              <View style={{ marginBottom: 32 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 12 }}>Group name</Text>
                <View style={{ position: 'relative' }}>
                  <View style={{ width: 64, height: 64, borderRadius: 16, borderWidth: 2, borderColor: theme.colors.line, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Ionicons name="image-outline" size={32} color={theme.colors.muted} />
                  </View>
                  <TextInput
                    style={{ borderBottomWidth: 2, borderBottomColor: theme.colors.emerald, paddingBottom: 8, color: theme.colors.text, fontSize: 16, fontWeight: '600' }}
                    placeholder="e.g. Europe Trip, Apartment Rent"
                    value={groupName}
                    onChangeText={setGroupName}
                    placeholderTextColor={theme.colors.mutedSoft}
                    editable={!creating}
                  />
                </View>
              </View>

              {/* Group Type Selector */}
              <View style={{ marginBottom: 32 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 16 }}>Type</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  {[
                    { key: 'Trip', icon: 'airplane-outline', label: 'Trip' },
                    { key: 'Home', icon: 'home-outline', label: 'Home' },
                    { key: 'Couple', icon: 'heart-outline', label: 'Couple' },
                    { key: 'Other', icon: 'ellipsis-horizontal-outline', label: 'Other' },
                  ].map((type) => (
                    <Pressable
                      key={type.key}
                      onPress={() => setGroupType(type.key as any)}
                      style={{
                        flex: 1,
                        minWidth: '45%',
                        backgroundColor: groupType === type.key ? theme.colors.navy : theme.colors.surface,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: groupType === type.key ? theme.colors.navy : theme.colors.line,
                        paddingVertical: 20,
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Ionicons name={type.icon as any} size={24} color={groupType === type.key ? theme.colors.surface : theme.colors.text} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: groupType === type.key ? theme.colors.surface : theme.colors.text }}>{type.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Additional info */}
              <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, marginBottom: 32 }}>
                <Text style={{ fontSize: 13, color: theme.colors.textSoft, lineHeight: 18 }}>
                  Groups help you organize expenses with friends, family, or colleagues. You can add members and track who owes whom.
                </Text>
              </View>
            </ScrollView>

            {/* Loading indicator */}
            {creating && (
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, top: 0, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={theme.colors.emerald} />
              </View>
            )}
          </View>
        </Modal>
      </>
    )
  }

  if (selectedGroup && groupDetail) {
    const members = groupDetail.members?.map((member: any) => member.user) || []
    const isOwner = (groupDetail?.createdById || groupDetail?.createdBy?.id) === selectedGroup?.createdBy?.id || (groupDetail?.createdById && members.some((m: any) => m.id === groupDetail.createdById))
    const handleExportCSV = async () => {
      try {
        const rows: string[] = []
        rows.push('Members')
        rows.push('id,name,email')
        ;(members || []).forEach((m: any) => rows.push(`${m.id},"${m.name}",${m.email}`))
        rows.push('')
        rows.push('Expenses')
        rows.push('id,description,amount,createdBy,createdAt')
        ;(groupExpenses || []).forEach((e: any) => rows.push(`${e.id},"${(e.description||'').replace(/"/g,'""')}",${e.amount},"${e.createdBy?.name||''}",${e.createdAt}`))
        rows.push('')
        rows.push('Settlements')
        rows.push('id,from,to,amount,settled,createdAt')
        ;(groupSettlements || []).forEach((s: any) => rows.push(`${s.id},"${s.paidBy?.name||''}","${s.paidTo?.name||''}",${s.amount},${s.settled},${s.createdAt}`))

        const csv = rows.join('\n')
        await Share.share({ title: `Export ${groupDetail.name}`, message: csv })
      } catch {
        Alert.alert('Error', 'Could not export group data')
      }
    }

    const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 120 },
    loadingState: { flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
    kicker: { color: theme.colors.emerald, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 6 },
    headerTitle: { color: theme.colors.text, fontSize: 25, fontWeight: '800', letterSpacing: -0.6 },
    iconButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.line },
    featureCard: { backgroundColor: theme.colors.navy, borderRadius: 28, padding: 20, marginBottom: 16 },
    featureRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    featureLabel: { color: 'rgba(255,255,255,0.68)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
    featureValue: { marginTop: 8, color: theme.colors.surface, fontSize: 28, fontWeight: '800', letterSpacing: -0.8 },
    featurePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999 },
    featurePillText: { color: theme.colors.surface, fontSize: 12, fontWeight: '700' },
    featureCopy: { marginTop: 12, color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 21 },
    membersChip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 8 },
    membersChipText: { color: theme.colors.surface, fontSize: 12, fontWeight: '700' },
    groupCard: { backgroundColor: theme.colors.surface, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: theme.colors.line, marginBottom: 12 },
    groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    groupTextWrap: { flex: 1, paddingRight: 12 },
    groupName: { color: theme.colors.text, fontSize: 16, fontWeight: '800' },
    groupCategory: { marginTop: 4, color: theme.colors.textSoft, fontSize: 12, fontWeight: '600' },
    groupAmount: { fontSize: 16, fontWeight: '800' },
    groupPositive: { color: theme.colors.success },
    groupNegative: { color: theme.colors.danger },
    groupSubRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    avatarStack: { flexDirection: 'row', alignItems: 'center', paddingLeft: 10 },
    avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.background },
    avatarText: { fontSize: 10, fontWeight: '800' },
    groupSummary: { flex: 1, color: theme.colors.textSoft, fontSize: 12, fontWeight: '600', textAlign: 'right' },
    groupActions: { marginTop: 14, flexDirection: 'row', gap: 10 },
    secondaryButton: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.line, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
    secondaryButtonText: { color: theme.colors.text, fontSize: 13, fontWeight: '700' },
    primaryButton: { flex: 1, borderRadius: 16, backgroundColor: theme.colors.emerald, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
    primaryButtonText: { color: theme.colors.surface, fontSize: 13, fontWeight: '800' },
    memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.colors.line },
    memberAvatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: theme.colors.emeraldTint, alignItems: 'center', justifyContent: 'center' },
    memberAvatarText: { color: theme.colors.emeraldDark, fontSize: 12, fontWeight: '800' },
    memberTextWrap: { flex: 1 },
    memberName: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
    memberEmail: { marginTop: 4, color: theme.colors.textSoft, fontSize: 12 },
    timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.colors.line },
    timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.emerald },
    timelineTextWrap: { flex: 1 },
    timelineTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
    timelineDetail: { marginTop: 4, color: theme.colors.textSoft, fontSize: 12 },
    timelineAmount: { fontSize: 14, fontWeight: '800' },
    emptyText: { color: theme.colors.textSoft, fontSize: 13, lineHeight: 19 },
    backButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    backText: { color: theme.colors.text, fontSize: 13, fontWeight: '700' },
    topTabsContainer: { flexDirection: 'row', gap: 8, marginBottom: 16, paddingHorizontal: 0, borderBottomWidth: 1, borderBottomColor: theme.colors.line },
    topTab: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    topTabActive: { borderBottomColor: theme.colors.navy },
    topTabText: { color: theme.colors.textSoft, fontSize: 12, fontWeight: '700' },
    topTabTextActive: { color: theme.colors.navy },
    whiteboardInput: { borderRadius: 12, borderWidth: 1, borderColor: theme.colors.line, backgroundColor: theme.colors.background, color: theme.colors.text, padding: 12, fontSize: 13, minHeight: 120, textAlignVertical: 'top', marginBottom: 12 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.colors.line },
    summaryLabel: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
    summaryAmount: { color: theme.colors.navy, fontSize: 16, fontWeight: '800' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionLink: { color: theme.colors.emerald, fontSize: 12, fontWeight: '700' },
    floatingActions: { position: 'absolute', right: 16, bottom: 24, alignItems: 'flex-end' },
    floatingButton: { minWidth: 110, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.navy, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12, shadowColor: '#0F172A', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
    joinFloatingButton: { marginTop: 10, backgroundColor: theme.colors.emerald },
    floatingButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
    deleteIconButton: { borderColor: theme.colors.dangerTint, backgroundColor: '#FFF1F2' },
    settingsModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    settingsModalCard: { maxHeight: '85%', backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 24 },
    settingsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    settingsTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '800' },
    settingsQuickActions: { marginBottom: 14, gap: 8 },
    settingsAction: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.colors.background, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: theme.colors.line },
    settingsActionText: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
    settingsSectionTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '800', marginBottom: 8 },
    membersList: { maxHeight: 240, marginBottom: 12 },
    settingsMemberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.line },
    settingsButtonsRow: { flexDirection: 'row', gap: 10 },
    settingsDangerButton: { flex: 1, borderWidth: 1, borderColor: theme.colors.danger, borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF1F2' },
    settingsDangerText: { color: theme.colors.danger, fontSize: 13, fontWeight: '800' },
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

    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Pressable style={styles.backButton} onPress={() => {
              // Go back to the Groups list by clearing selected group state
              console.log('[GroupsScreen] Going back to groups list')
              setSelectedGroup(null)
              setGroupDetail(null)
              setGroupExpenses([])
              setGroupSettlements([])
              setGroupBalance(null)
              setDetailTab('settle')
              setWhiteboardText('')
              // Clear route params so initialGroupId resets
              navigation.setParams({ groupId: undefined })
            }}>
              <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
              <Text style={styles.backText}>Groups</Text>
            </Pressable>
            <Pressable
              style={styles.iconButton}
              onPress={() => {
                setShowMembersSettings(true)
                setMemberSearchText('')
              }}
            >
              <Ionicons name="settings-outline" size={18} color={theme.colors.text} />
            </Pressable>
          </View>

          <View style={styles.featureCard}>
            <Pressable onPress={() => navigation.navigate('GroupMembers', { groupId: selectedGroup.id })} style={styles.membersChip}>
              <Ionicons name="people-outline" size={14} color={theme.colors.surface} />
              <Text style={styles.membersChipText}>{members.length} people</Text>
            </Pressable>
            <Text style={styles.featureValue}>{groupDetail.name}</Text>
            <Text style={styles.featureCopy}>Live group detail · {groupExpenses.length} expenses</Text>
          </View>

          {(groupBalance && (groupBalance.balance !== undefined || groupBalance.youOwe !== undefined)) && (
            <View style={{ backgroundColor: theme.colors.surface, borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.line }}>
              <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: 20, marginBottom: 12 }}>
                {groupBalance.balance >= 0 ? `You are owed ${formatMoney(groupBalance.balance)} overall` : `You owe ${formatMoney(Math.abs(groupBalance.balance || groupBalance.youOwe || 0))} overall`}
              </Text>
              
              {/* Individual balances - show up to 3 */}
              <View style={{ marginBottom: 12 }}>
                {groupExpenses.slice(0, 3).map((expense: any, idx: number) => {
                  const share = expense.shares?.find((s: any) => s.userId !== groupDetail?.userId)
                  if (share && expense.createdBy?.id === groupDetail?.userId) {
                    return (
                      <Text key={idx} style={{ color: theme.colors.textSoft, fontSize: 13, marginBottom: 4 }}>
                        You owe {share.userId === 1 ? 'Ankit P.' : 'Bharath'} {formatMoney(share.shareAmount || 0)}
                      </Text>
                    )
                  }
                  return null
                })}
              </View>
              
              {groupExpenses.length > 3 && (
                <Text style={{ color: theme.colors.emerald, fontSize: 12, fontWeight: '600', marginBottom: 14 }}>
                  Plus {groupExpenses.length - 3} other balances
                </Text>
              )}
              
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <Pressable style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: '#FF6B35' }} onPress={() => {/* settle flow */}}>
                  <Text style={{ color: theme.colors.surface, fontWeight: '800', fontSize: 14 }}>Settle up</Text>
                </Pressable>
                <Pressable style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.line }}>
                  <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600' }}>Convert to USD</Text>
                </Pressable>
                <Pressable style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.line }} onPress={() => setDetailTab('balances')}>
                  <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600' }}>Balances</Text>
                </Pressable>
                <Pressable style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.line }} onPress={() => setDetailTab('total')}>
                  <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600' }}>Totals</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Top Tabs */}
          <View style={styles.topTabsContainer}>
            {[
              { key: 'settle', label: 'Settle up' },
              { key: 'balances', label: 'Balances' },
              { key: 'total', label: 'Total' },
              { key: 'charts', label: 'Charts' },
              { key: 'whiteboard', label: 'Whiteboard' },
            ].map((t) => (
              <Pressable
                key={t.key}
                style={[styles.topTab, detailTab === (t.key as any) && styles.topTabActive]}
                onPress={() => setDetailTab(t.key as any)}
              >
                <Text style={[styles.topTabText, detailTab === (t.key as any) && styles.topTabTextActive]}>{t.label}</Text>
              </Pressable>
            ))}
            <Pressable
              style={[styles.topTab, detailTab === 'export' && styles.topTabActive]}
              onPress={handleExportCSV}
            >
              <Text style={[styles.topTabText, detailTab === 'export' && styles.topTabTextActive]}>Export</Text>
            </Pressable>
          </View>

          {/* Tab Content */}
          {detailTab === 'settle' && (
            <>
              {/* Expenses only in Settle tab (pending settlements removed as requested) */}
              <View>
                <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>
                  {new Date(groupExpenses[0]?.createdAt || new Date()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text>
                {groupExpenses.length === 0 ? (
                  <Text style={styles.emptyText}>No expenses yet. Add one to get started!</Text>
                ) : (
                  groupExpenses.reduce((acc: any[], expense: any) => {
                    const date = new Date(expense.createdAt).toLocaleDateString()
                    const existingGroup = acc.find((g) => g.date === date)
                    if (existingGroup) {
                      existingGroup.expenses.push(expense)
                    } else {
                      acc.push({ date, expenses: [expense] })
                    }
                    return acc
                  }, []).map((group: any, groupIdx: number) => (
                    <View key={groupIdx}>
                      {groupIdx > 0 && <Text style={[styles.sectionTitle, { marginVertical: 16, marginTop: 20 }]}>{new Date(group.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>}
                      {group.expenses.map((expense: any, idx: number) => {
                        const iconMap: Record<string, string> = {
                          'petrol': 'car',
                          'fuel': 'car',
                          'gas': 'car',
                          'lunch': 'fast-food',
                          'food': 'fast-food',
                          'dinner': 'fast-food',
                          'breakfast': 'fast-food',
                          'car': 'car',
                          'rent': 'home',
                          'home': 'home',
                          'ticket': 'ticket',
                          'movie': 'film',
                          'tea': 'cafe',
                          'coffee': 'cafe',
                          'extension': 'home',
                          'uber': 'car',
                          'taxi': 'car',
                        }
                        const expenseType = expense.description?.toLowerCase() || ''
                        let icon = 'receipt'
                        for (const [key, value] of Object.entries(iconMap)) {
                          if (expenseType.includes(key)) {
                            icon = value
                            break
                          }
                        }
                        return (
                          <View key={expense.id} style={[styles.groupCard, { marginBottom: 10 }]}> 
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                <View style={[styles.memberAvatar, { backgroundColor: theme.colors.emeraldTint }]}>
                                  <Ionicons name={icon as any} size={20} color={theme.colors.emeraldDark} />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                  <Text style={styles.memberName}>{expense.description || 'Expense'}</Text>
                                  <Text style={styles.memberEmail}>{expense.createdBy?.name || 'Unknown'} paid {formatMoney(expense.amount)}</Text>
                                </View>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <View style={{ alignItems: 'flex-end' }}>
                                  {expense.shares?.some((s: any) => s.userId === groupDetail?.userId) ? (
                                    <Text style={[styles.groupAmount, styles.groupNegative]}>you borrowed</Text>
                                  ) : (
                                    <Text style={[styles.groupAmount, styles.groupPositive]}>you lent</Text>
                                  )}
                                  {expense.shares?.map((share: any) => {
                                    if (share.userId === groupDetail?.userId) {
                                      return <Text key={share.userId} style={[styles.groupAmount, { marginTop: 4 }]}>{formatMoney(share.shareAmount)}</Text>
                                    }
                                    return null
                                  })}
                                </View>
                                {/* Edit button */}
                                <Pressable onPress={() => navigation.navigate('AddExpense', { groupId: selectedGroup?.id || selectedGroup, expense })} style={{ padding: 8 }}>
                                  <Ionicons name="create-outline" size={20} color={theme.colors.muted} />
                                </Pressable>
                              </View>
                            </View>
                          </View>
                        )
                      })}
                    </View>
                  ))
                )}
              </View>
            </>
          )}

          {detailTab === 'balances' && (
            <View style={styles.groupCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Balances (who owes whom)</Text>
                <Text style={styles.sectionLink}>Live</Text>
              </View>
              {groupBalance?.balances && Object.values(groupBalance.balances).length > 0 ? (
                <>
                  <Text style={[styles.sectionTitle, { marginBottom: 16, marginTop: 12, fontSize: 14, fontWeight: '600' }]}>Individual Balances</Text>
                  {Object.values(groupBalance.balances).map((entry: any) => (
                    <View key={entry.name} style={styles.memberRow}>
                      <View style={styles.memberAvatar}><Text style={styles.memberAvatarText}>{entry.name.slice(0, 2).toUpperCase()}</Text></View>
                      <View style={styles.memberTextWrap}>
                        <Text style={styles.memberName}>{entry.name}</Text>
                        <Text style={styles.memberEmail}>
                          {entry.owes > 0 ? `Owes ${formatMoney(Math.abs(Number(entry.owes)))}` : `Gets back ${formatMoney(Math.abs(Number(entry.owes)))}`}
                        </Text>
                      </View>
                      <Text style={entry.owes > 0 ? styles.groupNegative : styles.groupPositive}>
                        {entry.owes > 0 ? `−${formatMoney(Math.abs(Number(entry.owes)))}` : `+${formatMoney(Math.abs(Number(entry.owes)))}`}
                      </Text>
                    </View>
                  ))}
                </>
              ) : <Text style={styles.emptyText}>No balances to show.</Text>}
            </View>
          )}

          {detailTab === 'total' && (
            <View style={[styles.groupCard, { paddingBottom: 24 }]}> 
              <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: '900', marginBottom: 8 }}>{selectedGroup?.name || groupDetail?.name || 'Group'}</Text>

              {/* Render expense bar chart from computed months/totals (current month first) */}
              <View style={{ height: 220, marginVertical: 12, justifyContent: 'flex-end' }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: '100%', gap: 12 }}>
                  {months.length === 0 ? (
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ color: theme.colors.muted }}>No data</Text>
                    </View>
                  ) : (() => {
                    const max = Math.max(...totals, 1)
                    return months.map((m: any, i: number) => {
                      const value = totals[i] || 0
                      const height = Math.round((value / max) * 160)
                      return (
                        <View key={m.key} style={{ flex: 1, alignItems: 'center' }}>
                          <View style={{ width: 28, height: Math.max(6, height), backgroundColor: value > 0 ? '#1976A8' : 'rgba(255,255,255,0.06)', borderRadius: 8 }} />
                          <Text style={{ color: theme.colors.muted, marginTop: 8 }}>{m.label}</Text>
                        </View>
                      )
                    })
                  })()}
                </View>
              </View>

              <View style={{ marginTop: 6 }}>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: '700' }}>Total spent</Text>
                <Text style={{ color: '#2DB0E6', fontSize: 28, fontWeight: '900', marginTop: 6 }}>{formatMoney(groupExpenses.reduce((s,a)=>s+Number(a.amount||0),0))}</Text>

                <Text style={{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: '700', marginTop: 12 }}>Your share</Text>
                <Text style={{ color: '#2DB0E6', fontSize: 28, fontWeight: '900', marginTop: 6 }}>{formatMoney(groupExpenses.reduce((s,a)=>s+Number(a.amount||0),0))}</Text>
                <Text style={{ color: theme.colors.muted, fontSize: 12, marginTop: 6 }}>100% of total group spending</Text>
              </View>

              {/* Time selector mock */}
              <View style={{ marginTop: 18, backgroundColor: theme.colors.surface, borderRadius: 28, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.colors.text, fontWeight: '700' }}>All time</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="chevron-back" size={18} color={theme.colors.muted} />
                  <Text style={{ color: theme.colors.text }}>{new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}</Text>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
                </View>
              </View>
            </View>
          )}

          {detailTab === 'charts' && (
            <View style={styles.groupCard}>
              <Text style={styles.sectionTitle}>Expense charts</Text>
              {/* Reuse computed months/totals and render larger visualization */}
              {months.length === 0 ? (
                <Text style={styles.emptyText}>No expense data to visualize.</Text>
              ) : (
                <View>
                  <BarChart
                    data={{ labels: months.map((m:any)=>m.label).slice(0,12), datasets: [{ data: totals.slice(0,12) }] }}
                    width={Math.min(screenWidth, 800)}
                    height={260}
                    chartConfig={chartConfig as any}
                    fromZero
                    showValuesOnTopOfBars={false}
                    style={{ borderRadius: 8 }}
                    withInnerLines={false}
                    withHorizontalLabels={true}
                  />
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: '700' }}>Total (last {months.length} months)</Text>
                    <Text style={{ color: theme.colors.navy, fontSize: 22, fontWeight: '900', marginTop: 6 }}>{formatMoney(totals.reduce((s:number,a:number)=>s+a,0))}</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {detailTab === 'whiteboard' && (
            <View style={{ paddingHorizontal: 0, paddingTop: 8 }}>
              <View style={{ height: 520, marginHorizontal: 8, borderRadius: 6, backgroundColor: theme.colors.navy, padding: 12 }}>
                <TextInput
                  value={whiteboardText}
                  onChangeText={setWhiteboardText}
                  multiline
                  style={{ flex: 1, color: theme.colors.surface, textAlignVertical: 'top' }}
                  placeholder="Use the whiteboard to remember important info, like your landlord's address or emergency contact info. The whiteboard is visible to anyone who joins your group."
                  placeholderTextColor={theme.colors.mutedSoft}
                />
              </View>
                <Text style={{ color: theme.colors.muted, fontSize: 12, marginTop: 10, marginHorizontal: 12 }}>Use the whiteboard to remember important info, like your landlord's address or emergency contact info. The whiteboard is visible to anyone who joins your group.</Text>
                <Pressable style={[styles.primaryButton, { marginTop: 12, marginHorizontal: 12 }]} onPress={async () => {
                  try {
                    if (!selectedGroup?.id) return Alert.alert('Error', 'No group selected')
                    const wbKey = `whiteboard:${selectedGroup.id}`
                    await AsyncStorage.setItem(wbKey, whiteboardText || '')
                    Alert.alert('Saved', 'Whiteboard saved')
                  } catch {
                    Alert.alert('Error', 'Could not save whiteboard')
                  }
                }}>
                  <Text style={styles.primaryButtonText}>Save</Text>
                </Pressable>
            </View>
          )}

          {/* Members section removed from this screen as requested */}

          {detailTab === 'settle' && (
            <>
              {/* Invite section */}
              <View style={styles.groupCard}>
                <Text style={styles.sectionTitle}>Invite someone</Text>
                <Text style={styles.featureCopy}>Add a friend or roommate to start splitting expenses together.</Text>
                <Pressable style={[styles.primaryButton, { flex: undefined, width: '100%' }]} onPress={async () => {
                  try {
                    const link = `https://fairshare.app/join/${selectedGroup.id}`
                    const message = `Join my FairShare group "${selectedGroup.name}"\n\nOpen: ${link}\nOr use Group ID: ${selectedGroup.id}`
                    await Share.share({ message, title: `Join ${selectedGroup.name}` })
                  } catch {
                    Alert.alert('Error', 'Unable to share')
                  }
                }}>
                  <Text style={styles.primaryButtonText}>Share invite link →</Text>
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>

        {/* Floating Add Expense Button */}
        <Pressable 
          style={{ 
            position: 'absolute', 
            bottom: 20, 
            right: 20, 
            backgroundColor: theme.colors.emerald, 
            borderRadius: 14,
            paddingHorizontal: 20,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            shadowColor: theme.colors.emerald,
            shadowOpacity: 0.3,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8
          }} 
          onPress={() => navigation.navigate('AddExpense', { groupId: selectedGroup.id, groupName: selectedGroup.name })}
        >
          <Ionicons name="add" size={20} color={theme.colors.surface} />
          <Text style={{ color: theme.colors.surface, fontWeight: '800', fontSize: 14 }}>Add expense</Text>
        </Pressable>

        <Modal visible={showMembersSettings} transparent animationType="slide" onRequestClose={() => setShowMembersSettings(false)}>
          <View style={styles.settingsModalOverlay}>
            <ScrollView style={styles.settingsModalCard} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Header */}
              <View style={styles.settingsHeader}>
                <Pressable style={styles.iconButton} onPress={() => setShowMembersSettings(false)}>
                  <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
                </Pressable>
                <Text style={styles.settingsTitle}>Group settings</Text>
                <Pressable style={styles.iconButton} onPress={() => setShowMembersSettings(false)}>
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </Pressable>
              </View>

              {/* Group Info Card */}
              <View style={{ paddingHorizontal: 16, marginBottom: 24, marginTop: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: theme.colors.text, marginBottom: 4 }}>
                      {groupDetail?.name || selectedGroup?.name}
                    </Text>
                    <Text style={{ fontSize: 13, color: theme.colors.textSoft, marginBottom: 12 }}>
                      {groupDetail?.type || selectedGroup?.type || 'Other'}
                    </Text>
                  </View>
                  <Pressable style={{ padding: 8 }}>
                    <Ionicons name="pencil-outline" size={18} color={theme.colors.navy} />
                  </Pressable>
                </View>
              </View>

              {/* Group Members Section Header */}
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text, paddingHorizontal: 16, marginBottom: 12 }}>
                Group members
              </Text>

              {/* Search Bar */}
              <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.line, paddingHorizontal: 12, paddingVertical: 8 }}>
                  <Ionicons name="search-outline" size={16} color={theme.colors.muted} />
                  <TextInput
                    placeholder="Search by name or phone"
                    placeholderTextColor={theme.colors.mutedSoft}
                    value={memberSearchText}
                    onChangeText={setMemberSearchText}
                    style={{ flex: 1, marginLeft: 8, color: theme.colors.text, fontSize: 14 }}
                  />
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.settingsQuickActions}>
                <Pressable style={styles.settingsAction} onPress={async () => {
                  try {
                    const link = `https://fairshare.app/join/${selectedGroup.id}`
                    const message = `Join my FairShare group "${selectedGroup.name}"\n\nOpen: ${link}\nOr use Group ID: ${selectedGroup.id}`
                    await Share.share({ message, title: `Join ${selectedGroup.name}` })
                  } catch {
                    Alert.alert('Error', 'Unable to share invite link')
                  }
                }}>
                  <Ionicons name="link-outline" size={18} color={theme.colors.navy} />
                  <Text style={styles.settingsActionText}>Invite via link</Text>
                </Pressable>

                <Pressable style={styles.settingsAction} onPress={() => {
                  setShowMembersSettings(false)
                  navigation.navigate('GroupMembers', { groupId: selectedGroup.id })
                }}>
                  <Ionicons name="person-add-outline" size={18} color={theme.colors.navy} />
                  <Text style={styles.settingsActionText}>Add people to group</Text>
                </Pressable>
              </View>

              {/* Members List */}
              <View style={{ paddingHorizontal: 16 }}>
                {members
                  .filter((member: any) => {
                    const searchLower = memberSearchText.toLowerCase()
                    return (
                      member.name?.toLowerCase().includes(searchLower) ||
                      member.email?.toLowerCase().includes(searchLower)
                    )
                  })
                  .map((member: any) => (
                    <View key={member.id} style={styles.settingsMemberRow}>
                      <View style={styles.memberAvatar}>
                        <Text style={styles.memberAvatarText}>
                          {member.name?.slice(0, 2).toUpperCase() || 'U'}
                        </Text>
                      </View>
                      <View style={styles.memberTextWrap}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        <Text style={styles.memberEmail}>{member.email}</Text>
                      </View>
                    </View>
                  ))}
              </View>

              {/* Advanced Settings Section */}
              <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 16 }}>
                  Advanced settings
                </Text>

                <Pressable style={{ paddingVertical: 12, paddingHorizontal: 12, backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.line, marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Simplify group debts</Text>
                    <View style={{ width: 44, height: 28, borderRadius: 14, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.line, justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 2 }}>
                      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: theme.colors.muted, margin: 2 }} />
                    </View>
                  </View>
                  <Text style={{ color: theme.colors.textSoft, fontSize: 12, marginTop: 8 }}>
                    Automatically combines debts to reduce the total number of repayments between group members.
                  </Text>
                </Pressable>

                <Pressable style={{ paddingVertical: 12, paddingHorizontal: 12, backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.line, marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Default split</Text>
                        <View style={{ backgroundColor: '#A78BFA', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>PRO</Text>
                        </View>
                      </View>
                      <Text style={{ color: theme.colors.textSoft, fontSize: 12, marginTop: 4 }}>
                        Paid by you and split equally
                      </Text>
                    </View>
                  </View>
                </Pressable>

                {/* Danger Zone Buttons */}
                <View style={{ marginTop: 16, gap: 12 }}>
                  <Pressable
                    style={[styles.settingsDangerButton, leavingGroup && styles.buttonDisabled]}
                    onPress={handleLeaveGroup}
                    disabled={leavingGroup}
                  >
                    {leavingGroup ? (
                      <ActivityIndicator size="small" color={theme.colors.danger} />
                    ) : (
                      <Text style={styles.settingsDangerText}>Leave group</Text>
                    )}
                  </Pressable>
                  <Pressable
                    style={[styles.settingsDangerButton, deletingGroup && styles.buttonDisabled]}
                    onPress={handleDeleteGroup}
                    disabled={deletingGroup || !isOwner}
                  >
                    {deletingGroup ? (
                      <ActivityIndicator size="small" color={theme.colors.danger} />
                    ) : (
                      <Text style={styles.settingsDangerText}>
                        {isOwner ? 'Delete group' : 'Delete (owner only)'}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* Create Group Modal - in detail view */}
        <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
          <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.line }}>
              <Pressable onPress={() => { setShowCreateModal(false); setGroupName(''); setGroupType('Trip'); }}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </Pressable>
              <Text style={{ fontSize: 18, fontWeight: '800', color: theme.colors.text }}>Create a group</Text>
              <Pressable onPress={handleCreateGroup} disabled={creating || !groupName.trim()}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: creating || !groupName.trim() ? theme.colors.muted : theme.colors.emerald }}>Done</Text>
              </Pressable>
            </View>

            {/* Content */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 32, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
              {/* Group Name Input */}
              <View style={{ marginBottom: 32 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 12 }}>Group name</Text>
                <View style={{ position: 'relative' }}>
                  <View style={{ width: 64, height: 64, borderRadius: 16, borderWidth: 2, borderColor: theme.colors.line, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Ionicons name="image-outline" size={32} color={theme.colors.muted} />
                  </View>
                  <TextInput
                    style={{ borderBottomWidth: 2, borderBottomColor: theme.colors.emerald, paddingBottom: 8, color: theme.colors.text, fontSize: 16, fontWeight: '600' }}
                    placeholder="e.g. Europe Trip, Apartment Rent"
                    value={groupName}
                    onChangeText={setGroupName}
                    placeholderTextColor={theme.colors.mutedSoft}
                    editable={!creating}
                  />
                </View>
              </View>

              {/* Group Type Selector */}
              <View style={{ marginBottom: 32 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 16 }}>Type</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  {[
                    { key: 'Trip', icon: 'airplane-outline', label: 'Trip' },
                    { key: 'Home', icon: 'home-outline', label: 'Home' },
                    { key: 'Couple', icon: 'heart-outline', label: 'Couple' },
                    { key: 'Other', icon: 'ellipsis-horizontal-outline', label: 'Other' },
                  ].map((type) => (
                    <Pressable
                      key={type.key}
                      onPress={() => setGroupType(type.key as any)}
                      style={{
                        flex: 1,
                        minWidth: '45%',
                        backgroundColor: groupType === type.key ? theme.colors.navy : theme.colors.surface,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: groupType === type.key ? theme.colors.navy : theme.colors.line,
                        paddingVertical: 20,
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Ionicons name={type.icon as any} size={24} color={groupType === type.key ? theme.colors.surface : theme.colors.text} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: groupType === type.key ? theme.colors.surface : theme.colors.text }}>{type.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Additional info */}
              <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, marginBottom: 32 }}>
                <Text style={{ fontSize: 13, color: theme.colors.textSoft, lineHeight: 18 }}>
                  Groups help you organize expenses with friends, family, or colleagues. You can add members and track who owes whom.
                </Text>
              </View>
            </ScrollView>

            {/* Loading indicator */}
            {creating && (
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, top: 0, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={theme.colors.emerald} />
              </View>
            )}
          </View>
        </Modal>
      </View>
    )
  }


  // Main groups list return
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.kicker}>Groups</Text>
            <Text style={styles.headerTitle}>Group expense page</Text>
          </View>
          <Pressable style={styles.iconButton} onPress={() => navigation.navigate('AddExpense')}>
            <Ionicons name="add" size={18} color={theme.colors.navy} />
          </Pressable>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.featureRow}>
            <View>
              <Text style={styles.featureLabel}>Shared balance</Text>
              <Text style={styles.featureValue}>Live groups</Text>
            </View>
            <View style={styles.featurePill}>
              <Ionicons name="people-outline" size={16} color={theme.colors.emerald} />
              <Text style={styles.featurePillText}>{groups.length} active groups</Text>
            </View>
          </View>
          <Text style={styles.featureCopy}>Track who owes whom at a glance, then open any group to see its live expenses and settlements.</Text>
        </View>

        {groups.length === 0 ? (
          <Text style={styles.emptyText}>You are not in any groups yet.</Text>
        ) : groups.map((group) => (
          <View key={group.id} style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <View style={styles.groupTextWrap}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupCategory}>{group.memberCount} members</Text>
              </View>
              <Text style={[styles.groupAmount, group.balance >= 0 ? styles.groupPositive : styles.groupNegative]}>
                {group.balance >= 0 ? '+' : '-'}{formatMoney(Math.abs(group.balance || 0))}
              </Text>
            </View>

            <View style={styles.groupSubRow}>
              <AvatarStack members={group.members || []} accent={theme.colors.emerald} />
              <Text style={styles.groupSummary}>{group.latestExpense ? group.latestExpense.description || 'Latest expense' : 'No expenses yet'}</Text>
            </View>

            <View style={styles.groupActions}>
              <Pressable style={styles.secondaryButton} onPress={() => openGroup(group)}>
                <Text style={styles.secondaryButtonText}>View ledger</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('AddExpense', { groupId: group.id })}>
                <Text style={styles.primaryButtonText}>Add expense</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Floating FABs removed (use header/actions) */}

      {/* Join Group Modal */}
      <Modal visible={showJoinModal} transparent animationType="slide" onRequestClose={() => setShowJoinModal(false)}>
        <View style={styles.createModalContainer}>
          <View style={styles.createModalContent}>
            <Text style={styles.createModalTitle}>Join Group</Text>
            <TextInput
              style={styles.createModalInput}
              placeholder="Enter group ID"
              value={joinGroupId}
              onChangeText={setJoinGroupId}
              placeholderTextColor={theme.colors.mutedSoft}
              editable={!joining}
            />
            <Pressable
              style={[styles.createModalButton, joining && styles.buttonDisabled]}
              onPress={handleJoinGroup}
              disabled={joining}
            >
              {joining ? <ActivityIndicator color="#fff" /> : <Text style={styles.createModalButtonText}>Join</Text>}
            </Pressable>
            <Pressable
              style={styles.createModalCancelButton}
              onPress={() => { setShowJoinModal(false); setJoinGroupId('') }}
              disabled={joining}
            >
              <Text style={styles.createModalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  )
}


