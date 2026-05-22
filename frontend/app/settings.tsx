import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import Svg, { Path, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={['#4f46e5', '#6366f1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <Path d="M15 18l-6-6 6-6" />
          </Svg>
        </TouchableOpacity>
        
        {/* Title */}
        <Text style={styles.headerTitle}>Settings</Text>
        
        {/* Notification Bell */}
        <TouchableOpacity style={styles.headerButton}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <Path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </Svg>
        </TouchableOpacity>
      </LinearGradient>

      {/* Scrollable Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          {/* Avatar with Online Status */}
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#4f46e5', '#6366f1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>YS</Text>
            </LinearGradient>
            {/* Green Online Dot */}
            <View style={styles.onlineDot} />
          </View>
          
          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Yefry Soto</Text>
            <Text style={styles.userRole}>Admin - Deft Electric</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Online</Text>
            </View>
          </View>
          
          {/* Edit Profile Button */}
          <TouchableOpacity style={styles.editButton}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2">
              <Path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* ACCOUNT Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>ACCOUNT</Text>
          
          <View style={styles.optionsContainer}>
            {/* Change Password */}
            <TouchableOpacity style={[styles.optionButton, styles.optionBorderBottom]}>
              <View style={styles.optionIcon}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2">
                  <Path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </Svg>
              </View>
              <Text style={styles.optionText}>Change Password</Text>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <Path d="M9 5l7 7-7 7" />
              </Svg>
            </TouchableOpacity>
            
            {/* Account Info */}
            <TouchableOpacity style={styles.optionButton}>
              <View style={styles.optionIcon}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2">
                  <Circle cx="12" cy="12" r="10" />
                  <Path d="M12 16v-4M12 8h.01" />
                </Svg>
              </View>
              <Text style={styles.optionText}>Account Info</Text>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <Path d="M9 5l7 7-7 7" />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>

        {/* APP SETTINGS Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>APP SETTINGS</Text>
          
          <View style={styles.optionsContainer}>
            {/* Notifications */}
            <TouchableOpacity style={[styles.optionButton, styles.optionBorderBottom]}>
              <View style={styles.optionIcon}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2">
                  <Path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </Svg>
              </View>
              <Text style={styles.optionText}>Notifications</Text>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <Path d="M9 5l7 7-7 7" />
              </Svg>
            </TouchableOpacity>
            
            {/* Language */}
            <TouchableOpacity style={styles.optionButton}>
              <View style={styles.optionIcon}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2">
                  <Path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </Svg>
              </View>
              <Text style={styles.optionText}>Language</Text>
              <Text style={styles.languageText}>English</Text>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <Path d="M9 5l7 7-7 7" />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>

        {/* SUPPORT Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>SUPPORT</Text>
          
          <View style={styles.optionsContainer}>
            {/* Help Center */}
            <TouchableOpacity style={[styles.optionButton, styles.optionBorderBottom]}>
              <View style={styles.optionIcon}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2">
                  <Path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </Svg>
              </View>
              <Text style={styles.optionText}>Help Center</Text>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <Path d="M9 5l7 7-7 7" />
              </Svg>
            </TouchableOpacity>
            
            {/* Contact Support */}
            <TouchableOpacity style={[styles.optionButton, styles.optionBorderBottom]}>
              <View style={styles.optionIcon}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2">
                  <Path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </Svg>
              </View>
              <Text style={styles.optionText}>Contact Support</Text>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <Path d="M9 5l7 7-7 7" />
              </Svg>
            </TouchableOpacity>
            
            {/* Feedback */}
            <TouchableOpacity style={[styles.optionButton, styles.optionBorderBottom]}>
              <View style={styles.optionIcon}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2">
                  <Path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </Svg>
              </View>
              <Text style={styles.optionText}>Feedback</Text>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <Path d="M9 5l7 7-7 7" />
              </Svg>
            </TouchableOpacity>
            
            {/* About OffiAxis */}
            <TouchableOpacity style={styles.optionButton}>
              <View style={styles.optionIcon}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2">
                  <Circle cx="12" cy="12" r="10" />
                  <Path d="M12 16v-4M12 8h.01" />
                </Svg>
              </View>
              <Text style={styles.optionText}>About OffiAxis</Text>
              <Text style={styles.versionText}>v2.1.0</Text>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <Path d="M9 5l7 7-7 7" />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5">
            <Path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </Svg>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: 44,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    backgroundColor: '#ffffff',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    backgroundColor: '#22c55e',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  userRole: {
    fontSize: 14,
    color: '#475569',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  statusText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 12,
  },
  optionsContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  optionBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
  },
  languageText: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 8,
  },
  versionText: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#dc2626',
    borderRadius: 16,
    marginTop: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
  },
});
