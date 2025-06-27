// app/rental/explore.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Alert,
  RefreshControl,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import { Colors } from '../../constants/Colors';
import { Listing } from '../../constants/Types';
import { useColorScheme } from '../../hooks/useColorScheme';
import { styles } from './explore.styles';

interface ListingCardProps {
  listing: Listing;
  onPress: () => void;
  themeColors: typeof Colors.light;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onPress, themeColors }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.cardContainer, { backgroundColor: themeColors.background }]}
    >
      <Image
        source={listing.image ? { uri: listing.image } : require('../../assets/images/avatar.jpg')}
        style={styles.cardImage}
      />
      
      <View style={[styles.rentContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <Text style={[styles.rentText, { color: '#FFFFFF' }]}>
          ₹{listing.rent.toLocaleString()}/month
        </Text>
      </View>

      <View style={styles.cardContent}>
        <ThemedText style={[styles.cardTitle, { color: themeColors.text }]} numberOfLines={1}>
          {listing.title}
        </ThemedText>
        
        {listing.address && (
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color={themeColors.text + '99'} />
            <ThemedText style={[styles.locationText, { color: themeColors.text + '99' }]} numberOfLines={1}>
              {listing.address.locality}, {listing.address.city}
            </ThemedText>
          </View>
        )}

        <View style={[styles.detailsContainer, { borderTopColor: themeColors.text + '15', borderTopWidth: 1 }]}>
          <View style={styles.detailItem}>
            <Ionicons name="bed-outline" size={18} color={themeColors.primary} />
            <ThemedText style={[styles.detailText, { color: themeColors.text }]}>
              {listing.bedrooms} Beds
            </ThemedText>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="water-outline" size={18} color={themeColors.primary} />
            <ThemedText style={[styles.detailText, { color: themeColors.text }]}>
              {listing.bathrooms} Baths
            </ThemedText>
          </View>
          {listing.areaSqFt && (
             <View style={styles.detailItem}>
                <Ionicons name="scan-outline" size={18} color={themeColors.primary} />
                <ThemedText style={[styles.detailText, { color: themeColors.text }]}>
                  {listing.areaSqFt} sqft
                </ThemedText>
              </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};


export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ city?: string }>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const colorScheme = useColorScheme() || 'light';
  const currentThemeColors = Colors[colorScheme];
  const city = params.city;

  const fetchListings = useCallback(async (isRefreshing = false) => {
    if (!city) {
      setListings([]);
      setIsLoading(false);
      return;
    }
    if (!isRefreshing) {
        setIsLoading(true);
    }
    
    try {
      const YOUR_BACKEND_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://localhost:5001';
      const endpoint = `${YOUR_BACKEND_BASE_URL}/api/listings?city=${encodeURIComponent(city)}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) { throw new Error('Failed to fetch listings.'); }
      const data: Listing[] = await response.json();
      setListings(data);
    } catch (error: any) {
      console.error("Error fetching listings:", error);
      Alert.alert("Error", "Could not load listings.");
    } finally {
      setIsLoading(false);
    }
  }, [city]);

  // This hook re-fetches listings every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchListings();
    }, [fetchListings])
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: currentThemeColors.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={currentThemeColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentThemeColors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: city ? `Listings in ${city}` : 'Listings',
          headerBackTitle: 'Home',
          headerTintColor: currentThemeColors.primary,
          headerStyle: { backgroundColor: currentThemeColors.background },
          headerShadowVisible: false,
        }}
      />
      <ThemedView style={styles.container}>
        {listings.length > 0 ? (
          <FlatList
            data={listings}
            renderItem={({ item }) => (
              <ListingCard
                listing={item}
                onPress={() => router.push(`/listings/${item.id || item._id}`)}
                themeColors={currentThemeColors}
              />
            )}
            keyExtractor={(item) => (item.id || item._id!).toString()}
            contentContainerStyle={styles.listContentContainer}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={() => fetchListings(true)} tintColor={currentThemeColors.primary} />
            }
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={() => fetchListings(true)} tintColor={currentThemeColors.primary} />
            }
          >
            <Ionicons name="search-outline" size={60} color={currentThemeColors.text + '70'} />
            <ThemedText style={[styles.emptyText, { color: currentThemeColors.text + 'AA' }]}>
              No listings found for {city || 'this area'}.
            </ThemedText>
          </ScrollView>
        )}

        <TouchableOpacity
          style={[styles.fab, { backgroundColor: currentThemeColors.primary }]}
          onPress={() => router.push({ pathname: '/rentals/post-room', params: { city } })}
        >
          <Ionicons name="add" size={30} color={currentThemeColors.background} style={styles.fabIcon} />
        </TouchableOpacity>
      </ThemedView>
    </SafeAreaView>
  );
}