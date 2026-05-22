import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Modal, Linking, Platform, Share, Alert, TextInput, ActivityIndicator, Image, FlatList, Dimensions, Animated, PanResponder } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getProjectById, deleteProject, updateProject } from '../utils/projectsData';
import * as Contacts from 'expo-contacts';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { buildApiUrl, getAuthHeaders } from '../shared/store/baseApi';
import ChangeOrdersTab from '../components/ChangeOrdersTab';
import InspectionDetailModal from '../components/InspectionDetailModal';
import EditPropertyDetailsModal from '../components/modals/EditPropertyDetailsModal';
import ImageViewerModal from '../components/modals/ImageViewerModal';
import FullScreenImageModal from '../components/modals/FullScreenImageModal';
import PermitPreviewModal from '../components/modals/PermitPreviewModal';
import ReceiptsTab from '../components/tabs/ReceiptsTab';
import PLTab from '../components/tabs/PLTab';

// Companies data for "By Company" dropdown - matches projects.tsx
const INITIAL_COMPANIES_DATA = [
  {
    id: 1,
    name: 'Boulder Contractor',
    initials: 'BC',
    phone: '(303) 555-0201',
    email: 'info@bouldercontractor.com',
    website: 'www.bouldercontractor.com',
    tradeIndustry: 'General Contracting'
  },
  {
    id: 2,
    name: 'Denver Contractor',
    initials: 'DC',
    phone: '(720) 555-0202',
    email: 'contact@denvercontractor.com',
    website: 'www.denvercontractor.com',
    tradeIndustry: 'Construction & Remodeling'
  },
  {
    id: 3,
    name: 'Golden Contractor',
    initials: 'GC',
    phone: '(303) 555-0203',
    email: 'hello@goldencontractor.com',
    website: 'www.goldencontractor.com',
    tradeIndustry: 'Commercial Construction'
  }
];

// Helper function to get color for status
const getStatusColor = (status: string) => {
  const colorMap: { [key: string]: string } = {
    'Rough-In': '#60A5FA',        // lightblue
    'Inspection': '#A855F7',      // purple
    'Final Trim': '#10B981',      // green
    'Completed': '#9CA3AF',       // lightgray
    'Service Call': '#EF4444',    // red
    'To be scheduled': '#60A5FA', // lightblue
  };
  return colorMap[status] || '#6366F1';
};

const TABS = [
  { id: 'materials', label: 'Receipts' },
  { id: 'task', label: 'Task/Checklist' },
  { id: 'logs', label: 'Logs' },
  { id: 'inspections', label: 'Inspections' },
  { id: 'permits', label: 'Permits' },
  { id: 'invoices', label: 'Invoices / Change Orders' },
  { id: 'pl', label: 'P&L' }
];

type DraftListItem = {
  id: string;
  text: string;
  [key: string]: any;
};

type DraftCategory = {
  id: string;
  name: string;
  items: DraftListItem[];
  [key: string]: any;
};

