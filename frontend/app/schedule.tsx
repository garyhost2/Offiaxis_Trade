import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Animated, PanResponder, Platform, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { getAllProjects } from '../utils/projectsData';

// Convert project to calendar event
const convertProjectToEvent = (project: any) => {
  // Map status to dates
  let startDateStr = '';
  let endDateStr = '';
  
  switch (project.status) {
    case 'Rough-In':
      startDateStr = project.roughInStart;
      endDateStr = project.roughInEnd || startDateStr;
      break;
    case 'Inspection':
      startDateStr = project.inspectionDate;
      endDateStr = startDateStr;
      break;
    case 'Final Trim':
      startDateStr = project.finalTrimStart;
      endDateStr = project.finalTrimEnd || startDateStr;
      break;
    case 'Completed':
    case 'Service Call':
      startDateStr = project.completedDate;
      endDateStr = startDateStr;
      break;
    default:
      return null; // No dates
  }
  
  if (!startDateStr) return null;
  
  // Parse dates
  const startDate = new Date(startDateStr + 'T09:00:00');
  const endDate = new Date(endDateStr + 'T16:30:00');
  
  // Map status to color
  const colorMap: Record<string, string> = {
    'Rough-In': 'lightblue',
    'Inspection': 'purple',
    'Final Trim': 'green',
    'Completed': 'lightgray',
    'Service Call': 'red',
  };
  
  // Format location
  const location = project.street && project.city 
    ? `${project.street}\n${project.city}`
    : project.street || project.city || '';
  
  return {
    id: `project-${project.id}`,
    title: project.name,
    start: startDate,
    end: endDate,
    color: colorMap[project.status] || 'lightblue',
    location: location,
    assignedTeam: project.assignedEmployee || '',
    alerts: project.alerts || [],
    notes: project.notes || '',
    status: project.status,
  };
};

