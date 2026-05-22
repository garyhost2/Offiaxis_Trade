import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { pendingSignUp, setPendingSignUp } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'gc' | 'trade' | null>(null);

  const handleGCOrPM = () => {
    setSelectedRole('gc');
    if (pendingSignUp) {
      setPendingSignUp({ ...pendingSignUp, accountType: 'gc', role: 'owner' });
    }
    router.push('/subscription-plans');
  };

  const handleTrade = () => {
    setSelectedRole('trade');
    if (pendingSignUp) {
      setPendingSignUp({ ...pendingSignUp, accountType: 'trade', role: 'owner' });
    }
    router.push('/trade-subscription');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconsContainer}>
            <View style={[styles.heroIconBubble, styles.heroIconBubble1]}>
              <Ionicons name="clipboard-outline" size={20} color="#6366F1" />
            </View>
            <View style={[styles.heroIconBubble, styles.heroIconBubble2]}>
              <Ionicons name="construct-outline" size={24} color="#F59E0B" />
            </View>
            <View style={[styles.heroIconBubble, styles.heroIconBubble3]}>
              <Ionicons name="home-outline" size={18} color="#10B981" />
            </View>
          </View>
          
          <Text style={styles.title}>Choose how you work</Text>
          <Text style={styles.description}>
            This helps us tailor OffiAxis to your role and show you the features that matter most.
          </Text>
        </View>

        {/* Role Cards Container */}
        <View style={styles.cardsContainer}>
          {/* General Contractor / Project Manager Card */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'gc' && styles.roleCardSelected
            ]}
            onPress={handleGCOrPM}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.roleIconGradient}
            >
              <Ionicons name="clipboard-outline" size={28} color="#FFFFFF" />
            </LinearGradient>
            
            <View style={styles.roleContent}>
              <View style={styles.roleHeader}>
                <Text style={styles.roleTitle}>General Contractor / Project Manager</Text>
                <View style={styles.roleArrow}>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
              </View>
              <Text style={styles.roleDescription}>
                Manage projects, teams, schedules, and client approvals.
              </Text>
              
            </View>
          </TouchableOpacity>

          {/* Trade Professional Card */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'trade' && styles.roleCardSelected
            ]}
            onPress={handleTrade}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#F59E0B', '#F97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.roleIconGradient}
            >
              <Ionicons name="construct-outline" size={28} color="#FFFFFF" />
            </LinearGradient>
            
            <View style={styles.roleContent}>
              <View style={styles.roleHeader}>
                <Text style={styles.roleTitle}>Trade Professional</Text>
                <View style={styles.roleArrow}>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
              </View>
              <Text style={styles.roleDescription}>
                Track jobs, materials, tasks, and field documentation.
              </Text>
              
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom Trust Badges */}
        <View style={styles.trustSection}>
          <View style={styles.trustBadge}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#10B981" />
            <Text style={styles.trustText}>Secure & Private</Text>
          </View>
          <View style={styles.trustDivider} />
          <View style={styles.trustBadge}>
            <Ionicons name="flash-outline" size={18} color="#6366F1" />
            <Text style={styles.trustText}>Quick Setup</Text>
          </View>
          <View style={styles.trustDivider} />
          <View style={styles.trustBadge}>
            <Ionicons name="heart-outline" size={18} color="#EC4899" />
            <Text style={styles.trustText}>Free Trial</Text>
          </View>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroIconsContainer: {
    width: 120,
    height: 80,
    position: 'relative',
    marginBottom: 24,
  },
  heroIconBubble: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  heroIconBubble1: {
    width: 44,
    height: 44,
    left: 0,
    top: 20,
  },
  heroIconBubble2: {
    width: 56,
    height: 56,
    left: 32,
    top: 0,
  },
  heroIconBubble3: {
    width: 40,
    height: 40,
    right: 0,
    top: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  roleCardSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#FAFAFF',
  },
  roleIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  roleContent: {
    flex: 1,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    paddingRight: 8,
  },
  roleArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  trustSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  trustDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconContainer: {
    marginBottom: 20,
  },
  modalIconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 24,
  },
  modalButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
