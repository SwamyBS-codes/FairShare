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
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getExpenses, createExpense } from '../utils/api'

export default function ExpensesScreen({ navigation }: any) {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    groupId: '',
    category: 'food',
  })

  useFocusEffect(
    React.useCallback(() => {
      fetchExpenses()
    }, [])
  )

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem('token')
      if (!token) throw new Error('No token found')
      const result = await getExpenses(token)
      setExpenses(result)
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateExpense = async () => {
    if (!formData.description.trim() || !formData.amount) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    try {
      const token = await AsyncStorage.getItem('token')
      if (!token) throw new Error('No token found')
      await createExpense(token, {
        ...formData,
        amount: parseFloat(formData.amount),
      })
      setFormData({ description: '', amount: '', groupId: '', category: 'food' })
      setShowForm(false)
      await fetchExpenses()
      Alert.alert('Success', 'Expense added successfully')
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
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expenses</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowForm(!showForm)}
        >
          <Text style={styles.createButtonText}>
            {showForm ? '✕ Cancel' : '+ Add Expense'}
          </Text>
        </TouchableOpacity>

        {showForm && (
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              placeholder="Amount"
              value={formData.amount}
              onChangeText={(text) =>
                setFormData({ ...formData, amount: text })
              }
              keyboardType="decimal-pad"
              placeholderTextColor="#999"
            />
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Category</Text>
              <Picker
                selectedValue={formData.category}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, category: value })
                }
                style={styles.picker}
              >
                <Picker.Item label="Food" value="food" />
                <Picker.Item label="Utilities" value="utilities" />
                <Picker.Item label="Entertainment" value="entertainment" />
                <Picker.Item label="Other" value="other" />
              </Picker>
            </View>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreateExpense}
            >
              <Text style={styles.submitButtonText}>Add Expense</Text>
            </TouchableOpacity>
          </View>
        )}

        {expenses.length > 0 ? (
          expenses.map((expense) => (
            <View key={expense.id} style={styles.expenseCard}>
              <View style={styles.expenseHeader}>
                <Text style={styles.expenseDesc}>{expense.description}</Text>
                <Text style={styles.expenseAmount}>${expense.amount}</Text>
              </View>
              <View style={styles.expenseFooter}>
                <Text style={styles.expenseCategory}>{expense.category}</Text>
                <Text style={styles.expenseDate}>{expense.date}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No expenses yet. Add one to get started!</Text>
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
    backgroundColor: '#2196F3',
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
  createButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  pickerContainer: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  pickerLabel: {
    fontSize: 12,
    color: '#999',
    paddingLeft: 12,
    paddingTop: 8,
  },
  picker: {
    height: 40,
  },
  submitButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  expenseCard: {
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
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseDesc: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginLeft: 8,
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expenseCategory: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  expenseDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 20,
  },
})
