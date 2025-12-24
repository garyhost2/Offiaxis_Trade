import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { ActivityProvider } from '../contexts/ActivityContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ActivityProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="email-login" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="role-selection" />
          <Stack.Screen name="subscription-plans" />
          <Stack.Screen name="time-tracker-options" />
          <Stack.Screen name="trade-selection" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </ActivityProvider>
    </AuthProvider>
  );
}