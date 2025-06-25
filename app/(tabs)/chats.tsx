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
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import io, { Socket } from 'socket.io-client';

import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { ChatListItem } from '../../constants/Types';

const PC_IP = '192.168.0.42:5001';

export const BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:5001'      // Android emulator
    : __DEV__                       // very rough check: if you’re running in dev on a simulator…
    ? 'http://127.0.0.1:5001'       // iOS simulator
    : `http://${PC_IP}`; 

export default function ChatsScreen() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const theme = Colors[useColorScheme() || 'light'];
  const socketRef = useRef<Socket | null>(null);

  const [chatItems, setChatItems] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);

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
    } catch (err) {
      console.error('Failed to load chat threads', err);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  // Initial load on focus
  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [loadChats])
  );

  // Effect for setting up socket listeners for real-time inbox updates
  useEffect(() => {
    if (!firebaseUser) return;
    
    const tokenPromise = firebaseUser.getIdToken();
    tokenPromise.then(token => {
      const socket = io(BASE_URL, { auth: { token }, transports: ['websocket'] });
      socketRef.current = socket;

      socket.on('connect', () => console.log('Inbox socket connected'));
      
      // Listen for activity that requires the inbox to refresh
      socket.on('chat-activity', (data) => {
        console.log('Chat activity received, refreshing inbox...', data);
        loadChats(true); // Re-fetch chats without showing main loader
      });
      
      socket.on('disconnect', () => console.log('Inbox socket disconnected'));
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [firebaseUser, loadChats]);

  const handleChatPress = (item: ChatListItem) => {
    router.push({
      pathname: '/chat/[chatId]',
      params: { 
        chatId: item.chatId, 
        recipientName: item.recipientName,
        // CRITICAL: Pass the recipient's Firebase UID to the chat screen
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
      
      {chatItems.length > 0 ? (
        <FlatList
          data={chatItems}
          keyExtractor={(item) => item.chatId}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleChatPress(item)} style={styles.chatItemContainer}>
              <Image source={{ uri: item.recipientAvatar || 'https://placehold.co/100x100/EFEFEF/333333?text=?' }} style={styles.avatar} />
              <View style={styles.textContainer}>
                <Text style={[styles.recipientName, { color: theme.text }]} numberOfLines={1}>{item.recipientName}</Text>
                <Text style={[styles.lastMessageText, { color: theme.text + '99' }]} numberOfLines={1}>{item.lastMessageText}</Text>
              </View>
              <View style={styles.metaContainer}>
                <Text style={[styles.timestamp, { color: theme.text + '99' }]}>{new Date(item.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                {item.unreadCount > 0 && (
                  <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}><Text style={styles.unreadText}>{item.unreadCount}</Text></View>
                )}
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.text + '15' }]} />}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => loadChats(true)} tintColor={theme.primary} />}
        />
      ) : (
        <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={60} color={theme.text + '70'} />
            <Text style={[styles.emptyText, { color: theme.text + 'AA' }]}>No Chats Yet</Text>
            <Text style={{ color: theme.text + '70' }}>Messages will appear here.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// Professional Styles
const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    chatItemContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12, backgroundColor: '#eee' },
    textContainer: { flex: 1, justifyContent: 'center' },
    recipientName: { fontSize: 16, fontWeight: '600' },
    lastMessageText: { fontSize: 14, marginTop: 2 },
    metaContainer: { alignItems: 'flex-end' },
    timestamp: { fontSize: 12, marginBottom: 4 },
    unreadBadge: { minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
    unreadText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
    separator: { height: 1, marginLeft: 78, marginRight: 16 },
    emptyText: { fontSize: 18, fontWeight: '500', marginTop: 12 },
});
