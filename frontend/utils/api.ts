// Mobile-only: use device-accessible backend address
const API_URL = 'http://10.142.238.9:4000/api';

// Helper function to make API calls
async function apiCall(endpoint: string, method = 'GET', token: string | null = null, body: any = null) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
    console.log('[API] Adding Authorization header:', `Bearer ${token.substring(0, 20)}...`)
  } else {
    console.log('[API] No token provided, skipping Authorization header')
  }

  const options: RequestInit = {
    method,
    headers,
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  console.log(`[API] ${method} ${API_URL}${endpoint}`, { hasAuth: !!token })
  const response = await fetch(`${API_URL}${endpoint}`, options)
  console.log(`[API] Response status:`, response.status)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || `HTTP error! status: ${response.status}`)
  }

  return await response.json()
}

// Auth endpoints
export async function login(credentials: any) {
  return apiCall('/users/login', 'POST', null, credentials)
}

export async function register(userData: any) {
  return apiCall('/users/register', 'POST', null, userData)
}

// Dashboard endpoints
export async function getDashboard(token: string) {
  return apiCall('/dashboard', 'GET', token)
}

export async function getUserBalance(token: string) {
  return apiCall('/settlements/balance', 'GET', token)
}

// Group endpoints
export async function getGroups(token: string) {
  return apiCall('/groups', 'GET', token)
}

export async function createGroup(token: string, groupData: any) {
  return apiCall('/groups', 'POST', token, groupData)
}

export async function getGroupDetails(token: string, groupId: string) {
  return apiCall(`/groups/${groupId}`, 'GET', token)
}

export async function getGroupExpenses(token: string, groupId: string) {
  return apiCall(`/groups/${groupId}/expenses`, 'GET', token)
}

export async function getGroupBalance(token: string, groupId: string) {
  return apiCall(`/groups/${groupId}/balance`, 'GET', token)
}

export async function getGroupSettlements(token: string, groupId: string) {
  return apiCall(`/settlements/group/${groupId}`, 'GET', token)
}

// Group membership
export async function addGroupMember(token: string, body: any) {
  return apiCall('/groups/members', 'POST', token, body)
}

export async function updateGroup(token: string, groupId: string, groupData: any) {
  return apiCall(`/groups/${groupId}`, 'PUT', token, groupData)
}

export async function deleteGroup(token: string, groupId: string) {
  return apiCall(`/groups/${groupId}`, 'DELETE', token)
}

export async function leaveGroup(token: string, groupId: string) {
  return apiCall(`/groups/${groupId}/leave`, 'POST', token)
}

// Expense endpoints
export async function getExpenses(token: string, groupId: string | null = null) {
  const endpoint = groupId ? `/expenses?groupId=${groupId}` : '/expenses'
  return apiCall(endpoint, 'GET', token)
}

export async function createExpense(token: string, expenseData: any) {
  return apiCall('/expenses', 'POST', token, expenseData)
}

export async function getExpenseDetails(token: string, expenseId: string) {
  return apiCall(`/expenses/${expenseId}`, 'GET', token)
}

export async function updateExpense(token: string, expenseId: string, expenseData: any) {
  return apiCall(`/expenses/${expenseId}`, 'PUT', token, expenseData)
}

export async function deleteExpense(token: string, expenseId: string) {
  return apiCall(`/expenses/${expenseId}`, 'DELETE', token)
}

// Settlement endpoints
export async function getSettlements(token: string) {
  return apiCall('/settlements', 'GET', token)
}

export async function settlePayment(token: string, settlementId: string) {
  return apiCall(`/settlements/${settlementId}`, 'PUT', token, { isSettled: true })
}

// User endpoints
export async function getUserProfile(token: string) {
  return apiCall('/users/profile', 'GET', token)
}

export async function updateUserProfile(token: string, userData: any) {
  return apiCall('/users/profile', 'PUT', token, userData)
}
