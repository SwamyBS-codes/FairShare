import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native'
import { getExpenseDetails, deleteExpense } from '../utils/api'
import { formatMoney } from '../utils/fairshare'
import { useAppTheme } from '../utils/ThemeProvider'

export default function FairShareExpenseDetailsScreen({ navigation, route }: any) {
  const { theme } = useAppTheme()
  const { expenseId, groupId } = route.params || {}
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [expense, setExpense] = useState<any>(null)

  useFocusEffect(
    React.useCallback(() => {
      const loadExpenseDetails = async () => {
        try {
          setLoading(true)
          const token = await AsyncStorage.getItem('token')
          if (!token) throw new Error('No token found')

          if (!expenseId) {
            throw new Error('No expense ID provided')
          }

          const data = await getExpenseDetails(token, expenseId)
          setExpense(data)
        } catch (err: any) {
          Alert.alert('Error', err.message || 'Could not load expense details')
          navigation.goBack()
        } finally {
          setLoading(false)
        }
      }

      loadExpenseDetails()
    }, [expenseId, navigation])
  )

  const handleDelete = async () => {
    Alert.alert(
      'Delete expense',
      'This action cannot be undone. Delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true)
              const token = await AsyncStorage.getItem('token')
              if (!token) throw new Error('No token')
              await deleteExpense(token, expenseId)
              Alert.alert('Deleted', 'Expense deleted successfully')
              navigation.goBack()
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not delete expense')
            } finally {
              setDeleting(false)
            }
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.emerald} />
      </View>
    )
  }

  if (!expense) {
    return (
      <View style={styles.errorState}>
        <Text style={styles.errorText}>Expense not found</Text>
      </View>
    )
  }

  const paidBy = expense.paidBy || {}
  const splitDetails = expense.splits || []
  const createdDate = new Date(expense.createdAt)
  const isOwner = expense.isOwner || false

  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
    loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
    errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
    errorText: { color: theme.colors.textSoft, fontSize: 16 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    headerTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '800' },
    amountCard: { backgroundColor: theme.colors.navy, borderRadius: 24, padding: 24, marginBottom: 20, ...theme.shadows.lg },
    amountLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600', marginBottom: 8 },
    amountValue: { color: theme.colors.surface, fontSize: 42, lineHeight: 48, fontWeight: '800', letterSpacing: -1.5, marginBottom: 14 },
    amountMeta: { flexDirection: 'row', gap: 16 },
    amountMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    amountMetaText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' },
    card: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: theme.colors.line, ...theme.shadows.sm },
    cardTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800', marginBottom: 14, letterSpacing: -0.3 },
    paidByRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatarCircle: { width: 48, height: 48, borderRadius: 12, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: theme.colors.surface, fontSize: 16, fontWeight: '800' },
    paidByInfo: { flex: 1 },
    paidByName: { color: theme.colors.text, fontSize: 15, fontWeight: '800' },
    paidByAmount: { color: theme.colors.textSoft, fontSize: 12, marginTop: 2 },
    badge: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(16,185,129,0.1)', alignItems: 'center', justifyContent: 'center' },
    splitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.colors.line },
    splitLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    avatarSmall: { width: 40, height: 40, borderRadius: 10, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
    avatarSmallText: { color: theme.colors.surface, fontSize: 13, fontWeight: '800' },
    splitName: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
    splitStatus: { color: theme.colors.textSoft, fontSize: 12, marginTop: 2 },
    splitAmount: { fontSize: 14, fontWeight: '800' },
    splitPaid: { color: theme.colors.success },
    splitOwes: { color: theme.colors.danger },
    emptyText: { color: theme.colors.textSoft, fontSize: 14, fontStyle: 'italic' },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    infoLabel: { color: theme.colors.textSoft, fontSize: 13, fontWeight: '600' },
    infoValue: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
    actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
    editButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderColor: theme.colors.primary, borderRadius: 14, paddingVertical: 14 },
    editButtonText: { color: theme.colors.primary, fontSize: 14, fontWeight: '800' },
    deleteButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 14, paddingVertical: 14 },
    deleteButtonText: { color: theme.colors.danger, fontSize: 14, fontWeight: '800' },
  })

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Expense details</Text>
        {isOwner && (
          <Pressable onPress={handleDelete} disabled={deleting}>
            <Ionicons name="trash-outline" size={24} color={theme.colors.danger} />
          </Pressable>
        )}
      </View>

      {/* Amount Card */}
      <View style={styles.amountCard}>
        <Text style={styles.amountLabel}>{expense.description || 'Expense'}</Text>
        <Text style={styles.amountValue}>{formatMoney(expense.amount)}</Text>
        <View style={styles.amountMeta}>
          <View style={styles.amountMetaItem}>
            <Ionicons name="calendar-outline" size={14} color={theme.colors.textSoft} />
            <Text style={styles.amountMetaText}>{createdDate.toLocaleDateString()}</Text>
          </View>
          <View style={styles.amountMetaItem}>
            <Ionicons name="time-outline" size={14} color={theme.colors.textSoft} />
            <Text style={styles.amountMetaText}>{createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
        </View>
      </View>

      {/* Paid By Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Paid by</Text>
        <View style={styles.paidByRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{(paidBy.name || 'U').slice(0, 2).toUpperCase()}</Text>
          </View>
          <View style={styles.paidByInfo}>
            <Text style={styles.paidByName}>{paidBy.name || 'Unknown'}</Text>
            <Text style={styles.paidByAmount}>{formatMoney(expense.amount)} paid</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
          </View>
        </View>
      </View>

      {/* Split Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Split among {splitDetails.length} people</Text>
        {splitDetails.length === 0 ? (
          <Text style={styles.emptyText}>No split details available</Text>
        ) : (
          splitDetails.map((split: any, idx: number) => (
            <View key={idx} style={styles.splitRow}>
              <View style={styles.splitLeft}>
                <View style={styles.avatarSmall}>
                  <Text style={styles.avatarSmallText}>{(split.participantName || 'U').slice(0, 2).toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.splitName}>{split.participantName || 'Unknown'}</Text>
                  <Text style={styles.splitStatus}>
                    {split.paid ? '✓ Settled' : `Owes ${formatMoney(split.amount)}`}
                  </Text>
                </View>
              </View>
              <Text style={[styles.splitAmount, split.participantId === paidBy.id ? styles.splitPaid : styles.splitOwes]}>
                {split.participantId === paidBy.id ? 'Paid' : 'Owes'} {formatMoney(split.amount)}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Additional Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Additional info</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Group</Text>
          <Text style={styles.infoValue}>{expense.groupName || 'Unknown Group'}</Text>
        </View>
        <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: theme.colors.line, paddingTop: 12, marginTop: 12 }]}>
          <Text style={styles.infoLabel}>Category</Text>
          <Text style={styles.infoValue}>{expense.category || 'Uncategorized'}</Text>
        </View>
        <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: theme.colors.line, paddingTop: 12, marginTop: 12 }]}>
          <Text style={styles.infoLabel}>Status</Text>
          <Text style={[styles.infoValue, { color: theme.colors.success }]}>Active</Text>
        </View>
      </View>

      {/* Action Buttons */}
      {isOwner && (
        <View style={styles.actions}>
          <Pressable style={styles.editButton} onPress={() => navigation.navigate('AddExpense', { expenseId, groupId })}>
            <Ionicons name="pencil" size={18} color={theme.colors.primary} />
            <Text style={styles.editButtonText}>Edit expense</Text>
          </Pressable>
          <Pressable style={styles.deleteButton} onPress={handleDelete} disabled={deleting}>
            {deleting ? (
              <ActivityIndicator size="small" color={theme.colors.danger} />
            ) : (
              <>
                <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </ScrollView>
  )
}