export default function SchedulePage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedDay, setExpandedDay] = useState<Date | null>(null);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [monthExpanded, setMonthExpanded] = useState(true); // true = full view, false = compact view
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  
  // Delete confirmation state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  
  // Add Event Modal State
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [newEventStatusBadge, setNewEventStatusBadge] = useState('');
  const [assignedTeamMembers, setAssignedTeamMembers] = useState<string[]>([]);
  const [showAssignedDropdown, setShowAssignedDropdown] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventColor, setNewEventColor] = useState('lightblue');
  const [newEventFromDate, setNewEventFromDate] = useState(new Date());
  const [newEventToDate, setNewEventToDate] = useState(new Date());
  const [newEventFromTime, setNewEventFromTime] = useState('08:00 AM');
  const [newEventToTime, setNewEventToTime] = useState('04:30 PM');
  const [newEventStreet, setNewEventStreet] = useState('');
  const [newEventCity, setNewEventCity] = useState('');
  const [newEventState, setNewEventState] = useState('CO');
  const [newEventZip, setNewEventZip] = useState('');
  const [newEventAlerts, setNewEventAlerts] = useState<string[]>(['10 min before', '1 day before']);
  const [newEventNotes, setNewEventNotes] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEventCalendar, setShowEventCalendar] = useState(false);
  const [activeEventDateField, setActiveEventDateField] = useState(null); // 'from' or 'to'
  
  // Get all projects for the selector
  const allProjects = getAllProjects();
  
  // Team members list
  const teamMembers = ['Azis K', 'Oumayama M', 'Sarah Williams', 'Emely Davis'];
  
  // Handle Delete Event
  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    
    // Remove from manualEvents array
    const updatedManualEvents = manualEvents.filter(e => e.id !== selectedEvent.id);
    setManualEvents(updatedManualEvents);
    
    // Remove from events array
    const updatedEvents = events.filter(e => e.id !== selectedEvent.id);
    setEvents(updatedEvents);
    
    // Close both modals
    setShowDeleteConfirmation(false);
    setShowEventDetailModal(false);
    setSelectedEvent(null);
  };
  
  // Handle Edit Event - populate form with existing event data
  const handleEditEvent = (event: any) => {
    setIsEditMode(true);
    setEditingEventId(event.id);
    
    // Populate all form fields with event data
    setNewEventTitle(event.title || '');
    setNewEventColor(event.color || 'lightblue');
    setNewEventFromDate(new Date(event.start));
    setNewEventToDate(new Date(event.end));
    
    // Format times
    const fromTime = new Date(event.start).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    const toTime = new Date(event.end).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    setNewEventFromTime(fromTime);
    setNewEventToTime(toTime);
    
    // Parse location into separate fields
    if (event.location) {
      const parts = event.location.split(',').map((s: string) => s.trim());
      if (parts.length >= 1) {
        setNewEventStreet(parts[0] || '');
      }
      if (parts.length >= 2) {
        setNewEventCity(parts[1] || '');
      }
      if (parts.length >= 3) {
        const stateZip = parts[2].trim().split(' ');
        setNewEventState(stateZip[0] || 'CO');
        setNewEventZip(stateZip[1] || '');
      }
    }
    
    // Set team members (convert comma-separated string to array)
    if (event.assignedTeam) {
      const teamArray = event.assignedTeam.split(',').map((s: string) => s.trim());
      setAssignedTeamMembers(teamArray);
    } else {
      setAssignedTeamMembers([]);
    }
    
    // Set other fields
    setNewEventStatusBadge(event.status || '');
    setNewEventAlerts(event.alerts || ['10 min before', '1 day before']);
    setNewEventNotes(event.notes || '');
    
    // Close event detail modal and open edit modal
    setShowEventDetailModal(false);
    setShowAddEventModal(true);
  };
  
  // Auto-fill form when project is selected
  const handleProjectSelect = (project: any) => {
    setSelectedProject(project);
    setNewEventTitle(project.name);
    setNewEventStatusBadge(project.status); // Auto-fill status badge
    // Parse address into separate fields
    setNewEventStreet(project.street);
    // Parse city string: "Denver, CO 80223" -> city, state, zip
    const cityParts = project.city.split(',');
    const city = cityParts[0]?.trim() || '';
    const stateZip = cityParts[1]?.trim().split(' ') || [];
    const state = stateZip[0] || 'CO';
    const zip = stateZip[1] || '';
    setNewEventCity(city);
    setNewEventState(state);
    setNewEventZip(zip);
    setNewEventNotes(project.status); // Status like "Rough-In", "Final Trim"
    setNewEventAlerts(['10 min before', '1 day before']); // Default alerts
    
    // Set color based on project status - MUST match convertProjectToEvent colorMap
    const statusColorMap: { [key: string]: string } = {
      'Rough-In': 'lightblue',
      'Inspection': 'purple',
      'Final Trim': 'green',
      'Completed': 'lightgray',
      'To be scheduled': 'lightblue',
      'Service Call': 'red',
    };
    setNewEventColor(statusColorMap[project.status] || 'lightblue');
    
    setShowProjectSelector(false);
  };
  
  // Time Picker State
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingTimeField, setEditingTimeField] = useState<'from' | 'to' | null>(null);
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState('AM');

  // User info - currently logged in admin
  const userInfo = {
    name: "Yefry Soto",
    role: "Admin"
  };

  // Animation for month expansion/collapse
  const monthHeightAnim = React.useRef(new Animated.Value(1)).current; // 1 = expanded, 0 = collapsed

  // Pan responder for swipe gestures
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Allow both vertical and horizontal gestures
      return Math.abs(gestureState.dy) > 10 || Math.abs(gestureState.dx) > 10;
    },
    onPanResponderRelease: (_, gestureState) => {
      const isVerticalSwipe = Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      
      if (isVerticalSwipe) {
        // Vertical swipe - expand/collapse
        if (gestureState.dy < -50) {
          // Swiped UP - collapse
          collapseMonth();
        } else if (gestureState.dy > 50) {
          // Swiped DOWN - expand
          expandMonth();
        }
      } else {
        // Horizontal swipe - change month
        if (gestureState.dx < -50) {
          // Swiped LEFT - next month
          changeDate(1);
        } else if (gestureState.dx > 50) {
          // Swiped RIGHT - previous month
          changeDate(-1);
        }
      }
    },
  });

  const expandMonth = () => {
    setMonthExpanded(true);
    Animated.spring(monthHeightAnim, {
      toValue: 1,
      useNativeDriver: false,
      friction: 8,
    }).start();
  };

  const collapseMonth = () => {
    setMonthExpanded(false);
    Animated.spring(monthHeightAnim, {
      toValue: 0,
      useNativeDriver: false,
      friction: 8,
    }).start();
  };

  // Store manual events separately so they persist
  const [manualEvents, setManualEvents] = useState([
    {
      id: 'manual-1',
      title: "Team Meeting",
      start: new Date(2025, 10, 22, 10, 0),
      end: new Date(2025, 10, 22, 11, 0),
      location: "Office",
      color: "violet"
    }
  ]);

  // Load events directly from projects data and merge with manual events
  const loadEventsFromProjects = () => {
    const projects = getAllProjects();
    const projectEvents = projects
      .map(convertProjectToEvent)
      .filter(e => e !== null);
    
    return [...projectEvents, ...manualEvents];
  };
  
  const [events, setEvents] = useState(loadEventsFromProjects());
  
  // Reload events when component focuses (after returning from Projects page)
  useEffect(() => {
    const interval = setInterval(() => {
      setEvents(loadEventsFromProjects());
    }, 2000); // Refresh every 2 seconds
    
    return () => clearInterval(interval);
  }, [manualEvents]); // Re-run when manual events change

  const getColorStyles = (color: string) => {
    const colors: any = {
      lightblue: { bg: '#DBEAFE', border: '#BFDBFE', text: '#3B82F6' },
      red: { bg: '#FEE2E2', border: '#FECACA', text: '#EF4444' },
      purple: { bg: '#F3E8FF', border: '#E9D5FF', text: '#A855F7' },
      green: { bg: '#D1FAE5', border: '#A7F3D0', text: '#10B981' },
      darkorange: { bg: '#FFEDD5', border: '#FED7AA', text: '#EA580C' },
      lightgray: { bg: '#F1F5F9', border: '#E2E8F0', text: '#64748B' },
      // Extended palette colors
      indigo: { bg: '#E0E7FF', border: '#C7D2FE', text: '#4338CA' },
      emerald: { bg: '#D1FAE5', border: '#A7F3D0', text: '#059669' },
      violet: { bg: '#EDE9FE', border: '#DDD6FE', text: '#7C3AED' },
      rose: { bg: '#FFE4E6', border: '#FECDD3', text: '#E11D48' },
      blue: { bg: '#DBEAFE', border: '#BFDBFE', text: '#1D4ED8' },
      amber: { bg: '#FEF3C7', border: '#FDE68A', text: '#F59E0B' },
      orange: { bg: '#FFEDD5', border: '#FED7AA', text: '#F97316' },
      pink: { bg: '#FCE7F3', border: '#FBCFE8', text: '#EC4899' },
      cyan: { bg: '#CFFAFE', border: '#A5F3FC', text: '#06B6D4' },
      teal: { bg: '#CCFBF1', border: '#99F6E4', text: '#14B8A6' },
    };
    return colors[color] || colors.lightblue;
  };

  const changeDate = (direction: number) => {
    const newDate = new Date(selectedDate);
    if (activeView === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else if (activeView === 'day') {
      newDate.setDate(newDate.getDate() + direction);
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setSelectedDate(newDate);
  };

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Time Picker Helper Functions
  const parseTimeString = (timeStr: string) => {
    const [time, period] = timeStr.split(' ');
    const [hour, minute] = time.split(':');
    return { hour, minute, period };
  };

  const openTimePicker = (field: 'from' | 'to') => {
    const timeStr = field === 'from' ? newEventFromTime : newEventToTime;
    const { hour, minute, period } = parseTimeString(timeStr);
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setSelectedPeriod(period);
    setEditingTimeField(field);
    setShowTimePicker(true);
  };

  const saveSelectedTime = (hour?: string, minute?: string, period?: string) => {
    // Use provided values or fall back to state
    const finalHour = hour || selectedHour;
    const finalMinute = minute || selectedMinute;
    const finalPeriod = period || selectedPeriod;
    
    const timeStr = `${finalHour}:${finalMinute} ${finalPeriod}`;
    
    if (editingTimeField === 'from') {
      setNewEventFromTime(timeStr);
      
      // Validate: if new From time is after To time, shift To forward by 1 hour
      const fromMinutes = convertToMinutes(finalHour, finalMinute, finalPeriod);
      const { hour: toHour, minute: toMinute, period: toPeriod } = parseTimeString(newEventToTime);
      const toMinutes = convertToMinutes(toHour, toMinute, toPeriod);
      
      if (fromMinutes >= toMinutes) {
        // Add 1 hour to From time and set as To time
        const newToMinutes = fromMinutes + 60;
        const newTo = convertFromMinutes(newToMinutes);
        setNewEventToTime(newTo);
      }
    } else {
      setNewEventToTime(timeStr);
    }
    
    setShowTimePicker(false);
    setEditingTimeField(null);
  };

  const convertToMinutes = (hour: string, minute: string, period: string) => {
    let h = parseInt(hour);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + parseInt(minute);
  };

  const convertFromMinutes = (minutes: number) => {
    let hour = Math.floor(minutes / 60) % 24;
    const minute = minutes % 60;
    const period = hour >= 12 ? 'PM' : 'AM';
    if (hour === 0) hour = 12;
    if (hour > 12) hour -= 12;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  // Time Picker Modal Component
  const TimePickerModal = React.memo(() => {
    // Local state to prevent parent re-renders
    const [localHour, setLocalHour] = React.useState(selectedHour);
    const [localMinute, setLocalMinute] = React.useState(selectedMinute);
    const [localPeriod, setLocalPeriod] = React.useState(selectedPeriod);

    // Update local state ONLY when modal first opens (not on every state change)
    React.useEffect(() => {
      if (showTimePicker) {
        setLocalHour(selectedHour);
        setLocalMinute(selectedMinute);
        setLocalPeriod(selectedPeriod);
      }
    }, [showTimePicker]); // Only depend on showTimePicker

    const hours = React.useMemo(() => 
      Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')), 
      []
    );
    const minutes = React.useMemo(() => 
      Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')), 
      []
    );
    const periods = React.useMemo(() => ['AM', 'PM'], []);

    const PickerWheel = React.memo(({ items, selected, onSelect }: { 
      items: string[], 
      selected: string, 
      onSelect: (value: string) => void 
    }) => {
      const scrollViewRef = React.useRef<ScrollView>(null);
      const ROW_HEIGHT = 44;

      // Scroll to selected item on mount
      React.useEffect(() => {
        const selectedIndex = items.findIndex(item => item === selected);
        if (selectedIndex !== -1 && scrollViewRef.current) {
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({
              y: selectedIndex * ROW_HEIGHT,
              animated: false
            });
          }, 100);
        }
      }, []);

      // Only update selection when scrolling completely stops
      const handleScrollEnd = (event: any) => {
        const scrollY = event.nativeEvent.contentOffset.y;
        
        // Calculate which item is centered
        const index = Math.round(scrollY / ROW_HEIGHT);
        const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
        
        // Snap to exact center position
        const targetScrollY = clampedIndex * ROW_HEIGHT;
        if (Math.abs(scrollY - targetScrollY) > 1) {
          scrollViewRef.current?.scrollTo({
            y: targetScrollY,
            animated: true
          });
        }
        
        // Update selection only after scroll ends
        if (items[clampedIndex] !== selected) {
          onSelect(items[clampedIndex]);
        }
      };

      return (
        <View style={styles.pickerWheel}>
          <ScrollView 
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            snapToInterval={ROW_HEIGHT}
            decelerationRate="fast"
            contentContainerStyle={{ paddingVertical: 88 }}
            onMomentumScrollEnd={handleScrollEnd}
            onScrollEndDrag={handleScrollEnd}
          >
            {items.map((item, index) => {
              const isCurrentlySelected = selected === item;
              return (
                <TouchableOpacity
                  key={`${item}-${index}`}
                  style={styles.pickerItem}
                  onPress={() => {
                    onSelect(item);
                    scrollViewRef.current?.scrollTo({
                      y: index * ROW_HEIGHT,
                      animated: true
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={
                    isCurrentlySelected 
                      ? styles.pickerItemTextSelected 
                      : styles.pickerItemText
                  }>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      );
    });

    const handleSave = () => {
      // Pass local values directly and don't update parent state
      // (parent state updates cause re-render loops)
      saveSelectedTime(localHour, localMinute, localPeriod);
    };

    const handleCancel = () => {
      setShowTimePicker(false);
      setEditingTimeField(null);
    };

    if (!showTimePicker) return null;

    return (
      <Modal
        visible={showTimePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancel}
      >
        <View style={styles.timePickerOverlay}>
          <View style={styles.timePickerModal}>
            <View style={styles.timePickerHeader}>
              <Text style={styles.timePickerTitle}>
                Select {editingTimeField === 'from' ? 'Start' : 'End'} Time
              </Text>
            </View>

            <View style={styles.timePickerWheelsContainer}>
              {/* Selection Box Highlight */}
              <View style={styles.selectionBox} />
              
              <View style={styles.timePickerWheels}>
                <PickerWheel items={hours} selected={localHour} onSelect={setLocalHour} />
                <Text style={styles.timePickerSeparator}>:</Text>
                <PickerWheel items={minutes} selected={localMinute} onSelect={setLocalMinute} />
                <PickerWheel items={periods} selected={localPeriod} onSelect={setLocalPeriod} />
              </View>
            </View>

            <View style={styles.timePickerActions}>
              <TouchableOpacity
                style={styles.timePickerButtonCancel}
                onPress={handleCancel}
              >
                <Text style={styles.timePickerButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timePickerButtonSave}
                onPress={handleSave}
              >
                <Text style={styles.timePickerButtonSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  });

  // Day View Component
  const DayView = () => {
    const hours = Array.from({ length: 13 }, (_, i) => i + 7);
    
    // Get events that span into this day
    const dayEvents = events.filter(e => {
      const dayTime = new Date(selectedDate).setHours(0, 0, 0, 0);
      const startTime = new Date(e.start).setHours(0, 0, 0, 0);
      const endTime = new Date(e.end).setHours(0, 0, 0, 0);
      return dayTime >= startTime && dayTime <= endTime;
    });

    return (
      <View>
        {hours.map((hour) => {
          const hourEvents = dayEvents.filter(e => e.start.getHours() === hour);
          return (
            <View key={hour} style={styles.dayHourRow}>
              <View style={styles.dayHourLabel}>
                <Text style={styles.dayHourText}>
                  {hour % 12 || 12}{hour >= 12 ? 'pm' : 'am'}
                </Text>
              </View>
              <View style={styles.dayHourContent}>
                {hourEvents.map((event) => {
                  const colors = getColorStyles(event.color);
                  return (
                    <View 
                      key={event.id} 
                      style={[
                        styles.dayEventCard,
                        { backgroundColor: colors.bg, borderColor: colors.border }
                      ]}
                    >
                      <Text style={[styles.dayEventTitle, { color: colors.text }]}>
                        {event.title}
                      </Text>
                      <Text style={styles.dayEventTime}>
                        {event.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - {event.end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </Text>
                      {event.location && (
                        <View style={styles.dayEventLocation}>
                          <Ionicons name="location" size={12} color="#64748B" />
                          <Text style={styles.dayEventLocationText}>{event.location}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // Week View Component
  const WeekView = () => {
    const weekStart = getWeekStart(selectedDate);
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return date;
    });

    const hours = Array.from({ length: 13 }, (_, i) => i + 7);

    const getEventsForDayAndHour = (day: Date, hour: number) => {
      return events.filter(e => {
        const eventHour = e.start.getHours();
        // Check if day falls within event's date range
        const dayTime = new Date(day).setHours(0, 0, 0, 0);
        const startTime = new Date(e.start).setHours(0, 0, 0, 0);
        const endTime = new Date(e.end).setHours(0, 0, 0, 0);
        return (dayTime >= startTime && dayTime <= endTime) && eventHour === hour;
      });
    };

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.weekContainer}>
          {/* Header */}
          <View style={styles.weekHeaderRow}>
            <View style={styles.weekTimeColumn} />
            {days.map((day, i) => (
              <View key={i} style={styles.weekDayHeader}>
                <Text style={styles.weekDayName}>
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
                <Text style={styles.weekDayNumber}>{day.getDate()}</Text>
              </View>
            ))}
          </View>

          {/* Hours Grid */}
          {hours.map((hour) => (
            <View key={hour} style={styles.weekHourRow}>
              <View style={styles.weekTimeColumn}>
                <Text style={styles.weekHourText}>
                  {hour % 12 || 12}{hour >= 12 ? 'pm' : 'am'}
                </Text>
              </View>
              {days.map((day, dayIdx) => {
                const cellEvents = getEventsForDayAndHour(day, hour);
                return (
                  <View key={dayIdx} style={styles.weekDayCell}>
                    {cellEvents.map((event) => {
                      const colors = getColorStyles(event.color);
                      return (
                        <View 
                          key={event.id} 
                          style={[
                            styles.weekEventCard,
                            { backgroundColor: colors.bg, borderColor: colors.border }
                          ]}
                        >
                          <Text 
                            style={[styles.weekEventTitle, { color: colors.text }]}
                            numberOfLines={1}
                          >
                            {event.title}
                          </Text>
                          <Text style={styles.weekEventTime}>
                            {event.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  // Modern Month View Component (Samsung Calendar Style with Swipe Gestures)
  const MonthView = () => {
    const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const firstDay = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
    const lastDay = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const today = new Date();
    const isToday = (date: Date) => 
      date.getDate() === today.getDate() && 
      date.getMonth() === today.getMonth() && 
      date.getFullYear() === today.getFullYear();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(monthStart.getFullYear(), monthStart.getMonth(), i));
    }

    const getEventsForDay = (day: Date | null) => {
      if (!day) return [];
      // Check if day falls within event's date range (start to end)
      return events.filter(e => {
        const dayTime = new Date(day).setHours(0, 0, 0, 0);
        const startTime = new Date(e.start).setHours(0, 0, 0, 0);
        const endTime = new Date(e.end).setHours(0, 0, 0, 0);
        return dayTime >= startTime && dayTime <= endTime;
      });
    };

    const handleDayPress = (day: Date) => {
      setExpandedDay(day);
      const dayEvents = getEventsForDay(day);
      // If no events and in expanded mode, don't show anything yet
      // User can click "+ Add Event" button
    };

    const cellHeight = monthHeightAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [50, 120], // Collapsed: 50px, Expanded: 120px
    });

    return (
      <Animated.View style={styles.modernMonthContainer} {...panResponder.panHandlers}>
        {/* Swipe Indicator */}
        <View style={styles.swipeIndicator}>
          <View style={styles.swipeHandle} />
          <Text style={styles.swipeHint}>
            {monthExpanded ? '↑ Swipe up to collapse' : '↓ Swipe down to expand'}
          </Text>
        </View>

        {/* Day Names Header */}
        <View style={styles.modernMonthHeader}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <View key={i} style={styles.modernDayNameCell}>
              <Text style={[
                styles.modernDayName,
                (i === 0 || i === 6) && styles.modernDayNameWeekend
              ]}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid - Animated between Collapsed and Expanded */}
        <View style={styles.modernMonthGrid}>
          {days.map((day, idx) => {
            const dayEvents = day ? getEventsForDay(day) : [];
            const isTodayDate = day ? isToday(day) : false;
            const isSelected = expandedDay && day && expandedDay.toDateString() === day.toDateString();
            
            return (
              <Animated.View
                key={idx}
                style={[
                  styles.modernDayCell,
                  !day && styles.modernDayCellEmpty,
                  isTodayDate && styles.modernDayCellToday,
                  isSelected && styles.modernDayCellSelected,
                  { height: cellHeight }
                ]}
              >
                <TouchableOpacity
                  onPress={() => day && handleDayPress(day)}
                  disabled={!day}
                  activeOpacity={0.7}
                  style={styles.modernDayCellTouchable}
                >
                  {day && (
                    <View style={styles.modernDayCellContent}>
                      {/* Day Number */}
                      <View style={[
                        styles.modernDayNumberContainer,
                        isTodayDate && styles.modernDayNumberContainerToday,
                        isSelected && styles.modernDayNumberContainerSelected
                      ]}>
                        <Text style={[
                          styles.modernDayNumber,
                          isTodayDate && styles.modernDayNumberToday,
                          isSelected && styles.modernDayNumberSelected,
                          !monthExpanded && styles.modernDayNumberSmall
                        ]}>
                          {day.getDate()}
                        </Text>
                      </View>

                      {/* Collapsed State: Colored bars (Samsung style) */}
                      {!monthExpanded && dayEvents.length > 0 && (
                        <View style={styles.collapsedEventBars}>
                          {dayEvents.slice(0, 3).map((event) => {
                            const colors = getColorStyles(event.color);
                            return (
                              <View
                                key={event.id}
                                style={[
                                  styles.collapsedEventBar,
                                  { backgroundColor: colors.text }
                                ]}
                              />
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <Text style={styles.moreEventsIndicator}>+{dayEvents.length - 3}</Text>
                          )}
                        </View>
                      )}

                      {/* Expanded State: Full event info */}
                      {monthExpanded && dayEvents.length > 0 && (
                        <View style={styles.expandedEventsList}>
                          {dayEvents.slice(0, 2).map((event) => {
                            const colors = getColorStyles(event.color);
                            return (
                              <TouchableOpacity
                                key={event.id}
                                style={[
                                  styles.expandedEventItem,
                                  { backgroundColor: colors.bg, borderLeftColor: colors.text }
                                ]}
                                onPress={() => {
                                  setSelectedEvent(event);
                                  setShowEventDetailModal(true);
                                }}
                              >
                                <Text 
                                  style={[styles.expandedEventItemText, { color: colors.text }]}
                                  numberOfLines={1}
                                >
                                  {event.title}
                                </Text>
                                <Text style={styles.expandedEventItemTime}>
                                  {event.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                          {dayEvents.length > 2 && (
                            <Text style={styles.moreEventsText}>+{dayEvents.length - 2}</Text>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Day Details - Always shown when a date is selected */}
        {expandedDay && (
          <View style={[styles.expandedDaySection, !monthExpanded && styles.expandedDaySectionCollapsed]}>
            <View style={styles.expandedDayHeader}>
              <View>
                <Text style={styles.expandedDayTitle}>
                  {expandedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
                <Text style={styles.expandedDaySubtitle}>
                  {getEventsForDay(expandedDay).length} event{getEventsForDay(expandedDay).length !== 1 ? 's' : ''}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.addEventButton}
                onPress={() => {
                  // Initialize dates to the expanded day
                  const dateToUse = expandedDay || selectedDate;
                  setNewEventFromDate(dateToUse);
                  setNewEventToDate(dateToUse);
                  setShowAddEventModal(true);
                }}
              >
                <Ionicons name="add-circle" size={32} color="#3B82F6" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.expandedDayEvents} showsVerticalScrollIndicator={false}>
              {getEventsForDay(expandedDay).length > 0 ? (
                getEventsForDay(expandedDay).map((event) => {
                  const colors = getColorStyles(event.color);
                  return (
                    <TouchableOpacity 
                      key={event.id}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedEvent(event);
                        setShowEventDetailModal(true);
                      }}
                    >
                      <View 
                        style={[
                          styles.expandedEventCard,
                          { borderLeftColor: colors.text, borderLeftWidth: 4 }
                        ]}
                      >
                        <View style={styles.eventCardHeader}>
                          <View style={styles.eventCardTitleRow}>
                            <View style={[styles.eventCategoryDot, { backgroundColor: colors.text }]} />
                            <Text style={styles.expandedEventTitle}>{event.title}</Text>
                          </View>
                        </View>
                        <Text style={styles.expandedEventTime}>
                          {event.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - {event.end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </Text>
                        {event.location && (
                          <View style={styles.expandedEventLocation}>
                            <Ionicons name="location" size={14} color="#64748B" />
                            <Text style={styles.expandedEventLocationText}>{event.location}</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.noEventsContainer}>
                  <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.noEventsText}>No events scheduled</Text>
                  <TouchableOpacity 
                    style={styles.addEventButtonLarge}
                    onPress={() => {
                      // Initialize dates to the expanded day
                      const dateToUse = expandedDay || selectedDate;
                      setNewEventFromDate(dateToUse);
                      setNewEventToDate(dateToUse);
                      setShowAddEventModal(true);
                    }}
                  >
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                    <Text style={styles.addEventButtonText}>Add Event</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity 
              style={styles.collapseDayButton}
              onPress={() => setExpandedDay(null)}
            >
              <Ionicons name="chevron-down" size={20} color="#64748B" />
              <Text style={styles.collapseDayButtonText}>Collapse</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    );
  };

  // Date label for navigation
  const getDateLabel = () => {
    if (activeView === 'month') {
      return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (activeView === 'week') {
      const weekStart = getWeekStart(selectedDate);
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else {
      return selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#1E40AF', '#3B82F6', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Schedule</Text>
            <Text style={styles.headerSubtitle}>Team calendar & assignments</Text>
          </View>
          <View style={styles.headerUser}>
            <Text style={styles.headerUserName}>{userInfo.name}</Text>
            <Text style={styles.headerUserRole}>{userInfo.role}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content Area */}
      <ScrollView style={styles.contentArea} showsVerticalScrollIndicator={false}>
        {/* View Tabs */}
        <View style={styles.stickyControls}>
          <View style={styles.viewTabs}>
            <TouchableOpacity
              onPress={() => setActiveView('day')}
              style={[styles.viewTab, activeView === 'day' && styles.viewTabActive]}
            >
              <Text style={[styles.viewTabText, activeView === 'day' && styles.viewTabTextActive]}>
                Day
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveView('week')}
              style={[styles.viewTab, activeView === 'week' && styles.viewTabActive]}
            >
              <Text style={[styles.viewTabText, activeView === 'week' && styles.viewTabTextActive]}>
                Week
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveView('month')}
              style={[styles.viewTab, activeView === 'month' && styles.viewTabActive]}
            >
              <Text style={[styles.viewTabText, activeView === 'month' && styles.viewTabTextActive]}>
                Month
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date Navigation */}
          <View style={styles.dateNavigation}>
            <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateArrow}>
              <Ionicons name="chevron-back" size={16} color="#475569" />
            </TouchableOpacity>
            <Text style={styles.dateLabel}>{getDateLabel()}</Text>
            <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateArrow}>
              <Ionicons name="chevron-forward" size={16} color="#475569" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar Views */}
        <View style={styles.calendarContent}>
          {activeView === 'day' && <DayView />}
          {activeView === 'week' && <WeekView />}
          {activeView === 'month' && <MonthView />}
        </View>
      </ScrollView>

      {/* Add Event Modal */}
      <Modal
        visible={showAddEventModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddEventModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addEventModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditMode ? 'Edit Event' : 'Add Event'}</Text>
              <TouchableOpacity onPress={() => {
                setShowAddEventModal(false);
                setIsEditMode(false);
                setEditingEventId(null);
              }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Row 1: Title and Project side by side */}
              <View style={styles.modalFieldRow}>
                {/* Title */}
                <View style={[styles.modalField, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.modalLabel}>Title</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Event title"
                    value={newEventTitle}
                    onChangeText={setNewEventTitle}
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                {/* Projects Selector */}
                <View style={[styles.modalField, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.modalLabel}>Project</Text>
                  <TouchableOpacity
                    style={styles.projectSelectorButton}
                    onPress={() => setShowProjectSelector(true)}
                  >
                    <View style={styles.projectSelectorContent}>
                      {selectedProject ? (
                        <>
                          <View style={styles.projectSelectorInfo}>
                            <Text style={styles.projectSelectorName}>{selectedProject.name}</Text>
                            <Text style={styles.projectSelectorAddress}>
                              {selectedProject.street}, {selectedProject.city}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color="#64748B" />
                        </>
                      ) : (
                        <>
                          <Text style={styles.projectSelectorPlaceholder}>Select a project</Text>
                          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Row 2: Assigned Team and Status Badge side by side */}
              <View style={styles.modalFieldRow}>
                {/* Assigned Team Dropdown - Multi-select */}
                <View style={[styles.modalField, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.modalLabel}>Assigned Team</Text>
                  <TouchableOpacity
                    style={styles.assignedDropdownButton}
                    onPress={() => setShowAssignedDropdown(!showAssignedDropdown)}
                  >
                    <Text style={[
                      styles.assignedDropdownText,
                      assignedTeamMembers.length === 0 && styles.assignedDropdownPlaceholder
                    ]}>
                      {assignedTeamMembers.length > 0 
                        ? `${assignedTeamMembers.length} member${assignedTeamMembers.length > 1 ? 's' : ''}`
                        : 'Select members'}
                    </Text>
                    <Ionicons 
                      name={showAssignedDropdown ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#64748B" 
                    />
                  </TouchableOpacity>
                  
                  {/* Selected Team Members Display */}
                  {assignedTeamMembers.length > 0 && (
                    <View style={styles.selectedTeamContainer}>
                      {assignedTeamMembers.map((member) => (
                        <View key={member} style={styles.selectedTeamBadge}>
                          <Text style={styles.selectedTeamBadgeText}>{member}</Text>
                          <TouchableOpacity
                            onPress={() => {
                              setAssignedTeamMembers(assignedTeamMembers.filter(m => m !== member));
                            }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Ionicons name="close-circle" size={16} color="#64748B" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {showAssignedDropdown && (
                    <View style={styles.assignedDropdownMenu}>
                      {teamMembers.map((member) => {
                        const isSelected = assignedTeamMembers.includes(member);
                        return (
                          <TouchableOpacity
                            key={member}
                            style={[
                              styles.assignedDropdownItem,
                              isSelected && styles.assignedDropdownItemSelected
                            ]}
                            onPress={() => {
                              if (isSelected) {
                                setAssignedTeamMembers(assignedTeamMembers.filter(m => m !== member));
                              } else {
                                setAssignedTeamMembers([...assignedTeamMembers, member]);
                              }
                            }}
                          >
                            <View style={styles.checkboxContainer}>
                              <View style={[
                                styles.checkbox,
                                isSelected && styles.checkboxSelected
                              ]}>
                                {isSelected && (
                                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                )}
                              </View>
                              <Text style={[
                                styles.assignedDropdownItemText,
                                isSelected && styles.assignedDropdownItemTextSelected
                              ]}>
                                {member}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* Status Badge */}
                <View style={[styles.modalField, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.modalLabel}>Status Badge</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g., Rough-In"
                    value={newEventStatusBadge}
                    onChangeText={setNewEventStatusBadge}
                    placeholderTextColor="#94A3B8"
                    maxLength={20}
                  />
                  <Text style={styles.characterCountText}>
                    {newEventStatusBadge.length}/20
                  </Text>
                </View>
              </View>

              {/* Color Picker */}
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Color</Text>
                <View style={styles.colorOptions}>
                  {['lightblue', 'red', 'purple', 'green', 'lightgray'].map((color) => {
                    const colorStyle = getColorStyles(color);
                    return (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorSwatch,
                          { backgroundColor: colorStyle.text },
                          newEventColor === color && styles.colorSwatchSelected
                        ]}
                        onPress={() => setNewEventColor(color)}
                      >
                        {newEventColor === color && (
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                  {/* Palette/More Colors Option */}
                  <TouchableOpacity
                    style={[styles.colorSwatch, styles.colorSwatchPalette]}
                    onPress={() => setShowColorPicker(!showColorPicker)}
                  >
                    <Ionicons name="color-palette" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>
                
                {/* Extended Color Picker */}
                {showColorPicker && (
                  <View style={styles.extendedColorOptions}>
                    {['indigo', 'blue', 'cyan', 'teal', 'emerald', 'amber', 'orange', 'rose', 'pink', 'violet'].map((color) => {
                      const colorStyle = getColorStyles(color);
                      return (
                        <TouchableOpacity
                          key={color}
                          style={[
                            styles.colorSwatch,
                            { backgroundColor: colorStyle.text },
                            newEventColor === color && styles.colorSwatchSelected
                          ]}
                          onPress={() => {
                            setNewEventColor(color);
                            setShowColorPicker(false);
                          }}
                        >
                          {newEventColor === color && (
                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Date Pickers - From & To */}
              <View style={styles.modalFieldRow}>
                <View style={[styles.modalField, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.modalLabel}>From</Text>
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => {
                      setActiveEventDateField('from');
                      setShowEventCalendar(true);
                    }}
                  >
                    <Text style={styles.datePickerText}>
                      {newEventFromDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>
                
                <View style={[styles.modalField, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.modalLabel}>To</Text>
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => {
                      setActiveEventDateField('to');
                      setShowEventCalendar(true);
                    }}
                  >
                    <Text style={styles.datePickerText}>
                      {newEventToDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Time Pickers */}
              <View style={styles.modalFieldRow}>
                <View style={[styles.modalField, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.modalLabel}>From</Text>
                  <TouchableOpacity 
                    style={styles.timePickerButton}
                    onPress={() => openTimePicker('from')}
                  >
                    <Text style={styles.timePickerText}>{newEventFromTime}</Text>
                    <Ionicons name="time-outline" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>
                <View style={[styles.modalField, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.modalLabel}>To</Text>
                  <TouchableOpacity 
                    style={styles.timePickerButton}
                    onPress={() => openTimePicker('to')}
                  >
                    <Text style={styles.timePickerText}>{newEventToTime}</Text>
                    <Ionicons name="time-outline" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Street Name */}
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Street Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter street address"
                  value={newEventStreet}
                  onChangeText={setNewEventStreet}
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* City/State/Zip */}
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>City/State/Zip</Text>
                <View style={styles.addressRow}>
                  <TextInput
                    style={[styles.modalInput, styles.cityInput]}
                    placeholder="City"
                    value={newEventCity}
                    onChangeText={setNewEventCity}
                    placeholderTextColor="#94A3B8"
                  />
                  <TextInput
                    style={[styles.modalInput, styles.stateInput]}
                    placeholder="State"
                    value={newEventState}
                    onChangeText={setNewEventState}
                    placeholderTextColor="#94A3B8"
                    maxLength={2}
                  />
                  <TextInput
                    style={[styles.modalInput, styles.zipInput]}
                    placeholder="Zip"
                    value={newEventZip}
                    onChangeText={setNewEventZip}
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
              </View>

              {/* Alerts - Multiple Selection */}
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Alerts (Select multiple)</Text>
                <View style={styles.alertOptions}>
                  {['10 min before', '30 min before', '1 hour before', '1 day before'].map((alert) => (
                    <TouchableOpacity
                      key={alert}
                      style={[
                        styles.alertPill,
                        newEventAlerts.includes(alert) && styles.alertPillSelected
                      ]}
                      onPress={() => {
                        if (newEventAlerts.includes(alert)) {
                          // Remove if already selected
                          setNewEventAlerts(newEventAlerts.filter(a => a !== alert));
                        } else {
                          // Add if not selected
                          setNewEventAlerts([...newEventAlerts, alert]);
                        }
                      }}
                    >
                      <Text style={[
                        styles.alertPillText,
                        newEventAlerts.includes(alert) && styles.alertPillTextSelected
                      ]}>
                        {alert}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Notes */}
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Notes</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalInputMultiline]}
                  placeholder="Add notes"
                  value={newEventNotes}
                  onChangeText={setNewEventNotes}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowAddEventModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={() => {
                  if (!newEventTitle.trim()) {
                    // Don't save if title is empty
                    return;
                  }
                  
                  // Parse times
                  const fromParts = parseTimeString(newEventFromTime);
                  const toParts = parseTimeString(newEventToTime);
                  
                  // Create start and end Date objects using newEventFromDate and newEventToDate
                  const startDate = new Date(newEventFromDate);
                  let startHour = parseInt(fromParts.hour);
                  if (fromParts.period === 'PM' && startHour !== 12) startHour += 12;
                  if (fromParts.period === 'AM' && startHour === 12) startHour = 0;
                  startDate.setHours(startHour, parseInt(fromParts.minute), 0, 0);
                  
                  const endDate = new Date(newEventToDate);
                  let endHour = parseInt(toParts.hour);
                  if (toParts.period === 'PM' && endHour !== 12) endHour += 12;
                  if (toParts.period === 'AM' && endHour === 12) endHour = 0;
                  endDate.setHours(endHour, parseInt(toParts.minute), 0, 0);
                  
                  // Combine address fields
                  const fullLocation = `${newEventStreet}, ${newEventCity}, ${newEventState} ${newEventZip}`.trim();
                  
                  const eventData = {
                    title: newEventTitle,
                    start: startDate,
                    end: endDate,
                    location: fullLocation,
                    color: newEventColor,
                    alerts: newEventAlerts,
                    notes: newEventNotes,
                    assignedTeam: assignedTeamMembers.join(', '),
                    status: newEventStatusBadge
                  };
                  
                  if (isEditMode && editingEventId) {
                    // UPDATE existing event
                    const updatedEvent = {
                      ...eventData,
                      id: editingEventId
                    };
                    
                    // Update in manualEvents array
                    const updatedManualEvents = manualEvents.map(e => 
                      e.id === editingEventId ? updatedEvent : e
                    );
                    setManualEvents(updatedManualEvents);
                    
                    // Update in events array
                    const updatedEvents = events.map(e => 
                      e.id === editingEventId ? updatedEvent : e
                    );
                    setEvents(updatedEvents);
                  } else {
                    // CREATE new event
                    const newEvent = {
                      ...eventData,
                      id: `manual-${Date.now()}`
                    };
                    
                    // Add to manual events (persists across reloads)
                    setManualEvents([...manualEvents, newEvent]);
                    setEvents([...events, newEvent]);
                  }
                  
                  // Close modal
                  setShowAddEventModal(false);
                  
                  // Reset form and edit mode
                  setIsEditMode(false);
                  setEditingEventId(null);
                  setSelectedProject(null);
                  setAssignedTeamMembers([]);
                  setNewEventTitle('');
                  setNewEventStatusBadge('');
                  setNewEventColor('lightblue');
                  setNewEventFromDate(new Date());
                  setNewEventToDate(new Date());
                  setNewEventFromTime('08:00 AM');
                  setNewEventToTime('04:30 PM');
                  setNewEventStreet('');
                  setNewEventCity('');
                  setNewEventState('CO');
                  setNewEventZip('');
                  setNewEventAlerts(['10 min before', '1 day before']);
                  setNewEventNotes('');
                }}
              >
                <Text style={styles.modalButtonPrimaryText}>Save Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Event Detail Modal - Modern Centered Design */}
      <Modal
        visible={showEventDetailModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowEventDetailModal(false)}
      >
        <View style={styles.eventDetailOverlay}>
          {/* Backdrop */}
          <TouchableOpacity 
            style={styles.eventDetailBackdrop}
            activeOpacity={1}
            onPress={() => setShowEventDetailModal(false)}
          />
          
          {selectedEvent && (
            <View style={styles.eventDetailContainer}>
              {/* Close Button */}
              <TouchableOpacity 
                style={styles.eventDetailCloseButton}
                onPress={() => setShowEventDetailModal(false)}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>

              {/* Header with gradient and status indicator */}
              <LinearGradient
                colors={['#4F46E5', '#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.eventDetailHeader}
              >
                <View style={styles.eventDetailHeaderContent}>
                  <View style={[
                    styles.eventDetailStatusBadge, 
                    { backgroundColor: getColorStyles(selectedEvent.color).text }
                  ]}>
                    <Text style={styles.eventDetailStatusText}>{selectedEvent.status}</Text>
                  </View>
                  <Text style={styles.eventDetailHeaderTitle}>{selectedEvent.title}</Text>
                </View>
              </LinearGradient>

            {/* Scrollable Content */}
            <ScrollView style={styles.eventDetailContent} showsVerticalScrollIndicator={false}>

              {/* Date & Time Cards - Modern Design */}
              <View style={styles.eventDetailInfoGrid}>
                {/* Start Date/Time Card */}
                <View style={styles.eventDetailCard}>
                  <View style={styles.eventDetailCardIcon}>
                    <Ionicons name="calendar-outline" size={24} color="#4F46E5" />
                  </View>
                  <Text style={styles.eventDetailCardLabel}>START</Text>
                  <Text style={styles.eventDetailCardDate}>
                    {selectedEvent.start.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </Text>
                  <Text style={styles.eventDetailCardTime}>
                    {selectedEvent.start.toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit'
                    })}
                  </Text>
                </View>

                {/* End Date/Time Card */}
                <View style={styles.eventDetailCard}>
                  <View style={styles.eventDetailCardIcon}>
                    <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" />
                  </View>
                  <Text style={styles.eventDetailCardLabel}>END</Text>
                  <Text style={styles.eventDetailCardDate}>
                    {selectedEvent.end.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </Text>
                  <Text style={styles.eventDetailCardTime}>
                    {selectedEvent.end.toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              </View>

              {/* Details List - Modern Info Rows */}
              <View style={styles.eventDetailList}>
                {/* Location */}
                {selectedEvent.location && (
                  <View style={styles.eventDetailInfoRow}>
                    <View style={styles.eventDetailInfoIcon}>
                      <Ionicons name="location" size={20} color="#4F46E5" />
                    </View>
                    <View style={styles.eventDetailInfoContent}>
                      <Text style={styles.eventDetailInfoLabel}>Location</Text>
                      <Text style={styles.eventDetailInfoValue}>
                        {(() => {
                          // Split location into street and city/state/zip
                          const parts = selectedEvent.location.split(',').map((s: string) => s.trim());
                          if (parts.length >= 2) {
                            const street = parts[0];
                            const cityStateZip = parts.slice(1).join(', ');
                            return `${street}\n${cityStateZip}`;
                          }
                          return selectedEvent.location;
                        })()}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Assigned Team */}
                <View style={styles.eventDetailInfoRow}>
                  <View style={styles.eventDetailInfoIcon}>
                    <Ionicons name="people" size={20} color="#4F46E5" />
                  </View>
                  <View style={styles.eventDetailInfoContent}>
                    <Text style={styles.eventDetailInfoLabel}>Assigned Team</Text>
                    <Text style={styles.eventDetailInfoValue}>
                      {selectedEvent.assignedTeam || 'Not assigned'}
                    </Text>
                  </View>
                </View>

                {/* Reminder */}
                {selectedEvent.alerts && selectedEvent.alerts.length > 0 && (
                  <View style={styles.eventDetailInfoRow}>
                    <View style={styles.eventDetailInfoIcon}>
                      <Ionicons name="notifications" size={20} color="#4F46E5" />
                    </View>
                    <View style={styles.eventDetailInfoContent}>
                      <Text style={styles.eventDetailInfoLabel}>Reminder</Text>
                      <Text style={styles.eventDetailInfoValue}>
                        {Array.isArray(selectedEvent.alerts) 
                          ? selectedEvent.alerts.join(', ')
                          : selectedEvent.alerts}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Notes */}
                {selectedEvent.notes && (
                  <View style={styles.eventDetailInfoRow}>
                    <View style={styles.eventDetailInfoIcon}>
                      <Ionicons name="document-text" size={20} color="#4F46E5" />
                    </View>
                    <View style={styles.eventDetailInfoContent}>
                      <Text style={styles.eventDetailInfoLabel}>Notes</Text>
                      <Text style={styles.eventDetailInfoValue}>{selectedEvent.notes}</Text>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Action Buttons - Modern Gradient Buttons */}
            <View style={styles.eventDetailActions}>
              <TouchableOpacity 
                style={styles.eventDetailPrimaryButton} 
                activeOpacity={0.8}
                onPress={() => handleEditEvent(selectedEvent)}
              >
                <LinearGradient
                  colors={['#4F46E5', '#6366F1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.eventDetailButtonGradient}
                >
                  <Ionicons name="create-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.eventDetailPrimaryButtonText}>Edit Event</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <View style={styles.eventDetailSecondaryActions}>
                <TouchableOpacity style={styles.eventDetailSecondaryButton} activeOpacity={0.8}>
                  <Ionicons name="share-social-outline" size={20} color="#10B981" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.eventDetailSecondaryButton} 
                  activeOpacity={0.8}
                  onPress={() => setShowDeleteConfirmation(true)}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          )}
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <TimePickerModal />

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirmation}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirmation(false)}
      >
        <View style={styles.deleteConfirmationOverlay}>
          <TouchableOpacity 
            style={styles.deleteConfirmationBackdrop}
            activeOpacity={1}
            onPress={() => setShowDeleteConfirmation(false)}
          />
          
          <View style={styles.deleteConfirmationContainer}>
            {/* Warning Icon */}
            <View style={styles.deleteWarningIconContainer}>
              <Ionicons name="warning" size={48} color="#EF4444" />
            </View>
            
            {/* Title */}
            <Text style={styles.deleteConfirmationTitle}>Delete Event?</Text>
            
            {/* Message */}
            <Text style={styles.deleteConfirmationMessage}>
              This action cannot be undone. All event data will be permanently deleted from your calendar.
            </Text>
            
            {/* Event Info */}
            {selectedEvent && (
              <View style={styles.deleteEventInfo}>
                <Text style={styles.deleteEventTitle}>{selectedEvent.title}</Text>
                <Text style={styles.deleteEventDate}>
                  {selectedEvent.start.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
              </View>
            )}
            
            {/* Action Buttons */}
            <View style={styles.deleteConfirmationActions}>
              <TouchableOpacity
                style={styles.deleteConfirmationCancelButton}
                onPress={() => setShowDeleteConfirmation(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteConfirmationCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.deleteConfirmationDeleteButton}
                onPress={handleDeleteEvent}
                activeOpacity={0.8}
              >
                <Ionicons name="trash" size={18} color="#FFFFFF" />
                <Text style={styles.deleteConfirmationDeleteText}>Delete Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Calendar Modal for Event Dates */}
      <Modal
        visible={showEventCalendar}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEventCalendar(false)}
      >
        <View style={styles.calendarModalOverlay}>
          <TouchableOpacity 
            style={styles.calendarModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowEventCalendar(false)}
          />
          <View style={styles.calendarModalContainer}>
            {/* Calendar Header */}
            <View style={styles.calendarModalHeader}>
              <Text style={styles.calendarModalTitle}>
                Select {activeEventDateField === 'from' ? 'From' : 'To'} Date
              </Text>
              <TouchableOpacity
                style={styles.calendarModalCloseButton}
                onPress={() => setShowEventCalendar(false)}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Calendar */}
            <Calendar
              current={activeEventDateField === 'from' 
                ? newEventFromDate.toISOString().split('T')[0]
                : newEventToDate.toISOString().split('T')[0]
              }
              onDayPress={(day) => {
                const selectedDate = new Date(day.timestamp);
                if (activeEventDateField === 'from') {
                  setNewEventFromDate(selectedDate);
                  // If from date is after to date, also update to date
                  if (selectedDate > newEventToDate) {
                    setNewEventToDate(selectedDate);
                  }
                } else {
                  setNewEventToDate(selectedDate);
                  // If to date is before from date, also update from date
                  if (selectedDate < newEventFromDate) {
                    setNewEventFromDate(selectedDate);
                  }
                }
                setShowEventCalendar(false);
              }}
              markedDates={{
                [activeEventDateField === 'from' 
                  ? newEventFromDate.toISOString().split('T')[0]
                  : newEventToDate.toISOString().split('T')[0]
                ]: {
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
                dayTextColor: '#0F172A',
                textDisabledColor: '#CBD5E1',
                dotColor: '#4F46E5',
                selectedDotColor: '#FFFFFF',
                arrowColor: '#4F46E5',
                monthTextColor: '#0F172A',
                textDayFontWeight: '500',
                textMonthFontWeight: '600',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 15,
                textMonthFontSize: 17,
                textDayHeaderFontSize: 13
              }}
            />

            {/* Quick Actions */}
            <View style={styles.calendarModalActions}>
              <TouchableOpacity
                style={styles.calendarQuickButton}
                onPress={() => {
                  const today = new Date();
                  if (activeEventDateField === 'from') {
                    setNewEventFromDate(today);
                  } else {
                    setNewEventToDate(today);
                  }
                  setShowEventCalendar(false);
                }}
              >
                <Text style={styles.calendarQuickButtonText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.calendarQuickButton}
                onPress={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  if (activeEventDateField === 'from') {
                    setNewEventFromDate(tomorrow);
                  } else {
                    setNewEventToDate(tomorrow);
                  }
                  setShowEventCalendar(false);
                }}
              >
                <Text style={styles.calendarQuickButtonText}>Tomorrow</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Project Selector Modal */}
      <Modal
        visible={showProjectSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowProjectSelector(false);
          setProjectSearchQuery('');
        }}
      >
        <View style={styles.projectSelectorOverlay}>
          <View style={styles.projectSelectorModal}>
            <View style={styles.projectSelectorHeader}>
              <Text style={styles.projectSelectorTitle}>Select Project</Text>
              <TouchableOpacity onPress={() => {
                setShowProjectSelector(false);
                setProjectSearchQuery('');
              }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.projectSearchContainer}>
              <Ionicons name="search" size={20} color="#64748B" style={styles.projectSearchIcon} />
              <TextInput
                style={styles.projectSearchInput}
                placeholder="Search projects..."
                value={projectSearchQuery}
                onChangeText={setProjectSearchQuery}
                placeholderTextColor="#94A3B8"
              />
              {projectSearchQuery.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setProjectSearchQuery('')}
                  style={styles.projectSearchClear}
                >
                  <Ionicons name="close-circle" size={20} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.projectSelectorList} showsVerticalScrollIndicator={false}>
              {allProjects
                .filter((project) => {
                  const searchLower = projectSearchQuery.toLowerCase();
                  return (
                    project.name.toLowerCase().includes(searchLower) ||
                    project.street.toLowerCase().includes(searchLower) ||
                    project.city.toLowerCase().includes(searchLower) ||
                    project.status.toLowerCase().includes(searchLower)
                  );
                })
                .map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={[
                    styles.projectSelectorItem,
                    selectedProject?.id === project.id && styles.projectSelectorItemSelected
                  ]}
                  onPress={() => handleProjectSelect(project)}
                  activeOpacity={0.7}
                >
                  <View style={styles.projectSelectorItemContent}>
                    <View style={[
                      styles.projectStatusIndicator,
                      { backgroundColor: getColorStyles(
                        project.status === 'Rough-In' ? 'blue' :
                        project.status === 'Inspection' ? 'amber' :
                        project.status === 'Final Trim' ? 'purple' :
                        project.status === 'Completed' ? 'green' :
                        project.status === 'Service Call' ? 'red' : 'lightblue'
                      ).text }
                    ]} />
                    <View style={styles.projectSelectorItemInfo}>
                      <Text style={styles.projectSelectorItemName}>{project.name}</Text>
                      <Text style={styles.projectSelectorItemAddress}>
                        {project.street}, {project.city}
                      </Text>
                      <Text style={styles.projectSelectorItemStatus}>{project.status}</Text>
                    </View>
                  </View>
                  {selectedProject?.id === project.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
                  )}
                </TouchableOpacity>
              ))}
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  headerUser: {
    alignItems: 'flex-end',
  },
  headerUserName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerUserRole: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  contentArea: {
    flex: 1,
  },
  stickyControls: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  viewTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  viewTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  viewTabActive: {
    backgroundColor: '#3B82F6',
  },
  viewTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  viewTabTextActive: {
    color: '#FFFFFF',
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateArrow: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  calendarContent: {
    padding: 16,
  },
  
  // Day View Styles
  dayHourRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    minHeight: 80,
  },
  dayHourLabel: {
    width: 64,
    padding: 8,
    alignItems: 'flex-end',
  },
  dayHourText: {
    fontSize: 12,
    color: '#64748B',
  },
  dayHourContent: {
    flex: 1,
    padding: 8,
    gap: 8,
  },
  dayEventCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  dayEventTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  dayEventTime: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  dayEventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dayEventLocationText: {
    fontSize: 12,
    color: '#64748B',
  },

  // Week View Styles
  weekContainer: {
    minWidth: 800,
  },
  weekHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  weekTimeColumn: {
    width: 64,
    padding: 8,
  },
  weekDayHeader: {
    width: 100,
    padding: 8,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
  },
  weekDayName: {
    fontSize: 10,
    color: '#64748B',
  },
  weekDayNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  weekHourRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  weekHourText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
    paddingRight: 12,
  },
  weekDayCell: {
    width: 100,
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    padding: 4,
    minHeight: 60,
  },
  weekEventCard: {
    borderRadius: 4,
    borderWidth: 1,
    padding: 4,
    marginBottom: 4,
  },
  weekEventTitle: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  weekEventTime: {
    fontSize: 8,
    color: '#64748B',
  },

  // Modern Month View Styles (Samsung Calendar Style with Swipe Gestures)
  modernMonthContainer: {
    flex: 1,
  },
  swipeIndicator: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  swipeHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    marginBottom: 4,
  },
  swipeHint: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  modernMonthHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  modernDayNameCell: {
    flex: 1,
    alignItems: 'center',
  },
  modernDayName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  modernDayNameWeekend: {
    color: '#3B82F6',
  },
  modernMonthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  modernDayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernDayCellEmpty: {
    opacity: 0.3,
  },
  modernDayCellToday: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
  },
  modernDayCellSelected: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  modernDayCellContent: {
    alignItems: 'center',
    gap: 4,
  },
  modernDayNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernDayNumberContainerToday: {
    backgroundColor: '#3B82F6',
  },
  modernDayNumberContainerSelected: {
    backgroundColor: '#2563EB',
  },
  modernDayNumber: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
  },
  modernDayNumberToday: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modernDayNumberSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modernEventIndicators: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
  },
  modernEventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  modernDayCellTouchable: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  modernDayNumberSmall: {
    fontSize: 13,
  },
  
  // Collapsed State Styles - Thin colored bars (Samsung style)
  collapsedEventBars: {
    width: '100%',
    paddingHorizontal: 4,
    marginTop: 4,
    gap: 2,
    alignItems: 'center',
  },
  collapsedEventBar: {
    width: '80%',
    height: 3,
    borderRadius: 1.5,
  },
  moreEventsIndicator: {
    fontSize: 8,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  
  // Expanded State Styles - Full event info in cells
  expandedEventsList: {
    width: '100%',
    paddingHorizontal: 2,
    marginTop: 6,
    gap: 3,
  },
  expandedEventItem: {
    borderRadius: 6,
    padding: 4,
    borderLeftWidth: 3,
  },
  expandedEventItemText: {
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 1,
  },
  expandedEventItemTime: {
    fontSize: 7,
    color: '#64748B',
  },
  moreEventsText: {
    fontSize: 8,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  
  // Expanded Day Section Styles
  expandedDaySection: {
    marginTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#3B82F6',
    paddingTop: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
  },
  expandedDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  expandedDayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  expandedDaySubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  addEventButton: {
    padding: 4,
  },
  expandedDayEvents: {
    maxHeight: 200,
  },
  expandedEventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  expandedEventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  expandedEventTime: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  expandedEventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandedEventLocationText: {
    fontSize: 12,
    color: '#64748B',
  },
  noEventsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noEventsText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 12,
    marginBottom: 16,
  },
  addEventButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addEventButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  collapseDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
    paddingVertical: 8,
  },
  collapseDayButtonText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  expandedDaySectionCollapsed: {
    flex: 1,
    maxHeight: '50%',
  },
  // Add Event Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  addEventModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalField: {
    marginBottom: 20,
  },
  modalFieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  modalInputMultiline: {
    minHeight: 100,
    paddingTop: 12,
  },
  colorOptions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: '#3B82F6',
    borderWidth: 3,
  },
  colorSwatchPalette: {
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  extendedColorOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  datePickerButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePickerText: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModalBackdrop: {
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
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  calendarModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  calendarModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  calendarModalCloseButton: {
    padding: 4,
  },
  calendarModalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  calendarQuickButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calendarQuickButtonText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  timePickerButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timePickerText: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },
  alertOptions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  alertPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  alertPillSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  alertPillText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  alertPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  modalButtonPrimary: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Event Card Header Styles
  eventCardHeader: {
    marginBottom: 4,
  },
  eventCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventCategoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Event Detail Modal Styles
  // Modern Centered Modal Styles
  eventDetailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  eventDetailBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  eventDetailContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  eventDetailCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  eventDetailHeader: {
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  eventDetailHeaderContent: {
    alignItems: 'center',
  },
  eventDetailStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  eventDetailStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  eventDetailHeaderTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  eventDetailContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  eventDetailInfoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  eventDetailCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  eventDetailCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  eventDetailCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  eventDetailCardDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  eventDetailCardTime: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  eventDetailList: {
    marginBottom: 20,
  },
  eventDetailInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  eventDetailInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventDetailInfoContent: {
    flex: 1,
  },
  eventDetailInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  eventDetailInfoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
    lineHeight: 22,
  },
  eventDetailActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  eventDetailPrimaryButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  eventDetailButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  eventDetailPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  eventDetailSecondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  eventDetailSecondaryButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Time Picker Modal Styles
  timePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  timePickerModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  timePickerHeader: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  timePickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  timePickerWheelsContainer: {
    position: 'relative',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  selectionBox: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    height: 44,
    marginTop: -22,
    backgroundColor: '#F3F5FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    zIndex: 0,
  },
  timePickerWheels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  },
  pickerWheel: {
    width: 80,
    height: 220,
    overflow: 'hidden',
  },
  pickerItem: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
  },
  pickerItemText: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '400',
    opacity: 0.5,
    lineHeight: 44,
    textAlign: 'center',
  },
  pickerItemTextSelected: {
    fontSize: 24,
    color: '#1A1A1A',
    fontWeight: '700',
    opacity: 1.0,
    lineHeight: 44,
    textAlign: 'center',
  },
  timePickerSeparator: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginHorizontal: 8,
    zIndex: 1,
  },
  timePickerActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  timePickerButtonCancel: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  timePickerButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  timePickerButtonSave: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  timePickerButtonSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Project Selector Styles
  projectSelectorButton: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#F8FAFC',
  },
  projectSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  projectSelectorInfo: {
    flex: 1,
  },
  projectSelectorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  projectSelectorAddress: {
    fontSize: 13,
    color: '#64748B',
  },
  projectSelectorPlaceholder: {
    fontSize: 15,
    color: '#94A3B8',
  },
  projectSelectorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  projectSelectorModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: 20,
  },
  projectSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  projectSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  projectSearchIcon: {
    marginRight: 8,
  },
  projectSearchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  projectSearchClear: {
    padding: 4,
  },
  projectSelectorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  projectSelectorList: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  projectSelectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  projectSelectorItemSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  projectSelectorItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  projectStatusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  projectSelectorItemInfo: {
    flex: 1,
  },
  projectSelectorItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  projectSelectorItemAddress: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  projectSelectorItemStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  // Assigned Team Dropdown Styles
  assignedDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#F8FAFC',
  },
  assignedDropdownText: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },
  assignedDropdownPlaceholder: {
    color: '#94A3B8',
    fontWeight: '400',
  },
  assignedDropdownMenu: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  assignedDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  assignedDropdownItemSelected: {
    backgroundColor: '#EEF2FF',
  },
  assignedDropdownItemText: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },
  assignedDropdownItemTextSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  addressRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cityInput: {
    flex: 1,
  },
  stateInput: {
    width: 70,
  },
  zipInput: {
    width: 90,
  },
  characterCountText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'right',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  selectedTeamContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  selectedTeamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  selectedTeamBadgeText: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '500',
  },
  // Delete Confirmation Modal Styles
  deleteConfirmationOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  deleteConfirmationBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  deleteConfirmationContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '90%',
    maxWidth: 420,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  deleteWarningIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  deleteConfirmationTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteConfirmationMessage: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  deleteEventInfo: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deleteEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  deleteEventDate: {
    fontSize: 14,
    color: '#64748B',
  },
  deleteConfirmationActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteConfirmationCancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteConfirmationCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  deleteConfirmationDeleteButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteConfirmationDeleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
