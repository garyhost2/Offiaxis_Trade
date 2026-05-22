import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { isDevAuthEnabled, useAuth } from '../contexts/AuthContext';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithGoogle, devAdminLogin } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken =
        (response.params as Record<string, string>).id_token ??
        response.authentication?.idToken;
      const accessToken =
        (response.params as Record<string, string>).access_token ??
        response.authentication?.accessToken;

      setGoogleLoading(true);
      signInWithGoogle(idToken, accessToken)
        .then(() => router.replace('/(tabs)/home'))
        .catch((err: Error) =>
          Alert.alert('Google Sign In Failed', err.message ?? 'Something went wrong.')
        )
        .finally(() => setGoogleLoading(false));
    } else if (response?.type === 'error') {
      Alert.alert('Google Sign In', 'Sign in was cancelled or failed. Please try again.');
    }
  }, [response, router, signInWithGoogle]);

  const handleEmailLogin = () => {
    router.push('/email-login');
  };

  const handleGoogleLogin = () => {
    if (!request) {
      setAuthNotice('Google sign-in is not ready yet. Check the web client configuration and try again.');
      return;
    }
    void promptAsync();
  };

  const handleCreateAccount = () => {
    router.push('/signup');
  };

  const handleForgotPassword = () => {
    setAuthNotice('Password reset is not available in-app yet. Contact your workspace admin for access.');
  };

  const handleNeedHelp = () => {
    setAuthNotice('In-app support is not available yet. Contact support@offiaxis.com for help.');
  };

  const handleDevAdminLogin = async () => {
    await devAdminLogin();
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/cloud-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.appName}>OffiAxis</Text>
            <Text style={styles.appSubtitle}>Field Operations</Text>
            <Text style={styles.appTagline}>Your digital construction assistant</Text>
          </View>

          {/* Welcome Text */}
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.welcomeSubtext}>Sign in to continue to your workspace</Text>

          {/* Login Button */}
          <TouchableOpacity
            style={styles.emailLoginButton}
            onPress={handleEmailLogin}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Log in with Email"
            testID="login-email-button"
          >
            <LinearGradient
              colors={['#8B5CF6', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            >
              <MaterialIcons name="email" size={24} color="#FFFFFF" />
              <Text style={styles.emailLoginText}>Log in with Email</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Create Account Button */}
          <TouchableOpacity
            style={styles.createAccountButton}
            onPress={handleCreateAccount}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Create New Account"
            testID="create-account-button"
          >
            <Ionicons name="person-add-outline" size={24} color="#1F2937" />
            <Text style={styles.createAccountText}>Create New Account</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Login Button */}
          <TouchableOpacity
            style={[styles.googleButton, (googleLoading || !request) && styles.googleButtonDisabled]}
            onPress={handleGoogleLogin}
            activeOpacity={0.8}
            disabled={googleLoading || !request}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            accessibilityState={{ disabled: googleLoading || !request, busy: googleLoading }}
            testID="google-login-button"
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#4285F4" />
            ) : (
              <Image
                source={require('../assets/google-g-logo.png')}
                style={styles.googleLogo}
                resizeMode="contain"
              />
            )}
            <Text style={styles.googleButtonText}>
              {googleLoading ? 'Signing in...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          {/* Footer Links */}
          <View style={styles.footerLinks}>
            <TouchableOpacity
              onPress={handleForgotPassword}
              accessibilityRole="link"
              accessibilityLabel="Forgot Password?"
              testID="forgot-password-link"
            >
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleNeedHelp}
              accessibilityRole="link"
              accessibilityLabel="Need Help?"
              testID="need-help-link"
            >
              <Text style={styles.linkText}>Need Help?</Text>
            </TouchableOpacity>
          </View>

          {authNotice && (
            <View style={styles.authNotice} accessibilityRole="alert" testID="auth-notice">
              <Ionicons name="information-circle-outline" size={18} color="#1D4ED8" />
              <Text style={styles.authNoticeText}>{authNotice}</Text>
            </View>
          )}

          {/* Terms */}
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.linkTextSmall}>Terms of Service</Text>
            {' • '}
            <Text style={styles.linkTextSmall}>Privacy Policy</Text>
          </Text>

          {isDevAuthEnabled && (
            <TouchableOpacity
              style={styles.devBypassButton}
              onPress={() => { void handleDevAdminLogin(); }}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="DEV - Enter as Admin"
              testID="dev-admin-login-button"
            >
              <Text style={styles.devBypassText}>DEV - Enter as Admin</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 50 : 60,
    paddingBottom: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoImage: {
    width: 90,
    height: 90,
    marginBottom: 16,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2E3E7D',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 18,
    color: '#6c757d',
    marginBottom: 6,
    fontWeight: '500',
  },
  appTagline: {
    fontSize: 15,
    color: '#6c757d',
    fontWeight: '400',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#172a58',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: '#495057',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '400',
  },
  emailLoginButton: {
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  emailLoginText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '600',
  },
  createAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#dee2e6',
    gap: 10,
    marginBottom: 24,
  },
  createAccountText: {
    color: '#1F2937',
    fontSize: 19,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e9ecef',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#6c757d',
    fontSize: 14,
    fontWeight: '400',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#dee2e6',
    gap: 10,
    marginBottom: 24,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleLogo: {
    width: 24,
    height: 24,
  },
  googleButtonText: {
    color: '#1F2937',
    fontSize: 19,
    fontWeight: '600',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  authNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#DBEAFE',
    borderColor: '#93C5FD',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 20,
  },
  authNoticeText: {
    flex: 1,
    color: '#1D4ED8',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  linkText: {
    color: '#8B5CF6',
    fontSize: 15,
    fontWeight: '400',
  },
  termsText: {
    textAlign: 'center',
    color: '#adb5bd',
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 16,
    fontWeight: '400',
  },
  linkTextSmall: {
    color: '#adb5bd',
    fontWeight: '400',
  },
  devBypassButton: {
    marginTop: 20,
    alignSelf: 'center',
    backgroundColor: '#1a1a2e',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF4500',
  },
  devBypassText: {
    color: '#FF4500',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});