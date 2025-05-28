import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Still needed for the FAB icon

// We no longer need useSafeAreaInsets here if we're not building a fully custom header view manually
// import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ListingCard from '../../components/ListingCard';
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import { Colors } from '../../constants/Colors';
import { mockListings } from '../../constants/Data';
import { Listing } from '../../constants/Types';
import { styles as screenStyles } from './explore.styles'; // Assuming styles are in explore.styles.ts
import { useColorScheme } from '../../hooks/useColorScheme'; // To get current color scheme for headerTintColor

export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ city?: string }>();
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme() || 'light'; // For headerTintColor

  const city = params.city; // Used for filtering, not for header title anymore

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      // console.log("Explore screen focused. City:", city, "MockListings count:", mockListings.length);
      if (city) {
        const listingsForCity = mockListings.filter(
          (listing) => listing.city.toLowerCase() === city.toLowerCase()
        );
        setFilteredListings(listingsForCity);
      } else {
        setFilteredListings([]);
      }
      setIsLoading(false);

      return () => {
        // Optional: cleanup function when screen loses focus
        // console.log("Explore screen unfocused");
      };
    }, [city]) // Re-run if city changes (though focus will also trigger it)
  );

  const handleAddListing = () => {
    router.push('/rentals/post-room');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={screenStyles.safeArea}>
        <ThemedView style={[screenStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={screenStyles.safeArea}>
      <ThemedView style={screenStyles.container}>
        {/* Configure the default Stack Navigator header */}
        <Stack.Screen
          options={{
            headerShown: true,        // Show the default header
            title: 'Listings',                // No title text on the listings page itself
            headerBackTitle: 'Home',  // Set back button text to "Home" (primarily iOS)
            headerTintColor: Colors[colorScheme].primary, // Color for back arrow and back title
            // The default action for the back button is router.back(),
            // which will navigate to the previous screen (HomeScreen).

            // For Android, headerBackTitle doesn't show text by default.
            // If you need "< Home" on Android too, you might need a custom headerLeft,
            // but try without it first to keep it simple.
            // headerLeft: (props) => (
            //   <HeaderBackButton
            //     {...props}
            //     label="Home" // This label might show on some Androids or with custom config
            //     onPress={() => router.back()} // or router.replace('/(tabs)/'); if you want to be explicit
            //   />
            // ),
          }}
        />

        {filteredListings.length > 0 ? (
          <FlatList
            data={filteredListings}
            renderItem={({ item }) => (
              <ListingCard
                listing={item}
                onPress={() => router.push(`/listings/${item.id}`)}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={screenStyles.listContentContainer}
          />
        ) : (
          <View style={screenStyles.emptyContainer}>
            <ThemedText style={screenStyles.emptyText}>
              No listings found for {city || 'this city'} yet.
            </ThemedText>
            <ThemedText style={screenStyles.emptyText}>
              Be the first to add one!
            </ThemedText>
          </View>
        )}

        <TouchableOpacity style={screenStyles.fab} onPress={handleAddListing}>
          <Ionicons name="add" size={30} color={Colors[colorScheme].background} style={screenStyles.fabIcon} />
        </TouchableOpacity>
      </ThemedView>
    </SafeAreaView>
  );
}