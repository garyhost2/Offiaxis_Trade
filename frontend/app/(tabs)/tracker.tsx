import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import TimeTrackerLayout from '../../components/TimeTrackerLayout';

type TrackerVariant = 'Time Tracker #1 (Simple)' | 'Time Tracker #2 (Common one)' | 'Time Tracker #3 (Automated)' | 'Admin';

export default function TrackerScreen() {
  const [selectedTracker, setSelectedTracker] = useState<TrackerVariant>('Time Tracker #1 (Simple)');
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const trackerOptions: TrackerVariant[] = ['Time Tracker #1 (Simple)', 'Time Tracker #2 (Common one)', 'Time Tracker #3 (Automated)', 'Admin'];

  const handleSelectTracker = (tracker: TrackerVariant) => {
    setSelectedTracker(tracker);
    setDropdownVisible(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#5b62ff', '#2f7bff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            {/* Minimal Variant Selector - Small "v" Icon */}
            <TouchableOpacity 
              style={styles.variantIcon}
              onPress={() => setDropdownVisible(true)}
            >
              <Text style={styles.variantIconText}>v</Text>
            </TouchableOpacity>
            
            {/* Static Title */}
            <Text style={styles.headerTitle}>Time Tracker</Text>
            
            <View style={styles.headerRight}>
              {/* Key Icon */}
              <TouchableOpacity style={styles.iconButton}>
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <Path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </Svg>
              </TouchableOpacity>
              
              {/* Notification Bell */}
              <TouchableOpacity style={styles.iconButton}>
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <Path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </Svg>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>3</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Render Selected Tracker Layout */}
        <TimeTrackerLayout variant={selectedTracker} />
      </ScrollView>

      {/* Dropdown Modal */}
      <Modal
        visible={dropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
        >
          <View style={styles.dropdownMenu}>
            {trackerOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.dropdownOption,
                  selectedTracker === option && styles.dropdownOptionSelected
                ]}
                onPress={() => handleSelectTracker(option)}
              >
                <Text style={[
                  styles.dropdownOptionText,
                  selectedTracker === option && styles.dropdownOptionTextSelected
                ]}>
                  {option}
                </Text>
                {selectedTracker === option && (
                  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5b62ff" strokeWidth="2">
                    <Path d="M5 13l4 4L19 7" />
                  </Svg>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  variantIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
  variantIconText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '400',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 100,
    paddingHorizontal: 16,
  },
  dropdownMenu: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownOptionSelected: {
    backgroundColor: '#f0f9ff',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
  },
  dropdownOptionTextSelected: {
    color: '#5b62ff',
    fontWeight: '600',
  },
});