export default function ProjectDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [openContactDropdown, setOpenContactDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('materials');
  
  // Companies state
  const [companies] = useState(INITIAL_COMPANIES_DATA);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  
  // Change Orders state
  const [changeOrders, setChangeOrders] = useState<any[]>([]);
  const [showCustomerEditModal, setShowCustomerEditModal] = useState(false);
  const [customerEditData, setCustomerEditData] = useState({
    name: '',
    company: '',
    street: '',
    city: '',
    phone: '',
    email: ''
  });
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showContactDeleteWarning, setShowContactDeleteWarning] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [editedContactData, setEditedContactData] = useState<any>(null);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isAddingNewContact, setIsAddingNewContact] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showCompanyInfoModal, setShowCompanyInfoModal] = useState(false);
  const [selectedCompanyInfo, setSelectedCompanyInfo] = useState<any>(null);
  const [noteText, setNoteText] = useState('');
  const [project, setProject] = useState<any>(null);
  
  // Project Note state
  const [showProjectNoteModal, setShowProjectNoteModal] = useState(false);
  const [projectNoteText, setProjectNoteText] = useState('');
  
  // Property Details Edit Modal state
  const [showPropertyEditModal, setShowPropertyEditModal] = useState(false);
  const [editPropertyDescription, setEditPropertyDescription] = useState('');
  const [editAccessCode, setEditAccessCode] = useState('');
  const [editLocationImageUrl, setEditLocationImageUrl] = useState('');
  const [showImageViewerModal, setShowImageViewerModal] = useState(false);
  const [showFullScreenImage, setShowFullScreenImage] = useState(false);
  
  // Inspections state
  const [inspections, setInspections] = useState<any[]>([]);
  const [showInspectionDetail, setShowInspectionDetail] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<any>(null);
  const [showCustomStatusModal, setShowCustomStatusModal] = useState(false);
  const [customStatusText, setCustomStatusText] = useState('');
  const [inspectionStatusOptions, setInspectionStatusOptions] = useState([
    'Rough-In', 'Pre-Final', 'Final', 'Specialty'
  ]);
  const [showDeleteStatusWarning, setShowDeleteStatusWarning] = useState(false);
  const [statusToDelete, setStatusToDelete] = useState('');
  const [showPassFailDropdowns, setShowPassFailDropdowns] = useState<boolean[]>([]);
  
  // Permits state
  const [permits, setPermits] = useState<any[]>([]);
  const [showPermitPreview, setShowPermitPreview] = useState(false);
  const [permitPreviewData, setPermitPreviewData] = useState<any>(null);
  const [isExtractingPermit, setIsExtractingPermit] = useState(false);

  // Task state
  const [taskSubTab, setTaskSubTab] = useState<'task' | 'checklist' | 'materials'>('task');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showTeamAssignModal, setShowTeamAssignModal] = useState(false);
  const [collapsedTasks, setCollapsedTasks] = useState<{ [key: string]: boolean }>({});
  const [showPhotoOptionsModal, setShowPhotoOptionsModal] = useState(false);
  const [selectedTaskItem, setSelectedTaskItem] = useState<any>(null);
  const [showTaskPhotoViewer, setShowTaskPhotoViewer] = useState(false);
  const [selectedTaskPhoto, setSelectedTaskPhoto] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const pan = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategories, setNewTaskCategories] = useState<DraftCategory[]>([
    { id: 'cat-temp-1', name: '', items: [{ id: 'item-temp-1', text: '' }] }
  ]);

  // Checklist state (mirrors Task)
  const [collapsedChecklists, setCollapsedChecklists] = useState<{ [key: string]: boolean }>({});
  const [showChecklistPhotoOptionsModal, setShowChecklistPhotoOptionsModal] = useState(false);
  const [selectedChecklistItem, setSelectedChecklistItem] = useState<any>(null);
  const [showChecklistPhotoViewer, setShowChecklistPhotoViewer] = useState(false);
  const [currentChecklistPhotoIndex, setCurrentChecklistPhotoIndex] = useState(0);
  const [showAddChecklistModal, setShowAddChecklistModal] = useState(false);
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newChecklistCategories, setNewChecklistCategories] = useState<DraftCategory[]>([
    { id: 'cat-temp-1', name: '', items: [{ id: 'item-temp-1', text: '' }] }
  ]);
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);

  // Materials state
  const [collapsedMaterials, setCollapsedMaterials] = useState<{ [key: string]: boolean }>({});
  const [showAddMaterialListModal, setShowAddMaterialListModal] = useState(false);
  const [editingMaterialListId, setEditingMaterialListId] = useState<string | null>(null);
  const [newMaterialListName, setNewMaterialListName] = useState('');
  const [newMaterialListPickupLocation, setNewMaterialListPickupLocation] = useState('');
  const [newMaterialListPickupAddress, setNewMaterialListPickupAddress] = useState('');
  const [newMaterialListDueDate, setNewMaterialListDueDate] = useState('');
  const [newMaterialListPriority, setNewMaterialListPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newMaterialListNotes, setNewMaterialListNotes] = useState('');
  const [newMaterialListUrl, setNewMaterialListUrl] = useState('');
  const [newMaterialListItems, setNewMaterialListItems] = useState<any[]>([
    { id: 'mat-item-temp-1', name: '', quantity: '', unit: 'pieces', estimatedCost: '', purchased: false, url: '' }
  ]);
  const [selectedMaterialList, setSelectedMaterialList] = useState<any>(null);
  const [showMaterialTeamAssignModal, setShowMaterialTeamAssignModal] = useState(false);

  // Receipts tab state
  const [receipts, setReceipts] = useState<any[]>([]);

  // Fetch project data based on ID from params
  useEffect(() => {
    const projectIdParam = Array.isArray(params.id) ? params.id[0] : params.id;
    const projectId = parseInt(projectIdParam ?? '', 10);
    const foundProject = getProjectById(projectId);
    
    if (foundProject) {
      setProject(foundProject);
      setChangeOrders(foundProject.changeOrders || []);
      const projectInspections = foundProject.inspections || [];
      setInspections(projectInspections);
      setShowPassFailDropdowns(Array(projectInspections.length).fill(false));
      // Initialize property details state
      setEditPropertyDescription(foundProject.propertyDescription || '');
      setEditAccessCode(foundProject.accessCode || '');
      setEditLocationImageUrl(foundProject.locationImageUrl || '');
      // Load permits
      setPermits(foundProject.permits || []);
      // Load receipts
      setReceipts(foundProject.receipts || []);
      // Load project note
      setProjectNoteText(foundProject.projectNote || '');
      // Initialize all tasks as collapsed
      if (foundProject.tasks && foundProject.tasks.length > 0) {
        const initialCollapsedState: { [key: string]: boolean } = {};
        foundProject.tasks.forEach((task: any) => {
          initialCollapsedState[task.id] = true; // true means collapsed
        });
        setCollapsedTasks(initialCollapsedState);
      }
      // Initialize all checklists as collapsed
      if (foundProject.checklists && foundProject.checklists.length > 0) {
        const initialChecklistCollapsedState: { [key: string]: boolean } = {};
        foundProject.checklists.forEach((checklist: any) => {
          initialChecklistCollapsedState[checklist.id] = true; // true means collapsed
        });
        setCollapsedChecklists(initialChecklistCollapsedState);
      }
      // Initialize all material lists as collapsed
      if (foundProject.materialLists && foundProject.materialLists.length > 0) {
        const initialMaterialCollapsedState: { [key: string]: boolean } = {};
        foundProject.materialLists.forEach((materialList: any) => {
          initialMaterialCollapsedState[materialList.id] = true; // true means collapsed
        });
        setCollapsedMaterials(initialMaterialCollapsedState);
      }
    } else {
      // If project not found, navigate back
      router.back();
    }
  }, [params.id]);
  
  // Handler for updating change orders (uses local storage)
  const handleUpdateChangeOrders = (updatedOrders: any[]) => {
    setChangeOrders(updatedOrders);
    updateProject(project.id, { changeOrders: updatedOrders });
  };

  // Save photo to device
  const handleSavePhoto = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library permission to save images.');
        return;
      }

      const currentPhoto = selectedTaskItem?.photos?.[currentPhotoIndex];
      if (!currentPhoto) return;

      // Download the photo if it's a remote URL
      const fileUri = currentPhoto.startsWith('http') 
        ? await FileSystem.downloadAsync(currentPhoto, FileSystem.documentDirectory + 'temp_photo.jpg')
        : { uri: currentPhoto };

      await MediaLibrary.saveToLibraryAsync(fileUri.uri);
      Alert.alert('Success', 'Photo saved to your gallery!');
    } catch (error) {
      console.error('Error saving photo:', error);
      Alert.alert('Error', 'Failed to save photo. Please try again.');
    }
  };

  // Pan responder for swipe to close
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          pan.setValue({ x: 0, y: gestureState.dy });
          opacity.setValue(1 - gestureState.dy / 400);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150) {
          // Close the modal
          Animated.parallel([
            Animated.timing(pan, {
              toValue: { x: 0, y: 400 },
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setShowTaskPhotoViewer(false);
            pan.setValue({ x: 0, y: 0 });
            opacity.setValue(1);
          });
        } else {
          // Snap back
          Animated.parallel([
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: true,
            }),
            Animated.spring(opacity, {
              toValue: 1,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  // Show loading or nothing while project is being fetched
  if (!project) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  // Format address from street and city
  const fullAddress = `${project.street}, ${project.city}`;

  const handleContactClick = (contact: any) => {
    setSelectedContact(contact);
    setEditedContactData(contact);
    setNoteText(contact.note || '');
    setIsEditingContact(false);
    setIsAddingNewContact(false);
    setIsAddingNote(false);
    setShowContactModal(true);
    setOpenContactDropdown(false);
  };

  const handleSaveNote = () => {
    const updatedContact = { ...selectedContact, note: noteText };
    const updatedContacts = (project.otherContacts || []).map((c: any) => 
      c.id === selectedContact.id ? updatedContact : c
    );
    
    updateProject(project.id, { otherContacts: updatedContacts });
    const updatedProject = getProjectById(project.id);
    setProject(updatedProject);
    
    setSelectedContact(updatedContact);
    setEditedContactData(updatedContact);
    setIsAddingNote(false);
  };

  const handleAddNewContact = () => {
    const newContact = {
      id: `${project.id}-c${Date.now()}`,
      name: '',
      phone: '',
      email: '',
      note: ''
    };
    setSelectedContact(newContact);
    setEditedContactData(newContact);
    setIsEditingContact(true);
    setIsAddingNewContact(true);
    setShowContactModal(true);
    setOpenContactDropdown(false);
  };

  const handleSaveContact = () => {
    let updatedContacts;
    if (isAddingNewContact) {
      updatedContacts = [...(project.otherContacts || []), editedContactData];
    } else {
      updatedContacts = (project.otherContacts || []).map((c: any) => 
        c.id === selectedContact.id ? editedContactData : c
      );
    }
    
    // Update shared store
    updateProject(project.id, { otherContacts: updatedContacts });
    
    // Refresh project data
    const updatedProject = getProjectById(project.id);
    setProject(updatedProject);
    
    setShowContactModal(false);
    setIsEditingContact(false);
    setIsAddingNewContact(false);
  };

  const handleDeleteContactClick = () => {
    setShowContactDeleteWarning(true);
  };

  const confirmDeleteContact = () => {
    const updatedContacts = (project.otherContacts || []).filter(
      (c: any) => c.id !== selectedContact.id
    );
    
    // Update shared store
    updateProject(project.id, { otherContacts: updatedContacts });
    
    // Refresh project data
    const updatedProject = getProjectById(project.id);
    setProject(updatedProject);
    
    setShowContactDeleteWarning(false);
    setShowContactModal(false);
  };

  const handleDeleteProject = () => {
    if (project) {
      deleteProject(project.id);
      setShowDeleteWarning(false);
      router.back(); // Navigate back to projects list
    }
  };

  const handleOpenCustomerEdit = () => {
    setCustomerEditData({
      name: project.name,
      company: project.company || '',
      street: project.street,
      city: project.city,
      phone: project.phone,
      email: project.email
    });
    setShowCompanyDropdown(false);
    setShowCustomerEditModal(true);
  };

  const handleSaveCustomerDetails = () => {
    // Find the selected company to get its initials
    const selectedCompany = companies.find((c: any) => c.name === customerEditData.company);
    
    // Update via shared store
    updateProject(project.id, {
      name: customerEditData.name,
      company: customerEditData.company || '',
      companyInitials: selectedCompany?.initials || '',
      street: customerEditData.street,
      city: customerEditData.city,
      phone: customerEditData.phone,
      email: customerEditData.email
    });
    
    // Refresh project data
    const updatedProject = getProjectById(project.id);
    setProject(updatedProject);
    
    setShowCompanyDropdown(false);
    setShowCustomerEditModal(false);
  };

  const handleCall = () => {
    if (project.phone) {
      const phoneNumber = project.phone.replace(/\D/g, ''); // Remove formatting
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleText = () => {
    if (project.phone) {
      const phoneNumber = project.phone.replace(/\D/g, ''); // Remove formatting
      Linking.openURL(`sms:${phoneNumber}`);
    }
  };

  const handleEmail = () => {
    if (project.email) {
      Linking.openURL(`mailto:${project.email}`);
    }
  };

  const handleOpenMap = () => {
    if (fullAddress) {
      const encodedAddress = encodeURIComponent(fullAddress);
      // iOS uses Apple Maps, Android uses Google Maps by default
      const url = Platform.OS === 'ios' 
        ? `maps://maps.apple.com/?q=${encodedAddress}`
        : `geo:0,0?q=${encodedAddress}`;
      
      Linking.openURL(url).catch(() => {
        // Fallback to Google Maps web if native app fails
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
      });
    }
  };

  const handleSaveToDevice = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant contacts permission to save contact.');
        return;
      }

      const contact = {
        contactType: Contacts.ContactTypes.Person,
        name: project.name,
        [Contacts.Fields.FirstName]: project.name.split(' ')[0],
        [Contacts.Fields.LastName]: project.name.split(' ').slice(1).join(' '),
        [Contacts.Fields.PhoneNumbers]: project.phone ? [{
          label: 'mobile',
          number: project.phone,
        }] : [],
        [Contacts.Fields.Emails]: project.email ? [{
          label: 'work',
          email: project.email,
        }] : [],
        [Contacts.Fields.Addresses]: [{
          label: 'work',
          street: fullAddress,
        }],
      };

      await Contacts.addContactAsync(contact);
      Alert.alert('Success', `${project.name} has been saved to your contacts!`);
      setShowShareModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save contact. Please try again.');
    }
  };

  const handleShareAsText = () => {
    const contactInfo = `Name: ${project.name}\nAddress: ${fullAddress}\nPhone: ${project.phone || 'N/A'}\nEmail: ${project.email || 'N/A'}`;
    
    if (Platform.OS === 'web') {
      // For web, copy to clipboard
      navigator.clipboard.writeText(contactInfo);
      Alert.alert('Copied', 'Contact info copied to clipboard!');
    } else {
      // For mobile, use SMS
      const smsUrl = `sms:?body=${encodeURIComponent(contactInfo)}`;
      Linking.openURL(smsUrl);
    }
    setShowShareModal(false);
  };

  const handleShareInSpaces = () => {
    Alert.alert('OffiAxis Spaces', 'Share in OffiAxis Spaces coming soon!');
    setShowShareModal(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={['#3B82F6', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Project Details</Text>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => setShowDeleteWarning(true)}
        >
          <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Box #1 – Customer / Primary Contact */}
        <View style={styles.section}>
          <LinearGradient
            colors={['#EEF2FF', '#DBEAFE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.customerBox}
          >
            {/* Avatar + Name + Badge + Edit Button */}
            <View style={styles.customerHeader}>
              {/* Avatar with Initials */}
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={['#4F46E5', '#3B82F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>{project.initials}</Text>
                </LinearGradient>
                
                {/* Company Badge - Clickable to show company info */}
                {project.companyInitials && (
                  <TouchableOpacity 
                    style={styles.companyBadge}
                    onPress={() => {
                      const company = companies.find(c => c.initials === project.companyInitials);
                      if (company) {
                        setSelectedCompanyInfo(company);
                        setShowCompanyInfoModal(true);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.companyBadgeText}>{project.companyInitials}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Name */}
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{project.name}</Text>
                
                {/* Project Note Display */}
                {projectNoteText ? (
                  <TouchableOpacity 
                    style={styles.projectNoteDisplay}
                    onPress={() => setShowProjectNoteModal(true)}
                  >
                    <Ionicons name="document-text-outline" size={14} color="#64748B" />
                    <Text style={styles.projectNoteDisplayText} numberOfLines={2}>
                      {projectNoteText}
                    </Text>
                    <Ionicons name="pencil" size={12} color="#94A3B8" />
                  </TouchableOpacity>
                ) : null}
                
                {/* Primary Contact Badge + Dropdown */}
                <View style={styles.primaryContactBadgeContainer}>
                  <TouchableOpacity
                    style={styles.primaryContactBadge}
                    onPress={() => setOpenContactDropdown(!openContactDropdown)}
                  >
                    <Ionicons name="person" size={12} color="#4F46E5" />
                    <Text style={styles.primaryContactBadgeText}>Primary Contact</Text>
                    <Ionicons name="chevron-down" size={12} color="#4F46E5" />
                  </TouchableOpacity>

                  {/* Dropdown Menu */}
                  {openContactDropdown && (
                    <>
                      {/* Backdrop */}
                      <TouchableOpacity 
                        style={styles.dropdownBackdrop}
                        activeOpacity={1}
                        onPress={() => setOpenContactDropdown(false)}
                      />
                      
                      {/* Dropdown Content */}
                      <View style={styles.contactDropdownMenu}>
                        {/* Contact List */}
                        {(project.otherContacts || []).map((contact: any) => (
                          <TouchableOpacity
                            key={contact.id}
                            style={styles.contactDropdownItem}
                            onPress={() => {
                              handleContactClick(contact);
                              setOpenContactDropdown(false);
                            }}
                          >
                            <Text style={styles.contactDropdownName}>{contact.name}</Text>
                            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                          </TouchableOpacity>
                        ))}
                        
                        {/* Add Another Contact */}
                        <TouchableOpacity
                          style={styles.addContactDropdownButton}
                          onPress={() => {
                            handleAddNewContact();
                            setOpenContactDropdown(false);
                          }}
                        >
                          <Ionicons name="add" size={16} color="#4F46E5" />
                          <Text style={styles.addContactDropdownText}>Add another contact</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              </View>

              {/* Edit Button */}
              <TouchableOpacity
                onPress={handleOpenCustomerEdit}
                style={styles.indigoEditButton}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={16} color="#4F46E5" />
              </TouchableOpacity>
            </View>

            {/* Address / Phone / Email Rows */}
            <View style={styles.infoRows}>
              {/* Address */}
              <TouchableOpacity 
                style={styles.infoRow}
                onPress={handleOpenMap}
                activeOpacity={0.7}
              >
                <View style={[styles.infoIcon, styles.addressIcon]}>
                  <Ionicons name="location" size={16} color="#4F46E5" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>{fullAddress}</Text>
                </View>
              </TouchableOpacity>

              {/* Phone */}
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, styles.phoneIcon]}>
                  <Ionicons name="call" size={16} color="#16A34A" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, styles.phoneLabel]}>Phone</Text>
                  <View style={styles.phoneRow}>
                    <Text style={styles.infoValue}>{project.phone}</Text>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.callButton]}
                      onPress={handleCall}
                    >
                      <Text style={styles.actionButtonText}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.textButton]}
                      onPress={handleText}
                    >
                      <Text style={styles.actionButtonText}>Text</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Email */}
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, styles.emailIcon]}>
                  <Ionicons name="mail" size={16} color="#9333EA" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, styles.emailLabel]}>Email</Text>
                  <View style={styles.phoneRow}>
                    <Text style={styles.infoValue}>{project.email || 'No email'}</Text>
                    {project.email && (
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.emailButton]}
                        onPress={handleEmail}
                      >
                        <Text style={styles.actionButtonText}>Email</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {/* Bottom Action Buttons */}
            <View style={styles.bottomActions}>
              <TouchableOpacity 
                style={styles.bottomActionButton}
                onPress={() => setShowShareModal(true)}
              >
                <Ionicons name="share-social-outline" size={14} color="#4F46E5" />
                <Text style={styles.bottomActionText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.bottomActionButton}
                onPress={() => setShowProjectNoteModal(true)}
              >
                <Ionicons name="add" size={14} color="#4F46E5" />
                <Text style={styles.bottomActionText}>Note</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.bottomActionButton}
                onPress={() => {
                  if (project) {
                    router.push({
                      pathname: '/project-gallery',
                      params: {
                        id: project.id,
                        name: project.name,
                      },
                    });
                  }
                }}
              >
                <Ionicons name="camera-outline" size={14} color="#4F46E5" />
                <Text style={styles.bottomActionText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Box #2 – Property Details */}
        <View style={styles.section}>
          <LinearGradient
            colors={['#FFFBEB', '#FFEDD5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.propertyBox}
          >
            {/* Header with Icon + Title + Edit */}
            <View style={styles.propertyHeader}>
              <View style={styles.propertyTitleContainer}>
                <LinearGradient
                  colors={['#F59E0B', '#F97316']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.propertyIcon}
                >
                  <Ionicons name="document-text" size={20} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.propertyTitle}>Property Details</Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => {
                  // Initialize edit fields with current values
                  setEditPropertyDescription(project.propertyDescription || '');
                  setEditAccessCode(project.accessCode || '');
                  setEditLocationImageUrl(project.locationImageUrl || '');
                  setShowPropertyEditModal(true);
                }}
                style={styles.amberEditButton}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={16} color="#B45309" />
              </TouchableOpacity>
            </View>

            {/* Description */}
            <View style={styles.descriptionBox}>
              <Text style={[
                styles.descriptionText,
                !project.propertyDescription && styles.placeholderText
              ]}>
                {project.propertyDescription || 'Add information about the lockbox location, access instructions, property entry details, or any special access requirements for this property.'}
              </Text>
            </View>

            {/* Access Code Section */}
            <View style={styles.accessCodeRow}>
              <View style={styles.accessCodeIcon}>
                <Ionicons name="key" size={20} color="#F59E0B" />
              </View>
              <View style={styles.accessCodeContent}>
                <Text style={styles.accessCodeLabel}>Access Code</Text>
                <Text style={[
                  styles.accessCodeValue,
                  !project.accessCode && styles.placeholderText
                ]}>
                  {project.accessCode || 'No access code'}
                </Text>
              </View>
              <View style={styles.accessCodeActions}>
                <TouchableOpacity 
                  style={[styles.viewButton, !project.locationImageUrl && styles.viewButtonDisabled]}
                  onPress={() => {
                    if (project.locationImageUrl) {
                      setShowImageViewerModal(true);
                    } else {
                      Alert.alert('No Image', 'No location image has been added yet. Click the edit button to add one.');
                    }
                  }}
                  disabled={!project.locationImageUrl}
                >
                  <Ionicons name="image-outline" size={12} color="#FFFFFF" />
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Horizontal Tabs */}
        <View style={styles.tabsSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  activeTab === tab.id && styles.tabActive
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === tab.id && styles.tabTextActive
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'materials' ? (
            <ReceiptsTab
              receipts={receipts}
              setReceipts={setReceipts}
              projectId={project.id}
            />
          ) : activeTab === 'invoices' ? (
            <ChangeOrdersTab
              changeOrders={changeOrders}
              onUpdate={handleUpdateChangeOrders}
              projectId={project.id}
            />
          ) : activeTab === 'pl' ? (
            <PLTab
              project={project}
              changeOrders={changeOrders}
              permits={permits}
              receipts={receipts}
              router={router}
            />
          ) : activeTab === 'inspections' ? (
            // Inspections Tab Content
            <View style={styles.inspectionsContainer}>
              <View style={styles.inspectionsHeader}>
                <Text style={styles.inspectionsTitle}>Inspections</Text>
                <TouchableOpacity
                  style={styles.addInspectionButton}
                  onPress={() => {
                    setSelectedInspection({
                      id: `insp-${Date.now()}`,
                      projectName: project.name,
                      inspectionDate: new Date().toISOString().split('T')[0],
                      assignedTo: '',
                      status: 'Rough-In',
                      passFailStatus: null,
                      failNotes: '',
                      failPhotos: [],
                      checklist: [],
                      inspectorNotes: {
                        deficiencies: '',
                        corrections: '',
                        reInspectionDate: null
                      },
                      photos: {
                        before: [],
                        after: [],
                        correction: []
                      }
                    });
                    setShowInspectionDetail(true);
                  }}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.addInspectionButtonText}>Add Inspection</Text>
                </TouchableOpacity>
              </View>

              {inspections.length > 0 ? (
                <View style={styles.inspectionsList}>
                  {inspections.map((inspection: any, index: number) => (
                    <TouchableOpacity
                      key={inspection.id}
                      style={styles.inspectionCard}
                      activeOpacity={1}
                      onPress={() => {
                        // Close any open dropdowns when clicking on card
                        if (showPassFailDropdowns.some(val => val)) {
                          setShowPassFailDropdowns(Array(inspections.length).fill(false));
                        }
                      }}
                    >
                      {/* Card Header */}
                      <View style={styles.inspectionCardHeader}>
                        <TouchableOpacity
                          style={styles.inspectionCardTitle}
                          onPress={() => {
                            setSelectedInspection(inspection);
                            setShowInspectionDetail(true);
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="document-text" size={20} color="#4F46E5" />
                          <Text style={styles.inspectionCardName}>{inspection.projectName}</Text>
                        </TouchableOpacity>
                        
                        {/* Pass/Fail/In Progress Dropdown */}
                        <View style={{ position: 'relative' }}>
                          <TouchableOpacity
                            style={[
                              styles.inspectionPassFailBadge,
                              { backgroundColor: 
                                inspection.passFailStatus === 'Pass' ? '#D1FAE5' : 
                                inspection.passFailStatus === 'Fail' ? '#FEE2E2' : 
                                '#FEF3C7' 
                              }
                            ]}
                            onPress={(e) => {
                              e.stopPropagation();
                              // Toggle dropdown for this specific inspection
                              const newDropdowns = [...Array(inspections.length)].map((_, i) => i === index);
                              setShowPassFailDropdowns(newDropdowns);
                            }}
                          >
                            <Text style={[
                              styles.inspectionPassFailText,
                              { color: 
                                inspection.passFailStatus === 'Pass' ? '#059669' : 
                                inspection.passFailStatus === 'Fail' ? '#DC2626' : 
                                '#D97706' 
                              }
                            ]}>
                              {inspection.passFailStatus || 'IN PROGRESS'}
                            </Text>
                            <Ionicons 
                              name="chevron-down" 
                              size={14} 
                              color={
                                inspection.passFailStatus === 'Pass' ? '#059669' : 
                                inspection.passFailStatus === 'Fail' ? '#DC2626' : 
                                '#D97706'
                              }
                              style={{ marginLeft: 4 }}
                            />
                          </TouchableOpacity>
                          
                          {/* Dropdown Menu */}
                          {showPassFailDropdowns[index] && (
                            <TouchableOpacity
                              activeOpacity={1}
                              onPress={(e) => e.stopPropagation()}
                              style={styles.inspectionPassFailDropdown}
                            >
                              {['Pass', 'Fail', 'In Progress'].map((status) => (
                                <TouchableOpacity
                                  key={status}
                                  style={styles.inspectionPassFailOption}
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    // Update inspection status
                                    const updatedInspections = inspections.map(i => 
                                      i.id === inspection.id ? { ...i, passFailStatus: status } : i
                                    );
                                    setInspections(updatedInspections);
                                    
                                    // Update in project data
                                    const updatedProject = { ...project, inspections: updatedInspections };
                                    setProject(updatedProject);
                                    updateProject(project.id, { inspections: updatedInspections });
                                    
                                    // Close dropdown
                                    setShowPassFailDropdowns(Array(inspections.length).fill(false));
                                  }}
                                >
                                  <View style={[
                                    styles.inspectionStatusDot,
                                    { backgroundColor: 
                                      status === 'Pass' ? '#10B981' : 
                                      status === 'Fail' ? '#EF4444' : 
                                      '#F59E0B' 
                                    }
                                  ]} />
                                  <Text style={[
                                    styles.inspectionPassFailOptionText,
                                    { color: 
                                      status === 'Pass' ? '#059669' : 
                                      status === 'Fail' ? '#DC2626' : 
                                      '#D97706' 
                                    }
                                  ]}>
                                    {status}
                                  </Text>
                                  {inspection.passFailStatus === status && (
                                    <Ionicons name="checkmark" size={16} color="#4F46E5" />
                                  )}
                                </TouchableOpacity>
                              ))}
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

                      {/* Card Body */}
                      <TouchableOpacity
                        style={styles.inspectionCardBody}
                        onPress={() => {
                          setSelectedInspection(inspection);
                          setShowInspectionDetail(true);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.inspectionCardRow}>
                          <Ionicons name="calendar-outline" size={16} color="#64748B" />
                          <Text style={styles.inspectionCardLabel}>Date Created:</Text>
                          <Text style={styles.inspectionCardValue}>
                            {new Date(inspection.createdDate || inspection.inspectionDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </Text>
                        </View>

                        <View style={styles.inspectionCardRow}>
                          <Ionicons name="time-outline" size={16} color="#64748B" />
                          <Text style={styles.inspectionCardLabel}>Scheduled:</Text>
                          <Text style={styles.inspectionCardValue}>
                            {new Date(inspection.scheduledDate || inspection.inspectionDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </Text>
                        </View>

                        <View style={styles.inspectionCardRow}>
                          <Ionicons name="git-compare-outline" size={16} color="#64748B" />
                          <Text style={styles.inspectionCardLabel}>Stage:</Text>
                          <Text style={styles.inspectionCardValue}>
                            {inspection.stageFrom || 'N/A'} → {inspection.stageTo || 'Inspection'}
                          </Text>
                        </View>

                        <View style={styles.inspectionCardRow}>
                          <Ionicons name="person-outline" size={16} color="#64748B" />
                          <Text style={styles.inspectionCardLabel}>Assigned:</Text>
                          <Text style={styles.inspectionCardValue}>
                            {inspection.assignedTo || 'Not assigned'}
                          </Text>
                        </View>

                        <View style={styles.inspectionCardRow}>
                          <Ionicons name="clipboard-outline" size={16} color="#64748B" />
                          <Text style={styles.inspectionCardLabel}>Type:</Text>
                          <View style={[styles.inspectionStatusBadge, { backgroundColor: getStatusColor(inspection.status) + '20' }]}>
                            <Text style={[styles.inspectionStatusText, { color: getStatusColor(inspection.status) }]}>
                              {inspection.status}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.inspectionsEmpty}>
                  <Ionicons name="clipboard-outline" size={64} color="#CBD5E1" />
                  <Text style={styles.inspectionsEmptyTitle}>No Inspections Yet</Text>
                  <Text style={styles.inspectionsEmptyText}>
                    Create your first inspection to track project progress
                  </Text>
                </View>
              )}
            </View>
          ) : activeTab === 'logs' ? (
            // Logs Tab Content - Status Change History
            <View style={styles.logsContainer}>
              <Text style={styles.logsTitle}>Status Change History</Text>
              <Text style={styles.logsSubtitle}>Track all status updates for this project</Text>
              
              {project.statusLogs && project.statusLogs.length > 0 ? (
                <View style={styles.logsTimeline}>
                  {project.statusLogs.map((log: any, index: number) => (
                    <View key={log.id || index} style={styles.logItem}>
                      {/* Timeline Connector */}
                      <View style={styles.timelineConnector}>
                        <View style={[styles.timelineDot, { backgroundColor: getStatusColor(log.newStatus) }]} />
                        {index < project.statusLogs.length - 1 && (
                          <View style={styles.timelineLine} />
                        )}
                      </View>
                      
                      {/* Log Content */}
                      <View style={styles.logContent}>
                        <View style={styles.logHeader}>
                          <Text style={styles.logChangeText}>
                            Status changed from{' '}
                            <Text style={[styles.logStatusBadge, { color: getStatusColor(log.oldStatus) }]}>
                              {log.oldStatus}
                            </Text>
                            {' '}to{' '}
                            <Text style={[styles.logStatusBadge, { color: getStatusColor(log.newStatus) }]}>
                              {log.newStatus}
                            </Text>
                          </Text>
                        </View>
                        
                        <View style={styles.logDetails}>
                          <View style={styles.logDetailRow}>
                            <Ionicons name="calendar-outline" size={16} color="#64748B" />
                            <Text style={styles.logDetailText}>
                              {new Date(log.timestamp).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </Text>
                          </View>
                          
                          <View style={styles.logDetailRow}>
                            <Ionicons name="time-outline" size={16} color="#64748B" />
                            <Text style={styles.logDetailText}>
                              {new Date(log.timestamp).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </Text>
                          </View>
                        </View>
                        
                        {log.note && (
                          <View style={styles.logNote}>
                            <Ionicons name="document-text-outline" size={16} color="#4F46E5" />
                            <Text style={styles.logNoteText}>{log.note}</Text>
                          </View>
                        )}
                        
                        {log.changedBy && (
                          <View style={styles.logFooter}>
                            <Ionicons name="person-outline" size={14} color="#94A3B8" />
                            <Text style={styles.logChangedBy}>Changed by: {log.changedBy}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.logsEmpty}>
                  <Ionicons name="document-text-outline" size={64} color="#CBD5E1" />
                  <Text style={styles.logsEmptyTitle}>No Status Changes Yet</Text>
                  <Text style={styles.logsEmptyText}>
                    Status change history will appear here when the project status is updated
                  </Text>
                </View>
              )}
            </View>
          ) : activeTab === 'permits' ? (
            // Permits Tab Content
            <View style={styles.permitsContainer}>
              <View style={styles.permitsHeader}>
                <Text style={styles.permitsTitle}>Permits</Text>
                <TouchableOpacity
                  style={styles.addPermitButton}
                  onPress={async () => {
                    try {
                      // Use DocumentPicker to support both images and PDFs
                      const result = await DocumentPicker.getDocumentAsync({
                        type: ['image/*', 'application/pdf'],
                        copyToCacheDirectory: true,
                      });
                      
                      if (result.canceled || !result.assets || result.assets.length === 0) {
                        return;
                      }

                      const file = result.assets[0];
                      setIsExtractingPermit(true);
                      
                      try {
                        // Read file as base64
                        const fileBase64 = await fetch(file.uri)
                          .then(res => res.blob())
                          .then(blob => {
                            return new Promise<string | undefined>((resolve, reject) => {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const base64String = reader.result?.toString().split(',')[1];
                                resolve(base64String);
                              };
                              reader.onerror = reject;
                              reader.readAsDataURL(blob);
                            });
                          });

                        if (!fileBase64) {
                          throw new Error('Could not read permit file');
                        }

                        // Send to backend for AI extraction
                        const response = await fetch(buildApiUrl('/api/extract-permit'), {
                          method: 'POST',
                          headers: getAuthHeaders({
                            'Content-Type': 'application/json',
                          }),
                          body: JSON.stringify({
                            imageBase64: fileBase64,
                          }),
                        });

                        if (!response.ok) {
                          throw new Error(`Extraction failed with status ${response.status}`);
                        }
                        
                        const data = await response.json();
                        
                        if (data.success) {
                          // Show preview modal with extracted data
                          setPermitPreviewData({
                            id: `permit-${Date.now()}`,
                            fileUri: file.uri,
                            fileName: file.name,
                            fileType: file.mimeType,
                            permitNumber: data.permitNumber || '',
                            issueDate: data.issueDate || '',
                            expirationDate: data.expirationDate || '',
                            fees: data.fees || '',
                          });
                          setShowPermitPreview(true);
                        } else {
                          Alert.alert('Extraction Failed', data.error || 'Could not extract permit data. Please enter manually.');
                        }
                      } catch (error) {
                        console.error('Extraction error:', error);
                        Alert.alert('Error', 'Failed to process permit. Please try again.');
                      } finally {
                        setIsExtractingPermit(false);
                      }
                    } catch (err) {
                      console.error('Document picker error:', err);
                    }
                  }}
                >
                  <Ionicons name="add-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.addPermitButtonText}>Add Permit</Text>
                </TouchableOpacity>
              </View>

              {permits.length > 0 ? (
                <View style={styles.permitsGrid}>
                  {permits.map((permit) => (
                    <View key={permit.id} style={styles.permitCard}>
                      {/* Permit Image/PDF Preview */}
                      <TouchableOpacity
                        style={styles.permitImageContainer}
                        onPress={() => {
                          if (Platform.OS !== 'web') {
                            // Open file externally on mobile
                            Linking.openURL(permit.fileUri);
                          } else {
                            // Open in new tab on web
                            window.open(permit.fileUri, '_blank');
                          }
                        }}
                      >
                        {permit.fileType === 'application/pdf' ? (
                          // PDF Icon for PDFs
                          <View style={styles.permitPdfPlaceholder}>
                            <Ionicons name="document-text" size={64} color="#EF4444" />
                            <Text style={styles.permitPdfText}>PDF Document</Text>
                            <Text style={styles.permitFileName}>{permit.fileName}</Text>
                          </View>
                        ) : (
                          // Image preview for images
                          <Image
                            source={{ uri: permit.fileUri }}
                            style={styles.permitImage}
                            resizeMode="cover"
                          />
                        )}
                        <View style={styles.permitViewOverlay}>
                          <Ionicons name="eye" size={24} color="#FFFFFF" />
                          <Text style={styles.permitViewText}>View</Text>
                        </View>
                      </TouchableOpacity>

                      {/* Permit Details */}
                      <View style={styles.permitDetails}>
                        <View style={styles.permitRow}>
                          <Text style={styles.permitLabel}>Permit #:</Text>
                          <Text style={styles.permitValue}>{permit.permitNumber || 'N/A'}</Text>
                        </View>
                        <View style={styles.permitRow}>
                          <Text style={styles.permitLabel}>Issue Date:</Text>
                          <Text style={styles.permitValue}>{permit.issueDate || 'N/A'}</Text>
                        </View>
                        <View style={styles.permitRow}>
                          <Text style={styles.permitLabel}>Expiration:</Text>
                          <Text style={styles.permitValue}>{permit.expirationDate || 'N/A'}</Text>
                        </View>
                        <View style={styles.permitRow}>
                          <Text style={styles.permitLabel}>Fees:</Text>
                          <Text style={styles.permitValue}>{permit.fees || 'N/A'}</Text>
                        </View>
                      </View>

                      {/* Action Buttons */}
                      <View style={styles.permitActions}>
                        <TouchableOpacity
                          style={styles.permitActionButton}
                          onPress={() => {
                            setPermitPreviewData(permit);
                            setShowPermitPreview(true);
                          }}
                        >
                          <Ionicons name="pencil" size={16} color="#4F46E5" />
                          <Text style={styles.permitActionText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.permitActionButton}
                          onPress={async () => {
                            try {
                              // Format permit details as text
                              const permitText = `Permit Details\n\nPermit Number: ${permit.permitNumber || 'N/A'}\nIssue Date: ${permit.issueDate || 'N/A'}\nExpiration: ${permit.expirationDate || 'N/A'}\nFees: ${permit.fees || 'N/A'}`;
                              
                              if (Platform.OS === 'web') {
                                // Web: Use Share API with text only
                                try {
                                  await Share.share({
                                    message: permitText,
                                    title: 'Share Permit',
                                  });
                                } catch (error) {
                                  Alert.alert('Share', permitText);
                                }
                              } else {
                                // Mobile: Share file with expo-sharing
                                const isAvailable = await Sharing.isAvailableAsync();
                                if (!isAvailable) {
                                  Alert.alert('Error', 'Sharing is not available on this device');
                                  return;
                                }
                                
                                // For remote URLs, download to cache first
                                if (permit.fileUri.startsWith('http')) {
                                  const filename = permit.fileName || `permit_${permit.permitNumber}.${permit.fileType === 'application/pdf' ? 'pdf' : 'jpg'}`;
                                  const fileUri = FileSystem.cacheDirectory + filename;
                                  
                                  await FileSystem.downloadAsync(permit.fileUri, fileUri);
                                  await Sharing.shareAsync(fileUri, {
                                    dialogTitle: 'Share Permit',
                                    mimeType: permit.fileType,
                                  });
                                } else {
                                  // Local file
                                  await Sharing.shareAsync(permit.fileUri, {
                                    dialogTitle: 'Share Permit',
                                    mimeType: permit.fileType,
                                  });
                                }
                              }
                            } catch (error) {
                              console.error('Share error:', error);
                              Alert.alert('Error', 'Failed to share permit');
                            }
                          }}
                        >
                          <Ionicons name="share-social" size={16} color="#10B981" />
                          <Text style={styles.permitShareText}>Share</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.permitActionButton}
                          onPress={() => {
                            Alert.alert(
                              'Delete Permit',
                              'Are you sure you want to delete this permit?',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Delete',
                                  style: 'destructive',
                                  onPress: () => {
                                    const updatedPermits = permits.filter(p => p.id !== permit.id);
                                    setPermits(updatedPermits);
                                    // Update project data
                                    updateProject(project.id, { permits: updatedPermits });
                                  },
                                },
                              ]
                            );
                          }}
                        >
                          <Ionicons name="trash" size={16} color="#EF4444" />
                          <Text style={styles.permitDeleteText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.permitsEmpty}>
                  <Ionicons name="document-text-outline" size={64} color="#CBD5E1" />
                  <Text style={styles.permitsEmptyTitle}>No Permits Yet</Text>
                  <Text style={styles.permitsEmptyText}>
                    Upload your first permit to get started
                  </Text>
                </View>
              )}

              {/* Loading Overlay */}
              {isExtractingPermit && (
                <View style={styles.extractingOverlay}>
                  <View style={styles.extractingContent}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                    <Text style={styles.extractingText}>Extracting permit data...</Text>
                  </View>
                </View>
              )}
            </View>
          ) : activeTab === 'task' ? (
            // Task/Checklist Tab Content with Sub-tabs
            <View style={styles.taskContainer}>
              {/* Sub-tabs Navigation */}
              <View style={styles.subTabsContainer}>
                <TouchableOpacity
                  style={[styles.subTab, taskSubTab === 'task' && styles.subTabActive]}
                  onPress={() => setTaskSubTab('task')}
                >
                  <Text style={[styles.subTabText, taskSubTab === 'task' && styles.subTabTextActive]}>Task</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.subTab, taskSubTab === 'checklist' && styles.subTabActive]}
                  onPress={() => setTaskSubTab('checklist')}
                >
                  <Text style={[styles.subTabText, taskSubTab === 'checklist' && styles.subTabTextActive]}>Checklist</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.subTab, taskSubTab === 'materials' && styles.subTabActive]}
                  onPress={() => setTaskSubTab('materials')}
                >
                  <Text style={[styles.subTabText, taskSubTab === 'materials' && styles.subTabTextActive]}>Materials</Text>
                </TouchableOpacity>
              </View>

              {/* Task Sub-tab Content */}
              {taskSubTab === 'task' ? (
                <View style={styles.subTabContent}>
                  <View style={styles.taskHeader}>
                    <Text style={styles.taskTitle}>Tasks</Text>
                    <TouchableOpacity
                      style={styles.addTaskButton}
                      onPress={() => {
                        // Reset form
                        setNewTaskTitle('');
                        setNewTaskCategories([
                          { id: 'cat-temp-1', name: '', items: [{ id: 'item-temp-1', text: '' }] }
                        ]);
                        setShowAddTaskModal(true);
                      }}
                    >
                      <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                      <Text style={styles.addTaskButtonText}>Add Manual Task</Text>
                    </TouchableOpacity>
                  </View>

                  {project?.tasks && project.tasks.length > 0 ? (
                    <View style={styles.taskList}>
                      {project.tasks.map((task: any, taskIndex: number) => {
                        const isCollapsed = collapsedTasks[task.id] || false;
                    
                    // Calculate progress
                    const totalItems = task.categories.reduce((sum: number, cat: any) => sum + cat.items.length, 0);
                    const completedItems = task.categories.reduce((sum: number, cat: any) => 
                      sum + cat.items.filter((item: any) => item.checked).length, 0
                    );
                    const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
                    
                    return (
                      <View key={task.id} style={styles.taskCard}>
                        {/* Reorder Arrows */}
                        <View style={styles.reorderButtons}>
                          {taskIndex > 0 && (
                            <TouchableOpacity
                              style={styles.reorderButton}
                              onPress={() => {
                                const newTasks = [...project.tasks];
                                [newTasks[taskIndex], newTasks[taskIndex - 1]] = [newTasks[taskIndex - 1], newTasks[taskIndex]];
                                setProject({ ...project, tasks: newTasks });
                                updateProject(project.id, { tasks: newTasks });
                              }}
                            >
                              <Ionicons name="chevron-up" size={20} color="#64748B" />
                            </TouchableOpacity>
                          )}
                          {taskIndex < project.tasks.length - 1 && (
                            <TouchableOpacity
                              style={styles.reorderButton}
                              onPress={() => {
                                const newTasks = [...project.tasks];
                                [newTasks[taskIndex], newTasks[taskIndex + 1]] = [newTasks[taskIndex + 1], newTasks[taskIndex]];
                                setProject({ ...project, tasks: newTasks });
                                updateProject(project.id, { tasks: newTasks });
                              }}
                            >
                              <Ionicons name="chevron-down" size={20} color="#64748B" />
                            </TouchableOpacity>
                          )}
                        </View>

                        {/* Task Header with Collapse Toggle */}
                        <TouchableOpacity
                          style={styles.taskCardHeaderClickable}
                          onPress={() => {
                            setCollapsedTasks({
                              ...collapsedTasks,
                              [task.id]: !isCollapsed
                            });
                          }}
                          activeOpacity={0.7}
                        >
                            <View style={styles.taskCardHeader}>
                              <View style={styles.taskCardTitleRow}>
                                <Ionicons 
                                  name={isCollapsed ? "chevron-forward" : "chevron-down"} 
                                  size={24} 
                                  color="#4F46E5" 
                                  style={styles.collapseIcon}
                                />
                                <View style={styles.taskTitleAndProgress}>
                                  <Text style={styles.taskCardTitle}>{task.title}</Text>
                                  {/* Progress Badge */}
                                  <View style={styles.progressContainer}>
                                    <View style={styles.progressBar}>
                                      <View style={[
                                        styles.progressFill, 
                                        { width: `${progressPercentage}%` },
                                        progressPercentage === 100 && styles.progressFillComplete
                                      ]} />
                                    </View>
                                    <Text style={[
                                      styles.progressText,
                                      progressPercentage === 100 && styles.progressTextComplete
                                    ]}>
                                      {progressPercentage === 100 ? 'Fully Completed' : `${progressPercentage}%`}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                              <View style={styles.taskCardActions}>
                                <TouchableOpacity
                                  style={styles.editTaskButton}
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    // Pre-populate modal with task data
                                    setEditingTaskId(task.id);
                                    setNewTaskTitle(task.title);
                                    setNewTaskCategories(task.categories.map((cat: any) => ({
                                      ...cat,
                                      items: cat.items.map((item: any) => ({
                                        id: item.id,
                                        text: item.text
                                      }))
                                    })));
                                    setShowAddTaskModal(true);
                                  }}
                                >
                                  <Ionicons name="create-outline" size={18} color="#64748B" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.assignTeamButton}
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    setSelectedTask(task);
                                    setShowTeamAssignModal(true);
                                  }}
                                >
                                  <Ionicons name="person-add" size={18} color="#4F46E5" />
                                </TouchableOpacity>
                              </View>
                            </View>
                          </TouchableOpacity>

                        {/* Collapsible Content */}
                        {!isCollapsed && (
                          <View style={styles.taskCardContent}>
                            {/* Assigned Team */}
                            {task.assignedTeam && task.assignedTeam.length > 0 && (
                              <View style={styles.assignedTeamContainer}>
                                <Text style={styles.assignedTeamLabel}>Assigned to:</Text>
                                <View style={styles.assignedTeamList}>
                                  {task.assignedTeam.map((member: any, index: number) => (
                                    <View key={index} style={styles.teamMemberChip}>
                                      <Text style={styles.teamMemberName}>{member}</Text>
                                    </View>
                                  ))}
                                </View>
                              </View>
                            )}

                            {/* Task Categories with Checkboxes */}
                            {task.categories.map((category: any, catIndex: number) => (
                              <View key={category.id} style={styles.taskCategory}>
                                <Text style={styles.taskCategoryName}>{category.name}</Text>
                                {category.items.map((item: any, itemIndex: number) => (
                                  <View key={item.id} style={styles.taskItemContainer}>
                                    <View style={styles.taskItemRow}>
                                      {/* Item Reorder Arrows */}
                                      <View style={styles.itemReorderButtons}>
                                        {itemIndex > 0 && (
                                          <TouchableOpacity
                                            style={styles.itemReorderButton}
                                            onPress={() => {
                                              const updatedTasks = project.tasks.map((t: any) => {
                                                if (t.id === task.id) {
                                                  return {
                                                    ...t,
                                                    categories: t.categories.map((cat: any, idx: number) => {
                                                      if (idx === catIndex) {
                                                        const newItems = [...cat.items];
                                                        [newItems[itemIndex], newItems[itemIndex - 1]] = [newItems[itemIndex - 1], newItems[itemIndex]];
                                                        return { ...cat, items: newItems };
                                                      }
                                                      return cat;
                                                    })
                                                  };
                                                }
                                                return t;
                                              });
                                              setProject({ ...project, tasks: updatedTasks });
                                              updateProject(project.id, { tasks: updatedTasks });
                                            }}
                                          >
                                            <Ionicons name="chevron-up" size={14} color="#94A3B8" />
                                          </TouchableOpacity>
                                        )}
                                        {itemIndex < category.items.length - 1 && (
                                          <TouchableOpacity
                                            style={styles.itemReorderButton}
                                            onPress={() => {
                                              const updatedTasks = project.tasks.map((t: any) => {
                                                if (t.id === task.id) {
                                                  return {
                                                    ...t,
                                                    categories: t.categories.map((cat: any, idx: number) => {
                                                      if (idx === catIndex) {
                                                        const newItems = [...cat.items];
                                                        [newItems[itemIndex], newItems[itemIndex + 1]] = [newItems[itemIndex + 1], newItems[itemIndex]];
                                                        return { ...cat, items: newItems };
                                                      }
                                                      return cat;
                                                    })
                                                  };
                                                }
                                                return t;
                                              });
                                              setProject({ ...project, tasks: updatedTasks });
                                              updateProject(project.id, { tasks: updatedTasks });
                                            }}
                                          >
                                            <Ionicons name="chevron-down" size={14} color="#94A3B8" />
                                          </TouchableOpacity>
                                        )}
                                      </View>
                                      
                                      <TouchableOpacity
                                        style={styles.taskItem}
                                        onPress={() => {
                                          // Toggle checkbox
                                          const updatedTasks = project.tasks.map((t: any) => {
                                            if (t.id === task.id) {
                                              return {
                                                ...t,
                                                categories: t.categories.map((cat: any) => {
                                                  if (cat.id === category.id) {
                                                    return {
                                                      ...cat,
                                                      items: cat.items.map((itm: any) => 
                                                        itm.id === item.id ? { ...itm, checked: !itm.checked } : itm
                                                      )
                                                    };
                                                  }
                                                  return cat;
                                                })
                                              };
                                            }
                                            return t;
                                          });
                                          setProject({ ...project, tasks: updatedTasks });
                                          updateProject(project.id, { tasks: updatedTasks });
                                        }}
                                      >
                                        <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                                          {item.checked && (
                                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                          )}
                                        </View>
                                        <Text style={[styles.taskItemText, item.checked && styles.taskItemTextChecked]}>
                                          {item.text}
                                        </Text>
                                      </TouchableOpacity>
                                      
                                      {/* Camera Icon */}
                                      <TouchableOpacity
                                        style={styles.cameraIconButton}
                                        onPress={() => {
                                          setSelectedTaskItem({ taskId: task.id, categoryId: category.id, itemId: item.id });
                                          setShowPhotoOptionsModal(true);
                                        }}
                                      >
                                        <Ionicons name="camera" size={20} color="#64748B" />
                                      </TouchableOpacity>
                                    </View>
                                    
                                    {/* Photo Preview - Multiple Photos */}
                                    {item.photos && item.photos.length > 0 && (
                                      <View style={styles.taskPhotoPreviewContainer}>
                                        {item.photos.slice(0, 5).map((photoUri: string, photoIndex: number) => (
                                          <TouchableOpacity
                                            key={photoIndex}
                                            style={styles.taskPhotoPreview}
                                            onPress={() => {
                                              setSelectedTaskItem({ 
                                                taskId: task.id, 
                                                categoryId: category.id, 
                                                itemId: item.id,
                                                photos: item.photos,
                                                selectedPhotoIndex: photoIndex
                                              });
                                              setCurrentPhotoIndex(photoIndex);
                                              setSelectedTaskPhoto(photoUri);
                                              setShowTaskPhotoViewer(true);
                                            }}
                                          >
                                            <Image
                                              source={{ uri: photoUri }}
                                              style={styles.taskPhotoThumbnail}
                                              resizeMode="cover"
                                            />
                                          </TouchableOpacity>
                                        ))}
                                        {item.photos.length > 5 && (
                                          <View style={styles.morePhotosIndicator}>
                                            <Ionicons name="images" size={20} color="#4F46E5" />
                                            <Text style={styles.morePhotosText}>+{item.photos.length - 5}</Text>
                                          </View>
                                        )}
                                      </View>
                                    )}
                                  </View>
                                ))}
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
                  ) : (
                    <View style={styles.taskEmpty}>
                      <Ionicons name="checkmark-circle-outline" size={64} color="#CBD5E1" />
                      <Text style={styles.taskEmptyTitle}>No Tasks Yet</Text>
                      <Text style={styles.taskEmptyText}>
                        Create your first task to get started
                      </Text>
                    </View>
                  )}
                </View>
              ) : taskSubTab === 'checklist' ? (
                /* Checklist Sub-tab Content - Blue Theme */
                <View style={styles.subTabContent}>
                  <View style={styles.taskHeader}>
                    <Text style={styles.taskTitle}>Checklists</Text>
                    <TouchableOpacity
                      style={styles.addChecklistButton}
                      onPress={() => {
                        // Reset form
                        setEditingChecklistId(null);
                        setNewChecklistTitle('');
                        setNewChecklistCategories([
                          { id: 'cat-temp-1', name: '', items: [{ id: 'item-temp-1', text: '' }] }
                        ]);
                        setShowAddChecklistModal(true);
                      }}
                    >
                      <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                      <Text style={styles.addChecklistButtonText}>Add Manual Checklist</Text>
                    </TouchableOpacity>
                  </View>

                  {project?.checklists && project.checklists.length > 0 ? (
                    <View style={styles.taskList}>
                      {project.checklists.map((checklist: any, checklistIndex: number) => {
                        const isCollapsed = collapsedChecklists[checklist.id] || false;
                    
                        // Calculate progress
                        const totalItems = checklist.categories.reduce((sum: number, cat: any) => sum + cat.items.length, 0);
                        const completedItems = checklist.categories.reduce((sum: number, cat: any) => 
                          sum + cat.items.filter((item: any) => item.checked).length, 0
                        );
                        const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
                    
                        return (
                          <View key={checklist.id} style={styles.checklistCard}>
                            {/* Reorder Arrows */}
                            <View style={styles.reorderButtons}>
                              {checklistIndex > 0 && (
                                <TouchableOpacity
                                  style={styles.reorderButton}
                                  onPress={() => {
                                    const newChecklists = [...project.checklists];
                                    [newChecklists[checklistIndex], newChecklists[checklistIndex - 1]] = [newChecklists[checklistIndex - 1], newChecklists[checklistIndex]];
                                    setProject({ ...project, checklists: newChecklists });
                                    updateProject(project.id, { checklists: newChecklists });
                                  }}
                                >
                                  <Ionicons name="chevron-up" size={20} color="#64748B" />
                                </TouchableOpacity>
                              )}
                              {checklistIndex < project.checklists.length - 1 && (
                                <TouchableOpacity
                                  style={styles.reorderButton}
                                  onPress={() => {
                                    const newChecklists = [...project.checklists];
                                    [newChecklists[checklistIndex], newChecklists[checklistIndex + 1]] = [newChecklists[checklistIndex + 1], newChecklists[checklistIndex]];
                                    setProject({ ...project, checklists: newChecklists });
                                    updateProject(project.id, { checklists: newChecklists });
                                  }}
                                >
                                  <Ionicons name="chevron-down" size={20} color="#64748B" />
                                </TouchableOpacity>
                              )}
                            </View>

                            {/* Checklist Header with Collapse Toggle */}
                            <TouchableOpacity
                              style={styles.checklistCardHeaderClickable}
                              onPress={() => {
                                setCollapsedChecklists({
                                  ...collapsedChecklists,
                                  [checklist.id]: !isCollapsed
                                });
                              }}
                              activeOpacity={0.7}
                            >
                              <View style={styles.checklistCardHeader}>
                                <View style={styles.taskCardTitleRow}>
                                  <Ionicons 
                                    name={isCollapsed ? "chevron-forward" : "chevron-down"} 
                                    size={24} 
                                    color="#3B82F6" 
                                    style={styles.collapseIcon}
                                  />
                                  <View style={styles.taskTitleAndProgress}>
                                    <Text style={styles.checklistCardTitle}>{checklist.title}</Text>
                                    {/* Progress Badge */}
                                    <View style={styles.progressContainer}>
                                      <View style={styles.checklistProgressBar}>
                                        <View style={[
                                          styles.checklistProgressFill, 
                                          { width: `${progressPercentage}%` },
                                          progressPercentage === 100 && styles.checklistProgressFillComplete
                                        ]} />
                                      </View>
                                      <Text style={[
                                        styles.checklistProgressText,
                                        progressPercentage === 100 && styles.checklistProgressTextComplete
                                      ]}>
                                        {progressPercentage === 100 ? 'Fully Completed' : `${progressPercentage}%`}
                                      </Text>
                                    </View>
                                  </View>
                                </View>
                                <View style={styles.taskCardActions}>
                                  <TouchableOpacity
                                    style={styles.editChecklistButton}
                                    onPress={(e) => {
                                      e.stopPropagation();
                                      // Pre-populate modal with checklist data
                                      setEditingChecklistId(checklist.id);
                                      setNewChecklistTitle(checklist.title);
                                      setNewChecklistCategories(checklist.categories.map((cat: any) => ({
                                        ...cat,
                                        items: cat.items.map((item: any) => ({
                                          id: item.id,
                                          text: item.text
                                        }))
                                      })));
                                      setShowAddChecklistModal(true);
                                    }}
                                  >
                                    <Ionicons name="create-outline" size={18} color="#64748B" />
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={styles.assignChecklistTeamButton}
                                    onPress={(e) => {
                                      e.stopPropagation();
                                      setSelectedChecklist(checklist);
                                      setShowTeamAssignModal(true);
                                    }}
                                  >
                                    <Ionicons name="person-add" size={18} color="#3B82F6" />
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </TouchableOpacity>

                            {/* Collapsible Content */}
                            {!isCollapsed && (
                              <View style={styles.checklistCardContent}>
                                {/* Assigned Team */}
                                {checklist.assignedTeam && checklist.assignedTeam.length > 0 && (
                                  <View style={styles.assignedTeamContainer}>
                                    <Text style={styles.assignedTeamLabel}>Assigned to:</Text>
                                    <View style={styles.assignedTeamList}>
                                      {checklist.assignedTeam.map((member: string, index: number) => (
                                        <View key={index} style={styles.checklistTeamMemberChip}>
                                          <Text style={styles.checklistTeamMemberName}>{member}</Text>
                                        </View>
                                      ))}
                                    </View>
                                  </View>
                                )}

                                {/* Checklist Categories with Checkboxes */}
                                {checklist.categories.map((category: any, catIndex: number) => (
                                  <View key={category.id} style={styles.taskCategory}>
                                    <Text style={styles.checklistCategoryName}>{category.name}</Text>
                                    {category.items.map((item: any, itemIndex: number) => (
                                      <View key={item.id} style={styles.taskItemContainer}>
                                        <View style={styles.taskItemRow}>
                                          {/* Item Reorder Arrows */}
                                          <View style={styles.itemReorderButtons}>
                                            {itemIndex > 0 && (
                                              <TouchableOpacity
                                                style={styles.itemReorderButton}
                                                onPress={() => {
                                                  const updatedChecklists = project.checklists.map((cl: any) => {
                                                    if (cl.id === checklist.id) {
                                                      return {
                                                        ...cl,
                                                        categories: cl.categories.map((cat: any, idx: number) => {
                                                          if (idx === catIndex) {
                                                            const newItems = [...cat.items];
                                                            [newItems[itemIndex], newItems[itemIndex - 1]] = [newItems[itemIndex - 1], newItems[itemIndex]];
                                                            return { ...cat, items: newItems };
                                                          }
                                                          return cat;
                                                        })
                                                      };
                                                    }
                                                    return cl;
                                                  });
                                                  setProject({ ...project, checklists: updatedChecklists });
                                                  updateProject(project.id, { checklists: updatedChecklists });
                                                }}
                                              >
                                                <Ionicons name="chevron-up" size={14} color="#94A3B8" />
                                              </TouchableOpacity>
                                            )}
                                            {itemIndex < category.items.length - 1 && (
                                              <TouchableOpacity
                                                style={styles.itemReorderButton}
                                                onPress={() => {
                                                  const updatedChecklists = project.checklists.map((cl: any) => {
                                                    if (cl.id === checklist.id) {
                                                      return {
                                                        ...cl,
                                                        categories: cl.categories.map((cat: any, idx: number) => {
                                                          if (idx === catIndex) {
                                                            const newItems = [...cat.items];
                                                            [newItems[itemIndex], newItems[itemIndex + 1]] = [newItems[itemIndex + 1], newItems[itemIndex]];
                                                            return { ...cat, items: newItems };
                                                          }
                                                          return cat;
                                                        })
                                                      };
                                                    }
                                                    return cl;
                                                  });
                                                  setProject({ ...project, checklists: updatedChecklists });
                                                  updateProject(project.id, { checklists: updatedChecklists });
                                                }}
                                              >
                                                <Ionicons name="chevron-down" size={14} color="#94A3B8" />
                                              </TouchableOpacity>
                                            )}
                                          </View>
                                          
                                          <TouchableOpacity
                                            style={styles.taskItem}
                                            onPress={() => {
                                              // Toggle checkbox
                                              const updatedChecklists = project.checklists.map((cl: any) => {
                                                if (cl.id === checklist.id) {
                                                  return {
                                                    ...cl,
                                                    categories: cl.categories.map((cat: any) => {
                                                      if (cat.id === category.id) {
                                                        return {
                                                          ...cat,
                                                          items: cat.items.map((itm: any) => 
                                                            itm.id === item.id ? { ...itm, checked: !itm.checked } : itm
                                                          )
                                                        };
                                                      }
                                                      return cat;
                                                    })
                                                  };
                                                }
                                                return cl;
                                              });
                                              setProject({ ...project, checklists: updatedChecklists });
                                              updateProject(project.id, { checklists: updatedChecklists });
                                            }}
                                          >
                                            <View style={[styles.checklistCheckbox, item.checked && styles.checklistCheckboxChecked]}>
                                              {item.checked && (
                                                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                              )}
                                            </View>
                                            <Text style={[styles.taskItemText, item.checked && styles.taskItemTextChecked]}>
                                              {item.text}
                                            </Text>
                                          </TouchableOpacity>
                                          
                                          {/* Camera Icon */}
                                          <TouchableOpacity
                                            style={styles.cameraIconButton}
                                            onPress={() => {
                                              setSelectedChecklistItem({ checklistId: checklist.id, categoryId: category.id, itemId: item.id });
                                              setShowChecklistPhotoOptionsModal(true);
                                            }}
                                          >
                                            <Ionicons name="camera" size={20} color="#64748B" />
                                          </TouchableOpacity>
                                        </View>
                                        
                                        {/* Photo Preview - Multiple Photos */}
                                        {item.photos && item.photos.length > 0 && (
                                          <View style={styles.taskPhotoPreviewContainer}>
                                            {item.photos.slice(0, 5).map((photoUri: string, photoIndex: number) => (
                                              <TouchableOpacity
                                                key={photoIndex}
                                                style={styles.taskPhotoPreview}
                                                onPress={() => {
                                                  setSelectedChecklistItem({ 
                                                    checklistId: checklist.id, 
                                                    categoryId: category.id, 
                                                    itemId: item.id,
                                                    photos: item.photos,
                                                    selectedPhotoIndex: photoIndex
                                                  });
                                                  setCurrentChecklistPhotoIndex(photoIndex);
                                                  setShowChecklistPhotoViewer(true);
                                                }}
                                              >
                                                <Image
                                                  source={{ uri: photoUri }}
                                                  style={styles.taskPhotoThumbnail}
                                                  resizeMode="cover"
                                                />
                                              </TouchableOpacity>
                                            ))}
                                            {item.photos.length > 5 && (
                                              <View style={styles.morePhotosIndicatorBlue}>
                                                <Ionicons name="images" size={20} color="#3B82F6" />
                                                <Text style={styles.morePhotosTextBlue}>+{item.photos.length - 5}</Text>
                                              </View>
                                            )}
                                          </View>
                                        )}
                                      </View>
                                    ))}
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={styles.taskEmpty}>
                      <Ionicons name="list-outline" size={64} color="#CBD5E1" />
                      <Text style={styles.taskEmptyTitle}>No Checklists Yet</Text>
                      <Text style={styles.taskEmptyText}>
                        Create your first checklist to get started
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                /* Materials Sub-tab Content - Orange/Amber Theme */
                <View style={styles.subTabContent}>
                  <View style={styles.taskHeader}>
                    <Text style={styles.taskTitle}>Material Lists</Text>
                    <TouchableOpacity
                      style={styles.addMaterialButton}
                      onPress={() => {
                        // Reset form
                        setEditingMaterialListId(null);
                        setNewMaterialListName('');
                        setNewMaterialListPickupLocation('');
                        setNewMaterialListPickupAddress('');
                        setNewMaterialListDueDate('');
                        setNewMaterialListPriority('medium');
                        setNewMaterialListNotes('');
                        setNewMaterialListUrl('');
                        setNewMaterialListItems([
                          { id: 'mat-item-temp-1', name: '', quantity: '', unit: 'pieces', estimatedCost: '', purchased: false, url: '' }
                        ]);
                        setShowAddMaterialListModal(true);
                      }}
                    >
                      <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                      <Text style={styles.addMaterialButtonText}>Create Material List</Text>
                    </TouchableOpacity>
                  </View>

                  {project?.materialLists && project.materialLists.length > 0 ? (
                    <View style={styles.taskList}>
                      {project.materialLists.map((materialList: any, listIndex: number) => {
                        const isCollapsed = collapsedMaterials[materialList.id] || false;
                    
                        // Calculate progress and costs
                        const totalItems = materialList.items?.length || 0;
                        const purchasedItems = materialList.items?.filter((item: any) => item.purchased).length || 0;
                        const progressPercentage = totalItems > 0 ? Math.round((purchasedItems / totalItems) * 100) : 0;
                        const totalEstimatedCost = materialList.items?.reduce((sum: number, item: any) => {
                          const cost = parseFloat(item.estimatedCost) || 0;
                          const qty = parseFloat(item.quantity) || 1;
                          return sum + (cost * qty);
                        }, 0) || 0;
                    
                        return (
                          <View key={materialList.id} style={styles.materialCard}>
                            {/* Reorder Arrows */}
                            <View style={styles.reorderButtons}>
                              {listIndex > 0 && (
                                <TouchableOpacity
                                  style={styles.reorderButton}
                                  onPress={() => {
                                    const newLists = [...project.materialLists];
                                    [newLists[listIndex], newLists[listIndex - 1]] = [newLists[listIndex - 1], newLists[listIndex]];
                                    setProject({ ...project, materialLists: newLists });
                                    updateProject(project.id, { materialLists: newLists });
                                  }}
                                >
                                  <Ionicons name="chevron-up" size={20} color="#64748B" />
                                </TouchableOpacity>
                              )}
                              {listIndex < project.materialLists.length - 1 && (
                                <TouchableOpacity
                                  style={styles.reorderButton}
                                  onPress={() => {
                                    const newLists = [...project.materialLists];
                                    [newLists[listIndex], newLists[listIndex + 1]] = [newLists[listIndex + 1], newLists[listIndex]];
                                    setProject({ ...project, materialLists: newLists });
                                    updateProject(project.id, { materialLists: newLists });
                                  }}
                                >
                                  <Ionicons name="chevron-down" size={20} color="#64748B" />
                                </TouchableOpacity>
                              )}
                            </View>

                            {/* Material List Header */}
                            <View style={styles.materialCardHeaderContainer}>
                              {/* Clickable area for collapse/expand */}
                              <TouchableOpacity
                                style={styles.materialCardHeaderClickable}
                                onPress={() => {
                                  setCollapsedMaterials({
                                    ...collapsedMaterials,
                                    [materialList.id]: !isCollapsed
                                  });
                                }}
                                activeOpacity={0.7}
                              >
                                <View style={styles.materialCardHeaderLeft}>
                                  <Ionicons 
                                    name={isCollapsed ? "chevron-forward" : "chevron-down"} 
                                    size={24} 
                                    color="#F59E0B" 
                                    style={styles.collapseIcon}
                                  />
                                  <View style={styles.materialTitleAndInfo}>
                                    <View style={styles.materialTitleRow}>
                                      <Text style={styles.materialCardTitle}>{materialList.name}</Text>
                                      {/* Priority Badge */}
                                      <View style={[
                                        styles.priorityBadge,
                                        materialList.priority === 'high' && styles.priorityBadgeHigh,
                                        materialList.priority === 'medium' && styles.priorityBadgeMedium,
                                        materialList.priority === 'low' && styles.priorityBadgeLow,
                                      ]}>
                                        <Text style={[
                                          styles.priorityBadgeText,
                                          materialList.priority === 'high' && styles.priorityBadgeTextHigh,
                                          materialList.priority === 'medium' && styles.priorityBadgeTextMedium,
                                          materialList.priority === 'low' && styles.priorityBadgeTextLow,
                                        ]}>
                                          {materialList.priority?.toUpperCase()}
                                        </Text>
                                      </View>
                                    </View>
                                    {/* Pickup Location */}
                                    {materialList.pickupLocation && (
                                      <View style={styles.pickupLocationRow}>
                                        <Ionicons name="location" size={14} color="#F59E0B" />
                                        <Text style={styles.pickupLocationText}>{materialList.pickupLocation}</Text>
                                      </View>
                                    )}
                                    {/* Progress Bar */}
                                    <View style={styles.progressContainer}>
                                      <View style={styles.materialProgressBar}>
                                        <View style={[
                                          styles.materialProgressFill, 
                                          { width: `${progressPercentage}%` },
                                          progressPercentage === 100 && styles.materialProgressFillComplete
                                        ]} />
                                      </View>
                                      <Text style={[
                                        styles.materialProgressText,
                                        progressPercentage === 100 && styles.materialProgressTextComplete
                                      ]}>
                                        {purchasedItems}/{totalItems} items
                                      </Text>
                                    </View>
                                    {/* Estimated Cost */}
                                    <Text style={styles.materialCostText}>
                                      Est. Total: ${totalEstimatedCost.toFixed(2)}
                                    </Text>
                                  </View>
                                </View>
                              </TouchableOpacity>
                              
                              {/* Action Buttons - OUTSIDE the clickable area */}
                              <View style={styles.materialCardActions}>
                                <TouchableOpacity
                                  style={styles.editMaterialButton}
                                  onPress={() => {
                                    // Pre-populate modal
                                    setEditingMaterialListId(materialList.id);
                                    setNewMaterialListName(materialList.name);
                                    setNewMaterialListPickupLocation(materialList.pickupLocation || '');
                                    setNewMaterialListPickupAddress(materialList.pickupAddress || '');
                                    setNewMaterialListDueDate(materialList.dueDate || '');
                                    setNewMaterialListPriority(materialList.priority || 'medium');
                                    setNewMaterialListNotes(materialList.notes || '');
                                    setNewMaterialListItems(materialList.items?.map((item: any) => ({
                                      id: item.id,
                                      name: item.name,
                                      quantity: item.quantity,
                                      unit: item.unit,
                                      estimatedCost: item.estimatedCost,
                                      purchased: item.purchased,
                                      url: item.url || ''
                                    })) || []);
                                    setShowAddMaterialListModal(true);
                                  }}
                                >
                                  <Ionicons name="create-outline" size={18} color="#64748B" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.assignMaterialTeamButton}
                                  onPress={() => {
                                    setSelectedMaterialList(materialList);
                                    setShowMaterialTeamAssignModal(true);
                                  }}
                                >
                                  <Ionicons name="person-add" size={18} color="#F59E0B" />
                                </TouchableOpacity>
                              </View>
                            </View>

                            {/* Collapsible Content */}
                            {!isCollapsed && (
                              <View style={styles.materialCardContent}>
                                {/* Assigned Team */}
                                {materialList.assignedTeam && materialList.assignedTeam.length > 0 && (
                                  <View style={styles.materialAssignedTeamContainer}>
                                    <Text style={styles.materialAssignedTeamLabel}>Assigned to pickup:</Text>
                                    <View style={styles.assignedTeamList}>
                                      {materialList.assignedTeam.map((member: string, index: number) => (
                                        <View key={index} style={styles.materialTeamMemberChip}>
                                          <Text style={styles.materialTeamMemberName}>{member}</Text>
                                        </View>
                                      ))}
                                    </View>
                                  </View>
                                )}

                                {/* Pickup Info */}
                                {(materialList.pickupAddress || materialList.dueDate) && (
                                  <View style={styles.materialInfoSection}>
                                    {materialList.pickupAddress && (
                                      <TouchableOpacity 
                                        style={styles.materialAddressRow}
                                        onPress={() => {
                                          const address = encodeURIComponent(materialList.pickupAddress);
                                          const url = Platform.select({
                                            ios: `maps://maps.apple.com/?q=${address}`,
                                            android: `geo:0,0?q=${address}`,
                                            default: `https://www.google.com/maps/search/?api=1&query=${address}`
                                          });
                                          Linking.openURL(url).catch(err => {
                                            // Fallback to Google Maps web URL
                                            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${address}`).catch(() => {
                                              Alert.alert('Error', 'Could not open maps');
                                            });
                                          });
                                        }}
                                      >
                                        <Ionicons name="navigate" size={16} color="#F59E0B" />
                                        <Text style={styles.materialAddressText}>{materialList.pickupAddress}</Text>
                                        <Ionicons name="open-outline" size={14} color="#F59E0B" />
                                      </TouchableOpacity>
                                    )}
                                    {materialList.dueDate && (
                                      <View style={styles.materialInfoRow}>
                                        <Ionicons name="calendar" size={16} color="#92400E" />
                                        <Text style={styles.materialInfoText}>Due: {materialList.dueDate}</Text>
                                      </View>
                                    )}
                                  </View>
                                )}

                                {/* Notes */}
                                {materialList.notes && (
                                  <View style={styles.materialNotesContainer}>
                                    <Text style={styles.materialNotesLabel}>Notes:</Text>
                                    <Text style={styles.materialNotesText}>{materialList.notes}</Text>
                                  </View>
                                )}

                                {/* Material Items */}
                                <View style={styles.materialItemsSection}>
                                  <Text style={styles.materialItemsSectionTitle}>Items to Purchase</Text>
                                  {materialList.items?.map((item: any, itemIndex: number) => (
                                    <View key={item.id} style={styles.materialItemContainer}>
                                      <View style={styles.materialItemRow}>
                                        {/* Item Reorder Arrows */}
                                        <View style={styles.itemReorderButtons}>
                                          {itemIndex > 0 && (
                                            <TouchableOpacity
                                              style={styles.itemReorderButton}
                                              onPress={() => {
                                                const updatedLists = project.materialLists.map((ml: any) => {
                                                  if (ml.id === materialList.id) {
                                                    const newItems = [...ml.items];
                                                    [newItems[itemIndex], newItems[itemIndex - 1]] = [newItems[itemIndex - 1], newItems[itemIndex]];
                                                    return { ...ml, items: newItems };
                                                  }
                                                  return ml;
                                                });
                                                setProject({ ...project, materialLists: updatedLists });
                                                updateProject(project.id, { materialLists: updatedLists });
                                              }}
                                            >
                                              <Ionicons name="chevron-up" size={14} color="#94A3B8" />
                                            </TouchableOpacity>
                                          )}
                                          {itemIndex < (materialList.items?.length || 0) - 1 && (
                                            <TouchableOpacity
                                              style={styles.itemReorderButton}
                                              onPress={() => {
                                                const updatedLists = project.materialLists.map((ml: any) => {
                                                  if (ml.id === materialList.id) {
                                                    const newItems = [...ml.items];
                                                    [newItems[itemIndex], newItems[itemIndex + 1]] = [newItems[itemIndex + 1], newItems[itemIndex]];
                                                    return { ...ml, items: newItems };
                                                  }
                                                  return ml;
                                                });
                                                setProject({ ...project, materialLists: updatedLists });
                                                updateProject(project.id, { materialLists: updatedLists });
                                              }}
                                            >
                                              <Ionicons name="chevron-down" size={14} color="#94A3B8" />
                                            </TouchableOpacity>
                                          )}
                                        </View>
                                        
                                        <TouchableOpacity
                                          style={styles.materialItem}
                                          onPress={() => {
                                            // Toggle purchased status
                                            const updatedLists = project.materialLists.map((ml: any) => {
                                              if (ml.id === materialList.id) {
                                                return {
                                                  ...ml,
                                                  items: ml.items.map((itm: any) => 
                                                    itm.id === item.id ? { ...itm, purchased: !itm.purchased } : itm
                                                  )
                                                };
                                              }
                                              return ml;
                                            });
                                            setProject({ ...project, materialLists: updatedLists });
                                            updateProject(project.id, { materialLists: updatedLists });
                                          }}
                                        >
                                          <View style={[styles.materialCheckbox, item.purchased && styles.materialCheckboxChecked]}>
                                            {item.purchased && (
                                              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                            )}
                                          </View>
                                          <View style={styles.materialItemDetails}>
                                            <Text style={[styles.materialItemName, item.purchased && styles.materialItemNamePurchased]}>
                                              {item.name}
                                            </Text>
                                            {/* Item URL Link */}
                                            {item.url && (
                                              <TouchableOpacity 
                                                style={styles.materialItemUrlLink}
                                                onPress={(e) => {
                                                  e.stopPropagation();
                                                  let url = item.url;
                                                  if (!url.startsWith('http://') && !url.startsWith('https://')) {
                                                    url = 'https://' + url;
                                                  }
                                                  Linking.openURL(url).catch(err => {
                                                    Alert.alert('Error', 'Could not open URL');
                                                  });
                                                }}
                                              >
                                                <Ionicons name="link" size={12} color="#F59E0B" />
                                                <Text style={styles.materialItemUrlText} numberOfLines={1}>
                                                  {item.url}
                                                </Text>
                                                <Ionicons name="open-outline" size={10} color="#F59E0B" />
                                              </TouchableOpacity>
                                            )}
                                            <View style={styles.materialItemMeta}>
                                              <Text style={styles.materialItemQuantity}>
                                                Qty: {item.quantity} {item.unit}
                                              </Text>
                                              {item.estimatedCost && (
                                                <Text style={styles.materialItemCost}>
                                                  ${(parseFloat(item.estimatedCost) * (parseFloat(item.quantity) || 1)).toFixed(2)}
                                                </Text>
                                              )}
                                            </View>
                                          </View>
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                  ))}
                                </View>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={styles.taskEmpty}>
                      <Ionicons name="cube-outline" size={64} color="#CBD5E1" />
                      <Text style={styles.taskEmptyTitle}>No Material Lists Yet</Text>
                      <Text style={styles.taskEmptyText}>
                        Create your first material list to manage supplies for this project
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.tabContentText}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} content goes here
            </Text>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Delete Warning Modal */}
      <Modal
        visible={showDeleteWarning}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteWarning(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <TouchableOpacity 
            style={styles.deleteModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowDeleteWarning(false)}
          />
          
          <View style={styles.deleteModalContainer}>
            {/* Warning Icon */}
            <View style={styles.deleteWarningIconContainer}>
              <Ionicons name="warning" size={48} color="#EF4444" />
            </View>

            {/* Title */}
            <Text style={styles.deleteModalTitle}>Delete Project?</Text>

            {/* Description */}
            <Text style={styles.deleteModalDescription}>
              You are about to permanently delete
            </Text>
            <Text style={styles.deleteModalProjectName}>{project.name}</Text>

            {/* Warning Box */}
            <View style={styles.deleteWarningBox}>
              <Text style={styles.deleteWarningTitle}>
                ⚠️ Warning: This action cannot be undone!
              </Text>
              <View style={styles.deleteWarningList}>
                <View style={styles.deleteWarningItem}>
                  <Text style={styles.deleteWarningBullet}>•</Text>
                  <Text style={styles.deleteWarningText}>
                    All project files will be permanently deleted
                  </Text>
                </View>
                <View style={styles.deleteWarningItem}>
                  <Text style={styles.deleteWarningBullet}>•</Text>
                  <Text style={styles.deleteWarningText}>
                    There is no backup or recovery option
                  </Text>
                </View>
                <View style={styles.deleteWarningItem}>
                  <Text style={styles.deleteWarningBullet}>•</Text>
                  <Text style={styles.deleteWarningText}>
                    All associated data will be lost forever
                  </Text>
                </View>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteCancelButton}
                onPress={() => setShowDeleteWarning(false)}
              >
                <Text style={styles.deleteCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirmButton}
                onPress={handleDeleteProject}
              >
                <Text style={styles.deleteConfirmButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.shareModalOverlay}>
          <TouchableOpacity 
            style={styles.shareModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowShareModal(false)}
          />
          
          <View style={styles.shareModalContainer}>
            {/* Header */}
            <View style={styles.shareModalHeader}>
              <Text style={styles.shareModalTitle}>Share Contact</Text>
              <TouchableOpacity
                style={styles.shareModalClose}
                onPress={() => setShowShareModal(false)}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Share Options */}
            <View style={styles.shareOptions}>
              {/* Save to Device */}
              <TouchableOpacity
                style={styles.shareOption}
                onPress={handleSaveToDevice}
              >
                <View style={[styles.shareOptionIcon, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="phone-portrait" size={24} color="#3B82F6" />
                </View>
                <View style={styles.shareOptionContent}>
                  <Text style={styles.shareOptionTitle}>Save to device</Text>
                  <Text style={styles.shareOptionDescription}>
                    Save full contact to your phone
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>

              {/* Share in OffiAxis Spaces */}
              <TouchableOpacity
                style={styles.shareOption}
                onPress={handleShareInSpaces}
              >
                <View style={[styles.shareOptionIcon, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="people" size={24} color="#9333EA" />
                </View>
                <View style={styles.shareOptionContent}>
                  <Text style={styles.shareOptionTitle}>Share in OffiAxis Spaces</Text>
                  <Text style={styles.shareOptionDescription}>
                    Share within the app
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>

              {/* Share as Text */}
              <TouchableOpacity
                style={styles.shareOption}
                onPress={handleShareAsText}
              >
                <View style={[styles.shareOptionIcon, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="chatbubble-ellipses" size={24} color="#16A34A" />
                </View>
                <View style={styles.shareOptionContent}>
                  <Text style={styles.shareOptionTitle}>Share as a text file</Text>
                  <Text style={styles.shareOptionDescription}>
                    Open in messaging app
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Contact Details Modal - Matching Reference Design */}
      {selectedContact && (
        <Modal
          visible={showContactModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setShowContactModal(false);
            setIsEditingContact(false);
            setIsAddingNote(false);
            setIsAddingNewContact(false);
          }}
        >
          <View style={styles.newContactModalOverlay}>
            {/* Backdrop */}
            <TouchableOpacity 
              style={styles.newContactModalBackdrop}
              activeOpacity={1}
              onPress={() => {
                setShowContactModal(false);
                setIsEditingContact(false);
                setIsAddingNote(false);
              }}
            />
            
            {/* Modal Container */}
            <View style={styles.newContactModalContainer}>
              {/* Header with Gradient */}
              <LinearGradient
                colors={['#4F46E5', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.newContactModalHeader}
              >
                <Text style={styles.newContactModalTitle}>
                  {isAddingNewContact ? 'Add New Contact' : 'Contact Details'}
                </Text>
                <View style={styles.newContactModalHeaderButtons}>
                  {/* Delete Button */}
                  {!isAddingNewContact && (
                    <TouchableOpacity
                      style={styles.newContactModalHeaderButton}
                      onPress={handleDeleteContactClick}
                    >
                      <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                  {/* Close Button */}
                  <TouchableOpacity
                    style={styles.newContactModalHeaderButton}
                    onPress={() => {
                      setShowContactModal(false);
                      setIsEditingContact(false);
                      setIsAddingNote(false);
                      setIsAddingNewContact(false);
                    }}
                  >
                    <Ionicons name="close" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              {/* Content */}
              <ScrollView style={styles.newContactModalContent}>
                {/* Full Name */}
                <View style={styles.newContactField}>
                  <Text style={styles.newContactFieldLabel}>Full Name</Text>
                  {isEditingContact ? (
                    <TextInput
                      style={styles.newContactInput}
                      value={editedContactData.name}
                      onChangeText={(text) => setEditedContactData({...editedContactData, name: text})}
                      placeholder="Enter name"
                    />
                  ) : (
                    <Text style={styles.newContactFieldValue}>{selectedContact.name}</Text>
                  )}
                </View>

                {/* Phone Number */}
                <View style={styles.newContactField}>
                  <Text style={styles.newContactFieldLabel}>Phone Number</Text>
                  {isEditingContact ? (
                    <TextInput
                      style={styles.newContactInput}
                      value={editedContactData.phone}
                      onChangeText={(text) => setEditedContactData({...editedContactData, phone: text})}
                      placeholder="Enter phone"
                      keyboardType="phone-pad"
                    />
                  ) : (
                    <View style={styles.newContactFieldRow}>
                      <Text style={styles.newContactFieldValue}>{selectedContact.phone}</Text>
                      {/* Call Button */}
                      <TouchableOpacity 
                        style={[styles.newContactActionButton, styles.callButton]}
                        onPress={handleCall}
                      >
                        <Text style={styles.newContactActionButtonText}>Call</Text>
                      </TouchableOpacity>
                      {/* Text Button */}
                      <TouchableOpacity 
                        style={[styles.newContactActionButton, styles.textButton]}
                        onPress={handleText}
                      >
                        <Text style={styles.newContactActionButtonText}>Text</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Email */}
                <View style={styles.newContactField}>
                  <Text style={styles.newContactFieldLabel}>Email</Text>
                  {isEditingContact ? (
                    <TextInput
                      style={styles.newContactInput}
                      value={editedContactData.email}
                      onChangeText={(text) => setEditedContactData({...editedContactData, email: text})}
                      placeholder="Enter email"
                      keyboardType="email-address"
                    />
                  ) : (
                    <View style={styles.newContactFieldRow}>
                      <Text style={styles.newContactFieldValue}>{selectedContact.email}</Text>
                      {/* Email Button */}
                      <TouchableOpacity 
                        style={[styles.newContactActionButton, styles.emailButton]}
                        onPress={handleEmail}
                      >
                        <Text style={styles.newContactActionButtonText}>Email</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Note Section - Only show when not editing */}
                {!isEditingContact && (
                  <View style={styles.newContactField}>
                    <Text style={styles.newContactFieldLabel}>Note</Text>
                    {isAddingNote ? (
                      <View style={styles.noteEditContainer}>
                        <TextInput
                          style={styles.noteTextArea}
                          value={noteText}
                          onChangeText={setNoteText}
                          placeholder="Add a short message..."
                          multiline
                          numberOfLines={3}
                        />
                        <View style={styles.noteEditButtons}>
                          <TouchableOpacity
                            style={styles.noteSaveButton}
                            onPress={handleSaveNote}
                          >
                            <Text style={styles.noteSaveButtonText}>Save Note</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.noteCancelButton}
                            onPress={() => {
                              setIsAddingNote(false);
                              setNoteText(selectedContact.note || '');
                            }}
                          >
                            <Text style={styles.noteCancelButtonText}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View>
                        {selectedContact.note ? (
                          <View style={styles.noteDisplayBox}>
                            <Text style={styles.noteDisplayText}>{selectedContact.note}</Text>
                          </View>
                        ) : (
                          <Text style={styles.noteEmptyText}>No note added</Text>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>

              {/* Footer Actions */}
              <View style={styles.newContactModalFooter}>
                {isEditingContact ? (
                  /* Edit Mode Buttons */
                  <View style={styles.newContactModalFooterRow}>
                    <TouchableOpacity
                      style={[
                        styles.newContactModalFooterButton,
                        styles.saveButton,
                        (!editedContactData.name || !editedContactData.phone || !editedContactData.email) && styles.disabledButton
                      ]}
                      onPress={handleSaveContact}
                      disabled={!editedContactData.name || !editedContactData.phone || !editedContactData.email}
                    >
                      <Text style={styles.saveButtonText}>
                        {isAddingNewContact ? 'Add Contact' : 'Save'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.newContactModalFooterButton, styles.cancelButton]}
                      onPress={() => {
                        if (isAddingNewContact) {
                          setShowContactModal(false);
                          setIsAddingNewContact(false);
                        }
                        setIsEditingContact(false);
                        setEditedContactData(selectedContact);
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* View Mode Buttons */
                  <View style={styles.newContactModalFooterRow}>
                    <TouchableOpacity
                      style={[styles.newContactModalFooterButton, styles.noteButton]}
                      onPress={() => setIsAddingNote(true)}
                    >
                      <Ionicons name="add" size={16} color="#475569" />
                      <Text style={styles.noteButtonText}>Note</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.newContactModalFooterButton, styles.editButton]}
                      onPress={() => setIsEditingContact(true)}
                    >
                      <Ionicons name="pencil" size={16} color="#FFFFFF" />
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Contact Delete Warning Modal - Matching Reference Design */}
      <Modal
        visible={showContactDeleteWarning}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowContactDeleteWarning(false)}
      >
        <View style={styles.newContactModalOverlay}>
          {/* Backdrop */}
          <TouchableOpacity 
            style={styles.newContactModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowContactDeleteWarning(false)}
          />
          
          {/* Warning Modal */}
          <View style={styles.newContactModalContainer}>
            {/* Red Warning Header */}
            <View style={styles.deleteWarningHeader}>
              <View style={styles.deleteWarningIconCircle}>
                <Ionicons name="warning" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.deleteWarningHeaderText}>
                Warning: This action cannot be undone!
              </Text>
            </View>

            {/* Warning Content */}
            <View style={styles.deleteWarningContent}>
              <View style={styles.deleteWarningItem}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" style={styles.deleteWarningItemIcon} />
                <Text style={styles.deleteWarningItemText}>
                  This contact will be permanently deleted
                </Text>
              </View>
              <View style={styles.deleteWarningItem}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" style={styles.deleteWarningItemIcon} />
                <Text style={styles.deleteWarningItemText}>
                  There is no backup or recovery option
                </Text>
              </View>
              <View style={styles.deleteWarningItem}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" style={styles.deleteWarningItemIcon} />
                <Text style={styles.deleteWarningItemText}>
                  All associated data will be lost forever
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.newContactModalFooter}>
              <View style={styles.newContactModalFooterRow}>
                <TouchableOpacity
                  style={[styles.newContactModalFooterButton, styles.cancelButton]}
                  onPress={() => setShowContactDeleteWarning(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.newContactModalFooterButton, styles.deleteConfirmButton]}
                  onPress={confirmDeleteContact}
                >
                  <Text style={styles.deleteConfirmButtonText}>Delete Contact</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Customer Info Modal */}
      <Modal
        visible={showCustomerEditModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCustomerEditModal(false)}
      >
        <View style={styles.newContactModalOverlay}>
          {/* Backdrop */}
          <TouchableOpacity 
            style={styles.newContactModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowCustomerEditModal(false)}
          />
          
          {/* Modal Container */}
          <View style={styles.newContactModalContainer}>
            {/* Header */}
            <LinearGradient
              colors={['#6366F1', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.newContactModalHeader}
            >
              <Text style={styles.newContactModalTitle}>Edit Customer Info</Text>
              <TouchableOpacity
                style={styles.newContactModalHeaderButton}
                onPress={() => setShowCustomerEditModal(false)}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>

            {/* Content - Scrollable */}
            <ScrollView style={styles.customerEditModalContent}>
              {/* Name Field */}
              <View style={styles.newContactField}>
                <Text style={styles.newContactFieldLabel}>Name</Text>
                <TextInput
                  style={styles.newContactInput}
                  value={customerEditData.name}
                  onChangeText={(text) => setCustomerEditData({ ...customerEditData, name: text })}
                  placeholder="Enter customer name"
                />
              </View>

              {/* Company Field - Dropdown */}
              <View style={styles.newContactField}>
                <Text style={styles.newContactFieldLabel}>Company</Text>
                <TouchableOpacity
                  style={styles.companyDropdownButton}
                  onPress={() => setShowCompanyDropdown(!showCompanyDropdown)}
                >
                  <Text style={[
                    styles.companyDropdownButtonText,
                    !customerEditData.company && styles.companyDropdownPlaceholder
                  ]}>
                    {customerEditData.company || 'Select Company (Optional)'}
                  </Text>
                  <Ionicons 
                    name={showCompanyDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#64748B" 
                  />
                </TouchableOpacity>

                {/* Company Dropdown Menu */}
                {showCompanyDropdown && (
                  <View style={styles.companyDropdownMenu}>
                    {/* Option to clear selection */}
                    <TouchableOpacity
                      style={[
                        styles.companyDropdownItem,
                        !customerEditData.company && styles.companyDropdownItemSelected
                      ]}
                      onPress={() => {
                        setCustomerEditData({ ...customerEditData, company: '' });
                        setShowCompanyDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.companyDropdownItemText,
                        !customerEditData.company && styles.companyDropdownItemTextSelected
                      ]}>
                        No Company
                      </Text>
                      {!customerEditData.company && (
                        <Ionicons name="checkmark" size={20} color="#4F46E5" />
                      )}
                    </TouchableOpacity>
                    
                    {/* Company options */}
                    {companies.map((company) => (
                      <TouchableOpacity
                        key={company.id}
                        style={[
                          styles.companyDropdownItem,
                          customerEditData.company === company.name && styles.companyDropdownItemSelected
                        ]}
                        onPress={() => {
                          setCustomerEditData({ ...customerEditData, company: company.name });
                          setShowCompanyDropdown(false);
                        }}
                      >
                        <View style={styles.companyDropdownItemContent}>
                          <View style={styles.companyDropdownInitials}>
                            <Text style={styles.companyDropdownInitialsText}>{company.initials}</Text>
                          </View>
                          <Text style={[
                            styles.companyDropdownItemText,
                            customerEditData.company === company.name && styles.companyDropdownItemTextSelected
                          ]}>
                            {company.name}
                          </Text>
                        </View>
                        {customerEditData.company === company.name && (
                          <Ionicons name="checkmark" size={20} color="#4F46E5" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Street Field */}
              <View style={styles.newContactField}>
                <Text style={styles.newContactFieldLabel}>Street</Text>
                <TextInput
                  style={styles.newContactInput}
                  value={customerEditData.street}
                  onChangeText={(text) => setCustomerEditData({ ...customerEditData, street: text })}
                  placeholder="Enter street address"
                />
              </View>

              {/* City Field */}
              <View style={styles.newContactField}>
                <Text style={styles.newContactFieldLabel}>City</Text>
                <TextInput
                  style={styles.newContactInput}
                  value={customerEditData.city}
                  onChangeText={(text) => setCustomerEditData({ ...customerEditData, city: text })}
                  placeholder="Enter city"
                />
              </View>

              {/* Phone Field */}
              <View style={styles.newContactField}>
                <Text style={styles.newContactFieldLabel}>Phone</Text>
                <TextInput
                  style={styles.newContactInput}
                  value={customerEditData.phone}
                  onChangeText={(text) => setCustomerEditData({ ...customerEditData, phone: text })}
                  placeholder="(555) 555-5555"
                  keyboardType="phone-pad"
                />
              </View>

              {/* Email Field */}
              <View style={styles.newContactField}>
                <Text style={styles.newContactFieldLabel}>Email</Text>
                <TextInput
                  style={styles.newContactInput}
                  value={customerEditData.email}
                  onChangeText={(text) => setCustomerEditData({ ...customerEditData, email: text })}
                  placeholder="customer@example.com"
                  keyboardType="email-address"
                />
              </View>
            </ScrollView>

            {/* Footer - Fixed at bottom */}
            <View style={styles.newContactModalFooter}>
              <View style={styles.newContactModalFooterRow}>
                <TouchableOpacity
                  style={[styles.newContactModalFooterButton, styles.cancelButton]}
                  onPress={() => setShowCustomerEditModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.newContactModalFooterButton, styles.saveButton]}
                  onPress={handleSaveCustomerDetails}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Property Details Modal */}
      <EditPropertyDetailsModal
        visible={showPropertyEditModal}
        onClose={() => setShowPropertyEditModal(false)}
        propertyDescription={editPropertyDescription}
        accessCode={editAccessCode}
        locationImageUrl={editLocationImageUrl}
        onPropertyDescriptionChange={setEditPropertyDescription}
        onAccessCodeChange={setEditAccessCode}
        onLocationImageUrlChange={setEditLocationImageUrl}
        onSave={() => {
          const updatedProject = {
            ...project,
            propertyDescription: editPropertyDescription,
            accessCode: editAccessCode,
            locationImageUrl: editLocationImageUrl
          };
          setProject(updatedProject);
          updateProject(project.id, updatedProject);
          setShowPropertyEditModal(false);
        }}
      />

      {/* Image Viewer Modal */}
      <ImageViewerModal
        visible={showImageViewerModal}
        onClose={() => setShowImageViewerModal(false)}
        imageUrl={project?.locationImageUrl}
        accessCode={project?.accessCode}
        propertyDescription={project?.propertyDescription}
        onImagePress={() => {
          if (project?.locationImageUrl) {
            setShowFullScreenImage(true);
          }
        }}
      />

      {/* Full Screen Image Viewer with Zoom */}
      <FullScreenImageModal
        visible={showFullScreenImage}
        onClose={() => {
          setShowFullScreenImage(false);
          // Reopen Edit Permit modal if we came from there
          if (permitPreviewData) {
            setShowPermitPreview(true);
          }
        }}
        imageUrl={permitPreviewData?.fileUri || project?.locationImageUrl}
      />

      {/* Permit Preview Modal */}
      <PermitPreviewModal
        visible={showPermitPreview}
        onClose={() => setShowPermitPreview(false)}
        permitData={permitPreviewData}
        onPermitDataChange={setPermitPreviewData}
        isEditMode={permitPreviewData?.id && permits.find(p => p.id === permitPreviewData.id) ? true : false}
        onOpenFullScreen={() => {
          setShowPermitPreview(false);
          setShowFullScreenImage(true);
        }}
        onSave={() => {
          if (!permitPreviewData?.permitNumber?.trim()) {
            Alert.alert('Required Field', 'Please enter a permit number');
            return;
          }

          const existingIndex = permits.findIndex(p => p.id === permitPreviewData.id);
          let updatedPermits;
          const today = new Date().toISOString().split('T')[0];

          if (existingIndex >= 0) {
            // Update existing - keep original dateAdded
            updatedPermits = permits.map(p =>
              p.id === permitPreviewData.id ? permitPreviewData : p
            );
          } else {
            // Add new - add dateAdded field
            const newPermit = {
              ...permitPreviewData,
              dateAdded: today
            };
            updatedPermits = [newPermit, ...permits];
          }

          setPermits(updatedPermits);
          // Update project data
          updateProject(project.id, { permits: updatedPermits });
          
          setShowPermitPreview(false);
          setPermitPreviewData(null);
        }}
      />

      {/* Inspection Detail Modal */}
      <InspectionDetailModal
        visible={showInspectionDetail}
        inspection={selectedInspection}
        onClose={() => {
          setShowInspectionDetail(false);
          setSelectedInspection(null);
        }}
        onSave={(updatedInspection) => {
          const existingIndex = inspections.findIndex(i => i.id === updatedInspection.id);
          let newInspections;
          
          if (existingIndex >= 0) {
            // Update existing (keep in same position)
            newInspections = inspections.map(i => 
              i.id === updatedInspection.id ? updatedInspection : i
            );
          } else {
            // Add new (at the top)
            newInspections = [updatedInspection, ...inspections];
          }
          
          setInspections(newInspections);
          // Also update in project data
          const updatedProject = { ...project, inspections: newInspections };
          setProject(updatedProject);
          updateProject(project.id, { inspections: newInspections });
        }}
        statusOptions={inspectionStatusOptions}
        onAddCustomStatus={(status) => {
          setInspectionStatusOptions([...inspectionStatusOptions, status]);
        }}
        onDeleteStatus={(status) => {
          setInspectionStatusOptions(inspectionStatusOptions.filter(s => s !== status));
        }}
      />

      {/* Team Assignment Modal */}
      <Modal
        visible={showTeamAssignModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTeamAssignModal(false)}
      >
        <View style={styles.teamModalOverlay}>
          <View style={styles.teamModalContainer}>
            <View style={styles.teamModalHeader}>
              <Text style={styles.teamModalTitle}>Assign Team Members</Text>
              <TouchableOpacity
                onPress={() => setShowTeamAssignModal(false)}
                style={styles.teamModalCloseButton}
              >
                <Ionicons name="close" size={28} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.teamModalContent}>
              {['Azis K', 'Oumayama M', 'Sarah Williams', 'Emely Davis'].map((member) => (
                <TouchableOpacity
                  key={member}
                  style={styles.teamMemberOption}
                  onPress={() => {
                    if (!selectedTask) return;

                    const isAssigned = selectedTask.assignedTeam?.includes(member);
                    let updatedTeam;

                    if (isAssigned) {
                      // Remove member
                      updatedTeam = selectedTask.assignedTeam.filter((m: string) => m !== member);
                    } else {
                      // Add member
                      updatedTeam = [...(selectedTask.assignedTeam || []), member];
                    }

                    // Update the task
                    const updatedTasks = project.tasks.map((t: any) => 
                      t.id === selectedTask.id ? { ...t, assignedTeam: updatedTeam } : t
                    );

                    setProject({ ...project, tasks: updatedTasks });
                    updateProject(project.id, { tasks: updatedTasks });
                    setSelectedTask({ ...selectedTask, assignedTeam: updatedTeam });
                  }}
                >
                  <View style={styles.teamMemberOptionContent}>
                    <View style={styles.teamMemberAvatar}>
                      <Text style={styles.teamMemberAvatarText}>
                        {member.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </View>
                    <Text style={styles.teamMemberOptionName}>{member}</Text>
                  </View>
                  <View style={[
                    styles.teamCheckbox,
                    selectedTask?.assignedTeam?.includes(member) && styles.teamCheckboxChecked
                  ]}>
                    {selectedTask?.assignedTeam?.includes(member) && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.teamModalDoneButton}
              onPress={() => setShowTeamAssignModal(false)}
            >
              <Text style={styles.teamModalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Photo Options Modal */}
      <Modal
        visible={showPhotoOptionsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPhotoOptionsModal(false)}
      >
        <View style={styles.photoOptionsOverlay}>
          <View style={styles.photoOptionsContainer}>
            <View style={styles.photoOptionsHeader}>
              <Text style={styles.photoOptionsTitle}>Add Photo to Task</Text>
              <TouchableOpacity
                onPress={() => setShowPhotoOptionsModal(false)}
                style={styles.photoOptionsCloseButton}
              >
                <Ionicons name="close" size={28} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.photoOptionsButtons}>
              <TouchableOpacity
                style={styles.photoOptionButton}
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
                    quality: 0.8,
                  });
                  
                  if (!result.canceled && result.assets[0] && selectedTaskItem) {
                    // Update the task item by adding photo to photos array
                    const updatedTasks = project.tasks.map((t: any) => {
                      if (t.id === selectedTaskItem.taskId) {
                        return {
                          ...t,
                          categories: t.categories.map((cat: any) => {
                            if (cat.id === selectedTaskItem.categoryId) {
                              return {
                                ...cat,
                                items: cat.items.map((itm: any) => {
                                  if (itm.id === selectedTaskItem.itemId) {
                                    const existingPhotos = itm.photos || [];
                                    return { ...itm, photos: [...existingPhotos, result.assets[0].uri] };
                                  }
                                  return itm;
                                })
                              };
                            }
                            return cat;
                          })
                        };
                      }
                      return t;
                    });
                    setProject({ ...project, tasks: updatedTasks });
                    updateProject(project.id, { tasks: updatedTasks });
                    setShowPhotoOptionsModal(false);
                  }
                }}
              >
                <Ionicons name="camera" size={32} color="#4F46E5" />
                <Text style={styles.photoOptionButtonText}>Take a Picture</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoOptionButton}
                onPress={async () => {
                  // Request gallery permissions
                  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                  if (status !== 'granted') {
                    Alert.alert('Permission Required', 'Photo library permission is required to upload photos.');
                    return;
                  }
                  
                  // Launch gallery with multiple selection
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsMultipleSelection: true,
                    quality: 0.8,
                  });
                  
                  if (!result.canceled && result.assets && result.assets.length > 0 && selectedTaskItem) {
                    // Update the task item by adding all selected photos to photos array
                    const newPhotoUris = result.assets.map(asset => asset.uri);
                    const updatedTasks = project.tasks.map((t: any) => {
                      if (t.id === selectedTaskItem.taskId) {
                        return {
                          ...t,
                          categories: t.categories.map((cat: any) => {
                            if (cat.id === selectedTaskItem.categoryId) {
                              return {
                                ...cat,
                                items: cat.items.map((itm: any) => {
                                  if (itm.id === selectedTaskItem.itemId) {
                                    const existingPhotos = itm.photos || [];
                                    return { ...itm, photos: [...existingPhotos, ...newPhotoUris] };
                                  }
                                  return itm;
                                })
                              };
                            }
                            return cat;
                          })
                        };
                      }
                      return t;
                    });
                    setProject({ ...project, tasks: updatedTasks });
                    updateProject(project.id, { tasks: updatedTasks });
                    setShowPhotoOptionsModal(false);
                  }
                }}
              >
                <Ionicons name="images" size={32} color="#4F46E5" />
                <Text style={styles.photoOptionButtonText}>Upload Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Task Photo Full Screen Viewer with Swipe */}
      <Modal
        visible={showTaskPhotoViewer}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowTaskPhotoViewer(false)}
      >
        <Animated.View 
          style={[
            styles.fullScreenImageOverlay,
            {
              transform: [{ translateY: pan.y }],
              opacity: opacity,
            }
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.photoViewerTopBar}>
            <TouchableOpacity
              style={styles.fullScreenCloseButton}
              onPress={() => setShowTaskPhotoViewer(false)}
            >
              <Ionicons name="close-circle" size={40} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.savePhotoButton}
              onPress={handleSavePhoto}
            >
              <Ionicons name="download" size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {selectedTaskItem?.photos && selectedTaskItem.photos.length > 0 ? (
            <FlatList
              data={selectedTaskItem.photos}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={currentPhotoIndex}
              getItemLayout={(data, index) => {
                const screenWidth = Dimensions.get('window').width;
                return {
                  length: screenWidth,
                  offset: screenWidth * index,
                  index,
                };
              }}
              onMomentumScrollEnd={(event) => {
                const screenWidth = Dimensions.get('window').width;
                const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                setCurrentPhotoIndex(index);
              }}
              renderItem={({ item: photoUri }) => (
                <View style={styles.photoSlide}>
                  <ScrollView
                    style={styles.fullScreenScrollView}
                    contentContainerStyle={styles.fullScreenScrollContent}
                    minimumZoomScale={1}
                    maximumZoomScale={5}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    bouncesZoom={true}
                  >
                    <Image
                      source={{ uri: photoUri }}
                      style={styles.fullScreenImage}
                      resizeMode="contain"
                    />
                  </ScrollView>
                </View>
              )}
              keyExtractor={(item, index) => `photo-${index}`}
            />
          ) : null}

          {/* Photo Counter */}
          {selectedTaskItem?.photos && selectedTaskItem.photos.length > 1 && (
            <View style={styles.photoCounter}>
              <Text style={styles.photoCounterText}>
                {currentPhotoIndex + 1} / {selectedTaskItem.photos.length}
              </Text>
            </View>
          )}

          {/* Swipe Instructions */}
          <View style={styles.swipeInstructionsBadge}>
            <Text style={styles.swipeInstructionsText}>
              {selectedTaskItem?.photos && selectedTaskItem.photos.length > 1 
                ? 'Swipe left/right • Swipe down to close' 
                : 'Swipe down to close • Pinch to zoom'}
            </Text>
          </View>
        </Animated.View>
      </Modal>

      {/* Add Manual Task Modal */}
      <Modal
        visible={showAddTaskModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAddTaskModal(false)}
      >
        <View style={styles.addTaskModalContainer}>
          {/* Header */}
          <LinearGradient
            colors={['#A5D6A7', '#8BC34A', '#7CB342']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addTaskHeader}
          >
            <TouchableOpacity
              onPress={() => {
                setShowAddTaskModal(false);
                setEditingTaskId(null);
              }}
              style={styles.addTaskBackButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.addTaskHeaderTitle}>
              {editingTaskId ? 'Edit Task' : 'Create New Task'}
            </Text>
            <View style={{ width: 24 }} />
          </LinearGradient>

          <ScrollView style={styles.addTaskScrollView}>
            {/* Task Title */}
            <View style={styles.addTaskSection}>
              <Text style={styles.addTaskSectionTitle}>Task Title *</Text>
              <TextInput
                style={styles.addTaskTitleInput}
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                placeholder="e.g., Kitchen Renovation"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Categories */}
            <View style={styles.addTaskSection}>
              <View style={styles.addTaskSectionHeader}>
                <Text style={styles.addTaskSectionTitle}>Categories & Items</Text>
                <TouchableOpacity
                  style={styles.addCategoryButton}
                  onPress={() => {
                    const newCategory = {
                      id: `cat-temp-${Date.now()}`,
                      name: '',
                      items: [{ id: `item-temp-${Date.now()}`, text: '' }]
                    };
                    setNewTaskCategories([...newTaskCategories, newCategory]);
                  }}
                >
                  <Ionicons name="add" size={18} color="#4F46E5" />
                  <Text style={styles.addCategoryButtonText}>Add Category</Text>
                </TouchableOpacity>
              </View>

              {newTaskCategories.map((category, catIndex) => (
                <View key={category.id} style={styles.categoryBlock}>
                  {/* Category Header */}
                  <View style={styles.categoryHeaderRow}>
                    <TextInput
                      style={styles.categoryNameInput}
                      value={category.name}
                      onChangeText={(text) => {
                        const updated = [...newTaskCategories];
                        updated[catIndex].name = text;
                        setNewTaskCategories(updated);
                      }}
                      placeholder="Category name (e.g., Demolition & Removal)"
                      placeholderTextColor="#94A3B8"
                    />
                    {newTaskCategories.length > 1 && (
                      <TouchableOpacity
                        onPress={() => {
                          const updated = newTaskCategories.filter((_, idx) => idx !== catIndex);
                          setNewTaskCategories(updated);
                        }}
                        style={styles.deleteCategoryButton}
                      >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Category Items */}
                  {category.items.map((item, itemIndex) => (
                    <View key={item.id} style={styles.categoryItemRow}>
                      <View style={styles.itemNumberBadge}>
                        <Text style={styles.itemNumberText}>{itemIndex + 1}</Text>
                      </View>
                      <TextInput
                        style={styles.categoryItemInput}
                        value={item.text}
                        onChangeText={(text) => {
                          const updated = [...newTaskCategories];
                          updated[catIndex].items[itemIndex].text = text;
                          setNewTaskCategories(updated);
                        }}
                        placeholder="Item description"
                        placeholderTextColor="#94A3B8"
                        multiline
                      />
                      {category.items.length > 1 && (
                        <TouchableOpacity
                          onPress={() => {
                            const updated = [...newTaskCategories];
                            updated[catIndex].items = updated[catIndex].items.filter((_, idx) => idx !== itemIndex);
                            setNewTaskCategories(updated);
                          }}
                          style={styles.deleteItemButton}
                        >
                          <Ionicons name="close-circle" size={20} color="#94A3B8" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}

                  {/* Add Item Button */}
                  <TouchableOpacity
                    style={styles.addItemButton}
                    onPress={() => {
                      const updated = [...newTaskCategories];
                      updated[catIndex].items.push({
                        id: `item-temp-${Date.now()}`,
                        text: ''
                      });
                      setNewTaskCategories(updated);
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={18} color="#4F46E5" />
                    <Text style={styles.addItemButtonText}>Add Item</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.addTaskFooter}>
            <TouchableOpacity
              style={styles.addTaskCancelButton}
              onPress={() => {
                setShowAddTaskModal(false);
                setEditingTaskId(null);
              }}
            >
              <Text style={styles.addTaskCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addTaskSaveButton}
              onPress={() => {
                // Validation
                if (!newTaskTitle.trim()) {
                  Alert.alert('Required', 'Please enter a task title');
                  return;
                }

                const hasEmptyCategory = newTaskCategories.some(cat => !cat.name.trim());
                if (hasEmptyCategory) {
                  Alert.alert('Required', 'Please fill in all category names');
                  return;
                }

                const hasEmptyItem = newTaskCategories.some(cat => 
                  cat.items.some(item => !item.text.trim())
                );
                if (hasEmptyItem) {
                  Alert.alert('Required', 'Please fill in all item descriptions');
                  return;
                }

                let updatedTasks;

                if (editingTaskId) {
                  // EDIT MODE - Update existing task
                  const existingTask = project.tasks.find((t: any) => t.id === editingTaskId);
                  updatedTasks = project.tasks.map((t: any) => {
                    if (t.id === editingTaskId) {
                      return {
                        ...t,
                        title: newTaskTitle,
                        categories: newTaskCategories.map((cat, catIdx) => ({
                          id: cat.id || `cat-${Date.now()}-${catIdx}`,
                          name: cat.name,
                          items: cat.items.map((item, itemIdx) => {
                            // Find existing item to preserve checked state and photos
                            const existingCat = existingTask?.categories.find((c: any) => c.id === cat.id);
                            const existingItem = existingCat?.items.find((i: any) => i.id === item.id);
                            return {
                              id: item.id || `item-${Date.now()}-${catIdx}-${itemIdx}`,
                              text: item.text,
                              checked: existingItem?.checked || false,
                              photos: existingItem?.photos || []
                            };
                          })
                        }))
                      };
                    }
                    return t;
                  });
                  Alert.alert('Success', 'Task updated successfully!');
                } else {
                  // CREATE MODE - Add new task
                  const newTask = {
                    id: `task-${Date.now()}`,
                    title: newTaskTitle,
                    assignedTeam: [],
                    createdDate: new Date().toISOString().split('T')[0],
                    categories: newTaskCategories.map((cat, catIdx) => ({
                      id: `cat-${Date.now()}-${catIdx}`,
                      name: cat.name,
                      items: cat.items.map((item, itemIdx) => ({
                        id: `item-${Date.now()}-${catIdx}-${itemIdx}`,
                        text: item.text,
                        checked: false,
                        photos: []
                      }))
                    }))
                  };

                  // Add to the TOP of the tasks array
                  updatedTasks = [newTask, ...(project.tasks || [])];

                  // Initialize as collapsed
                  setCollapsedTasks({ ...collapsedTasks, [newTask.id]: true });

                  Alert.alert('Success', 'Task created successfully!');
                }

                setProject({ ...project, tasks: updatedTasks });
                updateProject(project.id, { tasks: updatedTasks });

                // Close modal and reset
                setShowAddTaskModal(false);
                setEditingTaskId(null);
              }}
            >
              <Text style={styles.addTaskSaveText}>
                {editingTaskId ? 'Update Task' : 'Create Task'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Manual Checklist Modal - Blue Theme */}
      <Modal
        visible={showAddChecklistModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAddChecklistModal(false)}
      >
        <View style={styles.addChecklistModalContainer}>
          {/* Header - Blue Metallic */}
          <LinearGradient
            colors={['#60A5FA', '#3B82F6', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addChecklistHeader}
          >
            <TouchableOpacity
              onPress={() => {
                setShowAddChecklistModal(false);
                setEditingChecklistId(null);
              }}
              style={styles.addChecklistBackButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.addChecklistHeaderTitle}>
              {editingChecklistId ? 'Edit Checklist' : 'Create New Checklist'}
            </Text>
            <View style={{ width: 24 }} />
          </LinearGradient>

          <ScrollView style={styles.addChecklistScrollView}>
            {/* Checklist Title */}
            <View style={styles.addChecklistSection}>
              <Text style={styles.addChecklistSectionTitle}>Checklist Title *</Text>
              <TextInput
                style={styles.addChecklistTitleInput}
                value={newChecklistTitle}
                onChangeText={setNewChecklistTitle}
                placeholder="e.g., Pre-Installation Checklist"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Categories */}
            <View style={styles.addChecklistSection}>
              <View style={styles.addChecklistSectionHeader}>
                <Text style={styles.addChecklistSectionTitle}>Categories & Items</Text>
                <TouchableOpacity
                  style={styles.addChecklistCategoryButton}
                  onPress={() => {
                    const newCategory = {
                      id: `cat-temp-${Date.now()}`,
                      name: '',
                      items: [{ id: `item-temp-${Date.now()}`, text: '' }]
                    };
                    setNewChecklistCategories([...newChecklistCategories, newCategory]);
                  }}
                >
                  <Ionicons name="add" size={18} color="#3B82F6" />
                  <Text style={styles.addChecklistCategoryButtonText}>Add Category</Text>
                </TouchableOpacity>
              </View>

              {newChecklistCategories.map((category, catIndex) => (
                <View key={category.id} style={styles.checklistCategoryBlock}>
                  {/* Category Header */}
                  <View style={styles.categoryHeaderRow}>
                    <TextInput
                      style={styles.checklistCategoryNameInput}
                      value={category.name}
                      onChangeText={(text) => {
                        const updated = [...newChecklistCategories];
                        updated[catIndex].name = text;
                        setNewChecklistCategories(updated);
                      }}
                      placeholder="Category name (e.g., Safety Items)"
                      placeholderTextColor="#94A3B8"
                    />
                    {newChecklistCategories.length > 1 && (
                      <TouchableOpacity
                        onPress={() => {
                          const updated = newChecklistCategories.filter((_, idx) => idx !== catIndex);
                          setNewChecklistCategories(updated);
                        }}
                        style={styles.deleteChecklistCategoryButton}
                      >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Category Items */}
                  {category.items.map((item, itemIndex) => (
                    <View key={item.id} style={styles.checklistCategoryItemRow}>
                      <View style={styles.checklistItemNumberBadge}>
                        <Text style={styles.checklistItemNumberText}>{itemIndex + 1}</Text>
                      </View>
                      <TextInput
                        style={styles.checklistCategoryItemInput}
                        value={item.text}
                        onChangeText={(text) => {
                          const updated = [...newChecklistCategories];
                          updated[catIndex].items[itemIndex].text = text;
                          setNewChecklistCategories(updated);
                        }}
                        placeholder="Item description"
                        placeholderTextColor="#94A3B8"
                        multiline
                      />
                      {category.items.length > 1 && (
                        <TouchableOpacity
                          onPress={() => {
                            const updated = [...newChecklistCategories];
                            updated[catIndex].items = updated[catIndex].items.filter((_, idx) => idx !== itemIndex);
                            setNewChecklistCategories(updated);
                          }}
                          style={styles.deleteChecklistItemButton}
                        >
                          <Ionicons name="close-circle" size={20} color="#94A3B8" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}

                  {/* Add Item Button */}
                  <TouchableOpacity
                    style={styles.addChecklistItemButton}
                    onPress={() => {
                      const updated = [...newChecklistCategories];
                      updated[catIndex].items.push({
                        id: `item-temp-${Date.now()}`,
                        text: ''
                      });
                      setNewChecklistCategories(updated);
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={18} color="#3B82F6" />
                    <Text style={styles.addChecklistItemButtonText}>Add Item</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.addChecklistFooter}>
            <TouchableOpacity
              style={styles.addChecklistCancelButton}
              onPress={() => {
                setShowAddChecklistModal(false);
                setEditingChecklistId(null);
              }}
            >
              <Text style={styles.addChecklistCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addChecklistSaveButton}
              onPress={() => {
                // Validation
                if (!newChecklistTitle.trim()) {
                  Alert.alert('Required', 'Please enter a checklist title');
                  return;
                }

                const hasEmptyCategory = newChecklistCategories.some(cat => !cat.name.trim());
                if (hasEmptyCategory) {
                  Alert.alert('Required', 'Please fill in all category names');
                  return;
                }

                const hasEmptyItem = newChecklistCategories.some(cat => 
                  cat.items.some(item => !item.text.trim())
                );
                if (hasEmptyItem) {
                  Alert.alert('Required', 'Please fill in all item descriptions');
                  return;
                }

                let updatedChecklists;

                if (editingChecklistId) {
                  // EDIT MODE - Update existing checklist
                  const existingChecklist = project.checklists?.find((cl: any) => cl.id === editingChecklistId);
                  updatedChecklists = (project.checklists || []).map((cl: any) => {
                    if (cl.id === editingChecklistId) {
                      return {
                        ...cl,
                        title: newChecklistTitle,
                        categories: newChecklistCategories.map((cat, catIdx) => ({
                          id: cat.id || `cat-${Date.now()}-${catIdx}`,
                          name: cat.name,
                          items: cat.items.map((item, itemIdx) => {
                            // Find existing item to preserve checked state and photos
                            const existingCat = existingChecklist?.categories.find((c: any) => c.id === cat.id);
                            const existingItem = existingCat?.items.find((i: any) => i.id === item.id);
                            return {
                              id: item.id || `item-${Date.now()}-${catIdx}-${itemIdx}`,
                              text: item.text,
                              checked: existingItem?.checked || false,
                              photos: existingItem?.photos || []
                            };
                          })
                        }))
                      };
                    }
                    return cl;
                  });
                  Alert.alert('Success', 'Checklist updated successfully!');
                } else {
                  // CREATE MODE - Add new checklist
                  const newChecklist = {
                    id: `checklist-${Date.now()}`,
                    title: newChecklistTitle,
                    assignedTeam: [],
                    createdDate: new Date().toISOString().split('T')[0],
                    categories: newChecklistCategories.map((cat, catIdx) => ({
                      id: `cat-${Date.now()}-${catIdx}`,
                      name: cat.name,
                      items: cat.items.map((item, itemIdx) => ({
                        id: `item-${Date.now()}-${catIdx}-${itemIdx}`,
                        text: item.text,
                        checked: false,
                        photos: []
                      }))
                    }))
                  };

                  // Add to the TOP of the checklists array
                  updatedChecklists = [newChecklist, ...(project.checklists || [])];

                  // Initialize as collapsed
                  setCollapsedChecklists({ ...collapsedChecklists, [newChecklist.id]: true });

                  Alert.alert('Success', 'Checklist created successfully!');
                }

                setProject({ ...project, checklists: updatedChecklists });
                updateProject(project.id, { checklists: updatedChecklists });

                // Close modal and reset
                setShowAddChecklistModal(false);
                setEditingChecklistId(null);
              }}
            >
              <Text style={styles.addChecklistSaveText}>
                {editingChecklistId ? 'Update Checklist' : 'Create Checklist'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Material List Modal - Orange/Amber Theme */}
      <Modal
        visible={showAddMaterialListModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAddMaterialListModal(false)}
      >
        <View style={styles.addMaterialModalContainer}>
          {/* Header - Orange Metallic */}
          <LinearGradient
            colors={['#FBBF24', '#F59E0B', '#D97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addMaterialHeader}
          >
            <TouchableOpacity
              onPress={() => {
                setShowAddMaterialListModal(false);
                setEditingMaterialListId(null);
              }}
              style={styles.addMaterialBackButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.addMaterialHeaderTitle}>
              {editingMaterialListId ? 'Edit Material List' : 'Create Material List'}
            </Text>
            <View style={{ width: 24 }} />
          </LinearGradient>

          <ScrollView style={styles.addMaterialScrollView}>
            {/* List Name */}
            <View style={styles.addMaterialSection}>
              <Text style={styles.addMaterialSectionTitle}>List Name *</Text>
              <TextInput
                style={styles.addMaterialInput}
                value={newMaterialListName}
                onChangeText={setNewMaterialListName}
                placeholder="e.g., Kitchen Cabinet Materials"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Pickup Location */}
            <View style={styles.addMaterialSection}>
              <Text style={styles.addMaterialSectionTitle}>Pickup Location</Text>
              <TextInput
                style={styles.addMaterialInput}
                value={newMaterialListPickupLocation}
                onChangeText={setNewMaterialListPickupLocation}
                placeholder="e.g., Home Depot, Lowe's, Local Supplier"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Pickup Address */}
            <View style={styles.addMaterialSection}>
              <Text style={styles.addMaterialSectionTitle}>Pickup Address</Text>
              <TextInput
                style={styles.addMaterialInput}
                value={newMaterialListPickupAddress}
                onChangeText={setNewMaterialListPickupAddress}
                placeholder="Full address for pickup"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Due Date & Priority Row */}
            <View style={styles.addMaterialRowSection}>
              <View style={styles.addMaterialHalfSection}>
                <Text style={styles.addMaterialSectionTitle}>Due Date</Text>
                <TextInput
                  style={styles.addMaterialInput}
                  value={newMaterialListDueDate}
                  onChangeText={setNewMaterialListDueDate}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.addMaterialHalfSection}>
                <Text style={styles.addMaterialSectionTitle}>Priority</Text>
                <View style={styles.prioritySelector}>
                  {(['low', 'medium', 'high'] as const).map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityOption,
                        newMaterialListPriority === priority && styles.priorityOptionSelected,
                        priority === 'high' && newMaterialListPriority === priority && styles.priorityOptionHigh,
                        priority === 'medium' && newMaterialListPriority === priority && styles.priorityOptionMedium,
                        priority === 'low' && newMaterialListPriority === priority && styles.priorityOptionLow,
                      ]}
                      onPress={() => setNewMaterialListPriority(priority)}
                    >
                      <Text style={[
                        styles.priorityOptionText,
                        newMaterialListPriority === priority && styles.priorityOptionTextSelected,
                      ]}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Notes */}
            <View style={styles.addMaterialSection}>
              <Text style={styles.addMaterialSectionTitle}>Notes</Text>
              <TextInput
                style={[styles.addMaterialInput, styles.addMaterialTextArea]}
                value={newMaterialListNotes}
                onChangeText={setNewMaterialListNotes}
                placeholder="Special instructions, delivery notes, etc."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Material Items */}
            <View style={styles.addMaterialSection}>
              <View style={styles.addMaterialSectionHeader}>
                <Text style={styles.addMaterialSectionTitle}>Material Items</Text>
                <TouchableOpacity
                  style={styles.addMaterialItemBtn}
                  onPress={() => {
                    setNewMaterialListItems([
                      ...newMaterialListItems,
                      { id: `mat-item-temp-${Date.now()}`, name: '', quantity: '', unit: 'pieces', estimatedCost: '', purchased: false, url: '' }
                    ]);
                  }}
                >
                  <Ionicons name="add" size={18} color="#F59E0B" />
                  <Text style={styles.addMaterialItemBtnText}>Add Item</Text>
                </TouchableOpacity>
              </View>

              {newMaterialListItems.map((item, itemIndex) => (
                <View key={item.id} style={styles.materialItemBlock}>
                  <View style={styles.materialItemBlockHeader}>
                    <View style={styles.materialItemNumberBadge}>
                      <Text style={styles.materialItemNumberText}>{itemIndex + 1}</Text>
                    </View>
                    {newMaterialListItems.length > 1 && (
                      <TouchableOpacity
                        onPress={() => {
                          setNewMaterialListItems(newMaterialListItems.filter((_, idx) => idx !== itemIndex));
                        }}
                        style={styles.deleteMaterialItemButton}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {/* Item Name */}
                  <TextInput
                    style={styles.materialItemInput}
                    value={item.name}
                    onChangeText={(text) => {
                      const updated = [...newMaterialListItems];
                      updated[itemIndex].name = text;
                      setNewMaterialListItems(updated);
                    }}
                    placeholder="Item name (e.g., 2x4 Lumber)"
                    placeholderTextColor="#94A3B8"
                  />
                  
                  {/* Item URL */}
                  <View style={styles.itemUrlInputContainer}>
                    <Ionicons name="link" size={16} color="#F59E0B" />
                    <TextInput
                      style={styles.itemUrlInput}
                      value={item.url || ''}
                      onChangeText={(text) => {
                        const updated = [...newMaterialListItems];
                        updated[itemIndex].url = text;
                        setNewMaterialListItems(updated);
                      }}
                      placeholder="Product URL (optional)"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="url"
                    />
                  </View>
                  
                  {/* Quantity, Unit, Cost Row */}
                  <View style={styles.materialItemDetailsRow}>
                    <View style={styles.materialItemQuantitySection}>
                      <Text style={styles.materialItemLabel}>Qty</Text>
                      <TextInput
                        style={styles.materialItemSmallInput}
                        value={item.quantity}
                        onChangeText={(text) => {
                          const updated = [...newMaterialListItems];
                          updated[itemIndex].quantity = text;
                          setNewMaterialListItems(updated);
                        }}
                        placeholder="10"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                      />
                    </View>
                    
                    <View style={styles.materialItemUnitSection}>
                      <Text style={styles.materialItemLabel}>Unit</Text>
                      <View style={styles.unitPicker}>
                        {(['pieces', 'boxes', 'feet', 'lbs', 'gal', 'bags'] as const).map((unit) => (
                          <TouchableOpacity
                            key={unit}
                            style={[
                              styles.unitOption,
                              item.unit === unit && styles.unitOptionSelected,
                            ]}
                            onPress={() => {
                              const updated = [...newMaterialListItems];
                              updated[itemIndex].unit = unit;
                              setNewMaterialListItems(updated);
                            }}
                          >
                            <Text style={[
                              styles.unitOptionText,
                              item.unit === unit && styles.unitOptionTextSelected,
                            ]}>
                              {unit}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    
                    <View style={styles.materialItemCostSection}>
                      <Text style={styles.materialItemLabel}>Unit Cost</Text>
                      <View style={styles.costInputWrapper}>
                        <Text style={styles.costPrefix}>$</Text>
                        <TextInput
                          style={styles.materialItemCostInput}
                          value={item.estimatedCost}
                          onChangeText={(text) => {
                            const updated = [...newMaterialListItems];
                            updated[itemIndex].estimatedCost = text;
                            setNewMaterialListItems(updated);
                          }}
                          placeholder="0.00"
                          placeholderTextColor="#94A3B8"
                          keyboardType="decimal-pad"
                        />
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.addMaterialFooter}>
            <TouchableOpacity
              style={styles.addMaterialCancelButton}
              onPress={() => {
                setShowAddMaterialListModal(false);
                setEditingMaterialListId(null);
              }}
            >
              <Text style={styles.addMaterialCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addMaterialSaveButton}
              onPress={() => {
                // Validation
                if (!newMaterialListName.trim()) {
                  Alert.alert('Required', 'Please enter a list name');
                  return;
                }

                const hasEmptyItem = newMaterialListItems.some(item => !item.name.trim());
                if (hasEmptyItem) {
                  Alert.alert('Required', 'Please fill in all item names');
                  return;
                }

                let updatedMaterialLists;

                if (editingMaterialListId) {
                  // EDIT MODE
                  updatedMaterialLists = (project.materialLists || []).map((ml: any) => {
                    if (ml.id === editingMaterialListId) {
                      return {
                        ...ml,
                        name: newMaterialListName,
                        pickupLocation: newMaterialListPickupLocation,
                        pickupAddress: newMaterialListPickupAddress,
                        dueDate: newMaterialListDueDate,
                        priority: newMaterialListPriority,
                        notes: newMaterialListNotes,
                        items: newMaterialListItems.map((item, idx) => {
                          const existingItem = ml.items?.find((i: any) => i.id === item.id);
                          return {
                            ...item,
                            id: item.id || `mat-item-${Date.now()}-${idx}`,
                            purchased: existingItem?.purchased || false,
                            url: item.url || ''
                          };
                        })
                      };
                    }
                    return ml;
                  });
                  Alert.alert('Success', 'Material list updated successfully!');
                } else {
                  // CREATE MODE
                  const newMaterialList = {
                    id: `material-list-${Date.now()}`,
                    name: newMaterialListName,
                    pickupLocation: newMaterialListPickupLocation,
                    pickupAddress: newMaterialListPickupAddress,
                    dueDate: newMaterialListDueDate,
                    priority: newMaterialListPriority,
                    notes: newMaterialListNotes,
                    assignedTeam: [],
                    createdDate: new Date().toISOString().split('T')[0],
                    items: newMaterialListItems.map((item, idx) => ({
                      ...item,
                      id: `mat-item-${Date.now()}-${idx}`,
                      purchased: false,
                      url: item.url || ''
                    }))
                  };

                  updatedMaterialLists = [newMaterialList, ...(project.materialLists || [])];
                  setCollapsedMaterials({ ...collapsedMaterials, [newMaterialList.id]: true });

                  Alert.alert('Success', 'Material list created successfully!');
                }

                setProject({ ...project, materialLists: updatedMaterialLists });
                updateProject(project.id, { materialLists: updatedMaterialLists });

                setShowAddMaterialListModal(false);
                setEditingMaterialListId(null);
              }}
            >
              <Text style={styles.addMaterialSaveText}>
                {editingMaterialListId ? 'Update List' : 'Create List'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Material Team Assign Modal */}
      <Modal
        visible={showMaterialTeamAssignModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMaterialTeamAssignModal(false)}
      >
        <View style={styles.teamModalOverlay}>
          <View style={styles.teamModalContainer}>
            <View style={styles.teamModalHeader}>
              <Text style={styles.teamModalTitle}>Assign Team for Pickup</Text>
              <TouchableOpacity
                onPress={() => setShowMaterialTeamAssignModal(false)}
                style={styles.teamModalCloseButton}
              >
                <Ionicons name="close" size={28} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            {selectedMaterialList && (
              <Text style={styles.materialListSubtitle}>{selectedMaterialList.name}</Text>
            )}

            <ScrollView style={styles.teamModalContent}>
              {['Azis K', 'Oumayama M', 'Sarah Williams', 'Emely Davis', 'John Smith'].map((member) => {
                const isAssigned = selectedMaterialList?.assignedTeam?.includes(member);
                return (
                  <TouchableOpacity
                    key={member}
                    style={styles.teamMemberOption}
                    onPress={() => {
                      if (!selectedMaterialList) return;
                      const currentTeam = selectedMaterialList.assignedTeam || [];
                      const updatedTeam = isAssigned 
                        ? currentTeam.filter((m: string) => m !== member)
                        : [...currentTeam, member];
                      
                      const updatedLists = project.materialLists.map((ml: any) => 
                        ml.id === selectedMaterialList.id 
                          ? { ...ml, assignedTeam: updatedTeam }
                          : ml
                      );
                      setProject({ ...project, materialLists: updatedLists });
                      updateProject(project.id, { materialLists: updatedLists });
                      setSelectedMaterialList({ ...selectedMaterialList, assignedTeam: updatedTeam });
                    }}
                  >
                    <View style={styles.teamMemberOptionContent}>
                      <View style={styles.teamMemberAvatar}>
                        <Text style={styles.teamMemberAvatarText}>
                          {member.split(' ').map(n => n[0]).join('')}
                        </Text>
                      </View>
                      <Text style={styles.teamMemberOptionName}>{member}</Text>
                    </View>
                    <View style={[
                      styles.teamCheckbox,
                      isAssigned && styles.teamCheckboxCheckedOrange
                    ]}>
                      {isAssigned && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.teamModalDoneButtonOrange}
              onPress={() => setShowMaterialTeamAssignModal(false)}
            >
              <Text style={styles.teamModalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Project Note Modal */}
      <Modal
        visible={showProjectNoteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProjectNoteModal(false)}
      >
        <View style={styles.projectNoteModalOverlay}>
          <TouchableOpacity 
            style={styles.projectNoteModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowProjectNoteModal(false)}
          />
          <View style={styles.projectNoteModalContainer}>
            <View style={styles.projectNoteModalHeader}>
              <Text style={styles.projectNoteModalTitle}>Project Note</Text>
              <TouchableOpacity onPress={() => setShowProjectNoteModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.projectNoteModalSubtitle}>
              Add a note to this project (max 200 characters)
            </Text>
            
            <TextInput
              style={styles.projectNoteTextInput}
              value={projectNoteText}
              onChangeText={(text) => {
                if (text.length <= 200) {
                  setProjectNoteText(text);
                }
              }}
              placeholder="Enter your note here..."
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={200}
              textAlignVertical="top"
            />
            
            <View style={styles.projectNoteCharCount}>
              <Text style={[
                styles.projectNoteCharCountText,
                projectNoteText.length >= 180 && { color: '#F59E0B' },
                projectNoteText.length >= 200 && { color: '#EF4444' }
              ]}>
                {projectNoteText.length}/200 characters
              </Text>
            </View>
            
            <View style={styles.projectNoteModalButtons}>
              <TouchableOpacity
                style={styles.projectNoteCancelButton}
                onPress={() => {
                  setProjectNoteText(project?.projectNote || '');
                  setShowProjectNoteModal(false);
                }}
              >
                <Text style={styles.projectNoteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.projectNoteSaveButton}
                onPress={() => {
                  // Save the note to project data
                  updateProject(project.id, { projectNote: projectNoteText });
                  setProject({ ...project, projectNote: projectNoteText });
                  setShowProjectNoteModal(false);
                  Alert.alert('Success', 'Note saved successfully!');
                }}
              >
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                <Text style={styles.projectNoteSaveText}>Save Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Company Info Modal */}
      <Modal
        visible={showCompanyInfoModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCompanyInfoModal(false)}
      >
        <View style={styles.companyInfoOverlay}>
          <TouchableOpacity 
            style={styles.companyInfoBackdrop}
            activeOpacity={1}
            onPress={() => setShowCompanyInfoModal(false)}
          />
          <View style={styles.companyInfoContainer}>
            {/* Header */}
            <View style={styles.companyInfoHeader}>
              <View style={styles.companyInfoIconContainer}>
                <LinearGradient
                  colors={['#4F46E5', '#3B82F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.companyInfoIconGradient}
                >
                  <Ionicons name="business" size={32} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <TouchableOpacity 
                style={styles.companyInfoCloseButton}
                onPress={() => setShowCompanyInfoModal(false)}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Company Info Content */}
            <View style={styles.companyInfoContent}>
              {/* Trade Industry */}
              {selectedCompanyInfo?.tradeIndustry && (
                <View style={styles.companyInfoRow}>
                  <View style={styles.companyInfoLabel}>
                    <Ionicons name="briefcase-outline" size={20} color="#4F46E5" />
                    <Text style={styles.companyInfoLabelText}>Trade Industry</Text>
                  </View>
                  <Text style={styles.companyInfoValue}>{selectedCompanyInfo.tradeIndustry}</Text>
                </View>
              )}

              {/* Company Name */}
              {selectedCompanyInfo?.name && (
                <View style={styles.companyInfoRow}>
                  <View style={styles.companyInfoLabel}>
                    <Ionicons name="business-outline" size={20} color="#4F46E5" />
                    <Text style={styles.companyInfoLabelText}>Company Name</Text>
                  </View>
                  <Text style={styles.companyInfoValue}>{selectedCompanyInfo.name}</Text>
                </View>
              )}

              {/* Phone Number - Clickable */}
              {selectedCompanyInfo?.phone && (
                <TouchableOpacity 
                  style={styles.companyInfoRow}
                  onPress={() => {
                    Linking.openURL(`tel:${selectedCompanyInfo.phone}`);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.companyInfoLabel}>
                    <Ionicons name="call-outline" size={20} color="#4F46E5" />
                    <Text style={styles.companyInfoLabelText}>Phone Number</Text>
                  </View>
                  <View style={styles.companyInfoClickable}>
                    <Text style={styles.companyInfoClickableText}>{selectedCompanyInfo.phone}</Text>
                    <Ionicons name="call" size={16} color="#4F46E5" />
                  </View>
                </TouchableOpacity>
              )}

              {/* Email - Clickable */}
              {selectedCompanyInfo?.email && (
                <TouchableOpacity 
                  style={styles.companyInfoRow}
                  onPress={() => {
                    Linking.openURL(`mailto:${selectedCompanyInfo.email}`);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.companyInfoLabel}>
                    <Ionicons name="mail-outline" size={20} color="#4F46E5" />
                    <Text style={styles.companyInfoLabelText}>Email Address</Text>
                  </View>
                  <View style={styles.companyInfoClickable}>
                    <Text style={styles.companyInfoClickableText}>{selectedCompanyInfo.email}</Text>
                    <Ionicons name="mail" size={16} color="#4F46E5" />
                  </View>
                </TouchableOpacity>
              )}

              {/* Website - Clickable */}
              {selectedCompanyInfo?.website && (
                <TouchableOpacity 
                  style={styles.companyInfoRow}
                  onPress={() => {
                    const url = selectedCompanyInfo.website.startsWith('http') 
                      ? selectedCompanyInfo.website 
                      : `https://${selectedCompanyInfo.website}`;
                    Linking.openURL(url);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.companyInfoLabel}>
                    <Ionicons name="globe-outline" size={20} color="#4F46E5" />
                    <Text style={styles.companyInfoLabelText}>Website</Text>
                  </View>
                  <View style={styles.companyInfoClickable}>
                    <Text style={styles.companyInfoClickableText}>{selectedCompanyInfo.website}</Text>
                    <Ionicons name="open-outline" size={16} color="#4F46E5" />
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Close Button */}
            <TouchableOpacity 
              style={styles.companyInfoFooterButton}
              onPress={() => setShowCompanyInfoModal(false)}
            >
              <Text style={styles.companyInfoFooterButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  // Customer Box Styles
  customerBox: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  companyBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    minWidth: 36,
    alignItems: 'center',
  },
  companyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  projectNoteDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  projectNoteDisplayText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  contactButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  contactsButtonsContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  indigoEditButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  infoRows: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressIcon: {
    backgroundColor: '#E0E7FF',
  },
  phoneIcon: {
    backgroundColor: '#DCFCE7',
  },
  emailIcon: {
    backgroundColor: '#F3E8FF',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4F46E5',
    marginBottom: 2,
  },
  phoneLabel: {
    color: '#16A34A',
  },
  emailLabel: {
    color: '#9333EA',
  },
  infoValue: {
    fontSize: 14,
    color: '#0F172A',
  },
  addressLink: {
    color: '#4F46E5',
    textDecorationLine: 'underline',
  },
  tapToOpenText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    fontStyle: 'italic',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  bottomActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  bottomActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4F46E5',
  },
  // Property Box Styles
  propertyBox: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  propertyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  propertyTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  propertyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  amberEditButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCD34D',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  descriptionBox: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  placeholderText: {
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  accessCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  accessCodeIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessCodeContent: {
    flex: 1,
  },
  accessCodeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#F59E0B',
    marginBottom: 2,
  },
  accessCodeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  accessCodeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F59E0B',
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  editIconButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCD34D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Tabs Styles
  tabsSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabContentText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 32,
  },
  // Delete Modal Styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  deleteModalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  deleteWarningIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 12,
  },
  deleteModalDescription: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 4,
  },
  deleteModalProjectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  deleteWarningBox: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  deleteWarningList: {
    gap: 8,
  },
  deleteWarningBullet: {
    fontSize: 16,
    color: '#DC2626',
    marginRight: 8,
    lineHeight: 20,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  deleteCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  // Share Modal Styles
  shareModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  shareModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shareModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  shareModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  shareModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  shareModalClose: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareOptions: {
    padding: 20,
    gap: 12,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  shareOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  shareOptionContent: {
    flex: 1,
  },
  shareOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  shareOptionDescription: {
    fontSize: 13,
    color: '#64748B',
  },
  // Primary Contact Badge Styles
  primaryContactBadgeContainer: {
    position: 'relative',
    marginTop: 8,
    zIndex: 9999,
  },
  primaryContactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-start',
  },
  primaryContactBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4F46E5',
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
  },
  contactDropdownMenu: {
    position: 'absolute',
    top: 32,
    left: 0,
    width: 192,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 50,
    zIndex: 9999,
    paddingVertical: 4,
  },
  contactDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  contactDropdownName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0F172A',
  },
  addContactDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 4,
  },
  addContactDropdownText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4F46E5',
  },
  // New Contact Modal Styles - Matching Reference
  newContactModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  newContactModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  newContactModalContainer: {
    width: '92%',
    maxWidth: 350,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
  },
  newContactModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  newContactModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  newContactModalHeaderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  newContactModalHeaderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newContactModalContent: {
    padding: 16,
  },
  customerEditModalContent: {
    padding: 16,
    maxHeight: 400,
  },
  newContactField: {
    marginBottom: 16,
  },
  newContactFieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 4,
  },
  newContactFieldValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  newContactFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  newContactInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  // Company Dropdown Styles (for Edit Customer Info modal)
  companyDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  companyDropdownButtonText: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  companyDropdownPlaceholder: {
    color: '#94A3B8',
    fontWeight: '400',
  },
  companyDropdownMenu: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    maxHeight: 220,
  },
  companyDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  companyDropdownItemSelected: {
    backgroundColor: '#EEF2FF',
  },
  companyDropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  companyDropdownInitials: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  companyDropdownInitialsText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  companyDropdownItemText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  companyDropdownItemTextSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  newContactActionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  callButton: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  textButton: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
  },
  emailButton: {
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
  },
  newContactActionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  noteEditContainer: {
    gap: 8,
  },
  noteTextArea: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  noteEditButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  noteSaveButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
  },
  noteSaveButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noteCancelButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  noteCancelButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  noteDisplayBox: {
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
  },
  noteDisplayText: {
    fontSize: 14,
    color: '#475569',
  },
  noteEmptyText: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  newContactModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  newContactModalFooterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  newContactModalFooterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  saveButton: {
    backgroundColor: '#4F46E5',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  noteButton: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  noteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  editButton: {
    backgroundColor: '#4F46E5',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  // Delete Warning Modal Styles
  deleteWarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#EF4444',
  },
  deleteWarningIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteWarningHeaderText: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  deleteWarningContent: {
    padding: 24,
    gap: 12,
  },
  deleteWarningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  deleteWarningItemIcon: {
    marginTop: 2,
  },
  deleteWarningItemText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
  },
  deleteConfirmButton: {
    backgroundColor: '#EF4444',
  },
  deleteConfirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Contact Modal Styles
  contactModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  contactModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  contactModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  contactModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  contactModalClose: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactModalContent: {
    padding: 20,
  },
  contactField: {
    marginBottom: 20,
  },
  contactFieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  contactFieldValue: {
    fontSize: 16,
    color: '#1E293B',
  },
  contactInput: {
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F8FAFC',
  },
  contactTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  contactModalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  contactSaveButton: {
    flex: 1,
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  contactSaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contactEditButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4F46E5',
    backgroundColor: '#FFFFFF',
  },
  contactEditButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  contactDeleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#EF4444',
    backgroundColor: '#FFFFFF',
  },
  contactDeleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  // Contact Delete Warning Modal Styles
  deleteWarningContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  deleteWarningIcon: {
    marginBottom: 16,
  },
  deleteWarningTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteWarningText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  deleteWarningButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteWarningCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  deleteWarningCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  deleteWarningConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  deleteWarningConfirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // P&L Tab Styles
  plContainer: {
    padding: 16,
  },
  plSummaryCards: {
    gap: 12,
  },
  plCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  plCardLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  plCardValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  plCardStatus: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  plCategoryLine: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  plCategoryLineText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  plRecentActivity: {
    marginTop: 16,
  },
  plRecentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  plEmptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20,
  },
  plActivityItem: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  plActivityTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  plActivityBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plActivityLeft: {
    flex: 1,
  },
  plActivityAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  plActivityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  plActivityBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  plActivityRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  plActivityDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  plActivityNote: {
    fontSize: 12,
    color: '#6B7280',
    maxWidth: 150,
    textAlign: 'right',
  },
  plShowMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  plShowMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },
  plFullReportButton: {
    marginTop: 24,
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  plFullReportButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Logs Tab Styles
  logsContainer: {
    padding: 16,
  },
  logsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  logsSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
  },
  logsTimeline: {
    marginTop: 8,
  },
  logItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineConnector: {
    alignItems: 'center',
    marginRight: 16,
    width: 32,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 8,
    minHeight: 40,
  },
  logContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  logHeader: {
    marginBottom: 12,
  },
  logChangeText: {
    fontSize: 15,
    color: '#0F172A',
    lineHeight: 22,
  },
  logStatusBadge: {
    fontWeight: '700',
    fontSize: 15,
  },
  logDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  logDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logDetailText: {
    fontSize: 13,
    color: '#64748B',
  },
  logNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4F46E5',
    marginBottom: 12,
  },
  logNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  logFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  logChangedBy: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  logsEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  logsEmptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },
  logsEmptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  // Inspections Tab Styles
  inspectionsContainer: {
    padding: 16,
  },
  inspectionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  inspectionsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  addInspectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addInspectionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  inspectionsList: {
    gap: 16,
  },
  inspectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inspectionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inspectionCardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  inspectionCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  inspectionPassFailBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  inspectionPassFailText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inspectionCardBody: {
    gap: 10,
  },
  inspectionCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inspectionCardLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  inspectionCardValue: {
    fontSize: 14,
    color: '#0F172A',
    flex: 1,
  },
  inspectionStatusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  inspectionStatusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inspectionsEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  inspectionsEmptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },
  inspectionsEmptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  inspectionPassFailDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    minWidth: 140,
  },
  inspectionPassFailOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  inspectionPassFailOptionText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  inspectionStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  // Property Edit Modal Styles
  propertyEditModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  propertyEditModalContainer: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  propertyEditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  propertyEditTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  propertyEditCloseButton: {
    padding: 4,
  },
  propertyEditContent: {
    flex: 1,
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  propertyEditField: {
    marginBottom: 20,
  },
  propertyEditLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  propertyEditInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1E293B',
  },
  propertyEditTextArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1E293B',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFF7ED',
    borderWidth: 2,
    borderColor: '#FDBA74',
    borderRadius: 12,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F97316',
  },
  propertyEditImagePreview: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  propertyEditImage: {
    width: '100%',
    height: 200,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 2,
  },
  propertyEditFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  propertyEditCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyEditCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  propertyEditSaveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  propertyEditSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewButtonDisabled: {
    opacity: 0.5,
  },
  // Image Viewer Modal Styles
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageViewerContainer: {
    width: '100%',
    maxWidth: 800,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
    height: 300,
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
    paddingVertical: 8,
    borderRadius: 20,
  },
  zoomHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  accessCodeViewerContainer: {
    padding: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  accessCodeViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  accessCodeViewerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  accessCodeValueContainer: {
    backgroundColor: '#FFF7ED',
    borderWidth: 2,
    borderColor: '#FDBA74',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  accessCodeValueText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F97316',
    letterSpacing: 2,
  },
  propertyDescriptionContainer: {
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  propertyDescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  propertyDescriptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  propertyDescriptionText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
  },
  // Full Screen Image Viewer Styles
  fullScreenImageOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoViewerTopBar: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  fullScreenCloseButton: {
    padding: 8,
  },
  savePhotoButton: {
    padding: 8,
  },
  fullScreenScrollView: {
    flex: 1,
    width: '100%',
  },
  fullScreenScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    minHeight: 400,
  },
  photoSlide: {
    width: Dimensions.get('window').width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCounter: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  photoCounterText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  swipeInstructionsBadge: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  swipeInstructionsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  noImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noImageText: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 16,
  },
  imageViewerButton: {
    margin: 24,
    paddingVertical: 16,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageViewerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Permits Tab Styles
  permitsContainer: {
    flex: 1,
  },
  permitsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  permitsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  addPermitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addPermitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  permitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  permitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  permitImageContainer: {
    position: 'relative',
    height: 180,
    backgroundColor: '#F1F5F9',
  },
  permitImage: {
    width: '100%',
    height: '100%',
  },
  permitViewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  permitViewText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  permitPdfPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    gap: 8,
    padding: 20,
  },
  permitPdfText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  permitFileName: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  permitDetails: {
    padding: 16,
    gap: 12,
  },
  permitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  permitLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  permitValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  permitActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  permitActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  permitActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  permitShareText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  permitDeleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  permitsEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  permitsEmptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 16,
  },
  permitsEmptyText: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  extractingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  extractingContent: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
  },
  extractingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  // Permit Modal Styles
  permitModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permitModalContainer: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  permitModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
    flex: 1,
    padding: 24,
  },
  permitModalImagePreview: {
    height: 200,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  permitModalImage: {
    width: '100%',
    height: '100%',
  },
  permitModalPdfPreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    gap: 12,
  },
  permitModalPdfText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EF4444',
  },
  permitModalFileName: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  permitModalZoomHint: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  permitModalZoomHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  permitModalClickHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  permitModalClickHintText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  permitModalField: {
    marginBottom: 20,
  },
  permitModalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  permitModalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1E293B',
  },
  permitModalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  permitModalCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permitModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  permitModalSaveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  permitModalSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Task Tab Styles
  taskContainer: {
    flex: 1,
    padding: 20,
  },
  // Sub-tabs styles
  subTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  subTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  subTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  subTabTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  subTabContent: {
    flex: 1,
  },
  checklistEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  materialsEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#8BC34A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#8BC34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addTaskButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Checklist Button - Blue Theme
  addChecklistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addChecklistButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  taskList: {
    gap: 16,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  // Checklist Card - Blue Theme
  checklistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  checklistCardHeaderClickable: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  checklistCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checklistCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E40AF',
  },
  checklistCardContent: {
    padding: 20,
    backgroundColor: '#F8FAFF',
  },
  checklistProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#DBEAFE',
    borderRadius: 4,
    overflow: 'hidden',
  },
  checklistProgressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  checklistProgressFillComplete: {
    backgroundColor: '#10B981',
  },
  checklistProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    minWidth: 50,
  },
  checklistProgressTextComplete: {
    color: '#10B981',
    fontWeight: '700',
  },
  editChecklistButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignChecklistTeamButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checklistTeamMemberChip: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  checklistTeamMemberName: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '500',
  },
  checklistCategoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  checklistCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checklistCheckboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  morePhotosIndicatorBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  morePhotosTextBlue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  reorderButtons: {
    position: 'absolute',
    left: 8,
    top: 16,
    zIndex: 10,
    gap: 4,
  },
  reorderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskCardHeaderClickable: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  taskCardHeaderClickableWithReorder: {
    paddingLeft: 50,
    paddingRight: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  collapseIcon: {
    marginRight: 4,
  },
  taskTitleAndProgress: {
    flex: 1,
    gap: 8,
  },
  taskCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8BC34A',
    borderRadius: 4,
  },
  progressFillComplete: {
    backgroundColor: '#10B981',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    minWidth: 50,
  },
  progressTextComplete: {
    color: '#10B981',
    fontWeight: '700',
  },
  taskCardContent: {
    padding: 20,
  },
  taskCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editTaskButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  assignTeamButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignedTeamContainer: {
    marginBottom: 20,
  },
  assignedTeamLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  assignedTeamList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  teamMemberChip: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  teamMemberName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  taskCategory: {
    marginBottom: 20,
  },
  taskCategoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  taskItemContainer: {
    marginBottom: 8,
  },
  taskItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemReorderButtons: {
    flexDirection: 'column',
    gap: 2,
    marginRight: 8,
  },
  itemReorderButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    flex: 1,
  },
  cameraIconButton: {
    padding: 8,
    marginLeft: 8,
  },
  taskPhotoPreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginLeft: 32,
    gap: 8,
  },
  taskPhotoPreview: {
    marginBottom: 8,
  },
  taskPhotoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  morePhotosIndicator: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  morePhotosText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  taskItemText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  taskItemTextChecked: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  taskEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  taskEmptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },
  taskEmptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },

  // Team Assignment Modal Styles
  teamModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  teamModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  teamModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  teamModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  teamModalCloseButton: {
    padding: 4,
  },
  teamModalContent: {
    padding: 20,
  },
  teamMemberOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  teamMemberOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  teamMemberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamMemberAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  teamMemberOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  teamCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamCheckboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  teamCheckboxCheckedOrange: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  teamModalDoneButton: {
    margin: 20,
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  teamModalDoneButtonOrange: {
    margin: 20,
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  teamModalDoneText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  materialListSubtitle: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FEF3C7',
  },

  // Photo Options Modal Styles
  photoOptionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  photoOptionsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
  },
  photoOptionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  photoOptionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  photoOptionsCloseButton: {
    padding: 4,
  },
  photoOptionsButtons: {
    padding: 20,
    gap: 12,
  },
  photoOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  photoOptionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },

  // Add Task Modal Styles
  addTaskModalContainer: {
    flex: 1,
    backgroundColor: '#F1F8E9',
  },
  addTaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  addTaskBackButton: {
    padding: 4,
  },
  addTaskHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addTaskScrollView: {
    flex: 1,
    padding: 20,
  },
  addTaskSection: {
    marginBottom: 32,
  },
  addTaskSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addTaskSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#558B2F',
    marginBottom: 12,
  },
  addTaskTitleInput: {
    borderWidth: 2,
    borderColor: '#8BC34A',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#33691E',
    backgroundColor: '#FFFFFF',
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#C5E1A5',
    borderRadius: 8,
  },
  addCategoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#33691E',
  },
  categoryBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#AED581',
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  categoryNameInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#8BC34A',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#33691E',
    backgroundColor: '#F1F8E9',
  },
  deleteCategoryButton: {
    padding: 8,
  },
  categoryItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  itemNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8BC34A',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  itemNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  categoryItemInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#AED581',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#33691E',
    backgroundColor: '#FFFFFF',
    minHeight: 44,
  },
  deleteItemButton: {
    padding: 8,
    marginTop: 4,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  addItemButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#558B2F',
  },
  addTaskFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 2,
    borderTopColor: '#AED581',
    backgroundColor: '#F1F8E9',
  },
  addTaskCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  addTaskCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  addTaskSaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addTaskSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Add Checklist Modal Styles - Blue Theme
  addChecklistModalContainer: {
    flex: 1,
    backgroundColor: '#EFF6FF',
  },
  addChecklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  addChecklistBackButton: {
    padding: 4,
  },
  addChecklistHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addChecklistScrollView: {
    flex: 1,
    padding: 20,
  },
  addChecklistSection: {
    marginBottom: 32,
  },
  addChecklistSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addChecklistSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 12,
  },
  addChecklistTitleInput: {
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E40AF',
    backgroundColor: '#FFFFFF',
  },
  addChecklistCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#BFDBFE',
    borderRadius: 8,
  },
  addChecklistCategoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  checklistCategoryBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#93C5FD',
  },
  checklistCategoryNameInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#1E40AF',
    backgroundColor: '#EFF6FF',
  },
  deleteChecklistCategoryButton: {
    padding: 8,
  },
  checklistCategoryItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  checklistItemNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  checklistItemNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  checklistCategoryItemInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1E40AF',
    backgroundColor: '#FFFFFF',
    minHeight: 44,
  },
  deleteChecklistItemButton: {
    padding: 8,
    marginTop: 4,
  },
  addChecklistItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  addChecklistItemButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  addChecklistFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 2,
    borderTopColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  addChecklistCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  addChecklistCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  addChecklistSaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addChecklistSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ========== MATERIALS TAB STYLES - Orange/Amber Theme ==========
  
  // Material Button
  addMaterialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addMaterialButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Material Card
  materialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  materialCardHeaderClickable: {
    flex: 1,
    paddingVertical: 16,
    paddingLeft: 20,
  },
  materialCardHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FEF3C7',
  },
  materialCardHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  materialCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
  },
  materialCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  materialTitleAndInfo: {
    flex: 1,
    gap: 6,
  },
  materialTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  materialCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
  },
  materialCardContent: {
    padding: 20,
    backgroundColor: '#FFFBEB',
  },
  
  // Priority Badge
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  priorityBadgeHigh: {
    backgroundColor: '#FEE2E2',
  },
  priorityBadgeMedium: {
    backgroundColor: '#FEF3C7',
  },
  priorityBadgeLow: {
    backgroundColor: '#DCFCE7',
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  priorityBadgeTextHigh: {
    color: '#DC2626',
  },
  priorityBadgeTextMedium: {
    color: '#D97706',
  },
  priorityBadgeTextLow: {
    color: '#16A34A',
  },
  
  // Pickup Location
  pickupLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pickupLocationText: {
    fontSize: 13,
    color: '#B45309',
    fontWeight: '500',
  },
  
  // Material Progress
  materialProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  materialProgressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  materialProgressFillComplete: {
    backgroundColor: '#10B981',
  },
  materialProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
    minWidth: 60,
  },
  materialProgressTextComplete: {
    color: '#10B981',
    fontWeight: '700',
  },
  materialCostText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  
  // Edit/Assign Buttons
  editMaterialButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignMaterialTeamButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Assigned Team
  materialAssignedTeamContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FEF9C3',
    borderRadius: 8,
  },
  materialAssignedTeamLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  materialTeamMemberChip: {
    backgroundColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  materialTeamMemberName: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  
  // Material Info Section
  materialInfoSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  materialInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  materialInfoText: {
    fontSize: 14,
    color: '#78350F',
  },
  materialAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#FEF9C3',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  materialAddressText: {
    flex: 1,
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  materialUrlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  materialUrlText: {
    flex: 1,
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  
  // Notes
  materialNotesContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  materialNotesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  materialNotesText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
  
  // Material Items Section
  materialItemsSection: {
    marginTop: 8,
  },
  materialItemsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 12,
  },
  materialItemContainer: {
    marginBottom: 8,
  },
  materialItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  materialItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  materialCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#F59E0B',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  materialCheckboxChecked: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  materialItemDetails: {
    flex: 1,
  },
  materialItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#78350F',
    marginBottom: 2,
  },
  materialItemNamePurchased: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  materialItemMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  materialItemQuantity: {
    fontSize: 12,
    color: '#92400E',
  },
  materialItemCost: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  // Item URL Link (in card)
  materialItemUrlLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    marginBottom: 4,
  },
  materialItemUrlText: {
    flex: 1,
    fontSize: 11,
    color: '#F59E0B',
    textDecorationLine: 'underline',
  },
  // Item URL Input (in modal)
  itemUrlInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    marginBottom: 12,
    gap: 6,
  },
  itemUrlInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 13,
    color: '#78350F',
  },

  // ========== MATERIAL MODAL STYLES ==========
  
  addMaterialModalContainer: {
    flex: 1,
    backgroundColor: '#FFFBEB',
  },
  addMaterialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  addMaterialBackButton: {
    padding: 4,
  },
  addMaterialHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addMaterialScrollView: {
    flex: 1,
    padding: 20,
  },
  addMaterialSection: {
    marginBottom: 24,
  },
  addMaterialRowSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  addMaterialHalfSection: {
    flex: 1,
  },
  addMaterialSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addMaterialSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
  },
  addMaterialInput: {
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#78350F',
    backgroundColor: '#FFFFFF',
  },
  addMaterialTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  
  // URL Input
  urlInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  urlInputIcon: {
    marginRight: 8,
  },
  urlInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#78350F',
  },
  urlHelpText: {
    fontSize: 12,
    color: '#92400E',
    marginTop: 6,
    fontStyle: 'italic',
  },
  
  // Priority Selector
  prioritySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  priorityOptionSelected: {
    borderWidth: 2,
  },
  priorityOptionHigh: {
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  priorityOptionMedium: {
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
  priorityOptionLow: {
    borderColor: '#22C55E',
    backgroundColor: '#DCFCE7',
  },
  priorityOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  priorityOptionTextSelected: {
    color: '#1E293B',
  },
  
  // Add Material Item Button
  addMaterialItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  addMaterialItemBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  
  // Material Item Block
  materialItemBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  materialItemBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  materialItemNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  materialItemNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteMaterialItemButton: {
    padding: 4,
  },
  materialItemInput: {
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#78350F',
    backgroundColor: '#FFFBEB',
    marginBottom: 12,
  },
  materialItemDetailsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  materialItemQuantitySection: {
    width: 70,
  },
  materialItemUnitSection: {
    flex: 1,
  },
  materialItemCostSection: {
    width: 100,
  },
  materialItemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  materialItemSmallInput: {
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    color: '#78350F',
    backgroundColor: '#FFFBEB',
    textAlign: 'center',
  },
  unitPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  unitOption: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  unitOptionSelected: {
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
  unitOptionText: {
    fontSize: 11,
    color: '#64748B',
  },
  unitOptionTextSelected: {
    color: '#92400E',
    fontWeight: '600',
  },
  costInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 6,
    backgroundColor: '#FFFBEB',
    paddingLeft: 8,
  },
  costPrefix: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
  },
  materialItemCostInput: {
    flex: 1,
    padding: 8,
    fontSize: 14,
    color: '#78350F',
  },
  
  // Footer
  addMaterialFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 2,
    borderTopColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  addMaterialCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  addMaterialCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  addMaterialSaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addMaterialSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Team Assign Modal for Materials
  materialTeamAssignModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  materialTeamAssignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FEF3C7',
  },
  materialTeamAssignTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400E',
  },
  materialTeamAssignSubtitle: {
    fontSize: 14,
    color: '#B45309',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  teamMemberCheckboxCheckedOrange: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },

  // ========== RECEIPTS TAB STYLES ==========
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
  // Project Note Modal Styles
  projectNoteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectNoteModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  projectNoteModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  projectNoteModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectNoteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  projectNoteModalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  projectNoteTextInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
    minHeight: 120,
    maxHeight: 150,
  },
  projectNoteCharCount: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  projectNoteCharCountText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  projectNoteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  projectNoteCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  projectNoteCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  projectNoteSaveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
  },
  projectNoteSaveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Company Info Modal Styles
  companyInfoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  companyInfoBackdrop: {
    flex: 1,
  },
  companyInfoContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  companyInfoHeader: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    position: 'relative',
  },
  companyInfoIconContainer: {
    marginBottom: 12,
  },
  companyInfoIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyInfoCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyInfoContent: {
    padding: 20,
    gap: 16,
  },
  companyInfoRow: {
    gap: 12,
  },
  companyInfoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  companyInfoLabelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  companyInfoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    paddingLeft: 28,
  },
  companyInfoClickable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginLeft: 28,
  },
  companyInfoClickableText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4F46E5',
    flex: 1,
  },
  companyInfoFooterButton: {
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyInfoFooterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
