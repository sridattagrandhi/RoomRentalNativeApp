import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons'; // Or your preferred icon set
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme() || 'light';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
        headerShown: false, // Tabs navigator itself won't show a header per tab screen
      }}>
      <Tabs.Screen
        name="index" // This refers to app/(tabs)/index.tsx (HomeScreen)
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      {/*
        Ensure there is NO <Tabs.Screen name="explore" ... /> entry here.
        explore.tsx will be a regular screen pushed onto the stack, not a tab.
      */}
      {/* Add any OTHER actual tabs you want here, for example:
      <Tabs.Screen
        name="profile" // This would refer to app/(tabs)/profile.tsx
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={size} />
          ),
        }}
      />
      */}
    </Tabs>
  );
}