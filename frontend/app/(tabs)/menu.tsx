import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';

export default function MenuScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={['#4f46e5', '#6366f1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Menu</Text>
        
        <View style={styles.headerButtons}>
          {/* Settings */}
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => router.push('/settings')}
          >
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <Path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <Path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </Svg>
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutButton}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <Path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </Svg>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {/* OffiAxis Spaces */}
          <TouchableOpacity style={styles.menuCard} activeOpacity={0.7}>
            <LinearGradient
              colors={['#4f46e5', '#6366f1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <Path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </Svg>
            </LinearGradient>
            <Text style={styles.menuTitle}>OffiAxis Spaces</Text>
            <Text style={styles.menuDescription}>Workspaces for chat, files, teams</Text>
          </TouchableOpacity>

          {/* Users & Roles */}
          <TouchableOpacity style={styles.menuCard} activeOpacity={0.7}>
            <LinearGradient
              colors={['#4f46e5', '#6366f1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <Path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </Svg>
            </LinearGradient>
            <Text style={styles.menuTitle}>Users & Roles</Text>
            <Text style={styles.menuDescription}>Manage roles and permissions</Text>
          </TouchableOpacity>

          {/* Schedules */}
          <TouchableOpacity 
            style={styles.menuCard} 
            activeOpacity={0.7}
            onPress={() => router.push('/schedule')}
          >
            <LinearGradient
              colors={['#4f46e5', '#6366f1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <Path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </Svg>
            </LinearGradient>
            <Text style={styles.menuTitle}>Schedules</Text>
            <Text style={styles.menuDescription}>View and edit team schedules</Text>
          </TouchableOpacity>

          {/* Inventory */}
          <TouchableOpacity 
            style={styles.menuCard} 
            activeOpacity={0.7}
            onPress={() => router.push('/inventory')}
          >
            <LinearGradient
              colors={['#f59e0b', '#f97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <Path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </Svg>
            </LinearGradient>
            <Text style={styles.menuTitle}>Inventory</Text>
            <Text style={styles.menuDescription}>Products, tools & stock tracking</Text>
          </TouchableOpacity>

          {/* Receipts */}
          <TouchableOpacity 
            style={styles.menuCard} 
            activeOpacity={0.7}
            onPress={() => router.push('/receipts')}
          >
            <LinearGradient
              colors={['#eab308', '#ca8a04']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <Path d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </Svg>
            </LinearGradient>
            <Text style={styles.menuTitle}>Receipts</Text>
            <Text style={styles.menuDescription}>View all receipts across projects</Text>
          </TouchableOpacity>

          {/* Knowledge Center */}
          <TouchableOpacity 
            style={styles.menuCard} 
            activeOpacity={0.7}
            onPress={() => router.push('/knowledge-center')}
          >
            <LinearGradient
              colors={['#7c3aed', '#a855f7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <Path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </Svg>
            </LinearGradient>
            <Text style={styles.menuTitle}>Knowledge Center</Text>
            <Text style={styles.menuDescription}>Training videos & templates</Text>
          </TouchableOpacity>

          {/* Site Notes AI */}
          <TouchableOpacity 
            style={styles.menuCard} 
            activeOpacity={0.7}
            onPress={() => router.push('/site-notes-ai')}
          >
            <LinearGradient
              colors={['#0ea5e9', '#06b6d4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <Path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </Svg>
            </LinearGradient>
            <Text style={styles.menuTitle}>Site Notes AI</Text>
            <Text style={styles.menuDescription}>AI-powered job documentation</Text>
          </TouchableOpacity>

          {/* E-Contracts */}
          <TouchableOpacity 
            style={styles.menuCard} 
            activeOpacity={0.7}
            onPress={() => router.push('/e-contracts')}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <Path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                <Path d="M15 3v5a1 1 0 001 1h5" />
              </Svg>
            </LinearGradient>
            <Text style={styles.menuTitle}>E-Contracts</Text>
            <Text style={styles.menuDescription}>Electronic document signing</Text>
          </TouchableOpacity>

          {/* Help & Support */}
          <TouchableOpacity style={styles.menuCard} activeOpacity={0.7}>
            <LinearGradient
              colors={['#4f46e5', '#6366f1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <Path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </Svg>
            </LinearGradient>
            <Text style={styles.menuTitle}>Help & Support</Text>
            <Text style={styles.menuDescription}>Access help center</Text>
          </TouchableOpacity>

          {/* About OffiAxis */}
          <TouchableOpacity style={styles.menuCard} activeOpacity={0.7}>
            <LinearGradient
              colors={['#4f46e5', '#6366f1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <Path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </Svg>
            </LinearGradient>
            <Text style={styles.menuTitle}>About OffiAxis</Text>
            <Text style={styles.menuDescription}>Version info, terms</Text>
          </TouchableOpacity>

          {/* More Features (Disabled) */}
          <View style={styles.menuCardDisabled}>
            <View style={styles.iconContainerDisabled}>
              <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <Path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </Svg>
            </View>
            <Text style={styles.menuTitleDisabled}>More Features</Text>
            <Text style={styles.menuDescriptionDisabled}>Coming soon</Text>
          </View>
        </View>

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
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  menuCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  menuCardDisabled: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
    opacity: 0.5,
  },
  iconContainerDisabled: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: '#cbd5e1',
  },
  menuTitleDisabled: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 4,
  },
  menuDescriptionDisabled: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
  },
});
