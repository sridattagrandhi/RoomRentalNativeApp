// app/(tabs)/chats.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import io, { Socket } from 'socket.io-client';

import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { ChatListItem } from '../../constants/Types';
import { styles } from './chats.styles'; // Import the new styles

const PC_IP = '192.168.0.42:5001';

export const BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:5001'
    : __DEV__
    ? 'http://127.0.0.1:5001'
    : `http://${PC_IP}`;

export default function ChatsScreen() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const theme = Colors[useColorScheme() || 'light'];
  const socketRef = useRef<Socket | null>(null);

  const [chatItems, setChatItems] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // --- NEW: State for search functionality ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredChatItems, setFilteredChatItems] = useState<ChatListItem[]>([]);

  const loadChats = useCallback(async (isRefreshing = false) => {
    if (!firebaseUser) return;
    if (!isRefreshing) setLoading(true);

    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`${BASE_URL}/api/chat/threads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data: ChatListItem[] = await res.json();
      setChatItems(data);
      setFilteredChatItems(data); // Initialize filtered list
    } catch (err) {
      console.error('Failed to load chat threads', err);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  // --- NEW: useEffect to filter chats when search term changes ---
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredChatItems(chatItems);
    } else {
      const lowercasedTerm = searchTerm.toLowerCase();
      const filtered = chatItems.filter(item => {
        const title = item.listingTitle?.toLowerCase() || '';
        const name = item.recipientName?.toLowerCase() || '';
        return title.includes(lowercasedTerm) || name.includes(lowercasedTerm);
      });
      setFilteredChatItems(filtered);
    }
  }, [searchTerm, chatItems]);

  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [loadChats])
  );

  useEffect(() => {
    if (!firebaseUser) return;
    
    const tokenPromise = firebaseUser.getIdToken();
    tokenPromise.then(token => {
      const socket = io(BASE_URL, { auth: { token }, transports: ['websocket'] });
      socketRef.current = socket;
      socket.on('connect', () => console.log('Inbox socket connected'));
      socket.on('chat-activity', () => {
        loadChats(true);
      });
      socket.on('disconnect', () => console.log('Inbox socket disconnected'));
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [firebaseUser, loadChats]);

  const handleChatPress = (item: ChatListItem) => {
    const isMeTheOwner = firebaseUser?.uid === item.listingOwnerFirebaseUID;
    
    router.push({
      pathname: '/chat/[chatId]',
      params: { 
        chatId: item.chatId, 
        recipientName: isMeTheOwner ? item.recipientName : item.listingTitle || 'Chat',
        otherUserId: item.recipientFirebaseUID 
      },
    });
  };

  if (loading && chatItems.length === 0) {
    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
            <View style={styles.emptyContainer}><ActivityIndicator size="large" color={theme.primary} /></View>
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: 'Messages',
          headerStyle: { backgroundColor: theme.background },
          headerTitleStyle: { color: theme.text },
          headerShadowVisible: false,
        }}
      />

      {/* --- NEW: Search Bar UI --- */}
      <View style={[styles.searchContainer, { backgroundColor: theme.background, borderColor: theme.text + '20' }]}>
        <Ionicons name="search-outline" size={20} color={theme.text + '80'} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search by name or listing..."
          placeholderTextColor={theme.text + '60'}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>
      
      {filteredChatItems.length > 0 ? (
        <FlatList
          data={filteredChatItems} // Use the filtered list
          keyExtractor={(item) => item.chatId}
          renderItem={({ item }) => {
            const isMeTheOwner = firebaseUser?.uid === item.listingOwnerFirebaseUID;
            const titleToDisplay = isMeTheOwner ? item.recipientName : item.listingTitle || 'Conversation';
            const subtitleToDisplay = isMeTheOwner ? `Listing: ${item.listingTitle}` : `From: ${item.recipientName}`;

            return (
              <TouchableOpacity onPress={() => handleChatPress(item)} style={styles.chatItemContainer}>
                <Image source={{ uri: item.recipientAvatar || 'https://placehold.co/100x100/EFEFEF/333333?text=?' }} style={styles.avatar} />
                <View style={styles.textContainer}>
                  <Text style={[styles.recipientName, { color: theme.text }]} numberOfLines={1}>
                    {titleToDisplay}
                  </Text>
                  <Text style={[styles.lastMessageText, { color: theme.text + '99' }]} numberOfLines={1}>
                    {item.lastMessageText ? `${subtitleToDisplay}: ${item.lastMessageText}` : 'No messages yet'}
                  </Text>
                </View>
                <View style={styles.metaContainer}>
                  <Text style={[styles.timestamp, { color: theme.text + '99' }]}>{new Date(item.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  {item.unreadCount > 0 && (
                    <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}><Text style={styles.unreadText}>{item.unreadCount}</Text></View>
                  )}
                </View>
              </TouchableOpacity>
            )
          }}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.text + '15' }]} />}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => loadChats(true)} tintColor={theme.primary} />}
        />
      ) : (
        <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={60} color={theme.text + '70'} />
            <Text style={[styles.emptyText, { color: theme.text + 'AA' }]}>
              {searchTerm ? 'No chats found' : 'No Chats Yet'}
            </Text>
            <Text style={{ color: theme.text + '70' }}>
              {searchTerm ? 'Try a different search term.' : 'Messages will appear here.'}
            </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
