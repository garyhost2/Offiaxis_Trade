import React, { useState } from 'react';
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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EmailLoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password to continue.');
      return;
    }

    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in. Check your credentials and try again.');
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Gradient */}
          <LinearGradient
            colors={['#8B5CF6', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.header, { paddingTop: insets.top + 20 }]}
          >
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
              <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sign In</Text>
            <Text style={styles.headerSubtitle}>Enter your credentials to continue</Text>
          </LinearGradient>

          {/* Form Content */}
          <View style={styles.formContainer}>
            {/* Inline error */}
            {error && (
              <View style={styles.errorBanner} accessibilityLiveRegion="polite" accessibilityRole="alert">
                <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Email Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputContainer, focusedField === 'email' && styles.inputContainerFocused]}>
                <Ionicons name="mail-outline" size={20} color={focusedField === 'email' ? '#D97706' : '#9CA3AF'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="your.email@offiaxis.com"
                  placeholderTextColor="#C7C7CD"
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(null); }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  accessibilityLabel="Email address"
                  textContentType="emailAddress"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputContainer, focusedField === 'password' && styles.inputContainerFocused]}>
                <Ionicons name="lock-closed-outline" size={20} color={focusedField === 'password' ? '#D97706' : '#9CA3AF'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#C7C7CD"
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(null); }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  accessibilityLabel="Password"
                  textContentType="password"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
              onPress={handleSignIn}
              activeOpacity={0.8}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel={isLoading ? 'Signing in, please wait' : 'Sign in'}
              accessibilityState={{ disabled: isLoading }}
            >
              <LinearGradient
                colors={['#8B5CF6', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signInGradient}
              >
                <Text style={styles.signInButtonText}>{isLoading ? 'Signing In...' : 'Sign In'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPasswordButton} accessibilityRole="button" accessibilityLabel="Forgot password">
              <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
            </TouchableOpacity>
          </View>
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
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 60 : 70,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E0E7FF',
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    height: 56,
  },
  inputContainerFocused: {
    borderColor: '#D97706',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
    lineHeight: 18,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  eyeIcon: {
    padding: 4,
  },
  signInButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginBottom: 32,
  },
  forgotPasswordText: {
    fontSize: 15,
    color: '#8B5CF6',
    fontWeight: '500',
  },
});
