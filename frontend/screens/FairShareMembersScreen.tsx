import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View, Share, TextInput } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Contacts from 'expo-contacts'
import { getGroupDetails, deleteGroup, leaveGroup } from '../utils/api'
import { useAppTheme } from '../utils/ThemeProvider'

export default function FairShareMembersScreen({ navigation, route }: any) {
  const { theme } = useAppTheme()
  const groupId = route?.params?.groupId
  const [loading, setLoading] = React.useState(true)
  const [group, setGroup] = React.useState<any>(null)
  const [deleting, setDeleting] = React.useState(false)
  const [leaving, setLeaving] = React.useState(false)
  const [deviceContacts, setDeviceContacts] = React.useState<any[]>([])
  const [contactsLoading, setContactsLoading] = React.useState(false)
  const [searchText, setSearchText] = React.useState('')

  React.useEffect(() => {
    let active = true
    const load = async () => {
      try {
        setLoading(true)
        const token = await AsyncStorage.getItem('token')
        if (!token) throw new Error('No token')
        const res = await getGroupDetails(token, String(groupId))
        if (!active) return
        setGroup(res.group)
      } catch {
        if (active) setGroup(null)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [groupId])

  React.useEffect(() => {
    let active = true
    const loadContacts = async () => {
      try {
        setContactsLoading(true)
        const permission = await Contacts.requestPermissionsAsync()
        if (!permission.granted) return

        // Fetch all contacts by paging until no more results
        const pageSize = 200
        let pageOffset = 0
        let all: any[] = []
        while (true) {
          const result = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
            sort: Contacts.SortTypes.FirstName,
            pageSize,
            pageOffset,
          })
          if (!active) return
          const list = result.data || []
          all = all.concat(list)
          // stop if fewer than pageSize returned or no data
          if (list.length < pageSize) break
          pageOffset += list.length
        }
        if (!active) return
        setDeviceContacts(all)
      } catch {
        if (active) setDeviceContacts([])
      } finally {
        if (active) setContactsLoading(false)
      }
    }

    loadContacts()
    return () => { active = false }
  }, [])

  const isOwner = React.useMemo(() => {
    if (!group) return false
    const creatorId = group.createdById || group.createdBy?.id
    const currentUserId = group.currentUserId || group.me?.id
    return Boolean(creatorId && currentUserId && String(creatorId) === String(currentUserId))
  }, [group])

  const handleLeave = () => {
    Alert.alert('Leave group', 'Are you sure you want to leave this group?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: async () => {
        try {
          setLeaving(true)
          const token = await AsyncStorage.getItem('token')
          if (!token) throw new Error('No token')
          await leaveGroup(token, String(groupId))
          navigation.popToTop()
        } catch (err: any) {
          Alert.alert('Error', err.message || 'Could not leave group')
        } finally { setLeaving(false) }
      }}
    ])
  }

  const handleDelete = () => {
    Alert.alert('Delete group', 'This will permanently delete this group. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          setDeleting(true)
          const token = await AsyncStorage.getItem('token')
          if (!token) throw new Error('No token')
          await deleteGroup(token, String(groupId))
          navigation.popToTop()
        } catch (err: any) {
          Alert.alert('Error', err.message || 'Could not delete group')
        } finally { setDeleting(false) }
      }}
    ])
  }

  const handleInviteContact = async (contact: any) => {
    try {
      const groupName = group?.name || 'FairShare group'
      const link = `https://fairshare.app/join/${groupId}`
      const message = `Join my FairShare group "${groupName}"\n\nOpen: ${link}\nGroup ID: ${groupId}`
      await Share.share({ message, title: `Invite ${contact?.name || 'contact'}` })
    } catch {
      Alert.alert('Error', 'Could not open invite sheet')
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.emerald} />
      </View>
    )
  }

  const members = group?.members?.map((m: any) => m.user) || []

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 18, paddingBottom: 36 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Pressable onPress={() => navigation.goBack()} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>
        <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '800' }}>Group members</Text>
        <View style={{ width: 44, height: 44 }} />
      </View>

      <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: theme.colors.line }}>
        <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '800' }}>{group?.name}</Text>
        <Text style={{ color: theme.colors.textSoft, marginTop: 6 }}>{members.length} friend{members.length === 1 ? '' : 's'} in this group</Text>
      </View>

      <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: theme.colors.line, marginBottom: 18 }}>
        <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '800', marginBottom: 10 }}>Friend list</Text>
        {members.length === 0 ? (
          <Text style={{ color: theme.colors.textSoft }}>No members found.</Text>
        ) : members.map((m: any) => (
          <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.line }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: theme.colors.emeraldTint, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: theme.colors.emeraldDark, fontWeight: '800' }}>{(m.name || '').slice(0, 2).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{m.name}</Text>
                <Text style={{ color: theme.colors.textSoft, fontSize: 12 }}>{m.email}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: theme.colors.line, marginBottom: 18 }}>
        <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '800', marginBottom: 10 }}>Add new contact to the FairShare</Text>
        <Text style={{ color: theme.colors.textSoft, marginBottom: 12 }}>From your phone contacts, invite people into this group.</Text>
        
        {/* Search Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.line, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 14 }}>
          <Ionicons name="search-outline" size={16} color={theme.colors.muted} />
          <TextInput
            placeholder="Search by name or phone"
            placeholderTextColor={theme.colors.mutedSoft}
            value={searchText}
            onChangeText={setSearchText}
            style={{ flex: 1, marginLeft: 8, color: theme.colors.text, fontSize: 14 }}
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color={theme.colors.muted} />
            </Pressable>
          )}
        </View>

        {contactsLoading ? (
          <ActivityIndicator color={theme.colors.emerald} />
        ) : (() => {
          const filteredContacts = deviceContacts.filter((contact) => {
            const searchLower = searchText.toLowerCase()
            const name = contact.name?.toLowerCase() || ''
            const phones = (contact.phoneNumbers || []).map((p: any) => (p.number || '').replace(/\D/g, ''))
            const emails = (contact.emails || []).map((e: any) => (e.email || '').toLowerCase())
            
            return (
              name.includes(searchLower) ||
              phones.some((p: string) => p.includes(searchLower.replace(/\D/g, ''))) ||
              emails.some((e: string) => e.includes(searchLower))
            )
          })

          return filteredContacts.length === 0 ? (
            <Text style={{ color: theme.colors.textSoft }}>
              {deviceContacts.length === 0 ? 'No device contacts available.' : 'No contacts found.'}
            </Text>
          ) : (
            filteredContacts.map((contact) => {
              const primaryPhone = contact.phoneNumbers?.[0]?.number || contact.emails?.[0]?.email || ''
              return (
                <View key={contact.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.line }}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{contact.name || 'Unknown contact'}</Text>
                    {contact.phoneNumbers && contact.phoneNumbers.length > 0 && (
                      <Text style={{ color: theme.colors.textSoft, fontSize: 12, marginTop: 4 }}>
                        {contact.phoneNumbers.map((p: any) => p.number).join(', ')}
                      </Text>
                    )}
                    {(!contact.phoneNumbers || contact.phoneNumbers.length === 0) && contact.emails && contact.emails.length > 0 && (
                      <Text style={{ color: theme.colors.textSoft, fontSize: 12, marginTop: 4 }}>
                        {contact.emails.map((e: any) => e.email).join(', ')}
                      </Text>
                    )}
                    {(!contact.phoneNumbers || contact.phoneNumbers.length === 0) && (!contact.emails || contact.emails.length === 0) && (
                      <Text style={{ color: theme.colors.textSoft, fontSize: 12, marginTop: 4 }}>No contact info</Text>
                    )}
                  </View>
                  <Pressable onPress={() => handleInviteContact(contact)} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: theme.colors.emerald }}>
                    <Text style={{ color: theme.colors.surface, fontWeight: '800', fontSize: 12 }}>Invite</Text>
                  </Pressable>
                </View>
              )
            })
          )
        })()}
      </View>

      <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: theme.colors.line }}>
        <Text style={{ color: theme.colors.text, fontWeight: '800', marginBottom: 8 }}>Advanced settings</Text>
        <Pressable style={{ paddingVertical: 12 }} onPress={() => { /* TODO: toggle simplify */ }}>
          <Text style={{ color: theme.colors.text }}>Simplify group debts</Text>
        </Pressable>
        <View style={{ height: 1, backgroundColor: theme.colors.line, marginVertical: 6 }} />
        <Pressable style={{ paddingVertical: 12 }} onPress={() => Alert.alert('Default split', 'Paid by you and split equally') }>
          <Text style={{ color: theme.colors.text }}>Default split</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}
