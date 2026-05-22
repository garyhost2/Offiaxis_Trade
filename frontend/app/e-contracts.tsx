import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function EContractsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={['#10b981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>E-Contracts</Text>
          <Text style={styles.headerSubtitle}>
            Send documents for secure electronic signing directly from OffiAxis.
          </Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Hero Icon */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#10b981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroIcon}
          >
            <Ionicons name="document-text" size={56} color="#FFFFFF" />
          </LinearGradient>
        </View>

        {/* Main Description Card */}
        <View style={styles.descriptionCard}>
          <View style={styles.descriptionHeader}>
            <Ionicons name="information-circle" size={24} color="#10b981" />
            <Text style={styles.descriptionTitle}>About E-Contracts</Text>
          </View>
          
          <Text style={styles.descriptionText}>
            E-Contracts will allow you to send invoices, change orders, and agreements to clients for secure electronic signing, all directly from OffiAxis.
          </Text>
          
          <Text style={styles.descriptionText}>
            This feature will include legally compliant e-signatures, audit trails, and document tracking to help keep your projects moving and protected.
          </Text>
        </View>

        {/* Coming Soon Section */}
        <View style={styles.comingSoonCard}>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonIcon}>🚧</Text>
            <Text style={styles.comingSoonBadgeText}>Coming Soon</Text>
          </View>
          
          <Text style={styles.comingSoonDescription}>
            {"We're currently building this feature using secure, legally compliant signing technology."}
          </Text>
          
          <View style={styles.featuresList}>
            <Text style={styles.featuresTitle}>{"When released, you'll be able to:"}</Text>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="send" size={18} color="#10b981" />
              </View>
              <Text style={styles.featureText}>Send contracts and change orders for signature</Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="time" size={18} color="#10b981" />
              </View>
              <Text style={styles.featureText}>Track who signed and when</Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="shield-checkmark" size={18} color="#10b981" />
              </View>
              <Text style={styles.featureText}>Store signed documents securely within each project</Text>
            </View>
          </View>
          
          <View style={styles.stayTuned}>
            <Ionicons name="notifications-outline" size={20} color="#64748B" />
            <Text style={styles.stayTunedText}>Stay tuned! This feature is coming soon.</Text>
          </View>
        </View>

        {/* Preview Features Card */}
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Preview Features</Text>
          
          <View style={styles.previewGrid}>
            <View style={styles.previewItem}>
              <View style={[styles.previewIcon, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="create-outline" size={24} color="#10b981" />
              </View>
              <Text style={styles.previewLabel}>E-Signatures</Text>
            </View>
            
            <View style={styles.previewItem}>
              <View style={[styles.previewIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="analytics-outline" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.previewLabel}>Audit Trails</Text>
            </View>
            
            <View style={styles.previewItem}>
              <View style={[styles.previewIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="folder-outline" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.previewLabel}>Document Storage</Text>
            </View>
            
            <View style={styles.previewItem}>
              <View style={[styles.previewIcon, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="checkmark-done-outline" size={24} color="#A855F7" />
              </View>
              <Text style={styles.previewLabel}>Legal Compliance</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons (Disabled) */}
        <View style={styles.buttonSection}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            activeOpacity={0.8}
            disabled
          >
            <LinearGradient
              colors={['#94A3B8', '#94A3B8']}
              style={styles.primaryButtonGradient}
            >
              <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Notify me when available</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            activeOpacity={0.8}
            disabled
          >
            <Ionicons name="rocket-outline" size={20} color="#94A3B8" />
            <Text style={styles.secondaryButtonText}>Join early access</Text>
          </TouchableOpacity>
          
          <Text style={styles.buttonHint}>
            These options will be available when the feature launches
          </Text>
        </View>

        {/* Bottom Spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContent: {
    paddingRight: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: -40,
  },
  heroIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  descriptionText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 12,
  },
  comingSoonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FEF3C7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  comingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    alignSelf: 'flex-start',
    marginBottom: 16,
    gap: 8,
  },
  comingSoonIcon: {
    fontSize: 18,
  },
  comingSoonBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#B45309',
  },
  comingSoonDescription: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 20,
  },
  featuresList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  featureIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    paddingTop: 6,
  },
  stayTuned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  stayTunedText: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  previewItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  buttonSection: {
    gap: 12,
  },
  primaryButton: {
    borderRadius: 14,
    overflow: 'hidden',
    opacity: 0.6,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 10,
    opacity: 0.6,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
  },
  buttonHint: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
