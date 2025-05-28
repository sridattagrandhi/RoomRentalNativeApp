// app/chat/[chatId].tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Message } from '../../constants/Types';
import { mockChatMessages, addChatMessage, MOCK_CURRENT_USER_ID } from '../../constants/Data';
import ThemedText from '../../components/ThemedText'; // If you want to use it for message text

export default function ChatScreen() {
  const router = useRouter();
  const { chatId, recipientName } = useLocalSearchParams<{ chatId?: string; recipientName?: string }>();
  const colorScheme = useColorScheme() || 'light';
  const currentThemeColors = Colors[colorScheme];

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList<Message>>(null);

  // Load messages for the current chat
  useEffect(() => {
    if (chatId) {
      setMessages(mockChatMessages[chatId] || []);
    }
  }, [chatId]);

  // Scroll to bottom when new messages are added or keyboard shows
  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);


  const handleSend = () => {
    if (inputText.trim() === '' || !chatId) return;

    const newMessage = addChatMessage(chatId, inputText, MOCK_CURRENT_USER_ID);
    setMessages(prevMessages => [...prevMessages, newMessage]); // Update local state to show message immediately
    setInputText('');
    Keyboard.dismiss(); // Dismiss keyboard after sending
    // In a real app, you'd send this to a backend
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderId === MOCK_CURRENT_USER_ID;
    return (
      <View
        style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
          isCurrentUser ? { backgroundColor: currentThemeColors.primary } : { backgroundColor: currentThemeColors.text + '20' },
        ]}
      >
        <Text style={[styles.messageText, isCurrentUser ? { color: currentThemeColors.background } : { color: currentThemeColors.text }]}>
          {item.text}
        </Text>
        <Text style={[styles.timestamp, isCurrentUser ? { color: currentThemeColors.background + 'AA' } : { color: currentThemeColors.text + '99' }]}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentThemeColors.background }]}>
      <Stack.Screen
        options={{
          title: recipientName || `Chat with ${chatId || 'User'}`,
          headerTintColor: currentThemeColors.primary,
          headerStyle: { backgroundColor: currentThemeColors.background },
          headerShadowVisible: Platform.OS === 'ios',
          //borderBottomWidth: Platform.OS === 'android' ? StyleSheet.hairlineWidth : 0,
          //borderBottomColor: currentThemeColors.text + '30',
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} // Adjust if header height changes
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesListContent}
          // inverted // Using scrollToEnd instead of inverted for simpler new message addition
        />
        <View style={[styles.inputContainer, { borderTopColor: currentThemeColors.text + '30' }]}>
          <TextInput
            style={[styles.textInput, { color: currentThemeColors.text, borderColor: currentThemeColors.primary, backgroundColor: currentThemeColors.background + 'F0' }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={currentThemeColors.text + '99'}
            multiline
          />
          <TouchableOpacity onPress={handleSend} style={[styles.sendButton, { backgroundColor: currentThemeColors.primary }]}>
            <Ionicons name="send" size={22} color={currentThemeColors.background} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  messagesListContent: {
    paddingVertical: 10,
  },
  messageBubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    marginVertical: 4,
    maxWidth: '80%',
  },
  currentUserBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120, // Allow multiple lines up to a certain height
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 8,
  },
  sendButton: {
    padding: 10,
    borderRadius: 20, // Make it circular
    justifyContent: 'center',
    alignItems: 'center',
  },
});