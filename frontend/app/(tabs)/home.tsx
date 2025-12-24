import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Modal, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useRouter } from 'expo-router';
import { getAllPortfolios, Portfolio, getAllProjects } from '../../utils/projectsData';
import { useActivity, formatTimeAgo, getActivityColor, Activity } from '../../contexts/ActivityContext';
import * as ImagePicker from 'expo-image-picker';

// Employee data with different hourly rates
const employees = [
  { id: '1', name: 'Yefry Soto', initials: 'YS', role: 'Admin', hourlyRate: 25, hours: 38 },
  { id: '2', name: 'Azis K', initials: 'AK', role: 'Admin', hourlyRate: 22, hours: 42 },
  { id: '3', name: 'Oumayama M', initials: 'OM', role: 'Employee', hourlyRate: 18, hours: 35 },
  { id: '4', name: 'Sarash Williams', initials: 'SW', role: 'Employee', hourlyRate: 20, hours: 40 },
  { id: '5', name: 'Emely Devis', initials: 'ED', role: 'Employee', hourlyRate: 19, hours: 32 },
];

// Time period options for P&L
const timePeriodOptions = [
  { id: 'this_year', label: 'This Year' },
  { id: 'last_year', label: 'Last Year' },
  { id: 'this_month', label: 'This Month' },
  { id: 'jan', label: 'January' },
  { id: 'feb', label: 'February' },
  { id: 'mar', label: 'March' },
  { id: 'apr', label: 'April' },
  { id: 'may', label: 'May' },
  { id: 'jun', label: 'June' },
  { id: 'jul', label: 'July' },
  { id: 'aug', label: 'August' },
  { id: 'sep', label: 'September' },
  { id: 'oct', label: 'October' },
  { id: 'nov', label: 'November' },
  { id: 'dec', label: 'December' },
];

// Mock P&L data for different time periods
const plDataByPeriod: Record<string, { totalIncome: number; totalExpenses: number; profit: number }> = {
  'this_year': { totalIncome: 125000, totalExpenses: 87500, profit: 37500 },
  'last_year': { totalIncome: 98500, totalExpenses: 72000, profit: 26500 },
  'this_month': { totalIncome: 12500, totalExpenses: 8200, profit: 4300 },
  'jan': { totalIncome: 9800, totalExpenses: 6500, profit: 3300 },
  'feb': { totalIncome: 11200, totalExpenses: 7800, profit: 3400 },
  'mar': { totalIncome: 10500, totalExpenses: 7200, profit: 3300 },
  'apr': { totalIncome: 12800, totalExpenses: 8900, profit: 3900 },
  'may': { totalIncome: 11500, totalExpenses: 7600, profit: 3900 },
  'jun': { totalIncome: 13200, totalExpenses: 9100, profit: 4100 },
  'jul': { totalIncome: 10800, totalExpenses: 7400, profit: 3400 },
  'aug': { totalIncome: 12100, totalExpenses: 8300, profit: 3800 },
  'sep': { totalIncome: 11900, totalExpenses: 8100, profit: 3800 },
  'oct': { totalIncome: 10200, totalExpenses: 6900, profit: 3300 },
  'nov': { totalIncome: 9500, totalExpenses: 6400, profit: 3100 },
  'dec': { totalIncome: 11000, totalExpenses: 7500, profit: 3500 },
};

