import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Provider } from 'react-redux';
import { AuthProvider } from '../contexts/AuthContext';
import { useAuth } from '../contexts/AuthContext';
import { ActivityProvider } from '../contexts/ActivityContext';
import { RbacProvider } from '../shared/rbac/RbacContext';
import { store } from '../shared/store';

const PUBLIC_ROUTES = new Set([
  undefined,
  'index',
  'email-login',
  'signup',
  'role-selection',
  'subscription-plans',
  'trade-subscription',
  'time-tracker-options',
]);

const AUTH_ENTRY_ROUTES = new Set([undefined, 'index', 'email-login', 'signup']);

function AppStack() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useAuth();
  const rootSegment = segments[0];
  const isPublicRoute = PUBLIC_ROUTES.has(rootSegment);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/');
      return;
    }

    if (isAuthenticated && AUTH_ENTRY_ROUTES.has(rootSegment)) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, isLoading, isPublicRoute, rootSegment, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A5AE0" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="email-login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="role-selection" />
      <Stack.Screen name="subscription-plans" />
      <Stack.Screen name="trade-subscription" />
      <Stack.Screen name="time-tracker-options" />
      <Stack.Screen name="trade-selection" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <RbacProvider>
          <ActivityProvider>
            <AppStack />
          </ActivityProvider>
        </RbacProvider>
      </AuthProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});