import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { getAllProjects } from '../utils/projectsData';
import { useActivity } from '../contexts/ActivityContext';

// Receipt categories
const RECEIPT_CATEGORIES = [
  { id: 'materials', label: 'Materials', icon: 'cube-outline', color: '#3B82F6' },
  { id: 'tools', label: 'Tools & Equipment', icon: 'construct-outline', color: '#8B5CF6' },
  { id: 'labor', label: 'Labor', icon: 'people-outline', color: '#10B981' },
  { id: 'permits', label: 'Permits & Fees', icon: 'document-text-outline', color: '#F59E0B' },
  { id: 'transportation', label: 'Transportation', icon: 'car-outline', color: '#EF4444' },
  { id: 'utilities', label: 'Utilities', icon: 'flash-outline', color: '#06B6D4' },
  { id: 'office', label: 'Office Supplies', icon: 'briefcase-outline', color: '#EC4899' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline', color: '#6B7280' },
];

// Mock receipts data for all projects
const MOCK_RECEIPTS = [
  {
    id: 'r1',
    storeName: 'THE HOME DEPOT',
    totalAmount: '245.67',
    date: '12/24/2024',
    time: '2:30 PM',
    category: 'materials',
    projectId: 1,
    projectName: 'Smith Residence - Kitchen Remodel',
    description: 'Plywood, caulk, and foam sealant',
    imageUri: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
    uploadedBy: 'Yefry Soto',
  },
  {
    id: 'r2',
    storeName: "LOWE'S",
    totalAmount: '189.99',
    date: '12/23/2024',
    time: '10:15 AM',
    category: 'tools',
    projectId: 2,
    projectName: 'Johnson Property - Bathroom Renovation',
    description: 'Power drill and accessories',
    imageUri: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
    uploadedBy: 'Maria Rodriguez',
  },
  {
    id: 'r3',
    storeName: 'ACE HARDWARE',
    totalAmount: '78.45',
    date: '12/22/2024',
    time: '4:45 PM',
    category: 'materials',
    projectId: 1,
    projectName: 'Smith Residence - Kitchen Remodel',
    description: 'Screws, nails, and brackets',
    imageUri: null,
    uploadedBy: 'Carlos Martinez',
  },
  {
    id: 'r4',
    storeName: 'SHELL GAS STATION',
    totalAmount: '65.00',
    date: '12/21/2024',
    time: '8:00 AM',
    category: 'transportation',
    projectId: 3,
    projectName: 'Denver Office Build',
    description: 'Fuel for work truck',
    imageUri: null,
    uploadedBy: 'Yefry Soto',
  },
  {
    id: 'r5',
    storeName: 'CITY PERMITS OFFICE',
    totalAmount: '350.00',
    date: '12/20/2024',
    time: '11:30 AM',
    category: 'permits',
    projectId: 2,
    projectName: 'Johnson Property - Bathroom Renovation',
    description: 'Building permit fee',
    imageUri: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400',
    uploadedBy: 'Azis K',
  },
  {
    id: 'r6',
    storeName: 'THE HOME DEPOT',
    totalAmount: '523.89',
    date: '12/19/2024',
    time: '3:20 PM',
    category: 'materials',
    projectId: 3,
    projectName: 'Denver Office Build',
    description: 'Electrical supplies and wiring',
    imageUri: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
    uploadedBy: 'Oumayama M',
  },
  {
    id: 'r7',
    storeName: 'STAPLES',
    totalAmount: '89.99',
    date: '12/18/2024',
    time: '1:15 PM',
    category: 'office',
    projectId: null,
    projectName: 'General/Office',
    description: 'Printer ink and paper',
    imageUri: null,
    uploadedBy: 'Emely Devis',
  },
  {
    id: 'r8',
    storeName: 'RENTAL CENTER',
    totalAmount: '275.00',
    date: '12/17/2024',
    time: '9:00 AM',
    category: 'tools',
    projectId: 1,
    projectName: 'Smith Residence - Kitchen Remodel',
    description: 'Tile saw rental - 2 days',
    imageUri: null,
    uploadedBy: 'Sarash Williams',
  },
];

export default function ReceiptsScreen() {
  const router = useRouter();
  const { logActivity } = useActivity();
  
  // State
  const [receipts, setReceipts] = useState(MOCK_RECEIPTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAddReceiptModal, setShowAddReceiptModal] = useState(false);
  const [showReceiptDetail, setShowReceiptDetail] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  
  // Add receipt form state
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [receiptImageUri, setReceiptImageUri] = useState<string | null>(null);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [extractedReceiptData, setExtractedReceiptData] = useState<any>(null);
  const [addReceiptProject, setAddReceiptProject] = useState<any>(null);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  // Manual form state
  const [manualMerchant, setManualMerchant] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toLocaleDateString());
  const [manualTime, setManualTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [manualDescription, setManualDescription] = useState('');
  const [manualTotal, setManualTotal] = useState('');
  const [manualCategory, setManualCategory] = useState('');

  // Load projects
  useEffect(() => {
    const allProjects = getAllProjects();
    setProjects(allProjects);
  }, []);

  // Filter receipts
  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = 
      receipt.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.projectName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || receipt.category === selectedCategory;
    const matchesProject = selectedProject === null || receipt.projectId === selectedProject;
    
    return matchesSearch && matchesCategory && matchesProject;
  });

  // Calculate totals
  const totalAmount = filteredReceipts.reduce((sum, r) => sum + parseFloat(r.totalAmount || '0'), 0);
  const totalCount = filteredReceipts.length;

  // Reset add receipt form
  const resetAddReceiptForm = () => {
    setReceiptImageUri(null);
    setIsManualEntry(false);
    setIsProcessingReceipt(false);
    setExtractedReceiptData(null);
    setAddReceiptProject(null);
    setManualMerchant('');
    setManualDate(new Date().toLocaleDateString());
    setManualTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setManualDescription('');
    setManualTotal('');
    setManualCategory('');
  };

  // Save receipt
  const handleSaveReceipt = () => {
    let newReceipt: any;
    
    if (isManualEntry) {
      if (!manualMerchant.trim() || !manualTotal.trim() || !manualCategory) {
        Alert.alert('Required Fields', 'Please fill in Merchant, Total Amount, and Category');
        return;
      }
      
      newReceipt = {
        id: `r-${Date.now()}`,
        storeName: manualMerchant.trim().toUpperCase(),
        totalAmount: manualTotal,
        date: manualDate,
        time: manualTime,
        category: manualCategory,
        projectId: addReceiptProject?.id || null,
        projectName: addReceiptProject?.name || 'General/Office',
        description: manualDescription,
        imageUri: receiptImageUri,
        uploadedBy: 'Yefry Soto',
      };
      
      const categoryLabel = RECEIPT_CATEGORIES.find(c => c.id === manualCategory)?.label || manualCategory;
      logActivity({
        type: 'receipt',
        action: 'added',
        description: `added $${manualTotal} receipt from ${manualMerchant} (${categoryLabel})`,
        userName: 'Yefry Soto',
        userInitials: 'YS',
        projectName: addReceiptProject?.name,
      });
    } else if (extractedReceiptData) {
      newReceipt = {
        id: `r-${Date.now()}`,
        storeName: extractedReceiptData.storeName,
        totalAmount: extractedReceiptData.totalAmount,
        date: extractedReceiptData.date,
        time: extractedReceiptData.time,
        category: 'materials',
        projectId: addReceiptProject?.id || null,
        projectName: addReceiptProject?.name || 'General/Office',
        description: extractedReceiptData.items?.map((i: any) => i.name).join(', ') || '',
        imageUri: receiptImageUri,
        uploadedBy: 'Yefry Soto',
      };
      
      logActivity({
        type: 'receipt',
        action: 'uploaded',
        description: `uploaded receipt for $${extractedReceiptData.totalAmount} from ${extractedReceiptData.storeName}`,
        userName: 'Yefry Soto',
        userInitials: 'YS',
        projectName: addReceiptProject?.name,
      });
    } else {
      return;
    }
    
    setReceipts(prev => [newReceipt, ...prev]);
    setShowAddReceiptModal(false);
    resetAddReceiptForm();
    Alert.alert('Success', 'Receipt saved successfully!');
  };

  // Get category info
  const getCategoryInfo = (categoryId: string) => {
    return RECEIPT_CATEGORIES.find(c => c.id === categoryId) || RECEIPT_CATEGORIES[7];
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={['#eab308', '#ca8a04']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Receipts</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowPhotoOptions(true)}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>${totalAmount.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalCount}</Text>
            <Text style={styles.statLabel}>Receipts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{projects.length}</Text>
            <Text style={styles.statLabel}>Projects</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search receipts..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={[styles.filterButton, (selectedCategory || selectedProject !== null) && styles.filterButtonActive]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={20} color={(selectedCategory || selectedProject !== null) ? '#FFFFFF' : '#6B7280'} />
        </TouchableOpacity>
      </View>

      {/* Active Filters */}
      {(selectedCategory || selectedProject !== null) && (
        <View style={styles.activeFilters}>
          {selectedCategory && (
            <TouchableOpacity 
              style={styles.filterChip}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={styles.filterChipText}>
                {getCategoryInfo(selectedCategory).label}
              </Text>
              <Ionicons name="close" size={16} color="#4F46E5" />
            </TouchableOpacity>
          )}
          {selectedProject !== null && (
            <TouchableOpacity 
              style={styles.filterChip}
              onPress={() => setSelectedProject(null)}
            >
              <Text style={styles.filterChipText}>
                {projects.find(p => p.id === selectedProject)?.name || 'Project'}
              </Text>
              <Ionicons name="close" size={16} color="#4F46E5" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={() => {
              setSelectedCategory(null);
              setSelectedProject(null);
            }}
          >
            <Text style={styles.clearFiltersText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Receipts List */}
      <FlatList
        data={filteredReceipts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Receipts Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery || selectedCategory || selectedProject !== null
                ? 'Try adjusting your filters'
                : 'Add your first receipt to get started'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const category = getCategoryInfo(item.category);
          return (
            <TouchableOpacity 
              style={styles.receiptCard}
              onPress={() => {
                setSelectedReceipt(item);
                setShowReceiptDetail(true);
              }}
            >
              {/* Receipt Image or Icon */}
              <View style={styles.receiptImageContainer}>
                {item.imageUri ? (
                  <Image source={{ uri: item.imageUri }} style={styles.receiptImage} />
                ) : (
                  <View style={[styles.receiptImagePlaceholder, { backgroundColor: category.color + '20' }]}>
                    <Ionicons name={category.icon as any} size={28} color={category.color} />
                  </View>
                )}
              </View>
              
              {/* Receipt Info */}
              <View style={styles.receiptInfo}>
                <View style={styles.receiptHeader}>
                  <Text style={styles.storeName} numberOfLines={1}>{item.storeName}</Text>
                  <Text style={styles.receiptAmount}>${item.totalAmount}</Text>
                </View>
                <Text style={styles.projectName} numberOfLines={1}>{item.projectName}</Text>
                <View style={styles.receiptMeta}>
                  <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
                    <Ionicons name={category.icon as any} size={12} color={category.color} />
                    <Text style={[styles.categoryBadgeText, { color: category.color }]}>{category.label}</Text>
                  </View>
                  <Text style={styles.receiptDate}>{item.date}</Text>
                </View>
                {item.uploadedBy && (
                  <View style={styles.uploadedByContainer}>
                    <Ionicons name="person-outline" size={12} color="#9CA3AF" />
                    <Text style={styles.uploadedByText}>By {item.uploadedBy}</Text>
                  </View>
                )}
              </View>
              
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>
          );
        }}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowFilterModal(false)}
          />
          <View style={styles.filterModalContainer}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filter Receipts</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Category Filter */}
            <Text style={styles.filterSectionTitle}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              <TouchableOpacity
                style={[styles.categoryFilterChip, !selectedCategory && styles.categoryFilterChipActive]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={[styles.categoryFilterText, !selectedCategory && styles.categoryFilterTextActive]}>All</Text>
              </TouchableOpacity>
              {RECEIPT_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryFilterChip, 
                    selectedCategory === cat.id && styles.categoryFilterChipActive,
                    selectedCategory === cat.id && { backgroundColor: cat.color }
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Ionicons 
                    name={cat.icon as any} 
                    size={16} 
                    color={selectedCategory === cat.id ? '#FFFFFF' : cat.color} 
                  />
                  <Text style={[
                    styles.categoryFilterText, 
                    selectedCategory === cat.id && styles.categoryFilterTextActive
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Project Filter */}
            <Text style={styles.filterSectionTitle}>Project</Text>
            <ScrollView style={styles.projectFilterScroll}>
              <TouchableOpacity
                style={[styles.projectFilterItem, selectedProject === null && styles.projectFilterItemActive]}
                onPress={() => setSelectedProject(null)}
              >
                <Text style={[styles.projectFilterText, selectedProject === null && styles.projectFilterTextActive]}>
                  All Projects
                </Text>
                {selectedProject === null && <Ionicons name="checkmark" size={20} color="#4F46E5" />}
              </TouchableOpacity>
              {projects.map(project => (
                <TouchableOpacity
                  key={project.id}
                  style={[styles.projectFilterItem, selectedProject === project.id && styles.projectFilterItemActive]}
                  onPress={() => setSelectedProject(project.id)}
                >
                  <Text style={[styles.projectFilterText, selectedProject === project.id && styles.projectFilterTextActive]}>
                    {project.name}
                  </Text>
                  {selectedProject === project.id && <Ionicons name="checkmark" size={20} color="#4F46E5" />}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity 
              style={styles.applyFilterButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.applyFilterText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Photo Options Modal */}
      <Modal
        visible={showPhotoOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPhotoOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowPhotoOptions(false)}
          />
          <View style={styles.photoOptionsContainer}>
            <Text style={styles.photoOptionsTitle}>Add Receipt</Text>
            <Text style={styles.photoOptionsSubtitle}>Take a photo or upload from gallery</Text>
            
            <TouchableOpacity
              style={styles.photoOption}
              onPress={async () => {
                setShowPhotoOptions(false);
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
              <View style={styles.photoOptionIcon}>
                <Ionicons name="camera" size={28} color="#4F46E5" />
              </View>
              <View style={styles.photoOptionContent}>
                <Text style={styles.photoOptionTitle}>Take Photo</Text>
                <Text style={styles.photoOptionDesc}>Use camera to capture receipt</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoOption}
              onPress={async () => {
                setShowPhotoOptions(false);
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
              <View style={styles.photoOptionIcon}>
                <Ionicons name="images" size={28} color="#10B981" />
              </View>
              <View style={styles.photoOptionContent}>
                <Text style={styles.photoOptionTitle}>Upload from Gallery</Text>
                <Text style={styles.photoOptionDesc}>Select existing photo</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoOptionCancel}
              onPress={() => setShowPhotoOptions(false)}
            >
              <Text style={styles.photoOptionCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Receipt Modal */}
      <Modal
        visible={showAddReceiptModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setShowAddReceiptModal(false);
          resetAddReceiptForm();
        }}
      >
        <View style={styles.addReceiptModalContainer}>
          {/* Header */}
          <LinearGradient
            colors={['#eab308', '#ca8a04']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addReceiptHeader}
          >
            <TouchableOpacity
              onPress={() => {
                setShowAddReceiptModal(false);
                resetAddReceiptForm();
              }}
              style={styles.addReceiptBackButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.addReceiptHeaderTitle}>Add Receipt</Text>
            <View style={{ width: 24 }} />
          </LinearGradient>

          <ScrollView style={styles.addReceiptScrollView}>
            {/* Project Selector */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Select Project</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowProjectDropdown(!showProjectDropdown)}
              >
                <Text style={addReceiptProject ? styles.dropdownValue : styles.dropdownPlaceholder}>
                  {addReceiptProject ? addReceiptProject.name : 'Choose a project...'}
                </Text>
                <Ionicons name={showProjectDropdown ? "chevron-up" : "chevron-down"} size={20} color="#94A3B8" />
              </TouchableOpacity>
              
              {showProjectDropdown && (
                <View style={styles.dropdownList}>
                  {projects.map((project) => (
                    <TouchableOpacity
                      key={project.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setAddReceiptProject(project);
                        setShowProjectDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{project.name}</Text>
                      {addReceiptProject?.id === project.id && (
                        <Ionicons name="checkmark" size={20} color="#4F46E5" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Receipt Image Preview */}
            {receiptImageUri && (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: receiptImageUri }}
                  style={styles.imagePreview}
                  resizeMode="contain"
                />
                <TouchableOpacity
                  style={styles.changeImageButton}
                  onPress={() => {
                    setShowAddReceiptModal(false);
                    setShowPhotoOptions(true);
                  }}
                >
                  <Ionicons name="camera" size={16} color="#4F46E5" />
                  <Text style={styles.changeImageText}>Change Image</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* AI or Manual Entry Buttons */}
            {!extractedReceiptData && !isManualEntry && (
              <>
                <TouchableOpacity
                  style={[styles.aiButton, isProcessingReceipt && styles.aiButtonDisabled]}
                  disabled={isProcessingReceipt}
                  onPress={() => {
                    if (!addReceiptProject) {
                      Alert.alert('Select Project', 'Please select a project first');
                      return;
                    }
                    setIsProcessingReceipt(true);
                    setTimeout(() => {
                      setExtractedReceiptData({
                        storeName: 'THE HOME DEPOT',
                        date: new Date().toLocaleDateString(),
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        items: [
                          { name: '3-PACK CAULK', price: 16.97 },
                          { name: 'FOAM SEALANT', price: 8.47 },
                          { name: 'PLYWOOD', price: 32.48 },
                        ],
                        totalAmount: '57.92',
                      });
                      setIsProcessingReceipt(false);
                    }, 2000);
                  }}
                >
                  {isProcessingReceipt ? (
                    <>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.aiButtonText}>Analyzing Receipt...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="scan" size={20} color="#FFFFFF" />
                      <Text style={styles.aiButtonText}>Extract Details with AI</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.manualButton}
                  onPress={() => {
                    if (!addReceiptProject) {
                      Alert.alert('Select Project', 'Please select a project first');
                      return;
                    }
                    setIsManualEntry(true);
                  }}
                >
                  <Ionicons name="create-outline" size={20} color="#4F46E5" />
                  <Text style={styles.manualButtonText}>Enter Details Manually</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Manual Entry Form */}
            {isManualEntry && (
              <View style={styles.manualFormContainer}>
                <View style={styles.manualFormHeader}>
                  <Ionicons name="create" size={24} color="#4F46E5" />
                  <Text style={styles.manualFormHeaderText}>Manual Entry</Text>
                </View>

                {/* Merchant */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Merchant *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={manualMerchant}
                    onChangeText={setManualMerchant}
                    placeholder="e.g., Home Depot, Lowe's"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {/* Date & Time */}
                <View style={styles.formRow}>
                  <View style={[styles.formSection, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Date *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={manualDate}
                      onChangeText={setManualDate}
                      placeholder="MM/DD/YYYY"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View style={[styles.formSection, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Time *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={manualTime}
                      onChangeText={setManualTime}
                      placeholder="HH:MM AM/PM"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                {/* Description */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Description</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea]}
                    value={manualDescription}
                    onChangeText={setManualDescription}
                    placeholder="What was purchased?"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Total Amount */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Total Amount *</Text>
                  <View style={styles.amountInputWrapper}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={manualTotal}
                      onChangeText={setManualTotal}
                      placeholder="0.00"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                {/* Category */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Category *</Text>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  >
                    {manualCategory ? (
                      <View style={styles.selectedCategory}>
                        <Ionicons 
                          name={getCategoryInfo(manualCategory).icon as any} 
                          size={20} 
                          color={getCategoryInfo(manualCategory).color} 
                        />
                        <Text style={styles.dropdownValue}>{getCategoryInfo(manualCategory).label}</Text>
                      </View>
                    ) : (
                      <Text style={styles.dropdownPlaceholder}>Select a category...</Text>
                    )}
                    <Ionicons name={showCategoryDropdown ? "chevron-up" : "chevron-down"} size={20} color="#94A3B8" />
                  </TouchableOpacity>
                  
                  {showCategoryDropdown && (
                    <View style={styles.dropdownList}>
                      {RECEIPT_CATEGORIES.map((cat) => (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.dropdownItem,
                            manualCategory === cat.id && styles.dropdownItemSelected
                          ]}
                          onPress={() => {
                            setManualCategory(cat.id);
                            setShowCategoryDropdown(false);
                          }}
                        >
                          <Ionicons name={cat.icon as any} size={20} color={cat.color} />
                          <Text style={styles.dropdownItemText}>{cat.label}</Text>
                          {manualCategory === cat.id && (
                            <Ionicons name="checkmark" size={20} color="#4F46E5" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* AI Extracted Data */}
            {extractedReceiptData && (
              <View style={styles.extractedContainer}>
                <View style={styles.extractedHeader}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  <Text style={styles.extractedHeaderText}>Information Extracted</Text>
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Store Name</Text>
                  <TextInput
                    style={styles.formInput}
                    value={extractedReceiptData.storeName}
                    onChangeText={(text) => setExtractedReceiptData({...extractedReceiptData, storeName: text})}
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formSection, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Date</Text>
                    <TextInput
                      style={styles.formInput}
                      value={extractedReceiptData.date}
                      onChangeText={(text) => setExtractedReceiptData({...extractedReceiptData, date: text})}
                    />
                  </View>
                  <View style={[styles.formSection, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Total</Text>
                    <View style={styles.amountInputWrapper}>
                      <Text style={styles.currencySymbol}>$</Text>
                      <TextInput
                        style={styles.amountInput}
                        value={extractedReceiptData.totalAmount}
                        onChangeText={(text) => setExtractedReceiptData({...extractedReceiptData, totalAmount: text})}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          {(extractedReceiptData || isManualEntry) && (
            <View style={styles.addReceiptFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddReceiptModal(false);
                  resetAddReceiptForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveReceipt}
              >
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Receipt</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* Receipt Detail Modal */}
      <Modal
        visible={showReceiptDetail}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setShowReceiptDetail(false);
          setSelectedReceipt(null);
        }}
      >
        {selectedReceipt && (
          <View style={styles.detailModalContainer}>
            {/* Header */}
            <View style={styles.detailHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowReceiptDetail(false);
                  setSelectedReceipt(null);
                }}
              >
                <Ionicons name="arrow-back" size={24} color="#1F2937" />
              </TouchableOpacity>
              <Text style={styles.detailHeaderTitle}>Receipt Details</Text>
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
                          setReceipts(prev => prev.filter(r => r.id !== selectedReceipt.id));
                          setShowReceiptDetail(false);
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

            <ScrollView style={styles.detailScrollView}>
              {/* Receipt Image */}
              {selectedReceipt.imageUri && (
                <Image
                  source={{ uri: selectedReceipt.imageUri }}
                  style={styles.detailImage}
                  resizeMode="contain"
                />
              )}

              {/* Amount */}
              <View style={styles.detailAmountContainer}>
                <Text style={styles.detailAmountLabel}>Total Amount</Text>
                <Text style={styles.detailAmount}>${selectedReceipt.totalAmount}</Text>
              </View>

              {/* Info Cards */}
              <View style={styles.detailCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Store</Text>
                  <Text style={styles.detailValue}>{selectedReceipt.storeName}</Text>
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{selectedReceipt.date} at {selectedReceipt.time}</Text>
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Project</Text>
                  <Text style={styles.detailValue}>{selectedReceipt.projectName}</Text>
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryInfo(selectedReceipt.category).color + '20' }]}>
                    <Ionicons 
                      name={getCategoryInfo(selectedReceipt.category).icon as any} 
                      size={14} 
                      color={getCategoryInfo(selectedReceipt.category).color} 
                    />
                    <Text style={[styles.categoryBadgeText, { color: getCategoryInfo(selectedReceipt.category).color }]}>
                      {getCategoryInfo(selectedReceipt.category).label}
                    </Text>
                  </View>
                </View>
                {selectedReceipt.description && (
                  <>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Description</Text>
                      <Text style={styles.detailValue}>{selectedReceipt.description}</Text>
                    </View>
                  </>
                )}
                {selectedReceipt.uploadedBy && (
                  <>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Uploaded By</Text>
                      <Text style={styles.detailValue}>{selectedReceipt.uploadedBy}</Text>
                    </View>
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  filterChipText: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '500',
  },
  clearFiltersText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  receiptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  receiptImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
  },
  receiptImage: {
    width: '100%',
    height: '100%',
  },
  receiptImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  receiptInfo: {
    flex: 1,
    marginLeft: 12,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  receiptAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  projectName: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  receiptMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  receiptDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  uploadedByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  uploadedByText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  filterModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginTop: 16,
  },
  categoryScroll: {
    marginBottom: 8,
  },
  categoryFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    gap: 6,
  },
  categoryFilterChipActive: {
    backgroundColor: '#4F46E5',
  },
  categoryFilterText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  categoryFilterTextActive: {
    color: '#FFFFFF',
  },
  projectFilterScroll: {
    maxHeight: 200,
  },
  projectFilterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
  },
  projectFilterItemActive: {
    backgroundColor: '#EEF2FF',
  },
  projectFilterText: {
    fontSize: 15,
    color: '#374151',
  },
  projectFilterTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  applyFilterButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  applyFilterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  photoOptionsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  photoOptionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  photoOptionsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  photoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  photoOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOptionContent: {
    flex: 1,
    marginLeft: 12,
  },
  photoOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  photoOptionDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  photoOptionCancel: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  photoOptionCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  addReceiptModalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  addReceiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  addReceiptBackButton: {
    padding: 8,
  },
  addReceiptHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addReceiptScrollView: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dropdownValue: {
    fontSize: 16,
    color: '#1F2937',
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  dropdownItemSelected: {
    backgroundColor: '#EEF2FF',
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
  },
  changeImageText: {
    fontSize: 14,
    color: '#4F46E5',
    marginLeft: 6,
    fontWeight: '600',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  aiButtonDisabled: {
    opacity: 0.7,
  },
  aiButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  manualButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  manualFormContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  manualFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  manualFormHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
    marginLeft: 8,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#10B981',
    paddingLeft: 14,
  },
  amountInput: {
    flex: 1,
    padding: 14,
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  extractedContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  extractedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  extractedHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 8,
  },
  addReceiptFooter: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailModalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  detailScrollView: {
    flex: 1,
    padding: 16,
  },
  detailImage: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    marginBottom: 20,
  },
  detailAmountContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  detailAmountLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#10B981',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
});
