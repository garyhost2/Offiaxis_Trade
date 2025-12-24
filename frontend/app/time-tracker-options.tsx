import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function TimeTrackerOptionsScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const searchParams = useLocalSearchParams();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Get subscription data from URL params - works on both web and native
  const adminUsers = parseInt(String(searchParams.adminUsers || '1'));
  const employeeUsers = parseInt(String(searchParams.employeeUsers || '0'));
  const hasInventory = String(searchParams.hasInventory) === 'true';
  
  // Debug logging
  console.log('Time Tracker Options - Params:', {
    adminUsers,
    employeeUsers,
    hasInventory,
    total: (adminUsers * 65) + (employeeUsers * 20) + (hasInventory ? 15 : 0)
  });

  const handleSubscribe = () => {
    if (!selectedOption) {
      return;
    }
    // Show payment modal
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = () => {
    // Close payment modal and navigate to app
    setShowPaymentModal(false);
    login();
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>One last step!</Text>
          <Text style={styles.headerSubtitle}>
            Before getting you started with keeping your organization all in one app
          </Text>
        </View>

        {/* Context Message */}
        <View style={styles.contextSection}>
          <View style={styles.contextBadge}>
            <Ionicons name="people" size={20} color="#3B82F6" />
            <Text style={styles.contextBadgeText}>Employee User</Text>
          </View>
          <Text style={styles.contextText}>
            Given that you have picked "Employee User," we have 3 options available for "Time Tracker". 
            Please select the one that best fits your needs.
          </Text>
        </View>

        {/* Options Section */}
        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>Choose Your Time Tracker Type</Text>

          {/* Option 1 - Simple */}
          <View style={styles.optionContainer}>
            <TouchableOpacity
              style={[styles.optionCard, selectedOption === 'simple' && styles.optionCardSelected]}
              onPress={() => setSelectedOption('simple')}
              activeOpacity={0.7}
            >
              <View style={styles.optionHeader}>
                <View style={styles.optionCheckbox}>
                  {selectedOption === 'simple' && (
                    <Ionicons name="checkmark" size={20} color="#3B82F6" />
                  )}
                </View>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>Time Tracker #1</Text>
                  <Text style={styles.optionSubtitle}>(Simple)</Text>
                </View>
              </View>
              <Text style={styles.optionDescription}>
                Basic manual clock-in/out system. Perfect for small teams who prefer time tracking managed by employees, where they can photograph paper timesheets or manually enter hours directly into the system.
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.videoPlaceholder} activeOpacity={0.7}>
              <View style={styles.playButtonContainer}>
                <Ionicons name="play" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.comingSoonBadge}>Coming Soon</Text>
            </TouchableOpacity>
          </View>

          {/* Option 2 - What Most Companies Use */}
          <View style={styles.optionContainer}>
            <TouchableOpacity
              style={[styles.optionCard, selectedOption === 'standard' && styles.optionCardSelected]}
              onPress={() => setSelectedOption('standard')}
              activeOpacity={0.7}
            >
              <View style={styles.optionHeader}>
                <View style={styles.optionCheckbox}>
                  {selectedOption === 'standard' && (
                    <Ionicons name="checkmark" size={20} color="#3B82F6" />
                  )}
                </View>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>Time Tracker #2</Text>
                  <Text style={styles.optionSubtitle}>(What most companies use)</Text>
                </View>
              </View>
              <Text style={styles.optionDescription}>
                Standard time tracking with photo verification and location stamps. The most popular choice for construction teams.
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.videoPlaceholder} activeOpacity={0.7}>
              <View style={styles.playButtonContainer}>
                <Ionicons name="play" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.comingSoonBadge}>Coming Soon</Text>
            </TouchableOpacity>
          </View>

          {/* Option 3 - Automated */}
          <View style={styles.optionContainer}>
            <TouchableOpacity
              style={[styles.optionCard, selectedOption === 'automated' && styles.optionCardSelected]}
              onPress={() => {
                setSelectedOption('automated');
                setShowDisclaimerModal(true); // Automatically show GPS disclosure
              }}
              activeOpacity={0.7}
            >
              <View style={styles.optionHeader}>
                <View style={styles.optionCheckbox}>
                  {selectedOption === 'automated' && (
                    <Ionicons name="checkmark" size={20} color="#3B82F6" />
                  )}
                </View>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>Time Tracker #3</Text>
                  <Text style={styles.optionSubtitle}>(Automated)</Text>
                </View>
              </View>
              <Text style={styles.optionDescription}>
                Fully automated GPS-based tracking. Automatically clocks in/out when arriving at or leaving job sites during scheduled hours.
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.videoPlaceholder} activeOpacity={0.7}>
              <View style={styles.playButtonContainer}>
                <Ionicons name="play" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.comingSoonBadge}>Coming Soon</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Disclaimer Section */}
        <View style={styles.disclaimerSection}>
          <TouchableOpacity
            style={styles.disclaimerButton}
            onPress={() => setShowDisclaimerModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
            <Text style={styles.disclaimerButtonText}>View Time-Tracking & GPS Disclosure</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Subscribe Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.subscribeButton, !selectedOption && styles.subscribeButtonDisabled]}
            onPress={handleSubscribe}
            activeOpacity={0.8}
            disabled={!selectedOption}
          >
            <LinearGradient
              colors={selectedOption ? ['#3B82F6', '#9333EA'] : ['#D1D5DB', '#9CA3AF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.subscribeGradient}
            >
              <Text style={styles.subscribeButtonText}>Subscribe and take me to the Home Page</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Disclaimer Modal */}
      <Modal
        visible={showDisclaimerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDisclaimerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Time-Tracking and GPS Usage Disclosure</Text>
              <TouchableOpacity onPress={() => setShowDisclaimerModal(false)}>
                <Ionicons name="close" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalWelcome}>Welcome to OffiAxis!</Text>
              <Text style={styles.modalText}>
                To make your workday easier, we use automated GPS-based time tracking during your scheduled work hours. Here's how it works:
              </Text>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Work Hours Only:</Text>
                <Text style={styles.modalText}>
                  We only track your location during your assigned work hours, starting when your shift begins and ending when your shift is over. Outside of those hours, the app will not track your location.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Purpose:</Text>
                <Text style={styles.modalText}>
                  The purpose of this tracking is simply to clock you in and out automatically when you arrive at or leave a job site. This makes timekeeping easier for everyone.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Consent:</Text>
                <Text style={styles.modalText}>
                  By continuing to use this app, you acknowledge and agree to this time-tracking method. If you have any questions or concerns, please let us know.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowDisclaimerModal(false);
                // If automated option is selected, proceed directly to payment
                if (selectedOption === 'automated') {
                  setShowPaymentModal(true);
                }
              }}
            >
              <Text style={styles.modalCloseButtonText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.paymentOverlay}>
          <View style={styles.paymentContent}>
            <View style={styles.paymentIconContainer}>
              <LinearGradient
                colors={['#3B82F6', '#9333EA']}
                style={styles.paymentIconGradient}
              >
                <Ionicons name="card" size={40} color="#FFFFFF" />
              </LinearGradient>
            </View>

            <Text style={styles.paymentTitle}>Complete Your Subscription</Text>
            <Text style={styles.paymentSubtitle}>Android Payment Gateway</Text>

            <View style={styles.paymentDetails}>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Subscription Plan:</Text>
                <Text style={styles.paymentValue}>OffiAxis Trade</Text>
              </View>
              {adminUsers > 0 && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Admin:</Text>
                  <Text style={styles.paymentValue}>${65 * adminUsers} / {adminUsers} {adminUsers === 1 ? 'User' : 'Users'} / Month</Text>
                </View>
              )}
              {employeeUsers > 0 && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Employees:</Text>
                  <Text style={styles.paymentValue}>${20 * employeeUsers} / {employeeUsers} {employeeUsers === 1 ? 'User' : 'Users'} / Month</Text>
                </View>
              )}
              {hasInventory && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Inventory Add-On:</Text>
                  <Text style={styles.paymentValue}>$15 / Month</Text>
                </View>
              )}
              <View style={styles.paymentDivider} />
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabelBold}>Total:</Text>
                <Text style={styles.paymentValueBold}>${(adminUsers * 65) + (employeeUsers * 20) + (hasInventory ? 15 : 0)}/month</Text>
              </View>
            </View>

            <Text style={styles.paymentNote}>
              This is a sample payment screen. In production, this would integrate with Google Play Billing.
            </Text>

            <TouchableOpacity
              style={styles.paymentButton}
              onPress={handlePaymentComplete}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#3B82F6', '#9333EA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.paymentButtonGradient}
              >
                <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.paymentButtonText}>Complete Subscription</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.paymentCancelButton}
              onPress={() => setShowPaymentModal(false)}
            >
              <Text style={styles.paymentCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#172a58',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  contextSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  contextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
    gap: 6,
  },
  contextBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  contextText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  optionsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#172a58',
    marginBottom: 16,
  },
  optionContainer: {
    marginBottom: 20,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optionCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  optionCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginLeft: 40,
  },
  videoPlaceholder: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    position: 'relative',
  },
  playButtonContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  disclaimerSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  disclaimerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 10,
  },
  disclaimerButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  subscribeButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  subscribeButtonDisabled: {
    opacity: 0.5,
  },
  subscribeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 8,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#172a58',
    flex: 1,
    marginRight: 12,
  },
  modalScroll: {
    paddingHorizontal: 24,
  },
  modalWelcome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 16,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalCloseButton: {
    marginHorizontal: 24,
    marginTop: 20,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  paymentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  paymentContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  paymentIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  paymentIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#172a58',
    textAlign: 'center',
    marginBottom: 8,
  },
  paymentSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  paymentDetails: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  paymentLabelBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  paymentValueBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  paymentDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  paymentNote: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  paymentButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  paymentButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  paymentButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  paymentCancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  paymentCancelText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
  },
});
