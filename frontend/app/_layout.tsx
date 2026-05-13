import React from 'react';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { AuthProvider } from '../contexts/AuthContext';
import { ActivityProvider } from '../contexts/ActivityContext';
import { RbacProvider } from '../shared/rbac/RbacContext';
import { store } from '../shared/store';

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <RbacProvider>
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
        </RbacProvider>
      </AuthProvider>
    </Provider>
  );
}