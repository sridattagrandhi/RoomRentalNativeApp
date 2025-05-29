// app/index.tsx
import { Redirect } from 'expo-router';
import React from 'react';

export default function IndexScreen() {
  // For now, we always redirect to the login screen.
  // In a real app with authentication, you would check here:
  // - If the user is logged in, redirect to '/(tabs)/' or your main app screen.
  // - If the user is NOT logged in, redirect to '/(auth)/login'.

  return <Redirect href="/(auth)/login" />;
}