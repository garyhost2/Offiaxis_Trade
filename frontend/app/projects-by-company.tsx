import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type ProjectStatus = 'To be scheduled' | 'Rough-In' | 'Inspection' | 'Final Trim' | 'Completed';

type CompanyProject = {
  id: number;
  name: string;
  street: string;
  city: string;
  phone: string;
  permit: string;
  status: ProjectStatus;
  initials: string;
};

type Company = {
  id: number;
  name: string;
  initials: string;
  projects: CompanyProject[];
};

// Sample data with companies assigned
const COMPANIES_DATA: Company[] = [
  {
    id: 1,
    name: 'Boulder Contractor',
    initials: 'BC',
    projects: [
      { id: 1, name: 'Andrew Martinez', street: '1234 Cherry Creek Dr', city: 'Denver, CO 80223', phone: '(720) 555-0101', permit: 'PRM-2024-001', status: 'Rough-In', initials: 'AM' },
      { id: 2, name: 'Barbara Thompson', street: '5678 Capitol Hill Ave', city: 'Denver, CO 80203', phone: '(303) 555-0102', permit: 'PRM-2024-002', status: 'To be scheduled', initials: 'BT' },
      { id: 3, name: 'Carlos Rodriguez', street: '910 Highlands Blvd', city: 'Denver, CO 80211', phone: '(720) 555-0103', permit: 'PRM-2024-003', status: 'Inspection', initials: 'CR' },
      { id: 4, name: 'Diana Foster', street: '1122 Washington Park Way', city: 'Denver, CO 80209', phone: '(303) 555-0104', permit: 'PRM-2024-004', status: 'Completed', initials: 'DF' },
      { id: 5, name: 'Edward Chen', street: '3344 LoDo St', city: 'Denver, CO 80202', phone: '(720) 555-0105', permit: 'PRM-2024-005', status: 'Final Trim', initials: 'EC' },
      { id: 6, name: 'Fiona O\'Neill', street: '5566 RiNo Ave', city: 'Denver, CO 80216', phone: '(303) 555-0106', permit: 'PRM-2024-006', status: 'Rough-In', initials: 'FO' },
      { id: 7, name: 'Gabriel Santos', street: '7788 Park Hill Rd', city: 'Denver, CO 80207', phone: '(720) 555-0107', permit: 'PRM-2024-007', status: 'To be scheduled', initials: 'GS' },
      { id: 8, name: 'Hannah Kim', street: '9900 Congress Park Ln', city: 'Denver, CO 80206', phone: '(303) 555-0108', permit: 'PRM-2024-008', status: 'Inspection', initials: 'HK' },
    ]
  },
  {
    id: 2,
    name: 'Denver Contractor',
    initials: 'DC',
    projects: [
      { id: 9, name: 'Isaac Johnson', street: '2211 Stapleton Dr', city: 'Aurora, CO 80010', phone: '(720) 555-0109', permit: 'PRM-2024-009', status: 'Completed', initials: 'IJ' },
      { id: 10, name: 'Jessica Williams', street: '4433 Pearl St', city: 'Boulder, CO 80302', phone: '(303) 555-0110', permit: 'PRM-2024-010', status: 'Final Trim', initials: 'JW' },
      { id: 11, name: 'Kevin Anderson', street: '6655 Main St', city: 'Littleton, CO 80120', phone: '(720) 555-0111', permit: 'PRM-2024-011', status: 'Rough-In', initials: 'KA' },
      { id: 12, name: 'Laura Davis', street: '8877 Wadsworth Blvd', city: 'Lakewood, CO 80215', phone: '(303) 555-0112', permit: 'PRM-2024-012', status: 'To be scheduled', initials: 'LD' },
      { id: 13, name: 'Michael Brown', street: '1010 Quebec St', city: 'Centennial, CO 80112', phone: '(720) 555-0113', permit: 'PRM-2024-013', status: 'Inspection', initials: 'MB' },
      { id: 14, name: 'Natalie Garcia', street: '3232 South Broadway', city: 'Englewood, CO 80113', phone: '(303) 555-0114', permit: 'PRM-2024-014', status: 'Completed', initials: 'NG' },
    ]
  },
  {
    id: 3,
    name: 'Golden Contractor',
    initials: 'GC',
    projects: [
      { id: 15, name: 'Oliver Martinez', street: '5454 Pecos St', city: 'Westminster, CO 80030', phone: '(720) 555-0115', permit: 'PRM-2024-015', status: 'Completed', initials: 'OM' },
      { id: 16, name: 'Patricia Wilson', street: '7676 Federal Blvd', city: 'Arvada, CO 80003', phone: '(303) 555-0116', permit: 'PRM-2024-016', status: 'Rough-In', initials: 'PW' },
      { id: 17, name: 'Quincy Roberts', street: '9898 Sheridan Blvd', city: 'Thornton, CO 80229', phone: '(720) 555-0117', permit: 'PRM-2024-017', status: 'To be scheduled', initials: 'QR' },
      { id: 18, name: 'Rachel Taylor', street: '1357 Colfax Ave', city: 'Aurora, CO 80010', phone: '(303) 555-0118', permit: 'PRM-2024-018', status: 'Final Trim', initials: 'RT' },
      { id: 19, name: 'Samuel Moore', street: '2468 Havana St', city: 'Aurora, CO 80014', phone: '(720) 555-0119', permit: 'PRM-2024-019', status: 'Inspection', initials: 'SM' },
      { id: 20, name: 'Theresa Jackson', street: '3691 Alameda Ave', city: 'Lakewood, CO 80226', phone: '(303) 555-0120', permit: 'PRM-2024-020', status: 'Completed', initials: 'TJ' },
      { id: 21, name: 'Ursula Harris', street: '4820 Parker Rd', city: 'Parker, CO 80134', phone: '(720) 555-0121', permit: 'PRM-2024-021', status: 'Completed', initials: 'UH' },
      { id: 22, name: 'Victor Nguyen', street: '5931 Belleview Ave', city: 'Greenwood Village, CO 80111', phone: '(303) 555-0122', permit: 'PRM-2024-022', status: 'To be scheduled', initials: 'VN' },
      { id: 23, name: 'Wendy Clark', street: '6042 Kipling St', city: 'Wheat Ridge, CO 80033', phone: '(720) 555-0123', permit: 'PRM-2024-023', status: 'Rough-In', initials: 'WC' },
      { id: 24, name: 'Xavier Lopez', street: '7153 Santa Fe Dr', city: 'Littleton, CO 80120', phone: '(303) 555-0124', permit: 'PRM-2024-024', status: 'Inspection', initials: 'XL' },
      { id: 25, name: 'Yolanda Martinez', street: '8264 University Blvd', city: 'Highlands Ranch, CO 80126', phone: '(720) 555-0125', permit: 'PRM-2024-025', status: 'Completed', initials: 'YM' },
      { id: 26, name: 'Zachary White', street: '9375 Colorado Blvd', city: 'Thornton, CO 80229', phone: '(303) 555-0126', permit: 'PRM-2024-026', status: 'Final Trim', initials: 'ZW' },
    ]
  }
];

