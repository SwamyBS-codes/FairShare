import React, { useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Share,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import QRCode from 'react-native-qrcode-svg'
import { getGroups, createGroup, addGroupMember, getUserProfile, getGroupDetails, getGroupExpenses, getGroupSettlements, getGroupBalance } from '../utils/api'

export default function GroupsScreen({ navigation, route }: any) {
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [creating, setCreating] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinGroupId, setJoinGroupId] = useState('')
  const [joining, setJoining] = useState(false)
  const [qrModalVisible, setQrModalVisible] = useState(false)
  const [qrModalGroup, setQrModalGroup] = useState<any>(null)
  const [groupDetail, setGroupDetail] = useState<any>(null)
  const [groupExpenses, setGroupExpenses] = useState<any[]>([])
  const [groupSettlements, setGroupSettlements] = useState<any[]>([])
  const [groupBalance, setGroupBalance] = useState<any>(null)
  const [detailTab, setDetailTab] = useState<'settle'|'balances'|'total'|'charts'|'whiteboard'>('settle')
  const [whiteboardText, setWhiteboardText] = useState('')
  const [memberSearchText, setMemberSearchText] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)

  useFocusEffect(
    React.useCallback(() => {
      fetchGroups()

      // If navigation asked the Groups screen to open the action menu, handle it
      const openAction = route?.params?.openActionMenu
      if (openAction) {
        setShowActionMenu(true)
        // clear the param so it doesn't reopen repeatedly
        navigation.setParams({ openActionMenu: undefined })
      }

      // If navigation requested the create modal, show it
      const openCreate = route?.params?.openCreate
      if (openCreate) {
        setShowCreateModal(true)
        try {
          navigation.setParams({ openCreate: undefined })
        } catch {}
      }

      const openSearch = route?.params?.openSearch
      if (openSearch) {
        setMemberSearchText('')
        navigation.setParams({ openSearch: undefined })
        // focus the search input if available
        setTimeout(() => {
          try {
            (searchInputRef as any)?.current?.focus()
          } catch {}
        }, 300)
      }
    }, [navigation, route])
  )

  // ref for the member search input so we can focus it when requested
  const searchInputRef = React.useRef<any>(null)

  const fetchGroups = async () => {
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem('token')
      if (!token) throw new Error('No token found')
      const [result, profile] = await Promise.all([getGroups(token), getUserProfile(token)])
      setGroups(result || [])
      setCurrentUser(profile?.user || null)
    } catch (err: any) {
      Alert.alert('Error', err.message)
      setGroups([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name')
      return
    }

    try {
      setCreating(true)
      const token = await AsyncStorage.getItem('token')
      if (!token) throw new Error('No token found')
      const newGroup = await createGroup(token, { name: groupName.trim(), description: '' })
      setGroupName('')
      setShowCreateModal(false)
      setShowActionMenu(false)
      await fetchGroups()
      // Navigate to group detail (load live detail)
      // `createGroup` returns { group }
      await openGroup(newGroup.group || newGroup)
      Alert.alert('Success', 'Group created successfully')
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setCreating(false)
    }
  }

  const openGroup = async (group: any) => {
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem('token')
      if (!token) throw new Error('No token found')
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
      setSelectedGroup(details.group)
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not load group')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6b5b95" />
      </View>
    )
  }

  // Show group detail view if a group is selected
  if (selectedGroup) {
    return (
      <View style={styles.container}>
        {/* Group Detail Header */}
        <View style={styles.groupDetailHeader}>
          <TouchableOpacity onPress={() => setSelectedGroup(null)}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.groupDetailTitle}>{groupDetail?.name || selectedGroup.name}</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Top tabs: settle, balances, total, charts, whiteboard, export */}
        <View style={styles.topTabsContainer}>
          {[
            { key: 'settle', label: 'Settle up' },
            { key: 'balances', label: 'Balances' },
            { key: 'total', label: 'Total' },
            { key: 'charts', label: 'Charts' },
            { key: 'whiteboard', label: 'Whiteboard' },
            { key: 'export', label: 'Export' },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.topTab, detailTab === (t.key as any) && styles.topTabActive]}
              onPress={async () => {
                if (t.key === 'export') {
                  await exportGroupCSV()
                  return
                }
                setDetailTab(t.key as any)
              }}
            >
              <Text style={[styles.topTabText, detailTab === (t.key as any) && styles.topTabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.groupDetailContent}>
          {/* Invite Section */}
          <View style={styles.inviteCard}>
            <Text style={styles.inviteTitle}>Invite someone to this group</Text>
            <Text style={styles.inviteSubtitle}>Add a friend or roommate to start splitting expenses together.</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity style={styles.shareButton} onPress={async () => {
                  try {
                    const link = `https://fairshare.app/join/${selectedGroup.id}`
                    const message = `Join my FairShare group "${selectedGroup.name}"\n\nOpen: ${link}\nOr use Group ID: ${selectedGroup.id}`
                    await Share.share({ message, title: `Join ${selectedGroup.name}` })
                  } catch {
                    Alert.alert('Error', 'Unable to open share dialog')
                  }
                }}>
                  <Text style={styles.shareButtonText}>Share →</Text>
                </TouchableOpacity>

                {/* QR Code for group invite */}
                <View style={{ padding: 8, backgroundColor: '#fff', borderRadius: 8 }}>
                  <QRCode value={String(selectedGroup.id)} size={80} />
                </View>
              </View>
          </View>

          {/* Summary Cards */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Expense</Text>
              <Text style={styles.summaryAmount}>{groupExpenses.reduce((s,a)=>s+Number(a.amount||0),0).toFixed(2)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>You Spent</Text>
              <Text style={styles.summaryAmount}>{groupExpenses.filter(e=>e.createdBy?.id===currentUser?.id).reduce((s,a)=>s+Number(a.amount||0),0).toFixed(2)}</Text>
            </View>
          </View>

          {/* Detail tab content */}
          <View style={styles.detailTabContent}>
            {detailTab === 'settle' && (
              <View>
                <Text style={styles.sectionTitle}>Pending Settlements</Text>
                {groupSettlements.length === 0 ? <Text style={styles.emptyText}>No pending settlements.</Text> : groupSettlements.map((s: any) => (
                  <View key={s.id} style={styles.settlementRow}>
                    <Text style={styles.rowTitle}>{s.paidBy?.name} → {s.paidTo?.name}</Text>
                    <Text style={styles.rowAmount}>{s.amount}</Text>
                  </View>
                ))}
              </View>
            )}

            {detailTab === 'balances' && (
              <View>
                <Text style={styles.sectionTitle}>Balances</Text>
                {groupBalance?.balances && Object.values(groupBalance.balances).length > 0 ? Object.values(groupBalance.balances).map((b: any) => (
                  <View key={b.name} style={styles.memberRow}>
                    <Text style={styles.memberName}>{b.name}</Text>
                    <Text style={styles.memberEmail}>Owes {Number(b.owes).toFixed(2)}</Text>
                  </View>
                )) : <Text style={styles.emptyText}>No balances to show.</Text>}
              </View>
            )}

            {detailTab === 'total' && (
              <View>
                <Text style={styles.sectionTitle}>Totals</Text>
                <Text style={styles.emptyText}>Expenses: {groupExpenses.length} · Settlements: {groupSettlements.length}</Text>
              </View>
            )}

            {detailTab === 'charts' && (
              <View>
                <Text style={styles.sectionTitle}>Charts</Text>
                <Text style={styles.emptyText}>Chart summaries will be shown here.</Text>
              </View>
            )}

            {detailTab === 'whiteboard' && (
              <View>
                <Text style={styles.sectionTitle}>Whiteboard</Text>
                <TextInput value={whiteboardText} onChangeText={setWhiteboardText} multiline style={styles.whiteboardInput} placeholder="Notes, ideas, reminders" placeholderTextColor="#666" />
                <TouchableOpacity style={styles.createModalButton} onPress={() => Alert.alert('Saved', 'Whiteboard saved locally (session)')}>
                  <Text style={styles.createModalButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.settleButton}>
              <Text style={styles.settleButtonText}>Settle Up</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.premiumButton}>
              <Text style={styles.premiumButtonText}>Unlock Premium</Text>
            </TouchableOpacity>
          </View>

          {/* Expense Range */}
          <View style={styles.expenseRangeContainer}>
            <Text style={styles.rangeLabel}>Expense Range</Text>
            <View style={styles.rangeDropdown}>
              <Text style={styles.dropdownText}>All time</Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </View>
          </View>

          {/* Expenses List */}
          <Text style={styles.expensesTitle}>Expenses</Text>
          <View style={styles.emptyExpenses}>
            <Text style={styles.emptyExpensesText}>No expenses yet</Text>
          </View>
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>👤</Text>
        <Text style={styles.headerTitle}>FairShare</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={() => setShowCreateModal(true)} style={{ marginRight: 8 }}>
            <Text style={{ fontSize: 18 }}>✎</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowJoinModal(true)} style={{ marginRight: 8 }}>
            <Text style={{ fontSize: 18 }}>🔗</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tab, styles.activeTab]}>
          <Text style={styles.activeTabText}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Archived</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>You Owe</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>You Get</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {groups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No group where you get paid.</Text>
            <Text style={styles.emptySubtitle}>Try all tab.</Text>
          </View>
        ) : (
          <View>
            {groups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={styles.groupCard}
                onPress={() => openGroup(group)}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    {group.description && (
                      <Text style={styles.groupDesc}>{group.description}</Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => { setQrModalGroup(group); setQrModalVisible(true) }}>
                    <Text style={{ fontSize: 18 }}>🔳</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating FABs removed; use header/action menu for Create/Join */}

      {/* Action Menu Modal */}
      <Modal
        visible={showActionMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.actionMenuContainer}>
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                setShowActionMenu(false)
                setShowCreateModal(true)
              }}
            >
              <Text style={styles.actionMenuIcon}>✎</Text>
              <Text style={styles.actionMenuText}>Create Group</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                setShowActionMenu(false)
                setShowJoinModal(true)
              }}
            >
              <Text style={styles.actionMenuIcon}>🔗</Text>
              <Text style={styles.actionMenuText}>Join Group</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionMenuItem, styles.cancelMenuItem]}
              onPress={() => setShowActionMenu(false)}
            >
              <Text style={styles.cancelMenuText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Group Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.createModalContainer}>
          <View style={styles.createModalContent}>
            <Text style={styles.createModalTitle}>Create Group</Text>
            <TextInput
              style={styles.createModalInput}
              placeholder="Group Name"
              value={groupName}
              onChangeText={setGroupName}
              placeholderTextColor="#999"
              editable={!creating}
            />
            <TouchableOpacity
              style={[styles.createModalButton, creating && styles.buttonDisabled]}
              onPress={handleCreateGroup}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.createModalButtonText}>Create</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createModalCancelButton}
              onPress={() => {
                setShowCreateModal(false)
                setGroupName('')
              }}
              disabled={creating}
            >
              <Text style={styles.createModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Join Group Modal */}
      <Modal
        visible={showJoinModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.createModalContainer}>
          <View style={styles.createModalContent}>
            <Text style={styles.createModalTitle}>Join Group</Text>
            <TextInput
              style={styles.createModalInput}
              placeholder="Enter group ID"
              value={joinGroupId}
              onChangeText={setJoinGroupId}
              placeholderTextColor="#999"
              editable={!joining}
            />
            <TouchableOpacity style={[styles.createModalButton, { marginTop: 10 }]} onPress={() => {
              // Navigate to QR scanner to allow scanning a group QR
              // The scanner will return a groupId via navigation params
              setShowJoinModal(false)
              navigation.navigate('QRScanner')
            }}>
              <Text style={styles.createModalButtonText}>Scan QR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createModalButton, joining && styles.buttonDisabled]}
              onPress={async () => {
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
                  await fetchGroups()
                  Alert.alert('Success', 'Joined group')
                } catch (err: any) {
                  Alert.alert('Error', err.message || String(err))
                } finally {
                  setJoining(false)
                }
              }}
              disabled={joining}
            >
              {joining ? <ActivityIndicator color="#fff" /> : <Text style={styles.createModalButtonText}>Join</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createModalCancelButton}
              onPress={() => {
                setShowJoinModal(false)
                setJoinGroupId('')
              }}
              disabled={joining}
            >
              <Text style={styles.createModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* QR Modal for group invite */}
      <Modal visible={qrModalVisible} transparent animationType="fade" onRequestClose={() => setQrModalVisible(false)}>
        <View style={styles.createModalContainer}>
          <View style={styles.createModalContent}>
            <Text style={styles.createModalTitle}>Group QR</Text>
            {qrModalGroup ? (
              <View style={{ alignItems: 'center', padding: 12 }}>
                <QRCode value={String(qrModalGroup.id)} size={160} />
                <Text style={{ marginTop: 12 }}>{qrModalGroup.name}</Text>
                <Text style={{ color: '#666', marginTop: 6 }}>ID: {qrModalGroup.id}</Text>
              </View>
            ) : (
              <Text style={styles.emptyText}>No group selected</Text>
            )}
            <TouchableOpacity style={styles.createModalCancelButton} onPress={() => setQrModalVisible(false)}>
              <Text style={styles.createModalCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

  // export util inside component
  const exportGroupCSV = async () => {
    try {
      const rows: string[] = []
      rows.push('Members')
      rows.push('id,name,email')
      ;(groupDetail?.members || []).forEach((m: any) => rows.push(`${m.user.id},"${m.user.name}",${m.user.email}`))
      rows.push('')
      rows.push('Expenses')
      rows.push('id,description,amount,createdBy,createdAt')
      ;(groupExpenses || []).forEach((e: any) => rows.push(`${e.id},"${(e.description||'').replace(/"/g,'""')}",${e.amount},"${e.createdBy?.name||''}",${e.createdAt}`))
      rows.push('')
      rows.push('Settlements')
      rows.push('id,from,to,amount,settled,createdAt')
      ;(groupSettlements || []).forEach((s: any) => rows.push(`${s.id},"${s.paidBy?.name||''}","${s.paidTo?.name||''}",${s.amount},${s.settled},${s.createdAt}`))

      const csv = rows.join('\n')
      await Share.share({ title: `Export ${groupDetail?.name || 'group'}`, message: csv })
    } catch {
      Alert.alert('Error', 'Could not export group data')
    }
  }
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2a1f4d',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a1f4d',
  },
  // Header Styles
  header: {
    backgroundColor: '#2a1f4d',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  menuIcon: {
    fontSize: 20,
    color: '#fff',
  },
  // Tabs
  tabsContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#8b5fbf',
  },
  tabText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  activeTabText: {
    fontSize: 13,
    color: '#8b5fbf',
    fontWeight: '600',
  },
  // Content
  content: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  // Group Card
  groupCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  groupDesc: {
    fontSize: 13,
    color: '#666',
  },
  // FAB (Floating Action Button)
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8b5fbf',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabIcon: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
  },
  floatingActions: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    alignItems: 'center',
  },
  smallFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8b5fbf',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  smallFabIcon: {
    fontSize: 20,
    color: '#fff',
  },
  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  // Action Menu
  actionMenuContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  actionMenuIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  actionMenuText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  cancelMenuItem: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 8,
  },
  cancelMenuText: {
    fontSize: 16,
    color: '#8b5fbf',
    fontWeight: '500',
  },
  // Create Modal
  createModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  createModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
    width: '100%',
  },
  createModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  createModalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 20,
    color: '#333',
  },
  createModalButton: {
    backgroundColor: '#8b5fbf',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  createModalButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  createModalCancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  createModalCancelText: {
    color: '#8b5fbf',
    fontSize: 15,
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  // Group Detail View
  groupDetailHeader: {
    backgroundColor: '#2a1f4d',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  groupDetailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  groupDetailContent: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  // Invite Card
  inviteCard: {
    backgroundColor: '#f5f0ff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5fbf',
  },
  inviteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  inviteSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  shareButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  shareButtonText: {
    fontSize: 13,
    color: '#8b5fbf',
    fontWeight: '600',
  },
  // Summary Cards
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  settleButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#8b5fbf',
    marginRight: 8,
    alignItems: 'center',
  },
  settleButtonText: {
    color: '#8b5fbf',
    fontWeight: '600',
    fontSize: 14,
  },
  premiumButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#8b5fbf',
    marginLeft: 8,
    alignItems: 'center',
  },
  premiumButtonText: {
    color: '#8b5fbf',
    fontWeight: '600',
    fontSize: 14,
  },
  // Expense Range
  expenseRangeContainer: {
    marginBottom: 20,
  },
  rangeLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
    fontWeight: '500',
  },
  rangeDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#5b9bff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#999',
  },
  // Expenses
  expensesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  emptyExpenses: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyExpensesText: {
    fontSize: 14,
    color: '#999',
  },
})
