// app/index.tsx
import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors'; // For spinner color

export default function IndexScreen() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    // Show a loading spinner while checking auth state
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (user) {
    // If user is logged in, redirect to the main app (tabs)
    console.log("Redirecting to (tabs)...");
    return <Redirect href="./(tabs)/" />;
  } else {
    // If user is not logged in, redirect to the login screen
    console.log("Redirecting to login...");
    return <Redirect href="/(auth)/login" />;
  }
}
