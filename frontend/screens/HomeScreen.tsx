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
import { getDashboard } from '../utils/api'

export default function HomeScreen({ navigation }: any) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    React.useCallback(() => {
      fetchDashboard()
    }, [])
  )

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem('token')
      if (!token) throw new Error('No token found')
      const result = await getDashboard(token)
      setData(result)
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token')
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    })
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6b5b95" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FairShare</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Groups</Text>
          <Text style={styles.summaryValue}>{data?.totalGroups || 0}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Expenses</Text>
          <Text style={[styles.summaryValue, { color: '#2196F3' }]}>
            ${data?.totalExpenses || 0}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>You Owe</Text>
          <Text style={[styles.summaryValue, { color: '#f44336' }]}>
            ${data?.youOwe || 0}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Owed to You</Text>
          <Text style={[styles.summaryValue, { color: '#4caf50' }]}>
            ${data?.owedToYou || 0}
          </Text>
        </View>
      </View>

      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Groups')}
        >
          <Text style={styles.navButtonText}>👥 Groups</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Expenses')}
        >
          <Text style={styles.navButtonText}>💰 Expenses</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Settlements')}
        >
          <Text style={styles.navButtonText}>✓ Settlements</Text>
        </TouchableOpacity>
      </View>

      {data?.recentActivity && data.recentActivity.length > 0 && (
        <View style={styles.activityContainer}>
          <Text style={styles.activityTitle}>Recent Activity</Text>
          {data.recentActivity.map((activity: any, idx: number) => (
            <View key={idx} style={styles.activityItem}>
              <Text style={styles.activityDesc}>{activity.description}</Text>
              <Text style={styles.activityAmount}>${activity.amount}</Text>
              <Text style={styles.activityDate}>{activity.date}</Text>
            </View>
          ))}
        </View>
      )}
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
    backgroundColor: '#6b5b95',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutBtn: {
    backgroundColor: '#d32f2f',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  summaryContainer: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryLabel: {
    color: '#666',
    fontSize: 12,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6b5b95',
  },
  navigationContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  navButton: {
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
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b5b95',
  },
  activityContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  activityItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  activityDesc: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6b5b95',
    marginTop: 4,
  },
  activityDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
})
