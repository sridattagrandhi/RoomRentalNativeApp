import React, { useState, useEffect, useCallback } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import ThemedText from '../../components/ThemedText';
import { addMockListing, findListingById, updateMockListing } from '../../constants/Data';
import { Listing } from '../../constants/Types'; // Ensure your Listing type is comprehensive

export default function PostRoomScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ listingId?: string; editMode?: string }>();
  const isEditMode = params.editMode === 'true';
  const editingListingId = params.listingId;

  const colorScheme = useColorScheme() || 'light';
  const currentThemeColors = Colors[colorScheme];

  const [isLoading, setIsLoading] = useState(isEditMode); // True if editing to load data

  // Form field states
  const [title, setTitle] = useState('');
  const [rent, setRent] = useState('');
  const [city, setCity] = useState('');
  const [locality, setLocality] = useState('');
  const [type, setType] = useState(''); // e.g., "Apartment", "PG"
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [areaSqFt, setAreaSqFt] = useState('');
  const [furnishingStatus, setFurnishingStatus] = useState<'furnished' | 'semi-furnished' | 'unfurnished' | null>(null);
  const [showFurnishingPicker, setShowFurnishingPicker] = useState(false);
  const [preferredTenantsInput, setPreferredTenantsInput] = useState(''); // Comma-separated
  const [amenitiesInput, setAmenitiesInput] = useState(''); // Comma-separated
  const [description, setDescription] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState(''); // Was 'requirements'
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isAvailable, setIsAvailable] = useState(true); // Default for new listings

  // Effect to pre-fill form if in edit mode
  useEffect(() => {
    if (isEditMode && editingListingId) {
      setIsLoading(true);
      const existingListing = findListingById(editingListingId);
      if (existingListing) {
        setTitle(existingListing.title);
        setRent(existingListing.rent.toString());
        setCity(existingListing.city);
        setLocality(existingListing.locality);
        setType(existingListing.type);
        setBedrooms(existingListing.bedrooms.toString());
        setBathrooms(existingListing.bathrooms.toString());
        setAreaSqFt(existingListing.areaSqFt?.toString() || '');
        setFurnishingStatus(existingListing.furnishingStatus);
        setPreferredTenantsInput((existingListing.preferredTenants || []).join(', '));
        setAmenitiesInput((existingListing.amenities || []).join(', '));
        setDescription(existingListing.description);
        setAdditionalInfo(existingListing.additionalInfo || '');
        setSelectedImages(existingListing.imageUris || (existingListing.image ? [existingListing.image] : []));
        setIsAvailable(existingListing.isAvailable !== undefined ? existingListing.isAvailable : true);
      } else {
        Alert.alert("Error", "Could not find the listing to edit. Please try again.", [{ text: 'OK', onPress: () => router.back() }]);
      }
      setIsLoading(false);
    } else {
      setIsLoading(false); // Not in edit mode, no pre-fill loading needed
    }
  }, [isEditMode, editingListingId]);

  const pickImageAsync = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Denied", "Access to photos is needed.");
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5,
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

  const handleFormSubmit = () => {
    if (!title || !rent || !city || !locality || !type || !bedrooms || !bathrooms || !furnishingStatus || !description ) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    if (selectedImages.length === 0) {
      Alert.alert('Missing Image', 'Please add at least one photo for the listing.');
      return;
    }

    const parsedRent = parseFloat(rent); // parseFloat can handle empty string -> NaN
    const parsedBedrooms = parseInt(bedrooms); // parseInt can handle empty string -> NaN
    const parsedBathrooms = parseInt(bathrooms); // parseInt can handle empty string -> NaN
    
    // --- MODIFIED VALIDATION FOR NUMERIC FIELDS ---
    if (isNaN(parsedRent) || isNaN(parsedBedrooms) || isNaN(parsedBathrooms) || 
        (areaSqFt.trim() !== '' && isNaN(Number(areaSqFt))) // Check if areaSqFt is non-empty AND not a number
    ) {
      Alert.alert('Invalid Input', 'Rent, Bedrooms, Bathrooms must be numbers. If Area is provided, it must also be a number.');
      return;
    }
    // --- END OF MODIFICATION ---

    const parsedAreaSqFt = areaSqFt.trim() !== '' ? Number(areaSqFt) : undefined;


    const listingDataPayload: Omit<Listing, 'id' | 'ownerId' | 'postedDate'> & { postedDate?: string } = {
      title,
      city,
      locality,
      rent: parsedRent,
      type,
      bedrooms: parsedBedrooms,
      bathrooms: parsedBathrooms,
      areaSqFt: parsedAreaSqFt,
      furnishingStatus,
      preferredTenants: preferredTenantsInput.split(',').map(t => t.trim()).filter(t => t),
      amenities: amenitiesInput.split(',').map(a => a.trim()).filter(a => a),
      description,
      additionalInfo,
      image: selectedImages[0],
      imageUris: selectedImages,
      isAvailable,
    };

    if (isEditMode && editingListingId) {
      const originalListing = findListingById(editingListingId);
      listingDataPayload.postedDate = originalListing?.postedDate || new Date().toISOString();

      const updated = updateMockListing(editingListingId, listingDataPayload);
      if (updated) {
        Alert.alert('Listing Updated!', 'Your listing has been successfully updated.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
         Alert.alert('Update Failed', 'Could not update your listing. Please try again.');
      }
    } else {
      const newListingForAdd: Omit<Listing, 'id' | 'ownerId'> = listingDataPayload;
      addMockListing(newListingForAdd);
      Alert.alert('Listing Posted!', 'Your listing has been added.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  };

  if (isLoading && isEditMode) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: currentThemeColors.background }]}>
        <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
            <ActivityIndicator size="large" color={currentThemeColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentThemeColors.background }]}>
      <Stack.Screen
        options={{
          title: isEditMode ? 'Edit Your Listing' : 'Post Your Room',
          headerTintColor: currentThemeColors.primary,
          headerStyle: { backgroundColor: currentThemeColors.background },
          headerShadowVisible: false,
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText style={[styles.pageTitle, { color: currentThemeColors.text }]}>
            {isEditMode ? 'Update Listing Details' : 'Create New Listing'}
          </ThemedText>

          {/* ADD PHOTOS SECTION */}
          <ThemedText style={[styles.label, { color: currentThemeColors.text }]}>Photos (first will be main)*</ThemedText>
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
                <View key={uri + index} style={styles.previewImageWrapper}>
                  <Image source={{ uri }} style={styles.previewImage} />
                </View>
              ))}
            </ScrollView>
          )}

          {/* FORM FIELDS */}
          <ThemedText style={[styles.label, { color: currentThemeColors.text }]}>Title*</ThemedText>
          <TextInput style={[styles.input, { borderColor: currentThemeColors.primary, color: currentThemeColors.text, backgroundColor: currentThemeColors.background }]} placeholder="e.g., Bright 2BHK with Park View" value={title} onChangeText={setTitle}/>

          <ThemedText style={[styles.label, { color: currentThemeColors.text }]}>Type (e.g., Apartment, PG)*</ThemedText>
          <TextInput style={[styles.input, { borderColor: currentThemeColors.primary, color: currentThemeColors.text, backgroundColor: currentThemeColors.background }]} placeholder="Apartment" value={type} onChangeText={setType}/>

          <ThemedText style={[styles.label, { color: currentThemeColors.text }]}>Locality*</ThemedText>
          <TextInput style={[styles.input, { borderColor: currentThemeColors.primary, color: currentThemeColors.text, backgroundColor: currentThemeColors.background }]} placeholder="e.g., Andheri East" value={locality} onChangeText={setLocality}/>

          <ThemedText style={[styles.label, { color: currentThemeColors.text }]}>Rent (per month)*</ThemedText>
          <TextInput style={[styles.input, { borderColor: currentThemeColors.primary, color: currentThemeColors.text, backgroundColor: currentThemeColors.background }]} placeholder="e.g., 15000" value={rent} onChangeText={setRent} keyboardType="numeric"/>

          <ThemedText style={[styles.label, { color: currentThemeColors.text }]}>City*</ThemedText>
          <TextInput style={[styles.input, { borderColor: currentThemeColors.primary, color: currentThemeColors.text, backgroundColor: currentThemeColors.background }]} placeholder="e.g., Mumbai" value={city} onChangeText={setCity}/>

          <ThemedText style={[styles.label, { color: currentThemeColors.text }]}>Bedrooms*</ThemedText>
          <TextInput style={[styles.input, { borderColor: currentThemeColors.primary, color: currentThemeColors.text, backgroundColor: currentThemeColors.background }]} placeholder="e.g., 2" value={bedrooms} onChangeText={setBedrooms} keyboardType="numeric"/>

          <ThemedText style={[styles.label, { color: currentThemeColors.text }]}>Bathrooms*</ThemedText>
          <TextInput style={[styles.input, { borderColor: currentThemeColors.primary, color: currentThemeColors.text, backgroundColor: currentThemeColors.background }]} placeholder="e.g., 1" value={bathrooms} onChangeText={setBathrooms} keyboardType="numeric"/>

          <ThemedText style={[styles.label, { color: currentThemeColors.text }]}>Area (sq ft)</ThemedText>
          <TextInput style={[styles.input, { borderColor: currentThemeColors.primary, color: currentThemeColors.text, backgroundColor: currentThemeColors.background }]} placeholder="e.g., 1200" value={areaSqFt} onChangeText={setAreaSqFt} keyboardType="numeric"/>

          <ThemedText style={[styles.label, { color: currentThemeColors.text }]}>Furnishing Status*</ThemedText>
          <TouchableOpacity
            style={[styles.pickerInputImitation, { borderColor: currentThemeColors.primary, backgroundColor: currentThemeColors.background, }]}
            onPress={() => setShowFurnishingPicker(true)}
          >
            <Text style={{ color: furnishingStatus ? currentThemeColors.text : currentThemeColors.tabIconDefault, fontSize: 16, paddingVertical: Platform.OS === 'ios' ? 0 : 12 }}>
              {furnishingStatus ? furnishingStatusLabels[furnishingStatus] : "Pick an option..."}
            </Text>
          </TouchableOpacity>
          {showFurnishingPicker && (
            <Picker
              selectedValue={furnishingStatus || ""}
              onValueChange={(itemValue) => {
                if (itemValue === "") { setFurnishingStatus(null); }
                else { setFurnishingStatus(itemValue as 'furnished' | 'semi-furnished' | 'unfurnished'); }
                setShowFurnishingPicker(false);
              }}
              style={[ styles.pickerItself, Platform.OS === 'android' ? { color: currentThemeColors.text, backgroundColor: currentThemeColors.background } : {}, Platform.OS === 'ios' && { marginBottom: 20 }]}
              itemStyle={{ color: currentThemeColors.text, fontSize: 16, }}
              dropdownIconColor={currentThemeColors.text}
            >
              <Picker.Item label="Pick an option..." value="" style={{color: currentThemeColors.tabIconDefault}} />
              <Picker.Item label="Unfurnished" value="unfurnished" />
              <Picker.Item label="Semi-furnished" value="semi-furnished" />
              <Picker.Item label="Furnished" value="furnished" />
            </Picker>
          )}

          <ThemedText style={[styles.label, { color: currentThemeColors.text }]}>Amenities (comma-separated)</ThemedText>
          <TextInput style={[styles.input, styles.textArea, { borderColor: currentThemeColors.primary, color: currentThemeColors.text, backgroundColor: currentThemeColors.background }]} placeholder="e.g., WiFi, AC, Parking" value={amenitiesInput} onChangeText={setAmenitiesInput} multiline numberOfLines={2}/>

          <ThemedText style={[styles.label, { color: currentThemeColors.text }]}>Preferred Tenants (comma-separated)</ThemedText>
          <TextInput style={[styles.input, styles.textArea, { borderColor: currentThemeColors.primary, color: currentThemeColors.text, backgroundColor: currentThemeColors.background }]} placeholder="e.g., bachelors, family" value={preferredTenantsInput} onChangeText={setPreferredTenantsInput} multiline numberOfLines={2}/>

          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 20}}>
            <ThemedText style={[styles.label, { color: currentThemeColors.text, marginBottom: 0, marginRight: 10 }]}>Is Available?</ThemedText>
            <TouchableOpacity onPress={() => setIsAvailable(!isAvailable)} style={{padding: 5}}>
                <Ionicons name={isAvailable ? "checkbox" : "square-outline"} size={24} color={currentThemeColors.primary} />
            </TouchableOpacity>
          </View>

          <ThemedText style={[styles.label, { color: currentThemeColors.text }]}>Description*</ThemedText>
          <TextInput style={[styles.input, styles.textArea, { borderColor: currentThemeColors.primary, color: currentThemeColors.text, backgroundColor: currentThemeColors.background }]} placeholder="e.g., 2BHK with balcony, near metro..." value={description} onChangeText={setDescription} multiline numberOfLines={4}/>

          <ThemedText style={[styles.label, { color: currentThemeColors.text }]}>Additional Info / Requirements (optional)</ThemedText>
          <TextInput style={[styles.input, styles.textArea, { borderColor: currentThemeColors.primary, color: currentThemeColors.text, backgroundColor: currentThemeColors.background }]} placeholder="e.g., Vegetarians only, no pets..." value={additionalInfo} onChangeText={setAdditionalInfo} multiline numberOfLines={3}/>

          <TouchableOpacity
            style={[styles.postButton, { backgroundColor: currentThemeColors.primary }]}
            onPress={handleFormSubmit}
          >
            <Text style={[styles.postButtonText, { color: currentThemeColors.background }]}>
              {isEditMode ? 'UPDATE LISTING' : 'POST LISTING'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Using the styles from your previous complete code block for post-room.tsx
const styles = StyleSheet.create({
  safeArea: { flex: 1, },
  container: { flex: 1, }, // Added for ThemedView if used as main wrapper inside SafeAreaView
  scrollView: { flex: 1, },
  scrollContentContainer: { padding: 20, paddingBottom: 40, },
  pageTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 25, textAlign: 'center', },
  label: { fontSize: 16, marginBottom: 8, fontWeight: '500', },
  input: { height: 50, borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, marginBottom: 20, fontSize: 16, },
  textArea: { minHeight: 80, textAlignVertical: 'top', paddingTop: 15, paddingBottom: 15 }, // Adjusted for better multiline
  pickerInputImitation: { borderWidth: 1, borderRadius: 8, marginBottom: 20, height: 50, justifyContent: 'center', paddingHorizontal: 15, },
  pickerItself: { width: '100%', height: Platform.OS === 'android' ? 50 : 200, },
  addPhotosButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, marginBottom: 15, },
  addPhotosButtonText: { fontSize: 16, fontWeight: '500', },
  imagePreviewContainer: { flexDirection: 'row', marginBottom: 20, height: 110, },
  previewImageWrapper: { marginRight: 10, position: 'relative', },
  previewImage: { width: 100, height: 100, borderRadius: 8, backgroundColor: '#e0e0e0', },
  postButton: { paddingVertical: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 10, },
  postButtonText: { fontSize: 18, fontWeight: 'bold', },
});