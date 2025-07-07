// app/listings/[listingId]/index.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Listing, UserProfile } from '../../../constants/Types';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { useAuth } from '../../../context/AuthContext';

const windowWidth = Dimensions.get('window').width;
const BASE_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:5001'
  : process.env.EXPO_PUBLIC_DEV_URL;

export default function ListingView() {
  const { listingId, from } = useLocalSearchParams<{
    listingId: string;
    from?: 'myListings' | string;
  }>();
  const router = useRouter();
  const theme = Colors[useColorScheme() || 'light'];
  const { firebaseUser } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchListing = useCallback(async () => {
    if (!listingId) return;
    setLoading(true);
    try {
      const resp = await fetch(`${BASE_URL}/api/listings/${listingId}`);
      if (!resp.ok) throw new Error('Failed to load listing');
      const data: Listing = await resp.json();
      if (data._id) data.id = data._id;
      setListing(data);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'Could not load listing');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => { fetchListing(); }, [fetchListing]);

  const handleLocationPress = () => {
    if (!listing?.address) return;
    const { street, locality, city, state, postalCode } = listing.address;
    const addressString = [street, locality, city, state, postalCode].filter(Boolean).join(', ');
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(addressString)}`,
      android: `geo:0,0?q=${encodeURIComponent(addressString)}`,
    });
    if (url) {
      Linking.openURL(url).catch(() => Alert.alert("Couldn't open maps"));
    }
  };

  if (loading || !listing) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: loading ? 'Loading…' : 'Not found' }} />
        <View style={styles.centered}>
          {loading ? <ActivityIndicator color={theme.primary} size="large" /> : <Text style={{ color: theme.text }}>Listing not found</Text>}
        </View>
      </SafeAreaView>
    );
  }

  const images = (listing.imageUris?.length ?? 0) > 0 ? listing.imageUris! : [listing.image || 'https://placehold.co/600x400'];
  const ownerObj = typeof listing.owner === 'object' ? (listing.owner as UserProfile) : undefined;
  const ownerId = ownerObj?._id || ownerObj?.id;
  
  const isOwner = ownerObj?.firebaseUID === firebaseUser?.uid; //
  // MODIFICATION: Hide chat button if user is owner, or is coming from 'myListings' or 'edit' screens.
  const showChat = !isOwner && from !== 'myListings' && from !== 'edit'; //

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: '',
          headerBackTitle: 'Back',
          headerTintColor: theme.primary,
          headerStyle: { backgroundColor: theme.background },
          headerRight: () => (
            isOwner ? (
              <TouchableOpacity 
                style={{ marginRight: 15 }} 
                onPress={() => router.push(`/listings/${listingId}/edit`)}
              >
                <Ionicons name="create-outline" size={24} color={theme.primary} />
              </TouchableOpacity>
            ) : null
          ),
        }}
      />
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => `img-${i}`}
        renderItem={({ item }) => <Image source={{ uri: item }} style={[styles.gallery, { width: windowWidth }]} />}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>{listing.title}</Text>
        
        {listing.address && (
          <TouchableOpacity style={styles.locationRow} onPress={handleLocationPress}>
            <Ionicons name="location-outline" size={16} color={theme.text + '99'} />
            <Text style={[styles.locationText, { color: theme.text + '99' }]}>
              {listing.address.locality}, {listing.address.city}
            </Text>
          </TouchableOpacity>
        )}
        
        <Text style={[styles.rent, { color: theme.primary }]}>
          ₹{listing.rent?.toLocaleString()} / month
        </Text>
        <View style={[styles.sep, { backgroundColor: theme.text + '20' }]} />
        <Text style={[styles.section, { color: theme.text }]}>Details</Text>
        <View style={styles.grid}>
          <Detail label="Type" value={listing.type} icon="home-outline" theme={theme} />
          <Detail label="Bedrooms" value={listing.bedrooms} icon="bed-outline" theme={theme} />
          <Detail label="Bathrooms" value={listing.bathrooms} icon="water-outline" theme={theme} />
          <Detail label="Furnishing" value={listing.furnishingStatus} icon="cube-outline" theme={theme} />
          {listing.areaSqFt != null && (
            <Detail label="Area" value={`${listing.areaSqFt} sqft`} icon="scan-outline" theme={theme} />
          )}
          {listing.isAvailable != null && (
            <Detail label="Available" value={listing.isAvailable ? 'Yes' : 'No'} icon="checkmark-circle-outline" theme={theme} />
          )}
        </View>
        <View style={[styles.sep, { backgroundColor: theme.text + '20' }]} />
        <Text style={[styles.section, { color: theme.text }]}>Description</Text>
        <Text style={[styles.body, { color: theme.text }]}>{listing.description}</Text>
        {listing.amenities?.length! > 0 && (
          <>
            <View style={[styles.sep, { backgroundColor: theme.text + '20' }]} />
            <Text style={[styles.section, { color: theme.text }]}>Amenities</Text>
            <View style={styles.tagsContainer}>
              {listing.amenities!.map((a, i) => (
                <View key={i} style={[styles.tagChip, { borderColor: theme.primary }]}>
                  <Text style={[styles.tagText, { color: theme.text }]}>{a}</Text>
                </View>
              ))}
            </View>
          </>
        )}
        {listing.preferredTenants?.length! > 0 && (
          <>
            <View style={[styles.sep, { backgroundColor: theme.text + '20' }]} />
            <Text style={[styles.section, { color: theme.text }]}>Preferred Tenants</Text>
            <View style={styles.tagsContainer}>
              {listing.preferredTenants!.map((pt, i) => (
                <View key={i} style={[styles.tagChip, { borderColor: theme.primary }]}>
                  <Text style={[styles.tagText, { color: theme.text }]}>{pt}</Text>
                </View>
              ))}
            </View>
          </>
        )}
        {listing.additionalInfo && (
          <>
            <View style={[styles.sep, { backgroundColor: theme.text + '20' }]} />
            <Text style={[styles.section, { color: theme.text }]}>Additional Info</Text>
            <Text style={[styles.body, { color: theme.text }]}>{listing.additionalInfo}</Text>
          </>
        )}
        {ownerObj && listing.postedDate && (
          <>
            <View style={[styles.sep, { backgroundColor: theme.text + '20' }]} />
            <Text style={[styles.section, { color: theme.text }]}>Posted By</Text>
            <View style={styles.postedByRow}>
              {ownerObj.profileImageUrl && (
                <Image source={{ uri: ownerObj.profileImageUrl }} style={styles.ownerAvatar} />
              )}
              <Text style={[styles.body, { color: theme.text }]}>{ownerObj.name} on {new Date(listing.postedDate).toLocaleDateString()}</Text>
            </View>
          </>
        )}
        {showChat && ownerObj && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              if (!firebaseUser) {
                Alert.alert('Please log in to chat');
                return;
              }
              if (!ownerId) {
                Alert.alert('Cannot start chat: owner ID missing');
                return;
              }
              router.push({
                pathname: '/chat/new',
                params: {
                  recipientId: ownerId,
                  recipientName: ownerObj.name,
                  listingId: listingId,
                },
              });
            }}
          >
            <Ionicons name="chatbubbles-outline" size={20} color={theme.background} style={{ marginRight: 8 }} />
            <Text style={[styles.actionButtonText, { color: theme.background }]}>Chat with {ownerObj.name}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Detail({
  label,
  value,
  icon,
  theme,
}: {
  label: string;
  value?: string | number | boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  theme: typeof Colors.light | typeof Colors.dark;
}) {
  if (value == null || (typeof value === 'string' && !value.trim())) return null;
  return (
    <View style={styles.detail}>
      <Ionicons name={icon} size={20} color={theme.primary} />
      <View style={{ marginLeft: 8 }}>
        <Text style={[styles.subLabel, { color: theme.text + '99' }]}>{label}</Text>
        <Text style={[styles.subValue, { color: theme.text }]}>{value.toString()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  gallery: { height: 240, backgroundColor: '#f0f0f0' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: 'bold' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  locationText: { marginLeft: 4, fontSize: 14, textDecorationLine: 'underline' },
  rent: { fontSize: 28, fontWeight: 'bold', marginVertical: 12 },
  sep: { height: StyleSheet.hairlineWidth, marginVertical: 20 },
  section: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  body: { fontSize: 16, lineHeight: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  detail: { flexDirection: 'row', width: '48%', marginBottom: 16, alignItems: 'center' },
  subLabel: { fontSize: 14 },
  subValue: { fontSize: 16, fontWeight: '500' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  tagChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, marginRight: 8, marginBottom: 8 },
  tagText: { fontSize: 14 },
  postedByRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  ownerAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 10, backgroundColor: '#e0e0e0' },
  actionButton: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginTop: 20,
  },
  actionButtonText: { fontSize: 16, fontWeight: 'bold' },
});