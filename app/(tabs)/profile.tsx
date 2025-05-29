import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  StyleSheet, // Ensure StyleSheet is imported if styles are defined here
} from 'react-native';
import { Stack, useRouter } from 'expo-router'; // useRouter is already here
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { UserProfile } from '../../constants/Types';
import { mockUserProfile /*, updateMockUserProfile */ } from '../../constants/Data'; // updateMockUserProfile might be used differently
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import { styles } from './profile.styles'
// Assuming profile.styles.ts is in the same directory or you define styles here
// If it's separate: import { styles } from './profile.styles';

// Helper component for editable fields (keep this as it was)
interface EditableFieldProps {
  label: string;
  value: string | undefined;
  onSave: (newValue: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  multiline?: boolean;
  themeColors: typeof Colors.light | typeof Colors.dark;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  onSave,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  themeColors,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || '');

  useEffect(() => {
    setCurrentValue(value || '');
  }, [value]);

  const handleSave = () => {
    onSave(currentValue);
    setIsEditing(false);
  };

  return (
    <View style={[styles.infoItem, isEditing && styles.infoItemEditable]}>
      <View style={{ flex: 1 }}>
        <ThemedText style={[styles.label, { color: themeColors.text + '99' }]}>{label}</ThemedText>
        {isEditing ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              style={[
                styles.textInput,
                multiline && styles.bioInput,
                { color: themeColors.text, borderBottomColor: themeColors.primary },
              ]}
              value={currentValue}
              onChangeText={setCurrentValue}
              placeholder={placeholder || `Enter ${label.toLowerCase()}`}
              placeholderTextColor={themeColors.text + '70'}
              keyboardType={keyboardType}
              multiline={multiline}
              autoFocus
            />
            <TouchableOpacity onPress={handleSave} style={styles.saveButtonContainer}>
              <View style={[styles.saveButton, { backgroundColor: themeColors.primary }]}>
                <Text style={[styles.saveButtonText, { color: themeColors.background }]}>Save</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <ThemedText style={[styles.valueText, { color: themeColors.text }]}>
              {value || `No ${label.toLowerCase()} set`}
            </ThemedText>
            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editIconTouchable}>
              <Ionicons name="pencil-outline" size={20} color={themeColors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};


export default function ProfileScreen() {
  const router = useRouter(); // useRouter is already imported
  const colorScheme = useColorScheme() || 'light';
  const currentThemeColors = Colors[colorScheme];

  const [userProfile, setUserProfile] = useState<UserProfile>(mockUserProfile);
  const [profileImageUri, setProfileImageUri] = useState<string | undefined>(mockUserProfile.profileImageUrl);


  const handleProfileUpdate = (field: keyof UserProfile, newValue: string) => {
    setUserProfile(prev => {
      const updatedProfile = { ...prev, [field]: newValue };
      console.log(`Updating ${field} to:`, newValue);
      // In a real app, call API to update backend
      // updateMockUserProfile({ [field]: newValue }); // Example if you had a central mock update
      return updatedProfile;
    });
  };

  const pickImageAsync = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Denied", "Access to photos is needed to update your profile picture.");
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newUri = result.assets[0].uri;
      setProfileImageUri(newUri);
      setUserProfile(prev => ({...prev, profileImageUrl: newUri}));
    }
  };

  // --- NEW LOGOUT HANDLER ---
  const handleLogout = () => {
    // In a real app, you would clear any stored tokens, user data, etc.
    console.log("User logging out...");
    // Navigate to the login screen, replacing the current history stack
    // so the user can't go back to the profile page.
    router.replace('/(auth)/login');
  };
  // --- END OF NEW LOGOUT HANDLER ---


  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentThemeColors.background }]}>
      <Stack.Screen
        options={{
          title: 'My Profile',
          headerTintColor: currentThemeColors.primary,
          headerStyle:{backgroundColor: currentThemeColors.background},
          headerShadowVisible: Platform.OS === 'ios',
          //borderBottomWidth: Platform.OS === 'android' ? StyleSheet.hairlineWidth : 0,
          //borderBottomColor: currentThemeColors.text + '20',
        }}
      />
      <ThemedView style={styles.container}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header Section (Image, Name, Email) */}
          <View style={[styles.headerSection, { backgroundColor: currentThemeColors.background }]}>
            <TouchableOpacity onPress={pickImageAsync}>
              <Image
                source={profileImageUri ? { uri: profileImageUri } : require('../../assets/images/avatar.jpg')} // Using avatar.jpg as default
                style={[styles.profileImage, { borderColor: currentThemeColors.primary }]}
              />
              <View style={{position: 'absolute', bottom: 10, right: 5, backgroundColor: currentThemeColors.background, borderRadius: 15, padding:5, elevation: 2, shadowColor: '#000', shadowOffset: {width:0, height:1}, shadowOpacity:0.2, shadowRadius:1}}>
                 <Ionicons name="camera-outline" size={20} color={currentThemeColors.primary} />
              </View>
            </TouchableOpacity>
            <ThemedText style={[styles.userName, { color: currentThemeColors.text }]}>{userProfile.name}</ThemedText>
            <ThemedText style={[styles.userEmail, { color: currentThemeColors.text + 'AA' }]}>{userProfile.email}</ThemedText>
          </View>

          {/* Editable Info Section */}
          <View style={styles.infoSection}>
            <EditableField label="Full Name" value={userProfile.name} onSave={(newValue) => handleProfileUpdate('name', newValue)} themeColors={currentThemeColors}/>
            <EditableField label="Email Address" value={userProfile.email} onSave={(newValue) => handleProfileUpdate('email', newValue)} keyboardType="email-address" themeColors={currentThemeColors}/>
            <EditableField label="Phone Number" value={userProfile.phone} onSave={(newValue) => handleProfileUpdate('phone', newValue)} keyboardType="phone-pad" placeholder="Add phone number" themeColors={currentThemeColors}/>
            <EditableField label="Bio" value={userProfile.bio} onSave={(newValue) => handleProfileUpdate('bio', newValue)} multiline placeholder="Tell us about yourself" themeColors={currentThemeColors}/>
          </View>

          {/* Actions Section */}
          <View style={styles.actionsSection}>
            <TouchableOpacity style={[styles.actionButton, {borderBottomColor: currentThemeColors.text + '20'}]}>
                <Ionicons name="settings-outline" size={22} color={currentThemeColors.primary} />
                <ThemedText style={[styles.actionButtonText, {color: currentThemeColors.text}]}>Account Settings</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, {borderBottomColor: currentThemeColors.text + '20'}]}>
                <Ionicons name="help-circle-outline" size={22} color={currentThemeColors.primary} />
                <ThemedText style={[styles.actionButtonText, {color: currentThemeColors.text}]}>Help & Support</ThemedText>
            </TouchableOpacity>
            {/* --- UPDATED LOGOUT BUTTON --- */}
            <TouchableOpacity
              style={[styles.actionButton, {borderBottomColor: currentThemeColors.text + '20'}]}
              onPress={handleLogout} // Added onPress handler
            >
                <Ionicons name="log-out-outline" size={22} color={Colors.light.accent} /> {/* Or use a themed color: currentThemeColors.accent or a specific error/logout color */}
                <ThemedText style={[styles.actionButtonText, {color: Colors.light.accent}]}>Logout</ThemedText>
            </TouchableOpacity>
            {/* --- END OF UPDATED LOGOUT BUTTON --- */}
          </View>

        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}
