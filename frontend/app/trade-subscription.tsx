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
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function TradeSubscriptionScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [adminUsers, setAdminUsers] = useState(1);
  const [employeeUsers, setEmployeeUsers] = useState(0);
  const [inventoryAccordionOpen, setInventoryAccordionOpen] = useState(false);
  const [aiJobWalkAccordionOpen, setAiJobWalkAccordionOpen] = useState(false);
  const [knowledgeCenterAccordionOpen, setKnowledgeCenterAccordionOpen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const toggleAddon = (addon: string) => {
    if (selectedAddons.includes(addon)) {
      setSelectedAddons(selectedAddons.filter(item => item !== addon));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const handleContinue = () => {
    if (employeeUsers > 0) {
      const params = new URLSearchParams({
        adminUsers: adminUsers.toString(),
        employeeUsers: employeeUsers.toString(),
        hasInventory: selectedAddons.includes('inventory').toString(),
      });
      router.push(`/time-tracker-options?${params.toString()}`);
    } else {
      setShowPaymentModal(true);
    }
  };

  const handlePaymentComplete = () => {
    setShowPaymentModal(false);
    login();
    router.replace('/(tabs)/home');
  };

  const calculateTotal = () => {
    let total = adminUsers * 65;
    total += employeeUsers * 20;
    if (selectedAddons.includes('inventory')) total += 15;
    if (selectedAddons.includes('aiJobWalk')) total += 19;
    if (selectedAddons.includes('knowledgeCenter')) total += 15;
    return total;
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
          <View style={styles.roleTag}>
            <Ionicons name="construct-outline" size={14} color="#F59E0B" />
            <Text style={styles.roleTagText}>Trade Professional</Text>
          </View>
          <Text style={styles.headerTitle}>One last step!</Text>
          <Text style={styles.headerSubtitle}>Before getting you started with keeping your organization all in one app</Text>
        </View>

        {/* Main Pricing Cards */}
        <View style={styles.pricingSection}>
          <Text style={styles.sectionTitle}>Core Plans</Text>
          
          {/* Admin User Card */}
          <View style={styles.pricingCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="shield-checkmark" size={32} color="#3B82F6" />
              <Text style={styles.cardTitle}>Admin User</Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.priceSymbol}>$</Text>
              <Text style={styles.priceAmount}>65</Text>
              <Text style={styles.pricePeriod}>/month</Text>
            </View>
            <Text style={styles.priceDescription}>per admin user</Text>
            
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>Number of Admin Users:</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={[styles.quantityButton, adminUsers <= 1 && styles.quantityButtonDisabled]}
                  onPress={() => setAdminUsers(Math.max(1, adminUsers - 1))}
                  disabled={adminUsers <= 1}
                >
                  <Ionicons name="remove" size={20} color={adminUsers <= 1 ? "#9CA3AF" : "#3B82F6"} />
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{adminUsers}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setAdminUsers(adminUsers + 1)}
                >
                  <Ionicons name="add" size={20} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.totalPrice}>Total: ${65 * adminUsers}/month</Text>
          </View>

          {/* Employee User Card */}
          <View style={styles.pricingCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="people" size={32} color="#3B82F6" />
              <Text style={styles.cardTitle}>Employee User</Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.priceSymbol}>$</Text>
              <Text style={styles.priceAmount}>20</Text>
              <Text style={styles.pricePeriod}>/month</Text>
            </View>
            <Text style={styles.priceDescription}>per employee user</Text>
            
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>Number of Employee Users:</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={[styles.quantityButton, employeeUsers <= 0 && styles.quantityButtonDisabled]}
                  onPress={() => setEmployeeUsers(Math.max(0, employeeUsers - 1))}
                  disabled={employeeUsers <= 0}
                >
                  <Ionicons name="remove" size={20} color={employeeUsers <= 0 ? "#9CA3AF" : "#3B82F6"} />
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{employeeUsers}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setEmployeeUsers(employeeUsers + 1)}
                >
                  <Ionicons name="add" size={20} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            </View>
            {employeeUsers > 0 && (
              <Text style={styles.totalPrice}>Total: ${20 * employeeUsers}/month</Text>
            )}
          </View>
        </View>

        {/* What's Included in Admin Plan Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>What's included in the Admin plan</Text>
          
          <View style={styles.featureItem}>
            <Ionicons name="cloud-upload" size={20} color="#3B82F6" />
            <Text style={styles.featureText}>1 storage integration (Google Drive, OneDrive, or OffiAxis Drive)</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="chatbubbles" size={20} color="#3B82F6" />
            <Text style={styles.featureText}>WhatsApp or Telegram connection (1 user included)</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="folder" size={20} color="#3B82F6" />
            <Text style={styles.featureText}>Automatic project folder creation</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="analytics" size={20} color="#3B82F6" />
            <Text style={styles.featureText}>Basic Profit & Loss tracking for projects</Text>
          </View>
        </View>

        {/* What Employee User Adds Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>What will adding an Employee user add to your plan</Text>
          
          <View style={styles.featureItem}>
            <Ionicons name="time" size={20} color="#9333EA" />
            <Text style={styles.featureText}>Track employee time and yours</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="calendar" size={20} color="#9333EA" />
            <Text style={styles.featureText}>Employee Scheduling</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="clipboard" size={20} color="#9333EA" />
            <Text style={styles.featureText}>Assign Task</Text>
          </View>
        </View>

        {/* Add-ons Section */}
        <View style={styles.addonsSection}>
          <Text style={styles.sectionTitle}>Need more? Pick what fits best for your company</Text>
          
          {/* Inventory Addon */}
          <View style={styles.addonContainer}>
            <View style={[styles.addonCard, selectedAddons.includes('inventory') && styles.addonCardSelected]}>
              <TouchableOpacity
                style={styles.addonMainContent}
                onPress={() => toggleAddon('inventory')}
                activeOpacity={0.7}
              >
                <View style={styles.addonLeft}>
                  <View style={styles.addonCheckbox}>
                    {selectedAddons.includes('inventory') && (
                      <Ionicons name="checkmark" size={20} color="#3B82F6" />
                    )}
                  </View>
                  <View style={styles.addonInfo}>
                    <Text style={styles.addonTitle}>Inventory Management</Text>
                    <Text style={styles.addonDescription}>Keep track of materials and tools. This Add-On enables it for all users</Text>
                  </View>
                </View>
                <View style={styles.addonPriceContainer}>
                  <Text style={styles.addonPrice}>$15/month</Text>
                  <Text style={styles.addonUnlockText}>Unlocks for all users.</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.accordionHeaderInside}
                onPress={() => setInventoryAccordionOpen(!inventoryAccordionOpen)}
                activeOpacity={0.7}
              >
                <Ionicons name="videocam" size={18} color="#3B82F6" />
                <Text style={styles.accordionHeaderTextInside}>View Inventory Demo</Text>
                <Ionicons 
                  name={inventoryAccordionOpen ? "chevron-up" : "chevron-down"} 
                  size={18} 
                  color="#6B7280" 
                />
              </TouchableOpacity>
              
              {inventoryAccordionOpen && (
                <View style={styles.accordionContentInside}>
                  <TouchableOpacity style={styles.addonVideoPlaceholder} activeOpacity={0.7}>
                    <View style={styles.addonPlayButtonContainer}>
                      <Ionicons name="play" size={24} color="#FFFFFF" />
                    </View>
                    <Text style={styles.addonComingSoonBadge}>Coming Soon</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* AI Job Walk Notes Addon */}
          <View style={styles.addonContainer}>
            <View style={[styles.addonCard, selectedAddons.includes('aiJobWalk') && styles.addonCardSelected]}>
              <TouchableOpacity
                style={styles.addonMainContent}
                onPress={() => toggleAddon('aiJobWalk')}
                activeOpacity={0.7}
              >
                <View style={styles.addonLeft}>
                  <View style={styles.addonCheckbox}>
                    {selectedAddons.includes('aiJobWalk') && (
                      <Ionicons name="checkmark" size={20} color="#3B82F6" />
                    )}
                  </View>
                  <View style={styles.addonInfo}>
                    <Text style={styles.addonTitle}>AI Job Walk Notes</Text>
                    <Text style={styles.addonDescription}>Record as you walk the job. AI organizes notes, tasks, issues, and material requests for your whole team.</Text>
                  </View>
                </View>
                <View style={styles.addonPriceContainer}>
                  <Text style={styles.addonPrice}>$19/month</Text>
                  <Text style={styles.addonUnlockText}>Unlocks for all users.</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.accordionHeaderInside}
                onPress={() => setAiJobWalkAccordionOpen(!aiJobWalkAccordionOpen)}
                activeOpacity={0.7}
              >
                <Ionicons name="videocam" size={18} color="#3B82F6" />
                <Text style={styles.accordionHeaderTextInside}>View AI Job Walk Demo</Text>
                <Ionicons 
                  name={aiJobWalkAccordionOpen ? "chevron-up" : "chevron-down"} 
                  size={18} 
                  color="#6B7280" 
                />
              </TouchableOpacity>
              
              {aiJobWalkAccordionOpen && (
                <View style={styles.accordionContentInside}>
                  <TouchableOpacity style={styles.addonVideoPlaceholder} activeOpacity={0.7}>
                    <View style={styles.addonPlayButtonContainer}>
                      <Ionicons name="play" size={24} color="#FFFFFF" />
                    </View>
                    <Text style={styles.addonComingSoonBadge}>Coming Soon</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
          
          {/* Knowledge Center Addon */}
          <View style={styles.addonContainer}>
            <View style={[styles.addonCard, selectedAddons.includes('knowledgeCenter') && styles.addonCardSelected]}>
              <TouchableOpacity
                style={styles.addonMainContent}
                onPress={() => toggleAddon('knowledgeCenter')}
                activeOpacity={0.7}
              >
                <View style={styles.addonLeft}>
                  <View style={styles.addonCheckbox}>
                    {selectedAddons.includes('knowledgeCenter') && (
                      <Ionicons name="checkmark" size={20} color="#3B82F6" />
                    )}
                  </View>
                  <View style={styles.addonInfo}>
                    <Text style={styles.addonTitle}>Knowledge Center</Text>
                    <Text style={styles.addonDescription}>Upload training videos and use ready-made job templates to keep your team consistent and prepared.</Text>
                  </View>
                </View>
                <View style={styles.addonPriceContainer}>
                  <Text style={styles.addonPrice}>$15/month</Text>
                  <Text style={styles.addonUnlockText}>Unlocks for all users.</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.accordionHeaderInside}
                onPress={() => setKnowledgeCenterAccordionOpen(!knowledgeCenterAccordionOpen)}
                activeOpacity={0.7}
              >
                <Ionicons name="videocam" size={18} color="#3B82F6" />
                <Text style={styles.accordionHeaderTextInside}>View Knowledge Center Demo</Text>
                <Ionicons 
                  name={knowledgeCenterAccordionOpen ? "chevron-up" : "chevron-down"} 
                  size={18} 
                  color="#6B7280" 
                />
              </TouchableOpacity>
              
              {knowledgeCenterAccordionOpen && (
                <View style={styles.accordionContentInside}>
                  <TouchableOpacity style={styles.addonVideoPlaceholder} activeOpacity={0.7}>
                    <View style={styles.addonPlayButtonContainer}>
                      <Ionicons name="play" size={24} color="#FFFFFF" />
                    </View>
                    <Text style={styles.addonComingSoonBadge}>Coming Soon</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
          
          {/* E-Contracts Addon (Coming Soon) */}
          <View style={styles.addonContainer}>
            <View style={[styles.addonCard, styles.addonCardComingSoon]}>
              <View style={styles.addonMainContent}>
                <View style={styles.addonLeft}>
                  <View style={[styles.addonCheckbox, styles.addonCheckboxDisabled]}>
                    <Ionicons name="time-outline" size={18} color="#9CA3AF" />
                  </View>
                  <View style={styles.addonInfo}>
                    <Text style={styles.addonTitle}>E-Contracts</Text>
                    <Text style={styles.addonDescription}>Send invoices, change orders, and agreements to clients for secure electronic signing directly from OffiAxis.</Text>
                  </View>
                </View>
                <View style={styles.addonPriceContainer}>
                  <Text style={styles.addonPriceComingSoon}>Coming Soon</Text>
                  <Text style={styles.addonUnlockTextMuted}>Paid add-on when released</Text>
                </View>
              </View>
              <View style={styles.comingSoonTagline}>
                <Text style={styles.comingSoonTaglineText}>🚧 Coming Soon: Secure signing is on the way.</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Video Tutorials Section */}
        <View style={styles.videosSection}>
          <Text style={styles.sectionTitle}>View their interface</Text>
          
          <TouchableOpacity style={styles.videoCard} activeOpacity={0.7}>
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoTopTitle}>Admin</Text>
              <View style={styles.playButtonContainer}>
                <Ionicons name="play" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.comingSoonBadge}>Coming Soon</Text>
            </View>
            <Text style={styles.videoDescription}>Learn how to manage your team as an admin</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.videoCard} activeOpacity={0.7}>
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoTopTitle}>Employee</Text>
              <View style={styles.playButtonContainer}>
                <Ionicons name="play" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.comingSoonBadge}>Coming Soon</Text>
            </View>
            <Text style={styles.videoDescription}>See how employees use the app daily</Text>
          </TouchableOpacity>
        </View>
        
        {/* Time-Tracking and GPS Usage Disclosure */}
        <View style={styles.disclosureSection}>
          <View style={styles.disclosureHeader}>
            <Ionicons name="location-outline" size={20} color="#6366F1" />
            <Text style={styles.disclosureTitle}>Time-Tracking and GPS Usage Disclosure</Text>
          </View>
          <Text style={styles.disclosureText}>
            OffiAxis uses location services to help track employee time when arriving at or leaving job sites during scheduled hours. GPS data is only collected during active work sessions and is used solely for time verification purposes. Location tracking can be disabled at any time in your account settings.
          </Text>
        </View>

        {/* Your Selection Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Your Selection</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Admin Users ({adminUsers})</Text>
              <Text style={styles.summaryValue}>${65 * adminUsers}/mo</Text>
            </View>
            {employeeUsers > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Employee Users ({employeeUsers})</Text>
                <Text style={styles.summaryValue}>${20 * employeeUsers}/mo</Text>
              </View>
            )}
            {selectedAddons.length > 0 && (
              <>
                <View style={styles.summaryDivider} />
                <Text style={styles.summaryAddonsTitle}>Add-ons:</Text>
                {selectedAddons.includes('inventory') && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Inventory Management</Text>
                    <Text style={styles.summaryValue}>$15/mo</Text>
                  </View>
                )}
                {selectedAddons.includes('aiJobWalk') && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>AI Job Walk Notes</Text>
                    <Text style={styles.summaryValue}>$19/mo</Text>
                  </View>
                )}
                {selectedAddons.includes('knowledgeCenter') && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Knowledge Center</Text>
                    <Text style={styles.summaryValue}>$15/mo</Text>
                  </View>
                )}
              </>
            )}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>${calculateTotal()}/mo</Text>
            </View>
          </View>
        </View>

        {/* Continue Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#F59E0B', '#EA580C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueGradient}
            >
              <Text style={styles.continueButtonText}>Subscribe and continue to the App</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
                colors={['#F59E0B', '#EA580C']}
                style={styles.paymentIconGradient}
              >
                <Ionicons name="card" size={40} color="#FFFFFF" />
              </LinearGradient>
            </View>

            <Text style={styles.paymentTitle}>Complete Your Subscription</Text>
            <Text style={styles.paymentSubtitle}>Trade Professional - Android Payment Gateway</Text>

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
                  <Text style={styles.paymentLabel}>Employee:</Text>
                  <Text style={styles.paymentValue}>${20 * employeeUsers} / {employeeUsers} {employeeUsers === 1 ? 'User' : 'Users'} / Month</Text>
                </View>
              )}
              {selectedAddons.includes('inventory') && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Inventory Add-on:</Text>
                  <Text style={styles.paymentValue}>$15/month</Text>
                </View>
              )}
              {selectedAddons.includes('aiJobWalk') && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>AI Job Walk Notes:</Text>
                  <Text style={styles.paymentValue}>$19/month</Text>
                </View>
              )}
              {selectedAddons.includes('knowledgeCenter') && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Knowledge Center:</Text>
                  <Text style={styles.paymentValue}>$15/month</Text>
                </View>
              )}
              <View style={styles.paymentDivider} />
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabelBold}>Total:</Text>
                <Text style={styles.paymentValueBold}>${calculateTotal()}/month</Text>
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
                colors={['#F59E0B', '#EA580C']}
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
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 6,
  },
  roleTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
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
    fontWeight: '400',
  },
  pricingSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#172a58',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  pricingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  priceSymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginTop: 8,
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#172a58',
    letterSpacing: -1,
  },
  pricePeriod: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 20,
    marginLeft: 4,
  },
  priceDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 16,
  },
  quantityContainer: {
    marginTop: 16,
  },
  quantityLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  quantityValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    minWidth: 40,
    textAlign: 'center',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
    textAlign: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  featuresSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  addonsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  addonContainer: {
    marginBottom: 20,
  },
  addonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  addonCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#DBEAFE',
  },
  addonMainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  addonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  addonCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addonInfo: {
    flex: 1,
  },
  addonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  addonDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  addonPriceContainer: {
    alignItems: 'flex-end',
  },
  addonPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  addonUnlockText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  addonUnlockTextMuted: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
    fontStyle: 'italic',
  },
  addonCardComingSoon: {
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
  },
  addonCheckboxDisabled: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
  },
  addonPriceComingSoon: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F59E0B',
  },
  comingSoonTagline: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginTop: 12,
    marginHorizontal: -16,
    marginBottom: -16,
    overflow: 'hidden',
  },
  comingSoonTaglineText: {
    fontSize: 13,
    color: '#92400E',
    textAlign: 'center',
    fontWeight: '500',
  },
  videosSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  videoCard: {
    marginBottom: 16,
  },
  videoPlaceholder: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  videoTopTitle: {
    position: 'absolute',
    top: 12,
    left: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  playButtonContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  videoDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  disclosureSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  disclosureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  disclosureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  disclosureText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
  },
  summarySection: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#172a58',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },
  summaryAddonsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9333EA',
    marginBottom: 8,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  addonVideoPlaceholder: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    position: 'relative',
  },
  addonPlayButtonContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addonComingSoonBadge: {
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
  accordionHeaderInside: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  accordionHeaderTextInside: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  accordionContentInside: {
    padding: 12,
    backgroundColor: '#F9FAFB',
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
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  paymentLabelBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  paymentValueBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F59E0B',
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
