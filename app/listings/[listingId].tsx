// app/listings/[listingId].tsx
import React from 'react';
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
  Dimensions, // Ensure Dimensions is imported
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { findListingById } from '../../constants/Data';
import { Listing } from '../../constants/Types';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import ThemedText from '../../components/ThemedText';

const windowWidth = Dimensions.get('window').width; // Get screen width for gallery items

export default function ListingDetailScreen() {
  const params = useLocalSearchParams<{ listingId?: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() || 'light';
  const currentThemeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [listing, setListing] = React.useState<Listing | undefined | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const listingId = params.listingId;

  React.useEffect(() => {
    setIsLoading(true);
    if (listingId) {
      setTimeout(() => {
        const foundListing = findListingById(listingId);
        setListing(foundListing);
        setIsLoading(false);
      }, 100);
    } else {
      setListing(undefined);
      setIsLoading(false);
    }
  }, [listingId]);

  // (isLoading and !listing checks remain the same as the version you provided)
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: currentThemeColors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={currentThemeColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: currentThemeColors.background }]}>
        <View style={styles.centered}>
          <Stack.Screen options={{ title: "Not Found" }} />
          <ThemedText style={[styles.errorText, {color: currentThemeColors.text}]}>Listing not found.</ThemedText>
          <Text style={[styles.errorSubText, {color: currentThemeColors.text}]}>
            The listing you are looking for might have been removed or the link is incorrect.
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: currentThemeColors.primary, width: '60%' }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.actionButtonText, { color: currentThemeColors.background }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayTitle = listing.title || `${listing.type} in ${listing.locality}`;
  const imagesToDisplay = (listing.imageUris && listing.imageUris.length > 0)
    ? listing.imageUris
    : (listing.image ? [listing.image] : ['https://placehold.co/600x400/cccccc/ffffff&text=No+Image+Available']);


  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentThemeColors.background }]}>
      <Stack.Screen
        options={{
          title: '',
          headerBackTitle: 'Listings',
          headerTintColor: currentThemeColors.primary,
          headerStyle: {
            backgroundColor: currentThemeColors.background,
            //borderBottomWidth: Platform.OS === 'android' ? StyleSheet.hairlineWidth : 0,
            //borderBottomColor: Platform.OS === 'android' ? (currentThemeColors.text + '30') : 'transparent',
          },
          headerShadowVisible: Platform.OS === 'ios',
        }}
      />
      <ScrollView style={styles.scrollViewContainer} contentContainerStyle={styles.scrollContentContainer}>
        {/* Image Gallery */}
        {imagesToDisplay && imagesToDisplay.length > 0 ? (
            <View style={styles.galleryContainer}> {/* Ensure galleryContainer has appropriate width or is screen width */}
            <FlatList
                data={imagesToDisplay}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => `gallery-${item}-${index}-${Math.random()}`} // More robust key
                renderItem={({ item: imageUri }) => (
                // Each item (View) in FlatList now has the full windowWidth
                <View style={{ width: windowWidth, height: styles.galleryContainer.height }}>
                    <Image
                    source={{ uri: imageUri }}
                    style={styles.galleryImage} // galleryImage style is { width: '100%', height: '100%' }
                    resizeMode="cover"
                    onError={(e) => console.warn(`Failed to load gallery image: ${imageUri}`, e.nativeEvent.error)}
                    />
                </View>
                )}
            />
            </View>
        ) : (
            <View style={[styles.galleryContainer, styles.centered, {height: 200}]}>
                <ThemedText style={{color: currentThemeColors.text}}>No images available</ThemedText>
            </View>
        )}

        {/* Rest of the content (Title, Location, Rent, Details, Description, etc.) */}
        {/* This should be the same as the detailed version you had from my previous response */}
        <View style={styles.content}>
          <ThemedText style={[styles.mainTitleText, { color: currentThemeColors.text }]}>{displayTitle}</ThemedText>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={18} color={currentThemeColors.primary} />
            <ThemedText style={[styles.locationText, { color: currentThemeColors.text }]}>
              {listing.locality}, {listing.city}
            </ThemedText>
          </View>

          <View style={styles.rentContainer}>
            <ThemedText style={[styles.rent, { color: currentThemeColors.primary }]}>
              ₹{listing.rent ? listing.rent.toLocaleString() : 'N/A'}
            </ThemedText>
            <ThemedText style={[styles.rentLabel, { color: currentThemeColors.text }]}>/ month</ThemedText>
          </View>

          <View style={[styles.separator, {backgroundColor: currentThemeColors.text + '20'}]} />

          <ThemedText style={[styles.sectionTitle, { color: currentThemeColors.text }]}>Details</ThemedText>
          <View style={styles.detailsGrid}>
            <DetailItem label="Type" value={listing.type} icon="home-outline" colorScheme={colorScheme}/>
            <DetailItem label="Bedrooms" value={listing.bedrooms.toString()} icon="bed-outline" colorScheme={colorScheme}/>
            <DetailItem label="Bathrooms" value={listing.bathrooms.toString()} icon="water-outline" colorScheme={colorScheme}/>
            <DetailItem label="Furnishing" value={listing.furnishingStatus} icon="cube-outline" colorScheme={colorScheme}/>
            {listing.areaSqFt != null && <DetailItem label="Area" value={`${listing.areaSqFt} sqft`} icon="scan-outline" colorScheme={colorScheme}/>}
            {listing.isAvailable !== undefined && <DetailItem label="Available" value={listing.isAvailable} icon="checkmark-circle-outline" colorScheme={colorScheme}/>}
          </View>
          {/* ... other detail sections for preferredTenants, amenities, description, additionalInfo, postedDate ... */}
           {listing.preferredTenants && listing.preferredTenants.length > 0 && (
            <>
              <View style={[styles.separator, {backgroundColor: currentThemeColors.text + '20'}]} />
              <ThemedText style={[styles.sectionTitle, { color: currentThemeColors.text }]}>Preferred Tenants</ThemedText>
              <View style={styles.tagsContainer}>
                {listing.preferredTenants.map((tenantType, index) => (
                  <View key={index} style={[styles.tagChip, { backgroundColor: currentThemeColors.primary + '20', borderColor: currentThemeColors.primary }]}>
                    <ThemedText style={[styles.tagText, { color: currentThemeColors.primary }]}>{tenantType.charAt(0).toUpperCase() + tenantType.slice(1)}</ThemedText>
                  </View>
                ))}
              </View>
            </>
          )}

          {listing.amenities && listing.amenities.length > 0 && (
            <>
              <View style={[styles.separator, {backgroundColor: currentThemeColors.text + '20'}]} />
              <ThemedText style={[styles.sectionTitle, { color: currentThemeColors.text }]}>Amenities</ThemedText>
              <View style={styles.tagsContainer}>
                {listing.amenities.map((amenity, index) => (
                  <View key={index} style={[styles.tagChip, { backgroundColor: currentThemeColors.primary + '20', borderColor: currentThemeColors.primary }]}>
                    <ThemedText style={[styles.tagText, { color: currentThemeColors.primary }]}>{amenity}</ThemedText>
                  </View>
                ))}
              </View>
            </>
          )}
          
          <View style={[styles.separator, {backgroundColor: currentThemeColors.text + '20'}]} />
          <ThemedText style={[styles.sectionTitle, { color: currentThemeColors.text }]}>Description</ThemedText>
          <ThemedText style={[styles.descriptionText, { color: currentThemeColors.text }]}>{listing.description || 'No description available.'}</ThemedText>

          {listing.additionalInfo && (
            <>
              <View style={[styles.separator, {backgroundColor: currentThemeColors.text + '20'}]} />
              <ThemedText style={[styles.sectionTitle, { color: currentThemeColors.text }]}>Additional Info</ThemedText>
              <ThemedText style={[styles.descriptionText, { color: currentThemeColors.text }]}>{listing.additionalInfo}</ThemedText>
            </>
          )}

          {listing.postedDate && (
             <>
              <View style={[styles.separator, {backgroundColor: currentThemeColors.text + '20'}]} />
              <ThemedText style={[styles.sectionTitle, { color: currentThemeColors.text }]}>Posted On</ThemedText>
              <ThemedText style={[styles.descriptionText, { color: currentThemeColors.text }]}>{new Date(listing.postedDate).toLocaleDateString()}</ThemedText>
            </>
          )}

          {listing.ownerId && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: currentThemeColors.primary, marginTop: 30 }]}
              onPress={() => {
                router.push({ pathname: `../chat/${listing.ownerId}`, params: { recipientName: listing.title } });
              }}
            >
              <Ionicons name="chatbubbles-outline" size={20} color={currentThemeColors.background} style={{ marginRight: 8 }}/>
              <Text style={[styles.actionButtonText, { color: currentThemeColors.background }]}>Chat with Owner</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// (DetailItem component and styles StyleSheet.create block should be the same as the previous full version I sent)
