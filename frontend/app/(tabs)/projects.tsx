import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, Modal, Linking, KeyboardAvoidingView, Platform, Keyboard, Animated, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useRouter, useFocusEffect } from 'expo-router';
import { getAllProjects, addProject, updateProject, formatDateWithoutTimezone, type Project } from '../../utils/projectsData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Sample hardcoded project data with full contact details
const SAMPLE_PROJECTS = [
  { 
    id: 1, 
    name: 'Andrew Martinez', 
    street: '1234 Cherry Creek Dr', 
    city: 'Denver, CO 80223', 
    phone: '(720) 555-0101', 
    permit: 'PRM-2024-001', 
    status: 'Rough-In', 
    initials: 'AM', 
    otherContacts: [
      { id: '1-c1', name: 'Sarah Martinez', phone: '(720) 555-1001', email: 'sarah.m@example.com', note: '' }
    ]
  },
  { 
    id: 2, 
    name: 'Barbara Thompson', 
    street: '5678 Capitol Hill Ave', 
    city: 'Denver, CO 80203', 
    phone: '(303) 555-0102', 
    permit: 'PRM-2024-002', 
    status: 'To be scheduled', 
    initials: 'BT', 
    otherContacts: [
      { id: '2-c1', name: 'Michael Brown', phone: '(303) 555-1002', email: 'michael.b@example.com', note: 'Primary contact for permits' }
    ]
  },
  { id: 3, name: 'Carlos Rodriguez', street: '910 Highlands Blvd', city: 'Denver, CO 80211', phone: '(720) 555-0103', permit: 'PRM-2024-003', status: 'Inspection', initials: 'CR', otherContacts: [] },
  { id: 4, name: 'Diana Foster', street: '1122 Washington Park Way', city: 'Denver, CO 80209', phone: '(303) 555-0104', permit: 'PRM-2024-004', status: 'Completed', initials: 'DF', otherContacts: [] },
  { id: 5, name: 'Edward Chen', street: '3344 LoDo St', city: 'Denver, CO 80202', phone: '(720) 555-0105', permit: 'PRM-2024-005', status: 'Final Trim', initials: 'EC', otherContacts: [] },
  { id: 6, name: 'Fiona O\'Neill', street: '5566 RiNo Ave', city: 'Denver, CO 80216', phone: '(303) 555-0106', permit: 'PRM-2024-006', status: 'Rough-In', initials: 'FO', otherContacts: [] },
  { id: 7, name: 'Gabriel Santos', street: '7788 Park Hill Rd', city: 'Denver, CO 80207', phone: '(720) 555-0107', permit: 'PRM-2024-007', status: 'To be scheduled', initials: 'GS', otherContacts: [] },
  { id: 8, name: 'Hannah Kim', street: '9900 Congress Park Ln', city: 'Denver, CO 80206', phone: '(303) 555-0108', permit: 'PRM-2024-008', status: 'Inspection', initials: 'HK', otherContacts: [] },
  { id: 9, name: 'Isaac Johnson', street: '2211 Stapleton Dr', city: 'Aurora, CO 80010', phone: '(720) 555-0109', permit: 'PRM-2024-009', status: 'Completed', initials: 'IJ', otherContacts: [] },
  { id: 10, name: 'Jessica Williams', street: '4433 Pearl St', city: 'Boulder, CO 80302', phone: '(303) 555-0110', permit: 'PRM-2024-010', status: 'Final Trim', initials: 'JW', otherContacts: [] },
  { id: 11, name: 'Kevin Anderson', street: '6655 Main St', city: 'Littleton, CO 80120', phone: '(720) 555-0111', permit: 'PRM-2024-011', status: 'Rough-In', initials: 'KA', otherContacts: [] },
  { id: 12, name: 'Laura Davis', street: '8877 Wadsworth Blvd', city: 'Lakewood, CO 80215', phone: '(303) 555-0112', permit: 'PRM-2024-012', status: 'To be scheduled', initials: 'LD', otherContacts: [] },
  { id: 13, name: 'Michael Brown', street: '1010 Quebec St', city: 'Centennial, CO 80112', phone: '(720) 555-0113', permit: 'PRM-2024-013', status: 'Inspection', initials: 'MB', otherContacts: [] },
  { id: 14, name: 'Natalie Garcia', street: '3232 South Broadway', city: 'Englewood, CO 80113', phone: '(303) 555-0114', permit: 'PRM-2024-014', status: 'Completed', initials: 'NG', otherContacts: [] },
  { id: 15, name: 'Oliver Martinez', street: '5454 Pecos St', city: 'Westminster, CO 80030', phone: '(720) 555-0115', permit: 'PRM-2024-015', status: 'Completed', initials: 'OM', otherContacts: [] },
  { id: 16, name: 'Patricia Wilson', street: '7676 Federal Blvd', city: 'Arvada, CO 80003', phone: '(303) 555-0116', permit: 'PRM-2024-016', status: 'Rough-In', initials: 'PW', otherContacts: [] },
  { id: 17, name: 'Quincy Roberts', street: '9898 Sheridan Blvd', city: 'Thornton, CO 80229', phone: '(720) 555-0117', permit: 'PRM-2024-017', status: 'To be scheduled', initials: 'QR', otherContacts: [] },
  { id: 18, name: 'Rachel Taylor', street: '1357 Colfax Ave', city: 'Aurora, CO 80010', phone: '(303) 555-0118', permit: 'PRM-2024-018', status: 'Final Trim', initials: 'RT', otherContacts: [] },
  { id: 19, name: 'Samuel Moore', street: '2468 Havana St', city: 'Aurora, CO 80014', phone: '(720) 555-0119', permit: 'PRM-2024-019', status: 'Inspection', initials: 'SM', otherContacts: [] },
  { id: 20, name: 'Theresa Jackson', street: '3691 Alameda Ave', city: 'Lakewood, CO 80226', phone: '(303) 555-0120', permit: 'PRM-2024-020', status: 'Completed', initials: 'TJ', otherContacts: [] },
  { id: 21, name: 'Ursula Harris', street: '4820 Parker Rd', city: 'Parker, CO 80134', phone: '(720) 555-0121', permit: 'PRM-2024-021', status: 'Completed', initials: 'UH', otherContacts: [] },
  { id: 22, name: 'Victor Nguyen', street: '5931 Belleview Ave', city: 'Greenwood Village, CO 80111', phone: '(303) 555-0122', permit: 'PRM-2024-022', status: 'To be scheduled', initials: 'VN', otherContacts: [] },
  { id: 23, name: 'Wendy Clark', street: '6042 Kipling St', city: 'Wheat Ridge, CO 80033', phone: '(720) 555-0123', permit: 'PRM-2024-023', status: 'Rough-In', initials: 'WC', otherContacts: [] },
  { id: 24, name: 'Xavier Lopez', street: '7153 Santa Fe Dr', city: 'Littleton, CO 80120', phone: '(303) 555-0124', permit: 'PRM-2024-024', status: 'Inspection', initials: 'XL', otherContacts: [] },
  { id: 25, name: 'Yolanda Martinez', street: '8264 University Blvd', city: 'Highlands Ranch, CO 80126', phone: '(720) 555-0125', permit: 'PRM-2024-025', status: 'Completed', initials: 'YM', otherContacts: [] },
  { id: 26, name: 'Zachary White', street: '9375 Colorado Blvd', city: 'Thornton, CO 80229', phone: '(303) 555-0126', permit: 'PRM-2024-026', status: 'Final Trim', initials: 'ZW', otherContacts: [] },
  { id: 27, name: 'Aaron Bennett', street: '1425 Downing St', city: 'Denver, CO 80218', phone: '(720) 555-0127', permit: 'PRM-2024-027', status: 'Rough-In', initials: 'AB', otherContacts: [] },
  { id: 28, name: 'Brenda Coleman', street: '2536 York St', city: 'Denver, CO 80205', phone: '(303) 555-0128', permit: 'PRM-2024-028', status: 'To be scheduled', initials: 'BC', otherContacts: [] },
  { id: 29, name: 'Christopher Diaz', street: '3647 Steele St', city: 'Denver, CO 80205', phone: '(720) 555-0129', permit: 'PRM-2024-029', status: 'Inspection', initials: 'CD', otherContacts: [] },
  { id: 30, name: 'Deborah Ellis', street: '4758 Franklin St', city: 'Denver, CO 80216', phone: '(303) 555-0130', permit: 'PRM-2024-030', status: 'Completed', initials: 'DE', otherContacts: [] },
  { id: 31, name: 'Eric Foster', street: '5869 Marion St', city: 'Denver, CO 80218', phone: '(720) 555-0131', permit: 'PRM-2024-031', status: 'Final Trim', initials: 'EF', otherContacts: [] },
  { id: 32, name: 'Frances Gray', street: '6970 Clarkson St', city: 'Denver, CO 80218', phone: '(303) 555-0132', permit: 'PRM-2024-032', status: 'Rough-In', initials: 'FG', otherContacts: [] },
  { id: 33, name: 'George Hughes', street: '7081 Adams St', city: 'Commerce City, CO 80022', phone: '(720) 555-0133', permit: 'PRM-2024-033', status: 'To be scheduled', initials: 'GH', otherContacts: [] },
  { id: 34, name: 'Helen Irving', street: '8192 Washington St', city: 'Thornton, CO 80229', phone: '(303) 555-0134', permit: 'PRM-2024-034', status: 'Inspection', initials: 'HI', otherContacts: [] },
  { id: 35, name: 'Ian Jenkins', street: '9203 Monaco Pkwy', city: 'Denver, CO 80207', phone: '(720) 555-0135', permit: 'PRM-2024-035', status: 'Completed', initials: 'IJ', otherContacts: [] },
  { id: 36, name: 'Julia Kelly', street: '1314 Birch St', city: 'Broomfield, CO 80020', phone: '(303) 555-0136', permit: 'PRM-2024-036', status: 'Final Trim', initials: 'JK', otherContacts: [] },
  { id: 37, name: 'Keith Lambert', street: '2425 Elm St', city: 'Golden, CO 80401', phone: '(720) 555-0137', permit: 'PRM-2024-037', status: 'Rough-In', initials: 'KL', otherContacts: [] },
  { id: 38, name: 'Linda Morgan', street: '3536 Oak St', city: 'Westminster, CO 80030', phone: '(303) 555-0138', permit: 'PRM-2024-038', status: 'To be scheduled', initials: 'LM', otherContacts: [] },
  { id: 39, name: 'Marcus Nelson', street: '4647 Pine St', city: 'Arvada, CO 80002', phone: '(720) 555-0139', permit: 'PRM-2024-039', status: 'Inspection', initials: 'MN', otherContacts: [] },
  { id: 40, name: 'Nina Owens', street: '5758 Maple Ave', city: 'Lakewood, CO 80214', phone: '(303) 555-0140', permit: 'PRM-2024-040', status: 'Completed', initials: 'NO', otherContacts: [] },
  { id: 41, name: 'Oscar Patel', street: '6869 Willow Dr', city: 'Englewood, CO 80110', phone: '(720) 555-0141', permit: 'PRM-2024-041', status: 'Final Trim', initials: 'OP', otherContacts: [] },
  { id: 42, name: 'Paula Quinn', street: '7970 Cedar Ln', city: 'Littleton, CO 80123', phone: '(303) 555-0142', permit: 'PRM-2024-042', status: 'Rough-In', initials: 'PQ', otherContacts: [] },
  { id: 43, name: 'Ryan Stewart', street: '8081 Spruce Way', city: 'Centennial, CO 80112', phone: '(720) 555-0143', permit: 'PRM-2024-043', status: 'To be scheduled', initials: 'RS', otherContacts: [] },
  { id: 44, name: 'Sandra Turner', street: '9192 Aspen Ct', city: 'Aurora, CO 80015', phone: '(303) 555-0144', permit: 'PRM-2024-044', status: 'Inspection', initials: 'ST', otherContacts: [] },
  { id: 45, name: 'Timothy Underwood', street: '1023 Redwood St', city: 'Parker, CO 80138', phone: '(720) 555-0145', permit: 'PRM-2024-045', status: 'Completed', initials: 'TU', otherContacts: [] },
  { id: 46, name: 'Veronica Walsh', street: '2134 Sycamore Blvd', city: 'Castle Rock, CO 80104', phone: '(303) 555-0146', permit: 'PRM-2024-046', status: 'Final Trim', initials: 'VW', otherContacts: [] },
];

