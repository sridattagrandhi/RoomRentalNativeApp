import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  StyleSheet, // For Platform check
  Platform,
  ScrollView,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Listing } from '../../constants/Types';
import { getMyMockListings } from '../../constants/Data';
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import { styles } from './myListings.styles'; // Import specific styles

interface MyListingCardProps {
  listing: Listing;
  onPress: () => void;
  onEdit: () => void;
  themeColors: typeof Colors.light; // Pass theme for styling
}

const MyListingCard: React.FC<MyListingCardProps> = ({ listing, onPress, onEdit, themeColors }) => {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.myListingCard, { backgroundColor: themeColors.background }]}>
      <View style={styles.cardContent}>
        <Image
          source={listing.image ? { uri: listing.image } : require('../../assets/images/avatar.jpg')} // Fallback image
          style={styles.cardImage}
        />
        <View style={styles.infoContainer}>
          <View>
            <ThemedText style={[styles.title, { color: themeColors.text }]} numberOfLines={2}>
              {listing.title}
            </ThemedText>
            <ThemedText style={[styles.details, { color: themeColors.text + '99' }]}>
              {listing.locality}, {listing.city}
            </ThemedText>
            <ThemedText style={[styles.rent, { color: themeColors.primary }]}>
              ₹{listing.rent.toLocaleString()}/month
            </ThemedText>
          </View>
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: themeColors.primary + '20' }]}
              onPress={(e) => { e.stopPropagation(); onEdit(); }} // Stop propagation to prevent card press
            >
              <Ionicons name="pencil-outline" size={16} color={themeColors.primary} />
              <Text style={[styles.editButtonText, { color: themeColors.primary }]}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function MyListingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() || 'light';
  const currentThemeColors = Colors[colorScheme];

  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadMyListings = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => { // Simulate fetch
      setMyListings(getMyMockListings());
      setIsRefreshing(false);
    }, 300);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMyListings();
    }, [loadMyListings])
  );

  const handleEditListing = (listingId: string) => {
    router.push({
      pathname: '../rental/post-room', // Navigate to your existing form screen
      params: { listingId: listingId, editMode: 'true' }, // Pass listingId and editMode flag
    });
  };

  const handleViewListingDetail = (listingId: string) => {
    router.push(`/listings/${listingId}`);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentThemeColors.background }]}>
      <Stack.Screen
        options={{
          title: 'My Listings',
          headerLargeTitle: true,
          headerStyle: { backgroundColor: currentThemeColors.background },
          headerTitleStyle: { color: currentThemeColors.text },
          headerShadowVisible: false,
          //borderBottomWidth: Platform.OS === 'android' ? StyleSheet.hairlineWidth : 0,
          //borderBottomColor: currentThemeColors.text + '20',
        }}
      />
      <ThemedView style={styles.container}>
        {myListings.length > 0 ? (
          <FlatList
            data={myListings}
            renderItem={({ item }) => (
              <MyListingCard
                listing={item}
                onPress={() => handleViewListingDetail(item.id)}
                onEdit={() => handleEditListing(item.id)}
                themeColors={currentThemeColors}
              />
            )}
            keyExtractor={(item) => item.id}
            style={styles.listContainer}
            contentContainerStyle={styles.listContentContainer}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={loadMyListings} tintColor={currentThemeColors.primary} />
            }
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={loadMyListings} tintColor={currentThemeColors.primary} />
            }
          >
            <Ionicons name="file-tray-stacked-outline" size={60} color={currentThemeColors.text + '70'} />
            <ThemedText style={[styles.emptyText, { color: currentThemeColors.text + 'AA' }]}>
              You haven't posted any listings yet.
            </ThemedText>
            <TouchableOpacity
              style={[styles.postButton, { backgroundColor: currentThemeColors.primary }]}
              onPress={() => router.push('../rental/post-room')} // Navigate to post room screen
            >
              <Text style={[styles.postButtonText, { color: currentThemeColors.background }]}>Post Your First Listing</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}