// Make sure styles.galleryContainer and styles.galleryImage are as defined in my previous full response for [listingId].tsx
// which included windowWidth for galleryImage item wrappers.
const DetailItem = ({ label, value, icon, colorScheme }: { label: string; value?: string | number | boolean; icon?: React.ComponentProps<typeof Ionicons>['name']; colorScheme: 'light' | 'dark'}) => {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) return null;
  const currentThemeColors = Colors[colorScheme];
  const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value.toString();
  return (
    <View style={styles.detailItemContainer}>
      {icon && <Ionicons name={icon} size={20} color={currentThemeColors.primary} style={styles.detailItemIcon} />}
      <View style={styles.detailItemContent}>
        <ThemedText style={[styles.detailItemLabel, { color: currentThemeColors.text + '99' }]}>{label}</ThemedText>
        <ThemedText style={[styles.detailItemValue, { color: currentThemeColors.text }]}>{displayValue}</ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, },
  scrollViewContainer: { flex: 1, },
  scrollContentContainer: { paddingBottom: 40, },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, },
  galleryContainer: { height: 280, backgroundColor: '#F0F0F0', width: windowWidth },
  galleryImage: { width: '100%', height: '100%', }, // This is width/height of its parent View in renderItem
  content: { paddingHorizontal: 20, paddingVertical: 16, },
  mainTitleText: { fontSize: 26, fontWeight: 'bold', marginBottom: 6, },
  locationContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, },
  locationText: { fontSize: 16, marginLeft: 6, flexShrink: 1, },
  rentContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16, },
  rent: { fontSize: 28, fontWeight: 'bold', },
  rentLabel: { fontSize: 16, marginLeft: 4, },
  separator: { height: StyleSheet.hairlineWidth, marginVertical: 20, },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 16, },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', },
  detailItemContainer: { flexDirection: 'row', alignItems: 'flex-start', width: '50%', marginBottom: 16, paddingRight: 10, },
  detailItemIcon: { marginRight: 10, marginTop: 3, },
  detailItemContent: { flex: 1, },
  detailItemLabel: { fontSize: 14, marginBottom: 2, },
  detailItemValue: { fontSize: 16, fontWeight: '500', },
  descriptionText: { fontSize: 16, lineHeight: 24, },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, },
  tagChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, marginRight: 8, marginBottom: 8, borderWidth: 1, },
  tagText: { fontSize: 14, },
  actionButton: { flexDirection: 'row', paddingVertical: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, },
  actionButtonText: { fontSize: 16, fontWeight: 'bold', },
  errorText: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, },
  errorSubText: { fontSize: 16, textAlign: 'center', marginBottom: 20, },
});