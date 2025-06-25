// app/chat/[chatId].tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
// Import Href alongside other expo-router hooks
import { useLocalSearchParams, Stack, useRouter, Href } from 'expo-router';
import io, { Socket } from 'socket.io-client';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Message } from '../../constants/Types';

const PC_IP = '192.168.0.42';  // ← replace with your dev‐machine IP

export const BASE_URL = Platform.select({
  android: 'http://10.0.2.2:5001',
  ios:    __DEV__ ? 'http://localhost:5001' : `http://${PC_IP}:5001`,
  default:`http://${PC_IP}:5001`,
});

export default function ChatScreen() {
  const router = useRouter();
  const {
    chatId: initialChatId,
    otherUserId,
    recipientName,
  } = useLocalSearchParams<{
    chatId?: string;        // might be a real thread ID, or a placeholder = otherUserId
    otherUserId: string;    // always the other person’s FirebaseUID or MongoID
    recipientName?: string; // to show in the header
  }>();

  const { firebaseUser } = useAuth();
  const theme = Colors[useColorScheme() || 'light'];

  const [chatId, setChatId]     = useState<string|undefined>(initialChatId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList<Message>>(null);

  const isPlaceholder = !!(chatId && chatId === otherUserId);

  // --- MODIFICATION 1: This entire `useEffect` block is new ---
  // This effect runs when the component loads with a placeholder ID.
  // It checks the backend to see if a chat with this user already exists.
  useEffect(() => {
    const findExistingChat = async () => {
      if (isPlaceholder && firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const res = await fetch(`${BASE_URL}/api/chat/find/${otherUserId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.ok) {
            const existingChat = await res.json();
            // Chat found: Redirect to the real chat URL.
            // We use `as Href` to fix the TypeScript error with Typed Routes.
            router.replace({
              pathname: '/chat/[chatId]',
              params: { 
                chatId: existingChat._id, 
                otherUserId, 
                recipientName 
              },
            });
          } else if (res.status === 404) {
            // No chat exists. This is fine. Stop loading and show the empty screen.
            setLoading(false);
          } else {
            throw new Error('Failed to check for existing chat');
          }
        } catch (err) {
          console.error('Error finding existing chat:', err);
          Alert.alert('Error', 'Could not initialize chat.');
          setLoading(false);
        }
      }
    };

    findExistingChat();
  }, [isPlaceholder, firebaseUser, otherUserId, recipientName, router]);


  //
  // 1) Load history only once we have a real chatId
  //
  const loadMessages = useCallback(async () => {
    if (!chatId || isPlaceholder || !firebaseUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`${BASE_URL}/api/chat/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data: Message[] = await res.json();
      setMessages(data);
    } catch (err) {
      console.error('Load messages error:', err);
      Alert.alert('Error', 'Could not load messages');
    } finally {
      setLoading(false);
    }
  }, [chatId, isPlaceholder, firebaseUser]);

  useEffect(() => {
    // This effect now correctly waits for the "findExistingChat" effect to finish.
    // If a chat is found, the component reloads with a real chatId.
    // If not, `isPlaceholder` remains true, and `loadMessages` won't run.
    loadMessages();
  }, [chatId, loadMessages]);

  //
  // 2) Set up Socket.IO and join the proper room once we have a real chatId
  //
  useEffect(() => {
    if (!firebaseUser) return;
    let socket: Socket;

    (async () => {
      const token = await firebaseUser.getIdToken();
      socket = io(BASE_URL, {
        auth: { token },
        transports: ['websocket'],
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Socket connected');
        if (chatId && !isPlaceholder) {
          socket.emit('joinRoom', chatId);
        }
      });

      socket.on('message', (newMsg: Message) => {
        if (isPlaceholder) {
          // This logic now correctly fires only when creating a truly new chat.
          // It updates the state and URL without a full reload.
          router.setParams({ chatId: newMsg.chatId });
          setChatId(newMsg.chatId);
          socket.emit('joinRoom', newMsg.chatId);
        }
        setMessages(prev => {
          if (prev.some(m => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    })();

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [firebaseUser, chatId, isPlaceholder, router]);


  //
  // 3) Send & upsert. On first send, pass chatId undefined so backend creates it.
  //
  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !firebaseUser || sending || !otherUserId) return;

    setSending(true);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`${BASE_URL}/api/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          Authorization:   `Bearer ${token}`,
        },
        body: JSON.stringify({
          text:        trimmed,
          otherUserId,    // tells the server who to message
          chatId:       isPlaceholder ? undefined : chatId,
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      // we clear the input—our socket listener will append the new message
      setText('');
    } catch (err) {
      console.error('Send failed:', err);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  //
  // 4) Render each bubble
  //
  const renderItem = ({ item }: { item: Message }) => {
    const isMe = item.sender._id === firebaseUser?.uid;
    return (
      <View
        style={[
          styles.bubble,
          isMe ? styles.myBubble : styles.theirBubble,
          { backgroundColor: isMe ? theme.primary : theme.text + '15' },
        ]}
      >
        <Text style={[styles.bubbleText, { color: isMe ? '#fff' : theme.text }]}>
          {item.text}
        </Text>
        <Text style={[styles.timestamp, { color: isMe ? '#ffffff99' : theme.text + '80' }]}>
          {new Date(item.timestamp).toLocaleTimeString([], {
            hour:   '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  //
  // 5) Component UI
  //
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack.Screen
        options={{
          title:             recipientName || 'Chat',
          headerStyle:       { backgroundColor: theme.background },
          headerTitleStyle:  { color: theme.text },
          headerTintColor:   theme.text,
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'height'
        }
        keyboardVerticalOffset={90}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContentContainer}
            onContentSizeChange={() => {
              if (messages.length) {
                flatListRef.current?.scrollToEnd({ animated: true });
              }
            }}
          />
        )}

        <View style={[styles.inputRow, { borderTopColor: theme.text + '20' }]}>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.text + '40' }]}
            placeholder="Type a message…"
            placeholderTextColor={theme.text + '50'}
            value={text}
            onChangeText={setText}
            multiline
            editable={!sending}
            blurOnSubmit={false}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim() || sending}
            style={[styles.sendButton, { opacity: sending ? 0.5 : 1 }]}
          >
            {sending
              ? <ActivityIndicator size="small" color={theme.primary}/>
              : <Ionicons name="send" size={24} color={theme.primary}/>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered:            { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContentContainer:{ paddingHorizontal: 12, flexGrow: 1, justifyContent: 'flex-end' },
  bubble:              { marginVertical: 6, padding: 12, borderRadius: 18, maxWidth: '80%' },
  myBubble:            { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  theirBubble:         { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleText:          { fontSize: 16, lineHeight: 22 },
  timestamp:           { fontSize: 11, marginTop: 4, alignSelf: 'flex-end' },
  inputRow:            { flexDirection: 'row', padding: 10, borderTopWidth: 1, alignItems: 'center' },
  input:               { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, marginRight: 8 },
  sendButton:          { justifyContent: 'center', padding: 8 },
});