// Initial companies data for "By Company" view
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

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'company'
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [searchQuery, setSearchQuery] = useState('');
  const [showIndex, setShowIndex] = useState(false);
  const [activeIndex, setActiveIndex] = useState<string | null>(null);
  const [magnifierPos, setMagnifierPos] = useState(0);
  const [openContactDropdown, setOpenContactDropdown] = useState<number | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [editedContactData, setEditedContactData] = useState<any>({});
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [isAddingNewContact, setIsAddingNewContact] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<any[]>(INITIAL_COMPANIES_DATA);
  const [expandedCompanies, setExpandedCompanies] = useState<Record<number, boolean>>({});
  const [openCompanyInfoDropdown, setOpenCompanyInfoDropdown] = useState<number | null>(null);
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [editedCompanyData, setEditedCompanyData] = useState<any>({});
  const [showDeleteCompanyWarning, setShowDeleteCompanyWarning] = useState(false);
  const [showCompanyInfoModal, setShowCompanyInfoModal] = useState(false);
  const [selectedCompanyInfo, setSelectedCompanyInfo] = useState<any>(null);

  // Load projects from shared store on mount and when screen comes into focus
  useEffect(() => {
    setProjects(getAllProjects());
  }, []);

  // Reload projects when screen comes into focus (e.g., after deleting a project)
  useFocusEffect(
    React.useCallback(() => {
      setProjects(getAllProjects());
    }, [])
  );
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [openStatusDropdown, setOpenStatusDropdown] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [activeCalendarField, setActiveCalendarField] = useState<string | null>(null);
  const [tempSelectedDate, setTempSelectedDate] = useState<string | null>(null);
  const [showEditStatusModal, setShowEditStatusModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editStatusData, setEditStatusData] = useState<any>({});
  const [dropdownPosition, setDropdownPosition] = useState<any>(null);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  
  const employeeOptions = [
    'Not assigned',
    'Azis K',
    'Oumayama M',
    'Sarah Williams',
    'Emely Davis'
  ];
  
  const alertOptions = [
    'None',
    '10 Min before',
    '30 min before',
    '1 hour before',
    '1 day before'
  ];
  const positionMeasured = useRef(false);
  const [formData, setFormData] = useState<Record<string, string>>({
    name: '',
    company: '',
    phone: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    status: 'To be scheduled',
    roughInStart: new Date().toISOString().split('T')[0],
    roughInEnd: '',
    inspectionDate: '',
    finalTrimStart: new Date().toISOString().split('T')[0],
    finalTrimEnd: '',
    completedDate: new Date().toISOString().split('T')[0],
    warrantyStart: new Date().toISOString().split('T')[0],
    warrantyEnd: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  
  const scrollRef = useRef<any>(null);
  const modalScrollRef = useRef<any>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionRefs = useRef<Record<string, number>>({});
  const letterRefs = useRef<Record<string, number>>({});

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const statusOptions = ['To be scheduled', 'Rough-In', 'Inspection', 'Final Trim', 'Completed', 'Service Call'];

  // Date utility functions
  const formatDate = (date: string | Date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const getNextBusinessDay = (date: string | Date) => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    // If Saturday, add 2 days; if Sunday, add 1 day
    if (nextDay.getDay() === 6) nextDay.setDate(nextDay.getDate() + 2);
    if (nextDay.getDay() === 0) nextDay.setDate(nextDay.getDate() + 1);
    return formatDate(nextDay);
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return 'Select date';
    // Parse date string as local date to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Format phone number as (XXX) XXX-XXXX
  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Limit to 10 digits
    const limited = cleaned.substring(0, 10);
    
    // Format based on length
    if (limited.length <= 3) {
      return limited;
    } else if (limited.length <= 6) {
      return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
    } else {
      return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
    }
  };

  // Filter projects based on search query and selected filter
  const filteredProjects = projects.filter((project) => {
    // Apply status filter first
    if (selectedFilter !== 'All' && project.status !== selectedFilter) {
      return false;
    }
    
    // Then apply search filter
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      project.name.toLowerCase().includes(query) ||
      project.street.toLowerCase().includes(query) ||
      project.city.toLowerCase().includes(query) ||
      project.phone.toLowerCase().includes(query) ||
      project.permit.toLowerCase().includes(query) ||
      project.status.toLowerCase().includes(query)
    );
  });

  // Group filtered projects by first letter (for "All Projects" view)
  const groupedProjects = filteredProjects.reduce<Record<string, Project[]>>((acc, project) => {
    const firstLetter = project.name.charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(project);
    return acc;
  }, {});

  const availableLetters = Object.keys(groupedProjects).sort();

  // Filter and group companies with projects (for "By Company" view)
  const getFilteredCompanies = () => {
    return companies.map(company => {
      const companyProjects = projects.filter(p => p.company === company.name);
      const filteredProjects = companyProjects.filter(project => {
        // Apply status filter
        if (selectedFilter !== 'All' && project.status !== selectedFilter) {
          return false;
        }
        
        // Apply search filter
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
          company.name.toLowerCase().includes(query) ||
          project.name.toLowerCase().includes(query) ||
          project.street.toLowerCase().includes(query) ||
          project.city.toLowerCase().includes(query) ||
          project.phone.toLowerCase().includes(query) ||
          project.permit.toLowerCase().includes(query)
        );
      });
      
      return { ...company, projects: filteredProjects };
    }).filter(company => company.projects.length > 0);
  };

  const filteredCompanies = getFilteredCompanies();

  // Group companies by first letter
  const groupedCompanies = filteredCompanies.reduce<Record<string, any[]>>((acc, company) => {
    const firstLetter = company.name.charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(company);
    return acc;
  }, {});

  const availableCompanyLetters = Object.keys(groupedCompanies).sort();

  // Determine which letters are available based on view mode
  const currentAvailableLetters = viewMode === 'all' ? availableLetters : availableCompanyLetters;

  // Toggle company expansion
  const toggleCompany = (companyId: number) => {
    setExpandedCompanies(prev => ({
      ...prev,
      [companyId]: !prev[companyId]
    }));
  };

  // Switch view mode with animation
  const switchViewMode = (newMode: string) => {
    if (newMode === viewMode) return;
    
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setViewMode(newMode);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  // Company edit handlers
  const handleEditCompany = (company: any) => {
    setEditingCompany(company);
    setEditedCompanyData({
      name: company.name,
      phone: company.phone || '',
      email: company.email || '',
      website: company.website || '',
      tradeIndustry: company.tradeIndustry || ''
    });
    setShowEditCompanyModal(true);
  };

  const handleSaveCompany = () => {
    const updatedCompanies = companies.map(c => 
      c.id === editingCompany.id 
        ? { ...c, ...editedCompanyData }
        : c
    );
    setCompanies(updatedCompanies);
    setShowEditCompanyModal(false);
    setEditingCompany(null);
    setEditedCompanyData({});
  };

  const handleCancelEditCompany = () => {
    setShowEditCompanyModal(false);
    setEditingCompany(null);
    setEditedCompanyData({});
  };

  const handleDeleteCompanyClick = () => {
    setShowDeleteCompanyWarning(true);
  };

  const handleConfirmDeleteCompany = () => {
    // Remove company from state
    const updatedCompanies = companies.filter(c => c.id !== editingCompany.id);
    setCompanies(updatedCompanies);
    
    // Close modals
    setShowDeleteCompanyWarning(false);
    setShowEditCompanyModal(false);
    setEditingCompany(null);
    setEditedCompanyData({});
  };

  const handleCancelDeleteCompany = () => {
    setShowDeleteCompanyWarning(false);
  };

  // Auto show/hide on scroll
  const handleScroll = () => {
    setShowIndex(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setShowIndex(false);
      setActiveIndex(null);
    }, 1200);
  };

  // Scroll to letter
  const scrollToLetter = (letter: string) => {
    const yOffset = sectionRefs.current[letter];
    if (yOffset !== undefined && scrollRef.current) {
      scrollRef.current.scrollTo({ y: yOffset, animated: true });
    }
  };

  // Touch handler for index letters
  const handleIndexTouch = (letter: string) => {
    if (!currentAvailableLetters.includes(letter)) return;
    
    setActiveIndex(letter);
    scrollToLetter(letter);

    const letterPosition = letterRefs.current[letter];
    if (letterPosition !== undefined) {
      setMagnifierPos(letterPosition);
    }

    setShowIndex(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setShowIndex(false);
      setActiveIndex(null);
    }, 1200);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'To be scheduled':
        return { backgroundColor: '#FEF3C7', borderColor: '#FDE047', color: '#92400E' };
      case 'Rough-In':
        return { backgroundColor: '#DBEAFE', borderColor: '#93C5FD', color: '#1E40AF' };
      case 'Inspection':
        return { backgroundColor: '#FCE7F3', borderColor: '#F9A8D4', color: '#831843' };
      case 'Final Trim':
        return { backgroundColor: '#F3E8FF', borderColor: '#D8B4FE', color: '#6B21A8' };
      case 'Completed':
        return { backgroundColor: '#D1FAE5', borderColor: '#86EFAC', color: '#065F46' };
      case 'Service Call':
        return { backgroundColor: '#FED7AA', borderColor: '#FB923C', color: '#9A3412' };
      default:
        return { backgroundColor: '#F3F4F6', borderColor: '#D1D5DB', color: '#4B5563' };
    }
  };

  // Contact handlers
  const handleContactClick = (contact: any, projectId: number) => {
    setSelectedContact(contact);
    setCurrentProjectId(projectId);
    setEditedContactData(contact);
    setNoteText(contact.note || '');
    setShowContactModal(true);
    setOpenContactDropdown(null);
  };

  const handleAddNewContact = (projectId: number) => {
    const newContact = {
      id: `${projectId}-c${Date.now()}`,
      name: '',
      phone: '',
      email: '',
      note: ''
    };
    setSelectedContact(newContact);
    setCurrentProjectId(projectId);
    setEditedContactData(newContact);
    setIsEditingContact(true);
    setIsAddingNewContact(true);
    setShowContactModal(true);
    setOpenContactDropdown(null);
  };

  const handleSaveContact = () => {
    const currentProject = projects.find(p => p.id === currentProjectId);
    if (!currentProject || currentProjectId === null) return;
    
    let updatedContacts;
    if (isAddingNewContact) {
      updatedContacts = [...(currentProject.otherContacts || []), editedContactData];
    } else {
      updatedContacts = (currentProject.otherContacts || []).map((c: any) => 
        c.id === selectedContact.id ? editedContactData : c
      );
    }
    
    // Update shared store
    updateProject(currentProjectId, { otherContacts: updatedContacts });
    setProjects(getAllProjects());
    
    setSelectedContact(editedContactData);
    setIsEditingContact(false);
    setIsAddingNewContact(false);
  };

  const handleDeleteContact = () => {
    setShowDeleteWarning(true);
  };

  const confirmDeleteContact = () => {
    const currentProject = projects.find(p => p.id === currentProjectId);
    if (!currentProject || currentProjectId === null) return;
    const updatedContacts = (currentProject.otherContacts || []).filter(
      (c: any) => c.id !== selectedContact.id
    );
    
    // Update shared store
    updateProject(currentProjectId, { otherContacts: updatedContacts });
    setProjects(getAllProjects());
    
    setShowDeleteWarning(false);
    setShowContactModal(false);
    setOpenContactDropdown(null);
  };

  const oldConfirmDeleteContact = () => {
    setProjects(prevProjects => prevProjects.map(proj => {
      if (proj.id === currentProjectId) {
        return {
          ...proj,
          otherContacts: (proj.otherContacts || []).filter((c: any) => c.id !== selectedContact.id)
        };
      }
      return proj;
    }));
    
    setShowDeleteWarning(false);
    setShowContactModal(false);
    setSelectedContact(null);
  };

  const handleSaveNote = () => {
    const updatedContact = { ...selectedContact, note: noteText };
    setProjects(prevProjects => prevProjects.map(proj => {
      if (proj.id === currentProjectId) {
        return {
          ...proj,
          otherContacts: (proj.otherContacts || []).map((c: any) => 
            c.id === selectedContact.id ? updatedContact : c
          )
        };
      }
      return proj;
    }));
    
    setSelectedContact(updatedContact);
    setIsAddingNote(false);
  };

  // Add Project Modal handlers
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    return errors;
  };

  const handleAddProject = (action: string) => {
    const errors = validateForm();
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }

    // Find the selected company to get its initials
    const selectedCompany = companies.find(c => c.name === formData.company);
    
    // Create new project with local state including date fields
    const newProject: Project = {
      id: projects.length + 1,
      name: formData.name.trim(),
      company: formData.company || '',
      companyInitials: selectedCompany?.initials || '',
      street: formData.street.trim(),
      city: `${formData.city.trim()}${formData.state ? ', ' + formData.state.trim() : ''}${formData.zip ? ' ' + formData.zip.trim() : ''}`,
      phone: formData.phone,
      email: formData.email.trim(),
      permit: `PRM-2024-${String(projects.length + 1).padStart(3, '0')}`,
      status: formData.status,
      initials: formData.name.trim().split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
      otherContacts: [],
      // Date fields based on status
      roughInStart: formData.roughInStart,
      roughInEnd: formData.roughInEnd,
      inspectionDate: formData.inspectionDate,
      finalTrimStart: formData.finalTrimStart,
      finalTrimEnd: formData.finalTrimEnd,
      completedDate: formData.completedDate,
      warrantyStart: formData.warrantyStart,
      warrantyEnd: formData.warrantyEnd
    };

    // Add to shared store and update local state
    addProject(newProject);
    setProjects(getAllProjects());
    
    // Get the first letter of the new project for scrolling
    const firstLetter = newProject.name.charAt(0).toUpperCase();
    
    // Reset form
    setFormData({ 
      name: '', 
      company: '',
      phone: '',
      email: '',
      street: '',
      city: '',
      state: '',
      zip: '',
      status: 'To be scheduled',
      roughInStart: new Date().toISOString().split('T')[0],
      roughInEnd: '',
      inspectionDate: '',
      finalTrimStart: new Date().toISOString().split('T')[0],
      finalTrimEnd: '',
      completedDate: new Date().toISOString().split('T')[0],
      warrantyStart: new Date().toISOString().split('T')[0],
      warrantyEnd: ''
    });
    setFormErrors({});
    setShowCompanyDropdown(false);
    setShowAddModal(false);

    // Scroll to the letter section where the new project appears
    setTimeout(() => {
      if (scrollRef.current && sectionRefs.current[firstLetter]) {
        scrollRef.current.scrollTo({ 
          y: sectionRefs.current[firstLetter] - 60, // Offset for header
          animated: true 
        });
      }
    }, 200);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setFormData({ 
      name: '', 
      company: '',
      phone: '',
      email: '',
      street: '',
      city: '',
      state: '',
      zip: '',
      status: 'To be scheduled',
      roughInStart: new Date().toISOString().split('T')[0],
      roughInEnd: '',
      inspectionDate: '',
      finalTrimStart: new Date().toISOString().split('T')[0],
      finalTrimEnd: '',
      completedDate: new Date().toISOString().split('T')[0],
      warrantyStart: new Date().toISOString().split('T')[0],
      warrantyEnd: ''
    });
    setFormErrors({});
    setShowStatusPicker(false);
    setShowCalendar(false);
    setShowCompanyDropdown(false);
  };

  const handleStatusChange = (newStatus: string) => {
    const today = formatDate(new Date());
    const nextBusiness = getNextBusinessDay(new Date());
    
    const updatedData: Record<string, string> = {
      ...formData,
      status: newStatus
    };

    // Set default dates based on status
    if (newStatus === 'Rough-In') {
      updatedData.roughInStart = today;
    } else if (newStatus === 'Inspection') {
      updatedData.inspectionDate = nextBusiness;
    } else if (newStatus === 'Final Trim') {
      updatedData.finalTrimStart = today;
    } else if (newStatus === 'Completed' || newStatus === 'Service Call') {
      updatedData.completedDate = today;
      updatedData.warrantyStart = today;
    }

    setFormData(updatedData);
    setShowStatusPicker(false);
    
    // Scroll to date fields after status change
    setTimeout(() => {
      if (modalScrollRef.current) {
        modalScrollRef.current.scrollTo({ y: 700, animated: true });
      }
    }, 200);
  };

  const openCalendar = (fieldName: string) => {
    setActiveCalendarField(fieldName);
    // Initialize tempSelectedDate with current field value or today
    // Check if we're editing status or adding new project
    const currentValue = showEditStatusModal ? editStatusData[fieldName] : formData[fieldName];
    setTempSelectedDate(currentValue || formatDate(new Date()));
    setShowCalendar(true);
  };

  const handleDateSelect = (date: { dateString: string }) => {
    if (activeCalendarField) {
      // Use formatDateWithoutTimezone to prevent timezone issues
      const formattedDate = formatDateWithoutTimezone(date.dateString);
      
      // Check if we're editing status or adding new project
      if (showEditStatusModal) {
        setEditStatusData({
          ...editStatusData,
          [activeCalendarField]: formattedDate
        });
      } else {
        setFormData({
          ...formData,
          [activeCalendarField]: formattedDate
        });
      }
    }
    setShowCalendar(false);
    setActiveCalendarField(null);
    setTempSelectedDate(null);
  };

  const getSelectedDate = () => {
    if (!activeCalendarField) {
      return formatDate(new Date());
    }
    // Check if we're editing status or adding new project
    const currentData = showEditStatusModal ? editStatusData : formData;
    return currentData[activeCalendarField] || formatDate(new Date());
  };

  // Quick date selection helpers
  const addMonthsToDate = (date: string | Date, months: number) => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return formatDate(result);
  };

  const handleQuickDateSelect = (months: number) => {
    // Get the base date - use tempSelectedDate if user clicked a date, otherwise use current field value or today
    const currentData = showEditStatusModal ? editStatusData : formData;
    const activeDateField = activeCalendarField ?? 'warrantyStart';
    const baseDate = tempSelectedDate || currentData[activeDateField] || formatDate(new Date());
    
    // Calculate end date by adding months to base date
    const endDate = addMonthsToDate(new Date(baseDate), months);
    
    // Update the appropriate data (editStatusData or formData) with both dates
    if (showEditStatusModal) {
      setEditStatusData((prevData: any) => ({
        ...prevData,
        warrantyStart: baseDate,
        warrantyEnd: endDate
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        warrantyStart: baseDate,
        warrantyEnd: endDate
      }));
    }
    
    // Close calendar and clear temp state
    setShowCalendar(false);
    setActiveCalendarField(null);
    setTempSelectedDate(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {/* Edit Status Modal */}
      <Modal
        visible={showEditStatusModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditStatusModal(false)}
      >
        <View style={styles.addModalOverlay}>
          <View style={styles.addModalContainer}>
            {/* Modal Header */}
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>Update Status</Text>
              <TouchableOpacity
                style={styles.addModalCloseButton}
                onPress={() => setShowEditStatusModal(false)}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* ScrollView for modal content */}
            <ScrollView 
              style={styles.addModalScrollContent} 
              contentContainerStyle={styles.addModalScrollContentContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Status Display */}
              {editStatusData.newStatus && (
                <View style={styles.addModalField}>
                  <Text style={styles.addModalFieldLabel}>New Status</Text>
                  <View style={[styles.statusBadge, getStatusStyle(editStatusData.newStatus)]}>
                    <Text style={[styles.statusText, { color: getStatusStyle(editStatusData.newStatus).color }]}>
                      {editStatusData.newStatus}
                    </Text>
                  </View>
                </View>
              )}

              {/* Date Fields Based on Status */}
              {editStatusData.newStatus === 'To be scheduled' && (
                <View style={styles.dateFieldsContainer}>
                  <Text style={styles.addModalFieldLabel}>
                    {'This project will be marked as "To be scheduled" with no specific dates assigned.'}
                  </Text>
                </View>
              )}

              {editStatusData.newStatus === 'Rough-In' && (
                <View style={styles.dateFieldsContainer}>
                  <View style={styles.addModalField}>
                    <Text style={styles.addModalFieldLabel}>Date to Start</Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => openCalendar('roughInStart')}
                    >
                      <Ionicons name="calendar-outline" size={20} color="#64748B" />
                      <Text style={styles.dateInputText}>
                        {formatDisplayDate(editStatusData.roughInStart)}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.addModalField}>
                    <Text style={styles.addModalFieldLabel}>Date to End <Text style={styles.optionalText}>(Optional)</Text></Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => openCalendar('roughInEnd')}
                    >
                      <Ionicons name="calendar-outline" size={20} color="#64748B" />
                      <Text style={styles.dateInputText}>
                        {formatDisplayDate(editStatusData.roughInEnd)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {editStatusData.newStatus === 'Inspection' && (
                <View style={styles.dateFieldsContainer}>
                  <View style={styles.addModalField}>
                    <Text style={styles.addModalFieldLabel}>Date of Inspection</Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => openCalendar('inspectionDate')}
                    >
                      <Ionicons name="calendar-outline" size={20} color="#64748B" />
                      <Text style={styles.dateInputText}>
                        {formatDisplayDate(editStatusData.inspectionDate)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {editStatusData.newStatus === 'Final Trim' && (
                <View style={styles.dateFieldsContainer}>
                  <View style={styles.addModalField}>
                    <Text style={styles.addModalFieldLabel}>Date to Start</Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => openCalendar('finalTrimStart')}
                    >
                      <Ionicons name="calendar-outline" size={20} color="#64748B" />
                      <Text style={styles.dateInputText}>
                        {formatDisplayDate(editStatusData.finalTrimStart)}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.addModalField}>
                    <Text style={styles.addModalFieldLabel}>Date to End <Text style={styles.optionalText}>(Optional)</Text></Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => openCalendar('finalTrimEnd')}
                    >
                      <Ionicons name="calendar-outline" size={20} color="#64748B" />
                      <Text style={styles.dateInputText}>
                        {formatDisplayDate(editStatusData.finalTrimEnd)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {(editStatusData.newStatus === 'Completed' || editStatusData.newStatus === 'Service Call') && (
                <View style={styles.dateFieldsContainer}>
                  <View style={styles.addModalField}>
                    <Text style={styles.addModalFieldLabel}>Completed date</Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => openCalendar('completedDate')}
                    >
                      <Ionicons name="calendar-outline" size={20} color="#64748B" />
                      <Text style={styles.dateInputText}>
                        {formatDisplayDate(editStatusData.completedDate)}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.addModalField}>
                    <Text style={styles.addModalFieldLabel}>Warranty Date</Text>
                  </View>

                  <View style={styles.addModalField}>
                    <Text style={styles.addModalFieldLabel}>Date to start <Text style={styles.optionalText}>(Optional)</Text></Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => openCalendar('warrantyStart')}
                    >
                      <Ionicons name="calendar-outline" size={20} color="#64748B" />
                      <Text style={styles.dateInputText}>
                        {formatDisplayDate(editStatusData.warrantyStart)}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.addModalField}>
                    <Text style={styles.addModalFieldLabel}>Date to End <Text style={styles.optionalText}>(Optional)</Text></Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => openCalendar('warrantyEnd')}
                    >
                      <Ionicons name="calendar-outline" size={20} color="#64748B" />
                      <Text style={styles.dateInputText}>
                        {formatDisplayDate(editStatusData.warrantyEnd)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Assigned Team Section */}
              <View style={styles.addModalField}>
                <Text style={styles.addModalFieldLabel}>Assigned Team</Text>
                <TouchableOpacity
                  style={styles.employeeDropdownButton}
                  onPress={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
                >
                  <Text style={styles.employeeDropdownText}>
                    {editStatusData.assignedEmployee || 'Not assigned'}
                  </Text>
                  <Ionicons 
                    name={showEmployeeDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#64748B" 
                  />
                </TouchableOpacity>

                {/* Employee Dropdown Menu */}
                {showEmployeeDropdown && (
                  <View style={styles.employeeDropdownMenu}>
                    {employeeOptions.map((employee, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.employeeDropdownItem,
                          editStatusData.assignedEmployee === employee && styles.employeeDropdownItemSelected
                        ]}
                        onPress={() => {
                          setEditStatusData({
                            ...editStatusData,
                            assignedEmployee: employee
                          });
                          setShowEmployeeDropdown(false);
                        }}
                      >
                        <Text style={[
                          styles.employeeDropdownItemText,
                          editStatusData.assignedEmployee === employee && styles.employeeDropdownItemTextSelected
                        ]}>
                          {employee}
                        </Text>
                        {editStatusData.assignedEmployee === employee && (
                          <Ionicons name="checkmark" size={20} color="#4F46E5" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Alert Section */}
              <View style={styles.addModalField}>
                <Text style={styles.addModalFieldLabel}>Alert</Text>
                <View style={styles.alertPillsContainer}>
                  {alertOptions.map((alert, index) => {
                    const isSelected = editStatusData.alerts?.includes(alert) || false;
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.alertPill,
                          isSelected && styles.alertPillSelected
                        ]}
                        onPress={() => {
                          const currentAlerts = editStatusData.alerts || [];
                          let newAlerts;
                          
                          if (isSelected) {
                            // Remove alert if already selected
                            newAlerts = currentAlerts.filter((a: any) => a !== alert);
                          } else {
                            // Add alert if not selected
                            newAlerts = [...currentAlerts, alert];
                          }
                          
                          setEditStatusData({
                            ...editStatusData,
                            alerts: newAlerts
                          });
                        }}
                      >
                        <Text style={[
                          styles.alertPillText,
                          isSelected && styles.alertPillTextSelected
                        ]}>
                          {alert}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Notes Section */}
              <View style={styles.addModalField}>
                <Text style={styles.addModalFieldLabel}>Notes</Text>
                <TextInput
                  style={styles.notesTextArea}
                  placeholder="Add notes about this status change..."
                  value={editStatusData.notes || ''}
                  onChangeText={(text) => {
                    setEditStatusData({
                      ...editStatusData,
                      notes: text
                    });
                  }}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Modal Footer Buttons */}
              <View style={styles.addModalFooterInScroll}>
                <TouchableOpacity
                  style={[styles.addModalButton, styles.saveButton]}
                  onPress={() => {
                    // Update project with new status and dates
                    const updateData = {
                      status: editStatusData.newStatus,
                      roughInStart: editStatusData.roughInStart,
                      roughInEnd: editStatusData.roughInEnd,
                      inspectionDate: editStatusData.inspectionDate,
                      finalTrimStart: editStatusData.finalTrimStart,
                      finalTrimEnd: editStatusData.finalTrimEnd,
                      completedDate: editStatusData.completedDate,
                      warrantyStart: editStatusData.warrantyStart,
                      warrantyEnd: editStatusData.warrantyEnd,
                      assignedEmployee: editStatusData.assignedEmployee,
                      alerts: editStatusData.alerts || [],
                      notes: editStatusData.notes || ''
                    };
                    if (!editingProject) return;
                    updateProject(editingProject.id, updateData);
                    setProjects(getAllProjects());
                    
                    setShowEditStatusModal(false);
                    setEditingProject(null);
                    setEditStatusData({});
                    setShowEmployeeDropdown(false);
                  }}
                >
                  <Text style={styles.addModalButtonText}>Okay</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.addModalButton, styles.cancelAddButton]}
                  onPress={() => {
                    setShowEditStatusModal(false);
                    setEditingProject(null);
                    setEditStatusData({});
                    setShowEmployeeDropdown(false);
                  }}
                >
                  <Text style={styles.cancelAddButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Header */}
      <LinearGradient
        colors={['#4F46E5', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.spacer} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Projects</Text>
            <View style={styles.projectCountBadge}>
              <Text style={styles.projectCountText}>
                {viewMode === 'all' 
                  ? filteredProjects.length 
                  : filteredCompanies.reduce((sum, company) => sum + company.projects.length, 0)
                }
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Search Bar & Filters */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={18} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, address, phone, permit..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <View style={styles.filterContainer}>
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <Ionicons name="filter" size={16} color="#1F2937" />
            </TouchableOpacity>

            {showFilterDropdown && (
              <View style={styles.filterDropdownMenu}>
                <TouchableOpacity
                  style={[styles.filterOption, selectedFilter === 'All' && styles.filterOptionActive]}
                  onPress={() => {
                    setSelectedFilter('All');
                    setShowFilterDropdown(false);
                  }}
                >
                  <Text style={[styles.filterOptionText, selectedFilter === 'All' && styles.filterOptionTextActive]}>
                    All Projects
                  </Text>
                  {selectedFilter === 'All' && <Ionicons name="checkmark" size={16} color="#4F46E5" />}
                </TouchableOpacity>

                {statusOptions.map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.filterOption, selectedFilter === status && styles.filterOptionActive]}
                    onPress={() => {
                      setSelectedFilter(status);
                      setShowFilterDropdown(false);
                    }}
                  >
                    <View style={[styles.filterStatusDot, getStatusStyle(status)]} />
                    <Text style={[styles.filterOptionText, selectedFilter === status && styles.filterOptionTextActive]}>
                      {status}
                    </Text>
                    {selectedFilter === status && <Ionicons name="checkmark" size={16} color="#4F46E5" />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Storage Usage Bar */}
        <View style={styles.storageBar}>
          <Ionicons name="cloud-outline" size={16} color="#64748B" />
          <Text style={styles.storageText}>2.3 GB of 15 GB used • Linked: Google Drive, OneDrive</Text>
          <TouchableOpacity>
            <Text style={styles.manageButton}>Manage</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={[styles.quickActionCard, viewMode === 'all' && styles.quickActionCardActive]}
            onPress={() => switchViewMode('all')}
          >
            <View style={[styles.quickActionIconContainer, viewMode === 'all' && styles.quickActionIconContainerActive]}>
              <Ionicons name="folder-open-outline" size={24} color={viewMode === 'all' ? "#FFFFFF" : "#4F46E5"} />
            </View>
            <Text style={[styles.quickActionLabel, viewMode === 'all' && styles.quickActionLabelActive]}>All Projects</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickActionCard, viewMode === 'company' && styles.quickActionCardActive]}
            onPress={() => switchViewMode('company')}
          >
            <View style={[styles.quickActionIconContainer, viewMode === 'company' && styles.quickActionIconContainerActive]}>
              <Ionicons name="business-outline" size={24} color={viewMode === 'company' ? "#FFFFFF" : "#4F46E5"} />
            </View>
            <Text style={[styles.quickActionLabel, viewMode === 'company' && styles.quickActionLabelActive]}>By Company</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push('/profitloss')}>
            <View style={styles.quickActionIconContainer}>
              <Ionicons name="stats-chart-outline" size={24} color="#4F46E5" />
            </View>
            <Text style={styles.quickActionLabel}>Profit & Loss</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/gallery')}
          >
            <View style={styles.quickActionIconContainer}>
              <Ionicons name="images-outline" size={24} color="#4F46E5" />
            </View>
            <Text style={styles.quickActionLabel}>Project Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Projects Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{viewMode === 'all' ? 'Projects' : 'Companies'}</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllButton}>See all</Text>
          </TouchableOpacity>
        </View>

        {/* Animated Content Container */}
        <Animated.View style={{ opacity: fadeAnim }}>
          {viewMode === 'all' ? (
            // All Projects View
            <>
              {availableLetters.map((letter) => (
          <View
            key={letter}
            style={styles.letterGroupContainer}
            onLayout={(event) => {
              const { y } = event.nativeEvent.layout;
              sectionRefs.current[letter] = y;
            }}
          >
            <Text style={styles.letterHeader}>{letter}</Text>
            {groupedProjects[letter].map((project: Project) => (
              <View key={project.id} style={styles.projectCard}>
                {/* Avatar & Info */}
                <View style={styles.projectHeader}>
                  <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{project.initials}</Text>
                    </View>
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
                  <View style={styles.projectInfo}>
                    <Text style={styles.projectName}>{project.name}</Text>
                    <Text style={styles.projectAddress}>{project.street}</Text>
                    <Text style={styles.projectAddress}>{project.city}</Text>
                  </View>
                  <View style={styles.statusDropdownContainer}>
                    <TouchableOpacity
                      ref={(ref) => {
                        if (ref && openStatusDropdown === project.id && !positionMeasured.current) {
                          positionMeasured.current = true;
                          ref.measureInWindow((x, y, width, height) => {
                            setDropdownPosition({ x, y: y + height, width, height });
                          });
                        }
                      }}
                      style={[styles.statusBadge, getStatusStyle(project.status)]}
                      onPress={() => {
                        if (openStatusDropdown === project.id) {
                          setOpenStatusDropdown(null);
                          positionMeasured.current = false;
                        } else {
                          positionMeasured.current = false;
                          setOpenStatusDropdown(project.id);
                        }
                      }}
                    >
                      <Text style={[styles.statusText, { color: getStatusStyle(project.status).color }]}>
                        {project.status}
                      </Text>
                      <Ionicons 
                        name="chevron-down" 
                        size={12} 
                        color={getStatusStyle(project.status).color}
                        style={styles.statusChevron}
                      />
                    </TouchableOpacity>

                    {/* Date Display Under Status */}
                    {project.status === 'Rough-In' && (project.roughInStart || project.roughInEnd) && (
                      <View style={styles.projectDatesContainer}>
                        {project.roughInStart && (
                          <Text style={styles.projectDateText}>
                            Start: {formatDisplayDate(project.roughInStart)}
                          </Text>
                        )}
                        {project.roughInEnd && (
                          <Text style={styles.projectDateText}>
                            End: {formatDisplayDate(project.roughInEnd)}
                          </Text>
                        )}
                      </View>
                    )}

                    {project.status === 'Inspection' && project.inspectionDate && (
                      <View style={styles.projectDatesContainer}>
                        <Text style={styles.projectDateText}>
                          {formatDisplayDate(project.inspectionDate)}
                        </Text>
                      </View>
                    )}

                    {project.status === 'Final Trim' && (project.finalTrimStart || project.finalTrimEnd) && (
                      <View style={styles.projectDatesContainer}>
                        {project.finalTrimStart && (
                          <Text style={styles.projectDateText}>
                            Start: {formatDisplayDate(project.finalTrimStart)}
                          </Text>
                        )}
                        {project.finalTrimEnd && (
                          <Text style={styles.projectDateText}>
                            End: {formatDisplayDate(project.finalTrimEnd)}
                          </Text>
                        )}
                      </View>
                    )}

                    {(project.status === 'Completed' || project.status === 'Service Call') && (project.completedDate || project.warrantyStart || project.warrantyEnd) && (
                      <View style={styles.projectDatesContainer}>
                        {project.completedDate && (
                          <Text style={styles.projectDateText}>
                            {formatDisplayDate(project.completedDate)}
                          </Text>
                        )}
                        {(project.warrantyStart || project.warrantyEnd) && (
                          <View>
                            <Text style={styles.projectDateText}>Warranty</Text>
                            <Text style={styles.projectDateText}>
                              ({project.warrantyStart ? formatDisplayDate(project.warrantyStart) : ''}{project.warrantyStart && project.warrantyEnd ? ' - ' : ''}{project.warrantyEnd ? formatDisplayDate(project.warrantyEnd) : ''})
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                </View>

                {/* Other Contacts Dropdown */}
                <View style={styles.otherContactsContainer}>
                  <TouchableOpacity
                    style={styles.otherContactsButton}
                    onPress={() => setOpenContactDropdown(openContactDropdown === project.id ? null : project.id)}
                  >
                    <Text style={styles.otherContactsButtonText}>Other Contacts</Text>
                    <Ionicons name="chevron-down" size={12} color="#64748B" />
                  </TouchableOpacity>

                  {openContactDropdown === project.id && (
                    <View style={styles.contactDropdownMenu}>
                      {(project.otherContacts || []).map((contact: any) => (
                        <TouchableOpacity
                          key={contact.id}
                          style={styles.contactDropdownItem}
                          onPress={() => handleContactClick(contact, project.id)}
                        >
                          <Text style={styles.contactDropdownName}>{contact.name}</Text>
                          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                        </TouchableOpacity>
                      ))}
                      
                      <TouchableOpacity
                        style={styles.addContactDropdownButton}
                        onPress={() => handleAddNewContact(project.id)}
                      >
                        <Ionicons name="add" size={16} color="#4F46E5" />
                        <Text style={styles.addContactDropdownText}>Add another contact</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.detailsButton}
                    onPress={() => router.push(`/project-details?id=${project.id}`)}
                  >
                    <Ionicons name="document-text-outline" size={16} color="#1F2937" style={styles.buttonIcon} />
                    <Text style={styles.detailsButtonText}>Project Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.shareButtonWrapper}>
                    <LinearGradient
                      colors={['#4F46E5', '#3B82F6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.shareButton}
                    >
                      <Ionicons name="share-social-outline" size={16} color="#FFFFFF" style={styles.buttonIcon} />
                      <Text style={styles.shareButtonText}>Share</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
              ))}
            </>
          ) : (
            // By Company View
            <>
              {availableCompanyLetters.map((letter) => (
                <View
                  key={letter}
                  style={styles.letterGroupContainer}
                  onLayout={(event) => {
                    const { y } = event.nativeEvent.layout;
                    sectionRefs.current[letter] = y;
                  }}
                >
                  <Text style={styles.letterHeader}>{letter}</Text>
                  {groupedCompanies[letter].map((company: any) => (
                    <View key={company.id} style={styles.companyCard}>
                      {/* Company Header */}
                      <View style={styles.companyHeaderContainer}>
                        <TouchableOpacity
                          style={styles.companyHeader}
                          onPress={() => toggleCompany(company.id)}
                        >
                          <View style={styles.companyAvatar}>
                            <Text style={styles.companyAvatarText}>{company.initials}</Text>
                          </View>
                          <View style={styles.companyInfo}>
                            <Text style={styles.companyName}>{company.name}</Text>
                            <Text style={styles.projectCount}>
                              {company.projects.length} {company.projects.length === 1 ? 'project' : 'projects'}
                            </Text>
                          </View>
                          <Ionicons 
                            name={expandedCompanies[company.id] ? "chevron-up" : "chevron-down"} 
                            size={20} 
                            color="#64748B" 
                          />
                        </TouchableOpacity>
                        
                        {/* Company Info Dropdown Button */}
                        <TouchableOpacity
                          style={styles.companyInfoButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            setOpenCompanyInfoDropdown(openCompanyInfoDropdown === company.id ? null : company.id);
                          }}
                        >
                          <Ionicons 
                            name={openCompanyInfoDropdown === company.id ? "chevron-up" : "information-circle-outline"} 
                            size={24} 
                            color="#4F46E5" 
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Company Info Dropdown */}
                      {openCompanyInfoDropdown === company.id && (
                        <View style={styles.companyInfoDropdown}>
                          {/* Edit Button */}
                          <View style={styles.companyInfoEditHeader}>
                            <Text style={styles.companyInfoEditTitle}>Company Information</Text>
                            <TouchableOpacity
                              style={styles.companyInfoEditButton}
                              onPress={() => handleEditCompany(company)}
                            >
                              <Ionicons name="pencil" size={18} color="#4F46E5" />
                              <Text style={styles.companyInfoEditButtonText}>Edit</Text>
                            </TouchableOpacity>
                          </View>

                          {company.tradeIndustry && (
                            <View style={styles.companyInfoRow}>
                              <Ionicons name="briefcase-outline" size={20} color="#4F46E5" style={styles.companyInfoIcon} />
                              <View style={styles.companyInfoTextContainer}>
                                <Text style={styles.companyInfoLabel}>TRADE INDUSTRY</Text>
                                <Text style={styles.companyInfoValue}>{company.tradeIndustry}</Text>
                              </View>
                            </View>
                          )}
                          
                          <View style={styles.companyInfoRow}>
                            <Ionicons name="business-outline" size={20} color="#4F46E5" style={styles.companyInfoIcon} />
                            <View style={styles.companyInfoTextContainer}>
                              <Text style={styles.companyInfoLabel}>COMPANY NAME</Text>
                              <Text style={styles.companyInfoValue}>{company.name}</Text>
                            </View>
                          </View>

                          {company.phone && (
                            <TouchableOpacity 
                              style={styles.companyInfoRow}
                              onPress={() => Linking.openURL(`tel:${company.phone}`)}
                            >
                              <Ionicons name="call-outline" size={20} color="#4F46E5" style={styles.companyInfoIcon} />
                              <View style={styles.companyInfoTextContainer}>
                                <Text style={styles.companyInfoLabel}>{"CONTACT'S PHONE NUMBER"}</Text>
                                <Text style={styles.companyInfoValue}>{company.phone}</Text>
                              </View>
                            </TouchableOpacity>
                          )}

                          {company.email && (
                            <TouchableOpacity 
                              style={styles.companyInfoRow}
                              onPress={() => Linking.openURL(`mailto:${company.email}`)}
                            >
                              <Ionicons name="mail-outline" size={20} color="#4F46E5" style={styles.companyInfoIcon} />
                              <View style={styles.companyInfoTextContainer}>
                                <Text style={styles.companyInfoLabel}>CONTACT EMAIL ADDRESS</Text>
                                <Text style={styles.companyInfoValue}>{company.email}</Text>
                              </View>
                            </TouchableOpacity>
                          )}

                          {company.website && (
                            <TouchableOpacity 
                              style={styles.companyInfoRow}
                              onPress={() => Linking.openURL(`https://${company.website}`)}
                            >
                              <Ionicons name="globe-outline" size={20} color="#4F46E5" style={styles.companyInfoIcon} />
                              <View style={styles.companyInfoTextContainer}>
                                <Text style={styles.companyInfoLabel}>WEBSITE</Text>
                                <Text style={styles.companyInfoValue}>{company.website}</Text>
                              </View>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}

                      {/* Expanded Projects List */}
                      {expandedCompanies[company.id] && (
                        <View style={styles.projectsList}>
                          {company.projects.map((project: any) => (
                            <View key={project.id} style={styles.projectCardInCompany}>
                              {/* Avatar & Info */}
                              <View style={styles.projectHeader}>
                                <View style={styles.avatarContainer}>
                                  <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{project.initials}</Text>
                                  </View>
                                  {project.companyInitials && (
                                    <View style={styles.companyBadge}>
                                      <Text style={styles.companyBadgeText}>{project.companyInitials}</Text>
                                    </View>
                                  )}
                                </View>
                                <View style={styles.projectInfo}>
                                  <Text style={styles.projectName}>{project.name}</Text>
                                  <Text style={styles.projectAddress}>{project.street}</Text>
                                  <Text style={styles.projectAddress}>{project.city}</Text>
                                </View>
                                <View style={styles.statusDropdownContainer}>
                                  <TouchableOpacity
                                    ref={(ref) => {
                                      if (ref && openStatusDropdown === project.id && !positionMeasured.current) {
                                        positionMeasured.current = true;
                                        ref.measureInWindow((x, y, width, height) => {
                                          setDropdownPosition({ x, y: y + height, width, height });
                                        });
                                      }
                                    }}
                                    style={[styles.statusBadge, getStatusStyle(project.status)]}
                                    onPress={() => {
                                      if (openStatusDropdown === project.id) {
                                        setOpenStatusDropdown(null);
                                        positionMeasured.current = false;
                                      } else {
                                        positionMeasured.current = false;
                                        setOpenStatusDropdown(project.id);
                                      }
                                    }}
                                  >
                                    <Text style={[styles.statusText, { color: getStatusStyle(project.status).color }]}>
                                      {project.status}
                                    </Text>
                                    <Ionicons 
                                      name="chevron-down" 
                                      size={12} 
                                      color={getStatusStyle(project.status).color}
                                      style={styles.statusChevron}
                                    />
                                  </TouchableOpacity>

                                  {/* Date Display Under Status */}
                                  {project.status === 'Rough-In' && (project.roughInStart || project.roughInEnd) && (
                                    <View style={styles.projectDatesContainer}>
                                      {project.roughInStart && (
                                        <Text style={styles.projectDateText}>
                                          Start: {formatDisplayDate(project.roughInStart)}
                                        </Text>
                                      )}
                                      {project.roughInEnd && (
                                        <Text style={styles.projectDateText}>
                                          End: {formatDisplayDate(project.roughInEnd)}
                                        </Text>
                                      )}
                                    </View>
                                  )}

                                  {project.status === 'Inspection' && project.inspectionDate && (
                                    <View style={styles.projectDatesContainer}>
                                      <Text style={styles.projectDateText}>
                                        {formatDisplayDate(project.inspectionDate)}
                                      </Text>
                                    </View>
                                  )}

                                  {project.status === 'Final Trim' && (project.finalTrimStart || project.finalTrimEnd) && (
                                    <View style={styles.projectDatesContainer}>
                                      {project.finalTrimStart && (
                                        <Text style={styles.projectDateText}>
                                          Start: {formatDisplayDate(project.finalTrimStart)}
                                        </Text>
                                      )}
                                      {project.finalTrimEnd && (
                                        <Text style={styles.projectDateText}>
                                          End: {formatDisplayDate(project.finalTrimEnd)}
                                        </Text>
                                      )}
                                    </View>
                                  )}

                                  {project.status === 'Completed' && (project.completedDate || project.warrantyStart || project.warrantyEnd) && (
                                    <View style={styles.projectDatesContainer}>
                                      {project.completedDate && (
                                        <Text style={styles.projectDateText}>
                                          {formatDisplayDate(project.completedDate)}
                                        </Text>
                                      )}
                                      {(project.warrantyStart || project.warrantyEnd) && (
                                        <View>
                                          <Text style={styles.projectDateText}>Warranty</Text>
                                          <Text style={styles.projectDateText}>
                                            ({project.warrantyStart ? formatDisplayDate(project.warrantyStart) : ''}{project.warrantyStart && project.warrantyEnd ? ' - ' : ''}{project.warrantyEnd ? formatDisplayDate(project.warrantyEnd) : ''})
                                          </Text>
                                        </View>
                                      )}
                                    </View>
                                  )}
                                </View>
                              </View>

                              {/* Other Contacts Dropdown */}
                              <View style={styles.otherContactsContainer}>
                                <TouchableOpacity
                                  style={styles.otherContactsButton}
                                  onPress={() => setOpenContactDropdown(openContactDropdown === project.id ? null : project.id)}
                                >
                                  <Text style={styles.otherContactsButtonText}>Other Contacts</Text>
                                  <Ionicons name="chevron-down" size={12} color="#64748B" />
                                </TouchableOpacity>

                                {openContactDropdown === project.id && (
                                  <View style={styles.contactDropdownMenu}>
                                    {(project.otherContacts || []).map((contact: any) => (
                                      <TouchableOpacity
                                        key={contact.id}
                                        style={styles.contactDropdownItem}
                                        onPress={() => handleContactClick(contact, project.id)}
                                      >
                                        <Text style={styles.contactDropdownName}>{contact.name}</Text>
                                        <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                                      </TouchableOpacity>
                                    ))}
                                    
                                    <TouchableOpacity
                                      style={styles.addContactDropdownButton}
                                      onPress={() => handleAddNewContact(project.id)}
                                    >
                                      <Ionicons name="add" size={16} color="#4F46E5" />
                                      <Text style={styles.addContactDropdownText}>Add another contact</Text>
                                    </TouchableOpacity>
                                  </View>
                                )}
                              </View>

                              {/* Action Buttons */}
                              <View style={styles.actionButtons}>
                                <TouchableOpacity 
                                  style={styles.detailsButton}
                                  onPress={() => router.push(`/project-details?id=${project.id}`)}
                                >
                                  <Ionicons name="document-text-outline" size={16} color="#1F2937" style={styles.buttonIcon} />
                                  <Text style={styles.detailsButtonText}>Project Details</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.shareButtonWrapper}>
                                  <LinearGradient
                                    colors={['#4F46E5', '#3B82F6']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.shareButton}
                                  >
                                    <Ionicons name="share-social-outline" size={16} color="#FFFFFF" style={styles.buttonIcon} />
                                    <Text style={styles.shareButtonText}>Share</Text>
                                  </LinearGradient>
                                </TouchableOpacity>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </>
          )}
        </Animated.View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* A-Z Index */}
      {showIndex && (
        <View 
          style={styles.alphabetIndex}
          onLayout={(event) => {
            const { y: containerY } = event.nativeEvent.layout;
            alphabet.forEach((letter, index) => {
              const letterY = containerY + (index * 24) + 12;
              letterRefs.current[letter] = letterY;
            });
          }}
        >
          {alphabet.map((letter) => (
            <TouchableOpacity
              key={letter}
              onPress={() => handleIndexTouch(letter)}
              disabled={!currentAvailableLetters.includes(letter)}
              style={[
                styles.indexLetter,
                activeIndex === letter && styles.indexLetterActive,
                !currentAvailableLetters.includes(letter) && styles.indexLetterDisabled,
              ]}
            >
              <Text
                style={[
                  styles.indexLetterText,
                  activeIndex === letter && styles.indexLetterTextActive,
                  !availableLetters.includes(letter) && styles.indexLetterTextDisabled,
                ]}
              >
                {letter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Magnifier Bubble */}
      {activeIndex && showIndex && (
        <View style={[styles.magnifierBubble, { top: magnifierPos }]}>
          <Text style={styles.magnifierText}>{activeIndex}</Text>
        </View>
      )}

      {/* Status Dropdown Modal */}
      <Modal
        visible={openStatusDropdown !== null}
        transparent={true}
        animationType="none"
        onRequestClose={() => setOpenStatusDropdown(null)}
      >
        <TouchableOpacity 
          style={styles.statusDropdownOverlay}
          activeOpacity={1}
          onPress={() => setOpenStatusDropdown(null)}
        >
          <View style={[styles.statusDropdownMenuModal, dropdownPosition && (() => {
            const screenWidth = Dimensions.get('window').width;
            const dropdownWidth = 180;
            const padding = 16;
            
            let leftPosition = dropdownPosition.x;
            
            // Check if dropdown would go off-screen to the right
            if (leftPosition + dropdownWidth > screenWidth - padding) {
              // Align to the right edge with padding
              leftPosition = screenWidth - dropdownWidth - padding;
            }
            
            // Make sure it doesn't go off-screen to the left
            if (leftPosition < padding) {
              leftPosition = padding;
            }
            
            return {
              top: dropdownPosition.y,
              left: leftPosition
            };
          })()]}>
            {statusOptions.map((status) => {
              const currentProject = projects.find(p => p.id === openStatusDropdown);
              if (!currentProject) return null;
              
              return (
                <TouchableOpacity
                  key={status}
                  style={styles.statusDropdownItem}
                  onPress={() => {
                    // If same status, just close dropdown
                    if (status === currentProject.status) {
                      setOpenStatusDropdown(null);
                      return;
                    }
                    
                    // For all statuses, open date modal
                    setEditingProject(currentProject);
                    setEditStatusData({
                      newStatus: status,
                      roughInStart: currentProject.roughInStart || formatDate(new Date()),
                      roughInEnd: currentProject.roughInEnd || '',
                      inspectionDate: currentProject.inspectionDate || getNextBusinessDay(new Date()),
                      finalTrimStart: currentProject.finalTrimStart || formatDate(new Date()),
                      finalTrimEnd: currentProject.finalTrimEnd || '',
                      completedDate: currentProject.completedDate || formatDate(new Date()),
                      warrantyStart: currentProject.warrantyStart || formatDate(new Date()),
                      warrantyEnd: currentProject.warrantyEnd || '',
                      assignedEmployee: currentProject.assignedEmployee || 'Not assigned',
                      alerts: currentProject.alerts || [],
                      notes: currentProject.notes || ''
                    });
                    setOpenStatusDropdown(null);
                    setShowEditStatusModal(true);
                  }}
                >
                  <View style={[styles.statusDropdownDot, getStatusStyle(status)]} />
                  <Text style={styles.statusDropdownText}>{status}</Text>
                  {currentProject.status === status && (
                    <Ionicons name="checkmark" size={16} color="#4F46E5" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Contact Details Modal */}
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
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowContactModal(false);
              setIsEditingContact(false);
              setIsAddingNote(false);
              setIsAddingNewContact(false);
            }}
          />
          
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <LinearGradient
              colors={['#4F46E5', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalHeader}
            >
              <Text style={styles.modalHeaderTitle}>
                {isAddingNewContact ? 'Add New Contact' : 'Contact Details'}
              </Text>
              <View style={styles.modalHeaderButtons}>
                {!isAddingNewContact && (
                  <TouchableOpacity
                    style={styles.modalHeaderButton}
                    onPress={handleDeleteContact}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.modalHeaderButton}
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

            {/* Modal Content */}
            <ScrollView style={styles.modalContent}>
              {/* Full Name */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Full Name</Text>
                {isEditingContact ? (
                  <TextInput
                    style={styles.modalInput}
                    value={editedContactData.name || ''}
                    onChangeText={(text) => setEditedContactData({ ...editedContactData, name: text })}
                    placeholder="Enter full name"
                    placeholderTextColor="#94A3B8"
                  />
                ) : (
                  <Text style={styles.modalFieldValue}>{selectedContact?.name}</Text>
                )}
              </View>

              {/* Phone */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Phone Number</Text>
                {isEditingContact ? (
                  <TextInput
                    style={styles.modalInput}
                    value={editedContactData.phone || ''}
                    onChangeText={(text) => setEditedContactData({ ...editedContactData, phone: text })}
                    placeholder="Enter phone number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                  />
                ) : (
                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalFieldValue}>{selectedContact?.phone}</Text>
                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.callButton]}
                        onPress={() => Linking.openURL(`tel:${selectedContact?.phone}`)}
                      >
                        <Text style={styles.actionButtonText}>Call</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.textButton]}
                        onPress={() => Linking.openURL(`sms:${selectedContact?.phone}`)}
                      >
                        <Text style={styles.actionButtonText}>Text</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {/* Email */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Email</Text>
                {isEditingContact ? (
                  <TextInput
                    style={styles.modalInput}
                    value={editedContactData.email || ''}
                    onChangeText={(text) => setEditedContactData({ ...editedContactData, email: text })}
                    placeholder="Enter email"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                ) : (
                  <View style={styles.modalFieldRow}>
                    <Text style={styles.modalFieldValue}>{selectedContact?.email}</Text>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.emailButton]}
                      onPress={() => Linking.openURL(`mailto:${selectedContact?.email}`)}
                    >
                      <Text style={styles.actionButtonText}>Email</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Note Section */}
              {!isEditingContact && (
                <View style={styles.modalField}>
                  <Text style={styles.modalFieldLabel}>Note</Text>
                  {isAddingNote ? (
                    <View>
                      <TextInput
                        style={styles.modalTextArea}
                        value={noteText}
                        onChangeText={setNoteText}
                        placeholder="Add a short message..."
                        placeholderTextColor="#94A3B8"
                        multiline
                        numberOfLines={3}
                      />
                      <View style={styles.noteButtonsRow}>
                        <TouchableOpacity
                          style={styles.saveNoteButton}
                          onPress={handleSaveNote}
                        >
                          <Text style={styles.saveNoteButtonText}>Save Note</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.cancelNoteButton}
                          onPress={() => {
                            setIsAddingNote(false);
                            setNoteText(selectedContact?.note || '');
                          }}
                        >
                          <Text style={styles.cancelNoteButtonText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View>
                      {selectedContact?.note ? (
                        <View style={styles.noteDisplay}>
                          <Text style={styles.noteText}>{selectedContact.note}</Text>
                        </View>
                      ) : (
                        <Text style={styles.noNoteText}>No note added</Text>
                      )}
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              {isEditingContact ? (
                <View style={styles.footerButtonsRow}>
                  <TouchableOpacity
                    style={[styles.footerButton, styles.saveButton, 
                      (!editedContactData.name || !editedContactData.phone || !editedContactData.email) && styles.disabledButton
                    ]}
                    onPress={handleSaveContact}
                    disabled={!editedContactData.name || !editedContactData.phone || !editedContactData.email}
                  >
                    <LinearGradient
                      colors={['#4F46E5', '#3B82F6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.saveButtonGradient}
                    >
                      <Text style={styles.saveButtonText}>
                        {isAddingNewContact ? 'Add Contact' : 'Save'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.footerButton, styles.cancelButton]}
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
                <View style={styles.footerButtonsRow}>
                  <TouchableOpacity
                    style={[styles.footerButton, styles.noteFooterButton]}
                    onPress={() => setIsAddingNote(true)}
                  >
                    <Ionicons name="add" size={16} color="#475569" />
                    <Text style={styles.noteFooterButtonText}>Note</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.footerButton, styles.editButton]}
                    onPress={() => setIsEditingContact(true)}
                  >
                    <LinearGradient
                      colors={['#4F46E5', '#3B82F6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.editButtonGradient}
                    >
                      <Ionicons name="create-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.editButtonText}>Edit</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Contact Warning Modal */}
      <Modal
        visible={showDeleteWarning}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteWarning(false)}
      >
        <View style={styles.deleteContactWarningOverlay}>
          <TouchableOpacity 
            style={styles.deleteContactBackdrop}
            activeOpacity={1}
            onPress={() => setShowDeleteWarning(false)}
          />
          
          <View style={styles.deleteContactWarningContainer}>
            {/* Warning Icon */}
            <View style={styles.deleteContactIconContainer}>
              <View style={styles.deleteContactIconCircle}>
                <Ionicons name="warning" size={48} color="#DC2626" />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.deleteContactWarningTitle}>Delete Contact?</Text>
            
            {/* Description */}
            <Text style={styles.deleteContactWarningDescription}>
              You are about to permanently delete{' '}
              <Text style={styles.deleteContactName}>
                {selectedContact?.name || 'this contact'}
              </Text>
              .
            </Text>

            {/* Warning Box */}
            <View style={styles.deleteContactWarningBox}>
              <View style={styles.deleteContactWarningBoxHeader}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Text style={styles.deleteContactWarningBoxTitle}>Warning: This action cannot be undone!</Text>
              </View>
              
              <View style={styles.deleteContactWarningList}>
                <View style={styles.deleteContactWarningListItem}>
                  <View style={styles.deleteContactWarningBullet} />
                  <Text style={styles.deleteContactWarningListText}>This contact will be permanently deleted</Text>
                </View>
                <View style={styles.deleteContactWarningListItem}>
                  <View style={styles.deleteContactWarningBullet} />
                  <Text style={styles.deleteContactWarningListText}>There is no backup or recovery option</Text>
                </View>
                <View style={styles.deleteContactWarningListItem}>
                  <View style={styles.deleteContactWarningBullet} />
                  <Text style={styles.deleteContactWarningListText}>All associated data will be lost forever</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.deleteContactWarningActions}>
              <TouchableOpacity 
                style={styles.deleteContactCancelButton}
                onPress={() => setShowDeleteWarning(false)}
              >
                <Text style={styles.deleteContactCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.deleteContactConfirmButton}
                onPress={confirmDeleteContact}
              >
                <LinearGradient
                  colors={['#DC2626', '#B91C1C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.deleteContactConfirmGradient}
                >
                  <Ionicons name="trash" size={20} color="#FFFFFF" />
                  <Text style={styles.deleteContactConfirmButtonText}>Delete Permanently</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add New Project Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              Keyboard.dismiss();
              handleCloseModal();
            }}
          />
          
          <View style={styles.addModalContainer}>
            {/* Modal Header */}
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>Add New Project</Text>
              <Text style={styles.addModalDescription}>
                Enter the project details below. Only name is required.
              </Text>
            </View>

            {/* Main Scrollable Content - Everything scrolls together */}
            <ScrollView 
              ref={modalScrollRef}
              style={styles.addModalScrollContent} 
              contentContainerStyle={styles.addModalScrollContentContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Name Field */}
              <View style={styles.addModalField}>
                <Text style={styles.addModalFieldLabel}>
                  Name <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.addModalInput,
                    formErrors.name && styles.addModalInputError
                  ]}
                  placeholder="Enter project name"
                  placeholderTextColor="#94A3B8"
                  value={formData.name}
                  onChangeText={(text) => {
                    setFormData({ ...formData, name: text });
                    if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                  }}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
                {formErrors.name && (
                  <Text style={styles.errorText}>{formErrors.name}</Text>
                )}
              </View>

              {/* Company Field - Dropdown */}
              <View style={styles.addModalField}>
                <Text style={styles.addModalFieldLabel}>Company</Text>
                <TouchableOpacity
                  style={styles.companyDropdownButton}
                  onPress={() => setShowCompanyDropdown(!showCompanyDropdown)}
                >
                  <Text style={[
                    styles.companyDropdownButtonText,
                    !formData.company && styles.companyDropdownPlaceholder
                  ]}>
                    {formData.company || 'Select Company (Optional)'}
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
                        !formData.company && styles.companyDropdownItemSelected
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, company: '' });
                        setShowCompanyDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.companyDropdownItemText,
                        !formData.company && styles.companyDropdownItemTextSelected
                      ]}>
                        No Company
                      </Text>
                      {!formData.company && (
                        <Ionicons name="checkmark" size={20} color="#4F46E5" />
                      )}
                    </TouchableOpacity>
                    
                    {/* Company options */}
                    {companies.map((company) => (
                      <TouchableOpacity
                        key={company.id}
                        style={[
                          styles.companyDropdownItem,
                          formData.company === company.name && styles.companyDropdownItemSelected
                        ]}
                        onPress={() => {
                          setFormData({ ...formData, company: company.name });
                          setShowCompanyDropdown(false);
                        }}
                      >
                        <View style={styles.companyDropdownItemContent}>
                          <View style={styles.companyDropdownInitials}>
                            <Text style={styles.companyDropdownInitialsText}>{company.initials}</Text>
                          </View>
                          <Text style={[
                            styles.companyDropdownItemText,
                            formData.company === company.name && styles.companyDropdownItemTextSelected
                          ]}>
                            {company.name}
                          </Text>
                        </View>
                        {formData.company === company.name && (
                          <Ionicons name="checkmark" size={20} color="#4F46E5" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Phone Number Field */}
              <View style={styles.addModalField}>
                <Text style={styles.addModalFieldLabel}>Phone Number</Text>
                <TextInput
                  style={styles.addModalInput}
                  placeholder="(XXX) XXX-XXXX"
                  placeholderTextColor="#94A3B8"
                  value={formData.phone}
                  onChangeText={(text) => {
                    const formatted = formatPhoneNumber(text);
                    setFormData({ ...formData, phone: formatted });
                  }}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                  maxLength={14}
                />
              </View>

              {/* Email Field */}
              <View style={styles.addModalField}>
                <Text style={styles.addModalFieldLabel}>Email</Text>
                <TextInput
                  style={styles.addModalInput}
                  placeholder="info@OffiAxis.com"
                  placeholderTextColor="#94A3B8"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>

              {/* Street Field */}
              <View style={styles.addModalField}>
                <Text style={styles.addModalFieldLabel}>Street Name</Text>
                <TextInput
                  style={styles.addModalInput}
                  placeholder="Enter street address"
                  placeholderTextColor="#94A3B8"
                  value={formData.street}
                  onChangeText={(text) => setFormData({ ...formData, street: text })}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>

              {/* City, State, Zip on one row */}
              <View style={styles.addressRowContainer}>
                <View style={[styles.addModalField, styles.cityField]}>
                  <Text style={styles.addModalFieldLabel} numberOfLines={1}>City</Text>
                  <TextInput
                    style={styles.addModalInput}
                    placeholder="City"
                    placeholderTextColor="#94A3B8"
                    value={formData.city}
                    onChangeText={(text) => setFormData({ ...formData, city: text })}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>

                <View style={[styles.addModalField, styles.stateField]}>
                  <Text style={styles.addModalFieldLabel} numberOfLines={1}>State</Text>
                  <TextInput
                    style={styles.addModalInput}
                    placeholder="CO"
                    placeholderTextColor="#94A3B8"
                    value={formData.state}
                    onChangeText={(text) => setFormData({ ...formData, state: text.toUpperCase() })}
                    autoCapitalize="characters"
                    maxLength={2}
                    returnKeyType="next"
                  />
                </View>

                <View style={[styles.addModalField, styles.zipField]}>
                  <Text style={styles.addModalFieldLabel} numberOfLines={1}>Zip</Text>
                  <TextInput
                    style={styles.addModalInput}
                    placeholder="80202"
                    placeholderTextColor="#94A3B8"
                    value={formData.zip}
                    onChangeText={(text) => setFormData({ ...formData, zip: text })}
                    keyboardType="numeric"
                    maxLength={5}
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                </View>
              </View>

              {/* Status Field */}
              <View style={styles.addModalField}>
                <Text style={styles.addModalFieldLabel}>Status</Text>
                <View style={styles.statusPickerContainer}>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => {
                      setShowStatusPicker(!showStatusPicker);
                      // Scroll to show full status dropdown
                      setTimeout(() => {
                        if (modalScrollRef.current && !showStatusPicker) {
                          modalScrollRef.current.scrollTo({ y: 600, animated: true });
                        }
                      }, 150);
                    }}
                  >
                    <View style={[styles.statusIndicatorDot, getStatusStyle(formData.status)]} />
                    <Text style={styles.pickerButtonText}>{formData.status}</Text>
                    <Ionicons name="chevron-down" size={20} color="#64748B" />
                  </TouchableOpacity>

                  {showStatusPicker && (
                    <View style={styles.statusPickerDropdown}>
                      {statusOptions.map((status) => (
                        <TouchableOpacity
                          key={status}
                          style={styles.statusPickerOption}
                          onPress={() => handleStatusChange(status)}
                        >
                          <View style={[styles.statusIndicatorDot, getStatusStyle(status)]} />
                          <Text style={styles.statusPickerOptionText}>{status}</Text>
                          {formData.status === status && (
                            <Ionicons name="checkmark" size={20} color="#4F46E5" style={styles.checkmark} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Conditional Date Fields */}
              {formData.status === 'Rough-In' && (
                <View style={styles.dateFieldsContainer}>
                  <View style={styles.addModalField}>
                    <Text style={styles.addModalFieldLabel}>Date to start <Text style={styles.optionalText}>(Optional)</Text></Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => openCalendar('roughInStart')}
                    >
                      <Ionicons name="calendar-outline" size={20} color="#64748B" />
                      <Text style={styles.dateInputText}>
                        {formatDisplayDate(formData.roughInStart)}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.addModalField}>
                    <Text style={styles.addModalFieldLabel}>Date to End <Text style={styles.optionalText}>(Optional)</Text></Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => openCalendar('roughInEnd')}
                    >
                      <Ionicons name="calendar-outline" size={20} color="#64748B" />
                      <Text style={styles.dateInputText}>
                        {formatDisplayDate(formData.roughInEnd)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {formData.status === 'Inspection' && (
                <View style={styles.dateFieldsContainer}>
                  <View style={styles.addModalField}>
                    <Text style={styles.addModalFieldLabel}>Date of inspection</Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => openCalendar('inspectionDate')}
                    >
                      <Ionicons name="calendar-outline" size={20} color="#64748B" />
                      <Text style={styles.dateInputText}>
                        {formatDisplayDate(formData.inspectionDate)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {formData.status === 'Final Trim' && (
                <View style={styles.dateFieldsContainer}>
                  <View style={styles.addModalField}>
                    <Text style={styles.addModalFieldLabel}>Date to start <Text style={styles.optionalText}>(Optional)</Text></Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => openCalendar('finalTrimStart')}
                    >
                      <Ionicons name="calendar-outline" size={20} color="#64748B" />
                      <Text style={styles.dateInputText}>
                        {formatDisplayDate(formData.finalTrimStart)}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.addModalField}>
                    <Text style={styles.addModalFieldLabel}>Date to End <Text style={styles.optionalText}>(Optional)</Text></Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => openCalendar('finalTrimEnd')}
                    >
                      <Ionicons name="calendar-outline" size={20} color="#64748B" />
                      <Text style={styles.dateInputText}>
                        {formatDisplayDate(formData.finalTrimEnd)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {(formData.status === 'Completed' || formData.status === 'Service Call') && (
                <View style={styles.dateFieldsContainer}>
                  <View style={styles.addModalField}>
                    <Text style={styles.addModalFieldLabel}>Completed date</Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => openCalendar('completedDate')}
                    >
                      <Ionicons name="calendar-outline" size={20} color="#64748B" />
                      <Text style={styles.dateInputText}>
                        {formatDisplayDate(formData.completedDate)}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.addModalField}>
                    <Text style={styles.addModalFieldLabel}>Warranty Date</Text>
                  </View>

                  <View style={styles.addModalField}>
                    <Text style={styles.addModalFieldLabel}>Date to start <Text style={styles.optionalText}>(Optional)</Text></Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => openCalendar('warrantyStart')}
                    >
                      <Ionicons name="calendar-outline" size={20} color="#64748B" />
                      <Text style={styles.dateInputText}>
                        {formatDisplayDate(formData.warrantyStart)}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.addModalField}>
                    <Text style={styles.addModalFieldLabel}>Date to End <Text style={styles.optionalText}>(Optional)</Text></Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => openCalendar('warrantyEnd')}
                    >
                      <Ionicons name="calendar-outline" size={20} color="#64748B" />
                      <Text style={styles.dateInputText}>
                        {formatDisplayDate(formData.warrantyEnd)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Modal Footer Buttons - Inside ScrollView */}
              <View style={styles.addModalFooterInScroll}>
              <TouchableOpacity
                style={[
                  styles.addModalButton,
                  styles.saveAndViewButton,
                  !formData.name.trim() && styles.addModalButtonDisabled
                ]}
                onPress={() => handleAddProject('saveAndView')}
                disabled={!formData.name.trim()}
              >
                <LinearGradient
                  colors={['#4F46E5', '#3B82F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Text style={styles.addModalButtonText}>Save & Take me to Card</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.addModalButton,
                  styles.saveButton,
                  !formData.name.trim() && styles.addModalButtonDisabled
                ]}
                onPress={() => handleAddProject('save')}
                disabled={!formData.name.trim()}
              >
                <Text style={styles.addModalButtonText}>Save</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.addModalButton, styles.cancelAddButton]}
                onPress={handleCloseModal}
              >
                <Text style={styles.cancelAddButtonText}>Cancel</Text>
              </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.calendarModalOverlay}>
          <TouchableOpacity 
            style={styles.calendarBackdrop}
            activeOpacity={1}
            onPress={() => setShowCalendar(false)}
          />
          
          <View style={styles.calendarModalContainer}>
            {/* Calendar Header */}
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarHeaderTitle}>Select Date</Text>
              <TouchableOpacity
                style={styles.calendarCloseButton}
                onPress={() => setShowCalendar(false)}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Calendar Component */}
            <Calendar
              current={tempSelectedDate || getSelectedDate()}
              onDayPress={(day) => {
                // Select the date and close calendar
                handleDateSelect(day);
              }}
              markedDates={{
                [tempSelectedDate || getSelectedDate()]: { 
                  selected: true, 
                  selectedColor: '#4F46E5',
                  selectedTextColor: '#FFFFFF'
                }
              }}
              theme={{
                backgroundColor: '#FFFFFF',
                calendarBackground: '#FFFFFF',
                textSectionTitleColor: '#64748B',
                selectedDayBackgroundColor: '#4F46E5',
                selectedDayTextColor: '#FFFFFF',
                todayTextColor: '#4F46E5',
                dayTextColor: '#1F2937',
                textDisabledColor: '#CBD5E1',
                monthTextColor: '#1F2937',
                textMonthFontSize: 18,
                textMonthFontWeight: '600',
                textDayFontSize: 16,
                textDayHeaderFontSize: 14,
                arrowColor: '#4F46E5',
              }}
              style={styles.calendar}
            />

            {/* Quick Date Options - ONLY for Warranty dates in Completed/Service Call */}
            {((showEditStatusModal && (editStatusData.newStatus === 'Completed' || editStatusData.newStatus === 'Service Call')) ||
              (!showEditStatusModal && (formData.status === 'Completed' || formData.status === 'Service Call'))) && 
             (activeCalendarField === 'warrantyStart' || activeCalendarField === 'warrantyEnd') && (
              <View style={styles.quickDateOptions}>
                <TouchableOpacity
                  style={styles.quickDateButton}
                  onPress={() => handleQuickDateSelect(3)}
                >
                  <Text style={styles.quickDateButtonText}>3 Months</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickDateButton}
                  onPress={() => handleQuickDateSelect(6)}
                >
                  <Text style={styles.quickDateButtonText}>6 Months</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickDateButton}
                  onPress={() => handleQuickDateSelect(12)}
                >
                  <Text style={styles.quickDateButtonText}>1 Year</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Calendar Footer */}
            <View style={styles.calendarFooter}>
              <TouchableOpacity
                style={styles.calendarCancelButton}
                onPress={() => setShowCalendar(false)}
              >
                <Text style={styles.calendarCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.calendarTodayButton}
                onPress={() => handleDateSelect({ dateString: formatDate(new Date()) })}
              >
                <Text style={styles.calendarTodayButtonText}>Today</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      {/* Edit Company Modal */}
      <Modal
        visible={showEditCompanyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelEditCompany}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.editCompanyModalOverlay}
        >
          <TouchableOpacity 
            style={styles.editCompanyBackdrop}
            activeOpacity={1}
            onPress={handleCancelEditCompany}
          />
          <View style={styles.editCompanyModalContainer}>
            {/* Modern Header with Gradient */}
            <LinearGradient
              colors={['#4F46E5', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.editCompanyHeader}
            >
              <View style={styles.editCompanyHeaderContent}>
                <View style={styles.editCompanyIconContainer}>
                  <Ionicons name="business" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.editCompanyHeaderText}>
                  <Text style={styles.editCompanyTitle}>Edit Company</Text>
                  <Text style={styles.editCompanySubtitle}>Update company information</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.editCompanyCloseButton}
                onPress={handleCancelEditCompany}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.editCompanyContent} showsVerticalScrollIndicator={false}>
              {/* Trade Industry */}
              <View style={styles.editCompanyField}>
                <View style={styles.editCompanyFieldHeader}>
                  <Ionicons name="briefcase-outline" size={20} color="#4F46E5" />
                  <Text style={styles.editCompanyFieldLabel}>Trade Industry</Text>
                </View>
                <View style={styles.editCompanyInputContainer}>
                  <TextInput
                    style={styles.editCompanyInput}
                    value={editedCompanyData.tradeIndustry || ''}
                    onChangeText={(text) => setEditedCompanyData({...editedCompanyData, tradeIndustry: text})}
                    placeholder="e.g., General Contracting"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              {/* Company Name */}
              <View style={styles.editCompanyField}>
                <View style={styles.editCompanyFieldHeader}>
                  <Ionicons name="business-outline" size={20} color="#4F46E5" />
                  <Text style={styles.editCompanyFieldLabel}>Company Name</Text>
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredBadgeText}>Required</Text>
                  </View>
                </View>
                <View style={styles.editCompanyInputContainer}>
                  <TextInput
                    style={styles.editCompanyInput}
                    value={editedCompanyData.name || ''}
                    onChangeText={(text) => setEditedCompanyData({...editedCompanyData, name: text})}
                    placeholder="Enter company name"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              {/* Phone Number */}
              <View style={styles.editCompanyField}>
                <View style={styles.editCompanyFieldHeader}>
                  <Ionicons name="call-outline" size={20} color="#4F46E5" />
                  <Text style={styles.editCompanyFieldLabel}>Phone Number</Text>
                </View>
                <View style={styles.editCompanyInputContainer}>
                  <TextInput
                    style={styles.editCompanyInput}
                    value={editedCompanyData.phone || ''}
                    onChangeText={(text) => setEditedCompanyData({...editedCompanyData, phone: text})}
                    placeholder="(303) 555-0000"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.editCompanyField}>
                <View style={styles.editCompanyFieldHeader}>
                  <Ionicons name="mail-outline" size={20} color="#4F46E5" />
                  <Text style={styles.editCompanyFieldLabel}>Email Address</Text>
                </View>
                <View style={styles.editCompanyInputContainer}>
                  <TextInput
                    style={styles.editCompanyInput}
                    value={editedCompanyData.email || ''}
                    onChangeText={(text) => setEditedCompanyData({...editedCompanyData, email: text})}
                    placeholder="company@example.com"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Website */}
              <View style={styles.editCompanyField}>
                <View style={styles.editCompanyFieldHeader}>
                  <Ionicons name="globe-outline" size={20} color="#4F46E5" />
                  <Text style={styles.editCompanyFieldLabel}>Website</Text>
                </View>
                <View style={styles.editCompanyInputContainer}>
                  <TextInput
                    style={styles.editCompanyInput}
                    value={editedCompanyData.website || ''}
                    onChangeText={(text) => setEditedCompanyData({...editedCompanyData, website: text})}
                    placeholder="www.company.com"
                    placeholderTextColor="#94A3B8"
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Delete Button */}
              <TouchableOpacity 
                style={styles.deleteCompanyButton}
                onPress={handleDeleteCompanyClick}
              >
                <Ionicons name="trash-outline" size={20} color="#DC2626" />
                <Text style={styles.deleteCompanyButtonText}>Delete Company</Text>
              </TouchableOpacity>

              {/* Action Buttons */}
              <View style={styles.editCompanyActions}>
                <TouchableOpacity 
                  style={styles.editCompanyCancelButton}
                  onPress={handleCancelEditCompany}
                >
                  <Text style={styles.editCompanyCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.editCompanySaveButtonWrapper}
                  onPress={handleSaveCompany}
                >
                  <LinearGradient
                    colors={['#4F46E5', '#3B82F6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.editCompanySaveButton}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.editCompanySaveButtonText}>Save Changes</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Company Warning Modal */}
      <Modal
        visible={showDeleteCompanyWarning}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelDeleteCompany}
      >
        <View style={styles.deleteWarningOverlay}>
          <TouchableOpacity 
            style={styles.deleteWarningBackdrop}
            activeOpacity={1}
            onPress={handleCancelDeleteCompany}
          />
          <View style={styles.deleteWarningContainer}>
            {/* Warning Icon */}
            <View style={styles.deleteWarningIconContainer}>
              <View style={styles.deleteWarningIconCircle}>
                <Ionicons name="warning" size={48} color="#DC2626" />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.deleteWarningTitle}>Delete Company?</Text>
            
            {/* Description */}
            <Text style={styles.deleteWarningDescription}>
              You are about to permanently delete{' '}
              <Text style={styles.deleteWarningCompanyName}>
                {editingCompany?.name}
              </Text>
              .
            </Text>

            {/* Warning Box */}
            <View style={styles.deleteWarningBox}>
              <View style={styles.deleteWarningBoxHeader}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Text style={styles.deleteWarningBoxTitle}>Warning: This action cannot be undone!</Text>
              </View>
              
              <View style={styles.deleteWarningList}>
                <View style={styles.deleteWarningListItem}>
                  <View style={styles.deleteWarningBullet} />
                  <Text style={styles.deleteWarningListText}>This company will be permanently deleted</Text>
                </View>
                <View style={styles.deleteWarningListItem}>
                  <View style={styles.deleteWarningBullet} />
                  <Text style={styles.deleteWarningListText}>There is no backup or recovery option</Text>
                </View>
                <View style={styles.deleteWarningListItem}>
                  <View style={styles.deleteWarningBullet} />
                  <Text style={styles.deleteWarningListText}>All associated data will be lost forever</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.deleteWarningActions}>
              <TouchableOpacity 
                style={styles.deleteWarningCancelButton}
                onPress={handleCancelDeleteCompany}
              >
                <Text style={styles.deleteWarningCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.deleteWarningConfirmButton}
                onPress={handleConfirmDeleteCompany}
              >
                <LinearGradient
                  colors={['#DC2626', '#B91C1C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.deleteWarningConfirmGradient}
                >
                  <Ionicons name="trash" size={20} color="#FFFFFF" />
                  <Text style={styles.deleteWarningConfirmButtonText}>Delete Permanently</Text>
                </LinearGradient>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 36,
  },
  spacer: {
    width: 36,
    height: 36,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  projectCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  filterContainer: {
    position: 'relative',
    zIndex: 200,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDropdownMenu: {
    position: 'absolute',
    top: 48,
    right: 0,
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
    zIndex: 10000,
    paddingVertical: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  filterOptionActive: {
    backgroundColor: '#F8FAFC',
  },
  filterOptionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  filterOptionTextActive: {
    color: '#4F46E5',
  },
  filterStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  storageBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  storageText: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
  },
  manageButton: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  quickActionCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickActionCardActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
    borderWidth: 2,
  },
  quickActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionIconContainerActive: {
    backgroundColor: '#4F46E5',
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
  },
  quickActionLabelActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  seeAllButton: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '500',
  },
  letterGroupContainer: {
    overflow: 'visible',
  },
  letterHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  projectCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'visible',
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    overflow: 'visible',
  },
  avatarContainer: {
    marginRight: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  companyBadge: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    minWidth: 32,
    alignItems: 'center',
  },
  companyBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  projectInfo: {
    flex: 1,
    marginRight: 8,
  },
  projectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  projectAddress: {
    fontSize: 12,
    color: '#64748B',
  },
  statusDropdownContainer: {
    position: 'relative',
    zIndex: 999999,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  statusChevron: {
    marginLeft: -2,
  },
  statusDropdownOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  statusDropdownMenuModal: {
    position: 'absolute',
    width: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 50,
    paddingVertical: 4,
  },
  statusDropdownMenu: {
    position: 'absolute',
    top: 34,
    right: 0,
    width: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 9999,
    zIndex: 999999,
    paddingVertical: 4,
  },
  statusDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  statusDropdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  statusDropdownText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#1E293B',
  },
  projectDatesContainer: {
    marginTop: 4,
    alignItems: 'flex-end',
  },
  projectDateText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 14,
  },
  otherContactsContainer: {
    marginTop: 8,
    marginBottom: 12,
    position: 'relative',
    zIndex: 100,
  },
  otherContactsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  otherContactsButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  contactDropdownMenu: {
    position: 'absolute',
    top: 24,
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
    elevation: 20,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    zIndex: 0,
  },
  detailsButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
  },
  shareButtonWrapper: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  shareButton: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  buttonIcon: {
    marginRight: 6,
  },
  alphabetIndex: {
    position: 'absolute',
    right: 12,
    top: 120,
    bottom: 80,
    justifyContent: 'center',
    zIndex: 30,
  },
  indexLetter: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  indexLetterActive: {
    backgroundColor: '#4F46E5',
  },
  indexLetterDisabled: {
    opacity: 0.3,
  },
  indexLetterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4F46E5',
  },
  indexLetterTextActive: {
    color: '#FFFFFF',
  },
  indexLetterTextDisabled: {
    color: '#CBD5E1',
  },
  magnifierBubble: {
    position: 'absolute',
    right: 48,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 40,
    marginTop: -20,
  },
  magnifierText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bottomSpacing: {
    height: 100,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: '92%',
    maxWidth: 350,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalHeaderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modalHeaderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: 16,
  },
  modalField: {
    marginBottom: 16,
  },
  modalFieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 8,
  },
  modalFieldValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  modalInput: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    fontSize: 14,
    color: '#0F172A',
  },
  modalTextArea: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    fontSize: 14,
    color: '#0F172A',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  callButton: {
    backgroundColor: '#DCFCE7',
  },
  textButton: {
    backgroundColor: '#DBEAFE',
  },
  emailButton: {
    backgroundColor: '#EEF2FF',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1E293B',
  },
  noteDisplay: {
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#475569',
  },
  noNoteText: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  noteButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  saveNoteButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    alignItems: 'center',
  },
  saveNoteButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  cancelNoteButton: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelNoteButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  footerButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  footerButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelButton: {
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  noteFooterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  noteFooterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  editButton: {
    flex: 1,
  },
  editButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  // Delete Contact Warning Modal Styles
  deleteContactWarningOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteContactBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  deleteContactWarningContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  deleteContactIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteContactIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteContactWarningTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  deleteContactWarningDescription: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  deleteContactName: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  deleteContactWarningBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    padding: 16,
    marginBottom: 24,
  },
  deleteContactWarningBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  deleteContactWarningBoxTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC2626',
    flex: 1,
  },
  deleteContactWarningList: {
    gap: 10,
  },
  deleteContactWarningListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  deleteContactWarningBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
    marginTop: 7,
  },
  deleteContactWarningListText: {
    fontSize: 14,
    color: '#991B1B',
    flex: 1,
    lineHeight: 20,
  },
  deleteContactWarningActions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteContactCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteContactCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  deleteContactConfirmButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  deleteContactConfirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  deleteContactConfirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // Add Project Modal Styles
  addModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  addModalContainer: {
    width: '92%',
    maxWidth: 380,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  addModalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  addModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  addModalCloseButton: {
    padding: 4,
    marginTop: -4,
    marginRight: -4,
  },
  addModalDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  addModalScrollContent: {
    maxHeight: 500,
  },
  addModalScrollContentContainer: {
    padding: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  addModalFieldSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  addModalFooterInScroll: {
    paddingTop: 16,
    paddingBottom: 20,
    gap: 8,
  },
  addModalField: {
    marginBottom: 16,
  },
  addModalFieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 8,
  },
  addressRowContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  cityField: {
    flex: 0.60,
    marginBottom: 0,
  },
  stateField: {
    flex: 0.15,
    marginBottom: 0,
  },
  zipField: {
    flex: 0.25,
    marginBottom: 0,
  },
  requiredStar: {
    color: '#EF4444',
  },
  addModalInput: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    fontSize: 14,
    color: '#1E293B',
  },
  addModalInputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    overflow: 'hidden',
  },
  statusPickerContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  pickerButtonText: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  statusIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  statusPickerDropdown: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
    zIndex: 10000,
    paddingVertical: 4,
  },
  statusPickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  statusPickerOptionText: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  checkmark: {
    marginLeft: 'auto',
  },
  addModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  addModalButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    overflow: 'hidden',
  },
  addModalButtonDisabled: {
    opacity: 0.5,
  },
  saveAndViewButton: {
    overflow: 'hidden',
  },
  gradientButton: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
  },
  addModalButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  cancelAddButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cancelAddButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  // Date Fields Styles
  dateFieldsContainer: {
    marginTop: 12,
  },
  optionalText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '400',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  dateInputText: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  employeeDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  employeeDropdownText: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  employeeDropdownMenu: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  employeeDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  employeeDropdownItemSelected: {
    backgroundColor: '#EEF2FF',
  },
  employeeDropdownItemText: {
    fontSize: 14,
    color: '#64748B',
  },
  employeeDropdownItemTextSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  // Company Dropdown Styles (for Add Project modal)
  companyDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  companyDropdownButtonText: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
  companyDropdownPlaceholder: {
    color: '#94A3B8',
    fontWeight: '400',
  },
  companyDropdownMenu: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    maxHeight: 250,
  },
  companyDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  companyDropdownInitialsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  companyDropdownItemText: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
  companyDropdownItemTextSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  alertPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  alertPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  alertPillSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  alertPillText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  alertPillTextSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  notesTextArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
    minHeight: 100,
    maxHeight: 150,
  },
  // Calendar Modal Styles
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  calendarModalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  calendarHeaderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  calendarCloseButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendar: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  quickDateOptions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  quickDateButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickDateButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },
  calendarFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  calendarCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    alignItems: 'center',
  },
  calendarCancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  calendarTodayButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    alignItems: 'center',
  },
  calendarTodayButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  // Company View Styles
  companyCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  companyHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  companyHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  companyInfoButton: {
    padding: 16,
    paddingLeft: 8,
  },
  companyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  projectCount: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  projectsList: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  projectCardInCompany: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  companyInfoDropdown: {
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 16,
    gap: 16,
  },
  companyInfoEditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  companyInfoEditTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  companyInfoEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
  },
  companyInfoEditButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },
  companyInfoIcon: {
    marginTop: 2,
  },
  companyInfoTextContainer: {
    flex: 1,
  },
  // Edit Company Modal Styles
  editCompanyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  editCompanyBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  editCompanyModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  editCompanyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  editCompanyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  editCompanyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCompanyHeaderText: {
    flex: 1,
  },
  editCompanyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  editCompanySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  editCompanyCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCompanyContent: {
    padding: 20,
  },
  editCompanyField: {
    marginBottom: 24,
  },
  editCompanyFieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  editCompanyFieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  requiredBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  requiredBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  editCompanyInputContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  editCompanyInput: {
    fontSize: 16,
    color: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  editCompanyActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  editCompanyCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCompanyCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  editCompanySaveButtonWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  editCompanySaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  editCompanySaveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  deleteCompanyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    marginBottom: 16,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  deleteCompanyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  // Delete Warning Modal Styles
  deleteWarningOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteWarningBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  deleteWarningContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  deleteWarningIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteWarningIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteWarningTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  deleteWarningDescription: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  deleteWarningCompanyName: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  deleteWarningBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    padding: 16,
    marginBottom: 24,
  },
  deleteWarningBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  deleteWarningBoxTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC2626',
    flex: 1,
  },
  deleteWarningList: {
    gap: 10,
  },
  deleteWarningListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  deleteWarningBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
    marginTop: 7,
  },
  deleteWarningListText: {
    fontSize: 14,
    color: '#991B1B',
    flex: 1,
    lineHeight: 20,
  },
  deleteWarningActions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteWarningCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteWarningCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  deleteWarningConfirmButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  deleteWarningConfirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  deleteWarningConfirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
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
}) as any;
