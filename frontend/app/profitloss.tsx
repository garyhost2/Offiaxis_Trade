import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, Modal, KeyboardAvoidingView, Platform, Alert, Dimensions, ActivityIndicator, FlatList, TouchableWithoutFeedback } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import { PieChart } from 'react-native-chart-kit';
import { getAllProjects } from '../utils/projectsData';
import { useActivity } from '../contexts/ActivityContext';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

const screenWidth = Dimensions.get('window').width;

const ProfitLossScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { logActivity } = useActivity();
  
  // State
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<'all' | number>('all');
  const [selectedTime, setSelectedTime] = useState('all');
  const [selectedJobType, setSelectedJobType] = useState('all');
  const [activeTab, setActiveTab] = useState<'expenses' | 'income'>('expenses');
  const [openDropdown, setOpenDropdown] = useState<'project' | 'time' | 'jobType' | null>(null);
  const [projectDropdownVisible, setProjectDropdownVisible] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data state
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpenses: 0, profit: 0, status: 'profitable' });
  const [breakdown, setBreakdown] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [projects, setProjects] = useState([]);
  
  // Modal states
  const [addExpenseModalVisible, setAddExpenseModalVisible] = useState(false);
  const [addIncomeModalVisible, setAddIncomeModalVisible] = useState(false);
  const [expenseProjectDropdownOpen, setExpenseProjectDropdownOpen] = useState(false);
  const [incomeProjectDropdownOpen, setIncomeProjectDropdownOpen] = useState(false);
  
  // Form state for Add Expense
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: 'material',
    projectId: '',
    date: new Date().toISOString(),
    vendor: '',
    note: '',
    miles: '',
    ratePerMile: '0.67',
  });
  
  // Form state for Add Income
  const [incomeForm, setIncomeForm] = useState({
    amount: '',
    type: 'invoice',
    projectId: '',
    date: new Date().toISOString(),
    note: '',
  });
  
  // Fetch projects on mount - using same data source as Projects page
  useEffect(() => {
    const loadProjects = () => {
      try {
        const data = getAllProjects();
        setProjects(data);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };
    loadProjects();
  }, []);
  
  // Handle projectId parameter from navigation
  useEffect(() => {
    if (params.projectId) {
      // Parse as number to match project IDs in the data
      const projectId = Number(params.projectId);
      if (!isNaN(projectId)) {
        setSelectedProject(projectId);
        setSearchQuery(''); // Clear search when coming from a specific project
      }
    }
  }, [params.projectId]);
  
  // Calculate date range based on selected time filter
  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;
    
    switch (selectedTime) {
      case 'all':
        // Return null for both to fetch all data
        return { startDate: null, endDate: null };
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'this_year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case 'last_year':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      case 'last_2_years':
        startDate = new Date(now.getFullYear() - 2, 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        return { startDate: null, endDate: null };
    }
    
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  };
  
  // Calculate permit expenses from local data
  const calculatePermitExpenses = () => {
    let totalExpenses = 0;
    const expenseEntries: any[] = [];
    
    // Get all projects to access permits
    const allProjects = getAllProjects();
    
    // Filter by selected project if applicable
    const projectsToCheck = selectedProject === 'all' 
      ? allProjects 
      : allProjects.filter(p => p.id === selectedProject);
    
    projectsToCheck.forEach((project: any) => {
      if (!project.permits) return;
      
      project.permits.forEach((permit: any) => {
        if (permit.fees) {
          // Parse fees amount (remove $ and convert to number)
          const feeAmount = parseFloat(permit.fees.replace(/[$,]/g, ''));
          
          if (!isNaN(feeAmount) && feeAmount > 0) {
            // Check if within date range
            const { startDate, endDate } = getDateRange();
            const permitDate = new Date(permit.dateAdded || new Date().toISOString());
            const isInRange = (!startDate || permitDate >= new Date(startDate)) && 
                             (!endDate || permitDate <= new Date(endDate));
            
            if (!isInRange) return;
            
            totalExpenses += feeAmount;
            
            // Add to expense entries list
            expenseEntries.push({
              _id: permit.id,
              amount: feeAmount,
              date: permit.dateAdded || new Date().toISOString().split('T')[0],
              note: `Permit ${permit.permitNumber || ''}`,
              category: 'Permit',
              projectId: project.id,
              projectName: project.name || project.clientName,
              source: 'permit'
            });
          }
        }
      });
    });
    
    return { totalExpenses, expenseEntries };
  };

  // Calculate income from change orders based on payment status (from local data)
  const calculateChangeOrderIncome = () => {
    let totalIncome = 0;
    const incomeEntries: any[] = [];
    
    // Get all projects to access change orders
    const allProjects = getAllProjects();
    
    // Filter by selected project if applicable
    const projectsToCheck = selectedProject === 'all' 
      ? allProjects 
      : allProjects.filter(p => p.id === selectedProject);
    
    projectsToCheck.forEach((project: any) => {
      if (!project.changeOrders) return;
      
      project.changeOrders.forEach((order: any) => {
        if (order.paymentStatus && order.paymentStatus !== 'Unpaid' && order.paidDate) {
          const paidAmount = order.paidAmount || 0;
          
          // Check if within date range
          const { startDate, endDate } = getDateRange();
          const paidDate = new Date(order.paidDate);
          const isInRange = (!startDate || paidDate >= new Date(startDate)) && 
                           (!endDate || paidDate <= new Date(endDate));
          
          if (!isInRange) return;
          
          // Add to total - use amount as-is (positive or negative)
          totalIncome += order.amount;
          
          // Add to income entries list - use FULL amount from change order AS-IS
          incomeEntries.push({
            _id: order.id,
            amount: order.amount,  // Use amount as-is (respects positive/negative from source)
            date: order.date,  // Use the original date field, not paidDate
            note: `${order.title} - ${order.paymentStatus}`,
            type: order.type || 'Change Order',
            projectId: project.id,
            projectName: project.clientName,
            source: 'changeOrder',
            paymentStatus: order.paymentStatus  // Add payment status directly
          });
        }
      });
    });
    
    return { totalIncome, incomeEntries };
  };

  // Calculate expenses from receipts (from local project data)
  const calculateReceiptExpenses = () => {
    let totalExpenses = 0;
    const expenseEntries: any[] = [];
    
    // Get all projects to access receipts
    const allProjects = getAllProjects();
    
    // Filter by selected project if applicable
    const projectsToCheck = selectedProject === 'all' 
      ? allProjects 
      : allProjects.filter(p => p.id === selectedProject);
    
    projectsToCheck.forEach((project: any) => {
      if (!project.receipts) return;
      
      project.receipts.forEach((receipt: any) => {
        if (receipt.totalAmount) {
          const amount = parseFloat(receipt.totalAmount);
          
          if (!isNaN(amount) && amount > 0) {
            // Parse receipt date (format: MM/DD/YYYY or ISO)
            let receiptDateStr = receipt.date || receipt.createdAt || new Date().toISOString().split('T')[0];
            let formattedDate = receiptDateStr;
            
            // Convert MM/DD/YYYY to YYYY-MM-DD if needed
            if (receiptDateStr.includes('/')) {
              const parts = receiptDateStr.split('/');
              if (parts.length === 3) {
                formattedDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
              }
            }
            
            // Check if within date range
            const { startDate, endDate } = getDateRange();
            const receiptDate = new Date(formattedDate);
            const isInRange = (!startDate || receiptDate >= new Date(startDate)) && 
                             (!endDate || receiptDate <= new Date(endDate));
            
            if (!isInRange) return;
            
            totalExpenses += amount;
            
            // Add to expense entries list
            expenseEntries.push({
              _id: receipt.id,
              amount: amount,
              date: formattedDate,
              note: receipt.storeName || 'Receipt',
              vendor: receipt.storeName,
              category: 'Receipt',
              projectId: project.id,
              projectName: project.name || project.clientName,
              source: 'receipt',
              isReceipt: true,
            });
          }
        }
      });
    });
    
    return { totalExpenses, expenseEntries };
  };

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();
      
      const params = new URLSearchParams();
      if (selectedProject !== 'all') {
        // Send projectId to backend (convert number to string for URL)
        params.append('projectId', String(selectedProject));
      }
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedJobType !== 'all') params.append('jobType', selectedJobType);
      
      const queryString = params.toString();
      
      // Fetch summary
      const summaryRes = await fetch(`${BACKEND_URL}/api/profit-loss/summary?${queryString}`);
      const summaryData = await summaryRes.json();
      
      // Calculate income from change orders (from local data)
      const changeOrderData = calculateChangeOrderIncome();
      
      // Calculate expenses from permits (from local data)
      const permitData = calculatePermitExpenses();
      
      // Calculate expenses from receipts (from local data)
      const receiptData = calculateReceiptExpenses();
      
      // When viewing a specific project, ONLY use change order data, permit data, and receipt data (no backend data)
      const totalIncome = selectedProject !== 'all' 
        ? changeOrderData.totalIncome 
        : summaryData.totalIncome + changeOrderData.totalIncome;
      
      const totalExpenses = selectedProject !== 'all' 
        ? permitData.totalExpenses + receiptData.totalExpenses  // Include permit and receipt expenses for specific project
        : summaryData.totalExpenses + permitData.totalExpenses + receiptData.totalExpenses;
      
      const profit = totalIncome - totalExpenses;
      
      setSummary({
        totalIncome,
        totalExpenses,
        profit,
        status: profit >= 0 ? 'profitable' : 'loss'
      });
      
      // Fetch breakdown
      const breakdownRes = await fetch(`${BACKEND_URL}/api/profit-loss/breakdown?${queryString}`);
      const breakdownData = await breakdownRes.json();
      
      // Add receipt category to breakdown if there are receipt expenses
      let updatedBreakdown = [...breakdownData];
      if (receiptData.totalExpenses > 0) {
        const totalBreakdownAmount = breakdownData.reduce((sum: number, item: any) => sum + item.amount, 0) + receiptData.totalExpenses;
        // Update percentages to include receipt
        updatedBreakdown = breakdownData.map((item: any) => ({
          ...item,
          percentage: totalBreakdownAmount > 0 ? ((item.amount / totalBreakdownAmount) * 100).toFixed(1) : 0
        }));
        // Add receipt category
        updatedBreakdown.push({
          category: 'Receipt',
          amount: receiptData.totalExpenses,
          percentage: totalBreakdownAmount > 0 ? ((receiptData.totalExpenses / totalBreakdownAmount) * 100).toFixed(1) : 0
        });
      }
      setBreakdown(updatedBreakdown);
      
      // Fetch expenses
      const expensesRes = await fetch(`${BACKEND_URL}/api/profit-loss/expenses?${queryString}`);
      const expensesData = await expensesRes.json();
      
      // When viewing a specific project, use permit and receipt expenses only
      const finalExpensesData = selectedProject !== 'all' ? [] : expensesData;
      
      // Combine backend expenses with permit expenses and receipt expenses
      const combinedExpenses = [...finalExpensesData, ...permitData.expenseEntries, ...receiptData.expenseEntries]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setExpenses(combinedExpenses);
      
      // Fetch income
      const incomeRes = await fetch(`${BACKEND_URL}/api/profit-loss/income?${queryString}`);
      const incomeData = await incomeRes.json();
      
      // If viewing a specific project, ONLY show change order income (no backend manual entries)
      // Backend manual entries will be phased out as users transition to using change orders
      const finalIncomeData = selectedProject !== 'all' ? [] : incomeData;
      
      // Combine backend income with change order income
      const combinedIncome = [...finalIncomeData, ...changeOrderData.incomeEntries]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setIncome(combinedIncome);
      
    } catch (error) {
      console.error('Error fetching profit & loss data:', error);
      Alert.alert('Error', 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [selectedProject, selectedTime, selectedJobType]);
  
  // Handle Add Expense
  const handleAddExpense = async () => {
    // Validate project selection
    if (!expenseForm.projectId) {
      Alert.alert('Error', 'Please select a project');
      return;
    }
    
    // For mileage category, validate miles and ratePerMile instead of amount
    if (expenseForm.category === 'mileage') {
      if (!expenseForm.miles || parseFloat(expenseForm.miles) <= 0) {
        Alert.alert('Error', 'Please enter valid miles for mileage expense');
        return;
      }
      if (!expenseForm.ratePerMile || parseFloat(expenseForm.ratePerMile) <= 0) {
        Alert.alert('Error', 'Please enter valid rate per mile');
        return;
      }
    } else {
      // For other categories, validate amount
      if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }
    }
    
    try {
      // Calculate amount for mileage
      let finalAmount = parseFloat(expenseForm.amount);
      if (expenseForm.category === 'mileage' && expenseForm.miles && expenseForm.ratePerMile) {
        finalAmount = parseFloat(expenseForm.miles) * parseFloat(expenseForm.ratePerMile);
      }
      
      const payload = {
        amount: finalAmount,
        category: expenseForm.category,
        projectId: expenseForm.projectId || null,
        date: expenseForm.date,
        vendor: expenseForm.vendor || null,
        note: expenseForm.note || null,
        miles: expenseForm.miles ? parseFloat(expenseForm.miles) : null,
        ratePerMile: expenseForm.ratePerMile ? parseFloat(expenseForm.ratePerMile) : null,
        source: 'manual',
        jobType: selectedJobType !== 'all' ? selectedJobType : null,
      };
      
      const res = await fetch(`${BACKEND_URL}/api/profit-loss/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        // Log activity
        const projectName = projects.find((p: any) => p.id.toString() === expenseForm.projectId)?.name || 'Unknown Project';
        const categoryLabels: Record<string, string> = {
          labor: 'labor',
          material: 'materials',
          warranty: 'warranty',
          mileage: 'mileage',
          misc: 'miscellaneous'
        };
        logActivity({
          type: 'expense',
          action: 'added',
          description: `added $${finalAmount.toFixed(2)} ${categoryLabels[expenseForm.category] || expenseForm.category} expense to ${projectName}`,
          userName: 'Yefry Soto',
          userInitials: 'YS',
          projectName: projectName,
          metadata: { amount: finalAmount, category: expenseForm.category }
        });
        
        Alert.alert('Success', 'Expense added successfully');
        setAddExpenseModalVisible(false);
        setExpenseForm({
          amount: '',
          category: 'material',
          projectId: '',
          date: new Date().toISOString(),
          vendor: '',
          note: '',
          miles: '',
          ratePerMile: '0.67',
        });
        fetchData();
      } else {
        Alert.alert('Error', 'Failed to add expense');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense');
    }
  };
  
  // Handle Add Income
  const handleAddIncome = async () => {
    // Validate project selection
    if (!incomeForm.projectId) {
      Alert.alert('Error', 'Please select a project');
      return;
    }
    
    if (!incomeForm.amount || parseFloat(incomeForm.amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    try {
      const payload = {
        amount: parseFloat(incomeForm.amount),
        type: incomeForm.type,
        projectId: incomeForm.projectId || null,
        date: incomeForm.date,
        note: incomeForm.note || null,
        jobType: selectedJobType !== 'all' ? selectedJobType : null,
      };
      
      const res = await fetch(`${BACKEND_URL}/api/profit-loss/income`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        // Log activity
        const projectName = projects.find((p: any) => p.id.toString() === incomeForm.projectId)?.name || 'Unknown Project';
        const typeLabels: Record<string, string> = {
          invoice: 'invoice',
          change_order: 'change order',
          service_call: 'service call',
          other: 'income'
        };
        logActivity({
          type: 'income',
          action: 'added',
          description: `recorded $${parseFloat(incomeForm.amount).toFixed(2)} ${typeLabels[incomeForm.type] || incomeForm.type} for ${projectName}`,
          userName: 'Yefry Soto',
          userInitials: 'YS',
          projectName: projectName,
          metadata: { amount: parseFloat(incomeForm.amount), type: incomeForm.type }
        });
        
        Alert.alert('Success', 'Income added successfully');
        setAddIncomeModalVisible(false);
        setIncomeForm({
          amount: '',
          type: 'invoice',
          projectId: '',
          date: new Date().toISOString(),
          note: '',
        });
        fetchData();
      } else {
        Alert.alert('Error', 'Failed to add income');
      }
    } catch (error) {
      console.error('Error adding income:', error);
      Alert.alert('Error', 'Failed to add income');
    }
  };
  
  // Format currency with commas and 2 decimals (x,xxx,xxx.xx)
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  // Format date as "MMM DD, YYYY" like "Nov 19, 2025" - no timezone conversion
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    // Parse YYYY-MM-DD directly without Date object to avoid timezone issues
    const [year, month, day] = dateString.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = monthNames[parseInt(month) - 1];
    return `${monthName} ${parseInt(day)}, ${year}`;
  };
  
  // Filter expenses and income based on search query
  const filteredExpenses = expenses.filter((expense: any) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const projectName = projects.find((p: any) => p.id === expense.projectId)?.name || '';
    
    return (
      expense.amount?.toString().includes(query) ||
      expense.vendor?.toLowerCase().includes(query) ||
      expense.note?.toLowerCase().includes(query) ||
      expense.category?.toLowerCase().includes(query) ||
      getCategoryLabel(expense.category)?.toLowerCase().includes(query) ||
      formatDate(expense.date)?.toLowerCase().includes(query) ||
      projectName.toLowerCase().includes(query)
    );
  });
  
  const filteredIncome = income.filter((incomeItem: any) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const projectName = projects.find((p: any) => p.id === incomeItem.projectId)?.name || '';
    
    return (
      incomeItem.amount?.toString().includes(query) ||
      incomeItem.type?.toLowerCase().includes(query) ||
      incomeItem.note?.toLowerCase().includes(query) ||
      formatDate(incomeItem.date)?.toLowerCase().includes(query) ||
      projectName.toLowerCase().includes(query)
    );
  });
  
  // Get category display name
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      labor: 'Labor',
      material: 'Materials',
      warranty: 'Warranty / Callbacks',
      mileage: 'Mileage',
      misc: 'Misc'
    };
    return labels[category] || category;
  };
  
  // Prepare chart data - Show Total Income vs Total Expenses with formatted amounts
  const chartData = [];
  
  if (summary.totalIncome > 0) {
    chartData.push({
      name: `Income $${summary.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      amount: summary.totalIncome,
      color: '#10B981',
      legendFontColor: '#059669',
      legendFontSize: 11
    });
  }
  
  if (summary.totalExpenses > 0) {
    chartData.push({
      name: `Expenses $${summary.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      amount: summary.totalExpenses,
      color: '#EF4444',
      legendFontColor: '#DC2626',
      legendFontSize: 11
    });
  }
  
  // If both are 0, show a placeholder
  if (chartData.length === 0) {
    chartData.push({
      name: 'No Data',
      amount: 1,
      color: '#E5E7EB',
      legendFontColor: '#9CA3AF',
      legendFontSize: 11
    });
  }
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profit & Loss</Text>
        <View style={styles.placeholder} />
      </LinearGradient>
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        scrollEnabled={openDropdown === null}
      >
        {/* Universal Quick Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search all entries…"
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
        </View>
        
        {/* Filters */}
        <View style={styles.filtersContainer}>
          {/* Row 1: Project and Time Period inline */}
          <View style={styles.filterRow}>
            {/* Project Filter */}
            <View style={[styles.filterGroup, styles.filterGroupHalf, { zIndex: 3 }]}>
              <Text style={styles.filterLabel}>Project</Text>
              <TouchableOpacity
                style={styles.modernFilterDropdown}
                onPress={() => setProjectDropdownVisible(true)}
              >
                <Text style={styles.modernFilterText}>
                  {selectedProject === 'all' 
                    ? 'All Projects' 
                    : projects.find((p: any) => p.id === selectedProject)?.name || 'Select Project'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {/* Time Filter */}
            <View style={[styles.filterGroup, styles.filterGroupHalf, { zIndex: 2 }]}>
              <Text style={styles.filterLabel}>Time Period</Text>
              <TouchableOpacity
                style={styles.modernFilterDropdown}
                onPress={() => setOpenDropdown(openDropdown === 'time' ? null : 'time')}
              >
                <Text style={styles.modernFilterText}>
                  {selectedTime === 'all' ? 'All' :
                   selectedTime === 'this_month' ? 'This Month' : 
                   selectedTime === 'this_year' ? 'This Year' : 
                   selectedTime === 'last_year' ? 'Last Year' :
                   selectedTime === 'last_2_years' ? 'Last 2+ Years' : 'This Month'}
                </Text>
                <Ionicons 
                  name={openDropdown === 'time' ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#6B7280" 
                />
              </TouchableOpacity>
              {openDropdown === 'time' && (
                <View style={styles.modernFilterListWrapper}>
                  <ScrollView 
                    style={styles.modernFilterList}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  >
                    {[
                      { value: 'all', label: 'All' },
                      { value: 'this_year', label: 'This Year' },
                      { value: 'this_month', label: 'This Month' },
                      { value: 'last_year', label: 'Last Year' },
                      { value: 'last_2_years', label: 'Last 2+ Years' },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.value}
                        style={[styles.modernFilterItem, selectedTime === item.value && styles.modernFilterItemActive]}
                        onPress={() => {
                          setSelectedTime(item.value);
                          setOpenDropdown(null);
                        }}
                      >
                        <Text style={[styles.modernFilterItemText, selectedTime === item.value && styles.modernFilterItemTextActive]}>
                          {item.label}
                        </Text>
                        {selectedTime === item.value && <Ionicons name="checkmark" size={18} color="#4F46E5" />}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
          
          {/* Job Type Filter */}
          <View style={[styles.filterGroup, { zIndex: 1 }]}>
            <Text style={styles.filterLabel}>Job Type</Text>
            <TouchableOpacity
              style={styles.modernFilterDropdown}
              onPress={() => setOpenDropdown(openDropdown === 'jobType' ? null : 'jobType')}
            >
              <Text style={styles.modernFilterText}>
                {selectedJobType === 'all' ? 'All Types' :
                 selectedJobType === 'service_call' ? 'Service Call' :
                 selectedJobType === 'new_construction' ? 'New Construction' :
                 selectedJobType === 'remodel' ? 'Remodel' :
                 selectedJobType === 'warranty' ? 'Warranty' : 'Emergency'}
              </Text>
              <Ionicons 
                name={openDropdown === 'jobType' ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#6B7280" 
              />
            </TouchableOpacity>
            {openDropdown === 'jobType' && (
              <View style={styles.modernFilterListWrapper}>
                <ScrollView 
                  style={styles.modernFilterList}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={false}
                >
                  {[
                    { value: 'all', label: 'All Types' },
                    { value: 'service_call', label: 'Service Call' },
                    { value: 'new_construction', label: 'New Construction' },
                    { value: 'remodel', label: 'Remodel' },
                    { value: 'warranty', label: 'Warranty' },
                    { value: 'emergency', label: 'Emergency' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      style={[styles.modernFilterItem, selectedJobType === item.value && styles.modernFilterItemActive]}
                      onPress={() => {
                        setSelectedJobType(item.value);
                        setOpenDropdown(null);
                      }}
                    >
                      <Text style={[styles.modernFilterItemText, selectedJobType === item.value && styles.modernFilterItemTextActive]}>
                        {item.label}
                      </Text>
                      {selectedJobType === item.value && <Ionicons name="checkmark" size={18} color="#4F46E5" />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
        
        {loading ? (
          <ActivityIndicator size="large" color="#4F46E5" style={styles.loader} />
        ) : (
          <>
            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
              {/* Total Income Card */}
              <View style={[styles.summaryCard, { borderLeftWidth: 5, borderLeftColor: '#10B981' }]}>
                <View style={styles.summaryIconContainer}>
                  <View style={[styles.summaryIcon, { backgroundColor: '#D1FAE5' }]}>
                    <Ionicons name="trending-up" size={18} color="#10B981" />
                  </View>
                </View>
                <Text style={styles.summaryLabel}>Total Income</Text>
                <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                  {formatCurrency(summary.totalIncome)}
                </Text>
              </View>
              
              {/* Total Expenses Card */}
              <View style={[styles.summaryCard, { borderLeftWidth: 5, borderLeftColor: '#EF4444' }]}>
                <View style={styles.summaryIconContainer}>
                  <View style={[styles.summaryIcon, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="trending-down" size={18} color="#EF4444" />
                  </View>
                </View>
                <Text style={styles.summaryLabel}>Total Expenses</Text>
                <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
                  {formatCurrency(summary.totalExpenses)}
                </Text>
                <Text style={styles.summaryHint}>Labor • Materials • Warranty • Mileage • Misc</Text>
              </View>
              
              {/* Profit Card */}
              <View style={[
                styles.summaryCard, 
                { 
                  borderLeftWidth: 5, 
                  borderLeftColor: summary.profit >= 0 ? '#10B981' : '#EF4444',
                }
              ]}>
                <View style={styles.summaryIconContainer}>
                  <View style={[
                    styles.summaryIcon, 
                    { backgroundColor: summary.profit >= 0 ? '#D1FAE5' : '#FEE2E2' }
                  ]}>
                    <Ionicons 
                      name={summary.profit >= 0 ? "checkmark-circle" : "alert-circle"} 
                      size={18} 
                      color={summary.profit >= 0 ? '#10B981' : '#EF4444'} 
                    />
                  </View>
                </View>
                <Text style={styles.summaryLabel}>Profit</Text>
                <Text style={[styles.summaryValue, { color: summary.profit >= 0 ? '#10B981' : '#EF4444' }]}>
                  {formatCurrency(summary.profit)}
                </Text>
                <Text style={[
                  styles.summaryStatus,
                  { 
                    backgroundColor: summary.profit >= 0 ? '#D1FAE5' : '#FEE2E2',
                    color: summary.profit >= 0 ? '#059669' : '#DC2626'
                  }
                ]}>
                  {summary.status === 'profitable' ? '✓ Profitable' : '⚠ At a Loss'}
                </Text>
              </View>
            </View>
            
            {/* Income vs Expenses Chart - Only show when viewing a specific project */}
            {chartData.length > 0 && selectedProject !== 'all' && (
              <View style={styles.chartContainer}>
                <Text style={styles.sectionTitle}>Income vs Expenses</Text>
                <View style={styles.modernChartWrapper}>
                  <PieChart
                    data={chartData}
                    width={screenWidth - 40}
                    height={200}
                    chartConfig={{
                      color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
                      propsForLabels: {
                        fontSize: 12,
                        fontWeight: '600',
                      }
                    }}
                    accessor="amount"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    center={[-20, 0]}
                    absolute={false}
                    hasLegend={false}
                  />
                  
                  {/* Custom Legend - No Percentages */}
                  <View style={styles.customLegend}>
                    {chartData.map((item, index) => (
                      <View key={index} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                        <Text style={styles.legendText}>{item.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}
            
            {/* Tabs: Expenses / Income */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'expenses' && styles.tabActive]}
                onPress={() => setActiveTab('expenses')}
              >
                <Text style={[styles.tabText, activeTab === 'expenses' && styles.tabTextActive]}>
                  Expenses ({filteredExpenses.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'income' && styles.tabActive]}
                onPress={() => setActiveTab('income')}
              >
                <Text style={[styles.tabText, activeTab === 'income' && styles.tabTextActive]}>
                  Income ({filteredIncome.length})
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* List */}
            {activeTab === 'expenses' ? (
              <View style={styles.listContainer}>
                {filteredExpenses.length === 0 ? (
                  <Text style={styles.emptyText}>
                    {searchQuery ? 'No expenses match your search' : 'No expenses found'}
                  </Text>
                ) : (
                  filteredExpenses.map((expense: any) => {
                    const projectName = projects.find((p: any) => p.id === expense.projectId)?.name || 'Unknown Project';
                    return (
                      <View key={expense.id} style={styles.listItem}>
                        <View style={styles.listItemLeft}>
                          <Text style={styles.listItemAmount}>{formatCurrency(expense.amount)}</Text>
                          <View style={styles.categoryBadge}>
                            <Text style={styles.categoryBadgeText}>{getCategoryLabel(expense.category)}</Text>
                          </View>
                          <Text style={styles.listItemProject}>{projectName}</Text>
                        </View>
                        <View style={styles.listItemRight}>
                          <Text style={styles.listItemDate}>{formatDate(expense.date)}</Text>
                          {expense.vendor && <Text style={styles.listItemNote}>{expense.vendor}</Text>}
                          {expense.note && <Text style={styles.listItemNote}>{expense.note}</Text>}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            ) : (
              <View style={styles.listContainer}>
                {filteredIncome.length === 0 ? (
                  <Text style={styles.emptyText}>
                    {searchQuery ? 'No income matches your search' : 'No income found'}
                  </Text>
                ) : (
                  filteredIncome.map((incomeItem: any) => {
                    // Handle both backend income and change order income
                    const projectName = incomeItem.projectName || 
                                       projects.find((p: any) => p.id === incomeItem.projectId)?.name || 
                                       'Unknown Project';
                    const isChangeOrder = incomeItem.source === 'changeOrder';
                    const isNegative = incomeItem.amount < 0;
                    
                    // Get payment status directly from the item
                    const paymentStatus = incomeItem.paymentStatus || incomeItem.note?.split(' - ')[1] || '';
                    // ONLY show these exact statuses
                    const validPaymentStatuses = ['Paid', 'Partially Paid', 'Refunded'];
                    const showPaymentStatus = isChangeOrder && validPaymentStatuses.includes(paymentStatus);
                    
                    return (
                      <View key={incomeItem._id || incomeItem.id} style={styles.listItem}>
                        <View style={styles.listItemLeft}>
                          <Text style={[
                            styles.listItemAmount, 
                            { color: isNegative ? '#DC2626' : '#10B981' }
                          ]}>
                            {formatCurrency(Math.abs(incomeItem.amount))}
                          </Text>
                          
                          {/* Badges Container */}
                          <View style={styles.badgesContainer}>
                            {/* Type Badge (Invoice, Change Order, Modification) */}
                            {isChangeOrder && (
                              <View style={[
                                styles.categoryBadge, 
                                { 
                                  backgroundColor: incomeItem.type === 'Invoice' ? '#DBEAFE' : 
                                                  incomeItem.type === 'Change Order' ? '#EDE9FE' : '#FEF3C7'
                                }
                              ]}>
                                <Text style={[
                                  styles.categoryBadgeText, 
                                  { 
                                    color: incomeItem.type === 'Invoice' ? '#1E40AF' : 
                                          incomeItem.type === 'Change Order' ? '#7C3AED' : '#D97706'
                                  }
                                ]}>
                                  {incomeItem.type}
                                </Text>
                              </View>
                            )}
                            
                            {/* Payment Status Badge - ONLY Paid, Partially Paid, Refunded */}
                            {isChangeOrder && showPaymentStatus && (
                              <View style={[
                                styles.categoryBadge, 
                                { 
                                  backgroundColor: paymentStatus === 'Paid' ? '#D1FAE5' : 
                                                  paymentStatus === 'Partially Paid' ? '#FEF3C7' : 
                                                  paymentStatus === 'Refunded' ? '#FEE2E2' : '#F3F4F6'
                                }
                              ]}>
                                <Text style={[
                                  styles.categoryBadgeText, 
                                  { 
                                    color: paymentStatus === 'Paid' ? '#059669' : 
                                          paymentStatus === 'Partially Paid' ? '#D97706' : 
                                          paymentStatus === 'Refunded' ? '#DC2626' : '#6B7280'
                                  }
                                ]}>
                                  {paymentStatus}
                                </Text>
                              </View>
                            )}
                          </View>
                          
                          <Text style={styles.listItemProject}>{projectName}</Text>
                        </View>
                        <View style={styles.listItemRight}>
                          <Text style={styles.listItemDate}>{formatDate(incomeItem.date)}</Text>
                          {incomeItem.note && (
                            <Text style={styles.listItemNote} numberOfLines={1}>
                              {incomeItem.note.split(' - ')[0]}
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, styles.fabSecondary]}
          onPress={() => {
            // Pre-select project if one is selected on the page
            if (selectedProject !== 'all') {
              setIncomeForm({ ...incomeForm, projectId: selectedProject });
            }
            setAddIncomeModalVisible(true);
          }}
        >
          <Ionicons name="cash-outline" size={24} color="#FFFFFF" />
          <Text style={styles.fabText}>Add Income</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            // Pre-select project if one is selected on the page
            if (selectedProject !== 'all') {
              setExpenseForm({ ...expenseForm, projectId: selectedProject });
            }
            setAddExpenseModalVisible(true);
          }}
        >
          <Ionicons name="receipt-outline" size={24} color="#FFFFFF" />
          <Text style={styles.fabText}>Add Expense</Text>
        </TouchableOpacity>
      </View>
      
      {/* Add Expense Modal */}
      <Modal
        visible={addExpenseModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddExpenseModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Expense</Text>
              <TouchableOpacity onPress={() => setAddExpenseModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Project *</Text>
              <View style={styles.modalProjectDropdown}>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setExpenseProjectDropdownOpen(!expenseProjectDropdownOpen)}
                >
                  <Text style={styles.dropdownButtonText}>
                    {expenseForm.projectId 
                      ? projects.find((p: any) => p.id === expenseForm.projectId)?.name 
                      : 'Select a project'}
                  </Text>
                  <Ionicons 
                    name={expenseProjectDropdownOpen ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#6B7280" 
                  />
                </TouchableOpacity>
                {expenseProjectDropdownOpen && (
                  <View style={styles.modalProjectList}>
                    <ScrollView 
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={false}
                      style={{ maxHeight: 200 }}
                    >
                      {projects.map((project: any) => (
                        <TouchableOpacity
                          key={project.id}
                          style={styles.projectItem}
                          onPress={() => {
                            setExpenseForm({ ...expenseForm, projectId: project.id });
                            setExpenseProjectDropdownOpen(false);
                          }}
                        >
                          <Text style={[
                            styles.projectItemText,
                            expenseForm.projectId === project.id && styles.projectItemTextActive
                          ]}>
                            {project.name}
                          </Text>
                          {expenseForm.projectId === project.id && (
                            <Ionicons name="checkmark" size={20} color="#4F46E5" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
              
              <Text style={styles.inputLabel}>Category *</Text>
              <View style={styles.categorySelector}>
                {['labor', 'material', 'warranty', 'mileage', 'misc'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryOption,
                      expenseForm.category === cat && styles.categoryOptionActive
                    ]}
                    onPress={() => setExpenseForm({ ...expenseForm, category: cat })}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      expenseForm.category === cat && styles.categoryOptionTextActive
                    ]}>
                      {getCategoryLabel(cat)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {expenseForm.category === 'mileage' ? (
                <>
                  {/* Mileage-specific fields */}
                  <Text style={styles.inputLabel}>Miles *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    value={expenseForm.miles}
                    onChangeText={(text) => setExpenseForm({ ...expenseForm, miles: text })}
                  />
                  
                  <Text style={styles.inputLabel}>Rate per Mile *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.67"
                    keyboardType="decimal-pad"
                    value={expenseForm.ratePerMile}
                    onChangeText={(text) => setExpenseForm({ ...expenseForm, ratePerMile: text })}
                  />
                  
                  {/* Show calculated amount for mileage */}
                  {expenseForm.miles && expenseForm.ratePerMile && (
                    <View style={styles.calculatedAmountContainer}>
                      <Text style={styles.calculatedAmountLabel}>Calculated Amount:</Text>
                      <Text style={styles.calculatedAmountValue}>
                        {formatCurrency(parseFloat(expenseForm.miles) * parseFloat(expenseForm.ratePerMile))}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <>
                  {/* Amount field for Labor, Materials, Warranty, Misc */}
                  <Text style={styles.inputLabel}>Amount *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={expenseForm.amount}
                    onChangeText={(text) => setExpenseForm({ ...expenseForm, amount: text })}
                  />
                  
                  {/* Vendor field - only show for Materials and Misc */}
                  {(expenseForm.category === 'material' || expenseForm.category === 'misc') && (
                    <>
                      <Text style={styles.inputLabel}>Vendor (Optional)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g., Home Depot"
                        value={expenseForm.vendor}
                        onChangeText={(text) => setExpenseForm({ ...expenseForm, vendor: text })}
                      />
                    </>
                  )}
                </>
              )}
              
              {/* Notes field - always show for all categories */}
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Optional notes..."
                multiline
                numberOfLines={3}
                value={expenseForm.note}
                onChangeText={(text) => setExpenseForm({ ...expenseForm, note: text })}
              />
              
              <TouchableOpacity style={styles.saveButton} onPress={handleAddExpense}>
                <Text style={styles.saveButtonText}>Save Expense</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* Project Dropdown Modal */}
      <Modal
        visible={projectDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setProjectDropdownVisible(false);
          setProjectSearchQuery('');
        }}
      >
        <TouchableOpacity 
          style={styles.dropdownModalOverlay}
          activeOpacity={1}
          onPress={() => {
            setProjectDropdownVisible(false);
            setProjectSearchQuery('');
          }}
        >
          <TouchableWithoutFeedback>
            <View style={styles.dropdownModalContent}>
              {/* Search Bar */}
              <View style={styles.modalSearchContainer}>
                <View style={styles.modalSearchBar}>
                  <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder="Search projects…"
                    placeholderTextColor="#9CA3AF"
                    value={projectSearchQuery}
                    onChangeText={setProjectSearchQuery}
                  />
                  {projectSearchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setProjectSearchQuery('')}>
                      <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              
              <FlatList
                data={[{ id: 'all', name: 'All Projects' }, ...projects].filter((item) => {
                  if (!projectSearchQuery) return true;
                  return item.name.toLowerCase().includes(projectSearchQuery.toLowerCase());
                })}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.dropdownModalItem,
                      selectedProject === item.id && styles.dropdownModalItemActive
                    ]}
                    onPress={() => {
                      setSelectedProject(item.id);
                      setProjectDropdownVisible(false);
                      setProjectSearchQuery('');
                    }}
                  >
                    <Text style={[
                      styles.dropdownModalItemText,
                      selectedProject === item.id && styles.dropdownModalItemTextActive
                    ]}>
                      {item.name}
                    </Text>
                    {selectedProject === item.id && <Ionicons name="checkmark" size={20} color="#4F46E5" />}
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={true}
                ListEmptyComponent={
                  <View style={styles.emptyListContainer}>
                    <Text style={styles.emptyListText}>No projects found</Text>
                  </View>
                }
              />
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
      
      {/* Add Income Modal */}
      <Modal
        visible={addIncomeModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddIncomeModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Income</Text>
              <TouchableOpacity onPress={() => setAddIncomeModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Project *</Text>
              <View style={styles.modalProjectDropdown}>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setIncomeProjectDropdownOpen(!incomeProjectDropdownOpen)}
                >
                  <Text style={styles.dropdownButtonText}>
                    {incomeForm.projectId 
                      ? projects.find((p: any) => p.id === incomeForm.projectId)?.name 
                      : 'Select a project'}
                  </Text>
                  <Ionicons 
                    name={incomeProjectDropdownOpen ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#6B7280" 
                  />
                </TouchableOpacity>
                {incomeProjectDropdownOpen && (
                  <View style={styles.modalProjectList}>
                    <ScrollView 
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={false}
                      style={{ maxHeight: 200 }}
                    >
                      {projects.map((project: any) => (
                        <TouchableOpacity
                          key={project.id}
                          style={styles.projectItem}
                          onPress={() => {
                            setIncomeForm({ ...incomeForm, projectId: project.id });
                            setIncomeProjectDropdownOpen(false);
                          }}
                        >
                          <Text style={[
                            styles.projectItemText,
                            incomeForm.projectId === project.id && styles.projectItemTextActive
                          ]}>
                            {project.name}
                          </Text>
                          {incomeForm.projectId === project.id && (
                            <Ionicons name="checkmark" size={20} color="#4F46E5" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
              
              <Text style={styles.inputLabel}>Amount *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={incomeForm.amount}
                onChangeText={(text) => setIncomeForm({ ...incomeForm, amount: text })}
              />
              
              <Text style={styles.inputLabel}>Type *</Text>
              <View style={styles.categorySelector}>
                {['invoice', 'change_order', 'service_call', 'other'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.categoryOption,
                      incomeForm.type === type && styles.categoryOptionActive
                    ]}
                    onPress={() => setIncomeForm({ ...incomeForm, type })}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      incomeForm.type === type && styles.categoryOptionTextActive
                    ]}>
                      {type.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Optional notes..."
                multiline
                numberOfLines={3}
                value={incomeForm.note}
                onChangeText={(text) => setIncomeForm({ ...incomeForm, note: text })}
              />
              
              <TouchableOpacity style={styles.saveButton} onPress={handleAddIncome}>
                <Text style={styles.saveButtonText}>Save Income</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  filtersContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  filterGroup: {
    width: '100%',
    position: 'relative',
    zIndex: 1,
  },
  filterGroupHalf: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modernFilterDropdown: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modernFilterText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
  },
  modernFilterListWrapper: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    height: 300,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 9999,
    overflow: 'hidden',
  },
  modernFilterList: {
    flex: 1,
    paddingVertical: 4,
  },
  modernFilterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modernFilterItemActive: {
    backgroundColor: '#EEF2FF',
  },
  modernFilterItemText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  modernFilterItemTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  loader: {
    marginTop: 40,
  },
  summaryContainer: {
    padding: 12,
    gap: 10,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 0,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.08)',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  summaryHint: {
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 4,
    fontStyle: 'italic',
  },
  summaryStatus: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 6,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  summaryIconContainer: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.1)',
  },
  modernChartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  customLegend: {
    marginTop: 20,
    alignItems: 'flex-start',
    paddingHorizontal: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  breakdownList: {
    marginTop: 12,
    gap: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#4F46E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  breakdownCategory: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  breakdownAmount: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '700',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 20,
  },
  listItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  listItemLeft: {
    flex: 1,
  },
  listItemAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 6,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  categoryBadgeText: {
    fontSize: 10,
    color: '#DC2626',
    fontWeight: '600',
  },
  listItemRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  listItemDate: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 3,
  },
  listItemNote: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  listItemProject: {
    fontSize: 10,
    color: '#4F46E5',
    fontWeight: '600',
    marginTop: 4,
  },
  modalProjectDropdown: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 15,
    color: '#111827',
    flex: 1,
  },
  modalProjectList: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 15,
    zIndex: 2000,
  },
  projectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  projectItemText: {
    fontSize: 14,
    color: '#374151',
  },
  projectItemTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  dropdownModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  modalSearchContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  emptyListContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  dropdownModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownModalItemActive: {
    backgroundColor: '#EEF2FF',
  },
  dropdownModalItemText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  dropdownModalItemTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    gap: 12,
  },
  fab: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabSecondary: {
    backgroundColor: '#10B981',
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryOptionActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  categoryOptionText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryOptionTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  calculatedAmountContainer: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calculatedAmountLabel: {
    fontSize: 14,
    color: '#0369A1',
    fontWeight: '600',
  },
  calculatedAmountValue: {
    fontSize: 20,
    color: '#0369A1',
    fontWeight: '700',
  },
});

export default ProfitLossScreen;
