import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { updateProject } from '../../utils/projectsData';

interface ReceiptsTabProps {
  receipts: any[];
  setReceipts: (receipts: any[]) => void;
  projectId: number;
}

const ReceiptsTab: React.FC<ReceiptsTabProps> = ({ receipts, setReceipts, projectId }) => {
  // Local state for modals and processing
  const [showAddReceiptModal, setShowAddReceiptModal] = useState(false);
  const [showReceiptPreviewModal, setShowReceiptPreviewModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [receiptImageUri, setReceiptImageUri] = useState<string | null>(null);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [extractedReceiptData, setExtractedReceiptData] = useState<any>(null);
  const [showReceiptPhotoOptions, setShowReceiptPhotoOptions] = useState(false);

  return (
    <>
      {/* Receipts Tab Content */}
      <View style={styles.receiptsContainer}>
        <View style={styles.receiptsHeader}>
          <View>
            <Text style={styles.receiptsTitle}>Receipts</Text>
            <Text style={styles.receiptsSubtitle}>
              {receipts.length} receipt{receipts.length !== 1 ? 's' : ''} saved
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addReceiptButton}
            onPress={() => setShowReceiptPhotoOptions(true)}
          >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.addReceiptButtonText}>Add Receipt</Text>
          </TouchableOpacity>
        </View>

        {receipts.length > 0 ? (
          <View style={styles.receiptsList}>
            {receipts.map((receipt, index) => (
              <TouchableOpacity
                key={receipt.id}
                style={styles.receiptCard}
                onPress={() => {
                  setSelectedReceipt(receipt);
                  setShowReceiptPreviewModal(true);
                }}
              >
                {/* Receipt Image Thumbnail */}
                <View style={styles.receiptThumbnailContainer}>
                  {receipt.imageUri ? (
                    <Image
                      source={{ uri: receipt.imageUri }}
                      style={styles.receiptThumbnail}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.receiptThumbnailPlaceholder}>
                      <Ionicons name="receipt" size={32} color="#CBD5E1" />
                    </View>
                  )}
                </View>

                {/* Receipt Details */}
                <View style={styles.receiptDetails}>
                  <View style={styles.receiptStoreRow}>
                    <Text style={styles.receiptStoreName}>{receipt.storeName || 'Unknown Store'}</Text>
                    {receipt.storeName?.toLowerCase().includes('home depot') && (
                      <View style={styles.storeLogoContainer}>
                        <Text style={styles.storeLogoText}>HD</Text>
                      </View>
                    )}
                    {receipt.storeName?.toLowerCase().includes('lowe') && (
                      <View style={[styles.storeLogoContainer, { backgroundColor: '#004990' }]}>
                        <Text style={styles.storeLogoText}>L</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.receiptDate}>{receipt.date || 'No date'}</Text>
                  <View style={styles.receiptAmountRow}>
                    <Text style={styles.receiptTotalLabel}>Total:</Text>
                    <Text style={styles.receiptTotalAmount}>${receipt.totalAmount || '0.00'}</Text>
                  </View>
                  {receipt.itemCount && (
                    <Text style={styles.receiptItemCount}>{receipt.itemCount} item{receipt.itemCount !== 1 ? 's' : ''}</Text>
                  )}
                </View>

                {/* Chevron */}
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.receiptsEmpty}>
            <View style={styles.receiptsEmptyIcon}>
              <Ionicons name="receipt-outline" size={64} color="#CBD5E1" />
            </View>
            <Text style={styles.receiptsEmptyTitle}>No Receipts Yet</Text>
            <Text style={styles.receiptsEmptyText}>
              Add receipts by taking a photo or uploading from your gallery. Our AI will automatically extract the details.
            </Text>
            <TouchableOpacity
              style={styles.receiptsEmptyButton}
              onPress={() => setShowReceiptPhotoOptions(true)}
            >
              <Ionicons name="camera" size={20} color="#FFFFFF" />
              <Text style={styles.receiptsEmptyButtonText}>Add Your First Receipt</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Receipt Stats Summary */}
        {receipts.length > 0 && (
          <View style={styles.receiptsSummary}>
            <View style={styles.receiptsSummaryItem}>
              <Text style={styles.receiptsSummaryValue}>
                ${receipts.reduce((sum, r) => sum + (parseFloat(r.totalAmount) || 0), 0).toFixed(2)}
              </Text>
              <Text style={styles.receiptsSummaryLabel}>Total Spent</Text>
            </View>
            <View style={styles.receiptsSummaryDivider} />
            <View style={styles.receiptsSummaryItem}>
              <Text style={styles.receiptsSummaryValue}>{receipts.length}</Text>
              <Text style={styles.receiptsSummaryLabel}>Receipts</Text>
            </View>
            <View style={styles.receiptsSummaryDivider} />
            <View style={styles.receiptsSummaryItem}>
              <Text style={styles.receiptsSummaryValue}>
                {receipts.reduce((sum, r) => sum + (r.itemCount || 0), 0)}
              </Text>
              <Text style={styles.receiptsSummaryLabel}>Items</Text>
            </View>
          </View>
        )}
      </View>

      {/* Receipt Photo Options Modal */}
      <Modal
        visible={showReceiptPhotoOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReceiptPhotoOptions(false)}
      >
        <View style={styles.photoOptionsModalOverlay}>
          <TouchableOpacity 
            style={styles.photoOptionsModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowReceiptPhotoOptions(false)}
          />
          <View style={styles.receiptPhotoOptionsContainer}>
            <Text style={styles.receiptPhotoOptionsTitle}>Add Receipt</Text>
            <Text style={styles.receiptPhotoOptionsSubtitle}>
              Take a photo or upload from gallery
            </Text>
            
            <TouchableOpacity
              style={styles.receiptPhotoOption}
              onPress={async () => {
                setShowReceiptPhotoOptions(false);
                const result = await ImagePicker.launchCameraAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  quality: 0.8,
                });
                if (!result.canceled && result.assets[0]) {
                  setReceiptImageUri(result.assets[0].uri);
                  setShowAddReceiptModal(true);
                }
              }}
            >
              <View style={styles.receiptPhotoOptionIcon}>
                <Ionicons name="camera" size={28} color="#4F46E5" />
              </View>
              <View style={styles.receiptPhotoOptionContent}>
                <Text style={styles.receiptPhotoOptionTitle}>Take Photo</Text>
                <Text style={styles.receiptPhotoOptionDesc}>Use camera to capture receipt</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.receiptPhotoOption}
              onPress={async () => {
                setShowReceiptPhotoOptions(false);
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  quality: 0.8,
                });
                if (!result.canceled && result.assets[0]) {
                  setReceiptImageUri(result.assets[0].uri);
                  setShowAddReceiptModal(true);
                }
              }}
            >
              <View style={styles.receiptPhotoOptionIcon}>
                <Ionicons name="images" size={28} color="#10B981" />
              </View>
              <View style={styles.receiptPhotoOptionContent}>
                <Text style={styles.receiptPhotoOptionTitle}>Upload from Gallery</Text>
                <Text style={styles.receiptPhotoOptionDesc}>Select existing photo</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.receiptPhotoOptionCancel}
              onPress={() => setShowReceiptPhotoOptions(false)}
            >
              <Text style={styles.receiptPhotoOptionCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Receipt Modal - AI Processing */}
      <Modal
        visible={showAddReceiptModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setShowAddReceiptModal(false);
          setReceiptImageUri(null);
          setExtractedReceiptData(null);
        }}
      >
        <View style={styles.addReceiptModalContainer}>
          {/* Header */}
          <LinearGradient
            colors={['#6366F1', '#4F46E5', '#4338CA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addReceiptHeader}
          >
            <TouchableOpacity
              onPress={() => {
                setShowAddReceiptModal(false);
                setReceiptImageUri(null);
                setExtractedReceiptData(null);
              }}
              style={styles.addReceiptBackButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.addReceiptHeaderTitle}>Add Receipt</Text>
            <View style={{ width: 24 }} />
          </LinearGradient>

          <ScrollView style={styles.addReceiptScrollView}>
            {/* Receipt Image Preview */}
            {receiptImageUri && (
              <View style={styles.receiptImagePreviewContainer}>
                <Image
                  source={{ uri: receiptImageUri }}
                  style={styles.receiptImagePreview}
                  resizeMode="contain"
                />
                <TouchableOpacity
                  style={styles.changeReceiptImageButton}
                  onPress={() => {
                    setShowAddReceiptModal(false);
                    setShowReceiptPhotoOptions(true);
                  }}
                >
                  <Ionicons name="camera" size={16} color="#4F46E5" />
                  <Text style={styles.changeReceiptImageText}>Change Image</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* AI Processing Button */}
            {!extractedReceiptData && (
              <TouchableOpacity
                style={[styles.processReceiptButton, isProcessingReceipt && styles.processReceiptButtonDisabled]}
                disabled={isProcessingReceipt}
                onPress={async () => {
                  setIsProcessingReceipt(true);
                  // Simulate AI extraction (in real app, call backend API)
                  setTimeout(() => {
                    // Mock extracted data based on the Home Depot receipt example
                    setExtractedReceiptData({
                      storeName: 'THE HOME DEPOT',
                      storeAddress: '2555 GRANT AVE\nPHILADELPHIA PA 19114\n(215) 969-1478',
                      date: '12/30/2024',
                      time: '2:30 PM',
                      items: [
                        { name: '3-PACK CAULK', sku: '1003184254', price: 16.97 },
                        { name: 'FOAM SEALANT', sku: '1000090946', price: 8.47 },
                        { name: '3/4PLYWOOD', sku: '1000094142', price: 32.48 },
                        { name: 'PLYWOOD 4X8', sku: '1000094140', price: 38.97 },
                      ],
                      subtotal: '96.89',
                      tax: '5.81',
                      totalAmount: '102.70',
                      paymentMethod: 'VISA',
                      lastFourDigits: '0012',
                      transactionId: '7241',
                      authCode: '054668',
                    });
                    setIsProcessingReceipt(false);
                  }, 2000);
                }}
              >
                {isProcessingReceipt ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.processReceiptButtonText}>Analyzing Receipt...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="scan" size={20} color="#FFFFFF" />
                    <Text style={styles.processReceiptButtonText}>Extract Details with AI</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Extracted Data Display */}
            {extractedReceiptData && (
              <View style={styles.extractedDataContainer}>
                <View style={styles.extractedDataHeader}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  <Text style={styles.extractedDataHeaderText}>Information Extracted</Text>
                </View>

                {/* Store Info */}
                <View style={styles.extractedSection}>
                  <Text style={styles.extractedSectionTitle}>Store Information</Text>
                  <View style={styles.extractedField}>
                    <Text style={styles.extractedFieldLabel}>Store Name</Text>
                    <TextInput
                      style={styles.extractedFieldInput}
                      value={extractedReceiptData.storeName}
                      onChangeText={(text) => setExtractedReceiptData({...extractedReceiptData, storeName: text})}
                    />
                  </View>
                  <View style={styles.extractedField}>
                    <Text style={styles.extractedFieldLabel}>Store Address</Text>
                    <TextInput
                      style={[styles.extractedFieldInput, { height: 60 }]}
                      value={extractedReceiptData.storeAddress}
                      onChangeText={(text) => setExtractedReceiptData({...extractedReceiptData, storeAddress: text})}
                      multiline
                    />
                  </View>
                </View>

                {/* Transaction Info */}
                <View style={styles.extractedSection}>
                  <Text style={styles.extractedSectionTitle}>Transaction Details</Text>
                  <View style={styles.extractedFieldRow}>
                    <View style={[styles.extractedField, { flex: 1 }]}>
                      <Text style={styles.extractedFieldLabel}>Date</Text>
                      <TextInput
                        style={styles.extractedFieldInput}
                        value={extractedReceiptData.date}
                        onChangeText={(text) => setExtractedReceiptData({...extractedReceiptData, date: text})}
                      />
                    </View>
                    <View style={[styles.extractedField, { flex: 1 }]}>
                      <Text style={styles.extractedFieldLabel}>Time</Text>
                      <TextInput
                        style={styles.extractedFieldInput}
                        value={extractedReceiptData.time}
                        onChangeText={(text) => setExtractedReceiptData({...extractedReceiptData, time: text})}
                      />
                    </View>
                  </View>
                </View>

                {/* Items */}
                <View style={styles.extractedSection}>
                  <Text style={styles.extractedSectionTitle}>Items Purchased ({extractedReceiptData.items?.length || 0})</Text>
                  {extractedReceiptData.items?.map((item: any, index: number) => (
                    <View key={index} style={styles.extractedItem}>
                      <Text style={styles.extractedItemName}>{item.name}</Text>
                      <Text style={styles.extractedItemPrice}>${item.price.toFixed(2)}</Text>
                    </View>
                  ))}
                </View>

                {/* Totals */}
                <View style={styles.extractedSection}>
                  <Text style={styles.extractedSectionTitle}>Payment Summary</Text>
                  <View style={styles.extractedFieldRow}>
                    <View style={[styles.extractedField, { flex: 1 }]}>
                      <Text style={styles.extractedFieldLabel}>Subtotal</Text>
                      <TextInput
                        style={styles.extractedFieldInput}
                        value={extractedReceiptData.subtotal}
                        onChangeText={(text) => setExtractedReceiptData({...extractedReceiptData, subtotal: text})}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={[styles.extractedField, { flex: 1 }]}>
                      <Text style={styles.extractedFieldLabel}>Tax</Text>
                      <TextInput
                        style={styles.extractedFieldInput}
                        value={extractedReceiptData.tax}
                        onChangeText={(text) => setExtractedReceiptData({...extractedReceiptData, tax: text})}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>
                  <View style={styles.extractedField}>
                    <Text style={styles.extractedFieldLabel}>Total Amount</Text>
                    <TextInput
                      style={[styles.extractedFieldInput, styles.extractedTotalInput]}
                      value={extractedReceiptData.totalAmount}
                      onChangeText={(text) => setExtractedReceiptData({...extractedReceiptData, totalAmount: text})}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.extractedField}>
                    <Text style={styles.extractedFieldLabel}>Payment Method</Text>
                    <TextInput
                      style={styles.extractedFieldInput}
                      value={`${extractedReceiptData.paymentMethod} ****${extractedReceiptData.lastFourDigits}`}
                      onChangeText={(text) => setExtractedReceiptData({...extractedReceiptData, paymentMethod: text})}
                    />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          {extractedReceiptData && (
            <View style={styles.addReceiptFooter}>
              <TouchableOpacity
                style={styles.addReceiptCancelButton}
                onPress={() => {
                  setShowAddReceiptModal(false);
                  setReceiptImageUri(null);
                  setExtractedReceiptData(null);
                }}
              >
                <Text style={styles.addReceiptCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addReceiptSaveButton}
                onPress={() => {
                  const newReceipt = {
                    id: `receipt-${Date.now()}`,
                    imageUri: receiptImageUri,
                    storeName: extractedReceiptData.storeName,
                    storeAddress: extractedReceiptData.storeAddress,
                    date: extractedReceiptData.date,
                    time: extractedReceiptData.time,
                    items: extractedReceiptData.items,
                    subtotal: extractedReceiptData.subtotal,
                    tax: extractedReceiptData.tax,
                    totalAmount: extractedReceiptData.totalAmount,
                    paymentMethod: extractedReceiptData.paymentMethod,
                    lastFourDigits: extractedReceiptData.lastFourDigits,
                    itemCount: extractedReceiptData.items?.length || 0,
                    createdAt: new Date().toISOString(),
                  };
                  const updatedReceipts = [newReceipt, ...receipts];
                  setReceipts(updatedReceipts);
                  // Persist to project data so Profit & Loss page sees it
                  updateProject(projectId, { receipts: updatedReceipts });
                  setShowAddReceiptModal(false);
                  setReceiptImageUri(null);
                  setExtractedReceiptData(null);
                  Alert.alert('Success', 'Receipt saved successfully!');
                }}
              >
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.addReceiptSaveText}>Save Receipt</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* Receipt Preview Modal */}
      <Modal
        visible={showReceiptPreviewModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setShowReceiptPreviewModal(false);
          setSelectedReceipt(null);
        }}
      >
        <View style={styles.receiptPreviewModalContainer}>
          {/* Header */}
          <View style={styles.receiptPreviewHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowReceiptPreviewModal(false);
                setSelectedReceipt(null);
              }}
              style={styles.receiptPreviewBackButton}
            >
              <Ionicons name="arrow-back" size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.receiptPreviewHeaderTitle}>Receipt Details</Text>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Delete Receipt',
                  'Are you sure you want to delete this receipt?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => {
                        const updatedReceipts = receipts.filter(r => r.id !== selectedReceipt?.id);
                        setReceipts(updatedReceipts);
                        // Persist to project data so Profit & Loss page sees it
                        updateProject(projectId, { receipts: updatedReceipts });
                        setShowReceiptPreviewModal(false);
                        setSelectedReceipt(null);
                      }
                    }
                  ]
                );
              }}
            >
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>

          {selectedReceipt && (
            <ScrollView style={styles.receiptPreviewScrollView}>
              {/* Receipt Image */}
              {selectedReceipt.imageUri && (
                <TouchableOpacity style={styles.receiptPreviewImageContainer}>
                  <Image
                    source={{ uri: selectedReceipt.imageUri }}
                    style={styles.receiptPreviewImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              )}

              {/* Store Card */}
              <View style={styles.receiptPreviewCard}>
                <View style={styles.receiptPreviewStoreHeader}>
                  <View>
                    <Text style={styles.receiptPreviewStoreName}>{selectedReceipt.storeName}</Text>
                    <Text style={styles.receiptPreviewStoreAddress}>{selectedReceipt.storeAddress}</Text>
                  </View>
                  {selectedReceipt.storeName?.toLowerCase().includes('home depot') && (
                    <View style={styles.receiptPreviewStoreLogo}>
                      <Text style={styles.receiptPreviewStoreLogoText}>HD</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Date/Time Card */}
              <View style={styles.receiptPreviewCard}>
                <View style={styles.receiptPreviewRow}>
                  <View style={styles.receiptPreviewRowItem}>
                    <Ionicons name="calendar-outline" size={20} color="#64748B" />
                    <Text style={styles.receiptPreviewRowLabel}>Date</Text>
                    <Text style={styles.receiptPreviewRowValue}>{selectedReceipt.date}</Text>
                  </View>
                  <View style={styles.receiptPreviewRowItem}>
                    <Ionicons name="time-outline" size={20} color="#64748B" />
                    <Text style={styles.receiptPreviewRowLabel}>Time</Text>
                    <Text style={styles.receiptPreviewRowValue}>{selectedReceipt.time}</Text>
                  </View>
                </View>
              </View>

              {/* Items Card */}
              <View style={styles.receiptPreviewCard}>
                <Text style={styles.receiptPreviewCardTitle}>Items ({selectedReceipt.items?.length || 0})</Text>
                {selectedReceipt.items?.map((item: any, index: number) => (
                  <View key={index} style={styles.receiptPreviewItem}>
                    <Text style={styles.receiptPreviewItemName}>{item.name}</Text>
                    <Text style={styles.receiptPreviewItemPrice}>${item.price.toFixed(2)}</Text>
                  </View>
                ))}
              </View>

              {/* Payment Summary Card */}
              <View style={styles.receiptPreviewCard}>
                <Text style={styles.receiptPreviewCardTitle}>Payment Summary</Text>
                <View style={styles.receiptPreviewSummaryRow}>
                  <Text style={styles.receiptPreviewSummaryLabel}>Subtotal</Text>
                  <Text style={styles.receiptPreviewSummaryValue}>${selectedReceipt.subtotal}</Text>
                </View>
                <View style={styles.receiptPreviewSummaryRow}>
                  <Text style={styles.receiptPreviewSummaryLabel}>Tax</Text>
                  <Text style={styles.receiptPreviewSummaryValue}>${selectedReceipt.tax}</Text>
                </View>
                <View style={[styles.receiptPreviewSummaryRow, styles.receiptPreviewTotalRow]}>
                  <Text style={styles.receiptPreviewTotalLabel}>Total</Text>
                  <Text style={styles.receiptPreviewTotalValue}>${selectedReceipt.totalAmount}</Text>
                </View>
                <View style={styles.receiptPreviewPaymentMethod}>
                  <Ionicons name="card-outline" size={18} color="#64748B" />
                  <Text style={styles.receiptPreviewPaymentText}>
                    {selectedReceipt.paymentMethod} ****{selectedReceipt.lastFourDigits}
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  receiptsContainer: {
    flex: 1,
    padding: 20,
  },
  receiptsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  receiptsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  receiptsSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  addReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addReceiptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  receiptsList: {
    gap: 12,
  },
  receiptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  receiptThumbnailContainer: {
    width: 60,
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  receiptThumbnail: {
    width: '100%',
    height: '100%',
  },
  receiptThumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptDetails: {
    flex: 1,
  },
  receiptStoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  receiptStoreName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  storeLogoContainer: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeLogoText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  receiptDate: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  receiptAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  receiptTotalLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  receiptTotalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  receiptItemCount: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  receiptsEmpty: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  receiptsEmptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  receiptsEmptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  receiptsEmptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  receiptsEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  receiptsEmptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  receiptsSummary: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  receiptsSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  receiptsSummaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4F46E5',
    marginBottom: 4,
  },
  receiptsSummaryLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  receiptsSummaryDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 10,
  },

  // Receipt Photo Options Modal
  photoOptionsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  photoOptionsModalBackdrop: {
    flex: 1,
  },
  receiptPhotoOptionsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  receiptPhotoOptionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 4,
  },
  receiptPhotoOptionsSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  receiptPhotoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 12,
  },
  receiptPhotoOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  receiptPhotoOptionContent: {
    flex: 1,
  },
  receiptPhotoOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  receiptPhotoOptionDesc: {
    fontSize: 13,
    color: '#64748B',
  },
  receiptPhotoOptionCancel: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  receiptPhotoOptionCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },

  // Add Receipt Modal
  addReceiptModalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  addReceiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  addReceiptBackButton: {
    padding: 4,
  },
  addReceiptHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addReceiptScrollView: {
    flex: 1,
    padding: 20,
  },
  receiptImagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  receiptImagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  changeReceiptImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
  },
  changeReceiptImageText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F46E5',
  },
  processReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  processReceiptButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  processReceiptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  extractedDataContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  extractedDataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  extractedDataHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  extractedSection: {
    marginBottom: 24,
  },
  extractedSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  extractedField: {
    marginBottom: 12,
  },
  extractedFieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  extractedFieldLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  extractedFieldInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  extractedTotalInput: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  extractedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 8,
  },
  extractedItemName: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  extractedItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  addReceiptFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  addReceiptCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  addReceiptCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  addReceiptSaveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#10B981',
  },
  addReceiptSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Receipt Preview Modal
  receiptPreviewModalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  receiptPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  receiptPreviewBackButton: {
    padding: 4,
  },
  receiptPreviewHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  receiptPreviewScrollView: {
    flex: 1,
    padding: 16,
  },
  receiptPreviewImageContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  receiptPreviewImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#E2E8F0',
  },
  receiptPreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  receiptPreviewStoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  receiptPreviewStoreName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  receiptPreviewStoreAddress: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  receiptPreviewStoreLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptPreviewStoreLogoText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  receiptPreviewRow: {
    flexDirection: 'row',
  },
  receiptPreviewRowItem: {
    flex: 1,
    alignItems: 'center',
  },
  receiptPreviewRowLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 2,
  },
  receiptPreviewRowValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  receiptPreviewCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  receiptPreviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  receiptPreviewItemName: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  receiptPreviewItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  receiptPreviewSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  receiptPreviewSummaryLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  receiptPreviewSummaryValue: {
    fontSize: 14,
    color: '#1E293B',
  },
  receiptPreviewTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 8,
    paddingTop: 12,
  },
  receiptPreviewTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  receiptPreviewTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  receiptPreviewPaymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  receiptPreviewPaymentText: {
    fontSize: 14,
    color: '#64748B',
  },
});

export default ReceiptsTab;
