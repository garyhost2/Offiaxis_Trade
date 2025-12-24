import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, TextInput, Alert, Image, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PermitData {
  id?: string;
  permitNumber?: string;
  issueDate?: string;
  expirationDate?: string;
  fees?: string;
  fileUri?: string;
  fileName?: string;
  fileType?: string;
  dateAdded?: string;
}

interface PermitPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  permitData: PermitData | null;
  onPermitDataChange: (data: PermitData) => void;
  onSave: () => void;
  onOpenFullScreen?: () => void;
  isEditMode?: boolean;
}

const PermitPreviewModal: React.FC<PermitPreviewModalProps> = ({
  visible,
  onClose,
  permitData,
  onPermitDataChange,
  onSave,
  onOpenFullScreen,
  isEditMode = false,
}) => {
  const handleFilePress = () => {
    if (!permitData?.fileUri) return;

    if (permitData.fileType === 'application/pdf') {
      // Open PDF in external viewer
      if (Platform.OS !== 'web') {
        Linking.openURL(permitData.fileUri);
      } else {
        window.open(permitData.fileUri, '_blank');
      }
    } else {
      // Open image in full screen
      if (onOpenFullScreen) {
        onOpenFullScreen();
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.permitModalOverlay}>
        <View style={styles.permitModalContainer}>
          {/* Header */}
          <View style={styles.permitModalHeader}>
            <Text style={styles.permitModalTitle}>
              {isEditMode ? 'Edit Permit' : 'Review Permit Details'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.permitModalCloseButton}
            >
              <Ionicons name="close" size={28} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.permitModalContent}>
            {/* File Preview - Clickable for Full View */}
            {permitData?.fileUri && (
              <TouchableOpacity
                style={styles.permitModalImagePreview}
                activeOpacity={0.9}
                onPress={handleFilePress}
              >
                {permitData.fileType === 'application/pdf' ? (
                  <View style={styles.permitModalPdfPreview}>
                    <Ionicons name="document-text" size={64} color="#EF4444" />
                    <Text style={styles.permitModalPdfText}>PDF Document</Text>
                    <Text style={styles.permitModalFileName}>{permitData.fileName}</Text>
                    <View style={styles.permitModalClickHint}>
                      <Ionicons name="open-outline" size={20} color="#EF4444" />
                      <Text style={styles.permitModalClickHintText}>Tap to open & zoom</Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <Image
                      source={{ uri: permitData.fileUri }}
                      style={styles.permitModalImage}
                      resizeMode="contain"
                    />
                    <View style={styles.permitModalZoomHint}>
                      <Ionicons name="expand" size={20} color="#FFFFFF" />
                      <Text style={styles.permitModalZoomHintText}>Tap to zoom & copy text</Text>
                    </View>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Editable Fields */}
            <View style={styles.permitModalField}>
              <Text style={styles.permitModalLabel}>Permit Number *</Text>
              <TextInput
                style={styles.permitModalInput}
                value={permitData?.permitNumber || ''}
                onChangeText={(text) => onPermitDataChange({ ...permitData, permitNumber: text })}
                placeholder="Enter permit number"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.permitModalField}>
              <Text style={styles.permitModalLabel}>Issue Date</Text>
              <TextInput
                style={styles.permitModalInput}
                value={permitData?.issueDate || ''}
                onChangeText={(text) => onPermitDataChange({ ...permitData, issueDate: text })}
                placeholder="MM/DD/YYYY"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.permitModalField}>
              <Text style={styles.permitModalLabel}>Expiration Date</Text>
              <TextInput
                style={styles.permitModalInput}
                value={permitData?.expirationDate || ''}
                onChangeText={(text) => onPermitDataChange({ ...permitData, expirationDate: text })}
                placeholder="MM/DD/YYYY"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.permitModalField}>
              <Text style={styles.permitModalLabel}>Fees</Text>
              <TextInput
                style={styles.permitModalInput}
                value={permitData?.fees || ''}
                onChangeText={(text) => onPermitDataChange({ ...permitData, fees: text })}
                placeholder="$0.00"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.permitModalFooter}>
            <TouchableOpacity
              style={styles.permitModalCancelButton}
              onPress={onClose}
            >
              <Text style={styles.permitModalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.permitModalSaveButton}
              onPress={onSave}
            >
              <Text style={styles.permitModalSaveText}>Save Permit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  permitModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  permitModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  permitModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  permitModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  permitModalCloseButton: {
    padding: 4,
  },
  permitModalContent: {
    padding: 20,
  },
  permitModalImagePreview: {
    width: '100%',
    height: 250,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  permitModalImage: {
    width: '100%',
    height: '100%',
  },
  permitModalPdfPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  permitModalPdfText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  permitModalFileName: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  permitModalClickHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 20,
  },
  permitModalClickHintText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  permitModalZoomHint: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  permitModalZoomHintText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  permitModalField: {
    marginBottom: 20,
  },
  permitModalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  permitModalInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  permitModalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  permitModalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  permitModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  permitModalSaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
  },
  permitModalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default PermitPreviewModal;
