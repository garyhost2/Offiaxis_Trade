import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, StatusBar, Dimensions, TextInput, Modal, KeyboardAvoidingView, Platform, Alert, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { 
  getAllProjects, 
  getAllPortfolios, 
  createPortfolio, 
  PortfolioPhoto,
  getAllMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  toggleMaterialFavorite,
  MaterialProduct
} from '../utils/projectsData';
import * as ImagePicker from 'expo-image-picker';
import { useActivity } from '../contexts/ActivityContext';

const { width } = Dimensions.get('window');
const imageSize = (width - 48) / 2; // 2 columns with padding
const MAX_IMAGES = 10;

// Materials Categories - Initial defaults (without "Other")
const DEFAULT_MATERIAL_CATEGORIES = [
  { id: 'all', label: 'All', icon: 'grid-outline', color: '#6366F1', isSystem: true },
  { id: 'electrical', label: 'Electrical', icon: 'flash-outline', color: '#F59E0B', isSystem: false },
  { id: 'plumbing', label: 'Plumbing', icon: 'water-outline', color: '#3B82F6', isSystem: false },
  { id: 'fixtures', label: 'Fixtures', icon: 'bulb-outline', color: '#10B981', isSystem: false },
  { id: 'hardware', label: 'Hardware', icon: 'construct-outline', color: '#8B5CF6', isSystem: false },
];

// Available icons for category selection
const CATEGORY_ICONS = [
  'flash-outline', 'water-outline', 'bulb-outline', 'construct-outline', 'cube-outline',
  'home-outline', 'car-outline', 'hammer-outline', 'build-outline', 'cog-outline',
  'layers-outline', 'filing-outline', 'briefcase-outline', 'basket-outline', 'pricetag-outline',
  'leaf-outline', 'thermometer-outline', 'wifi-outline', 'shield-outline', 'document-outline',
];

// Available colors for category selection
const CATEGORY_COLORS = [
  '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444',
  '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#84CC16',
];

// These will be replaced by functions that use state
let materialCategoriesRef: typeof DEFAULT_MATERIAL_CATEGORIES = DEFAULT_MATERIAL_CATEGORIES;

const getCategoryColor = (category: string): string => {
  const cat = materialCategoriesRef.find(c => c.id === category);
  return cat?.color || '#6366F1';
};

const getCategoryIcon = (category: string): string => {
  const cat = materialCategoriesRef.find(c => c.id === category);
  return cat?.icon || 'cube-outline';
};

// Generate status-based color for placeholder images
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    'Rough-In': '3B82F6',
    'Inspection': 'A855F7',
    'Final Trim': '10B981',
    'Completed': '64748B',
    'Service Call': 'EF4444',
    'To be scheduled': '94A3B8',
  };
  return colorMap[status] || '6366F1';
};

