import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { ChatListItem } from '../../constants/Types';
import { getChatListItems } from '../../constants/Data';
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import { styles } from './chats.styles';

const ChatRow: React.FC<{ item: ChatListItem; onPress: () => void; themeColors: typeof Colors.light }> = ({ item, onPress, themeColors }) => {
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.chatItemContainer}>
      <Image
        source={item.recipientAvatar ? { uri: item.recipientAvatar } : require('../../assets/images/avatar.jpg')} // Ensure avatar.jpg exists
        style={[styles.avatar, { backgroundColor: themeColors.text + '20' }]}
      />
      <View style={styles.textContainer}>
        <ThemedText style={[styles.recipientName, { color: themeColors.text }]} numberOfLines={1}>
          {item.recipientName}
        </ThemedText>
        <ThemedText style={[styles.lastMessageText, { color: themeColors.text + '99' }]} numberOfLines={1}>
          {item.lastMessageText}
        </ThemedText>
      </View>
      <View style={styles.metaContainer}>
        <ThemedText style={[styles.timestamp, { color: themeColors.text + '99' }]}>
          {formatTimestamp(item.lastMessageTimestamp)}
        </ThemedText>
        {item.unreadCount && item.unreadCount > 0 ? (
          <View style={[styles.unreadBadge, { backgroundColor: themeColors.primary }]}>
            <Text style={[styles.unreadText, { color: themeColors.background }]}>{item.unreadCount}</Text>
          </View>
        ) : <View style={{height: 20}} /> /* Placeholder for alignment */ }
      </View>
    </TouchableOpacity>
  );
};

export default function ChatsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() || 'light';
  const currentThemeColors = Colors[colorScheme];

  const [chatItems, setChatItems] = useState<ChatListItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadChats = useCallback(() => {
    setIsRefreshing(true);
    // Simulate fetching
    setTimeout(() => {
      setChatItems(getChatListItems());
      setIsRefreshing(false);
    }, 300);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadChats(); // Load chats when screen comes into focus
    }, [loadChats])
  );

  const handleChatPress = (chatId: string, recipientName: string) => {
    router.push({
      pathname: `../chat/${chatId}`,
      params: { recipientName: recipientName },
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentThemeColors.background }]}>
      <Stack.Screen
        options={{
          title: 'Messages',
          headerLargeTitle: true, // iOS large title style
          headerStyle: { backgroundColor: currentThemeColors.background },
          headerTitleStyle: { color: currentThemeColors.text },
          headerShadowVisible: false,
          //borderBottomWidth: Platform.OS === 'android' ? StyleSheet.hairlineWidth : 0,
          //borderBottomColor: currentThemeColors.text + '20',
        }}
      />
      <ThemedView style={styles.container}>
        {chatItems.length > 0 ? (
          <FlatList
            data={chatItems}
            renderItem={({ item }) => (
              <ChatRow
                item={item}
                onPress={() => handleChatPress(item.chatId, item.recipientName)}
                themeColors={currentThemeColors}
              />
            )}
            keyExtractor={(item) => item.chatId}
            ItemSeparatorComponent={() => <View style={[styles.separator, {backgroundColor: currentThemeColors.text + '15'}]} />}
            style={styles.listContainer}
            contentContainerStyle={styles.listContentContainer}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={loadChats} tintColor={currentThemeColors.primary} />
            }
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={loadChats} tintColor={currentThemeColors.primary} />
            }
          >
            <Ionicons name="chatbubbles-outline" size={60} color={currentThemeColors.text + '70'} />
            <ThemedText style={[styles.emptyText, { color: currentThemeColors.text + 'AA' }]}>
              No active chats yet.
            </ThemedText>
            <ThemedText style={[styles.emptyText, { fontSize: 14, color: currentThemeColors.text + '70' }]}>
              Start a conversation from a listing page.
            </ThemedText>
          </ScrollView>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

{/*Key features of `chats.tsx`:**
* **`ChatRow` Component:** A sub-component to render each individual chat item cleanly.
* **Data Loading:** `getChatListItems` is called using `useFocusEffect` to load/refresh chats when the screen is viewed.
* **`FlatList`:** Efficiently displays the list of chats.
* **Navigation:** Tapping a chat row navigates to the `ChatScreen` (`/chat/[chatId]`).
* **Styling:** Uses `chats.styles.ts` and dynamic theme colors for a professional look.
* **Empty State:** Shows a message if there are no chats.
* **Refresh Control:** Basic pull-to-refresh functionality.
* **Timestamp Formatting:** A simple `formatTimestamp` function for relative times.
* **Default Avatar:** Uses `avatar.jpg` as a fallback. Ensure this image exists in `assets/images/`.*/}