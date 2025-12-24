import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface EditPropertyDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  propertyDescription: string;
  accessCode: string;
  locationImageUrl: string;
  onPropertyDescriptionChange: (value: string) => void;
  onAccessCodeChange: (value: string) => void;
  onLocationImageUrlChange: (value: string) => void;
  onSave: () => void;
}

const EditPropertyDetailsModal: React.FC<EditPropertyDetailsModalProps> = ({
  visible,
  onClose,
  propertyDescription,
  accessCode,
  locationImageUrl,
  onPropertyDescriptionChange,
  onAccessCodeChange,
  onLocationImageUrlChange,
  onSave,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.propertyEditModalOverlay}>
        <View style={styles.propertyEditModalContainer}>
          {/* Orange Header */}
          <LinearGradient
            colors={['#F59E0B', '#F97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.propertyEditHeader}
          >
            <Text style={styles.propertyEditTitle}>Edit Property Details</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.propertyEditCloseButton}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Modal Content */}
          <ScrollView style={styles.propertyEditContent}>
            {/* Property Description */}
            <View style={styles.propertyEditField}>
              <Text style={styles.propertyEditLabel}>Property Description</Text>
              <TextInput
                style={styles.propertyEditTextArea}
                value={propertyDescription}
                onChangeText={onPropertyDescriptionChange}
                placeholder="The job is located downtown; parking is limited. Lock box located in the lobby. Code #2654."
                multiline
                numberOfLines={5}
                placeholderTextColor="#94A3B8"
                textAlignVertical="top"
              />
            </View>

            {/* Access Code */}
            <View style={styles.propertyEditField}>
              <Text style={styles.propertyEditLabel}>Access Code</Text>
              <TextInput
                style={styles.propertyEditInput}
                value={accessCode}
                onChangeText={onAccessCodeChange}
                placeholder="#2654"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Location Image */}
            <View style={styles.propertyEditField}>
              <Text style={styles.propertyEditLabel}>Location Image</Text>
              
              {/* Photo Action Buttons */}
              <View style={styles.photoButtonsContainer}>
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={async () => {
                    // Request camera permissions
                    const { status } = await ImagePicker.requestCameraPermissionsAsync();
                    if (status !== 'granted') {
                      Alert.alert('Permission Required', 'Camera permission is required to take photos.');
                      return;
                    }
                    
                    // Launch camera
                    const result = await ImagePicker.launchCameraAsync({
                      mediaTypes: ImagePicker.MediaTypeOptions.Images,
                      allowsEditing: true,
                      aspect: [16, 9],
                      quality: 0.8,
                    });
                    
                    if (!result.canceled && result.assets[0]) {
                      onLocationImageUrlChange(result.assets[0].uri);
                    }
                  }}
                >
                  <Ionicons name="camera" size={20} color="#F97316" />
                  <Text style={styles.photoButtonText}>Take a Photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={async () => {
                    // Request gallery permissions
                    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (status !== 'granted') {
                      Alert.alert('Permission Required', 'Photo library permission is required to upload photos.');
                      return;
                    }
                    
                    // Launch gallery
                    const result = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ImagePicker.MediaTypeOptions.Images,
                      allowsEditing: true,
                      aspect: [16, 9],
                      quality: 0.8,
                    });
                    
                    if (!result.canceled && result.assets[0]) {
                      onLocationImageUrlChange(result.assets[0].uri);
                    }
                  }}
                >
                  <Ionicons name="images" size={20} color="#F97316" />
                  <Text style={styles.photoButtonText}>Upload Photo</Text>
                </TouchableOpacity>
              </View>
              
              {/* Image Preview */}
              {locationImageUrl ? (
                <View style={styles.propertyEditImagePreview}>
                  <Image
                    source={{ uri: locationImageUrl }}
                    style={styles.propertyEditImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => onLocationImageUrlChange('')}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.propertyEditFooter}>
            <TouchableOpacity
              style={styles.propertyEditCancelButton}
              onPress={onClose}
            >
              <Text style={styles.propertyEditCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.propertyEditSaveButton}
              onPress={onSave}
            >
              <Text style={styles.propertyEditSaveText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  propertyEditModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  propertyEditModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  propertyEditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  propertyEditTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  propertyEditCloseButton: {
    padding: 4,
  },
  propertyEditContent: {
    padding: 20,
  },
  propertyEditField: {
    marginBottom: 20,
  },
  propertyEditLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  propertyEditInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  propertyEditTextArea: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
    minHeight: 120,
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F97316',
  },
  propertyEditImagePreview: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  propertyEditImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  propertyEditFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  propertyEditCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  propertyEditCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  propertyEditSaveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F97316',
    alignItems: 'center',
  },
  propertyEditSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default EditPropertyDetailsModal;
