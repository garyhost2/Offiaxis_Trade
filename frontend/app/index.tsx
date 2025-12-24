import React from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const handleEmailLogin = () => {
    router.push('/email-login');
  };

  const handleGoogleLogin = () => {
    login();
    router.push('/(tabs)/home');
  };

  const handleCreateAccount = () => {
    router.push('/signup');
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
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            activeOpacity={0.8}
          >
            <Image
              source={require('../assets/google-g-logo.png')}
              style={styles.googleLogo}
              resizeMode="contain"
            />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Footer Links */}
          <View style={styles.footerLinks}>
            <TouchableOpacity>
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.linkText}>Need Help?</Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.linkTextSmall}>Terms of Service</Text>
            {' • '}
            <Text style={styles.linkTextSmall}>Privacy Policy</Text>
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
});