export default function GalleryPage() {
  const router = useRouter();
  const { logActivity } = useActivity();
  
  // Convert projects to gallery items
  const [allImages, setAllImages] = useState<any[]>([]);
  
  // Image mapping based on project description
  const getProjectImage = (description: string): string => {
    const imageMap: { [key: string]: string } = {
      'Kitchen Remodel': 'https://images.unsplash.com/photo-1682888813913-e13f18692019?w=800',
      'Bathroom Remodel': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800',
      'Full Home Renovation': 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=800',
      'Basement Finish or Remodel': 'https://images.unsplash.com/photo-1646592474103-cfd22d1d9e34?w=800',
      'Garage Conversion or Build': 'https://images.pexels.com/photos/8550365/pexels-photo-8550365.jpeg?w=800',
      'Living Room Remodel': 'https://images.unsplash.com/photo-1759238136859-b6fe007fe126?w=800',
      'Bedroom Remodel': 'https://images.unsplash.com/photo-1646592492037-a2a678ecd31a?w=800',
      'Attic Finish or Conversion': 'https://images.pexels.com/photos/8082321/pexels-photo-8082321.jpeg?w=800',
      'Laundry Room Remodel': 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?w=800',
      'Open-Concept Layout Modification': 'https://images.unsplash.com/photo-1699852676054-a55370ac4c7a?w=800',
      'Bedroom Addition': 'https://images.unsplash.com/photo-1719381502987-058c2140df08?w=800',
      'Bathroom Addition': 'https://images.unsplash.com/photo-1629079447777-1e605162dc8d?w=800',
      'Second-Level Addition': 'https://images.unsplash.com/photo-1701518035336-a19a649e0c3d?w=800',
      'Sunroom or Enclosed Patio Addition': 'https://images.unsplash.com/photo-1635108199502-89593581ae96?w=800',
      'Garage Addition or Expansion': 'https://images.unsplash.com/photo-1715513008829-2eb86b787ffa?w=800',
      'In-Law Suite / ADU Construction': 'https://images.unsplash.com/photo-1661619870331-861133b1e0f2?w=800',
      'Deck or Patio Build': 'https://images.unsplash.com/photo-1679797850019-3d0d8659a695?w=800',
      'Roof Replacement or Upgrade': 'https://images.unsplash.com/photo-1755114203680-d39d95efa82c?w=800',
      'Window & Door Replacement Project': 'https://images.unsplash.com/photo-1726041452947-c91302d15c4c?w=800',
      'Foundation or Structural Repair Project': 'https://images.unsplash.com/photo-1638207849658-e57be0cdc208?w=800',
    };
    
    return imageMap[description] || 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=800';
  };

  // Load projects data whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const projects = getAllProjects();
      
      // Transform projects into gallery items
      const galleryItems = projects.map((project) => {
        const description = project.galleryDescription || '';
        // Use profileImageUrl if set, otherwise fall back to default based on description
        const imageUrl = project.profileImageUrl || getProjectImage(description);
        
        return {
          id: project.id,
          projectName: project.name,
          street: project.street,
          city: project.city,
          description: description,
          imageUrl: imageUrl,
          date: project.roughInStart || project.inspectionDate || project.finalTrimStart || project.completedDate || '2025-01-01',
          category: 'gallery', // All projects in "All Projects Gallery"
          status: project.status,
        };
      });
      
      // Get real portfolios from the store
      const portfolios = getAllPortfolios();
      const portfolioItems = portfolios.map(portfolio => ({
        id: portfolio.id,
        projectName: portfolio.title,
        street: portfolio.description || '',
        city: `${portfolio.photos.length} photo${portfolio.photos.length !== 1 ? 's' : ''}`,
        imageUrl: portfolio.coverImageUrl || 'https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=Portfolio',
        date: portfolio.updatedAt,
        category: 'portfolio' as const,
      }));
      
      setAllImages([...galleryItems, ...portfolioItems]);
      
      // Load materials
      const allMaterials = getAllMaterials();
      setMaterials(allMaterials);
    }, [])
  );
  
  // Get tab parameter from URL
  const params = useLocalSearchParams();
  const initialTab = params.tab as string;
  
  const [activeFilter, setActiveFilter] = useState(initialTab === 'portfolio' ? 'portfolio' : 'gallery');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Update activeFilter when URL param changes
  useEffect(() => {
    if (initialTab === 'portfolio') {
      setActiveFilter('portfolio');
    }
  }, [initialTab]);
  
  // Create Portfolio Modal state
  const [showCreatePortfolioModal, setShowCreatePortfolioModal] = useState(false);
  const [newPortfolioTitle, setNewPortfolioTitle] = useState('');
  const [newPortfolioDescription, setNewPortfolioDescription] = useState('');
  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  
  // Materials state
  const [materials, setMaterials] = useState<MaterialProduct[]>([]);
  const [selectedMaterialCategory, setSelectedMaterialCategory] = useState('all');
  const [showMaterialDetailModal, setShowMaterialDetailModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialProduct | null>(null);
  const [showMaterialEditModal, setShowMaterialEditModal] = useState(false);
  const [materialEditMode, setMaterialEditMode] = useState<'add' | 'edit'>('add');
  const [materialEditData, setMaterialEditData] = useState<Partial<MaterialProduct>>({});
  
  // Category Management State
  const [materialCategories, setMaterialCategories] = useState(DEFAULT_MATERIAL_CATEGORIES);
  const [showCategoryActionModal, setShowCategoryActionModal] = useState(false);
  const [selectedCategoryForAction, setSelectedCategoryForAction] = useState<typeof DEFAULT_MATERIAL_CATEGORIES[0] | null>(null);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryColor, setEditCategoryColor] = useState('#F59E0B');
  const [editCategoryIcon, setEditCategoryIcon] = useState('cube-outline');
  
  // Material Search State
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  
  // Update the ref when state changes
  useEffect(() => {
    materialCategoriesRef = materialCategories;
  }, [materialCategories]);
  
  // Separate view modes for each tab
  const [viewModes, setViewModes] = useState<{
    gallery: 'list' | 'small' | 'medium' | 'large';
    materials: 'list' | 'small' | 'medium' | 'large';
    portfolio: 'list' | 'small' | 'medium' | 'large';
  }>({
    gallery: 'large',
    materials: 'large',
    portfolio: 'large',
  });
  
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  
  // Get current tab's view mode
  const currentViewMode = viewModes[activeFilter as keyof typeof viewModes];
  
  // Update view mode for current tab only
  const setCurrentViewMode = (mode: 'list' | 'small' | 'medium' | 'large') => {
    setViewModes(prev => ({
      ...prev,
      [activeFilter]: mode
    }));
  };
  
  // Pick images from gallery
  const handlePickImages = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to add images.');
        return;
      }
      
      // Calculate how many more images can be selected
      const remainingSlots = MAX_IMAGES - selectedImages.length;
      
      if (remainingSlots <= 0) {
        Alert.alert('Limit Reached', `You can only add up to ${MAX_IMAGES} images.`);
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 0.8,
        aspect: [4, 3],
      });
      
      if (!result.canceled && result.assets) {
        setSelectedImages(prev => [...prev, ...result.assets].slice(0, MAX_IMAGES));
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
    }
  };
  
  // Remove a selected image
  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle create new portfolio
  const handleCreateNewPortfolio = () => {
    if (!newPortfolioTitle.trim()) return;
    
    // Convert selected images to PortfolioPhoto format
    const portfolioPhotos: PortfolioPhoto[] = selectedImages.map((img, index) => ({
      id: `new-photo-${Date.now()}-${index}`,
      url: img.uri,
      timestamp: new Date().toISOString(),
      title: `Photo ${index + 1}`,
    }));
    
    const newPortfolio = createPortfolio(
      newPortfolioTitle.trim(),
      newPortfolioDescription.trim() || undefined,
      portfolioPhotos
    );
    
    // Add new portfolio to allImages
    const newPortfolioItem = {
      id: newPortfolio.id,
      projectName: newPortfolio.title,
      street: newPortfolio.description || '',
      city: `${newPortfolio.photos.length} photo${newPortfolio.photos.length !== 1 ? 's' : ''}`,
      imageUrl: newPortfolio.coverImageUrl || (selectedImages.length > 0 ? selectedImages[0].uri : 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=New+Portfolio'),
      date: newPortfolio.updatedAt,
      category: 'portfolio' as const,
    };
    
    setAllImages(prev => [...prev, newPortfolioItem]);
    
    // Log activity
    logActivity({
      type: 'portfolio',
      action: 'created',
      description: `created new portfolio folder "${newPortfolioTitle.trim()}"`,
      userName: 'Yefry Soto',
      userInitials: 'YS',
      metadata: { portfolioTitle: newPortfolioTitle.trim(), photoCount: selectedImages.length }
    });
    
    // Reset and close modal
    setNewPortfolioTitle('');
    setNewPortfolioDescription('');
    setSelectedImages([]);
    setShowCreatePortfolioModal(false);
    
    // Navigate to the new portfolio
    router.push({
      pathname: '/portfolio-photos',
      params: { id: newPortfolio.id },
    });
  };
  
  // Reset modal state when closing
  const handleCloseModal = () => {
    setShowCreatePortfolioModal(false);
    setNewPortfolioTitle('');
    setNewPortfolioDescription('');
    setSelectedImages([]);
  };
  
  // ==========================================
  // Materials Functions
  // ==========================================
  
  // Filter materials by category and search
  const filteredMaterials = materials.filter(m => {
    const matchesCategory = selectedMaterialCategory === 'all' || m.category === selectedMaterialCategory;
    const matchesSearch = materialSearchQuery === '' || 
      m.name.toLowerCase().includes(materialSearchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(materialSearchQuery.toLowerCase()) ||
      m.brand?.toLowerCase().includes(materialSearchQuery.toLowerCase()) ||
      m.model?.toLowerCase().includes(materialSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Open material detail modal
  const handleOpenMaterialDetail = (material: MaterialProduct) => {
    setSelectedMaterial(material);
    setShowMaterialDetailModal(true);
  };

  // Open add material modal
  const handleAddMaterial = () => {
    setMaterialEditMode('add');
    setMaterialEditData({
      name: '',
      description: '',
      category: 'electrical',
      isFavorite: false,
    });
    setShowMaterialEditModal(true);
  };

  // Open edit material modal
  const handleEditMaterial = () => {
    if (selectedMaterial) {
      setMaterialEditMode('edit');
      setMaterialEditData({ ...selectedMaterial });
      setShowMaterialDetailModal(false);
      setShowMaterialEditModal(true);
    }
  };

  // Save material
  const handleSaveMaterial = () => {
    if (!materialEditData.name?.trim()) {
      Alert.alert('Required', 'Please enter a product name.');
      return;
    }

    if (materialEditMode === 'add') {
      const newMaterial = createMaterial({
        name: materialEditData.name.trim(),
        description: materialEditData.description?.trim() || '',
        category: materialEditData.category as MaterialProduct['category'] || 'other',
        imageUrl: materialEditData.imageUrl,
        url: materialEditData.url,
        purchaseLocation: materialEditData.purchaseLocation,
        brand: materialEditData.brand,
        modelNumber: materialEditData.modelNumber,
        price: materialEditData.price,
        notes: materialEditData.notes,
        isFavorite: materialEditData.isFavorite || false,
      });
      setMaterials(prev => [...prev, newMaterial]);
      Alert.alert('Success', 'Product added successfully!');
    } else if (selectedMaterial) {
      const updated = updateMaterial(selectedMaterial.id, materialEditData);
      if (updated) {
        setMaterials(prev => prev.map(m => m.id === updated.id ? updated : m));
        Alert.alert('Success', 'Product updated successfully!');
      }
    }

    setShowMaterialEditModal(false);
    setMaterialEditData({});
  };

  // Delete material
  const handleDeleteMaterial = () => {
    if (!selectedMaterial) return;
    
    const message = `Are you sure you want to delete "${selectedMaterial.name}"?`;

    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        deleteMaterial(selectedMaterial.id);
        setMaterials(prev => prev.filter(m => m.id !== selectedMaterial.id));
        setShowMaterialDetailModal(false);
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
            setShowMaterialDetailModal(false);
            setSelectedMaterial(null);
          }
        },
      ]);
    }
  };

  // Toggle material favorite
  const handleToggleMaterialFavorite = (id: string) => {
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
  
  // Category Management Functions
  const handleCategoryLongPress = (category: typeof DEFAULT_MATERIAL_CATEGORIES[0]) => {
    if (category.isSystem) return; // Don't allow editing "All" category
    setSelectedCategoryForAction(category);
    setShowCategoryActionModal(true);
  };
  
  const handleRenameCategory = () => {
    if (!selectedCategoryForAction) return;
    setEditCategoryName(selectedCategoryForAction.label);
    setEditCategoryColor(selectedCategoryForAction.color);
    setEditCategoryIcon(selectedCategoryForAction.icon);
    setShowCategoryActionModal(false);
    setShowEditCategoryModal(true);
  };
  
  const handleDeleteCategory = () => {
    if (!selectedCategoryForAction) return;
    
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${selectedCategoryForAction.label}"? Products in this category will not be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setMaterialCategories(prev => prev.filter(c => c.id !== selectedCategoryForAction.id));
            if (selectedMaterialCategory === selectedCategoryForAction.id) {
              setSelectedMaterialCategory('all');
            }
            setShowCategoryActionModal(false);
            setSelectedCategoryForAction(null);
          }
        }
      ]
    );
  };
  
  const handleSaveEditCategory = () => {
    if (!selectedCategoryForAction || !editCategoryName.trim()) {
      Alert.alert('Error', 'Category name is required');
      return;
    }
    
    setMaterialCategories(prev => prev.map(c => 
      c.id === selectedCategoryForAction.id 
        ? { ...c, label: editCategoryName.trim(), color: editCategoryColor, icon: editCategoryIcon }
        : c
    ));
    
    setShowEditCategoryModal(false);
    setSelectedCategoryForAction(null);
  };
  
  const handleAddCategory = () => {
    setEditCategoryName('');
    setEditCategoryColor(CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)]);
    setEditCategoryIcon(CATEGORY_ICONS[Math.floor(Math.random() * CATEGORY_ICONS.length)]);
    setShowAddCategoryModal(true);
  };
  
  const handleSaveNewCategory = () => {
    if (!editCategoryName.trim()) {
      Alert.alert('Error', 'Category name is required');
      return;
    }
    
    const newId = editCategoryName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    const newCategory = {
      id: newId,
      label: editCategoryName.trim(),
      icon: editCategoryIcon,
      color: editCategoryColor,
      isSystem: false,
    };
    
    setMaterialCategories(prev => [...prev, newCategory]);
    setShowAddCategoryModal(false);
    Alert.alert('Success', `Category "${editCategoryName}" created!`);
  };
  
  // Calculate grid size based on current tab's view mode
  const getGridColumns = () => {
    switch (currentViewMode) {
      case 'small': return 5;
      case 'medium': return 3;
      case 'large': return 2;
      default: return 2;
    }
  };
  
  const gridColumns = getGridColumns();
  const gridImageSize = (width - 16 * (gridColumns + 1)) / gridColumns;
  
  // Filter images based on active category and search
  const filteredImages = allImages.filter(image => {
    const matchesCategory = image.category === activeFilter;
    const matchesSearch = searchQuery === '' || 
      image.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.street.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (image.description && image.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={['#4F46E5', '#6366F1']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Project Gallery</Text>
            <Text style={styles.headerSubtitle}>Photos from all projects</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filter Boxes - Outside ScrollView */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterBox, activeFilter === 'gallery' && styles.filterBoxActive]}
          onPress={() => setActiveFilter('gallery')}
        >
          <Text style={[styles.filterText, activeFilter === 'gallery' && styles.filterTextActive]}>
            All Projects Gallery
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterBox, activeFilter === 'materials' && styles.filterBoxActive]}
          onPress={() => setActiveFilter('materials')}
        >
          <Text style={[styles.filterText, activeFilter === 'materials' && styles.filterTextActive]}>
            Materials & Products
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterBox, activeFilter === 'portfolio' && styles.filterBoxActive]}
          onPress={() => setActiveFilter('portfolio')}
        >
          <Text style={[styles.filterText, activeFilter === 'portfolio' && styles.filterTextActive]}>
            Portfolio
          </Text>
        </TouchableOpacity>
      </View>

      {/* Gallery/Portfolio Content - only show when NOT on materials tab */}
      {activeFilter !== 'materials' && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Search Bar and View Button */}
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color="#64748B" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
              placeholder="Search by name or address..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* View Dropdown Button */}
          <View style={styles.viewButtonContainer}>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => setShowViewDropdown(!showViewDropdown)}
            >
              <Ionicons name="grid-outline" size={20} color="#4F46E5" />
              <Text style={styles.viewButtonText}>View</Text>
              <Ionicons name={showViewDropdown ? "chevron-up" : "chevron-down"} size={16} color="#4F46E5" />
            </TouchableOpacity>
            
            {/* View Dropdown Menu */}
            {showViewDropdown && (
              <View style={styles.viewDropdown}>
                <TouchableOpacity
                  style={[styles.viewDropdownItem, currentViewMode === 'list' && styles.viewDropdownItemActive]}
                  onPress={() => {
                    setCurrentViewMode('list');
                    setShowViewDropdown(false);
                  }}
                >
                  <Ionicons name="list-outline" size={18} color={currentViewMode === 'list' ? '#4F46E5' : '#64748B'} />
                  <Text style={[styles.viewDropdownText, currentViewMode === 'list' && styles.viewDropdownTextActive]}>
                    List
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.viewDropdownItem, currentViewMode === 'small' && styles.viewDropdownItemActive]}
                  onPress={() => {
                    setCurrentViewMode('small');
                    setShowViewDropdown(false);
                  }}
                >
                  <Ionicons name="grid-outline" size={18} color={currentViewMode === 'small' ? '#4F46E5' : '#64748B'} />
                  <Text style={[styles.viewDropdownText, currentViewMode === 'small' && styles.viewDropdownTextActive]}>
                    Grid (Small)
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.viewDropdownItem, currentViewMode === 'medium' && styles.viewDropdownItemActive]}
                  onPress={() => {
                    setCurrentViewMode('medium');
                    setShowViewDropdown(false);
                  }}
                >
                  <Ionicons name="apps-outline" size={18} color={currentViewMode === 'medium' ? '#4F46E5' : '#64748B'} />
                  <Text style={[styles.viewDropdownText, currentViewMode === 'medium' && styles.viewDropdownTextActive]}>
                    Grid (Medium)
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.viewDropdownItem, currentViewMode === 'large' && styles.viewDropdownItemActive]}
                  onPress={() => {
                    setCurrentViewMode('large');
                    setShowViewDropdown(false);
                  }}
                >
                  <Ionicons name="square-outline" size={18} color={currentViewMode === 'large' ? '#4F46E5' : '#64748B'} />
                  <Text style={[styles.viewDropdownText, currentViewMode === 'large' && styles.viewDropdownTextActive]}>
                    Grid (Large)
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Gallery Content - List or Grid */}
        {currentViewMode === 'list' ? (
          // List View
          <View style={styles.listContainer}>
            {filteredImages.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.listItem, 
                  activeFilter === 'portfolio' && styles.listItemPortfolio
                ]}
                activeOpacity={0.8}
                onPress={() => {
                      // Navigate to project gallery folders
                      if (activeFilter === 'gallery') {
                        router.push({
                          pathname: '/project-gallery',
                          params: {
                            id: item.id,
                            name: item.projectName,
                          },
                        });
                      } else if (activeFilter === 'portfolio') {
                        // Navigate to portfolio photos
                        router.push({
                          pathname: '/portfolio-photos',
                          params: {
                            id: item.id,
                          },
                        });
                      }
                    }}
                  >
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.listImage}
                      resizeMode="cover"
                    />
                <View style={styles.listInfo}>
                  <Text style={[
                    styles.listProjectName,
                    activeFilter === 'portfolio' && styles.listProjectNamePortfolio
                  ]} numberOfLines={1}>
                    {item.projectName}
                  </Text>
                  <Text style={styles.listStreet} numberOfLines={1}>
                    {item.street}
                  </Text>
                  <Text style={[
                    styles.listCity,
                    activeFilter === 'portfolio' && styles.listCityPortfolio
                  ]} numberOfLines={1}>
                    {item.city}
                  </Text>
                  {item.description ? (
                    <Text style={styles.listDescription} numberOfLines={1}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={20} color={activeFilter === 'portfolio' ? '#3B82F6' : '#CBD5E1'} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          // Grid View
          <View style={styles.galleryGrid}>
            {filteredImages.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.galleryItem, { width: gridImageSize, height: gridImageSize }]}
                activeOpacity={0.8}
                onPress={() => {
                  // Navigate to project gallery folders
                  if (activeFilter === 'gallery') {
                    router.push({
                      pathname: '/project-gallery',
                      params: {
                        id: item.id,
                        name: item.projectName,
                      },
                    });
                  } else if (activeFilter === 'portfolio') {
                    // Navigate to portfolio photos
                    router.push({
                      pathname: '/portfolio-photos',
                      params: {
                        id: item.id,
                      },
                    });
                  }
                }}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.galleryImage}
                  resizeMode="cover"
                />
                {/* Blue metallic overlay for portfolios, purple for others */}
                {activeFilter === 'portfolio' ? (
                  <LinearGradient
                    colors={['rgba(30, 58, 138, 0.85)', 'rgba(59, 130, 246, 0.9)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.galleryOverlay}
                  >
                    <View style={styles.galleryInfo}>
                      <Text style={styles.galleryProjectName} numberOfLines={1}>
                        {item.projectName}
                      </Text>
                      {currentViewMode !== 'small' && (
                        <>
                          <Text style={styles.galleryStreet} numberOfLines={1}>
                            {item.street}
                          </Text>
                          <Text style={styles.galleryCity} numberOfLines={1}>
                            {item.city}
                          </Text>
                        </>
                      )}
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={styles.galleryOverlay}>
                    <View style={styles.galleryInfo}>
                      <Text style={styles.galleryProjectName} numberOfLines={1}>
                        {item.projectName}
                      </Text>
                      {currentViewMode !== 'small' && (
                        <>
                          <Text style={styles.galleryStreet} numberOfLines={1}>
                            {item.street}
                          </Text>
                          <Text style={styles.galleryCity} numberOfLines={1}>
                            {item.city}
                          </Text>
                          {item.description ? (
                            <Text style={styles.galleryDescription} numberOfLines={1}>
                              {item.description}
                            </Text>
                          ) : null}
                        </>
                      )}
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty State if no images - only for gallery/portfolio */}
        {filteredImages.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'No results found' : 'No photos in this category'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Try a different search term' : 'Photos will appear here once added'}
            </Text>
          </View>
        )}
      </ScrollView>
      )}

      {/* ==========================================
          Materials Tab Content
          ========================================== */}
      {activeFilter === 'materials' && (
        <>
          {/* Materials Category Tabs */}
          <View style={styles.materialCategoriesContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.materialCategoriesScroll}
            >
              {materialCategories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.materialCategoryTab,
                    selectedMaterialCategory === cat.id && { backgroundColor: cat.color }
                  ]}
                  onPress={() => setSelectedMaterialCategory(cat.id)}
                  onLongPress={() => handleCategoryLongPress(cat)}
                  delayLongPress={500}
                >
                  <Ionicons 
                    name={cat.icon as any} 
                    size={16} 
                    color={selectedMaterialCategory === cat.id ? '#FFFFFF' : cat.color} 
                  />
                  <Text style={[
                    styles.materialCategoryText,
                    selectedMaterialCategory === cat.id && styles.materialCategoryTextActive
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
              
              {/* Add Category Button */}
              <TouchableOpacity
                style={styles.addCategoryTab}
                onPress={handleAddCategory}
              >
                <Ionicons name="add" size={18} color="#A855F7" />
                <Text style={styles.addCategoryText}>Add</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
          
          {/* Quick Search Bar */}
          <View style={styles.materialSearchContainer}>
            <View style={styles.materialSearchBar}>
              <Ionicons name="search-outline" size={20} color="#94A3B8" />
              <TextInput
                style={styles.materialSearchInput}
                placeholder="Search materials, products, brands..."
                placeholderTextColor="#94A3B8"
                value={materialSearchQuery}
                onChangeText={setMaterialSearchQuery}
              />
              {materialSearchQuery !== '' && (
                <TouchableOpacity onPress={() => setMaterialSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
            {materialSearchQuery !== '' && (
              <Text style={styles.materialSearchResults}>
                {filteredMaterials.length} result{filteredMaterials.length !== 1 ? 's' : ''} found
              </Text>
            )}
          </View>

          {/* Materials Grid */}
          <ScrollView style={styles.materialsScrollView} showsVerticalScrollIndicator={false}>
            {filteredMaterials.length === 0 ? (
              <View style={styles.materialsEmptyState}>
                <View style={styles.materialsEmptyIcon}>
                  <Ionicons name={materialSearchQuery ? 'search-outline' : 'cube-outline'} size={48} color="#A855F7" />
                </View>
                <Text style={styles.materialsEmptyTitle}>
                  {materialSearchQuery ? 'No Results Found' : 'No Products Found'}
                </Text>
                <Text style={styles.materialsEmptySubtitle}>
                  {materialSearchQuery 
                    ? `No products match "${materialSearchQuery}"` 
                    : 'Add your first product to get started'}
                </Text>
                {materialSearchQuery ? (
                  <TouchableOpacity 
                    style={[styles.materialsEmptyButton, { backgroundColor: '#64748B' }]} 
                    onPress={() => setMaterialSearchQuery('')}
                  >
                    <Ionicons name="close" size={20} color="#FFFFFF" />
                    <Text style={styles.materialsEmptyButtonText}>Clear Search</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.materialsEmptyButton} onPress={handleAddMaterial}>
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                    <Text style={styles.materialsEmptyButtonText}>Add Product</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.materialsGrid}>
                {filteredMaterials.map(material => (
                  <TouchableOpacity
                    key={material.id}
                    style={styles.materialCard}
                    activeOpacity={0.8}
                    onPress={() => handleOpenMaterialDetail(material)}
                  >
                    {/* Card Image */}
                    <View style={styles.materialCardImageContainer}>
                      {material.imageUrl ? (
                        <Image 
                          source={{ uri: material.imageUrl }} 
                          style={styles.materialCardImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.materialCardImagePlaceholder, { backgroundColor: getCategoryColor(material.category) + '20' }]}>
                          <Ionicons 
                            name={getCategoryIcon(material.category) as any} 
                            size={36} 
                            color={getCategoryColor(material.category)} 
                          />
                        </View>
                      )}
                      
                      {/* Category Badge */}
                      <View style={[styles.materialCategoryBadge, { backgroundColor: getCategoryColor(material.category) }]}>
                        <Ionicons name={getCategoryIcon(material.category) as any} size={12} color="#FFFFFF" />
                      </View>
                      
                      {/* Favorite Badge */}
                      {material.isFavorite && (
                        <View style={styles.materialFavoriteBadge}>
                          <Ionicons name="heart" size={14} color="#EF4444" />
                        </View>
                      )}
                    </View>
                    
                    {/* Card Content */}
                    <View style={styles.materialCardContent}>
                      <Text style={styles.materialCardName} numberOfLines={1}>{material.name}</Text>
                      <Text style={styles.materialCardDescription} numberOfLines={2}>{material.description}</Text>
                      
                      {material.brand && (
                        <View style={styles.materialCardMeta}>
                          <Ionicons name="business-outline" size={11} color="#64748B" />
                          <Text style={styles.materialCardMetaText}>{material.brand}</Text>
                        </View>
                      )}
                      
                      {material.price && (
                        <Text style={styles.materialCardPrice}>{material.price}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            <View style={{ height: 100 }} />
          </ScrollView>
        </>
      )}

      {/* FAB for creating new portfolio - only show on Portfolio tab */}
      {activeFilter === 'portfolio' && (
        <View style={[styles.fabContainer, Platform.OS === 'web' && { position: 'fixed' as any }]}>
          <TouchableOpacity
            style={styles.fab}
            activeOpacity={0.8}
            onPress={() => setShowCreatePortfolioModal(true)}
          >
            <LinearGradient
              colors={['#1E3A8A', '#3B82F6']}
              style={styles.fabGradient}
            >
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* FAB for adding new material - only show on Materials tab */}
      {activeFilter === 'materials' && (
        <View style={[styles.fabContainer, Platform.OS === 'web' && { position: 'fixed' as any }]}>
          <TouchableOpacity
            style={styles.fab}
            activeOpacity={0.8}
            onPress={handleAddMaterial}
          >
            <LinearGradient
              colors={['#7C3AED', '#A855F7']}
              style={styles.fabGradient}
            >
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Create Portfolio Modal */}
      <Modal visible={showCreatePortfolioModal} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Portfolio</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Title *</Text>
                <TextInput
                  style={styles.formInput}
                  value={newPortfolioTitle}
                  onChangeText={setNewPortfolioTitle}
                  placeholder="e.g., Modern Kitchen Designs"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={newPortfolioDescription}
                  onChangeText={setNewPortfolioDescription}
                  placeholder="Add a description for this portfolio..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                />
              </View>
              
              {/* Image Picker Section */}
              <View style={styles.formGroup}>
                <View style={styles.imagePickerHeader}>
                  <Text style={styles.formLabel}>Add Photos (Optional)</Text>
                  <Text style={styles.imageCountLabel}>{selectedImages.length}/{MAX_IMAGES}</Text>
                </View>
                
                {/* Add Photos Button */}
                <TouchableOpacity 
                  style={styles.addPhotosButton}
                  onPress={handlePickImages}
                  disabled={selectedImages.length >= MAX_IMAGES}
                >
                  <LinearGradient
                    colors={selectedImages.length >= MAX_IMAGES ? ['#E2E8F0', '#CBD5E1'] : ['#EFF6FF', '#DBEAFE']}
                    style={styles.addPhotosGradient}
                  >
                    <Ionicons 
                      name="images-outline" 
                      size={24} 
                      color={selectedImages.length >= MAX_IMAGES ? '#94A3B8' : '#3B82F6'} 
                    />
                    <Text style={[
                      styles.addPhotosText,
                      selectedImages.length >= MAX_IMAGES && styles.addPhotosTextDisabled
                    ]}>
                      {selectedImages.length === 0 
                        ? 'Select from Gallery' 
                        : selectedImages.length >= MAX_IMAGES 
                          ? 'Maximum photos reached' 
                          : 'Add more photos'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                {/* Selected Images Preview */}
                {selectedImages.length > 0 && (
                  <View style={styles.selectedImagesContainer}>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.selectedImagesScroll}
                    >
                      {selectedImages.map((image, index) => (
                        <View key={`${image.uri}-${index}`} style={styles.selectedImageWrapper}>
                          <Image 
                            source={{ uri: image.uri }} 
                            style={styles.selectedImageThumb} 
                          />
                          <TouchableOpacity 
                            style={styles.removeImageButton}
                            onPress={() => handleRemoveImage(index)}
                          >
                            <Ionicons name="close-circle" size={22} color="#EF4444" />
                          </TouchableOpacity>
                          {index === 0 && (
                            <View style={styles.coverBadge}>
                              <Text style={styles.coverBadgeText}>Cover</Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
              
              <View style={styles.photoCountInfo}>
                <Ionicons name="images-outline" size={18} color="#3B82F6" />
                <Text style={styles.photoCountText}>
                  {selectedImages.length} photo{selectedImages.length !== 1 ? 's' : ''} will be added
                </Text>
              </View>
            </ScrollView>
            
            <TouchableOpacity 
              style={[styles.createButton, !newPortfolioTitle.trim() && styles.createButtonDisabled]}
              onPress={handleCreateNewPortfolio}
              disabled={!newPortfolioTitle.trim()}
            >
              <LinearGradient 
                colors={newPortfolioTitle.trim() ? ['#1E3A8A', '#3B82F6'] : ['#CBD5E1', '#E2E8F0']}
                style={styles.createButtonGradient}
              >
                <Ionicons name="folder-open" size={20} color="#FFFFFF" />
                <Text style={styles.createButtonText}>Create Portfolio</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ==========================================
          Materials Detail Modal
          ========================================== */}
      <Modal visible={showMaterialDetailModal} transparent animationType="slide">
        <View style={styles.materialModalOverlay}>
          <View style={styles.materialDetailModalContent}>
            {selectedMaterial && (
              <>
                {/* Modal Header */}
                <View style={styles.materialDetailHeader}>
                  <TouchableOpacity onPress={() => setShowMaterialDetailModal(false)}>
                    <Ionicons name="close" size={24} color="#64748B" />
                  </TouchableOpacity>
                  <View style={styles.materialDetailHeaderActions}>
                    <TouchableOpacity 
                      style={styles.materialDetailAction}
                      onPress={() => handleToggleMaterialFavorite(selectedMaterial.id)}
                    >
                      <Ionicons 
                        name={selectedMaterial.isFavorite ? "heart" : "heart-outline"} 
                        size={24} 
                        color={selectedMaterial.isFavorite ? "#EF4444" : "#64748B"} 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.materialDetailAction} onPress={handleEditMaterial}>
                      <Ionicons name="create-outline" size={24} color="#64748B" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.materialDetailAction} onPress={handleDeleteMaterial}>
                      <Ionicons name="trash-outline" size={24} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Product Image */}
                  {selectedMaterial.imageUrl ? (
                    <Image 
                      source={{ uri: selectedMaterial.imageUrl }} 
                      style={styles.materialDetailImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.materialDetailImagePlaceholder, { backgroundColor: getCategoryColor(selectedMaterial.category) + '20' }]}>
                      <Ionicons 
                        name={getCategoryIcon(selectedMaterial.category) as any} 
                        size={64} 
                        color={getCategoryColor(selectedMaterial.category)} 
                      />
                    </View>
                  )}

                  {/* Product Info */}
                  <View style={styles.materialDetailInfo}>
                    <View style={[styles.materialDetailCategoryBadge, { backgroundColor: getCategoryColor(selectedMaterial.category) }]}>
                      <Ionicons name={getCategoryIcon(selectedMaterial.category) as any} size={14} color="#FFFFFF" />
                      <Text style={styles.materialDetailCategoryText}>
                        {materialCategories.find(c => c.id === selectedMaterial.category)?.label || selectedMaterial.category}
                      </Text>
                    </View>

                    <Text style={styles.materialDetailName}>{selectedMaterial.name}</Text>
                    <Text style={styles.materialDetailDescription}>{selectedMaterial.description}</Text>

                    {selectedMaterial.price && (
                      <Text style={styles.materialDetailPrice}>{selectedMaterial.price}</Text>
                    )}

                    {/* Details List */}
                    <View style={styles.materialDetailsList}>
                      {selectedMaterial.brand && (
                        <View style={styles.materialDetailItem}>
                          <Ionicons name="business-outline" size={20} color="#7C3AED" />
                          <View style={styles.materialDetailItemContent}>
                            <Text style={styles.materialDetailItemLabel}>Brand</Text>
                            <Text style={styles.materialDetailItemValue}>{selectedMaterial.brand}</Text>
                          </View>
                        </View>
                      )}

                      {selectedMaterial.modelNumber && (
                        <View style={styles.materialDetailItem}>
                          <Ionicons name="barcode-outline" size={20} color="#7C3AED" />
                          <View style={styles.materialDetailItemContent}>
                            <Text style={styles.materialDetailItemLabel}>Model Number</Text>
                            <Text style={styles.materialDetailItemValue}>{selectedMaterial.modelNumber}</Text>
                          </View>
                        </View>
                      )}

                      {selectedMaterial.purchaseLocation && (
                        <View style={styles.materialDetailItem}>
                          <Ionicons name="storefront-outline" size={20} color="#7C3AED" />
                          <View style={styles.materialDetailItemContent}>
                            <Text style={styles.materialDetailItemLabel}>Where to Purchase</Text>
                            <Text style={styles.materialDetailItemValue}>{selectedMaterial.purchaseLocation}</Text>
                          </View>
                        </View>
                      )}

                      {selectedMaterial.url && (
                        <TouchableOpacity 
                          style={styles.materialDetailItem}
                          onPress={() => handleOpenURL(selectedMaterial.url!)}
                        >
                          <Ionicons name="link-outline" size={20} color="#7C3AED" />
                          <View style={styles.materialDetailItemContent}>
                            <Text style={styles.materialDetailItemLabel}>Product URL</Text>
                            <Text style={[styles.materialDetailItemValue, styles.materialDetailLink]} numberOfLines={1}>
                              {selectedMaterial.url}
                            </Text>
                          </View>
                          <Ionicons name="open-outline" size={18} color="#3B82F6" />
                        </TouchableOpacity>
                      )}

                      {selectedMaterial.notes && (
                        <View style={styles.materialDetailItem}>
                          <Ionicons name="document-text-outline" size={20} color="#7C3AED" />
                          <View style={styles.materialDetailItemContent}>
                            <Text style={styles.materialDetailItemLabel}>Notes</Text>
                            <Text style={styles.materialDetailItemValue}>{selectedMaterial.notes}</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                </ScrollView>

                {/* Action Button */}
                {selectedMaterial.url && (
                  <TouchableOpacity 
                    style={styles.materialViewProductButton}
                    onPress={() => handleOpenURL(selectedMaterial.url!)}
                  >
                    <LinearGradient colors={['#7C3AED', '#A855F7']} style={styles.materialViewProductGradient}>
                      <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.materialViewProductText}>View Product</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ==========================================
          Materials Edit Modal
          ========================================== */}
      <Modal visible={showMaterialEditModal} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.materialModalOverlay}
        >
          <View style={styles.materialEditModalContent}>
            <View style={styles.materialEditModalHeader}>
              <Text style={styles.materialEditModalTitle}>
                {materialEditMode === 'add' ? 'Add Product' : 'Edit Product'}
              </Text>
              <TouchableOpacity onPress={() => setShowMaterialEditModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.materialEditForm}>
              {/* Name */}
              <View style={styles.materialFormGroup}>
                <Text style={styles.materialFormLabel}>Name *</Text>
                <TextInput
                  style={styles.materialFormInput}
                  value={materialEditData.name}
                  onChangeText={text => setMaterialEditData(prev => ({ ...prev, name: text }))}
                  placeholder="e.g., Decora Outlet"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Description */}
              <View style={styles.materialFormGroup}>
                <Text style={styles.materialFormLabel}>Description</Text>
                <TextInput
                  style={[styles.materialFormInput, styles.materialFormTextArea]}
                  value={materialEditData.description}
                  onChangeText={text => setMaterialEditData(prev => ({ ...prev, description: text }))}
                  placeholder="Brief description..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Category */}
              <View style={styles.materialFormGroup}>
                <Text style={styles.materialFormLabel}>Category</Text>
                <View style={styles.materialCategoryPicker}>
                  {materialCategories.filter(c => !c.isSystem).map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.materialCategoryPickerItem,
                        materialEditData.category === cat.id && { backgroundColor: cat.color, borderColor: cat.color }
                      ]}
                      onPress={() => setMaterialEditData(prev => ({ ...prev, category: cat.id as any }))}
                    >
                      <Ionicons 
                        name={cat.icon as any} 
                        size={16} 
                        color={materialEditData.category === cat.id ? '#FFFFFF' : cat.color} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Brand */}
              <View style={styles.materialFormGroup}>
                <Text style={styles.materialFormLabel}>Brand</Text>
                <TextInput
                  style={styles.materialFormInput}
                  value={materialEditData.brand}
                  onChangeText={text => setMaterialEditData(prev => ({ ...prev, brand: text }))}
                  placeholder="e.g., Leviton"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Model Number */}
              <View style={styles.materialFormGroup}>
                <Text style={styles.materialFormLabel}>Model Number</Text>
                <TextInput
                  style={styles.materialFormInput}
                  value={materialEditData.modelNumber}
                  onChangeText={text => setMaterialEditData(prev => ({ ...prev, modelNumber: text }))}
                  placeholder="e.g., T5325-W"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Price */}
              <View style={styles.materialFormGroup}>
                <Text style={styles.materialFormLabel}>Price</Text>
                <TextInput
                  style={styles.materialFormInput}
                  value={materialEditData.price}
                  onChangeText={text => setMaterialEditData(prev => ({ ...prev, price: text }))}
                  placeholder="e.g., $3.97"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Purchase Location */}
              <View style={styles.materialFormGroup}>
                <Text style={styles.materialFormLabel}>Where to Purchase</Text>
                <TextInput
                  style={styles.materialFormInput}
                  value={materialEditData.purchaseLocation}
                  onChangeText={text => setMaterialEditData(prev => ({ ...prev, purchaseLocation: text }))}
                  placeholder="e.g., Home Depot"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* URL */}
              <View style={styles.materialFormGroup}>
                <Text style={styles.materialFormLabel}>Product URL</Text>
                <TextInput
                  style={styles.materialFormInput}
                  value={materialEditData.url}
                  onChangeText={text => setMaterialEditData(prev => ({ ...prev, url: text }))}
                  placeholder="https://..."
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>

              {/* Notes */}
              <View style={styles.materialFormGroup}>
                <Text style={styles.materialFormLabel}>Notes</Text>
                <TextInput
                  style={[styles.materialFormInput, styles.materialFormTextArea]}
                  value={materialEditData.notes}
                  onChangeText={text => setMaterialEditData(prev => ({ ...prev, notes: text }))}
                  placeholder="Additional notes..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Save Button */}
            <TouchableOpacity style={styles.materialSaveButton} onPress={handleSaveMaterial}>
              <LinearGradient colors={['#7C3AED', '#A855F7']} style={styles.materialSaveButtonGradient}>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.materialSaveButtonText}>
                  {materialEditMode === 'add' ? 'Add Product' : 'Save Changes'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* Category Action Modal (Rename/Delete/Cancel) */}
      <Modal visible={showCategoryActionModal} transparent animationType="fade">
        <View style={styles.categoryActionOverlay}>
          <View style={styles.categoryActionModal}>
            {selectedCategoryForAction && (
              <>
                <View style={styles.categoryActionHeader}>
                  <View style={[styles.categoryActionIcon, { backgroundColor: selectedCategoryForAction.color + '20' }]}>
                    <Ionicons name={selectedCategoryForAction.icon as any} size={24} color={selectedCategoryForAction.color} />
                  </View>
                  <Text style={styles.categoryActionTitle}>{selectedCategoryForAction.label}</Text>
                </View>

                <TouchableOpacity style={styles.categoryActionBtn} onPress={handleRenameCategory}>
                  <Ionicons name="pencil-outline" size={20} color="#A855F7" />
                  <Text style={styles.categoryActionBtnText}>Rename</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.categoryActionBtn, styles.categoryDeleteBtn]} onPress={handleDeleteCategory}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  <Text style={[styles.categoryActionBtnText, { color: '#EF4444' }]}>Delete</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.categoryActionCancelBtn} 
                  onPress={() => { setShowCategoryActionModal(false); setSelectedCategoryForAction(null); }}
                >
                  <Text style={styles.categoryActionCancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Edit Category Modal */}
      <Modal visible={showEditCategoryModal} transparent animationType="slide">
        <View style={styles.categoryEditOverlay}>
          <View style={styles.categoryEditModal}>
            <View style={styles.categoryEditHeader}>
              <Text style={styles.categoryEditTitle}>Edit Category</Text>
              <TouchableOpacity onPress={() => { setShowEditCategoryModal(false); setSelectedCategoryForAction(null); }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.categoryEditBody} showsVerticalScrollIndicator={false}>
              {/* Category Name */}
              <Text style={styles.categoryEditLabel}>Category Name</Text>
              <TextInput
                style={styles.categoryEditInput}
                placeholder="Enter category name"
                value={editCategoryName}
                onChangeText={setEditCategoryName}
              />
              
              {/* Color Selection */}
              <Text style={styles.categoryEditLabel}>Color</Text>
              <View style={styles.colorGrid}>
                {CATEGORY_COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      editCategoryColor === color && styles.colorOptionSelected
                    ]}
                    onPress={() => setEditCategoryColor(color)}
                  >
                    {editCategoryColor === color && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Icon Selection */}
              <Text style={styles.categoryEditLabel}>Icon</Text>
              <View style={styles.iconGrid}>
                {CATEGORY_ICONS.map(icon => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      editCategoryIcon === icon && { backgroundColor: editCategoryColor + '20', borderColor: editCategoryColor }
                    ]}
                    onPress={() => setEditCategoryIcon(icon)}
                  >
                    <Ionicons 
                      name={icon as any} 
                      size={22} 
                      color={editCategoryIcon === icon ? editCategoryColor : '#64748B'} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Preview */}
              <Text style={styles.categoryEditLabel}>Preview</Text>
              <View style={styles.categoryPreview}>
                <View style={[styles.categoryPreviewChip, { backgroundColor: editCategoryColor }]}>
                  <Ionicons name={editCategoryIcon as any} size={16} color="#FFFFFF" />
                  <Text style={styles.categoryPreviewText}>{editCategoryName || 'Category'}</Text>
                </View>
              </View>
              
              {/* Save Button */}
              <TouchableOpacity style={[styles.categorySaveBtn, { backgroundColor: editCategoryColor }]} onPress={handleSaveEditCategory}>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.categorySaveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Add Category Modal */}
      <Modal visible={showAddCategoryModal} transparent animationType="slide">
        <View style={styles.categoryEditOverlay}>
          <View style={styles.categoryEditModal}>
            <View style={styles.categoryEditHeader}>
              <Text style={styles.categoryEditTitle}>Add Category</Text>
              <TouchableOpacity onPress={() => setShowAddCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.categoryEditBody} showsVerticalScrollIndicator={false}>
              {/* Category Name */}
              <Text style={styles.categoryEditLabel}>Category Name</Text>
              <TextInput
                style={styles.categoryEditInput}
                placeholder="Enter category name"
                value={editCategoryName}
                onChangeText={setEditCategoryName}
              />
              
              {/* Color Selection */}
              <Text style={styles.categoryEditLabel}>Color</Text>
              <View style={styles.colorGrid}>
                {CATEGORY_COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      editCategoryColor === color && styles.colorOptionSelected
                    ]}
                    onPress={() => setEditCategoryColor(color)}
                  >
                    {editCategoryColor === color && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Icon Selection */}
              <Text style={styles.categoryEditLabel}>Icon</Text>
              <View style={styles.iconGrid}>
                {CATEGORY_ICONS.map(icon => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      editCategoryIcon === icon && { backgroundColor: editCategoryColor + '20', borderColor: editCategoryColor }
                    ]}
                    onPress={() => setEditCategoryIcon(icon)}
                  >
                    <Ionicons 
                      name={icon as any} 
                      size={22} 
                      color={editCategoryIcon === icon ? editCategoryColor : '#64748B'} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Preview */}
              <Text style={styles.categoryEditLabel}>Preview</Text>
              <View style={styles.categoryPreview}>
                <View style={[styles.categoryPreviewChip, { backgroundColor: editCategoryColor }]}>
                  <Ionicons name={editCategoryIcon as any} size={16} color="#FFFFFF" />
                  <Text style={styles.categoryPreviewText}>{editCategoryName || 'Category'}</Text>
                </View>
              </View>
              
              {/* Save Button */}
              <TouchableOpacity style={[styles.categorySaveBtn, { backgroundColor: editCategoryColor }]} onPress={handleSaveNewCategory}>
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.categorySaveBtnText}>Save Category</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E0E7FF',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
    zIndex: 10,
  },
  filterBox: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  filterBoxActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  filterTextActive: {
    color: '#4F46E5',
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
    zIndex: 50,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  galleryItem: {
    width: imageSize,
    height: imageSize,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(79, 70, 229, 0.85)',
    padding: 12,
  },
  galleryInfo: {
    flexDirection: 'column',
  },
  galleryProjectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  galleryStreet: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 2,
  },
  galleryCity: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 3,
  },
  galleryDescription: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    fontStyle: 'italic',
    opacity: 1,
  },
  galleryLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  galleryLocationText: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  viewButtonContainer: {
    position: 'relative',
    zIndex: 100,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 44,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  viewDropdown: {
    position: 'absolute',
    top: 50,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 160,
    zIndex: 1000,
  },
  viewDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  viewDropdownItemActive: {
    backgroundColor: '#F8FAFC',
  },
  viewDropdownText: {
    fontSize: 14,
    color: '#64748B',
  },
  viewDropdownTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#DDE2FF',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  listItemPortfolio: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
    shadowColor: '#1E3A8A',
  },
  listImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  listInfo: {
    flex: 1,
  },
  listProjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  listProjectNamePortfolio: {
    color: '#1E3A8A',
  },
  listStreet: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  listCity: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  listCityPortfolio: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  listDescription: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  listLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  listLocationText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  listDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  // FAB Container and Styles
  fabContainer: {
    position: 'fixed' as any,
    right: 20,
    bottom: 30,
    zIndex: 999,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#1E3A8A',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  formGroup: {
    marginBottom: 20,
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
  photoCountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  photoCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  createButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Modal Scroll Content
  modalScrollContent: {
    maxHeight: 400,
  },
  // Image Picker Styles
  imagePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  imageCountLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addPhotosButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addPhotosGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  addPhotosText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
  addPhotosTextDisabled: {
    color: '#94A3B8',
  },
  selectedImagesContainer: {
    marginTop: 12,
  },
  selectedImagesScroll: {
    paddingVertical: 4,
    gap: 10,
  },
  selectedImageWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  selectedImageThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  coverBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  coverBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // ==========================================
  // Materials Tab Styles
  // ==========================================
  materialCategoriesContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  materialCategoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  materialCategoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  materialCategoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  materialCategoryTextActive: {
    color: '#FFFFFF',
  },
  materialsScrollView: {
    flex: 1,
  },
  materialsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  materialCard: {
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
  materialCardImageContainer: {
    height: 110,
    position: 'relative',
  },
  materialCardImage: {
    width: '100%',
    height: '100%',
  },
  materialCardImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  materialCategoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  materialFavoriteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  materialCardContent: {
    padding: 12,
  },
  materialCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  materialCardDescription: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginBottom: 6,
  },
  materialCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  materialCardMetaText: {
    fontSize: 10,
    color: '#64748B',
  },
  materialCardPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7C3AED',
    marginTop: 4,
  },
  materialsEmptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  materialsEmptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  materialsEmptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  materialsEmptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  materialsEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  materialsEmptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Material Modals
  materialModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  materialDetailModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  materialDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  materialDetailHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  materialDetailAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  materialDetailImage: {
    width: '100%',
    height: 180,
  },
  materialDetailImagePlaceholder: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  materialDetailInfo: {
    padding: 20,
  },
  materialDetailCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 12,
  },
  materialDetailCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  materialDetailName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  materialDetailDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 12,
  },
  materialDetailPrice: {
    fontSize: 26,
    fontWeight: '800',
    color: '#7C3AED',
    marginBottom: 20,
  },
  materialDetailsList: {
    gap: 12,
  },
  materialDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  materialDetailItemContent: {
    flex: 1,
  },
  materialDetailItemLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  materialDetailItemValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  materialDetailLink: {
    color: '#3B82F6',
  },
  materialViewProductButton: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  materialViewProductGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  materialViewProductText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Material Edit Modal
  materialEditModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
  },
  materialEditModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  materialEditModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  materialEditForm: {
    maxHeight: 380,
  },
  materialFormGroup: {
    marginBottom: 14,
  },
  materialFormLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  materialFormInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  materialFormTextArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  materialCategoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  materialCategoryPickerItem: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  materialSaveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  materialSaveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  materialSaveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Add Category Tab Style
  addCategoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#A855F7',
    borderStyle: 'dashed',
    gap: 4,
  },
  addCategoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A855F7',
  },
  // Material Search Bar Styles
  materialSearchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  materialSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  materialSearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    paddingVertical: 2,
  },
  materialSearchResults: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    marginLeft: 4,
  },
  // Category Action Modal Styles
  categoryActionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  categoryActionModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  categoryActionHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryActionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  categoryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 10,
    gap: 10,
  },
  categoryDeleteBtn: {
    backgroundColor: '#FEF2F2',
  },
  categoryActionBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#A855F7',
  },
  categoryActionCancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  categoryActionCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  // Category Edit Modal Styles
  categoryEditOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  categoryEditModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  categoryEditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  categoryEditTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  categoryEditBody: {
    padding: 20,
  },
  categoryEditLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 10,
    marginTop: 16,
  },
  categoryEditInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPreview: {
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  categoryPreviewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  categoryPreviewText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categorySaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 24,
    marginBottom: 30,
    gap: 8,
  },
  categorySaveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
