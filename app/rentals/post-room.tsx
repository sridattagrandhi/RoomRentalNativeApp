// app/rental/post-room.tsx
import React, { useState, useEffect } from 'react';
import {
  Platform, View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Image, ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import ThemedText from '../../components/ThemedText';
import { findListingById } from '../../constants/Data';

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://localhost:5001';

// A predefined list of cities stored directly in the app
const CITIES = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Pune", "Chennai", "Kolkata"];

const uploadImageAndGetUrl = async (uri: string): Promise<string> =>
  new Promise(resolve => setTimeout(() => resolve(uri), 300));

export default function PostRoomScreen() {
  const router = useRouter();
  const { firebaseUser: user } = useAuth();
  const params = useLocalSearchParams<{ listingId?: string; editMode?: string; city?: string }>();
  const isEditMode = params.editMode === 'true';
  const editingListingId = params.listingId;
  const theme = Colors[useColorScheme() || 'light'];

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [rent, setRent] = useState('');
  const [street, setStreet] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState(params.city || CITIES[0]); // Default to the first city
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [type, setType] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [areaSqFt, setAreaSqFt] = useState('');
  const [furnishingStatus, setFurnishingStatus] = useState<'furnished' | 'semi-furnished' | 'unfurnished' | null>(null);
  const [showFurnishingPicker, setShowFurnishingPicker] = useState(false);
  const [amenitiesInput, setAmenitiesInput] = useState('');
  const [preferredTenantsInput, setPreferredTenantsInput] = useState('');
  const [description, setDescription] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);

  const furnishingStatusLabels: Record<string,string> = {
    unfurnished: 'Unfurnished',
    'semi-furnished': 'Semi-furnished',
    furnished: 'Furnished',
  };

  useEffect(() => {
    if (!isEditMode || !editingListingId) {
      setIsLoading(false);
      return;
    }
    (async () => {
      setIsLoading(true);
      try {
        const existing = findListingById(editingListingId); 
        if (!existing) throw new Error('Listing not found');
        
        setTitle(existing.title);
        setRent(existing.rent.toString());
        if (existing.address) {
          setStreet(existing.address.street);
          setLocality(existing.address.locality);
          setCity(existing.address.city);
          setState(existing.address.state);
          setPostalCode(existing.address.postalCode);
        }
        setType(existing.type);
        setBedrooms(existing.bedrooms.toString());
        setBathrooms(existing.bathrooms.toString());
        setAreaSqFt(existing.areaSqFt?.toString() || '');
        setFurnishingStatus(existing.furnishingStatus);
        setAmenitiesInput((existing.amenities || []).join(', '));
        setPreferredTenantsInput((existing.preferredTenants || []).join(', '));
        setDescription(existing.description);
        setAdditionalInfo(existing.additionalInfo || '');
        setSelectedImages(existing.imageUris || [existing.image]);
        setIsAvailable(existing.isAvailable ?? true);
      } catch {
        Alert.alert('Error','Could not load listing data for editing.');
        router.back();
      } finally {
        setIsLoading(false);
      }
    })();
  },[isEditMode,editingListingId]);

  const pickImageAsync = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied','We need access to your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      allowsMultipleSelection: true,
    });
    if (!result.canceled && result.assets) {
      setSelectedImages(currentImages => [...currentImages, ...result.assets.map(a => a.uri)]);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setSelectedImages(currentImages => currentImages.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async () => {
    if (!title || !rent || !street || !locality || !city || !state || !postalCode || !type || !bedrooms || !bathrooms || !furnishingStatus || !description) {
      Alert.alert('Missing Fields','Please fill in all required fields.');
      return;
    }
    if (selectedImages.length === 0) {
      Alert.alert('Missing Image','Please add at least one photo.');
      return;
    }
    if (!user) {
      Alert.alert('Not Authenticated','Please log in first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await user.getIdToken();
      const imageUris = await Promise.all(
        selectedImages.map(u => u.startsWith('http') ? u : uploadImageAndGetUrl(u))
      );

      const payload = {
        title,
        rent: parseFloat(rent),
        address: { street, locality, city, state, postalCode },
        type,
        bedrooms: parseInt(bedrooms, 10),
        bathrooms: parseInt(bathrooms, 10),
        areaSqFt: areaSqFt ? parseInt(areaSqFt, 10) : undefined,
        furnishingStatus,
        description,
        additionalInfo,
        image: imageUris[0],
        imageUris,
        isAvailable,
        amenities: amenitiesInput.split(',').map(s => s.trim()).filter(Boolean),
        preferredTenants: preferredTenantsInput.split(',').map(s => s.trim()).filter(Boolean),
      };

      const url = isEditMode ? `${BASE_URL}/api/listings/${editingListingId}` : `${BASE_URL}/api/listings`;
      const res = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      const txt = await res.text();
      if (!res.ok) {
        let msg: string;
        try { msg = JSON.parse(txt).message; }
        catch { msg = txt; }
        throw new Error(msg);
      }

      Alert.alert(
        isEditMode ? 'Listing Updated!' : 'Listing Posted!',
        'Your listing was saved successfully.',
        [{ 
          text: 'OK', 
          // --- FIXED: Use router.push to navigate back ---
          // This ensures the explore screen re-evaluates its focus state.
          onPress: () => router.push({ 
            pathname: '/rentals/explore', 
            params: { city: params.city || city }
          }) 
        }]
      );
    } catch (err: any) {
      Alert.alert('Submission Failed', err.message || String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: isEditMode ? 'Edit Listing' : 'Post Your Room' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText style={[styles.pageTitle, { color: theme.text }]}>{isEditMode ? 'Update Listing' : 'Create New Listing'}</ThemedText>
          
          <ThemedText style={[styles.label, { color: theme.text }]}>Photos (first is main)*</ThemedText>
          <TouchableOpacity style={[styles.addPhotosButton, { backgroundColor: theme.primary }]} onPress={pickImageAsync}>
            <Ionicons name="add-circle-outline" size={22} color={theme.background} style={{ marginRight: 8 }} />
            <Text style={[styles.addPhotosButtonText, { color: theme.background }]}>Add Photos</Text>
          </TouchableOpacity>
          {selectedImages.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewContainer}>
              {selectedImages.map((uri, index) => (
                <View key={index} style={styles.previewImageContainer}>
                  <Image source={{ uri }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.removeImageButton} onPress={() => handleRemoveImage(index)}>
                    <Ionicons name="close-circle" size={26} color="#00000090" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <ThemedText style={[styles.label, { color: theme.text }]}>Title*</ThemedText>
          <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text, backgroundColor: theme.background }]} placeholder="e.g., Bright 2BHK with Park View" placeholderTextColor={theme.text + '99'} value={title} onChangeText={setTitle} />
          
          <ThemedText style={[styles.label, { color: theme.text }]}>Street Address*</ThemedText>
          <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text, backgroundColor: theme.background }]} placeholder="e.g., 123 Main St, Apt 4B" placeholderTextColor={theme.text + '99'} value={street} onChangeText={setStreet} />

          <ThemedText style={[styles.label, { color: theme.text }]}>Locality / Neighborhood*</ThemedText>
          <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text, backgroundColor: theme.background }]} placeholder="e.g., Koregaon Park" placeholderTextColor={theme.text + '99'} value={locality} onChangeText={setLocality} />

          <ThemedText style={[styles.label, { color: theme.text }]}>City*</ThemedText>
          <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text, backgroundColor: theme.background }]} placeholder="e.g., Mumbai" placeholderTextColor={theme.text + '99'} value={city} onChangeText={setCity} />
          
          <ThemedText style={[styles.label, { color: theme.text }]}>State / Province*</ThemedText>
          <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text, backgroundColor: theme.background }]} placeholder="e.g., Maharashtra" placeholderTextColor={theme.text + '99'} value={state} onChangeText={setState} />

          <ThemedText style={[styles.label, { color: theme.text }]}>Postal Code*</ThemedText>
          <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text, backgroundColor: theme.background }]} placeholder="e.g., 411001" placeholderTextColor={theme.text + '99'} value={postalCode} onChangeText={setPostalCode} keyboardType="numeric" />

          <ThemedText style={[styles.label, { color: theme.text }]}>Rent (per month)*</ThemedText>
          <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text, backgroundColor: theme.background }]} placeholder="e.g., 25000" placeholderTextColor={theme.text + '99'} value={rent} onChangeText={setRent} keyboardType="numeric" />

          <ThemedText style={[styles.label, { color: theme.text }]}>Property Type*</ThemedText>
          <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text, backgroundColor: theme.background }]} placeholder="e.g., Apartment, Independent House" placeholderTextColor={theme.text + '99'} value={type} onChangeText={setType} />
          
          <ThemedText style={[styles.label, { color: theme.text }]}>Bedrooms*</ThemedText>
          <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text, backgroundColor: theme.background }]} placeholder="e.g., 2" placeholderTextColor={theme.text + '99'} value={bedrooms} onChangeText={setBedrooms} keyboardType="numeric" />

          <ThemedText style={[styles.label, { color: theme.text }]}>Bathrooms*</ThemedText>
          <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text, backgroundColor: theme.background }]} placeholder="e.g., 1" placeholderTextColor={theme.text + '99'} value={bathrooms} onChangeText={setBathrooms} keyboardType="numeric" />

          <ThemedText style={[styles.label, { color: theme.text }]}>Area (sq ft)</ThemedText>
          <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text, backgroundColor: theme.background }]} placeholder="e.g., 1200" placeholderTextColor={theme.text + '99'} value={areaSqFt} onChangeText={setAreaSqFt} keyboardType="numeric" />

          <ThemedText style={[styles.label, { color: theme.text }]}>Furnishing Status*</ThemedText>
          <TouchableOpacity style={[styles.input, { justifyContent: 'center', borderColor: theme.primary }]} onPress={() => setShowFurnishingPicker(true)}>
            <Text style={{ color: furnishingStatus ? theme.text : theme.text + '50' }}>{furnishingStatus ? furnishingStatusLabels[furnishingStatus] : 'Pick an option...'}</Text>
          </TouchableOpacity>
          {showFurnishingPicker && (
            <Picker selectedValue={furnishingStatus || ''} onValueChange={v => { setFurnishingStatus(v as any); setShowFurnishingPicker(false); }}>
              <Picker.Item label="Unfurnished" value="unfurnished" />
              <Picker.Item label="Semi-furnished" value="semi-furnished" />
              <Picker.Item label="Furnished" value="furnished" />
            </Picker>
          )}

          <ThemedText style={[styles.label, { color: theme.text }]}>Amenities (comma-separated)</ThemedText>
          <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text, backgroundColor: theme.background }]} placeholder="e.g., WiFi, AC, Parking" placeholderTextColor={theme.text + '99'} value={amenitiesInput} onChangeText={setAmenitiesInput} />

          <ThemedText style={[styles.label, { color: theme.text }]}>Preferred Tenants (comma-separated)</ThemedText>
          <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text, backgroundColor: theme.background }]} placeholder="e.g., Bachelors, Family" placeholderTextColor={theme.text + '99'} value={preferredTenantsInput} onChangeText={setPreferredTenantsInput} />

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <ThemedText style={[styles.label, { color: theme.text, marginBottom: 0, marginRight: 10 }]}>Is Available?</ThemedText>
            <TouchableOpacity onPress={() => setIsAvailable(!isAvailable)}>
              <Ionicons name={isAvailable ? 'checkbox' : 'square-outline'} size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>
          
          <ThemedText style={[styles.label, { color: theme.text }]}>Description*</ThemedText>
          <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text, backgroundColor: theme.background, height: 100, textAlignVertical: 'top', paddingTop: 15 }]} placeholder="Describe your property..." placeholderTextColor={theme.text + '99'} value={description} onChangeText={setDescription} multiline />
          
          <ThemedText style={[styles.label, { color: theme.text }]}>Additional Info (optional)</ThemedText>
          <TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text, backgroundColor: theme.background }]} placeholder="e.g., No pets allowed..." placeholderTextColor={theme.text + '99'} value={additionalInfo} onChangeText={setAdditionalInfo} />

          <TouchableOpacity
            style={[styles.postButton, { backgroundColor: theme.primary, opacity: isSubmitting ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? <ActivityIndicator color={theme.background} /> : <Text style={[styles.postButtonText, { color: theme.background }]}>{isEditMode ? 'UPDATE LISTING' : 'POST LISTING'}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContentContainer: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 16, marginBottom: 8, fontWeight: '500' },
  input: { height: 50, borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, marginBottom: 20, fontSize: 16 },
  pickerContainer: { height: 50, borderWidth: 1, borderRadius: 8, marginBottom: 20, justifyContent: 'center' },
  picker: { height: 50, width: '100%' },
  addPhotosButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, marginBottom: 15 },
  addPhotosButtonText: { fontSize: 16, fontWeight: '500' },
  imagePreviewContainer: { marginBottom: 20 },
  previewImageContainer: { position: 'relative', marginRight: 10, },
  previewImage: { width: 100, height: 100, borderRadius: 8, backgroundColor: '#eee' },
  removeImageButton: { position: 'absolute', top: -5, right: -5, backgroundColor: 'white', borderRadius: 13, },
  postButton: { paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  postButtonText: { fontSize: 18, fontWeight: 'bold' },
});
