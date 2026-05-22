import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  StatusBar, Image, Dimensions, TextInput, Modal, 
  KeyboardAvoidingView, Platform, Linking, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getAllMaterials, 
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  toggleMaterialFavorite,
  MaterialProduct 
} from '../utils/projectsData';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'grid-outline', color: '#6366F1' },
  { id: 'electrical', label: 'Electrical', icon: 'flash-outline', color: '#F59E0B' },
  { id: 'plumbing', label: 'Plumbing', icon: 'water-outline', color: '#3B82F6' },
  { id: 'fixtures', label: 'Fixtures', icon: 'bulb-outline', color: '#10B981' },
  { id: 'hardware', label: 'Hardware', icon: 'construct-outline', color: '#8B5CF6' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline', color: '#64748B' },
];

const getCategoryColor = (category: string): string => {
  const cat = CATEGORIES.find(c => c.id === category);
  return cat?.color || '#6366F1';
};

const getCategoryIcon = (category: string): string => {
  const cat = CATEGORIES.find(c => c.id === category);
  return cat?.icon || 'cube-outline';
};

export default function MaterialsPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [materials, setMaterials] = useState<MaterialProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialProduct | null>(null);
  
  // Add/Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMode, setEditMode] = useState<'add' | 'edit'>('add');
  const [editData, setEditData] = useState<Partial<MaterialProduct>>({});

  // Load materials
  useFocusEffect(
    useCallback(() => {
      const allMaterials = getAllMaterials();
      setMaterials(allMaterials);
    }, [])
  );

  // Filter materials
  const filteredMaterials = materials.filter(m => {
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Open detail modal
  const handleOpenDetail = (material: MaterialProduct) => {
    setSelectedMaterial(material);
    setShowDetailModal(true);
  };

  // Open add modal
  const handleAddNew = () => {
    setEditMode('add');
    setEditData({
      name: '',
      description: '',
      category: 'electrical',
      isFavorite: false,
    });
    setShowEditModal(true);
  };

  // Open edit modal
  const handleEdit = () => {
    if (selectedMaterial) {
      setEditMode('edit');
      setEditData({ ...selectedMaterial });
      setShowDetailModal(false);
      setShowEditModal(true);
    }
  };

  // Save material
  const handleSave = () => {
    if (!editData.name?.trim()) {
      Alert.alert('Required', 'Please enter a product name.');
      return;
    }

    if (editMode === 'add') {
      const newMaterial = createMaterial({
        name: editData.name.trim(),
        description: editData.description?.trim() || '',
        category: editData.category as MaterialProduct['category'] || 'other',
        imageUrl: editData.imageUrl,
        url: editData.url,
        purchaseLocation: editData.purchaseLocation,
        brand: editData.brand,
        modelNumber: editData.modelNumber,
        price: editData.price,
        notes: editData.notes,
        isFavorite: editData.isFavorite || false,
      });
      setMaterials(prev => [...prev, newMaterial]);
      Alert.alert('Success', 'Product added successfully!');
    } else if (selectedMaterial) {
      const updated = updateMaterial(selectedMaterial.id, editData);
      if (updated) {
        setMaterials(prev => prev.map(m => m.id === updated.id ? updated : m));
        Alert.alert('Success', 'Product updated successfully!');
      }
    }

    setShowEditModal(false);
    setEditData({});
  };

  // Delete material
  const handleDelete = () => {
    if (!selectedMaterial) return;
    
    const message = Platform.OS === 'web' 
      ? `Are you sure you want to delete "${selectedMaterial.name}"?`
      : `Are you sure you want to delete "${selectedMaterial.name}"?`;

    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        deleteMaterial(selectedMaterial.id);
        setMaterials(prev => prev.filter(m => m.id !== selectedMaterial.id));
        setShowDetailModal(false);
        setSelectedMaterial(null);
      }
    } else {
      Alert.alert('Delete Product', message, [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteMaterial(selectedMaterial.id);
            setMaterials(prev => prev.filter(m => m.id !== selectedMaterial.id));
            setShowDetailModal(false);
            setSelectedMaterial(null);
          }
        },
      ]);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = (id: string) => {
    const updated = toggleMaterialFavorite(id);
    if (updated) {
      setMaterials(prev => prev.map(m => m.id === id ? updated : m));
      if (selectedMaterial?.id === id) {
        setSelectedMaterial(updated);
      }
    }
  };

  // Open URL
  const handleOpenURL = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open the URL.');
    });
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient colors={['#7C3AED', '#A855F7']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Materials & Products</Text>
            <Text style={styles.headerSubtitle}>{filteredMaterials.length} items</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#A78BFA" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#A78BFA"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#A78BFA" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Category Tabs */}
      <View style={styles.categoriesContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryTab,
                selectedCategory === cat.id && { backgroundColor: cat.color }
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Ionicons 
                name={cat.icon as any} 
                size={18} 
                color={selectedCategory === cat.id ? '#FFFFFF' : cat.color} 
              />
              <Text style={[
                styles.categoryText,
                selectedCategory === cat.id && styles.categoryTextActive
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Materials Grid */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredMaterials.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="cube-outline" size={48} color="#A855F7" />
            </View>
            <Text style={styles.emptyTitle}>No Products Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try a different search term' : 'Add your first product to get started'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity style={styles.emptyButton} onPress={handleAddNew}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>Add Product</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredMaterials.map(material => (
              <TouchableOpacity
                key={material.id}
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => handleOpenDetail(material)}
              >
                {/* Card Image */}
                <View style={styles.cardImageContainer}>
                  {material.imageUrl ? (
                    <Image 
                      source={{ uri: material.imageUrl }} 
                      style={styles.cardImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.cardImagePlaceholder, { backgroundColor: getCategoryColor(material.category) + '20' }]}>
                      <Ionicons 
                        name={getCategoryIcon(material.category) as any} 
                        size={40} 
                        color={getCategoryColor(material.category)} 
                      />
                    </View>
                  )}
                  
                  {/* Category Badge */}
                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(material.category) }]}>
                    <Ionicons name={getCategoryIcon(material.category) as any} size={12} color="#FFFFFF" />
                  </View>
                  
                  {/* Favorite Badge */}
                  {material.isFavorite && (
                    <View style={styles.favoriteBadge}>
                      <Ionicons name="heart" size={14} color="#EF4444" />
                    </View>
                  )}
                </View>
                
                {/* Card Content */}
                <View style={styles.cardContent}>
                  <Text style={styles.cardName} numberOfLines={1}>{material.name}</Text>
                  <Text style={styles.cardDescription} numberOfLines={2}>{material.description}</Text>
                  
                  {material.brand && (
                    <View style={styles.cardMeta}>
                      <Ionicons name="business-outline" size={12} color="#64748B" />
                      <Text style={styles.cardMetaText}>{material.brand}</Text>
                    </View>
                  )}
                  
                  {material.price && (
                    <Text style={styles.cardPrice}>{material.price}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={showDetailModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            {selectedMaterial && (
              <>
                {/* Modal Header */}
                <View style={styles.detailHeader}>
                  <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                    <Ionicons name="close" size={24} color="#64748B" />
                  </TouchableOpacity>
                  <View style={styles.detailHeaderActions}>
                    <TouchableOpacity 
                      style={styles.detailAction}
                      onPress={() => handleToggleFavorite(selectedMaterial.id)}
                    >
                      <Ionicons 
                        name={selectedMaterial.isFavorite ? "heart" : "heart-outline"} 
                        size={24} 
                        color={selectedMaterial.isFavorite ? "#EF4444" : "#64748B"} 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.detailAction} onPress={handleEdit}>
                      <Ionicons name="create-outline" size={24} color="#64748B" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.detailAction} onPress={handleDelete}>
                      <Ionicons name="trash-outline" size={24} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Product Image */}
                  {selectedMaterial.imageUrl ? (
                    <Image 
                      source={{ uri: selectedMaterial.imageUrl }} 
                      style={styles.detailImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.detailImagePlaceholder, { backgroundColor: getCategoryColor(selectedMaterial.category) + '20' }]}>
                      <Ionicons 
                        name={getCategoryIcon(selectedMaterial.category) as any} 
                        size={64} 
                        color={getCategoryColor(selectedMaterial.category)} 
                      />
                    </View>
                  )}

                  {/* Product Info */}
                  <View style={styles.detailInfo}>
                    <View style={[styles.detailCategoryBadge, { backgroundColor: getCategoryColor(selectedMaterial.category) }]}>
                      <Ionicons name={getCategoryIcon(selectedMaterial.category) as any} size={14} color="#FFFFFF" />
                      <Text style={styles.detailCategoryText}>
                        {CATEGORIES.find(c => c.id === selectedMaterial.category)?.label}
                      </Text>
                    </View>

                    <Text style={styles.detailName}>{selectedMaterial.name}</Text>
                    <Text style={styles.detailDescription}>{selectedMaterial.description}</Text>

                    {selectedMaterial.price && (
                      <Text style={styles.detailPrice}>{selectedMaterial.price}</Text>
                    )}

                    {/* Details List */}
                    <View style={styles.detailsList}>
                      {selectedMaterial.brand && (
                        <View style={styles.detailItem}>
                          <Ionicons name="business-outline" size={20} color="#7C3AED" />
                          <View style={styles.detailItemContent}>
                            <Text style={styles.detailItemLabel}>Brand</Text>
                            <Text style={styles.detailItemValue}>{selectedMaterial.brand}</Text>
                          </View>
                        </View>
                      )}

                      {selectedMaterial.modelNumber && (
                        <View style={styles.detailItem}>
                          <Ionicons name="barcode-outline" size={20} color="#7C3AED" />
                          <View style={styles.detailItemContent}>
                            <Text style={styles.detailItemLabel}>Model Number</Text>
                            <Text style={styles.detailItemValue}>{selectedMaterial.modelNumber}</Text>
                          </View>
                        </View>
                      )}

                      {selectedMaterial.purchaseLocation && (
                        <View style={styles.detailItem}>
                          <Ionicons name="storefront-outline" size={20} color="#7C3AED" />
                          <View style={styles.detailItemContent}>
                            <Text style={styles.detailItemLabel}>Where to Purchase</Text>
                            <Text style={styles.detailItemValue}>{selectedMaterial.purchaseLocation}</Text>
                          </View>
                        </View>
                      )}

                      {selectedMaterial.url && (
                        <TouchableOpacity 
                          style={styles.detailItem}
                          onPress={() => handleOpenURL(selectedMaterial.url!)}
                        >
                          <Ionicons name="link-outline" size={20} color="#7C3AED" />
                          <View style={styles.detailItemContent}>
                            <Text style={styles.detailItemLabel}>Product URL</Text>
                            <Text style={[styles.detailItemValue, styles.detailLink]} numberOfLines={1}>
                              {selectedMaterial.url}
                            </Text>
                          </View>
                          <Ionicons name="open-outline" size={18} color="#3B82F6" />
                        </TouchableOpacity>
                      )}

                      {selectedMaterial.notes && (
                        <View style={styles.detailItem}>
                          <Ionicons name="document-text-outline" size={20} color="#7C3AED" />
                          <View style={styles.detailItemContent}>
                            <Text style={styles.detailItemLabel}>Notes</Text>
                            <Text style={styles.detailItemValue}>{selectedMaterial.notes}</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                </ScrollView>

                {/* Action Buttons */}
                {selectedMaterial.url && (
                  <TouchableOpacity 
                    style={styles.viewProductButton}
                    onPress={() => handleOpenURL(selectedMaterial.url!)}
                  >
                    <LinearGradient colors={['#7C3AED', '#A855F7']} style={styles.viewProductGradient}>
                      <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.viewProductText}>View Product</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>
                {editMode === 'add' ? 'Add Product' : 'Edit Product'}
              </Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.editForm}>
              {/* Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={editData.name}
                  onChangeText={text => setEditData(prev => ({ ...prev, name: text }))}
                  placeholder="e.g., Decora Outlet"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={editData.description}
                  onChangeText={text => setEditData(prev => ({ ...prev, description: text }))}
                  placeholder="Brief description of the product..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Category */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                <View style={styles.categoryPicker}>
                  {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryPickerItem,
                        editData.category === cat.id && { backgroundColor: cat.color, borderColor: cat.color }
                      ]}
                      onPress={() => setEditData(prev => ({ ...prev, category: cat.id as any }))}
                    >
                      <Ionicons 
                        name={cat.icon as any} 
                        size={16} 
                        color={editData.category === cat.id ? '#FFFFFF' : cat.color} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Brand */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Brand</Text>
                <TextInput
                  style={styles.formInput}
                  value={editData.brand}
                  onChangeText={text => setEditData(prev => ({ ...prev, brand: text }))}
                  placeholder="e.g., Leviton"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Model Number */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Model Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={editData.modelNumber}
                  onChangeText={text => setEditData(prev => ({ ...prev, modelNumber: text }))}
                  placeholder="e.g., T5325-W"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Price */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Price</Text>
                <TextInput
                  style={styles.formInput}
                  value={editData.price}
                  onChangeText={text => setEditData(prev => ({ ...prev, price: text }))}
                  placeholder="e.g., $3.97"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Purchase Location */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Where to Purchase</Text>
                <TextInput
                  style={styles.formInput}
                  value={editData.purchaseLocation}
                  onChangeText={text => setEditData(prev => ({ ...prev, purchaseLocation: text }))}
                  placeholder="e.g., Home Depot"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* URL */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Product URL</Text>
                <TextInput
                  style={styles.formInput}
                  value={editData.url}
                  onChangeText={text => setEditData(prev => ({ ...prev, url: text }))}
                  placeholder="https://..."
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>

              {/* Notes */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notes</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={editData.notes}
                  onChangeText={text => setEditData(prev => ({ ...prev, notes: text }))}
                  placeholder="Additional notes..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <LinearGradient colors={['#7C3AED', '#A855F7']} style={styles.saveButtonGradient}>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>
                  {editMode === 'add' ? 'Add Product' : 'Save Changes'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* FAB for adding new product */}
      <View style={[styles.fabContainer, Platform.OS === 'web' && { position: 'fixed' as any }]}>
        <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={handleAddNew}>
          <LinearGradient colors={['#7C3AED', '#A855F7']} style={styles.fabGradient}>
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  categoriesContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  card: {
    width: (width - 36) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImageContainer: {
    height: 120,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContent: {
    padding: 12,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  cardMetaText: {
    fontSize: 11,
    color: '#64748B',
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7C3AED',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Detail Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  detailModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  detailHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  detailAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailImage: {
    width: '100%',
    height: 200,
  },
  detailImagePlaceholder: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailInfo: {
    padding: 20,
  },
  detailCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 12,
  },
  detailCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  detailDescription: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
    marginBottom: 12,
  },
  detailPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: '#7C3AED',
    marginBottom: 20,
  },
  detailsList: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  detailItemContent: {
    flex: 1,
  },
  detailItemLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  detailItemValue: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },
  detailLink: {
    color: '#3B82F6',
  },
  viewProductButton: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  viewProductGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  viewProductText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Edit Modal
  editModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  editForm: {
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#0F172A',
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryPickerItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // FAB
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    zIndex: 999,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
