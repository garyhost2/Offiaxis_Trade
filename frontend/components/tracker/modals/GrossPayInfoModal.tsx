import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

interface GrossPayInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function GrossPayInfoModal({ visible, onClose }: GrossPayInfoModalProps) {
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
            <View style={styles.headerLeft}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6A5AE0" strokeWidth="2">
                <Circle cx="12" cy="12" r="10" />
                <Path d="M12 16v-4M12 8h.01" />
              </Svg>
              <Text style={styles.title}>Gross Pay</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <Path d="M18 6L6 18M6 6l12 12" />
              </Svg>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.description}>
            Gross pay is the total amount earned before taxes, benefits, or other deductions are applied.
          </Text>
          
          <Text style={styles.subDescription}>
            Taxes and deductions are calculated separately through payroll.
          </Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.note}>
            For questions about your take-home pay, deductions, or paychecks, please contact your office or payroll administrator.
          </Text>
          
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Got It</Text>
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
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  closeButton: {
    padding: 4,
  },
  description: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 12,
  },
  subDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  note: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#6A5AE0',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
