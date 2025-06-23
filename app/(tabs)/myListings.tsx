// app/(tabs)/myListings.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  GestureHandlerRootView,
  Swipeable,
  RectButton,
} from 'react-native-gesture-handler';

import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Listing } from '../../constants/Types';

const BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://localhost:5001';

export default function MyListingsScreen() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const theme = Colors[useColorScheme() || 'light'];

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (refresh = false) => {
      if (!firebaseUser) {
        setListings([]);
        setLoading(false);
        return;
      }
      if (!refresh) setLoading(true);

      try {
        const token = await firebaseUser.getIdToken();
        const res = await fetch(`${BASE_URL}/api/listings/my-listings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const data: Array<Listing & { _id?: string }> = await res.json();
        const normalized = data.map(l => ({
          ...l,
          id: l.id ?? l._id ?? '',
        }));
        setListings(normalized);
      } catch (err: any) {
        console.error('Fetch my listings failed:', err);
        Alert.alert('Error', 'Could not load your listings.');
      } finally {
        setLoading(false);
      }
    },
    [firebaseUser]
  );

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load])
  );

  const deleteListing = (id: string) => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await firebaseUser!.getIdToken();
              const res = await fetch(`${BASE_URL}/api/listings/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!res.ok) throw new Error('Delete failed');
              load(true);
            } catch (err) {
              console.error('Delete failed', err);
              Alert.alert('Error', 'Could not delete listing.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView
          style={{ flex: 1, justifyContent: 'center', backgroundColor: theme.background }}
        >
          <ActivityIndicator size="large" color={theme.primary} />
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <Stack.Screen
          options={{
            title: 'My Listings',
            headerStyle: { backgroundColor: theme.background },
            headerTitleStyle: { color: theme.text },
            headerRight: () => (
              <TouchableOpacity
                onPress={() => router.push('/rentals/post-room')}
                style={{ marginRight: 15 }}
              >
                <Ionicons name="add-circle-outline" size={26} color={theme.primary} />
              </TouchableOpacity>
            ),
          }}
        />

        <FlatList
          data={listings}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => load(true)}
              tintColor={theme.primary}
            />
          }
          renderItem={({ item }) => (
            <Swipeable
              renderRightActions={() => (
                <RectButton
                  style={{
                    backgroundColor: 'red',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: 80,
                  }}
                  onPress={() => deleteListing(item.id)}
                >
                  <Ionicons name="trash-outline" size={24} color="#fff" />
                </RectButton>
              )}
            >
              <TouchableOpacity
                style={{
                  margin: 10,
                  backgroundColor: theme.background,
                  borderRadius: 8,
                  padding: 10,
                  shadowColor: '#000',
                  shadowOpacity: 0.1,
                }}
                onPress={() =>
                  router.push({
                    pathname: '/listings/[listingId]',
                    params: { listingId: item.id, from: 'myListings' },
                  })
                }
              >
                <Image
                  source={{ uri: item.image }}
                  style={{ width: '100%', height: 150, borderRadius: 8 }}
                />
                <Text
                  style={{
                    marginTop: 8,
                    color: theme.text,
                    fontSize: 16,
                    fontWeight: '600',
                  }}
                >
                  {item.title}
                </Text>
                <Text style={{ color: theme.text + '99' }}>
                  {item.locality}, {item.city}
                </Text>
                <Text style={{ color: theme.primary, marginTop: 4 }}>
                  ₹{item.rent.toLocaleString()}/mo
                </Text>

                {/* ✏️ Edit button */}
                <TouchableOpacity
                  onPress={() => router.push(`/listings/${item.id}/edit`)}
                  style={{ position: 'absolute', top: 10, right: 10 }}
                >
                  <Ionicons name="pencil-outline" size={24} color={theme.primary} />
                </TouchableOpacity>
              </TouchableOpacity>
            </Swipeable>
          )}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
