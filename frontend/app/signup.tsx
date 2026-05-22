import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setPendingSignUp, signInWithGoogle } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const params = response.params as Record<string, string>;
      const idToken = params.id_token ?? response.authentication?.idToken;
      const accessToken = params.access_token ?? response.authentication?.accessToken;

      if (!idToken && !accessToken) {
        Alert.alert('Google Sign Up Failed', 'No Google token was returned.');
        return;
      }

      setGoogleLoading(true);
      signInWithGoogle(idToken, accessToken)
        .then(() => router.replace('/(tabs)/home'))
        .catch((err: Error) => {
          Alert.alert('Google Sign Up Failed', err.message ?? 'Something went wrong.');
        })
        .finally(() => setGoogleLoading(false));
    } else if (response?.type === 'error') {
      Alert.alert('Google Sign Up', 'Sign up was cancelled or failed. Please try again.');
    }
  }, [response, router, signInWithGoogle]);

  const handleContinue = () => {
    // Validate password minimum 10 characters
    if (password.length < 10) {
      Alert.alert('Invalid Password', 'Password must be at least 10 characters long.');
      return;
    }

    if (!name.trim() || !email.trim()) {
      Alert.alert('Missing Information', 'Please fill in all fields.');
      return;
    }

    setPendingSignUp({
      displayName: name.trim(),
      email: email.trim(),
      password,
      role: 'owner',
    });

    router.push('/role-selection');
  };

  const handleGoogleSignup = () => {
    if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
      Alert.alert(
        'Google Not Configured',
        'Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID. Add Google client IDs to your frontend environment file.'
      );
      return;
    }

    void promptAsync();
  };

  const handleLoginRedirect = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.title}>Create an account</Text>

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              accessibilityLabel="Full name"
              textContentType="name"
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              accessibilityLabel="Email address"
              textContentType="emailAddress"
              autoComplete="email"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter password (min 10 characters)"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                accessibilityLabel="Password"
                textContentType="newPassword"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>Must be at least 10 characters</Text>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Continue to next step"
          >
            <LinearGradient
              colors={['#A78BFA', '#60A5FA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleLoginRedirect} accessibilityRole="button" accessibilityLabel="Log in to existing account">
              <Text style={styles.loginLink}>Log in</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Signup Button */}
          <TouchableOpacity
            style={[styles.googleButton, (googleLoading || !request) && styles.googleButtonDisabled]}
            onPress={handleGoogleSignup}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            disabled={googleLoading || !request}
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
              {googleLoading ? 'Signing in with Google...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.termsText}>
            {'By tapping "Continue", you agree to our'}{'\n'}
            <Text style={styles.termsLink}>Privacy Policy</Text>
            {' & '}
            <Text style={styles.termsLink}>Terms of Service</Text>
          </Text>
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#172a58',
    marginBottom: 32,
    letterSpacing: -0.5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingRight: 50,
    fontSize: 16,
    color: '#1F2937',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  helperText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
    marginLeft: 4,
  },
  continueButton: {
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 14,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '600',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loginText: {
    fontSize: 15,
    color: '#6B7280',
  },
  loginLink: {
    fontSize: 15,
    color: '#8B5CF6',
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
    opacity: 0.7,
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
  termsText: {
    textAlign: 'center',
    color: '#adb5bd',
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 16,
    fontWeight: '400',
  },
  termsLink: {
    color: '#adb5bd',
    fontWeight: '400',
  },
});
