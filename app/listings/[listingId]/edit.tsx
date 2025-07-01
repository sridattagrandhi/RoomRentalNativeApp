// app/listings/[listingId]/edit.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  FlatList,
  StyleSheet,
  Dimensions,
  Alert,
  Text,
  Platform,
  Switch,
  TextInputProps,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { Listing } from '../../../constants/Types';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';

const windowWidth = Dimensions.get('window').width;
const BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:5001'
    : 'http://localhost:5001';

// Typed helper component for form fields
interface EditableFieldProps extends TextInputProps {
  label: string;
}
const EditableField: React.FC<EditableFieldProps> = ({ label, style, ...props }) => {
  const theme = Colors[useColorScheme() || 'light'];
  return (
    <View style={styles.fieldContainer}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <TextInput
        style={[styles.input, { borderColor: theme.text + '40', color: theme.text }, style]}
        placeholderTextColor={theme.text + '50'}
        {...props}
      />
    </View>
  );
};

export default function ListingEditScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const theme = Colors[useColorScheme() || 'light'];

  const [listing, setListing] = useState<Listing | null>(null);
  const [draft, setDraft] = useState<Partial<Listing>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch listing data
  const fetchListing = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/listings/${listingId}`);
      if (!res.ok) throw new Error('Could not load listing');
      const data: Listing = await res.json();
      if (data._id) data.id = data._id;
      setListing(data);
      setDraft(data);
    } catch (err: any) {
      Alert.alert('Error', err.message);
      router.back();
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  // Helper to update top-level fields like 'title', 'rent', etc.
  const updateField = (key: keyof Listing, value: any) => {
    setDraft(d => ({ ...d, [key]: value }));
  };

  // --- CORRECTED: More robust and type-safe helper for nested address fields ---
  const updateAddressField = (key: keyof Listing['address'], value: string) => {
    setDraft(currentDraft => {
      // Start with a default, empty address structure
      const defaultAddress = { street: '', locality: '', city: '', state: '', postalCode: '' };
      // Safely spread the existing address properties, or use the default
      const existingAddress = currentDraft.address || defaultAddress;

      return {
          ...currentDraft,
          address: {
              ...existingAddress,
              [key]: value,
          },
      }
    });
  };

  const handleSave = async () => {
    if (!firebaseUser || !listing) return;
    setSaving(true);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`${BASE_URL}/api/listings/${listing.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Save failed');
      }

      Alert.alert('Saved!', 'Your listing was updated.');
      // --- FIXED: Use the static route for pathname and pass listingId in params ---
      router.replace({ 
        pathname: '/listings/[listingId]', 
        params: { listingId: listing.id, from: 'edit' } 
      });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !listing) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>        
        <ActivityIndicator style={{ flex: 1 }} size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>      
      <Stack.Screen
        options={{
          headerTitle: 'Edit Listing',
          headerBackTitle: 'Cancel',
          headerTintColor: theme.primary,
          headerStyle: { backgroundColor: theme.background },
          headerShadowVisible: false,
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <FlatList
          data={listing.imageUris?.length ? listing.imageUris : [listing.image]}
          horizontal
          pagingEnabled
          keyExtractor={(_, i) => `img-${i}`}
          renderItem={({ item }) => (
            <Image
              source={{ uri: item }}
              style={[styles.image, { width: windowWidth }]}
            />
          )}
        />

        <View style={styles.formContainer}>
          <Text style={[styles.sectionHeader, { color: theme.text }]}>Primary Information</Text>
          <EditableField
            label="Title"
            value={draft.title}
            onChangeText={t => updateField('title', t)}
          />
          <EditableField
            label="Monthly Rent (₹)"
            value={draft.rent?.toString()}
            onChangeText={t => updateField('rent', Number(t.replace(/[^\d]/g, '')))}
            keyboardType="numeric"
          />

          <Text style={[styles.sectionHeader, { color: theme.text }]}>Location</Text>
          <EditableField
            label="Street Address"
            value={draft.address?.street}
            onChangeText={t => updateAddressField('street', t)}
          />
          <EditableField
            label="Locality / Neighborhood"
            value={draft.address?.locality}
            onChangeText={t => updateAddressField('locality', t)}
          />
          <EditableField
            label="City"
            value={draft.address?.city}
            onChangeText={t => updateAddressField('city', t)}
          />
          <EditableField
            label="State"
            value={draft.address?.state}
            onChangeText={t => updateAddressField('state', t)}
          />
          <EditableField
            label="Postal Code"
            value={draft.address?.postalCode}
            onChangeText={t => updateAddressField('postalCode', t)}
            keyboardType="numeric"
          />

          <Text style={[styles.sectionHeader, { color: theme.text }]}>Listing Details</Text>
          <EditableField
            label="Bedrooms"
            value={draft.bedrooms?.toString()}
            onChangeText={t => updateField('bedrooms', Number(t))}
            keyboardType="numeric"
          />
          <EditableField
            label="Bathrooms"
            value={draft.bathrooms?.toString()}
            onChangeText={t => updateField('bathrooms', Number(t))}
            keyboardType="numeric"
          />
          <EditableField
            label="Furnishing Status"
            value={draft.furnishingStatus}
            onChangeText={t => updateField('furnishingStatus', t)}
          />
          <EditableField
            label="Area (sqft)"
            value={draft.areaSqFt?.toString()}
            onChangeText={t => updateField('areaSqFt', Number(t))}
            keyboardType="numeric"
          />

          <View style={styles.switchContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Is Available Now?</Text>
            <Switch
              value={!!draft.isAvailable}
              onValueChange={v => updateField('isAvailable', v)}
              trackColor={{ false: theme.text + '30', true: theme.primary }}
              thumbColor={theme.background}
            />
          </View>

          <Text style={[styles.sectionHeader, { color: theme.text }]}>Description & More</Text>
          <EditableField
            label="Description"
            value={draft.description}
            onChangeText={t => updateField('description', t)}
            multiline
            numberOfLines={4}
          />
          <EditableField
            label="Amenities (comma-separated)"
            value={draft.amenities?.join(', ')}
            onChangeText={t => updateField('amenities', t.split(',').map(s => s.trim()))}
            placeholder="WiFi, AC, Parking..."
          />
          <EditableField
            label="Preferred Tenants (comma-separated)"
            value={draft.preferredTenants?.join(', ')}
            onChangeText={t => updateField('preferredTenants', t.split(',').map(s => s.trim()))}
            placeholder="Bachelors, Family..."
          />
          <EditableField
            label="Additional Info"
            value={draft.additionalInfo}
            onChangeText={t => updateField('additionalInfo', t)}
            multiline
            numberOfLines={2}
          />

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: saving ? theme.text + '50' : theme.primary }]}
              disabled={saving}
              onPress={handleSave}
            >
              {saving ? (
                <ActivityIndicator color={theme.background} />
              ) : (
                <Ionicons
                  name="save-outline"
                  size={20}
                  color={theme.background}
                  style={{ marginRight: 8 }}
                />
              )}
              <Text style={[styles.buttonText, { color: theme.background }]}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              disabled={saving}
              onPress={() => router.replace({ 
                pathname: '/listings/[listingId]', 
                params: { listingId: listing.id, from: 'edit' } 
              })}
            >
              <Text style={[styles.buttonText, { color: theme.text + '80' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContainer: { paddingBottom: 50 },
  image: { height: 240, resizeMode: 'cover', marginBottom: 10 },
  formContainer: { paddingHorizontal: 20 },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
    paddingBottom: 8,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    opacity: 0.8,
  },
  input: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  buttonsContainer: {
    marginTop: 30,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ccc',
    paddingTop: 20,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    marginTop: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});