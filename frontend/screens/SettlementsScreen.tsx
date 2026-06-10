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
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getSettlements, settlePayment } from '../utils/api'

export default function SettlementsScreen({ navigation }: any) {
  const [settlements, setSettlements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    React.useCallback(() => {
      fetchSettlements()
    }, [])
  )

  const fetchSettlements = async () => {
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem('token')
      if (!token) throw new Error('No token found')
      const result = await getSettlements(token)
      setSettlements(result)
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSettlePayment = async (settlementId: string) => {
    try {
      const token = await AsyncStorage.getItem('token')
      if (!token) throw new Error('No token found')
      await settlePayment(token, settlementId)
      Alert.alert('Success', 'Settlement marked as paid')
      await fetchSettlements()
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  const handleGoBack = () => {
    navigation.goBack()
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4caf50" />
      </View>
    )
  }

  const unsettled = settlements.filter((s) => !s.isSettled)
  const settled = settlements.filter((s) => s.isSettled)

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settlements</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.content}>
        {unsettled.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Pending Settlements</Text>
            {unsettled.map((settlement) => (
              <View key={settlement.id} style={styles.settlementCard}>
                <View style={styles.settlementInfo}>
                  <Text style={styles.settlementText}>
                    {settlement.payerName} owes {settlement.payeeName}
                  </Text>
                  <Text style={styles.settlementAmount}>${settlement.amount}</Text>
                </View>
                <TouchableOpacity
                  style={styles.settleButton}
                  onPress={() => handleSettlePayment(settlement.id)}
                >
                  <Text style={styles.settleButtonText}>Mark Settled</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {unsettled.length === 0 && settled.length === 0 && (
          <Text style={styles.emptyText}>No settlements. All settled up!</Text>
        )}

        {settled.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={styles.sectionTitle}>Settlement History</Text>
            {settled.map((settlement) => (
              <View key={settlement.id} style={styles.historyCard}>
                <View style={styles.historyRow}>
                  <Text style={styles.historyLabel}>From:</Text>
                  <Text style={styles.historyValue}>{settlement.payerName}</Text>
                </View>
                <View style={styles.historyRow}>
                  <Text style={styles.historyLabel}>To:</Text>
                  <Text style={styles.historyValue}>{settlement.payeeName}</Text>
                </View>
                <View style={styles.historyRow}>
                  <Text style={styles.historyLabel}>Amount:</Text>
                  <Text style={[styles.historyValue, styles.amount]}>
                    ${settlement.amount}
                  </Text>
                </View>
                <View style={styles.historyRow}>
                  <Text style={styles.historyLabel}>Settled:</Text>
                  <Text style={styles.historyValue}>{settlement.settledDate}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#4caf50',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 16,
  },
  settlementCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  settlementInfo: {
    marginBottom: 12,
  },
  settlementText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settlementAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f44336',
  },
  settleButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  settleButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  historyContainer: {
    marginTop: 20,
  },
  historyCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  historyValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  amount: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 20,
  },
})