// Helper to format week range
const formatWeekRange = (start: Date) => {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const formatDate = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${formatDate(start)} — ${formatDate(end)}`;
};

// Get Monday of the week for any given date
const getWeekStart = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export default function HomeScreen() {
  const router = useRouter();
  const { activities, logActivity } = useActivity();
  
  // Selected employee state
  const [selectedEmployee, setSelectedEmployee] = useState(employees[0]);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  
  // Week selection state
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [showWeekCalendar, setShowWeekCalendar] = useState(false);
  
  // P&L time period state
  const [selectedTimePeriod, setSelectedTimePeriod] = useState(timePeriodOptions[0]);
  const [showTimePeriodDropdown, setShowTimePeriodDropdown] = useState(false);
  
  // P&L summary state - using mock data based on selected period
  const [plSummary, setPlSummary] = useState(plDataByPeriod['this_year']);

  // Handle time period selection
  const handleSelectTimePeriod = (period: typeof timePeriodOptions[0]) => {
    setSelectedTimePeriod(period);
    setPlSummary(plDataByPeriod[period.id] || plDataByPeriod['this_year']);
    setShowTimePeriodDropdown(false);
  };

  // Portfolio state
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [portfolioSearchQuery, setPortfolioSearchQuery] = useState('');
  const [showPortfolioSearchResults, setShowPortfolioSearchResults] = useState(false);

  // Receipt modal state
  const [showReceiptPhotoOptions, setShowReceiptPhotoOptions] = useState(false);
  const [showAddReceiptModal, setShowAddReceiptModal] = useState(false);
  const [receiptImageUri, setReceiptImageUri] = useState<string | null>(null);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [extractedReceiptData, setExtractedReceiptData] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  
  // Manual receipt form state
  const [manualMerchant, setManualMerchant] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toLocaleDateString());
  const [manualTime, setManualTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [manualDescription, setManualDescription] = useState('');
  const [manualTotal, setManualTotal] = useState('');
  const [manualCategory, setManualCategory] = useState('');

  // Receipt categories
  const receiptCategories = [
    { id: 'materials', label: 'Materials', icon: 'cube-outline' },
    { id: 'tools', label: 'Tools & Equipment', icon: 'construct-outline' },
    { id: 'labor', label: 'Labor', icon: 'people-outline' },
    { id: 'permits', label: 'Permits & Fees', icon: 'document-text-outline' },
    { id: 'transportation', label: 'Transportation', icon: 'car-outline' },
    { id: 'utilities', label: 'Utilities', icon: 'flash-outline' },
    { id: 'office', label: 'Office Supplies', icon: 'briefcase-outline' },
    { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
  ];

  // Reset manual form
  const resetManualForm = () => {
    setManualMerchant('');
    setManualDate(new Date().toLocaleDateString());
    setManualTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setManualDescription('');
    setManualTotal('');
    setManualCategory('');
    setIsManualEntry(false);
  };

  // Load portfolios and projects on mount
  useEffect(() => {
    const loadPortfolios = () => {
      const allPortfolios = getAllPortfolios();
      setPortfolios(allPortfolios);
    };
    const loadProjects = () => {
      const allProjects = getAllProjects();
      setProjects(allProjects);
    };
    loadPortfolios();
    loadProjects();
  }, []);

  // Filter portfolios based on search query
  const filteredPortfolios = portfolios.filter(portfolio => 
    portfolio.title.toLowerCase().includes(portfolioSearchQuery.toLowerCase()) ||
    (portfolio.description && portfolio.description.toLowerCase().includes(portfolioSearchQuery.toLowerCase()))
  );

  // Handle portfolio search input
  const handlePortfolioSearchChange = (text: string) => {
    setPortfolioSearchQuery(text);
    setShowPortfolioSearchResults(text.length > 0);
  };

  // Handle clicking on a portfolio (from search or preview)
  const handlePortfolioClick = (portfolioId: string) => {
    setPortfolioSearchQuery('');
    setShowPortfolioSearchResults(false);
    router.push(`/portfolio-photos?portfolioId=${portfolioId}`);
  };

  // Navigate to full portfolio gallery
  const handleViewAllPortfolios = () => {
    router.push('/gallery?tab=portfolio');
  };

  // Generate random hours when switching employees
  const handleSelectEmployee = (employee: typeof employees[0]) => {
    // Generate random hours between 28-45
    const randomHours = Math.floor(Math.random() * 18) + 28;
    setSelectedEmployee({ ...employee, hours: randomHours });
    setShowEmployeeDropdown(false);
  };

  // Calculate earnings
  const earnings = selectedEmployee.hours * selectedEmployee.hourlyRate;

  // Handle week selection from calendar
  const handleWeekSelect = (day: any) => {
    const selectedDate = new Date(day.dateString);
    const monday = getWeekStart(selectedDate);
    setSelectedWeekStart(monday);
    setShowWeekCalendar(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header Section */}
        <LinearGradient
          colors={['#8B5CF6', '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View style={styles.brandingContainer}>
              <View style={styles.cloudIcon}>
                <Ionicons name="cloud" size={24} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.brandTitle}>OffiAxis</Text>
                <Text style={styles.brandSubtitle}>Field Operations</Text>
              </View>
            </View>
            <View style={styles.topBarIcons}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="search" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>Yefry Soto</Text>
            <View style={styles.roleBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.roleText}>Admin</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {/* Clock In/Out */}
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIconContainer, { backgroundColor: '#E0F2F1' }]}>
                <Ionicons name="time-outline" size={32} color="#14B8A6" />
              </View>
              <Text style={styles.actionTitle}>Clock In/Out</Text>
              <Text style={styles.actionSubtitle}>Track your time</Text>
            </TouchableOpacity>

            {/* Upload File */}
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIconContainer, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="add" size={32} color="#3B82F6" />
              </View>
              <Text style={styles.actionTitle}>Upload File</Text>
              <Text style={styles.actionSubtitle}>Add documents</Text>
            </TouchableOpacity>

            {/* Receipts */}
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowReceiptPhotoOptions(true)}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="receipt-outline" size={32} color="#F59E0B" />
              </View>
              <Text style={styles.actionTitle}>Receipts</Text>
              <Text style={styles.actionSubtitle}>Add & scan receipts</Text>
            </TouchableOpacity>

            {/* Inventory Scanner */}
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIconContainer, { backgroundColor: '#F5F5F5' }]}>
                <Ionicons name="qr-code-outline" size={32} color="#6B7280" />
              </View>
              <Text style={styles.actionTitle}>Inventory Scanner</Text>
              <Text style={styles.actionSubtitle}>Scan items or take from inventory</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Weekly Timesheet */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weekly Timesheet</Text>
            <TouchableOpacity style={styles.dateRangeButton} onPress={() => setShowWeekCalendar(true)}>
              <Text style={styles.dateRange}>{formatWeekRange(selectedWeekStart)}</Text>
              <Ionicons name="calendar-outline" size={16} color="#6366F1" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.timesheetCard}>
            {/* Employee Selector */}
            <TouchableOpacity 
              style={styles.workerInfo} 
              onPress={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{selectedEmployee.initials}</Text>
              </View>
              <View style={styles.workerDetails}>
                <Text style={styles.workerName}>{selectedEmployee.name}</Text>
                <Text style={styles.workerRole}>{selectedEmployee.role}</Text>
              </View>
              <Ionicons 
                name={showEmployeeDropdown ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#9CA3AF" 
              />
            </TouchableOpacity>

            {/* Employee Dropdown */}
            {showEmployeeDropdown && (
              <View style={styles.dropdownContainer}>
                {employees.map((employee) => (
                  <TouchableOpacity
                    key={employee.id}
                    style={[
                      styles.dropdownItem,
                      selectedEmployee.id === employee.id && styles.dropdownItemActive
                    ]}
                    onPress={() => handleSelectEmployee(employee)}
                  >
                    <View style={styles.dropdownAvatar}>
                      <Text style={styles.dropdownAvatarText}>{employee.initials}</Text>
                    </View>
                    <View style={styles.dropdownInfo}>
                      <Text style={[
                        styles.dropdownName,
                        selectedEmployee.id === employee.id && styles.dropdownNameActive
                      ]}>
                        {employee.name}
                      </Text>
                      <Text style={styles.dropdownRole}>{employee.role} • ${employee.hourlyRate}/hr</Text>
                    </View>
                    {selectedEmployee.id === employee.id && (
                      <Ionicons name="checkmark-circle" size={20} color="#6366F1" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.hoursSection}>
              <View>
                <Text style={styles.hoursValue}>{selectedEmployee.hours} hrs</Text>
                <Text style={styles.hoursLabel}>This week</Text>
              </View>
              <View style={styles.earningsContainer}>
                <Text style={styles.earningsValue}>${earnings.toLocaleString()}</Text>
                <Text style={styles.earningsRate}>@ ${selectedEmployee.hourlyRate}/hr</Text>
              </View>
            </View>
          </View>
        </View>

        {/* P&L Summary Box */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>P&L</Text>
            <TouchableOpacity 
              style={styles.plBadge}
              onPress={() => setShowTimePeriodDropdown(!showTimePeriodDropdown)}
            >
              <Text style={styles.plBadgeText}>{selectedTimePeriod.label}</Text>
              <Ionicons 
                name={showTimePeriodDropdown ? "chevron-up" : "chevron-down"} 
                size={14} 
                color="#6366F1" 
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.plCard}>
            {/* Time Period Dropdown */}
            {showTimePeriodDropdown && (
              <View style={styles.timePeriodDropdown}>
                <ScrollView style={styles.timePeriodScrollView} nestedScrollEnabled={true}>
                  {timePeriodOptions.map((period) => (
                    <TouchableOpacity
                      key={period.id}
                      style={[
                        styles.timePeriodItem,
                        selectedTimePeriod.id === period.id && styles.timePeriodItemActive
                      ]}
                      onPress={() => handleSelectTimePeriod(period)}
                    >
                      <Text style={[
                        styles.timePeriodItemText,
                        selectedTimePeriod.id === period.id && styles.timePeriodItemTextActive
                      ]}>
                        {period.label}
                      </Text>
                      {selectedTimePeriod.id === period.id && (
                        <Ionicons name="checkmark-circle" size={18} color="#6366F1" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Income Row */}
            <View style={styles.plRow}>
              <View style={styles.plIconContainer}>
                <Ionicons name="trending-up" size={20} color="#10B981" />
              </View>
              <View style={styles.plRowContent}>
                <Text style={styles.plRowLabel}>Projects Total Income</Text>
                <Text style={[styles.plRowValue, styles.plIncomeValue]}>
                  ${plSummary.totalIncome.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Expenses Row */}
            <View style={styles.plRow}>
              <View style={[styles.plIconContainer, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="trending-down" size={20} color="#EF4444" />
              </View>
              <View style={styles.plRowContent}>
                <Text style={styles.plRowLabel}>Projects Total Expenses</Text>
                <Text style={[styles.plRowValue, styles.plExpenseValue]}>
                  ${plSummary.totalExpenses.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Profit Row */}
            <View style={[styles.plRow, styles.plProfitRow]}>
              <View style={[styles.plIconContainer, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="wallet" size={20} color="#3B82F6" />
              </View>
              <View style={styles.plRowContent}>
                <Text style={styles.plRowLabel}>Projects Total Profit</Text>
                <Text style={[styles.plRowValue, styles.plProfitValue]}>
                  ${plSummary.profit.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* P&L Page Button */}
            <TouchableOpacity 
              style={styles.plButton}
              onPress={() => router.push('/profitloss')}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.plButtonGradient}
              >
                <Ionicons name="pie-chart" size={18} color="#FFFFFF" />
                <Text style={styles.plButtonText}>P&L Page</Text>
                <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Our Portfolio Box */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Our Portfolio</Text>
            <TouchableOpacity style={styles.viewAllBtn} onPress={handleViewAllPortfolios}>
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color="#6366F1" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.portfolioCard}>
            {/* Search Box */}
            <View style={styles.portfolioSearchContainer}>
              <View style={styles.portfolioSearchBox}>
                <Ionicons name="search" size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.portfolioSearchInput}
                  placeholder="Search portfolio folders..."
                  placeholderTextColor="#9CA3AF"
                  value={portfolioSearchQuery}
                  onChangeText={handlePortfolioSearchChange}
                  onFocus={() => portfolioSearchQuery.length > 0 && setShowPortfolioSearchResults(true)}
                />
                {portfolioSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => { setPortfolioSearchQuery(''); setShowPortfolioSearchResults(false); }}>
                    <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Search Results Dropdown */}
              {showPortfolioSearchResults && (
                <View style={styles.searchResultsDropdown}>
                  {filteredPortfolios.length === 0 ? (
                    <View style={styles.noResultsContainer}>
                      <Ionicons name="folder-open-outline" size={24} color="#9CA3AF" />
                      <Text style={styles.noResultsText}>No folders found</Text>
                    </View>
                  ) : (
                    filteredPortfolios.map((portfolio) => (
                      <TouchableOpacity
                        key={portfolio.id}
                        style={styles.searchResultItem}
                        onPress={() => handlePortfolioClick(portfolio.id)}
                      >
                        {portfolio.coverImageUrl ? (
                          <Image source={{ uri: portfolio.coverImageUrl }} style={styles.searchResultThumb} />
                        ) : (
                          <View style={styles.searchResultThumbPlaceholder}>
                            <Ionicons name="folder" size={18} color="#6366F1" />
                          </View>
                        )}
                        <View style={styles.searchResultInfo}>
                          <Text style={styles.searchResultTitle}>{portfolio.title}</Text>
                          <Text style={styles.searchResultSubtitle}>{portfolio.photos.length} photos</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>

            {/* Portfolio Folder Previews */}
            <Text style={styles.portfolioPreviewsTitle}>Folders</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.portfolioPreviewsScroll}>
              {portfolios.slice(0, 5).map((portfolio) => (
                <TouchableOpacity
                  key={portfolio.id}
                  style={styles.portfolioPreviewCard}
                  onPress={() => handlePortfolioClick(portfolio.id)}
                >
                  {portfolio.coverImageUrl ? (
                    <Image source={{ uri: portfolio.coverImageUrl }} style={styles.portfolioPreviewImage} />
                  ) : (
                    <View style={styles.portfolioPreviewPlaceholder}>
                      <Ionicons name="folder" size={32} color="#6366F1" />
                    </View>
                  )}
                  <View style={styles.portfolioPreviewInfo}>
                    <Text style={styles.portfolioPreviewTitle} numberOfLines={1}>{portfolio.title}</Text>
                    <Text style={styles.portfolioPreviewCount}>{portfolio.photos.length} photos</Text>
                  </View>
                </TouchableOpacity>
              ))}
              
              {/* Add New Folder Card */}
              <TouchableOpacity
                style={[styles.portfolioPreviewCard, styles.addNewFolderCard]}
                onPress={handleViewAllPortfolios}
              >
                <View style={styles.addNewFolderIcon}>
                  <Ionicons name="add" size={32} color="#6366F1" />
                </View>
                <Text style={styles.addNewFolderText}>View All</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {activities.length > 0 && (
              <Text style={styles.activityCount}>{activities.length} activities</Text>
            )}
          </View>
          
          {activities.length === 0 ? (
            <View style={styles.emptyActivityContainer}>
              <Ionicons name="time-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyActivityText}>No recent activity</Text>
              <Text style={styles.emptyActivitySubtext}>
                Activities will appear here as you use the app
              </Text>
            </View>
          ) : (
            activities.slice(0, 10).map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={[styles.activityAvatar, { backgroundColor: getActivityColor(activity.type) }]}>
                  <Text style={styles.activityAvatarText}>{activity.userInitials}</Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>
                    <Text style={styles.activityName}>{activity.userName}</Text> {activity.description}
                  </Text>
                  <Text style={styles.activityTime}>{formatTimeAgo(activity.timestamp)}</Text>
                </View>
              </View>
            ))
          )}

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>

      {/* Week Calendar Modal */}
      <Modal
        visible={showWeekCalendar}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWeekCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Week</Text>
              <TouchableOpacity onPress={() => setShowWeekCalendar(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Calendar
              current={selectedWeekStart.toISOString().split('T')[0]}
              markedDates={{
                [selectedWeekStart.toISOString().split('T')[0]]: { 
                  selected: true, 
                  selectedColor: '#6366F1' 
                }
              }}
              onDayPress={handleWeekSelect}
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#64748b',
                selectedDayBackgroundColor: '#6366F1',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#6366F1',
                dayTextColor: '#0f172a',
                textDisabledColor: '#d1d5db',
                arrowColor: '#6366F1',
                monthTextColor: '#0f172a',
                textDayFontWeight: '500',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
              style={styles.calendar}
            />
            <Text style={styles.modalHint}>Tap any day to select that week</Text>
          </View>
        </View>
      </Modal>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <LinearGradient
          colors={['#8B5CF6', '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Ionicons name="cloud" size={28} color="#FFFFFF" />
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>2</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Receipt Photo Options Modal */}
      <Modal
        visible={showReceiptPhotoOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReceiptPhotoOptions(false)}
      >
        <View style={styles.receiptPhotoOptionsOverlay}>
          <TouchableOpacity 
            style={styles.receiptPhotoOptionsBackdrop}
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
          setSelectedProject(null);
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
                setSelectedProject(null);
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
            <View style={styles.projectSelectorSection}>
              <Text style={styles.projectSelectorLabel}>Select Project</Text>
              <TouchableOpacity
                style={styles.projectSelectorButton}
                onPress={() => setShowProjectSelector(!showProjectSelector)}
              >
                <Text style={selectedProject ? styles.projectSelectorValue : styles.projectSelectorPlaceholder}>
                  {selectedProject ? selectedProject.name : 'Choose a project...'}
                </Text>
                <Ionicons name={showProjectSelector ? "chevron-up" : "chevron-down"} size={20} color="#94A3B8" />
              </TouchableOpacity>
              
              {showProjectSelector && (
                <View style={styles.projectSelectorDropdown}>
                  {projects.map((project) => (
                    <TouchableOpacity
                      key={project.id}
                      style={styles.projectSelectorItem}
                      onPress={() => {
                        setSelectedProject(project);
                        setShowProjectSelector(false);
                      }}
                    >
                      <Text style={styles.projectSelectorItemText}>{project.name}</Text>
                      {selectedProject?.id === project.id && (
                        <Ionicons name="checkmark" size={20} color="#6366F1" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

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
            {!extractedReceiptData && !isManualEntry && (
              <>
                <TouchableOpacity
                  style={[styles.processReceiptButton, isProcessingReceipt && styles.processReceiptButtonDisabled]}
                  disabled={isProcessingReceipt}
                  onPress={async () => {
                    if (!selectedProject) {
                      Alert.alert('Select Project', 'Please select a project first');
                      return;
                    }
                    setIsProcessingReceipt(true);
                    // Simulate AI extraction
                    setTimeout(() => {
                      setExtractedReceiptData({
                        storeName: 'THE HOME DEPOT',
                        storeAddress: '2555 GRANT AVE\nPHILADELPHIA PA 19114\n(215) 969-1478',
                        date: new Date().toLocaleDateString(),
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        items: [
                          { name: '3-PACK CAULK', sku: '1003184254', price: 16.97 },
                          { name: 'FOAM SEALANT', sku: '1000090946', price: 8.47 },
                          { name: '3/4 PLYWOOD', sku: '1000094142', price: 32.48 },
                          { name: 'PLYWOOD 4X8', sku: '1000094140', price: 38.97 },
                        ],
                        subtotal: '96.89',
                        tax: '5.81',
                        totalAmount: '102.70',
                        paymentMethod: 'VISA',
                        lastFourDigits: '0012',
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

                {/* Manual Entry Button */}
                <TouchableOpacity
                  style={styles.manualEntryButton}
                  onPress={() => {
                    if (!selectedProject) {
                      Alert.alert('Select Project', 'Please select a project first');
                      return;
                    }
                    setIsManualEntry(true);
                  }}
                >
                  <Ionicons name="create-outline" size={20} color="#4F46E5" />
                  <Text style={styles.manualEntryButtonText}>Enter Details Manually</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Manual Entry Form */}
            {isManualEntry && (
              <View style={styles.manualEntryContainer}>
                <View style={styles.manualEntryHeader}>
                  <Ionicons name="create" size={24} color="#4F46E5" />
                  <Text style={styles.manualEntryHeaderText}>Manual Entry</Text>
                </View>

                {/* Store Information */}
                <View style={styles.extractedSection}>
                  <Text style={styles.extractedSectionTitle}>Store Information</Text>
                  <View style={styles.extractedField}>
                    <Text style={styles.extractedFieldLabel}>Merchant *</Text>
                    <TextInput
                      style={styles.extractedFieldInput}
                      value={manualMerchant}
                      onChangeText={setManualMerchant}
                      placeholder="e.g., Home Depot, Lowe's"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                {/* Transaction Details */}
                <View style={styles.extractedSection}>
                  <Text style={styles.extractedSectionTitle}>Transaction Details</Text>
                  <View style={styles.extractedFieldRow}>
                    <View style={[styles.extractedField, { flex: 1 }]}>
                      <Text style={styles.extractedFieldLabel}>Date *</Text>
                      <TextInput
                        style={styles.extractedFieldInput}
                        value={manualDate}
                        onChangeText={setManualDate}
                        placeholder="MM/DD/YYYY"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                    <View style={[styles.extractedField, { flex: 1 }]}>
                      <Text style={styles.extractedFieldLabel}>Time *</Text>
                      <TextInput
                        style={styles.extractedFieldInput}
                        value={manualTime}
                        onChangeText={setManualTime}
                        placeholder="HH:MM AM/PM"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                </View>

                {/* Description */}
                <View style={styles.extractedSection}>
                  <Text style={styles.extractedSectionTitle}>Description</Text>
                  <View style={styles.extractedField}>
                    <TextInput
                      style={[styles.extractedFieldInput, styles.descriptionInput]}
                      value={manualDescription}
                      onChangeText={setManualDescription}
                      placeholder="What was purchased? (optional)"
                      placeholderTextColor="#9CA3AF"
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>

                {/* Payment Summary */}
                <View style={styles.extractedSection}>
                  <Text style={styles.extractedSectionTitle}>Payment Summary</Text>
                  <View style={styles.extractedField}>
                    <Text style={styles.extractedFieldLabel}>Total Amount *</Text>
                    <View style={styles.amountInputContainer}>
                      <Text style={styles.currencySymbol}>$</Text>
                      <TextInput
                        style={[styles.extractedFieldInput, styles.amountInput]}
                        value={manualTotal}
                        onChangeText={setManualTotal}
                        placeholder="0.00"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>
                </View>

                {/* Category */}
                <View style={styles.extractedSection}>
                  <Text style={styles.extractedSectionTitle}>Category *</Text>
                  <TouchableOpacity
                    style={styles.categorySelectorButton}
                    onPress={() => setShowCategorySelector(!showCategorySelector)}
                  >
                    {manualCategory ? (
                      <View style={styles.selectedCategoryDisplay}>
                        <Ionicons 
                          name={receiptCategories.find(c => c.id === manualCategory)?.icon as any || 'ellipse'} 
                          size={20} 
                          color="#4F46E5" 
                        />
                        <Text style={styles.selectedCategoryText}>
                          {receiptCategories.find(c => c.id === manualCategory)?.label}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.categorySelectorPlaceholder}>Select a category...</Text>
                    )}
                    <Ionicons name={showCategorySelector ? "chevron-up" : "chevron-down"} size={20} color="#94A3B8" />
                  </TouchableOpacity>
                  
                  {showCategorySelector && (
                    <View style={styles.categoryDropdown}>
                      {receiptCategories.map((category) => (
                        <TouchableOpacity
                          key={category.id}
                          style={[
                            styles.categoryItem,
                            manualCategory === category.id && styles.categoryItemSelected
                          ]}
                          onPress={() => {
                            setManualCategory(category.id);
                            setShowCategorySelector(false);
                          }}
                        >
                          <Ionicons name={category.icon as any} size={20} color={manualCategory === category.id ? '#4F46E5' : '#6B7280'} />
                          <Text style={[
                            styles.categoryItemText,
                            manualCategory === category.id && styles.categoryItemTextSelected
                          ]}>
                            {category.label}
                          </Text>
                          {manualCategory === category.id && (
                            <Ionicons name="checkmark" size={20} color="#4F46E5" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Extracted Data Display (AI) */}
            {extractedReceiptData && !isManualEntry && (
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
                  <Text style={styles.extractedSectionTitle}>Items ({extractedReceiptData.items?.length || 0})</Text>
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
                  <View style={styles.extractedField}>
                    <Text style={styles.extractedFieldLabel}>Total Amount</Text>
                    <TextInput
                      style={[styles.extractedFieldInput, styles.extractedTotalInput]}
                      value={extractedReceiptData.totalAmount}
                      onChangeText={(text) => setExtractedReceiptData({...extractedReceiptData, totalAmount: text})}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          {(extractedReceiptData || isManualEntry) && (
            <View style={styles.addReceiptFooter}>
              <TouchableOpacity
                style={styles.addReceiptCancelButton}
                onPress={() => {
                  setShowAddReceiptModal(false);
                  setReceiptImageUri(null);
                  setExtractedReceiptData(null);
                  setSelectedProject(null);
                  resetManualForm();
                }}
              >
                <Text style={styles.addReceiptCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addReceiptSaveButton}
                onPress={() => {
                  if (isManualEntry) {
                    // Validate manual entry
                    if (!manualMerchant.trim()) {
                      Alert.alert('Required Field', 'Please enter the merchant name');
                      return;
                    }
                    if (!manualTotal.trim()) {
                      Alert.alert('Required Field', 'Please enter the total amount');
                      return;
                    }
                    if (!manualCategory) {
                      Alert.alert('Required Field', 'Please select a category');
                      return;
                    }
                    
                    // Log the activity for manual entry
                    const categoryLabel = receiptCategories.find(c => c.id === manualCategory)?.label || manualCategory;
                    logActivity({
                      type: 'receipt',
                      action: 'added',
                      description: `added $${manualTotal} receipt from ${manualMerchant} (${categoryLabel})`,
                      userName: 'Yefry Soto',
                      userInitials: 'YS',
                      projectName: selectedProject?.name,
                      metadata: { 
                        amount: manualTotal, 
                        store: manualMerchant,
                        category: manualCategory,
                        project: selectedProject?.name 
                      }
                    });
                  } else {
                    // Log the activity for AI extracted
                    logActivity({
                      type: 'receipt',
                      action: 'uploaded',
                      description: `uploaded receipt for $${extractedReceiptData.totalAmount} from ${extractedReceiptData.storeName}`,
                      userName: 'Yefry Soto',
                      userInitials: 'YS',
                      projectName: selectedProject?.name,
                      metadata: { 
                        amount: extractedReceiptData.totalAmount, 
                        store: extractedReceiptData.storeName,
                        project: selectedProject?.name 
                      }
                    });
                  }
                  
                  setShowAddReceiptModal(false);
                  setReceiptImageUri(null);
                  setExtractedReceiptData(null);
                  setSelectedProject(null);
                  resetManualForm();
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
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cloudIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#E0E7FF',
  },
  topBarIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeSection: {
    marginTop: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#E0E7FF',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 8,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  dateRange: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  timesheetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  workerDetails: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  workerRole: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Dropdown styles
  dropdownContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dropdownItemActive: {
    backgroundColor: '#EEF2FF',
  },
  dropdownAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dropdownAvatarText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  dropdownInfo: {
    flex: 1,
  },
  dropdownName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  dropdownNameActive: {
    color: '#6366F1',
  },
  dropdownRole: {
    fontSize: 12,
    color: '#6B7280',
  },
  hoursSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hoursValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  hoursLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  earningsContainer: {
    alignItems: 'flex-end',
  },
  earningsValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  earningsRate: {
    fontSize: 14,
    color: '#6B7280',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityCount: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  emptyActivityContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyActivityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 12,
  },
  emptyActivitySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  activityAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 15,
    color: '#4B5563',
    marginBottom: 4,
    lineHeight: 20,
  },
  activityName: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  activityTime: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  bottomSpacing: {
    height: 100,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 360,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  calendar: {
    borderRadius: 12,
    marginBottom: 12,
  },
  modalHint: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  fabBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // P&L Box Styles
  plBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  plBadgeText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
  },
  plCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  // Time Period Dropdown Styles
  timePeriodDropdown: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 200,
    overflow: 'hidden',
  },
  timePeriodScrollView: {
    maxHeight: 200,
  },
  timePeriodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  timePeriodItemActive: {
    backgroundColor: '#EEF2FF',
  },
  timePeriodItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  timePeriodItemTextActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
  plRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  plProfitRow: {
    borderBottomWidth: 0,
    paddingBottom: 20,
  },
  plIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  plRowContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plRowLabel: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  plRowValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  plIncomeValue: {
    color: '#10B981',
  },
  plExpenseValue: {
    color: '#EF4444',
  },
  plProfitValue: {
    color: '#3B82F6',
  },
  plButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  plButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  plButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Portfolio Box Styles
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  portfolioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  portfolioSearchContainer: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 10,
  },
  portfolioSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  portfolioSearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  searchResultsDropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 20,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchResultThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  searchResultThumbPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  searchResultSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noResultsText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  portfolioPreviewsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 12,
  },
  portfolioPreviewsScroll: {
    marginHorizontal: -4,
  },
  portfolioPreviewCard: {
    width: 120,
    marginHorizontal: 4,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  portfolioPreviewImage: {
    width: '100%',
    height: 80,
    backgroundColor: '#E5E7EB',
  },
  portfolioPreviewPlaceholder: {
    width: '100%',
    height: 80,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portfolioPreviewInfo: {
    padding: 10,
  },
  portfolioPreviewTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  portfolioPreviewCount: {
    fontSize: 11,
    color: '#6B7280',
  },
  addNewFolderCard: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  addNewFolderIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  addNewFolderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
  },
  // Receipt Modal Styles
  receiptPhotoOptionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  receiptPhotoOptionsBackdrop: {
    flex: 1,
  },
  receiptPhotoOptionsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  receiptPhotoOptionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  receiptPhotoOptionsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  receiptPhotoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  receiptPhotoOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptPhotoOptionContent: {
    flex: 1,
    marginLeft: 12,
  },
  receiptPhotoOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  receiptPhotoOptionDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  receiptPhotoOptionCancel: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  receiptPhotoOptionCancelText: {
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
  projectSelectorSection: {
    marginBottom: 20,
  },
  projectSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  projectSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  projectSelectorValue: {
    fontSize: 16,
    color: '#1F2937',
  },
  projectSelectorPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  projectSelectorDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 200,
  },
  projectSelectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  projectSelectorItemText: {
    fontSize: 15,
    color: '#1F2937',
  },
  receiptImagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  receiptImagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  changeReceiptImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
  },
  changeReceiptImageText: {
    fontSize: 14,
    color: '#4F46E5',
    marginLeft: 6,
    fontWeight: '600',
  },
  processReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  processReceiptButtonDisabled: {
    opacity: 0.7,
  },
  processReceiptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  extractedDataContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  extractedDataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  extractedDataHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 8,
  },
  extractedSection: {
    marginBottom: 20,
  },
  extractedSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  extractedField: {
    marginBottom: 12,
  },
  extractedFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  extractedFieldInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  extractedFieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  extractedTotalInput: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  extractedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  extractedItemName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  extractedItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
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
  addReceiptCancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addReceiptCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  addReceiptSaveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addReceiptSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Manual Entry Styles
  manualEntryButton: {
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
  manualEntryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  manualEntryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  manualEntryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  manualEntryHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
    marginLeft: 8,
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#10B981',
    paddingLeft: 12,
  },
  amountInput: {
    flex: 1,
    borderWidth: 0,
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  categorySelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedCategoryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedCategoryText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  categorySelectorPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  categoryDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 300,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  categoryItemSelected: {
    backgroundColor: '#EEF2FF',
  },
  categoryItemText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
  },
  categoryItemTextSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
});
