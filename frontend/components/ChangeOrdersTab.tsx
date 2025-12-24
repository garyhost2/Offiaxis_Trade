import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, Alert, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface ChangeOrder {
  id: string;
  title: string;
  description?: string;
  amount: number;
  date: string;
  status: 'Submitted' | 'In Review' | 'Approved' | 'Rejected' | 'On Hold';
  type: 'Invoice' | 'Change Order' | 'Modification';
  requestedBy: string;
  fileName?: string | null;
  fileData?: string | null;
  convertToSigned?: boolean;
  paymentStatus?: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Refunded';
  paidAmount?: number;
  paidDate?: string;
  statusLogs?: {
    id: string;
    timestamp: string;
    oldStatus: string;
    newStatus: string;
    note?: string;
    changedBy?: string;
  }[];
  paymentStatusLogs?: {
    id: string;
    timestamp: string;
    oldStatus: string;
    newStatus: string;
    note?: string;
    changedBy?: string;
    paidAmount?: number;
  }[];
}

interface ChangeOrdersTabProps {
  changeOrders: ChangeOrder[];
  onUpdate: (updatedOrders: ChangeOrder[]) => void;
  projectId: number;
}

const STATUS_CONFIG = {
  'Submitted': { 
    emoji: '🔵', 
    color: '#3B82F6', 
    bg: '#DBEAFE',
    gradientColors: ['#60A5FA', '#3B82F6'] // Light blue to blue
  },
  'In Review': { 
    emoji: '🟡', 
    color: '#F59E0B', 
    bg: '#FEF3C7',
    gradientColors: ['#FBBF24', '#F59E0B'] // Light orange to orange
  },
  'Approved': { 
    emoji: '🟢', 
    color: '#10B981', 
    bg: '#D1FAE5',
    gradientColors: ['#34D399', '#10B981'] // Light green to green
  },
  'Rejected': { 
    emoji: '🔴', 
    color: '#EF4444', 
    bg: '#FEE2E2',
    gradientColors: ['#F87171', '#EF4444'] // Light red to red
  },
  'On Hold': { 
    emoji: '⚪', 
    color: '#64748B', 
    bg: '#F1F5F9',
    gradientColors: ['#94A3B8', '#64748B'] // Light gray to gray
  }
};

const TYPE_CONFIG = {
  'Invoice': { emoji: '📄', color: '#10B981', bg: '#D1FAE5' },
  'Change Order': { emoji: '📝', color: '#3B82F6', bg: '#DBEAFE' },
  'Modification': { emoji: '🔧', color: '#8B5CF6', bg: '#EDE9FE' }
};

const PAYMENT_STATUS_CONFIG = {
  'Unpaid': { 
    color: '#64748B', 
    bg: '#F1F5F9',
    textColor: '#475569'
  },
  'Partially Paid': { 
    color: '#F59E0B', 
    bg: '#FEF3C7',
    textColor: '#D97706'
  },
  'Paid': { 
    color: '#10B981', 
    bg: '#D1FAE5',
    textColor: '#059669'
  },
  'Refunded': { 
    color: '#EF4444', 
    bg: '#FEE2E2',
    textColor: '#DC2626'
  }
};

