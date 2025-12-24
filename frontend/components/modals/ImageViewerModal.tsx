import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ImageViewerModalProps {
  visible: boolean;
  onClose: () => void;
  imageUrl?: string;
  accessCode?: string;
  propertyDescription?: string;
  onImagePress?: () => void;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  visible,
  onClose,
  imageUrl,
  accessCode,
  propertyDescription,
  onImagePress,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.imageViewerOverlay}>
        <View style={styles.imageViewerContainer}>
          {/* Header */}
          <View style={styles.imageViewerHeader}>
            <Text style={styles.imageViewerTitle}>Location Image</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.imageViewerCloseButton}
            >
              <Ionicons name="close" size={28} color="#1E293B" />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView style={styles.imageViewerScrollView}>
            {/* Image - Clickable for full screen */}
            <TouchableOpacity 
              style={styles.imageViewerImageContainer}
              onPress={onImagePress}
              activeOpacity={0.9}
            >
              {imageUrl ? (
                <>
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.imageViewerImage}
                    resizeMode="contain"
                  />
                  <View style={styles.zoomHintBadge}>
                    <Ionicons name="expand" size={16} color="#FFFFFF" />
                    <Text style={styles.zoomHintText}>Tap to zoom</Text>
                  </View>
                </>
              ) : (
                <View style={styles.noImageContainer}>
                  <Ionicons name="image-outline" size={64} color="#CBD5E1" />
                  <Text style={styles.noImageText}>No image available</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Access Code */}
            {accessCode ? (
              <View style={styles.accessCodeViewerContainer}>
                <View style={styles.accessCodeViewerHeader}>
                  <Ionicons name="key" size={20} color="#F97316" />
                  <Text style={styles.accessCodeViewerTitle}>Access Code</Text>
                </View>
                <View style={styles.accessCodeValueContainer}>
                  <Text style={styles.accessCodeValueText}>
                    {accessCode}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Property Description */}
            {propertyDescription ? (
              <View style={styles.propertyDescriptionContainer}>
                <View style={styles.propertyDescriptionHeader}>
                  <Ionicons name="document-text" size={20} color="#F97316" />
                  <Text style={styles.propertyDescriptionTitle}>Property Description</Text>
                </View>
                <Text style={styles.propertyDescriptionText}>
                  {propertyDescription}
                </Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.imageViewerButton}
            onPress={onClose}
          >
            <Text style={styles.imageViewerButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageViewerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  imageViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  imageViewerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  imageViewerCloseButton: {
    padding: 4,
  },
  imageViewerScrollView: {
    flex: 1,
  },
  imageViewerImageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  imageViewerImage: {
    width: '100%',
    height: '100%',
  },
  zoomHintBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  zoomHintText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  noImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  noImageText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
  },
  accessCodeViewerContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  accessCodeViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  accessCodeViewerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  accessCodeValueContainer: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#F97316',
    borderRadius: 8,
    padding: 16,
  },
  accessCodeValueText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F97316',
    textAlign: 'center',
    letterSpacing: 2,
  },
  propertyDescriptionContainer: {
    padding: 20,
  },
  propertyDescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  propertyDescriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  propertyDescriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
  },
  imageViewerButton: {
    margin: 20,
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  imageViewerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ImageViewerModal;
