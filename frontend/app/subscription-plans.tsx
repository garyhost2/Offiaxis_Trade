import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

type PlanType = 'essential' | 'professional' | 'enterprise';

interface PlanDetails {
  name: string;
  description: string;
  adminPrice: number;
  employeePrice: number;
  features: string[];
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const PLANS: Record<PlanType, PlanDetails> = {
  essential: {
    name: 'Essential',
    description: 'Get started with AI Agents that automate your basic tasks and workflows, saving hours of manual work every week.',
    adminPrice: 65,
    employeePrice: 20,
    features: [
      '1 storage integration (Google Drive, OneDrive, or Offiaxis Drive)',
      'WhatsApp OR Telegram connection',
      'AI-powered folder organization',
      'Automatic project folder creation',
    ],
    color: '#3B82F6',
    icon: 'rocket-outline',
  },
  professional: {
    name: 'Professional',
    description: 'Boost your team\'s productivity with more powerful AI Agents that handle complex tasks and integrate seamlessly with your favorite tools.',
    adminPrice: 75,
    employeePrice: 20,
    features: [
      '1 storage integration (Google Drive, OneDrive, or Offiaxis Drive)',
      'WhatsApp OR Telegram connection',
      'AI-powered folder organization',
      'Automatic project folder creation',
      'User roles & permissions for better company management',
      'Employee scheduling & task assignments',
    ],
    color: '#9333EA',
    icon: 'briefcase-outline',
  },
  enterprise: {
    name: 'Enterprise',
    description: 'Unlock the full potential of AI automation with advanced Agents that adapt to your business needs and manage sophisticated workflows with ease.',
    adminPrice: 95,
    employeePrice: 25,
    features: [
      '1 storage integration (Google Drive, OneDrive, or Offiaxis Drive)',
      'WhatsApp OR Telegram connection',
      'AI-powered folder organization',
      'Automatic project folder creation',
      'User roles & permissions for better company management',
      'Employee scheduling & task assignments',
      'Employee timesheets with automated reporting',
      'Basic Profit & Loss tracking for projects',
      'Inventory tracking & alerts',
    ],
    color: '#F59E0B',
    icon: 'diamond-outline',
  },
};

export default function SubscriptionPlansScreen() {
  const router = useRouter();
  const { completePendingSignUp } = useAuth();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('essential');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [adminUsers, setAdminUsers] = useState(1);
  const [employeeUsers, setEmployeeUsers] = useState(0);
  const [inventoryAccordionOpen, setInventoryAccordionOpen] = useState(false);
  const [aiJobWalkAccordionOpen, setAiJobWalkAccordionOpen] = useState(false);
  const [knowledgeCenterAccordionOpen, setKnowledgeCenterAccordionOpen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const currentPlan = PLANS[selectedPlan];
  
  // Determine role display info
  const isTradeRole = role === 'trade';
  const roleDisplayName = isTradeRole ? 'Trade Professional' : 'General Contractor / Project Manager';
  const roleIcon: keyof typeof Ionicons.glyphMap = isTradeRole ? 'construct-outline' : 'business-outline';
  const roleColor = isTradeRole ? '#F59E0B' : '#3B82F6';

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
        plan: selectedPlan,
      });
      router.push(`/time-tracker-options?${params.toString()}`);
    } else {
      setShowPaymentModal(true);
    }
  };

  const handlePaymentComplete = async () => {
    setShowPaymentModal(false);
    try {
      await completePendingSignUp({ accountType: isTradeRole ? 'trade' : 'gc', role: 'owner' });
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Account Setup Failed', error instanceof Error ? error.message : 'Unable to finish account setup.');
    }
  };

  const calculateTotal = () => {
    let total = adminUsers * currentPlan.adminPrice;
    total += employeeUsers * currentPlan.employeePrice;
    if (selectedAddons.includes('inventory')) total += 15;
    if (selectedAddons.includes('aiJobWalk')) total += 19;
    if (selectedAddons.includes('knowledgeCenter')) total += 15;
    return total;
  };

  const renderPlanTab = (planKey: PlanType) => {
    const plan = PLANS[planKey];
    const isSelected = selectedPlan === planKey;
    
    return (
      <TouchableOpacity
        key={planKey}
        style={[
          styles.planTab,
          isSelected && { borderColor: plan.color, backgroundColor: `${plan.color}10` },
        ]}
        onPress={() => setSelectedPlan(planKey)}
        activeOpacity={0.7}
      >
        <Text style={[styles.planTabText, isSelected && { color: plan.color, fontWeight: '700' }]}>
          {plan.name}
        </Text>
        {isSelected && <View style={[styles.planTabIndicator, { backgroundColor: plan.color }]} />}
      </TouchableOpacity>
    );
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
          <View style={[styles.roleTag, { backgroundColor: `${roleColor}15` }]}>
            <Ionicons name={roleIcon} size={14} color={roleColor} />
            <Text style={[styles.roleTagText, { color: roleColor }]}>{roleDisplayName}</Text>
          </View>
          <Text style={styles.headerTitle}>One last step!</Text>
          <Text style={styles.headerSubtitle}>Before getting you started with keeping your organization all in one app</Text>
        </View>

        {/* Plan Tabs */}
        <View style={styles.tabsContainer}>
          {renderPlanTab('essential')}
          {renderPlanTab('professional')}
          {renderPlanTab('enterprise')}
        </View>

        {/* Selected Plan Details */}
        <View style={styles.planDetailsSection}>
          <View style={[styles.planHeader, { backgroundColor: `${currentPlan.color}15` }]}>
            <View style={[styles.planIconContainer, { backgroundColor: currentPlan.color }]}>
              <Ionicons name={currentPlan.icon} size={28} color="#FFFFFF" />
            </View>
            <View style={styles.planHeaderText}>
              <Text style={[styles.planName, { color: currentPlan.color }]}>{currentPlan.name}</Text>
              <Text style={styles.planDescription}>{currentPlan.description}</Text>
            </View>
          </View>

          {/* Pricing Cards */}
          <View style={styles.pricingCards}>
            {/* Admin User Card */}
            <View style={[styles.pricingCard, { borderLeftColor: currentPlan.color }]}>
              <View style={styles.pricingCardHeader}>
                <Ionicons name="shield-checkmark" size={24} color={currentPlan.color} />
                <Text style={styles.pricingCardTitle}>Admin User</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={[styles.priceAmount, { color: currentPlan.color }]}>${currentPlan.adminPrice}</Text>
                <Text style={styles.pricePeriod}>/month</Text>
              </View>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={[styles.quantityButton, adminUsers <= 1 && styles.quantityButtonDisabled]}
                  onPress={() => setAdminUsers(Math.max(1, adminUsers - 1))}
                  disabled={adminUsers <= 1}
                >
                  <Ionicons name="remove" size={18} color={adminUsers <= 1 ? "#9CA3AF" : currentPlan.color} />
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{adminUsers}</Text>
                <TouchableOpacity
                  style={[styles.quantityButton, { borderColor: currentPlan.color }]}
                  onPress={() => setAdminUsers(adminUsers + 1)}
                >
                  <Ionicons name="add" size={18} color={currentPlan.color} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.cardTotal, { color: currentPlan.color }]}>
                Total: ${currentPlan.adminPrice * adminUsers}/month
              </Text>
            </View>

            {/* Employee User Card */}
            <View style={[styles.pricingCard, { borderLeftColor: currentPlan.color }]}>
              <View style={styles.pricingCardHeader}>
                <Ionicons name="people" size={24} color={currentPlan.color} />
                <Text style={styles.pricingCardTitle}>Employee User</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={[styles.priceAmount, { color: currentPlan.color }]}>${currentPlan.employeePrice}</Text>
                <Text style={styles.pricePeriod}>/month</Text>
              </View>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={[styles.quantityButton, employeeUsers <= 0 && styles.quantityButtonDisabled]}
                  onPress={() => setEmployeeUsers(Math.max(0, employeeUsers - 1))}
                  disabled={employeeUsers <= 0}
                >
                  <Ionicons name="remove" size={18} color={employeeUsers <= 0 ? "#9CA3AF" : currentPlan.color} />
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{employeeUsers}</Text>
                <TouchableOpacity
                  style={[styles.quantityButton, { borderColor: currentPlan.color }]}
                  onPress={() => setEmployeeUsers(employeeUsers + 1)}
                >
                  <Ionicons name="add" size={18} color={currentPlan.color} />
                </TouchableOpacity>
              </View>
              {employeeUsers > 0 && (
                <Text style={[styles.cardTotal, { color: currentPlan.color }]}>
                  Total: ${currentPlan.employeePrice * employeeUsers}/month
                </Text>
              )}
            </View>
          </View>

          {/* What's Included */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>{"What's included in the Admin plan"}</Text>
            {currentPlan.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={[styles.featureCheckCircle, { backgroundColor: `${currentPlan.color}20` }]}>
                  <Ionicons name="checkmark" size={14} color={currentPlan.color} />
                </View>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
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

        {/* Summary and Continue */}
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Your Selection</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{currentPlan.name} Plan</Text>
              <Text style={styles.summaryValue}></Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Admin Users ({adminUsers})</Text>
              <Text style={styles.summaryValue}>${currentPlan.adminPrice * adminUsers}/mo</Text>
            </View>
            {employeeUsers > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Employee Users ({employeeUsers})</Text>
                <Text style={styles.summaryValue}>${currentPlan.employeePrice * employeeUsers}/mo</Text>
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
              <Text style={[styles.summaryTotalValue, { color: currentPlan.color }]}>${calculateTotal()}/mo</Text>
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
              colors={[currentPlan.color, '#172a58']}
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
                colors={[currentPlan.color, '#172a58']}
                style={styles.paymentIconGradient}
              >
                <Ionicons name="card" size={40} color="#FFFFFF" />
              </LinearGradient>
            </View>

            <Text style={styles.paymentTitle}>Complete Your Subscription</Text>
            <Text style={styles.paymentSubtitle}>{currentPlan.name} Plan - Android Payment Gateway</Text>

            <View style={styles.paymentDetails}>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Plan:</Text>
                <Text style={styles.paymentValue}>{currentPlan.name}</Text>
              </View>
              {adminUsers > 0 && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Admin:</Text>
                  <Text style={styles.paymentValue}>${currentPlan.adminPrice * adminUsers} / {adminUsers} {adminUsers === 1 ? 'User' : 'Users'} / Month</Text>
                </View>
              )}
              {employeeUsers > 0 && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Employee:</Text>
                  <Text style={styles.paymentValue}>${currentPlan.employeePrice * employeeUsers} / {employeeUsers} {employeeUsers === 1 ? 'User' : 'Users'} / Month</Text>
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
                <Text style={[styles.paymentValueBold, { color: currentPlan.color }]}>${calculateTotal()}/month</Text>
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
                colors={[currentPlan.color, '#172a58']}
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
    paddingTop: 16,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#172a58',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '400',
    lineHeight: 22,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  planTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  planTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  planTabIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 24,
    height: 3,
    borderRadius: 2,
  },
  planDetailsSection: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  planHeader: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 14,
  },
  planIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planHeaderText: {
    flex: 1,
  },
  planName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
  },
  pricingCards: {
    gap: 12,
    marginBottom: 20,
  },
  pricingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pricingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  pricingCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  pricePeriod: {
    fontSize: 15,
    color: '#6B7280',
    marginLeft: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 8,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  quantityValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    minWidth: 32,
    textAlign: 'center',
  },
  cardTotal: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  featuresContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#172a58',
    marginBottom: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  featureCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#172a58',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  addonsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  addonContainer: {
    marginBottom: 16,
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
    padding: 14,
  },
  addonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  addonCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 7,
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
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  addonDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
  },
  addonPriceContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  addonPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  addonUnlockText: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  addonUnlockTextMuted: {
    fontSize: 10,
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
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
  comingSoonTagline: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  comingSoonTaglineText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
    fontWeight: '500',
  },
  accordionHeaderInside: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  accordionHeaderTextInside: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  accordionContentInside: {
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  addonVideoPlaceholder: {
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  addonPlayButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addonComingSoonBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  videosSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  videoCard: {
    marginBottom: 14,
  },
  videoPlaceholder: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  videoTopTitle: {
    position: 'absolute',
    top: 10,
    left: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  playButtonContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
  videoDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  disclosureSection: {
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  disclosureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  disclosureTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  disclosureText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
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
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  continueButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#172a58',
    textAlign: 'center',
    marginBottom: 6,
  },
  paymentSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
  },
  paymentDetails: {
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  paymentValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  paymentLabelBold: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  paymentValueBold: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  paymentDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },
  paymentNote: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 16,
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
    paddingVertical: 14,
    gap: 8,
  },
  paymentButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  paymentCancelButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  paymentCancelText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
});
