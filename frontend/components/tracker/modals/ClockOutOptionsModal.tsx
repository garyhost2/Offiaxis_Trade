import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface ClockOutOptionsModalProps {
  visible: boolean;
  onClockOutDirect: () => void;
  onClockOutWithNotes: () => void;
  onClose: () => void;
}

export default function ClockOutOptionsModal({ 
  visible, 
  onClockOutDirect, 
  onClockOutWithNotes, 
  onClose 
}: ClockOutOptionsModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Clock Out Options</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                <Path d="M18 6L6 18M6 6l12 12" />
              </Svg>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.subtitle}>How would you like to clock out?</Text>
          
          <TouchableOpacity style={styles.optionButton} onPress={onClockOutDirect}>
            <View style={styles.optionIcon}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <Path d="M9 11l3 3L22 4" />
                <Path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </Svg>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Clock Out</Text>
              <Text style={styles.optionDescription}>Quick clock out without adding notes</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.optionButton} onPress={onClockOutWithNotes}>
            <View style={styles.optionIcon}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6A5AE0" strokeWidth="2">
                <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
              </Svg>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Clock Out + Add Notes/Logs</Text>
              <Text style={styles.optionDescription}>Add daily notes before clocking out</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 380,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#64748b',
  },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
});
