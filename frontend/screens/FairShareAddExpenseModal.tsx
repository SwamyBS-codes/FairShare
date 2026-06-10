import React, { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createExpense, getGroupDetails, getGroups, getUserProfile, updateExpense } from '../utils/api'
import { formatMoney } from '../utils/fairshare'
import { useAppTheme } from '../utils/ThemeProvider'

export default function FairShareAddExpenseModal({ navigation, route }: any) {
  const { theme } = useAppTheme()
  const [groups, setGroups] = useState<any[]>([])
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [saving, setSaving] = useState(false)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [groupId, setGroupId] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<number[]>([])
  const [groupMembers, setGroupMembers] = useState<any[]>([])
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal')
  const [customShares, setCustomShares] = useState<Record<number, string>>({})
  const contextGroupId = route?.params?.groupId
  const editingExpense = route?.params?.expense

  useEffect(() => {
    let active = true

    const loadGroups = async () => {
      try {
        const token = await AsyncStorage.getItem('token')
        if (!token) return

        const apiGroups = await getGroups(token)
        if (!active) return

        if (Array.isArray(apiGroups) && apiGroups.length > 0) {
          setGroups(apiGroups)
          const lastGroupId = await AsyncStorage.getItem('lastGroupId')
          // Prefer the route group, then the last opened group, then the first group.
          const groupToSelect = contextGroupId || lastGroupId || String(apiGroups[0].id)
          setGroupId(groupToSelect)
          const selectedGroup = await getGroupDetails(token, String(groupToSelect))
          const members = selectedGroup.group?.members?.map((member: any) => member.user) || []
          if (active) {
            setGroupMembers(members)
            setSelectedMembers(members.map((member: any) => member.id))
          }
        }
      } catch {
        if (active) {
          setGroups([])
          setGroupId('')
          setGroupMembers([])
          setSelectedMembers([])
        }
      } finally {
        if (active) setLoadingGroups(false)
      }
    }

    loadGroups()

    // If editing an expense, prefill fields
    if (editingExpense) {
      setDescription(editingExpense.description || '')
      setAmount(String(editingExpense.amount || ''))
      if (editingExpense.groupId) setGroupId(String(editingExpense.groupId))
      // set split mode and custom shares if available
      if (editingExpense.shares && editingExpense.shares.length > 0) {
        // if shares are equal-ish, keep equal
        const uniqueShares = new Set(editingExpense.shares.map((s: any) => s.shareAmount))
        if (uniqueShares.size === 1) {
          setSplitMode('equal')
        } else {
          setSplitMode('custom')
          const cs: Record<number, string> = {}
          editingExpense.shares.forEach((s: any) => { cs[s.userId] = String(s.shareAmount) })
          setCustomShares(cs)
          setSelectedMembers(editingExpense.shares.map((s: any) => s.userId))
        }
      }
    }

    return () => {
      active = false
    }
  }, [contextGroupId])

  useEffect(() => {
    let active = true
    const loadMembers = async () => {
      if (!groupId) return
      const token = await AsyncStorage.getItem('token')
      if (!token) return
      const group = await getGroupDetails(token, String(groupId))
      const members = group.group?.members?.map((member: any) => member.user) || []
      if (!active) return
      setGroupMembers(members)
      setSelectedMembers(members.map((member: any) => member.id))
      setCustomShares({})
    }

    loadMembers()
    return () => {
      active = false
    }
  }, [groupId])

  const handleSave = async () => {
    if (!description.trim()) {
      Alert.alert('Missing description', 'Please enter an expense description.')
      return
    }

    if (!amount.trim()) {
      Alert.alert('Missing amount', 'Please enter an amount.')
      return
    }

    try {
      setSaving(true)
      const token = await AsyncStorage.getItem('token')
      console.log('[AddExpense] Token from storage:', token ? `${token.substring(0, 20)}...` : 'null')
      if (!token) throw new Error('No token found')

      const resolvedGroupId = groupId || route?.params?.groupId || await AsyncStorage.getItem('lastGroupId')
      console.log('[AddExpense] GroupId:', resolvedGroupId)
      if (!resolvedGroupId) {
        throw new Error('Please open a group first')
      }

      const numericAmount = Number(amount)
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        throw new Error('Enter a valid amount greater than 0')
      }
      const currentUser = await getUserProfile(token)
      const fallbackMember = currentUser?.user

      const activeMembers = splitMode === 'equal'
        ? (groupMembers.length > 0 ? groupMembers : fallbackMember ? [fallbackMember] : [])
        : (groupMembers.length > 0 ? groupMembers.filter((member) => selectedMembers.includes(member.id)) : fallbackMember ? [fallbackMember] : [])
      if (activeMembers.length === 0) {
        throw new Error('Select at least one participant')
      }

      const shares = splitMode === 'equal'
        ? activeMembers.map((member, index) => ({
            userId: member.id,
            shareAmount: index === activeMembers.length - 1
              ? Number((numericAmount - (numericAmount / activeMembers.length) * (activeMembers.length - 1)).toFixed(2))
              : Number((numericAmount / activeMembers.length).toFixed(2))
          }))
        : activeMembers.map((member) => ({
            userId: member.id,
            shareAmount: Number(customShares[member.id] || 0)
          }))

      const shareTotal = shares.reduce((sum, share) => sum + share.shareAmount, 0)
      if (Math.abs(shareTotal - numericAmount) > 0.01) {
        throw new Error('Split amounts must match the total amount')
      }

      console.log('[AddExpense] Saving expense with:', { groupId: resolvedGroupId, description, amount: numericAmount, shareCount: shares.length })
      if (editingExpense && editingExpense.id) {
        await updateExpense(token, String(editingExpense.id), {
          description: description.trim(),
          amount: numericAmount,
          groupId: Number(resolvedGroupId),
          shares,
        })
        Alert.alert('Expense updated', 'Your expense has been updated.', [
          { text: 'OK', onPress: () => navigation.navigate('Settlements') }
        ])
      } else {
        await createExpense(token, {
          description: description.trim(),
          amount: numericAmount,
          groupId: Number(resolvedGroupId),
          shares,
        })
        Alert.alert('Expense added', 'Your expense has been recorded. View settlements below.', [
          { text: 'OK', onPress: () => navigation.navigate('Settlements') }
        ])
      }
    } catch (err: any) {
      Alert.alert('Could not add expense', err.message || 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const styles = StyleSheet.create({
    flex: { flex: 1 },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(11, 31, 51, 0.38)',
      justifyContent: 'flex-end',
    },
    sheet: {
      maxHeight: '92%',
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 18,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.5)',
    },
    handle: {
      alignSelf: 'center',
      width: 44,
      height: 5,
      borderRadius: 999,
      backgroundColor: theme.colors.line,
      marginBottom: 12,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    kicker: {
      color: theme.colors.emerald,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1.1,
      marginBottom: 6,
    },
    headerTitle: {
      color: theme.colors.text,
      fontSize: 25,
      fontWeight: '800',
      letterSpacing: -0.6,
    },
    closeButton: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.line,
    },
    scrollContent: {
      paddingBottom: 20,
    },
    previewCard: {
      backgroundColor: theme.colors.navy,
      borderRadius: 24,
      padding: 18,
      marginBottom: 16,
    },
    previewLabel: {
      color: 'rgba(255,255,255,0.68)',
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    previewValue: {
      marginTop: 10,
      color: theme.colors.surface,
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: -0.7,
    },
    previewCopy: {
      marginTop: 8,
      color: 'rgba(255,255,255,0.8)',
      fontSize: 13,
      lineHeight: 20,
    },
    fieldWrap: { marginBottom: 14 },
    rowFields: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    rowField: { flex: 1 },
    fieldLabel: {
      marginBottom: 8,
      color: theme.colors.textSoft,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.line,
      borderRadius: theme.radius.md,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: theme.colors.text,
      fontSize: 15,
    },
    pickerWrap: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.line,
      borderRadius: theme.radius.md,
      overflow: 'hidden',
    },
    modeRow: { flexDirection: 'row', gap: 8 },
    modePill: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.line,
      alignItems: 'center',
    },
    modePillActive: { backgroundColor: theme.colors.navy, borderColor: theme.colors.navy },
    modeText: { color: theme.colors.textSoft, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
    modeTextActive: { color: theme.colors.surface },
    groupRow: { gap: 8, paddingVertical: 2 },
    groupPill: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.line,
    },
    groupPillActive: { backgroundColor: theme.colors.navy, borderColor: theme.colors.navy },
    groupPillText: { color: theme.colors.textSoft, fontSize: 12, fontWeight: '700' },
    groupPillTextActive: { color: theme.colors.surface },
    memberPreview: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.line,
      marginBottom: 16,
    },
    memberPreviewLabel: { color: theme.colors.text, fontSize: 14, fontWeight: '800', marginBottom: 12 },
    memberRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    memberBubble: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: theme.colors.background },
    memberBubbleActive: { backgroundColor: theme.colors.emeraldTint },
    memberBubbleText: { color: theme.colors.textSoft, fontSize: 12, fontWeight: '700' },
    memberBubbleTextActive: { color: theme.colors.emeraldDark },
    customShareRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    customShareName: { flex: 1, color: theme.colors.text, fontSize: 13, fontWeight: '700' },
    customShareInput: {
      width: 110,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.line,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: theme.colors.text,
      fontSize: 14,
      textAlign: 'right',
    },
    saveButton: { height: 54, borderRadius: 16, backgroundColor: theme.colors.emerald, alignItems: 'center', justifyContent: 'center' },
    saveText: { color: theme.colors.surface, fontSize: 16, fontWeight: '800' },
  })

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ paddingTop: 42, paddingHorizontal: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable onPress={() => navigation.goBack()} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>
        <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '800' }}>{editingExpense ? 'Edit expense' : 'Add expense'}</Text>
        <Pressable onPress={handleSave} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="checkmark" size={24} color={theme.colors.emerald} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ marginTop: 12, marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.emerald, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="people" size={16} color={theme.colors.surface} />
            </View>
            <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '700' }}>With you and:</Text>
            <View style={{ marginLeft: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line }}>
              <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{groups.find(g => String(g.id) === String(groupId))?.name || 'Group'}</Text>
            </View>
          </View>
        </View>

        <View style={{ marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.line }}>
              <Ionicons name="receipt-outline" size={20} color={theme.colors.navy} />
            </View>
            <TextInput
              style={{ flex: 1, borderBottomWidth: 1, borderBottomColor: theme.colors.navy, paddingVertical: 6, color: theme.colors.text, fontSize: 16 }}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter a description"
              placeholderTextColor={theme.colors.mutedSoft}
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.line }}>
              <Ionicons name="cash" size={20} color={theme.colors.navy} />
            </View>
            <TextInput
              style={{ flex: 1, fontSize: 34, color: theme.colors.text, paddingVertical: 8 }}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={theme.colors.mutedSoft}
            />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 18 }}>
          <Text style={{ color: theme.colors.textSoft, fontSize: 14 }}>Paid by</Text>
          <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line }}>
            <Text style={{ color: theme.colors.text, fontWeight: '700' }}>you</Text>
          </View>
          <Text style={{ color: theme.colors.textSoft, fontSize: 14 }}>and split</Text>
          <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line }}>
            <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{splitMode === 'equal' ? 'equally' : 'custom'}</Text>
          </View>
        </View>

        {splitMode === 'equal' ? (
          <View style={{ backgroundColor: theme.colors.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.colors.line, marginBottom: 18 }}>
            <Text style={{ color: theme.colors.text, fontWeight: '700', marginBottom: 8 }}>Equal split</Text>
            <Text style={{ color: theme.colors.textSoft, fontSize: 13, lineHeight: 19 }}>
              This expense will be divided equally across all members in the group.
            </Text>
          </View>
        ) : (
          groupMembers.length > 0 ? (
            <View style={{ backgroundColor: theme.colors.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.colors.line, marginBottom: 18 }}>
              <Text style={{ color: theme.colors.text, fontWeight: '700', marginBottom: 8 }}>Participants</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {groupMembers.map((member) => (
                  <Pressable key={member.id} onPress={() => setSelectedMembers((current) => current.includes(member.id) ? current.filter((id) => id !== member.id) : [...current, member.id])} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: selectedMembers.includes(member.id) ? theme.colors.emeraldTint : theme.colors.background, borderWidth: 1, borderColor: theme.colors.line, marginRight: 8, marginBottom: 8 }}>
                    <Text style={{ color: selectedMembers.includes(member.id) ? theme.colors.emeraldDark : theme.colors.text }}>{member.name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <View style={{ backgroundColor: theme.colors.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.colors.line, marginBottom: 18 }}>
              <Text style={{ color: theme.colors.text, fontWeight: '700', marginBottom: 8 }}>Participants</Text>
              <Text style={{ color: theme.colors.textSoft, fontSize: 13, lineHeight: 19 }}>
                This group only has you, so the expense will be added against your account.
              </Text>
            </View>
          )
        )}

        {splitMode === 'custom' && (
          <View style={{ marginBottom: 18 }}>
            <Text style={{ color: theme.colors.text, fontWeight: '700', marginBottom: 8 }}>Custom shares</Text>
            {groupMembers.filter((m) => selectedMembers.includes(m.id)).map((member) => (
              <View key={member.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ flex: 1, color: theme.colors.text }}>{member.name}</Text>
                <TextInput style={{ width: 120, textAlign: 'right', color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.line, borderRadius: 10, padding: 8 }} value={customShares[member.id] || ''} onChangeText={(text) => setCustomShares((c) => ({ ...c, [member.id]: text }))} keyboardType="decimal-pad" />
              </View>
            ))}
          </View>
        )}

        <Pressable onPress={handleSave} style={{ height: 56, borderRadius: 12, backgroundColor: theme.colors.emerald, alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
          {saving ? <ActivityIndicator color={theme.colors.surface} /> : <Text style={{ color: theme.colors.surface, fontWeight: '800' }}>Save</Text>}
        </Pressable>
      </ScrollView>

      <View style={{ position: 'absolute', left: 18, right: 18, bottom: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.line }}>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.navy} />
          </Pressable>
          <Pressable style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.line }}>
            <Ionicons name="camera-outline" size={20} color={theme.colors.navy} />
          </Pressable>
          <Pressable style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.line }}>
            <Ionicons name="create-outline" size={20} color={theme.colors.navy} />
          </Pressable>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: theme.colors.textSoft, fontSize: 12 }}>Group</Text>
          <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{groups.find(g => String(g.id) === String(groupId))?.name || ''}</Text>
        </View>
      </View>
    </View>
  )
}

 