// app/listings/[listingId].tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Listing, UserProfile } from '../../constants/Types';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import ThemedText from '../../components/ThemedText';
import { useAuth } from '../../context/AuthContext';

const windowWidth = Dimensions.get('window').width;

export default function ListingDetailScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const router = useRouter();
  const { firebaseUser: loggedInUser } = useAuth();
  const colorScheme = useColorScheme() || 'light';
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchListing = useCallback(async () => {
    if (!listingId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    const BASE_URL =
      Platform.OS === 'android'
        ? 'http://10.0.2.2:5001'
        : 'http://localhost:5001';

    try {
      const resp = await fetch(`${BASE_URL}/api/listings/${listingId}`);
      if (!resp.ok) throw new Error('Listing not found or failed to fetch.');
      const data: Listing = await resp.json();
      if (data._id) data.id = data._id;
      setListing(data);
    } catch (err: any) {
      console.error('Error fetching listing details:', err);
      setListing(null);
    } finally {
      setIsLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.centered}>
          <Stack.Screen options={{ title: 'Not Found' }} />
          <ThemedText style={[styles.errorText, { color: theme.text }]}>
            Listing Not Found
          </ThemedText>
          <Text style={[styles.errorSubText, { color: theme.text }]}>
            This listing may have been removed or the link is incorrect.
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary, width: '60%' }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.actionButtonText, { color: theme.background }]}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayTitle = listing.title || `${listing.type} in ${listing.locality}`;
  const imagesToDisplay = listing.imageUris?.length
    ? listing.imageUris
    : [listing.image || 'https://placehold.co/600x400/cccccc/ffffff&text=No+Image'];

  const ownerObj =
    typeof listing.owner === 'object'
      ? (listing.owner as UserProfile)
      : undefined;
  const isMyListing = ownerObj?.firebaseUID === loggedInUser?.uid;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: '',
          headerBackTitle: 'Back',
          headerTintColor: theme.primary,
          headerStyle: { backgroundColor: theme.background },
          headerShadowVisible: Platform.OS === 'ios',
        }}
      />
      <ScrollView style={styles.scrollViewContainer} contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.galleryContainer}>
          <FlatList
            data={imagesToDisplay}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, idx) => `gallery-image-${idx}`}
            renderItem={({ item }) => (
              <View style={{ width: windowWidth, height: styles.galleryContainer.height }}>
                <Image
                  source={{ uri: item }}
                  style={styles.galleryImage}
                  resizeMode="cover"
                  onError={e =>
                    console.warn(`Failed to load gallery image: ${item}`, e.nativeEvent.error)
                  }
                />
              </View>
            )}
          />
        </View>

        <View style={styles.content}>
          <ThemedText style={[styles.mainTitleText, { color: theme.text }]}>
            {displayTitle}
          </ThemedText>

          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={18} color={theme.primary} />
            <ThemedText style={[styles.locationText, { color: theme.text }]}>
              {listing.locality}, {listing.city}
            </ThemedText>
          </View>

          <View style={styles.rentContainer}>
            <ThemedText style={[styles.rent, { color: theme.primary }]}>
              ₹{listing.rent?.toLocaleString() ?? 'N/A'}
            </ThemedText>
            <ThemedText style={[styles.rentLabel, { color: theme.text }]}>
              / month
            </ThemedText>
          </View>

          <View style={[styles.separator, { backgroundColor: theme.text + '20' }]} />

          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Details</ThemedText>
          <View style={styles.detailsGrid}>
            <DetailItem label="Type" value={listing.type} icon="home-outline" colorScheme={colorScheme} />
            <DetailItem label="Bedrooms" value={listing.bedrooms} icon="bed-outline" colorScheme={colorScheme} />
            <DetailItem label="Bathrooms" value={listing.bathrooms} icon="water-outline" colorScheme={colorScheme} />
            <DetailItem label="Furnishing" value={listing.furnishingStatus} icon="cube-outline" colorScheme={colorScheme} />
            {listing.areaSqFt != null && (
              <DetailItem label="Area" value={`${listing.areaSqFt} sqft`} icon="scan-outline" colorScheme={colorScheme} />
            )}
            {listing.isAvailable != null && (
              <DetailItem label="Available" value={listing.isAvailable} icon="checkmark-circle-outline" colorScheme={colorScheme} />
            )}
          </View>

          {/* ————————— ADDED FIELDS ————————— */}
          <View style={[styles.separator, { backgroundColor: theme.text + '20' }]} />
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Description</ThemedText>
          <ThemedText style={[styles.descriptionText, { color: theme.text }]}>
            {listing.description}
          </ThemedText>

          {/* only render if the array actually exists and has items */}
          {listing.amenities && listing.amenities.length > 0 && (
            <>
              <View style={[styles.separator, { backgroundColor: theme.text + '20' }]} />
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Amenities</ThemedText>
              <View style={styles.tagsContainer}>
                {listing.amenities.map((amenity, i) => (
                  <View key={`amenity-${i}`} style={[styles.tagChip, { borderColor: theme.primary }]}>
                    <Text style={[styles.tagText, { color: theme.text }]}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {listing.preferredTenants && listing.preferredTenants.length > 0 && (
            <>
              <View style={[styles.separator, { backgroundColor: theme.text + '20' }]} />
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Preferred Tenants</ThemedText>
              <View style={styles.tagsContainer}>
                {listing.preferredTenants.map((pt, i) => (
                  <View key={`tenant-${i}`} style={[styles.tagChip, { borderColor: theme.primary }]}>
                    <Text style={[styles.tagText, { color: theme.text }]}>{pt}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {listing.additionalInfo && (
            <>
              <View style={[styles.separator, { backgroundColor: theme.text + '20' }]} />
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Additional Info</ThemedText>
              <ThemedText style={[styles.descriptionText, { color: theme.text }]}>
                {listing.additionalInfo}
              </ThemedText>
            </>
          )}
          {/* —————————————————————————————— */}

          {ownerObj && listing.postedDate && (
            <>
              <View style={[styles.separator, { backgroundColor: theme.text + '20' }]} />
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Posted By</ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {ownerObj.profileImageUrl && (
                  <Image source={{ uri: ownerObj.profileImageUrl }} style={styles.ownerAvatar} />
                )}
                <ThemedText style={[styles.descriptionText, { color: theme.text }]}>
                  {ownerObj.name} on {new Date(listing.postedDate).toLocaleDateString()}
                </ThemedText>
              </View>
            </>
          )}

          {ownerObj && !isMyListing && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary, marginTop: 30 }]}
              onPress={() => {
                const ownerId = ownerObj._id || ownerObj.id;
                if (!ownerId) {
                  Alert.alert('Error', 'Cannot initiate chat. Owner ID missing.');
                  return;
                }
                router.push({
                  pathname: `/chat/[chatId]`,
                  params: { chatId: ownerId, recipientName: ownerObj.name },
                });
              }}
            >
              <Ionicons
                name="chatbubbles-outline"
                size={20}
                color={theme.background}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.actionButtonText, { color: theme.background }]}>
                Chat with {ownerObj.name}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const DetailItem = ({
  label,
  value,
  icon,
  colorScheme,
}: {
  label: string;
  value?: string | number | boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  colorScheme: 'light' | 'dark';
}) => {
  if (value === undefined || value === null || (typeof value === 'string' && !value.trim()))
    return null;
  const t = Colors[colorScheme];
  const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value.toString();
  return (
    <View style={styles.detailItemContainer}>
      {icon && <Ionicons name={icon} size={20} color={t.primary} style={styles.detailItemIcon} />}
      <View style={styles.detailItemContent}>
        <ThemedText style={[styles.detailItemLabel, { color: t.text + '99' }]}>{label}</ThemedText>
        <ThemedText style={[styles.detailItemValue, { color: t.text }]}>{displayValue}</ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollViewContainer: { flex: 1 },
  scrollContentContainer: { paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  galleryContainer: { height: 280, backgroundColor: '#F0F0F0' },
  galleryImage: { width: windowWidth, height: '100%' },
  content: { paddingHorizontal: 20, paddingVertical: 16 },
  mainTitleText: { fontSize: 26, fontWeight: 'bold', marginBottom: 6 },
  locationContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  locationText: { fontSize: 16, marginLeft: 6, flexShrink: 1 },
  rentContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  rent: { fontSize: 28, fontWeight: 'bold' },
  rentLabel: { fontSize: 16, marginLeft: 4 },
  separator: { height: StyleSheet.hairlineWidth, marginVertical: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 16 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  detailItemContainer: { flexDirection: 'row', alignItems: 'flex-start', width: '50%', marginBottom: 16, paddingRight: 10 },
  detailItemIcon: { marginRight: 10, marginTop: 3 },
  detailItemContent: { flex: 1 },
  detailItemLabel: { fontSize: 14, marginBottom: 2 },
  detailItemValue: { fontSize: 16, fontWeight: '500' },
  descriptionText: { fontSize: 16, lineHeight: 24 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  tagChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, marginRight: 8, marginBottom: 8, borderWidth: 1 },
  tagText: { fontSize: 14 },
  actionButton: { flexDirection: 'row', paddingVertical: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
  actionButtonText: { fontSize: 16, fontWeight: 'bold' },
  errorText: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  errorSubText: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  ownerAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 10, backgroundColor: '#e0e0e0' },
});
