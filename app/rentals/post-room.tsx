// app/rental/post-room.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import ThemedText from '../../components/ThemedText';
import { addMockListing } from '../../constants/Data';
import { Listing } from '../../constants/Types'; // Ensure your Listing type is comprehensive

export default function PostRoomScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() || 'light';
  const currentThemeColors = Colors[colorScheme];

  // Form field states
  const [rent, setRent] = useState('');
  const [city, setCity] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [locality, setLocality] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState(''); // Used for additionalInfo
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [furnishingStatus, setFurnishingStatus] = useState<'furnished' | 'semi-furnished' | 'unfurnished' | null>(null);
  const [showFurnishingPicker, setShowFurnishingPicker] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  // Optional: Request permissions when the component mounts
  // useEffect(() => {
  //   (async () => {
  //     if (Platform.OS !== 'web') {
  //       const mediaLibraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
  //       if (mediaLibraryStatus.status !== 'granted') {
  //         Alert.alert('Permission Denied', 'Camera roll access is needed to select photos.');
  //       }
  //     }
  //   })();
  // }, []);

  const pickImageAsync = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Denied", "You've refused to allow this app to access your photos!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5, // Example limit
      quality: 0.6,
    });

    if (!result.canceled && result.assets) {
      setSelectedImages(result.assets.map(asset => asset.uri));
    }
  };

  const furnishingStatusLabels: { [key: string]: string } = {
    unfurnished: 'Unfurnished',
    'semi-furnished': 'Semi-furnished',
    furnished: 'Furnished',
  };

  const handlePostListing = () => {
    if (!rent || !city || !description || !title || !type || !locality || !bedrooms || !bathrooms || !furnishingStatus) {
      Alert.alert('Missing Fields', 'Please fill in all required fields, including furnishing status.');
      return;
    }
    if (selectedImages.length === 0) {
      Alert.alert('Missing Image', 'Please add at least one photo for the listing.');
      return;
    }
    const parsedBedrooms = parseInt(bedrooms);
    const parsedBathrooms = parseInt(bathrooms);

    if (isNaN(parsedBedrooms) || isNaN(parsedBathrooms)) {
        Alert.alert('Invalid Input', 'Bedrooms and Bathrooms must be numbers.');
        return;
    }

    // Ensure your Listing type includes all these fields.
    // ownerId should ideally come from logged-in user context.
    const newListingData: Omit<Listing, 'id'> = {
      rent: parseFloat(rent) || 0,
      city,
      title,
      type,
      locality,
      image: selectedImages[0], // Use the first selected image as the main image
      imageUris: selectedImages,
      description,
      additionalInfo: requirements,
      ownerId: 'current_user_placeholder', // Placeholder
      bedrooms: parsedBedrooms,
      bathrooms: parsedBathrooms,
      furnishingStatus: furnishingStatus, // Now guaranteed to be one of the valid types by validation
      // Add other fields from your Listing type as needed
      // e.g. areaSqFt, preferredTenants, amenities, isAvailable, postedDate
    };

    addMockListing(newListingData);

    Alert.alert(
      'Listing Posted!',
      'Your listing has been added (for this session).',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };


  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentThemeColors.background }]}>
      <Stack.Screen
        options={{
          title: 'Post Your Room',
          headerTintColor: currentThemeColors.primary,
          headerStyle: { backgroundColor: currentThemeColors.background },
          headerShadowVisible: false,
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText style={[styles.pageTitle, { color: currentThemeColors.text }]}>
            Create New Listing
          </ThemedText>

          {/* ADD PHOTOS SECTION */}
          <ThemedText style={[styles.label, { color: currentThemeColors.text }]}>Photos (first will be main)</ThemedText>
          <TouchableOpacity
            style={[styles.addPhotosButton, { backgroundColor: currentThemeColors.primary }]}
            onPress={pickImageAsync}
          >
            <Ionicons name="camera-outline" size={22} color={currentThemeColors.background} style={{ marginRight: 8 }} />
            <Text style={[styles.addPhotosButtonText, { color: currentThemeColors.background }]}>Add Photos</Text>
          </TouchableOpacity>

          {selectedImages.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewContainer}>
              {selectedImages.map((uri, index) => (
                <View key={index} style={styles.previewImageWrapper}>
                  <Image source={{ uri }} style={styles.previewImage} />
                </View>
              ))}
            </ScrollView>
          )}

          {/* Title Input */}
          <ThemedText style={[styles.label, { color: currentThemeColors.text }]}>Title</ThemedText>
          <TextInput style={[styles.input, { borderColor: currentThemeColors.primary, color: currentThemeColors.text, backgroundColor: currentThemeColors.background }]} placeholder="e.g., Bright 2BHK with Park View" value={title} onChangeText={setTitle}/>

          {/* Type Input */}
          <ThemedText style={[styles.label, { color: currentThemeColors.text }]}>Type (e.g., Apartment, PG)</ThemedText>
          <TextInput style={[styles.input, { borderColor: currentThemeColors.primary, color: currentThemeColors.text, backgroundColor: currentThemeColors.background }]} placeholder="Apartment" value={type} onChangeText={setType}/>

          {/* Locality Input */}
          <ThemedText style={[styles.label, { color: currentThemeColors.text }]}>Locality</ThemedText>
          <TextInput style={[styles.input, { borderColor: currentThemeColors.primary, color: currentThemeColors.text, backgroundColor: currentThemeColors.background }]} placeholder="e.g., Andheri East" value={locality} onChangeText={setLocality}/>

          {/* Rent Input */}
          <ThemedText style={[styles.label, { color: currentThemeColors.text }]}>Rent (per month)</ThemedText>
          <TextInput style={[styles.input, { borderColor: currentThemeColors.primary, color: currentThemeColors.text, backgroundColor: currentThemeColors.background }]} placeholder="e.g., 15000" value={rent} onChangeText={setRent} keyboardType="numeric"/>

          {/* City Input */}
          <ThemedText style={[styles.label, { color: currentThemeColors.text }]}>City</ThemedText>
          <TextInput style={[styles.input, { borderColor: currentThemeColors.primary, color: currentThemeColors.text, backgroundColor: currentThemeColors.background }]} placeholder="e.g., Mumbai" value={city} onChangeText={setCity}/>

          {/* Bedrooms Input */}
          <ThemedText style={[styles.label, { color: currentThemeColors.text }]}>Bedrooms</ThemedText>
          <TextInput style={[styles.input, { borderColor: currentThemeColors.primary, color: currentThemeColors.text, backgroundColor: currentThemeColors.background }]} placeholder="e.g., 2" value={bedrooms} onChangeText={setBedrooms} keyboardType="numeric"/>

          {/* Bathrooms Input */}
          <ThemedText style={[styles.label, { color: currentThemeColors.text }]}>Bathrooms</ThemedText>
          <TextInput style={[styles.input, { borderColor: currentThemeColors.primary, color: currentThemeColors.text, backgroundColor: currentThemeColors.background }]} placeholder="e.g., 1" value={bathrooms} onChangeText={setBathrooms} keyboardType="numeric"/>

          {/* FURNISHING STATUS PICKER */}
          <ThemedText style={[styles.label, { color: currentThemeColors.text }]}>
            Furnishing Status
          </ThemedText>
          <TouchableOpacity
            style={[
              styles.pickerInputImitation,
              {
                borderColor: currentThemeColors.primary,
                backgroundColor: currentThemeColors.background,
              },
            ]}
            onPress={() => setShowFurnishingPicker(true)}
          >
            <Text style={{
                color: furnishingStatus ? currentThemeColors.text : currentThemeColors.tabIconDefault, // Use a placeholder color
                fontSize: 16,
                paddingVertical: Platform.OS === 'ios' ? 0 : 12 // Adjust padding for Android text alignment
              }}>
              {furnishingStatus ? furnishingStatusLabels[furnishingStatus] : "Pick an option..."}
            </Text>
          </TouchableOpacity>

          {showFurnishingPicker && (
            <Picker
              selectedValue={furnishingStatus || ""} // Use "" to match placeholder Picker.Item value
              onValueChange={(itemValue) => {
                if (itemValue === "") { // If placeholder is selected
                  setFurnishingStatus(null);
                } else {
                  setFurnishingStatus(itemValue as 'furnished' | 'semi-furnished' | 'unfurnished');
                }
                setShowFurnishingPicker(false);
              }}
              style={[
                styles.pickerItself,
                Platform.OS === 'android' ? { color: currentThemeColors.text, backgroundColor: currentThemeColors.background } : {},
                Platform.OS === 'ios' && { marginBottom: 20 } // Conditional margin for iOS when picker is shown
              ]}
              itemStyle={{ // Primarily for iOS wheel items
                color: currentThemeColors.text,
                fontSize: 16,
              }}
              dropdownIconColor={currentThemeColors.text}
            >
              <Picker.Item label="Pick an option..." value="" style={{color: currentThemeColors.tabIconDefault}} />
              <Picker.Item label="Unfurnished" value="unfurnished" />
              <Picker.Item label="Semi-furnished" value="semi-furnished" />
              <Picker.Item label="Furnished" value="furnished" />
            </Picker>
          )}

          {/* Description Input */}
          <ThemedText style={[styles.label, { color: currentThemeColors.text }]}>Description</ThemedText>
          <TextInput style={[styles.input, styles.textArea, { borderColor: currentThemeColors.primary, color: currentThemeColors.text, backgroundColor: currentThemeColors.background }]} placeholder="e.g., 2BHK with balcony, near metro..." value={description} onChangeText={setDescription} multiline numberOfLines={4}/>

          {/* Requirements Input (mapped to additionalInfo) */}
          <ThemedText style={[styles.label, { color: currentThemeColors.text }]}>Additional Info / Requirements (optional)</ThemedText>
          <TextInput style={[styles.input, styles.textArea, { borderColor: currentThemeColors.primary, color: currentThemeColors.text, backgroundColor: currentThemeColors.background }]} placeholder="e.g., Vegetarians only, no pets..." value={requirements} onChangeText={setRequirements} multiline numberOfLines={3}/>

          <TouchableOpacity
            style={[styles.postButton, { backgroundColor: currentThemeColors.primary }]}
            onPress={handlePostListing}
          >
            <Text style={[styles.postButtonText, { color: currentThemeColors.background }]}>POST LISTING</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  pickerInputImitation: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  pickerItself: {
    width: '100%',
    height: Platform.OS === 'android' ? 50 : 200,
    // Removed state-dependent marginBottom from here
  },
  addPhotosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  addPhotosButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    height: 110,
  },
  previewImageWrapper: {
    marginRight: 10,
    position: 'relative',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  postButton: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  postButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});