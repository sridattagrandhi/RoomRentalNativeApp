// app/rental/explore.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Alert,
  RefreshControl,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import ListingCard from '../../components/ListingCard';
import { useAuth } from '../../context/AuthContext';

import { Colors } from '../../constants/Colors';
import { Listing } from '../../constants/Types';
import { useColorScheme } from '../../hooks/useColorScheme';
import { styles } from './explore.styles';

// --- NEW: Constants for multi-select filters ---
const COMMON_AMENITIES = ['Wi-Fi',
  'Kitchen',
  'Air Conditioning',
  'Heating',
  'Washer',
  'Dryer',
  'Free Parking',
  'TV',
  'Dedicated Workspace',
  'Self Check-in',
  'Pet-Friendly',
  'Pool',
  'Hot Tub',
  'Gym',
  'Smoke Detector',];
const COMMON_TENANT_TYPES = ['Bachelors', 'Family', 'Students', 'Professionals'];

// Constants for filter options
const FURNISHING_STATUSES = ['furnished', 'semi-furnished', 'unfurnished'];
const PROPERTY_TYPES = ['Apartment', 'House', 'PG', 'Room'];
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5001' : process.env.EXPO_PUBLIC_DEV_URL;

export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ city?: string }>();
  const { firebaseUser } = useAuth();

  const [listings, setListings] = useState<Listing[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);

  // --- STATE FOR ALL FILTERS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [bedrooms, setBedrooms] = useState<number | null>(null);
  const [bathrooms, setBathrooms] = useState<number | null>(null);
  const [minRent, setMinRent] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [furnishingStatus, setFurnishingStatus] = useState<string | null>(null);
  const [propertyType, setPropertyType] = useState<string | null>(null);
  // --- NEW: State for new filters ---
  const [minArea, setMinArea] = useState('');
  const [maxArea, setMaxArea] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [preferredTenants, setPreferredTenants] = useState<string[]>([]);

  // Modal visibility state
  const [isModalVisible, setIsModalVisible] = useState(false);

  // --- TEMPORARY STATE FOR FILTERS INSIDE THE MODAL ---
  const [tempBedrooms, setTempBedrooms] = useState<number | null>(bedrooms);
  const [tempBathrooms, setTempBathrooms] = useState<number | null>(bathrooms);
  const [tempMinRent, setTempMinRent] = useState(minRent);
  const [tempMaxRent, setTempMaxRent] = useState(maxRent);
  const [tempFurnishingStatus, setTempFurnishingStatus] = useState<string | null>(furnishingStatus);
  const [tempPropertyType, setTempPropertyType] = useState<string | null>(propertyType);
  // --- NEW: Temp state for new filters ---
  const [tempMinArea, setTempMinArea] = useState(minArea);
  const [tempMaxArea, setTempMaxArea] = useState(maxArea);
  const [tempAmenities, setTempAmenities] = useState<string[]>(amenities);
  const [tempPreferredTenants, setTempPreferredTenants] = useState<string[]>(preferredTenants);

  const colorScheme = useColorScheme() || 'light';
  const currentThemeColors = Colors[colorScheme];
  const city = params.city;

  const fetchListings = useCallback(async (isRefreshing = false) => {
    if (!isRefreshing) setIsSearching(true);
    try {
      const query = new URLSearchParams();
      if (city) query.append('city', city);
      if (searchTerm) query.append('search', searchTerm);
      if (bedrooms) query.append('bedrooms', String(bedrooms));
      if (bathrooms) query.append('bathrooms', String(bathrooms));
      if (minRent) query.append('minRent', minRent);
      if (maxRent) query.append('maxRent', maxRent);
      if (furnishingStatus) query.append('furnishingStatus', furnishingStatus);
      if (propertyType) query.append('type', propertyType);
      // --- NEW: Append new filters to the query ---
      if (minArea) query.append('minArea', minArea);
      if (maxArea) query.append('maxArea', maxArea);
      if (amenities.length > 0) query.append('amenities', amenities.join(','));
      if (preferredTenants.length > 0) query.append('preferredTenants', preferredTenants.join(','));
      
      const endpoint = `${BASE_URL}/api/listings?${query.toString()}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch listings.');
      const data: Listing[] = await response.json();
      setListings(data);
    } catch (error: any) {
      Alert.alert("Error", "Could not load listings.");
    } finally {
      setIsInitialLoading(false);
      setIsSearching(false);
    }
  }, [city, searchTerm, bedrooms, bathrooms, minRent, maxRent, furnishingStatus, propertyType, minArea, maxArea, amenities, preferredTenants]);

  useFocusEffect(
    useCallback(() => {
      fetchListings(!isInitialLoading);
      const fetchWishlist = async () => {
        if (!firebaseUser) return setWishlist([]);
        try {
          const token = await firebaseUser.getIdToken();
          const response = await fetch(`${BASE_URL}/api/users/wishlist`, { headers: { Authorization: `Bearer ${token}` } });
          if (!response.ok) return;
          const data: Listing[] = await response.json();
          setWishlist(data.map(item => item._id).filter((id): id is string => !!id));
        } catch (error) {
          console.error("Failed to fetch wishlist on focus:", error);
        }
      };
      fetchWishlist();
    }, [firebaseUser, isInitialLoading])
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      if (!isInitialLoading) fetchListings();
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, bedrooms, bathrooms, minRent, maxRent, furnishingStatus, propertyType, minArea, maxArea, amenities, preferredTenants]);

  const handleToggleFavorite = async (listingId: string) => {
    if (!firebaseUser) return Alert.alert("Login Required", "Please log in to save listings.");
    const token = await firebaseUser.getIdToken();
    const isFavorite = wishlist.includes(listingId);
    const method = isFavorite ? 'DELETE' : 'POST';
    setWishlist(current => isFavorite ? current.filter(id => id !== listingId) : [...current, listingId]);
    try {
      await fetch(`${BASE_URL}/api/users/wishlist/${listingId}`, { method, headers: { Authorization: `Bearer ${token}` } });
    } catch (error) {
      console.error("Wishlist toggle failed:", error);
    }
  };

  const handleOpenFilters = () => {
    setTempBedrooms(bedrooms);
    setTempBathrooms(bathrooms);
    setTempMinRent(minRent);
    setTempMaxRent(maxRent);
    setTempFurnishingStatus(furnishingStatus);
    setTempPropertyType(propertyType);
    setTempMinArea(minArea);
    setTempMaxArea(maxArea);
    setTempAmenities(amenities);
    setTempPreferredTenants(preferredTenants);
    setIsModalVisible(true);
  };

  const handleApplyFilters = () => {
    setBedrooms(tempBedrooms);
    setBathrooms(tempBathrooms);
    setMinRent(tempMinRent);
    setMaxRent(tempMaxRent);
    setFurnishingStatus(tempFurnishingStatus);
    setPropertyType(tempPropertyType);
    setMinArea(tempMinArea);
    setMaxArea(tempMaxArea);
    setAmenities(tempAmenities);
    setPreferredTenants(tempPreferredTenants);
    setIsModalVisible(false);
  };

  const handleClearFilters = () => {
    setTempBedrooms(null);
    setTempBathrooms(null);
    setTempMinRent('');
    setTempMaxRent('');
    setTempFurnishingStatus(null);
    setTempPropertyType(null);
    setTempMinArea('');
    setTempMaxArea('');
    setTempAmenities([]);
    setTempPreferredTenants([]);
  };

  // --- NEW: Helper functions to toggle multi-select filter options ---
  const handleToggleTempAmenity = (amenity: string) => {
    setTempAmenities(current => current.includes(amenity) ? current.filter(a => a !== amenity) : [...current, amenity]);
  };
  const handleToggleTempTenant = (tenant: string) => {
    setTempPreferredTenants(current => current.includes(tenant) ? current.filter(t => t !== tenant) : [...current, tenant]);
  };

  if (isInitialLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: currentThemeColors.background }]}>
        <View style={styles.centered}><ActivityIndicator size="large" color={currentThemeColors.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentThemeColors.background }]}>
      <Stack.Screen options={{ headerShown: true, title: city ? `Listings in ${city}` : 'Listings', headerBackTitle: 'Home', headerTintColor: currentThemeColors.primary, headerStyle: { backgroundColor: currentThemeColors.background }, headerShadowVisible: false }} />
      
      <View style={[styles.searchContainer, { borderColor: currentThemeColors.text + '30' }]}>
        <Ionicons name="search" size={20} color={currentThemeColors.text + '80'} />
        <TextInput style={styles.searchInput} placeholder={`Search in ${city || 'this city'}...`} placeholderTextColor={currentThemeColors.text + '80'} value={searchTerm} onChangeText={setSearchTerm} />
        {isSearching && <ActivityIndicator size="small" color={currentThemeColors.primary} />}
        <TouchableOpacity onPress={handleOpenFilters} style={styles.filterIconContainer}>
          <Ionicons name="options-outline" size={24} color={currentThemeColors.primary} />
        </TouchableOpacity>
      </View>
      
      <ThemedView style={styles.container}>
        {listings.length > 0 ? (
          <FlatList
            data={listings}
            renderItem={({ item }) => {
              const reliableId = item._id || item.id;
              if (!reliableId) return null;
              return (
                <ListingCard
                  listing={item}
                  onPress={() => router.push(`/listings/${reliableId}`)}
                  themeColors={currentThemeColors}
                  isFavorite={wishlist.includes(reliableId)}
                  onToggleFavorite={() => handleToggleFavorite(reliableId)}
                />
              );
            }}
            keyExtractor={(item) => item._id || item.id || Math.random().toString()}
            contentContainerStyle={styles.listContentContainer}
            refreshControl={<RefreshControl refreshing={isSearching} onRefresh={() => fetchListings(true)} tintColor={currentThemeColors.primary} />}
          />
        ) : (
          <ScrollView contentContainerStyle={styles.emptyContainer} refreshControl={<RefreshControl refreshing={isSearching} onRefresh={() => fetchListings(true)} tintColor={currentThemeColors.primary} />}>
            <Ionicons name="search-outline" size={60} color={currentThemeColors.text + '70'} />
            <ThemedText style={styles.emptyText}>No listings found for your search.</ThemedText>
          </ScrollView>
        )}
        <TouchableOpacity style={[styles.fab, { backgroundColor: currentThemeColors.primary }]} onPress={() => router.push({ pathname: '/rentals/post-room', params: { city } })}>
          <Ionicons name="add" size={30} color={currentThemeColors.background} style={styles.fabIcon} />
        </TouchableOpacity>
      </ThemedView>

      <Modal animationType="slide" visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: currentThemeColors.background }]}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Filters</ThemedText>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}><Ionicons name="close" size={28} color={currentThemeColors.text} /></TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalSection}>
              <Text style={[styles.filterLabel, { color: currentThemeColors.text }]}>Rent Range (per month)</Text>
              <View style={styles.rentRangeContainer}>
                <TextInput placeholder="Min Rent" value={tempMinRent} onChangeText={setTempMinRent} keyboardType="numeric" style={[styles.rentInput, { borderColor: currentThemeColors.primary, color: currentThemeColors.text }]} placeholderTextColor={currentThemeColors.text + '80'}/>
                <Text style={styles.rentSeparator}>-</Text>
                <TextInput placeholder="Max Rent" value={tempMaxRent} onChangeText={setTempMaxRent} keyboardType="numeric" style={[styles.rentInput, { borderColor: currentThemeColors.primary, color: currentThemeColors.text }]} placeholderTextColor={currentThemeColors.text + '80'}/>
              </View>
            </View>

            {/* --- NEW: Area Filter --- */}
            <View style={styles.modalSection}>
              <Text style={[styles.filterLabel, { color: currentThemeColors.text }]}>Area (in sq. ft.)</Text>
              <View style={styles.rentRangeContainer}>
                <TextInput placeholder="Min Area" value={tempMinArea} onChangeText={setTempMinArea} keyboardType="numeric" style={[styles.rentInput, { borderColor: currentThemeColors.primary, color: currentThemeColors.text }]} placeholderTextColor={currentThemeColors.text + '80'}/>
                <Text style={styles.rentSeparator}>-</Text>
                <TextInput placeholder="Max Area" value={tempMaxArea} onChangeText={setTempMaxArea} keyboardType="numeric" style={[styles.rentInput, { borderColor: currentThemeColors.primary, color: currentThemeColors.text }]} placeholderTextColor={currentThemeColors.text + '80'}/>
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={[styles.filterLabel, { color: currentThemeColors.text }]}>Property Type</Text>
              <View style={styles.filterOptionsContainer}>
                {PROPERTY_TYPES.map((type) => (
                  <TouchableOpacity key={type} style={[styles.filterButton, tempPropertyType === type && { backgroundColor: currentThemeColors.primary }, { borderColor: currentThemeColors.primary }]} onPress={() => setTempPropertyType(current => current === type ? null : type)}>
                    <Text style={[styles.filterButtonText, tempPropertyType === type ? { color: '#FFFFFF' } : { color: currentThemeColors.primary }]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={[styles.filterLabel, { color: currentThemeColors.text }]}>Bedrooms</Text>
              <View style={styles.filterOptionsContainer}>
                {[1, 2, 3, 4].map((num) => (
                  <TouchableOpacity key={num} style={[styles.filterButton, tempBedrooms === num && { backgroundColor: currentThemeColors.primary }, { borderColor: currentThemeColors.primary }]} onPress={() => setTempBedrooms(current => current === num ? null : num)}>
                    <Text style={[styles.filterButtonText, tempBedrooms === num ? { color: '#FFFFFF' } : { color: currentThemeColors.primary }]}>{num}{num === 4 ? '+' : ''}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={[styles.filterLabel, { color: currentThemeColors.text }]}>Bathrooms</Text>
              <View style={styles.filterOptionsContainer}>
                {[1, 2, 3].map((num) => (
                  <TouchableOpacity key={num} style={[styles.filterButton, tempBathrooms === num && { backgroundColor: currentThemeColors.primary }, { borderColor: currentThemeColors.primary }]} onPress={() => setTempBathrooms(current => current === num ? null : num)}>
                    <Text style={[styles.filterButtonText, tempBathrooms === num ? { color: '#FFFFFF' } : { color: currentThemeColors.primary }]}>{num}{num === 3 ? '+' : ''}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={[styles.filterLabel, { color: currentThemeColors.text }]}>Furnishing</Text>
              <View style={styles.filterOptionsContainer}>
                {FURNISHING_STATUSES.map((status) => (
                  <TouchableOpacity key={status} style={[styles.filterButton, tempFurnishingStatus === status && { backgroundColor: currentThemeColors.primary }, { borderColor: currentThemeColors.primary }]} onPress={() => setTempFurnishingStatus(current => current === status ? null : status)}>
                    <Text style={[styles.filterButtonText, tempFurnishingStatus === status ? { color: '#FFFFFF' } : { color: currentThemeColors.primary, textTransform: 'capitalize' }]}>{status}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* --- NEW: Amenities Filter --- */}
            <View style={styles.modalSection}>
              <Text style={[styles.filterLabel, { color: currentThemeColors.text }]}>Amenities</Text>
              <View style={styles.filterOptionsContainer}>
                {COMMON_AMENITIES.map((amenity) => (
                  <TouchableOpacity key={amenity} style={[styles.filterButton, tempAmenities.includes(amenity) && { backgroundColor: currentThemeColors.primary }, { borderColor: currentThemeColors.primary }]} onPress={() => handleToggleTempAmenity(amenity)}>
                    <Text style={[styles.filterButtonText, tempAmenities.includes(amenity) ? { color: '#FFFFFF' } : { color: currentThemeColors.primary }]}>{amenity}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* --- NEW: Preferred Tenants Filter --- */}
            <View style={styles.modalSection}>
              <Text style={[styles.filterLabel, { color: currentThemeColors.text }]}>Preferred Tenants</Text>
              <View style={styles.filterOptionsContainer}>
                {COMMON_TENANT_TYPES.map((tenant) => (
                  <TouchableOpacity key={tenant} style={[styles.filterButton, tempPreferredTenants.includes(tenant) && { backgroundColor: currentThemeColors.primary }, { borderColor: currentThemeColors.primary }]} onPress={() => handleToggleTempTenant(tenant)}>
                    <Text style={[styles.filterButtonText, tempPreferredTenants.includes(tenant) ? { color: '#FFFFFF' } : { color: currentThemeColors.primary }]}>{tenant}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: currentThemeColors.text + '20'}]}>
              <TouchableOpacity onPress={handleClearFilters} style={styles.clearButton}>
                <Text style={[styles.clearButtonText, { color: currentThemeColors.text }]}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleApplyFilters} style={[styles.applyButton, { backgroundColor: currentThemeColors.primary }]}>
                <Text style={styles.applyButtonText}>Show Results</Text>
              </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
