import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FullScreenImageModalProps {
  visible: boolean;
  onClose: () => void;
  imageUrl?: string;
}

const FullScreenImageModal: React.FC<FullScreenImageModalProps> = ({
  visible,
  onClose,
  imageUrl,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.fullScreenImageOverlay}>
        {/* Close Button */}
        <TouchableOpacity
          style={styles.fullScreenCloseButton}
          onPress={onClose}
        >
          <Ionicons name="close-circle" size={40} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Scrollable Image Container for Zoom */}
        <ScrollView
          style={styles.fullScreenScrollView}
          contentContainerStyle={styles.fullScreenScrollContent}
          minimumZoomScale={1}
          maximumZoomScale={5}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          bouncesZoom={true}
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          ) : null}
        </ScrollView>

        {/* Zoom Instructions */}
        <View style={styles.zoomInstructionsBadge}>
          <Text style={styles.zoomInstructionsText}>
            {Platform.OS === 'web' ? 'Scroll to zoom' : 'Pinch to zoom'}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreenImageOverlay: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullScreenCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullScreenScrollView: {
    flex: 1,
  },
  fullScreenScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  zoomInstructionsBadge: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  zoomInstructionsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default FullScreenImageModal;
