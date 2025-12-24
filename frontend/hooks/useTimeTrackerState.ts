import { useState, useMemo, useCallback } from 'react';
import { Alert, Platform } from 'react-native';

// Helper functions
const formatDisplayDate = (date: Date) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

const formatDisplayTime = (date: Date) => {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

const formatShortDate = (date: Date) => {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}/${day}`;
};

// Get Monday of a given week
const getMondayOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Mock weekly hours data generator
const getWeeklyHoursData = (weekStart: Date): number[] => {
  const weekKey = weekStart.toISOString().split('T')[0];
  const mockData: { [key: string]: number[] } = {
    '2024-12-16': [0, 8, 7.5, 8, 8, 6.5, 0],
    '2024-12-09': [0, 7, 8, 8, 7.5, 8, 0],
    '2024-12-02': [0, 8, 8, 6, 8, 8, 0],
    '2024-11-25': [0, 6, 7, 8, 8, 7, 0],
  };
  if (mockData[weekKey]) {
    return mockData[weekKey];
  }
  const seed = weekStart.getTime();
  return [0, 7 + (seed % 2), 7.5 + ((seed >> 1) % 1.5), 8, 7 + ((seed >> 2) % 2), 6.5 + ((seed >> 3) % 2), 0];
};

export interface LocationInfo {
  name: string;
  street: string;
  city: string;
}

export interface UseTimeTrackerStateReturn {
  // Clock state
  isClockedIn: boolean;
  clockInTime: Date;
  lastClockOutTime: Date | null;
  currentLocation: LocationInfo | null;
  isOnBreak: boolean;
  
  // Weekly data
  selectedWeekStart: Date;
  weeklyHours: number[];
  totalWeeklyHours: number;
  totalWeeklyPay: number;
  hourlyRate: number;
  weeklyProgressPercent: number;
  
  // Modal visibility
  showAlertModal: boolean;
  alertTitle: string;
  alertMessage: string;
  showGrossPayInfo: boolean;
  showWeekCalendar: boolean;
  showClockOutOptionsModal: boolean;
  
  // Actions
  handleClockInPress: () => void;
  handleClockOutPress: () => void;
  handleDirectClockOut: () => void;
  handleClockOutWithNotes: () => void;
  handleWeekSelect: (date: Date) => void;
  handleBreakToggle: () => void;
  setCurrentLocation: (location: LocationInfo | null) => void;
  setIsClockedIn: (value: boolean) => void;
  setClockInTime: (date: Date) => void;
  
  // Modal controls
  showCustomAlert: (title: string, message: string) => void;
  closeAlertModal: () => void;
  setShowGrossPayInfo: (value: boolean) => void;
  setShowWeekCalendar: (value: boolean) => void;
  setShowClockOutOptionsModal: (value: boolean) => void;
  
  // Flags for notes flow
  isClockOutWithNotes: boolean;
  setIsClockOutWithNotes: (value: boolean) => void;
}

export default function useTimeTrackerState(): UseTimeTrackerStateReturn {
  // Clock In/Out state
  const [isClockedIn, setIsClockedIn] = useState(true);
  const [clockInTime, setClockInTime] = useState<Date>(new Date());
  const [lastClockOutTime, setLastClockOutTime] = useState<Date | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationInfo | null>({
    name: 'Andrew Martinez',
    street: '1234 Cherry Creek Dr',
    city: 'Denver, CO 80223'
  });
  const [isOnBreak, setIsOnBreak] = useState(false);
  
  // Weekly Timesheet state
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => getMondayOfWeek(new Date()));
  const [weeklyHours, setWeeklyHours] = useState<number[]>(() => getWeeklyHoursData(getMondayOfWeek(new Date())));
  const hourlyRate = 20;
  
  // Calculate totals
  const totalWeeklyHours = useMemo(() => weeklyHours.reduce((sum, h) => sum + h, 0), [weeklyHours]);
  const totalWeeklyPay = useMemo(() => totalWeeklyHours * hourlyRate, [totalWeeklyHours, hourlyRate]);
  const weeklyProgressPercent = useMemo(() => Math.min((totalWeeklyHours / 40) * 100, 100), [totalWeeklyHours]);
  
  // Alert Modal state
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  
  // Other modals
  const [showGrossPayInfo, setShowGrossPayInfo] = useState(false);
  const [showWeekCalendar, setShowWeekCalendar] = useState(false);
  const [showClockOutOptionsModal, setShowClockOutOptionsModal] = useState(false);
  
  // Clock out with notes flag
  const [isClockOutWithNotes, setIsClockOutWithNotes] = useState(false);
  
  // Custom alert handler
  const showCustomAlert = useCallback((title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setShowAlertModal(true);
  }, []);
  
  const closeAlertModal = useCallback(() => setShowAlertModal(false), []);
  
  // Clock In button handler
  const handleClockInPress = useCallback(() => {
    if (isClockedIn && currentLocation) {
      const clockInDateStr = formatShortDate(clockInTime);
      const clockInTimeStr = formatDisplayTime(clockInTime);
      showCustomAlert(
        'Already Clocked In',
        `You are already clocked in at ${currentLocation.name}, ${currentLocation.street}, ${currentLocation.city} since ${clockInTimeStr} ${clockInDateStr}`
      );
    }
    // If not clocked in, the parent component should handle showing the location picker
  }, [isClockedIn, currentLocation, clockInTime, showCustomAlert]);
  
  // Clock Out button handler
  const handleClockOutPress = useCallback(() => {
    if (!isClockedIn) {
      if (lastClockOutTime) {
        const clockOutDateStr = formatShortDate(lastClockOutTime);
        const clockOutTimeStr = formatDisplayTime(lastClockOutTime);
        showCustomAlert(
          'Already Clocked Out',
          `You are already Clocked out since ${clockOutTimeStr} ${clockOutDateStr}`
        );
      } else {
        showCustomAlert('Already Clocked Out', 'You are not currently clocked in.');
      }
    } else {
      setShowClockOutOptionsModal(true);
    }
  }, [isClockedIn, lastClockOutTime, showCustomAlert]);
  
  // Direct clock out
  const handleDirectClockOut = useCallback(() => {
    setShowClockOutOptionsModal(false);
    setIsClockedIn(false);
    setLastClockOutTime(new Date());
    if (Platform.OS === 'web') {
      showCustomAlert('Clocked Out', 'You have successfully clocked out.');
    } else {
      Alert.alert('Clocked Out', 'You have successfully clocked out.');
    }
  }, [showCustomAlert]);
  
  // Clock out with notes
  const handleClockOutWithNotes = useCallback(() => {
    setShowClockOutOptionsModal(false);
    setIsClockOutWithNotes(true);
  }, []);
  
  // Week selection handler
  const handleWeekSelect = useCallback((date: Date) => {
    const monday = getMondayOfWeek(date);
    setSelectedWeekStart(monday);
    setWeeklyHours(getWeeklyHoursData(monday));
    setShowWeekCalendar(false);
  }, []);
  
  // Break toggle
  const handleBreakToggle = useCallback(() => {
    setIsOnBreak(prev => !prev);
  }, []);
  
  return {
    // Clock state
    isClockedIn,
    clockInTime,
    lastClockOutTime,
    currentLocation,
    isOnBreak,
    
    // Weekly data
    selectedWeekStart,
    weeklyHours,
    totalWeeklyHours,
    totalWeeklyPay,
    hourlyRate,
    weeklyProgressPercent,
    
    // Modal visibility
    showAlertModal,
    alertTitle,
    alertMessage,
    showGrossPayInfo,
    showWeekCalendar,
    showClockOutOptionsModal,
    
    // Actions
    handleClockInPress,
    handleClockOutPress,
    handleDirectClockOut,
    handleClockOutWithNotes,
    handleWeekSelect,
    handleBreakToggle,
    setCurrentLocation,
    setIsClockedIn,
    setClockInTime,
    
    // Modal controls
    showCustomAlert,
    closeAlertModal,
    setShowGrossPayInfo,
    setShowWeekCalendar,
    setShowClockOutOptionsModal,
    
    // Flags
    isClockOutWithNotes,
    setIsClockOutWithNotes,
  };
}

// Export helpers for use elsewhere
export { formatDisplayDate, formatDisplayTime, formatShortDate, getMondayOfWeek };
