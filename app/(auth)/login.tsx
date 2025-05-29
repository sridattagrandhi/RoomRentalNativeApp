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
  Image, // For logo
  Alert,
} from 'react-native';
import { Stack, useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { styles } from './auth.styles'; // Shared styles

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() || 'light';
  const currentThemeColors = Colors[colorScheme];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleLogin = () => {
    // Basic validation (expand as needed)
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Information', 'Please enter both email and password.');
      return;
    }
    // Simulate login success
    console.log('Login attempt with:', { email, password });
    Alert.alert('Login Successful (Template)', 'Welcome back!', [
      { text: 'OK', onPress: () => router.replace('../(tabs)/') }, // Navigate to home screen
    ]);
    // In a real app: API call, on success -> router.replace('/(tabs)/');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentThemeColors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <View style={styles.logoContainer}>
              {/* Replace with your app's logo */}
              <Ionicons name="home" size={80} color={currentThemeColors.primary} />
            </View>

            <Text style={[styles.title, { color: currentThemeColors.text }]}>Welcome Back!</Text>
            <Text style={[styles.subtitle, { color: currentThemeColors.text + 'AA' }]}>
              Log in to continue your journey.
            </Text>

            <View style={[styles.inputContainer, { borderColor: currentThemeColors.text + '30', backgroundColor: currentThemeColors.background + (colorScheme === 'light' ? '' : '11') }]}>
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

            <View style={[styles.inputContainer, { borderColor: currentThemeColors.text + '30', backgroundColor: currentThemeColors.background + (colorScheme === 'light' ? '' : '11') }]}>
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
            <TouchableOpacity onPress={() => Alert.alert("Forgot Password", "Forgot password functionality to be implemented.")}>
                <Text style={[styles.forgotPasswordText, { color: currentThemeColors.primary }]}>Forgot Password?</Text>
            </TouchableOpacity>


            <TouchableOpacity
              style={[styles.button, { backgroundColor: currentThemeColors.primary }]}
              onPress={handleLogin}
            >
              <Text style={[styles.buttonText, { color: currentThemeColors.background }]}>Login</Text>
            </TouchableOpacity>

            {/* Optional: Social Logins */}
            <Text style={[styles.orText, {color: currentThemeColors.text+'AA'}]}>OR</Text>
            <TouchableOpacity style={[styles.socialButton, {borderColor: currentThemeColors.text+'30'}]}>
                <Ionicons name="logo-google" size={22} color={currentThemeColors.text} style={styles.socialIcon} />
                <Text style={[styles.socialButtonText, {color: currentThemeColors.text}]}>Continue with Google</Text>
            </TouchableOpacity>
            {/* Add Apple login for iOS if desired */}


            <View style={styles.linkContainer}>
              <Text style={[styles.linkText, { color: currentThemeColors.text + 'AA' }]}>Don't have an account?</Text>
              <Link href="./signup" asChild>
                <TouchableOpacity>
                  <Text style={[styles.linkActionText, { color: currentThemeColors.primary }]}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}