export default function ChangeOrdersTab({ changeOrders, onUpdate, projectId }: ChangeOrdersTabProps) {
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ChangeOrder | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Submitted' as ChangeOrder['status'],
    type: 'Change Order' as ChangeOrder['type'],
    requestedBy: '',
    fileName: null as string | null,
    fileData: null as string | null,
    convertToSigned: false
  });

  // Dropdown and Date Picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showPaymentStatusDropdown, setShowPaymentStatusDropdown] = useState(false);
  const [selectedOrderIdForPaymentStatus, setSelectedOrderIdForPaymentStatus] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Smart formatting states
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [showFormatToolbar, setShowFormatToolbar] = useState(false);
  const descriptionInputRef = React.useRef<any>(null);
  
  // Delete confirmation modal state
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0];
    setForm({
      title: '',
      description: '',
      amount: '',
      date: today,
      status: 'Submitted',
      type: 'Change Order',
      requestedBy: '',
      fileName: null,
      fileData: null,
      convertToSigned: false
    });
    setSelectedDate(new Date());
    setShowDatePicker(false);
    setShowStatusDropdown(false);
    setShowTypeDropdown(false);
  };

  // Format number with commas
  const formatAmount = (value: string) => {
    // Remove all non-digit and non-decimal characters
    const cleanValue = value.replace(/[^\d.-]/g, '');
    
    // Handle negative sign
    const isNegative = cleanValue.startsWith('-');
    const absValue = cleanValue.replace('-', '');
    
    // Split into integer and decimal parts
    const parts = absValue.split('.');
    let integerPart = parts[0];
    const decimalPart = parts[1];
    
    // Add commas to integer part
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Combine parts
    let formatted = integerPart;
    if (decimalPart !== undefined) {
      formatted += '.' + decimalPart.slice(0, 2); // Limit to 2 decimal places
    }
    
    return isNegative ? '-' + formatted : formatted;
  };

  // Handle amount change with formatting
  const handleAmountChange = (text: string) => {
    const formatted = formatAmount(text);
    setForm({ ...form, amount: formatted });
  };

  // Handle date change from picker
  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split('T')[0];
      setForm({ ...form, date: formattedDate });
      
      if (Platform.OS === 'ios') {
        // iOS will close after confirmation
      }
    }
  };

  // Format date as MM/DD/YYYY for display (without timezone conversion)
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return 'Select date';
    // Parse YYYY-MM-DD directly without Date object to avoid timezone issues
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year}`;
  };

  // Smart description handling
  const handleDescriptionChange = (text: string) => {
    // Handle bullet conversion: "- " at start of line → "•   "
    const lines = text.split('\n');
    const transformedLines = lines.map((line, index) => {
      // Only transform if this is the last line being edited
      if (index === lines.length - 1 && line.startsWith('- ')) {
        return '•   ' + line.substring(2);
      }
      return line;
    });
    
    const transformedText = transformedLines.join('\n');
    setForm({ ...form, description: transformedText });
  };

  // Handle Enter key for bullet continuation
  const handleDescriptionKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter') {
      const { description } = form;
      const lines = description.split('\n');
      const cursorLine = description.substring(0, selection.start).split('\n').length - 1;
      const currentLine = lines[cursorLine];

      // Check if current line is a bullet
      if (currentLine && currentLine.trim().startsWith('•')) {
        // If bullet line is empty (just "•   "), remove it and exit bullet mode
        if (currentLine.trim() === '•') {
          e.preventDefault();
          const newLines = [...lines];
          newLines[cursorLine] = '';
          setForm({ ...form, description: newLines.join('\n') });
          return;
        }
        
        // Otherwise, continue with new bullet on next line
        e.preventDefault();
        const beforeCursor = description.substring(0, selection.start);
        const afterCursor = description.substring(selection.start);
        const newDescription = beforeCursor + '\n•   ' + afterCursor;
        setForm({ ...form, description: newDescription });
        
        // Move cursor after the new bullet
        setTimeout(() => {
          const newCursorPos = selection.start + 5; // \n + •   
          setSelection({ start: newCursorPos, end: newCursorPos });
        }, 0);
      }
    }
  };

  // Handle text selection for formatting toolbar
  const handleSelectionChange = (event: any) => {
    const { start, end } = event.nativeEvent.selection;
    setSelection({ start, end });
    
    // Show toolbar if text is selected
    setShowFormatToolbar(start !== end);
  };

  // Apply formatting (markdown markers)
  const applyFormatting = (format: 'bold' | 'italic' | 'underline') => {
    const { description } = form;
    const { start, end } = selection;

    if (start === end) return; // Nothing selected

    const selectedText = description.substring(start, end);
    
    let markerStart = '';
    let markerEnd = '';

    if (format === 'bold') {
      markerStart = '**';
      markerEnd = '**';
    } else if (format === 'italic') {
      markerStart = '*';
      markerEnd = '*';
    } else if (format === 'underline') {
      markerStart = '__';
      markerEnd = '__';
    }

    const newDescription =
      description.substring(0, start) +
      markerStart +
      selectedText +
      markerEnd +
      description.substring(end);

    setForm({ ...form, description: newDescription });

    // Update selection to position after formatted text
    const newCursorPos = start + markerStart.length + selectedText.length + markerEnd.length;
    setTimeout(() => {
      setSelection({ start: newCursorPos, end: newCursorPos });
      setShowFormatToolbar(false);
    }, 0);
  };

  // Markdown parser for viewing
  const renderMarkdownText = (text: string) => {
    if (!text) return null;

    const lines = text.split('\n');
    return lines.map((line, lineIndex) => {
      // Check if line is a bullet
      const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
      const lineText = isBullet ? line.trim().substring(1).trim() : line;

      // Parse inline formatting
      const parts: { text: string; bold?: boolean; italic?: boolean; underline?: boolean }[] = [];
      let currentText = lineText;
      let currentIndex = 0;

      // Simple regex-based parser
      const boldRegex = /\*\*(.*?)\*\*/g;
      const italicRegex = /\*(.*?)\*/g;
      const underlineRegex = /__(.*?)__/g;

      // Parse bold
      let match;
      let lastIndex = 0;
      const segments: any[] = [];

      while ((match = boldRegex.exec(lineText)) !== null) {
        if (match.index > lastIndex) {
          segments.push({ text: lineText.substring(lastIndex, match.index), bold: false });
        }
        segments.push({ text: match[1], bold: true });
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < lineText.length) {
        segments.push({ text: lineText.substring(lastIndex), bold: false });
      }

      // For simplicity, we'll render basic formatting
      // A full parser would handle nested formatting
      return (
        <Text key={lineIndex} style={styles.markdownLine}>
          {isBullet && <Text>• </Text>}
          <Text>{lineText.replace(/\*\*/g, '').replace(/\*/g, '').replace(/__/g, '')}</Text>
          {lineIndex < lines.length - 1 && '\n'}
        </Text>
      );
    });
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*']
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        setForm({
          ...form,
          fileName: result.assets[0].name,
          fileData: result.assets[0].uri
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleSaveNew = () => {
    if (!form.title || !form.date || !form.requestedBy) {
      Alert.alert('Required Fields', 'Please fill in Title, Date, and Requested By');
      return;
    }

    // Remove commas from amount before saving
    const cleanAmount = form.amount.replace(/,/g, '');

    // Ensure date is saved without timezone shift
    // Keep it as YYYY-MM-DD format without converting to ISO string
    const newOrder: ChangeOrder = {
      id: Date.now().toString(),
      title: form.title,
      description: form.description,
      amount: parseFloat(cleanAmount) || 0,
      date: form.date, // Keep as YYYY-MM-DD
      status: form.status,
      type: form.type,
      requestedBy: form.requestedBy,
      fileName: form.fileName,
      fileData: form.fileData,
      convertToSigned: form.convertToSigned,
      statusLogs: []
    };

    onUpdate([...changeOrders, newOrder]);
    setAddModalVisible(false);
    resetForm();
  };

  const handleSaveEdit = () => {
    if (!selectedOrder) return;
    
    const updatedOrders = changeOrders.map(order => 
      order.id === selectedOrder.id ? {
        ...order,
        title: form.title,
        description: form.description,
        amount: parseFloat(form.amount) || 0,
        date: form.date,
        status: form.status,
        type: form.type,
        requestedBy: form.requestedBy,
        fileName: form.fileName,
        fileData: form.fileData,
        convertToSigned: form.convertToSigned
      } : order
    );

    onUpdate(updatedOrders);
    setIsEditing(false);
    setViewModalVisible(false);
    setSelectedOrder(null);
    resetForm();
  };

  const handleDelete = () => {
    if (!selectedOrder) return;
    setDeleteConfirmVisible(true);
  };

  const confirmDelete = () => {
    if (!selectedOrder) return;
    
    const updatedOrders = changeOrders.filter(order => order.id !== selectedOrder.id);
    onUpdate(updatedOrders);
    setDeleteConfirmVisible(false);
    setViewModalVisible(false);
    setSelectedOrder(null);
  };

  const handleStatusChange = (orderId: string, newStatus: ChangeOrder['status']) => {
    const updatedOrders = changeOrders.map(order => {
      if (order.id === orderId) {
        const statusLog = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          oldStatus: order.status,
          newStatus: newStatus,
          changedBy: 'Current User'
        };
        
        return {
          ...order,
          status: newStatus,
          statusLogs: [...(order.statusLogs || []), statusLog]
        };
      }
      return order;
    });

    onUpdate(updatedOrders);
  };

  const handleViewDetails = (order: ChangeOrder) => {
    setSelectedOrder(order);
    setForm({
      title: order.title,
      description: order.description || '',
      amount: order.amount.toString(),
      date: order.date,
      status: order.status,
      type: order.type,
      requestedBy: order.requestedBy,
      fileName: order.fileName || null,
      fileData: order.fileData || null,
      convertToSigned: order.convertToSigned || false
    });
    setViewModalVisible(true);
  };

  // Helper: Format date as "MMM DD, YYYY" like "Nov 19, 2025"
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    // Parse YYYY-MM-DD without timezone conversion
    const [year, month, day] = dateString.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = monthNames[parseInt(month) - 1];
    return `${monthName} ${parseInt(day)}, ${year}`;
  };

  // Handler: Open view modal
  const openViewModal = (order: ChangeOrder) => {
    handleViewDetails(order);
  };

  // Handler: Open status log modal when status is selected
  const handleStatusSelect = (
    orderId: string,
    oldStatus: string,
    newStatus: string
  ) => {
    setStatusLogData({
      orderId,
      oldStatus,
      newStatus,
      date: new Date().toISOString().split('T')[0],
      note: '',
    });
    setStatusLogVisible(true);
  };

  // Handler: Save status log and update order
  const handleSaveStatusLog = () => {
    if (!statusLogData.orderId) {
      setStatusLogVisible(false);
      return;
    }

    const updated = changeOrders.map((order) => {
      if (order.id !== statusLogData.orderId) return order;

      const newLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date(statusLogData.date).toISOString(),
        oldStatus: statusLogData.oldStatus,
        newStatus: statusLogData.newStatus,
        note: statusLogData.note,
        changedBy: 'Current User',
      };

      return {
        ...order,
        status: statusLogData.newStatus as ChangeOrder['status'],
        statusLogs: [...(order.statusLogs ?? []), newLog],
      };
    });

    onUpdate(updated);

    setStatusLogVisible(false);
    setStatusLogData({
      orderId: null,
      oldStatus: '',
      newStatus: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
    });
  };

  // Handler: Change type (with persistence)
  const handleChangeOrderTypeChange = (orderId: string, newType: ChangeOrder['type']) => {
    const updatedOrders = changeOrders.map(order => {
      if (order.id === orderId) {
        return { ...order, type: newType };
      }
      return order;
    });
    onUpdate(updatedOrders);
  };

  // Handler: Open payment status change log modal
  const handlePaymentStatusSelect = (orderId: string, oldPaymentStatus: string, newPaymentStatus: string) => {
    // Get the order's amount to pre-fill paid amount
    const order = changeOrders.find(o => o.id === orderId);
    const orderAmount = order?.amount || 0;
    
    setPaymentStatusLogData({
      orderId,
      oldStatus: oldPaymentStatus,
      newStatus: newPaymentStatus,
      date: new Date().toISOString().split('T')[0],
      note: '',
      paidAmount: Math.abs(orderAmount).toString(),
    });
    setSelectedPaymentLogDate(new Date());
    setPaymentStatusLogVisible(true);
  };

  // Handler: Save payment status log
  const handleSavePaymentStatusLog = () => {
    if (!paymentStatusLogData.orderId) {
      setPaymentStatusLogVisible(false);
      return;
    }

    const paidAmountNum = parseFloat(paymentStatusLogData.paidAmount) || 0;

    const updated = changeOrders.map((order) => {
      if (order.id !== paymentStatusLogData.orderId) return order;

      const newLog = {
        id: `plog-${Date.now()}`,
        timestamp: new Date(paymentStatusLogData.date).toISOString(),
        oldStatus: paymentStatusLogData.oldStatus,
        newStatus: paymentStatusLogData.newStatus,
        note: paymentStatusLogData.note,
        changedBy: 'Current User',
        paidAmount: paidAmountNum,
      };

      return {
        ...order,
        paymentStatus: paymentStatusLogData.newStatus as ChangeOrder['paymentStatus'],
        paidAmount: paidAmountNum,
        paidDate: paymentStatusLogData.date,
        paymentStatusLogs: [...(order.paymentStatusLogs ?? []), newLog],
      };
    });

    onUpdate(updated);

    setPaymentStatusLogVisible(false);
    setPaymentStatusLogData({
      orderId: null,
      oldStatus: '',
      newStatus: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
      paidAmount: '',
    });
  };

  // State for card dropdown selection
  const [selectedOrderIdForStatus, setSelectedOrderIdForStatus] = useState<string | null>(null);
  const [selectedOrderIdForType, setSelectedOrderIdForType] = useState<string | null>(null);

  // Status Change Log modal state
  const [statusLogVisible, setStatusLogVisible] = useState(false);

  type StatusLogData = {
    orderId: string | null;
    oldStatus: string;
    newStatus: string;
    date: string;  // 'YYYY-MM-DD'
    note: string;
  };

  const [statusLogData, setStatusLogData] = useState<StatusLogData>({
    orderId: null,
    oldStatus: '',
    newStatus: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  // Payment Status Change Log modal state
  const [paymentStatusLogVisible, setPaymentStatusLogVisible] = useState(false);
  const [showPaymentLogDatePicker, setShowPaymentLogDatePicker] = useState(false);
  const [selectedPaymentLogDate, setSelectedPaymentLogDate] = useState(new Date());

  type PaymentStatusLogData = {
    orderId: string | null;
    oldStatus: string;
    newStatus: string;
    date: string;  // 'YYYY-MM-DD'
    note: string;
    paidAmount: string;
  };

  const [paymentStatusLogData, setPaymentStatusLogData] = useState<PaymentStatusLogData>({
    orderId: null,
    oldStatus: '',
    newStatus: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
    paidAmount: '',
  });

  // Status Dropdown Component
  const StatusDropdown = ({ orderId, value }: { orderId: string; value: string }) => {
    const config = STATUS_CONFIG[value as keyof typeof STATUS_CONFIG];
    return (
      <TouchableOpacity
        style={styles.statusPill}
        onPress={() => {
          setSelectedOrderIdForStatus(orderId);
          setShowStatusDropdown(true);
        }}
      >
        <Text style={styles.statusPillEmoji}>{config.emoji}</Text>
        <Text style={[styles.statusPillText, { color: config.color }]}>{value}</Text>
        <Ionicons name="chevron-down" size={12} color={config.color} />
      </TouchableOpacity>
    );
  };

  // Type Dropdown Component
  const TypeDropdown = ({ orderId, value }: { orderId: string; value: string }) => {
    const config = TYPE_CONFIG[value as keyof typeof TYPE_CONFIG];
    return (
      <TouchableOpacity
        style={styles.typePill}
        onPress={() => {
          setSelectedOrderIdForType(orderId);
          setShowTypeDropdown(true);
        }}
      >
        <Text style={styles.typePillEmoji}>{config.emoji}</Text>
        <Text style={[styles.typePillText, { color: config.color }]}>{value}</Text>
        <Ionicons name="chevron-down" size={12} color={config.color} />
      </TouchableOpacity>
    );
  };

  const renderChangeOrderCard = (order: ChangeOrder) => {
    return (
      <View key={order.id} style={styles.cardContainer}>
        <View style={styles.topRow}>
          
          {/* LEFT SIDE – Title + Description (Clickable to open View Details) */}
          <TouchableOpacity 
            style={styles.leftColumn}
            activeOpacity={0.7}
            onPress={() => openViewModal(order)}
          >
            <Text style={styles.title} numberOfLines={1}>
              {order.title}
            </Text>

            {order.description ? (
              <Text style={styles.description} numberOfLines={3}>
                {order.description}
              </Text>
            ) : null}
          </TouchableOpacity>

          {/* RIGHT SIDE – Status + Type dropdowns */}
          <View style={styles.rightColumn}>
            <StatusDropdown
              orderId={order.id}
              value={order.status}
            />

            <TypeDropdown
              orderId={order.id}
              value={order.type}
            />
          </View>
        </View>

        {/* AMOUNT ROW – BOTTOM LEFT */}
        <View style={styles.amountRow}>
          <Text style={[
            styles.amount,
            order.amount >= 0 ? styles.amountPositive : styles.amountNegative
          ]}>
            {order.amount >= 0 ? '+' : '-'}${Math.abs(order.amount).toLocaleString()}
          </Text>
          
          {/* Payment Status Dropdown - Small inline pill */}
          <TouchableOpacity
            style={[
              styles.paymentStatusPill,
              { backgroundColor: PAYMENT_STATUS_CONFIG[order.paymentStatus || 'Unpaid'].bg }
            ]}
            onPress={() => {
              setSelectedOrderIdForPaymentStatus(order.id);
              setShowPaymentStatusDropdown(true);
            }}
          >
            <Text style={[
              styles.paymentStatusText,
              { color: PAYMENT_STATUS_CONFIG[order.paymentStatus || 'Unpaid'].textColor }
            ]}>
              {order.paymentStatus || 'Unpaid'}
            </Text>
            <Ionicons 
              name="chevron-down" 
              size={12} 
              color={PAYMENT_STATUS_CONFIG[order.paymentStatus || 'Unpaid'].textColor} 
            />
          </TouchableOpacity>
        </View>

        {/* DATE + REQUESTED BY – BOTTOM RIGHT */}
        <View style={styles.bottomRight}>
          <Text style={styles.date}>
            {formatDate(order.date)}
          </Text>
          <Text style={styles.byLine}>
            By: {order.requestedBy}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Sort by date descending (newest first/top) */}
        {[...changeOrders]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map(order => renderChangeOrderCard(order))}

        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setAddModalVisible(true);
          }}
        >
          <Ionicons name="add-circle-outline" size={24} color="#4F46E5" />
          <Text style={styles.addButtonText}>Add Change Order</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Modal - Centered Design */}
      <Modal
        visible={addModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.centeredModalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setAddModalVisible(false)}
          />
          
          <View style={styles.centeredModalContainer}>
            {/* Gradient Header */}
            <LinearGradient
              colors={['#4F46E5', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientHeader}
            >
              <Text style={styles.gradientHeaderTitle}>Add Change Order</Text>
              <TouchableOpacity 
                onPress={() => setAddModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.compactModalBody} showsVerticalScrollIndicator={false}>
              {/* Title */}
              <View style={styles.compactField}>
                <Text style={styles.compactLabel}>
                  Title <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.compactInput}
                  value={form.title}
                  onChangeText={(text) => setForm({ ...form, title: text })}
                  placeholder="Enter title"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Description with Smart Formatting */}
              <View style={styles.compactField}>
                <Text style={styles.compactLabel}>Description</Text>
                
                {/* Format Toolbar */}
                {showFormatToolbar && (
                  <View style={styles.formatToolbar}>
                    <TouchableOpacity
                      style={styles.formatButton}
                      onPress={() => applyFormatting('bold')}
                    >
                      <Text style={[styles.formatButtonText, { fontWeight: 'bold' }]}>B</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.formatButton}
                      onPress={() => applyFormatting('italic')}
                    >
                      <Text style={[styles.formatButtonText, { fontStyle: 'italic' }]}>I</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.formatButton}
                      onPress={() => applyFormatting('underline')}
                    >
                      <Text style={[styles.formatButtonText, { textDecorationLine: 'underline' }]}>U</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                <TextInput
                  ref={descriptionInputRef}
                  style={[styles.compactInput, styles.compactTextArea]}
                  value={form.description}
                  onChangeText={handleDescriptionChange}
                  onKeyPress={handleDescriptionKeyPress}
                  onSelectionChange={handleSelectionChange}
                  placeholder="Enter description... (Tip: Start a line with '- ' to create bullets)"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  selection={selection}
                />
                <Text style={styles.formatHelperText}>
                  Select text to format with Bold, Italic, or Underline
                </Text>
              </View>

              {/* Amount - With Auto-formatting */}
              <View style={styles.compactField}>
                <Text style={styles.compactLabel}>Amount ($)</Text>
                <TextInput
                  style={styles.compactInput}
                  value={form.amount}
                  onChangeText={handleAmountChange}
                  placeholder="Enter amount (use - for negative)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              {/* Date - Modern Calendar Picker */}
              <View style={styles.compactField}>
                <Text style={styles.compactLabel}>
                  Date <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      // Web: use native HTML date input
                      const input = document.createElement('input');
                      input.type = 'date';
                      input.value = form.date;
                      input.onchange = (e: any) => {
                        setForm({ ...form, date: e.target.value });
                      };
                      input.click();
                    } else {
                      setShowDatePicker(true);
                    }
                  }}
                >
                  <Ionicons name="calendar-outline" size={20} color="#4F46E5" />
                  <Text style={styles.datePickerText}>
                    {formatDateForDisplay(form.date)}
                  </Text>
                </TouchableOpacity>
                
                {showDatePicker && Platform.OS !== 'web' && (
                  <Modal
                    transparent={true}
                    visible={showDatePicker}
                    animationType="fade"
                    onRequestClose={() => setShowDatePicker(false)}
                  >
                    <TouchableOpacity
                      style={styles.datePickerOverlay}
                      activeOpacity={1}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <View style={styles.datePickerContainer}>
                        <DateTimePicker
                          value={selectedDate}
                          mode="date"
                          display="default"
                          onChange={handleDateChange}
                        />
                      </View>
                    </TouchableOpacity>
                  </Modal>
                )}
              </View>

              {/* Status - Modern Dropdown */}
              <View style={styles.compactField}>
                <Text style={styles.compactLabel}>
                  Status <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowStatusDropdown(true)}
                >
                  <Text style={styles.dropdownButtonText}>{form.status}</Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Type - Modern Dropdown */}
              <View style={styles.compactField}>
                <Text style={styles.compactLabel}>Type</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowTypeDropdown(true)}
                >
                  <Text style={styles.dropdownButtonText}>
                    {TYPE_CONFIG[form.type as keyof typeof TYPE_CONFIG].emoji} {form.type}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Requested By */}
              <View style={styles.compactField}>
                <Text style={styles.compactLabel}>
                  Requested By <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.compactInput}
                  value={form.requestedBy}
                  onChangeText={(text) => setForm({ ...form, requestedBy: text })}
                  placeholder="Enter name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Upload File */}
              <View style={styles.compactField}>
                <Text style={styles.compactLabel}>Upload File</Text>
                <TouchableOpacity style={styles.compactFileButton} onPress={handlePickDocument}>
                  <Ionicons name="cloud-upload-outline" size={20} color="#4F46E5" />
                  <Text style={styles.compactFileButtonText}>
                    {form.fileName || 'Choose File'}
                  </Text>
                </TouchableOpacity>
                
                {form.fileName && (
                  <View style={styles.filePreview}>
                    <Ionicons name="document-attach" size={16} color="#4F46E5" />
                    <Text style={styles.filePreviewText} numberOfLines={1}>
                      {form.fileName}
                    </Text>
                  </View>
                )}

                {/* Convert to Signed Doc */}
                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setForm({ ...form, convertToSigned: !form.convertToSigned })}
                  >
                    {form.convertToSigned && (
                      <Ionicons name="checkmark" size={16} color="#4F46E5" />
                    )}
                  </TouchableOpacity>
                  <Text style={styles.checkboxLabel}>Convert to a Signed Doc</Text>
                </View>
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.compactModalFooter}>
              <TouchableOpacity 
                style={styles.compactButtonSecondary}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.compactButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.compactButtonPrimary}
                onPress={handleSaveNew}
              >
                <LinearGradient
                  colors={['#4F46E5', '#3B82F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.compactButtonGradient}
                >
                  <Text style={styles.compactButtonPrimaryText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status Dropdown Modal */}
      <Modal
        visible={showStatusDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowStatusDropdown(false);
          setSelectedOrderIdForStatus(null);
        }}
      >
        <TouchableOpacity
          style={styles.overlayDropdown}
          activeOpacity={1}
          onPress={() => {
            setShowStatusDropdown(false);
            setSelectedOrderIdForStatus(null);
          }}
        >
          <View style={styles.dropdownModalContent}>
            <Text style={styles.dropdownModalTitle}>Select Status</Text>
            <ScrollView style={styles.dropdownModalScroll}>
              {Object.keys(STATUS_CONFIG).map((status) => {
                const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
                return (
                  <TouchableOpacity
                    key={status}
                    style={styles.dropdownModalItem}
                    onPress={() => {
                      // If from Add modal, update form
                      if (!selectedOrderIdForStatus) {
                        setForm({ ...form, status: status as ChangeOrder['status'] });
                      } else {
                        // If from card dropdown, open status log modal
                        const order = changeOrders.find(o => o.id === selectedOrderIdForStatus);
                        if (order) {
                          handleStatusSelect(selectedOrderIdForStatus, order.status, status);
                        }
                        setSelectedOrderIdForStatus(null);
                      }
                      setShowStatusDropdown(false);
                    }}
                  >
                    <View style={styles.statusItemContent}>
                      <LinearGradient
                        colors={config.gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statusGradientCircle}
                      />
                      <Text style={styles.dropdownModalItemText}>{status}</Text>
                    </View>
                    {(!selectedOrderIdForStatus && form.status === status) && (
                      <Ionicons name="checkmark" size={24} color="#4F46E5" />
                    )}
                    {selectedOrderIdForStatus && 
                      changeOrders.find(o => o.id === selectedOrderIdForStatus)?.status === status && (
                      <Ionicons name="checkmark" size={24} color="#4F46E5" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Type Dropdown Modal */}
      <Modal
        visible={showTypeDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowTypeDropdown(false);
          setSelectedOrderIdForType(null);
        }}
      >
        <TouchableOpacity
          style={styles.overlayDropdown}
          activeOpacity={1}
          onPress={() => {
            setShowTypeDropdown(false);
            setSelectedOrderIdForType(null);
          }}
        >
          <View style={styles.dropdownModalContent}>
            <Text style={styles.dropdownModalTitle}>Select Type</Text>
            <ScrollView style={styles.dropdownModalScroll}>
              {Object.keys(TYPE_CONFIG).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.dropdownModalItem}
                  onPress={() => {
                    // If from Add modal, update form
                    if (!selectedOrderIdForType) {
                      setForm({ ...form, type: type as ChangeOrder['type'] });
                    } else {
                      // If from card dropdown, update the order
                      handleChangeOrderTypeChange(selectedOrderIdForType, type as ChangeOrder['type']);
                      setSelectedOrderIdForType(null);
                    }
                    setShowTypeDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownModalItemText}>
                    {TYPE_CONFIG[type as keyof typeof TYPE_CONFIG].emoji} {type}
                  </Text>
                  {(!selectedOrderIdForType && form.type === type) && (
                    <Ionicons name="checkmark" size={24} color="#4F46E5" />
                  )}
                  {selectedOrderIdForType && 
                    changeOrders.find(o => o.id === selectedOrderIdForType)?.type === type && (
                    <Ionicons name="checkmark" size={24} color="#4F46E5" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Payment Status Dropdown Modal */}
      <Modal
        visible={showPaymentStatusDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowPaymentStatusDropdown(false);
          setSelectedOrderIdForPaymentStatus(null);
        }}
      >
        <TouchableOpacity
          style={styles.overlayDropdown}
          activeOpacity={1}
          onPress={() => {
            setShowPaymentStatusDropdown(false);
            setSelectedOrderIdForPaymentStatus(null);
          }}
        >
          <View style={styles.dropdownModalContent}>
            <Text style={styles.dropdownModalTitle}>Select Payment Status</Text>
            <ScrollView style={styles.dropdownModalScroll}>
              {Object.keys(PAYMENT_STATUS_CONFIG).map((status) => {
                const config = PAYMENT_STATUS_CONFIG[status as keyof typeof PAYMENT_STATUS_CONFIG];
                return (
                  <TouchableOpacity
                    key={status}
                    style={styles.dropdownModalItem}
                    onPress={() => {
                      if (selectedOrderIdForPaymentStatus) {
                        const order = changeOrders.find(o => o.id === selectedOrderIdForPaymentStatus);
                        if (order) {
                          handlePaymentStatusSelect(selectedOrderIdForPaymentStatus, order.paymentStatus || 'Unpaid', status);
                        }
                        setSelectedOrderIdForPaymentStatus(null);
                      }
                      setShowPaymentStatusDropdown(false);
                    }}
                  >
                    <View style={styles.paymentStatusItemContent}>
                      <View 
                        style={[
                          styles.paymentStatusCircle,
                          { backgroundColor: config.color }
                        ]}
                      />
                      <Text style={styles.dropdownModalItemText}>{status}</Text>
                    </View>
                    {selectedOrderIdForPaymentStatus && 
                      changeOrders.find(o => o.id === selectedOrderIdForPaymentStatus)?.paymentStatus === status && (
                      <Ionicons name="checkmark" size={24} color="#4F46E5" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Status Change Log Modal */}
      <Modal
        visible={statusLogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusLogVisible(false)}
      >
        <View style={styles.statusModalBackdrop}>
          <View style={styles.statusModalContainer}>
            {/* Header */}
            <View style={styles.statusModalHeader}>
              <Text style={styles.statusModalTitle}>Status Change Log</Text>
              <Text style={styles.statusModalSubtitle}>
                {statusLogData.oldStatus || 'Current'}{' '}
                <Text>→</Text>{' '}
                <Text style={{ fontWeight: '600' }}>
                  {statusLogData.newStatus || 'New'}
                </Text>
              </Text>
            </View>

            {/* Body */}
            <View style={styles.statusModalBody}>
              {/* Date */}
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.statusModalLabel}>Date</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.statusModalDateField}
                >
                  <Text style={styles.statusModalDateText}>
                    {formatDateForDisplay(statusLogData.date)}
                  </Text>
                  <Text style={styles.statusModalCalendarIcon}>📅</Text>
                </TouchableOpacity>
              </View>

              {/* Note */}
              <View>
                <Text style={styles.statusModalLabel}>Note</Text>
                <TextInput
                  value={statusLogData.note}
                  onChangeText={(text) =>
                    setStatusLogData((prev) => ({ ...prev, note: text }))
                  }
                  placeholder="Add a note about this status change..."
                  placeholderTextColor="#9CA3AF"
                  style={styles.statusModalNoteInput}
                  multiline
                />
              </View>
            </View>

            {/* Footer */}
            <View style={styles.statusModalFooter}>
              <TouchableOpacity
                style={styles.statusModalCancelButton}
                onPress={() => setStatusLogVisible(false)}
              >
                <Text style={styles.statusModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statusModalSaveButton}
                onPress={handleSaveStatusLog}
              >
                <Text style={styles.statusModalSaveText}>Save Log</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Status Change Log Modal */}
      <Modal
        visible={paymentStatusLogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPaymentStatusLogVisible(false)}
      >
        <View style={styles.statusModalBackdrop}>
          <View style={styles.statusModalContainer}>
            {/* Header */}
            <View style={styles.statusModalHeader}>
              <Text style={styles.statusModalTitle}>Payment Status Change Log</Text>
              <Text style={styles.statusModalSubtitle}>
                {paymentStatusLogData.oldStatus || 'Current'}{' '}
                <Text>→</Text>{' '}
                <Text style={{ fontWeight: '600' }}>
                  {paymentStatusLogData.newStatus || 'New'}
                </Text>
              </Text>
            </View>

            {/* Body */}
            <View style={styles.statusModalBody}>
              {/* Date */}
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.statusModalLabel}>Date</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.statusModalDateField}
                  onPress={() => setShowPaymentLogDatePicker(true)}
                >
                  <Text style={styles.statusModalDateText}>
                    {formatDateForDisplay(paymentStatusLogData.date)}
                  </Text>
                  <Text style={styles.statusModalCalendarIcon}>📅</Text>
                </TouchableOpacity>
              </View>

              {showPaymentLogDatePicker && (
                <DateTimePicker
                  value={selectedPaymentLogDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    if (Platform.OS === 'android') {
                      setShowPaymentLogDatePicker(false);
                    }
                    if (date) {
                      setSelectedPaymentLogDate(date);
                      const formattedDate = date.toISOString().split('T')[0];
                      setPaymentStatusLogData((prev) => ({ ...prev, date: formattedDate }));
                    }
                  }}
                />
              )}

              {/* Paid Amount */}
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.statusModalLabel}>Paid Amount ($)</Text>
                <TextInput
                  value={paymentStatusLogData.paidAmount}
                  onChangeText={(text) =>
                    setPaymentStatusLogData((prev) => ({ ...prev, paidAmount: text }))
                  }
                  placeholder="Enter amount paid"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  style={styles.statusModalDateField}
                />
              </View>

              {/* Note */}
              <View>
                <Text style={styles.statusModalLabel}>Note</Text>
                <TextInput
                  value={paymentStatusLogData.note}
                  onChangeText={(text) =>
                    setPaymentStatusLogData((prev) => ({ ...prev, note: text }))
                  }
                  placeholder="Add a note about this payment status change..."
                  placeholderTextColor="#9CA3AF"
                  style={styles.statusModalNoteInput}
                  multiline
                />
              </View>
            </View>

            {/* Footer */}
            <View style={styles.statusModalFooter}>
              <TouchableOpacity
                style={styles.statusModalCancelButton}
                onPress={() => setPaymentStatusLogVisible(false)}
              >
                <Text style={styles.statusModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statusModalSaveButton}
                onPress={handleSavePaymentStatusLog}
              >
                <Text style={styles.statusModalSaveText}>Save Log</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* View/Edit Modal - Centered Popup */}
      <Modal
        visible={viewModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setViewModalVisible(false);
          setIsEditing(false);
        }}
      >
        <View style={styles.viewModalBackdrop}>
          <TouchableOpacity
            style={styles.viewModalBackdropTouchable}
            activeOpacity={1}
            onPress={() => {
              setViewModalVisible(false);
              setIsEditing(false);
            }}
          />
          <View style={styles.viewModalContainer}>
              {/* Blue Gradient Header */}
              <LinearGradient
                colors={['#4F46E5', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.viewModalHeader}
              >
                <Text style={styles.viewModalTitle}>
                  {isEditing ? 'Edit Details' : 'View Details'}
                </Text>
                <View style={styles.viewModalHeaderRight}>
                  {!isEditing && (
                    <>
                      <TouchableOpacity 
                        onPress={() => setIsEditing(true)}
                        style={styles.viewModalHeaderIcon}
                      >
                        <Ionicons name="pencil" size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={handleDelete}
                        style={styles.viewModalHeaderIcon}
                      >
                        <Ionicons name="trash" size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                    </>
                  )}
                  <TouchableOpacity 
                    onPress={() => {
                      setViewModalVisible(false);
                      setIsEditing(false);
                    }}
                    style={styles.viewModalHeaderIcon}
                  >
                    <Ionicons name="close" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>

          <ScrollView 
            style={styles.viewModalBody} 
            contentContainerStyle={styles.viewModalBodyContent}
            showsVerticalScrollIndicator={true}
          >
            {isEditing ? (
              <>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={form.title}
                  onChangeText={(text) => setForm({ ...form, title: text })}
                />

                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={form.description}
                  onChangeText={(text) => setForm({ ...form, description: text })}
                  multiline
                  numberOfLines={4}
                />

                <Text style={styles.label}>Amount ($)</Text>
                <TextInput
                  style={styles.input}
                  value={form.amount}
                  onChangeText={(text) => setForm({ ...form, amount: text })}
                  keyboardType="numeric"
                />

                <Text style={styles.label}>Date *</Text>
                <TextInput
                  style={styles.input}
                  value={form.date}
                  onChangeText={(text) => setForm({ ...form, date: text })}
                />

                <Text style={styles.label}>Requested By *</Text>
                <TextInput
                  style={styles.input}
                  value={form.requestedBy}
                  onChangeText={(text) => setForm({ ...form, requestedBy: text })}
                />
              </>
            ) : (
              selectedOrder && (
                <>
                  {/* Title Section */}
                  <View style={styles.viewSection}>
                    <Text style={styles.viewSectionLabel}>Title</Text>
                    <Text style={styles.viewSectionValue}>{selectedOrder.title}</Text>
                  </View>

                  {/* Description Section */}
                  {selectedOrder.description && (
                    <View style={styles.viewSection}>
                      <Text style={styles.viewSectionLabel}>Description</Text>
                      <Text style={styles.viewSectionValue}>{selectedOrder.description}</Text>
                    </View>
                  )}

                  {/* Amount Section */}
                  <View style={styles.viewSection}>
                    <Text style={styles.viewSectionLabel}>Amount</Text>
                    <Text style={[
                      styles.viewAmountValue,
                      { color: selectedOrder.amount >= 0 ? '#6366F1' : '#EF4444' }
                    ]}>
                      {selectedOrder.amount >= 0 ? '+' : ''}${Math.abs(selectedOrder.amount).toLocaleString()}
                    </Text>
                  </View>

                  {/* Date Section */}
                  <View style={styles.viewSection}>
                    <Text style={styles.viewSectionLabel}>Date</Text>
                    <Text style={styles.viewSectionValue}>
                      {formatDate(selectedOrder.date)}
                    </Text>
                  </View>

                  {/* Status Section */}
                  <View style={styles.viewSection}>
                    <Text style={styles.viewSectionLabel}>Status</Text>
                    <View style={styles.viewStatusContainer}>
                      <LinearGradient
                        colors={STATUS_CONFIG[selectedOrder.status as keyof typeof STATUS_CONFIG].gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.viewStatusCircle}
                      />
                      <Text style={styles.viewSectionValue}>{selectedOrder.status}</Text>
                    </View>
                  </View>

                  {/* Type Section */}
                  <View style={styles.viewSection}>
                    <Text style={styles.viewSectionLabel}>Type</Text>
                    <Text style={styles.viewSectionValue}>
                      {TYPE_CONFIG[selectedOrder.type as keyof typeof TYPE_CONFIG].emoji} {selectedOrder.type}
                    </Text>
                  </View>

                  {/* Requested By Section */}
                  <View style={styles.viewSection}>
                    <Text style={styles.viewSectionLabel}>Requested By</Text>
                    <Text style={styles.viewSectionValue}>{selectedOrder.requestedBy}</Text>
                  </View>

                  {/* Attached File Section */}
                  {selectedOrder.fileName && selectedOrder.fileData && (
                    <View style={styles.viewSection}>
                      <Text style={styles.viewSectionLabel}>Attached File</Text>
                      <TouchableOpacity
                        style={styles.fileViewButton}
                        onPress={async () => {
                          try {
                            // Open file in browser or viewer
                            if (Platform.OS === 'web') {
                              window.open(selectedOrder.fileData!, '_blank');
                            } else {
                              // For mobile, save to temp file first then open
                              const base64Data = selectedOrder.fileData!.split(',')[1] || selectedOrder.fileData!;
                              const fileExtension = selectedOrder.fileName!.split('.').pop()?.toLowerCase() || 'pdf';
                              const fileName = selectedOrder.fileName || `file.${fileExtension}`;
                              const fileUri = FileSystem.documentDirectory + fileName;
                              
                              // Write base64 data to file
                              await FileSystem.writeAsStringAsync(fileUri, base64Data, {
                                encoding: 'base64',
                              });
                              
                              // Check if sharing is available, otherwise just alert success
                              const canShare = await Sharing.isAvailableAsync();
                              if (canShare) {
                                await Sharing.shareAsync(fileUri, {
                                  mimeType: fileExtension === 'pdf' ? 'application/pdf' : 'image/png',
                                  dialogTitle: 'View File',
                                  UTI: fileExtension === 'pdf' ? 'com.adobe.pdf' : 'public.png',
                                });
                              } else {
                                Alert.alert('File Saved', `File saved to: ${fileUri}`);
                              }
                            }
                          } catch (error) {
                            console.error('File open error:', error);
                            Alert.alert('Error', 'Unable to open file. Please try again.');
                          }
                        }}
                      >
                        <View style={styles.fileViewContent}>
                          <Ionicons 
                            name={selectedOrder.fileName.toLowerCase().endsWith('.pdf') ? 'document-text' : 'image'} 
                            size={24} 
                            color="#4F46E5" 
                          />
                          <View style={styles.fileViewInfo}>
                            <Text style={styles.fileViewName} numberOfLines={1}>
                              {selectedOrder.fileName}
                            </Text>
                            <Text style={styles.fileViewHint}>Tap to view</Text>
                          </View>
                          <Ionicons name="eye-outline" size={20} color="#64748B" />
                        </View>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Status History Section */}
                  {selectedOrder.statusLogs && selectedOrder.statusLogs.length > 0 && (
                    <View style={styles.viewHistorySection}>
                      <Text style={styles.viewHistoryTitle}>Status History</Text>
                      {selectedOrder.statusLogs.map((log) => (
                        <View key={log.id} style={styles.viewHistoryCard}>
                          <View style={styles.viewHistoryHeader}>
                            <Text style={styles.viewHistoryTransition}>
                              {log.oldStatus} → <Text style={styles.viewHistoryNewStatus}>{log.newStatus}</Text>
                            </Text>
                            <Text style={styles.viewHistoryDate}>
                              {new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Text>
                          </View>
                          {log.note && (
                            <Text style={styles.viewHistoryNote}>{log.note}</Text>
                          )}
                          <Text style={styles.viewHistoryBy}>by {log.changedBy}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Payment Status History Section */}
                  {selectedOrder.paymentStatusLogs && selectedOrder.paymentStatusLogs.length > 0 && (
                    <View style={styles.viewHistorySection}>
                      <Text style={styles.viewHistoryTitle}>Payment Status History</Text>
                      {selectedOrder.paymentStatusLogs.map((log) => (
                        <View key={log.id} style={styles.viewHistoryCard}>
                          <View style={styles.viewHistoryHeader}>
                            <Text style={styles.viewHistoryTransition}>
                              {log.oldStatus} → <Text style={styles.viewHistoryNewStatus}>{log.newStatus}</Text>
                            </Text>
                            <Text style={styles.viewHistoryDate}>
                              {new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Text>
                          </View>
                          {log.note && (
                            <Text style={styles.viewHistoryNote}>{log.note}</Text>
                          )}
                          <Text style={styles.viewHistoryBy}>by {log.changedBy}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={{ height: 40 }} />
                </>
              )
            )}
          </ScrollView>

          {isEditing && (
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setIsEditing(false)}
              >
                <Text style={styles.buttonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.buttonPrimaryText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteConfirmVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View style={styles.deleteModalBackdrop}>
          <View style={styles.deleteModalContainer}>
            {/* Warning Icon */}
            <View style={styles.deleteIconContainer}>
              <Ionicons name="warning" size={48} color="#EF4444" />
            </View>

            {/* Title */}
            <Text style={styles.deleteModalTitle}>
              Delete {selectedOrder?.type === 'Invoice' ? 'Invoice' : 'Change Order'}?
            </Text>

            {/* Warning Messages */}
            <View style={styles.deleteWarningContainer}>
              <View style={styles.deleteWarningRow}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Text style={styles.deleteWarningText}>
                  This {selectedOrder?.type === 'Invoice' ? 'invoice' : 'change order'} will be permanently deleted
                </Text>
              </View>
              
              <View style={styles.deleteWarningRow}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Text style={styles.deleteWarningText}>
                  There is no backup or recovery option
                </Text>
              </View>
              
              <View style={styles.deleteWarningRow}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Text style={styles.deleteWarningText}>
                  All associated data will be lost forever
                </Text>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteCancelButton}
                onPress={() => setDeleteConfirmVisible(false)}
              >
                <Text style={styles.deleteCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.deleteConfirmButton}
                onPress={confirmDelete}
              >
                <Text style={styles.deleteConfirmButtonText}>
                  Permanently Delete {selectedOrder?.type === 'Invoice' ? 'Invoice' : 'Change Order'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  // New card styles matching exact design
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    height: 140,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 70,
  },
  leftColumn: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  description: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  rightColumn: {
    width: 120,
    justifyContent: 'flex-start',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginBottom: 6,
    gap: 4,
  },
  statusPillEmoji: {
    fontSize: 10,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    gap: 4,
  },
  typePillEmoji: {
    fontSize: 10,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  amountRow: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
  },
  amountPositive: {
    color: '#4F46E5',
  },
  amountNegative: {
    color: '#DC2626',
  },
  paymentStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  paymentStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  paymentStatusItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentStatusCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  bottomRight: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    alignItems: 'flex-end',
  },
  date: {
    fontSize: 12,
    color: '#64748B',
  },
  byLine: {
    fontSize: 12,
    color: '#64748B',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4F46E5',
    borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontStyle: 'italic',
  },
  pickerContainer: {
    gap: 8,
  },
  pickerOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  pickerOptionSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    gap: 8,
  },
  fileButtonText: {
    fontSize: 14,
    color: '#4F46E5',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#4F46E5',
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: '#F3F4F6',
  },
  buttonSecondaryText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
    lineHeight: 24,
  },
  fileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileLinkText: {
    fontSize: 14,
    color: '#4F46E5',
    textDecorationLine: 'underline',
  },
  statusHistoryContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  statusHistoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  statusHistoryItem: {
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#D1D5DB',
    marginBottom: 12,
  },
  statusHistoryText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 4,
  },
  statusHistoryDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  statusHistoryBy: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statusHistoryNoteContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statusHistoryNoteLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  statusHistoryNote: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
  },
  // Centered Modal Styles
  centeredModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  centeredModalContainer: {
    width: '100%',
    maxWidth: 350,
    height: '90%',
    maxHeight: 700,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  gradientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  gradientHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactModalBody: {
    flex: 1,
    padding: 16,
  },
  compactField: {
    marginBottom: 12,
  },
  compactLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
  },
  compactInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },
  compactTextArea: {
    minHeight: 75,
    textAlignVertical: 'top',
  },
  compactPicker: {
    gap: 6,
  },
  compactPickerOption: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  compactPickerOptionSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  compactPickerText: {
    fontSize: 14,
    color: '#374151',
  },
  compactPickerTextSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  compactFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    gap: 8,
  },
  compactFileButtonText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '500',
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    gap: 8,
  },
  filePreviewText: {
    flex: 1,
    fontSize: 12,
    color: '#4F46E5',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  compactModalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    gap: 12,
  },
  compactButtonSecondary: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  compactButtonSecondaryText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  compactButtonPrimary: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  compactButtonGradient: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Enhanced field styles
  helperTextSmall: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    fontStyle: 'italic',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  datePickerText: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  dropdownList: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  // Overlay dropdowns
  overlayDropdown: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  dropdownModalContent: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  dropdownModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  dropdownModalScroll: {
    maxHeight: 300,
  },
  dropdownModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownModalItemText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  statusItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statusGradientCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  // Date picker overlay
  datePickerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  // Smart formatting styles
  formatToolbar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formatButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
  },
  formatButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  formatHelperText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    fontStyle: 'italic',
  },
  markdownLine: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  // Status Change Log Modal styles
  statusModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  statusModalContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
  },
  statusModalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#4F46E5',
  },
  statusModalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  statusModalSubtitle: {
    color: '#E0E7FF',
    fontSize: 12,
    marginTop: 4,
  },
  statusModalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statusModalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  statusModalDateField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statusModalDateText: {
    fontSize: 14,
    color: '#0F172A',
  },
  statusModalCalendarIcon: {
    fontSize: 16,
    color: '#64748B',
  },
  statusModalNoteInput: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    textAlignVertical: 'top',
  },
  statusModalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  statusModalCancelButton: {
    flex: 1,
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statusModalCancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  statusModalSaveButton: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statusModalSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // View Modal styles - Centered Popup
  viewModalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 30,
  },
  viewModalBackdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  viewModalContainer: {
    width: '100%',
    maxWidth: 380,
    flex: 1,
    maxHeight: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  viewModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    flexShrink: 0,
  },
  viewModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewModalHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewModalHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewModalBody: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  viewModalBodyContent: {
    padding: 20,
    paddingBottom: 40,
  },
  viewSection: {
    marginBottom: 20,
  },
  viewSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewSectionValue: {
    fontSize: 16,
    color: '#0F172A',
    lineHeight: 24,
  },
  viewAmountValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  viewStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  viewStatusCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  viewHistorySection: {
    marginTop: 12,
  },
  viewHistoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  viewHistoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  viewHistoryTransition: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  viewHistoryNewStatus: {
    fontWeight: '600',
    color: '#0F172A',
  },
  viewHistoryDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  viewHistoryNote: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  viewHistoryBy: {
    fontSize: 12,
    color: '#64748B',
  },
  
  // Delete Confirmation Modal Styles
  deleteModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  deleteIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 20,
  },
  deleteWarningContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteWarningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  deleteWarningText: {
    fontSize: 14,
    color: '#DC2626',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  deleteModalButtons: {
    flexDirection: 'column',
    gap: 12,
  },
  deleteCancelButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deleteCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  deleteConfirmButton: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  deleteConfirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fileViewButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  fileViewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileViewInfo: {
    flex: 1,
  },
  fileViewName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  fileViewHint: {
    fontSize: 13,
    color: '#64748B',
  },
});
