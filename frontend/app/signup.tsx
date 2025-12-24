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
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [name, setName] = useState('Yefry Soto');
  const [email, setEmail] = useState('Yefry@OffiAxis.com');
  const [password, setPassword] = useState('OffiAxis2025!');
  const [showPassword, setShowPassword] = useState(false);

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

    // Navigate to role selection
    router.push('/role-selection');
  };

  const handleGoogleSignup = () => {
    // Mock Google signup
    login();
    router.replace('/(tabs)/home');
  };

  const handleLoginRedirect = () => {
    router.back();
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
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
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
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
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
            <TouchableOpacity onPress={handleLoginRedirect}>
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
            style={styles.googleButton}
            onPress={handleGoogleSignup}
            activeOpacity={0.8}
          >
            <Image
              source={require('../assets/google-g-logo.png')}
              style={styles.googleLogo}
              resizeMode="contain"
            />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.termsText}>
            By tapping "Continue", you agree to our{'\n'}
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