export default function ProjectsByCompanyScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showIndex, setShowIndex] = useState(false);
  const [activeIndex, setActiveIndex] = useState<string | null>(null);
  const [magnifierPos, setMagnifierPos] = useState(0);
  const [expandedCompanies, setExpandedCompanies] = useState<Record<number, boolean>>({});
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');

  const scrollRef = useRef<ScrollView | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionRefs = useRef<Record<string, number>>({});
  const letterRefs = useRef<Record<string, number>>({});

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const statusOptions = ['To be scheduled', 'Rough-In', 'Inspection', 'Final Trim', 'Completed'];

  // Filter companies and projects based on search and status filter
  const getFilteredCompanies = () => {
    return COMPANIES_DATA.map(company => {
      const filteredProjects = company.projects.filter(project => {
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

  // Count total projects
  const totalProjects = filteredCompanies.reduce((sum, company) => sum + company.projects.length, 0);

  // Group companies by first letter
  const groupedCompanies = filteredCompanies.reduce<Record<string, Company[]>>((acc, company) => {
    const firstLetter = company.name.charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(company);
    return acc;
  }, {});

  const availableLetters = Object.keys(groupedCompanies).sort();

  const toggleCompany = (companyId: number) => {
    setExpandedCompanies(prev => ({
      ...prev,
      [companyId]: !prev[companyId]
    }));
  };

  const handleScroll = () => {
    setShowIndex(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setShowIndex(false);
      setActiveIndex(null);
    }, 1200);
  };

  const scrollToLetter = (letter: string) => {
    const yOffset = sectionRefs.current[letter];
    if (yOffset !== undefined && scrollRef.current) {
      scrollRef.current.scrollTo({ y: yOffset, animated: true });
    }
  };

  const handleIndexTouch = (letter: string) => {
    if (!availableLetters.includes(letter)) return;
    
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
      default:
        return { backgroundColor: '#F3F4F6', borderColor: '#D1D5DB', color: '#4B5563' };
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <LinearGradient
        colors={['#4F46E5', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Projects</Text>
            <View style={styles.projectCountBadge}>
              <Text style={styles.projectCountText}>{totalProjects}</Text>
            </View>
          </View>
          <View style={styles.spacer} />
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
              placeholder="Search companies or projects..."
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
            style={styles.quickActionCard}
            onPress={() => router.back()}
          >
            <View style={styles.quickActionIconContainer}>
              <Ionicons name="folder-open-outline" size={24} color="#4F46E5" />
            </View>
            <Text style={styles.quickActionLabel}>All Projects</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.quickActionCard, styles.quickActionCardActive]}>
            <View style={[styles.quickActionIconContainer, styles.quickActionIconContainerActive]}>
              <Ionicons name="business-outline" size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.quickActionLabel, styles.quickActionLabelActive]}>By Company</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard}>
            <View style={styles.quickActionIconContainer}>
              <Ionicons name="stats-chart-outline" size={24} color="#4F46E5" />
            </View>
            <Text style={styles.quickActionLabel}>Profit & Loss</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard}>
            <View style={styles.quickActionIconContainer}>
              <Ionicons name="images-outline" size={24} color="#4F46E5" />
            </View>
            <Text style={styles.quickActionLabel}>Album</Text>
          </TouchableOpacity>
        </View>

        {/* Companies Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Companies</Text>
          <Text style={styles.companiesCount}>{filteredCompanies.length} companies</Text>
        </View>

        {/* Companies List - Grouped by Letter */}
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
            {groupedCompanies[letter].map((company) => (
              <View key={company.id} style={styles.companyCard}>
                {/* Company Header */}
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

                {/* Expanded Projects List */}
                {expandedCompanies[company.id] && (
                  <View style={styles.projectsList}>
                    {company.projects.map((project) => (
                      <View key={project.id} style={styles.projectCard}>
                        <View style={styles.projectHeader}>
                          <View style={styles.projectAvatar}>
                            <Text style={styles.projectAvatarText}>{project.initials}</Text>
                          </View>
                          <View style={styles.projectInfo}>
                            <Text style={styles.projectName}>{project.name}</Text>
                            <Text style={styles.projectAddress}>{project.street}</Text>
                            <Text style={styles.projectAddress}>{project.city}</Text>
                          </View>
                          <View style={[styles.statusBadge, getStatusStyle(project.status)]}>
                            <Text style={[styles.statusText, { color: getStatusStyle(project.status).color }]}>
                              {project.status}
                            </Text>
                          </View>
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
              disabled={!availableLetters.includes(letter)}
              style={[
                styles.indexLetter,
                activeIndex === letter && styles.indexLetterActive,
                !availableLetters.includes(letter) && styles.indexLetterDisabled,
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 44,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    width: 40,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  projectCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  projectCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: '#1F2937',
  },
  filterContainer: {
    position: 'relative',
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterDropdownMenu: {
    position: 'absolute',
    top: 48,
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
    width: 200,
    zIndex: 1000,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterOptionActive: {
    backgroundColor: '#F0F9FF',
  },
  filterStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterOptionText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  filterOptionTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  storageBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  storageText: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
  },
  manageButton: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickActionCardActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  quickActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIconContainerActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  quickActionLabel: {
    fontSize: 11,
    color: '#1F2937',
    textAlign: 'center',
    fontWeight: '500',
  },
  quickActionLabelActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  companiesCount: {
    fontSize: 14,
    color: '#64748B',
  },
  letterGroupContainer: {
    marginBottom: 16,
  },
  letterHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
  },
  companyCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
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
  projectCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  projectHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  projectAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectAvatarText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: 'bold',
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  projectAddress: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  detailsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailsButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  shareButtonWrapper: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  shareButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonIcon: {
    marginRight: 4,
  },
  bottomSpacing: {
    height: 100,
  },
  alphabetIndex: {
    position: 'absolute',
    right: 4,
    top: '20%',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  indexLetter: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  indexLetterActive: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
  },
  indexLetterDisabled: {
    opacity: 0.3,
  },
  indexLetterText: {
    fontSize: 12,
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
    right: 60,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  magnifierText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
