// app/(auth)/signup.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  // Image, // We are using Ionicons for the logo here
  Alert,
  StyleSheet, // Import StyleSheet if styles are defined in this file (but we use auth.styles.ts)
} from 'react-native';
import { Stack, useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Adjust these paths if your project structure is different
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { styles } from './auth.styles'; // Shared styles from app/(auth)/auth.styles.ts

export default function SignupScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() || 'light'; // Default to light if undefined
  const currentThemeColors = Colors[colorScheme]; // Access themed colors

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const handleSignup = () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Missing Information', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    // Simulate signup success
    console.log('Signup attempt with:', { name, email, password });
    Alert.alert('Signup Successful (Template)', 'Your account has been created!', [
      { text: 'OK', onPress: () => router.replace('/(auth)/login') }, // Navigate to login screen
    ]);
    // In a real app: API call to register user, on success -> router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentThemeColors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} // Adjust if necessary
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <View style={styles.logoContainer}>
              {/* Using an icon as a logo placeholder */}
              <Ionicons name="person-add-outline" size={80} color={currentThemeColors.primary} />
            </View>

            <Text style={[styles.title, { color: currentThemeColors.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: currentThemeColors.text + 'AA' }]}>
              Join us and start finding your perfect room.
            </Text>

            {/* Full Name Input */}
            <View style={[styles.inputContainer, { borderColor: currentThemeColors.text + '30', backgroundColor: currentThemeColors.background + (colorScheme === 'light' ? '' : '1A') }]}>
              <Ionicons name="person-outline" size={22} color={currentThemeColors.text + '99'} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: currentThemeColors.text }]}
                placeholder="Full Name"
                placeholderTextColor={currentThemeColors.text + '99'}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            {/* Email Input */}
            <View style={[styles.inputContainer, { borderColor: currentThemeColors.text + '30', backgroundColor: currentThemeColors.background + (colorScheme === 'light' ? '' : '1A') }]}>
              <Ionicons name="mail-outline" size={22} color={currentThemeColors.text + '99'} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: currentThemeColors.text }]}
                placeholder="Email Address"
                placeholderTextColor={currentThemeColors.text + '99'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Input */}
            <View style={[styles.inputContainer, { borderColor: currentThemeColors.text + '30', backgroundColor: currentThemeColors.background + (colorScheme === 'light' ? '' : '1A') }]}>
              <Ionicons name="lock-closed-outline" size={22} color={currentThemeColors.text + '99'} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: currentThemeColors.text }]}
                placeholder="Password"
                placeholderTextColor={currentThemeColors.text + '99'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
              />
               <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={{ padding: 5 }}>
                <Ionicons name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={24} color={currentThemeColors.text + '99'} />
              </TouchableOpacity>
            </View>

            {/* Confirm Password Input */}
            <View style={[styles.inputContainer, { borderColor: currentThemeColors.text + '30', backgroundColor: currentThemeColors.background + (colorScheme === 'light' ? '' : '1A') }]}>
              <Ionicons name="lock-closed-outline" size={22} color={currentThemeColors.text + '99'} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: currentThemeColors.text }]}
                placeholder="Confirm Password"
                placeholderTextColor={currentThemeColors.text + '99'}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!isConfirmPasswordVisible}
              />
              <TouchableOpacity onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)} style={{ padding: 5 }}>
                <Ionicons name={isConfirmPasswordVisible ? "eye-off-outline" : "eye-outline"} size={24} color={currentThemeColors.text + '99'} />
              </TouchableOpacity>
            </View>

            {/* Signup Button */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: currentThemeColors.primary, marginTop: 20 }]}
              onPress={handleSignup}
            >
              <Text style={[styles.buttonText, { color: currentThemeColors.background }]}>Sign Up</Text>
            </TouchableOpacity>

            {/* Link to Login */}
            <View style={styles.linkContainer}>
              <Text style={[styles.linkText, { color: currentThemeColors.text + 'AA' }]}>Already have an account?</Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={[styles.linkActionText, { color: currentThemeColors.primary }]}>Login</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}