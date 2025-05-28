// components/ListingCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Listing } from '../constants/Types';
import { Colors } from '../constants/Colors';
import ThemedText from './ThemedText';

interface ListingCardProps {
  listing: Listing;
  onPress: () => void;
}

export default function ListingCard({ listing, onPress }: ListingCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image
        // VVV MODIFY THE FILENAME IN THE REQUIRE STATEMENT BELOW VVV
        source={listing.image ? { uri: listing.image } : require('../assets/images/react-logo.png')} // Change this filename
        // For example: require('../assets/images/default-room.png')
        style={styles.image}
        onError={(error) => console.log("Failed to load image:", listing.image, "Error:", error.nativeEvent.error)}
      />
      <View style={styles.infoContainer}>
        <ThemedText style={styles.price}>₹{listing.rent.toLocaleString()}</ThemedText>
        <ThemedText style={styles.details}>{listing.title || `${listing.type} in ${listing.locality}`}</ThemedText>
        {listing.additionalInfo && (
          <ThemedText style={styles.additionalInfo}>{listing.additionalInfo}</ThemedText>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background, // Ensure Colors.background is defined or provide a fallback
    borderRadius: 8,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  image: {
    width: 100,
    height: 100,
    backgroundColor: '#e0e0e0', // A light grey background for the image area before it loads or if it fails
  },
  infoContainer: {
    padding: 12,
    flex: 1,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary, // Ensure Colors.primary is defined
    marginBottom: 4,
  },
  details: {
    fontSize: 14,
    color: Colors.text, // Ensure Colors.text is defined
    marginBottom: 4,
  },
  additionalInfo: {
    fontSize: 12,
    color: '#757575',
  }
});