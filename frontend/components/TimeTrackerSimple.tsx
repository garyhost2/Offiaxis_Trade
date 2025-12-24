import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Platform, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { getAllProjects } from '../utils/projectsData';
import { Calendar } from 'react-native-calendars';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';

// Import reusable components
import { WeeklyTimesheet } from './tracker';
import { CustomAlertModal, GrossPayInfoModal, WeekCalendarModal, ClockOutOptionsModal } from './tracker/modals';

/**
 * TIME TRACKER #1 (SIMPLE)
 * Basic manual clock-in/out system for small teams.
 * Edit this file ONLY for Time Tracker #1 changes.
 */

// Helper to format date as "Dec 17, 2025"
const formatDisplayDate = (date: Date) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
};

// Helper to format time as "02:45 PM"
const formatDisplayTime = (date: Date) => {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

// Helper to format date as "MM/DD"
const formatShortDate = (date: Date) => {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}/${day}`;
};

export default function TimeTrackerSimple() {
  const [showClockInModal, setShowClockInModal] = useState(false);
  const [showAddStopModal, setShowAddStopModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showClockOutOptionsModal, setShowClockOutOptionsModal] = useState(false);
  const [isClockOutWithNotes, setIsClockOutWithNotes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnBreak, setIsOnBreak] = useState(false);
  
  // Custom Alert Modal state (for web compatibility)
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  
  // Gross Pay Info Modal
  const [showGrossPayInfo, setShowGrossPayInfo] = useState(false);
  
  // Clock In/Out state
  const [isClockedIn, setIsClockedIn] = useState(true); // Default clocked in
  const [clockInTime, setClockInTime] = useState<Date>(new Date()); // Current time as default clock in
  const [lastClockOutTime, setLastClockOutTime] = useState<Date | null>(null);
  
  // Weekly Timesheet state
  const [showWeekCalendar, setShowWeekCalendar] = useState(false);
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => {
    // Default to current week's Monday
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(today.setDate(diff));
  });
  
  // Mock weekly hours data - different data for different weeks
  const getWeeklyHoursData = (weekStart: Date) => {
    const weekKey = weekStart.toISOString().split('T')[0];
    const mockData: { [key: string]: number[] } = {
      // Current week
      '2024-12-16': [0, 8, 7.5, 8, 8, 6.5, 0],
      '2024-12-09': [0, 7, 8, 8, 7.5, 8, 0],
      '2024-12-02': [0, 8, 8, 6, 8, 8, 0],
      '2024-11-25': [0, 6, 7, 8, 8, 7, 0],
    };
    // Return mock data or generate random data for other weeks
    if (mockData[weekKey]) {
      return mockData[weekKey];
    }
    // Generate semi-random but consistent data based on week
    const seed = weekStart.getTime();
    return [0, 7 + (seed % 2), 7.5 + ((seed >> 1) % 1.5), 8, 7 + ((seed >> 2) % 2), 6.5 + ((seed >> 3) % 2), 0];
  };
  
  const [weeklyHours, setWeeklyHours] = useState<number[]>(() => getWeeklyHoursData(selectedWeekStart));
  const hourlyRate = 20; // $20/hr
  
  // Calculate totals
  const totalWeeklyHours = weeklyHours.reduce((sum, h) => sum + h, 0);
  const totalWeeklyPay = totalWeeklyHours * hourlyRate;
  const weeklyProgressPercent = Math.min((totalWeeklyHours / 40) * 100, 100);
  
  // Format week date range
  const formatWeekRange = (start: Date) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const formatDate = (d: Date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[d.getMonth()]} ${d.getDate()}`;
    };
    return `${formatDate(start)} - ${formatDate(end)}`;
  };
  
  // Handle week selection from calendar
  const handleWeekSelect = (date: Date) => {
    // Get Monday of the selected week
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    
    setSelectedWeekStart(monday);
    setWeeklyHours(getWeeklyHoursData(monday));
    setShowWeekCalendar(false);
  };
  
  // Default to "Andrew Martinez" project as clocked-in location
  const [currentLocation, setCurrentLocation] = useState<{ name: string; street: string; city: string } | null>({
    name: 'Andrew Martinez',
    street: '1234 Cherry Creek Dr',
    city: 'Denver, CO 80223'
  });
  
  // Notes modal state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteSubTitle, setNoteSubTitle] = useState('');
  const [noteDate, setNoteDate] = useState(new Date());
  const [noteContent, setNoteContent] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [saveTime, setSaveTime] = useState(new Date());
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptWords, setTranscriptWords] = useState<string[]>([]);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mock transcript data
  const mockTranscriptText = `General walk

• Completed foundation work on section A
• Electrical wiring 80% done
• Plumbing inspection passed
• Need to order more materials for next week
• Team meeting scheduled for tomorrow at 9 AM

Notes: Weather conditions were favorable today. All safety protocols followed.`;
  
  // Tabs and saved notes state
  const [activeTab, setActiveTab] = useState<'entries' | 'notes'>('entries');
  const [savedNotes, setSavedNotes] = useState<Array<{
    id: string;
    project: string;
    title: string;
    date: Date;
    time: string;
    content: string;
    photos: string[];
    audioUri?: string;
    transcript?: string;
  }>>([
    {
      id: '1',
      project: 'Downtown Office Complex',
      title: 'Foundation Inspection',
      date: new Date('2025-12-15'),
      time: '09:30 AM',
      content: 'Completed foundation inspection for Building A. All structural elements meet code requirements. Concrete curing properly.',
      photos: ['https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400', 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400'],
      audioUri: 'mock-audio-1',
      transcript: 'Foundation Inspection Report\n\n• Concrete strength test passed\n• Rebar placement verified\n• No visible cracks detected\n• Ready for next phase\n\nNotes: Weather was clear, ideal conditions for inspection.'
    },
    {
      id: '2',
      project: 'Riverside Apartments',
      title: 'Electrical Walkthrough',
      date: new Date('2025-12-16'),
      time: '02:15 PM',
      content: 'Electrical rough-in complete for floors 1-3. Panel installation scheduled for next week. Minor adjustments needed in unit 2B.',
      photos: ['https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400'],
      audioUri: 'mock-audio-2',
      transcript: 'Electrical Progress Update\n\n• Wiring 85% complete\n• Panel boxes installed\n• Outlet locations marked\n• Inspection scheduled Friday\n\nNotes: Need additional 20-amp circuits for kitchen areas.'
    },
    {
      id: '3',
      project: 'Sunset Mall Renovation',
      title: 'Plumbing Status',
      date: new Date('2025-12-17'),
      time: '11:45 AM',
      content: 'Main water line connection successful. Testing pressure throughout the system. Restroom fixtures to arrive tomorrow.',
      photos: ['https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400'],
      audioUri: 'mock-audio-3',
      transcript: 'Plumbing Status Check\n\n• Main line connected\n• Pressure test passed\n• Hot water system ready\n• Fixtures pending delivery\n\nNotes: All rough-in inspections passed. Ready for drywall.'
    }
  ]);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  // Get all projects from the app data
  const allProjects = useMemo(() => {
    return getAllProjects().map(p => ({
      id: p.id.toString(),
      name: p.name || p.galleryDescription || 'Unnamed Project',
      address: `${p.street}, ${p.city}`,
      street: p.street,
      city: p.city,
    }));
  }, []);

  // First project is the "closest" (auto-detected)
  const closestProject = allProjects[0];

  const filteredProjects = allProjects.filter(
    project =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectLocation = (project: { id: string; name: string; address: string; street: string; city: string }) => {
    setShowClockInModal(false);
    setSearchQuery('');
    setCurrentLocation({ name: project.name, street: project.street, city: project.city });
    setIsClockedIn(true);
    setClockInTime(new Date());
    console.log('Clocked in at:', project.name);
  };

  const handleSelectStop = (project: { id: string; name: string; address: string; street: string; city: string }) => {
    setShowAddStopModal(false);
    setSearchQuery('');
    setCurrentLocation({ name: project.name, street: project.street, city: project.city });
    console.log('Added stop at:', project.name);
  };

  const handleBreakToggle = () => {
    setIsOnBreak(!isOnBreak);
  };

  // Show custom alert (works on both web and mobile)
  const showCustomAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setShowAlertModal(true);
  };

  // Clock In button handler
  const handleClockInPress = () => {
    if (isClockedIn && currentLocation) {
      // Already clocked in - show alert
      const clockInDateStr = `${formatShortDate(clockInTime)}`;
      const clockInTimeStr = formatDisplayTime(clockInTime);
      showCustomAlert(
        'Already Clocked In',
        `You are already clocked in at ${currentLocation.name}, ${currentLocation.street}, ${currentLocation.city} since ${clockInTimeStr} ${clockInDateStr}`
      );
    } else {
      // Not clocked in - show location picker
      setShowClockInModal(true);
    }
  };

  // Clock Out button handler
  const handleClockOutPress = () => {
    if (!isClockedIn) {
      // Already clocked out - show alert
      if (lastClockOutTime) {
        const clockOutDateStr = `${formatShortDate(lastClockOutTime)}`;
        const clockOutTimeStr = formatDisplayTime(lastClockOutTime);
        showCustomAlert(
          'Already Clocked Out',
          `You are already Clocked out since ${clockOutTimeStr} ${clockOutDateStr}`
        );
      } else {
        showCustomAlert('Already Clocked Out', 'You are not currently clocked in.');
      }
    } else {
      // Currently clocked in - show options modal
      setShowClockOutOptionsModal(true);
    }
  };

  // Handle direct clock out (without notes)
  const handleDirectClockOut = () => {
    setShowClockOutOptionsModal(false);
    setIsClockedIn(false);
    setLastClockOutTime(new Date());
    Alert.alert('Clocked Out', 'You have successfully clocked out.');
  };

  // Handle clock out with notes - open notes modal
  const handleClockOutWithNotes = () => {
    setShowClockOutOptionsModal(false);
    setIsClockOutWithNotes(true);
    openNotesModal();
  };

  const openNotesModal = () => {
    setNoteTitle(currentLocation?.name || 'Daily Log');
    setNoteSubTitle('');
    setNoteDate(new Date());
    setNoteContent('');
    setShowFabMenu(false);
    setCapturedPhotos([]);
    setShowNotesModal(true);
  };

  const handleDateSelect = (day: any) => {
    const selectedDate = new Date(day.dateString);
    setNoteDate(selectedDate);
    setShowDatePickerModal(false);
  };

  const handleTakePhotos = async () => {
    setShowFabMenu(false);
    
    if (capturedPhotos.length >= 10) {
      Alert.alert('Limit Reached', 'You can only add up to 10 photos.');
      return;
    }
    
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to take photos.');
      return;
    }

    // Continuous photo taking - keep camera open until user cancels or reaches limit
    let currentPhotos = [...capturedPhotos];
    
    while (currentPhotos.length < 10) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled) {
        // User pressed back/cancel - exit the loop
        break;
      }

      if (result.assets) {
        currentPhotos = [...currentPhotos, ...result.assets.map(a => a.uri)];
        setCapturedPhotos(currentPhotos.slice(0, 10));
        
        if (currentPhotos.length >= 10) {
          Alert.alert('Complete', 'You have reached the maximum of 10 photos.');
          break;
        }
      }
    }
  };

  const handleUploadPhotos = async () => {
    setShowFabMenu(false);
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Gallery access is needed to upload photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      setCapturedPhotos(prev => [...prev, ...result.assets.map(a => a.uri)]);
    }
  };

  const removePhoto = (index: number) => {
    setCapturedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveNote = () => {
    const currentTime = new Date();
    setSaveTime(currentTime);
    
    const newNote = {
      id: Date.now().toString(),
      project: noteTitle,
      title: noteSubTitle,
      date: noteDate,
      time: formatDisplayTime(currentTime),
      content: noteContent,
      photos: [...capturedPhotos],
      audioUri: audioUri,
      transcript: transcript
    };
    
    setSavedNotes(prev => [newNote, ...prev]);
    
    // Reset audio state
    resetAudioState();
    
    console.log('Saving note:', newNote);
    Alert.alert('Success', `Daily log saved at ${formatDisplayTime(currentTime)}!`);
    setShowNotesModal(false);
    setIsClockOutWithNotes(false);
  };

  // Handle Save and Clock Out
  const handleSaveAndClockOut = () => {
    const currentTime = new Date();
    setSaveTime(currentTime);
    
    const newNote = {
      id: Date.now().toString(),
      project: noteTitle,
      title: noteSubTitle,
      date: noteDate,
      time: formatDisplayTime(currentTime),
      content: noteContent,
      photos: [...capturedPhotos],
      audioUri: audioUri,
      transcript: transcript
    };
    
    setSavedNotes(prev => [newNote, ...prev]);
    
    // Reset audio state
    resetAudioState();
    
    // Clock out
    setIsClockedIn(false);
    setLastClockOutTime(currentTime);
    
    console.log('Saving note and clocking out:', newNote);
    Alert.alert('Success', `Daily log saved and you have been clocked out at ${formatDisplayTime(currentTime)}!`);
    setShowNotesModal(false);
    setIsClockOutWithNotes(false);
  };

  // Audio recording functions
  const resetAudioState = () => {
    setAudioUri(null);
    setTranscript('');
    setTranscriptWords([]);
    setHighlightedWordIndex(-1);
    setRecordingDuration(0);
    setPlaybackPosition(0);
    setPlaybackDuration(0);
    setIsPlaying(false);
    if (sound) { sound.unloadAsync(); setSound(null); }
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone access is needed to record audio.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration counter
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1000);
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      
      if (uri) {
        setAudioUri(uri);
        setPlaybackDuration(recordingDuration);
        // Start mock transcription
        startMockTranscription();
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const startMockTranscription = () => {
    setIsTranscribing(true);
    // Split by spaces but preserve newlines by using a special marker
    const textWithMarkers = mockTranscriptText.replace(/\n/g, ' __NEWLINE__ ');
    const words = textWithMarkers.split(/\s+/).filter(w => w.length > 0);
    setTranscriptWords(words);
    
    let currentIndex = 0;
    const transcriptionInterval = setInterval(() => {
      if (currentIndex < words.length) {
        const word = words[currentIndex];
        if (word === '__NEWLINE__') {
          setTranscript(prev => prev + '\n');
        } else {
          setTranscript(prev => prev + (currentIndex === 0 || words[currentIndex - 1] === '__NEWLINE__' ? '' : ' ') + word);
        }
        setHighlightedWordIndex(currentIndex);
        currentIndex++;
      } else {
        clearInterval(transcriptionInterval);
        setIsTranscribing(false);
        setHighlightedWordIndex(-1);
      }
    }, 100);
  };

  const playAudio = async () => {
    if (!audioUri) return;

    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
          if (playbackIntervalRef.current) {
            clearInterval(playbackIntervalRef.current);
          }
        } else {
          await sound.playAsync();
          setIsPlaying(true);
          startPlaybackTracking();
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlaying(true);
        
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPlaybackPosition(0);
              if (playbackIntervalRef.current) {
                clearInterval(playbackIntervalRef.current);
              }
            }
          }
        });
        
        startPlaybackTracking();
      }
    } catch (err) {
      console.error('Failed to play audio', err);
    }
  };

  const startPlaybackTracking = () => {
    playbackIntervalRef.current = setInterval(async () => {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          setPlaybackPosition(status.positionMillis);
          // Sync transcript highlight with playback
          const progress = status.positionMillis / (playbackDuration || 1);
          const wordIndex = Math.floor(progress * transcriptWords.length);
          setHighlightedWordIndex(Math.min(wordIndex, transcriptWords.length - 1));
        }
      }
    }, 100);
  };

  const seekAudio = async (value: number) => {
    setPlaybackPosition(value);
    if (sound) {
      await sound.setPositionAsync(value);
      // Update highlighted word based on position
      const progress = value / (playbackDuration || 1);
      const wordIndex = Math.floor(progress * transcriptWords.length);
      setHighlightedWordIndex(Math.min(wordIndex, transcriptWords.length - 1));
    }
  };

  const deleteRecording = () => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: resetAudioState }
      ]
    );
  };

  // Play audio from saved note
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
  const [noteSound, setNoteSound] = useState<Audio.Sound | null>(null);

  const playNoteAudio = async (noteId: string, audioUri: string) => {
    try {
      // Stop any currently playing audio
      if (noteSound) {
        await noteSound.stopAsync();
        await noteSound.unloadAsync();
        setNoteSound(null);
      }
      
      if (playingNoteId === noteId) {
        // Toggle off if same note
        setPlayingNoteId(null);
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );
      setNoteSound(newSound);
      setPlayingNoteId(noteId);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingNoteId(null);
          newSound.unloadAsync();
          setNoteSound(null);
        }
      });
    } catch (err) {
      console.error('Failed to play note audio', err);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
      if (sound) sound.unloadAsync();
      if (noteSound) noteSound.unloadAsync();
    };
  }, [sound, noteSound]);

  const openImageViewer = (imageUri: string) => {
    setSelectedImage(imageUri);
    setShowImageViewer(true);
  };

  const openNoteCard = (noteId: string) => {
    if (selectedNoteId !== noteId) {
      setSelectedNoteId(noteId);
    }
  };

  const closeNoteCard = () => {
    setSelectedNoteId(null);
    // Stop any playing audio
    if (noteSound) {
      noteSound.stopAsync();
      noteSound.unloadAsync();
      setNoteSound(null);
      setPlayingNoteId(null);
    }
  };

  return (
    <View style={styles.content}>
      {/* Time and Date */}
      <View style={styles.timeSection}>
        <Text style={styles.timeText}>02:45 PM</Text>
        <Text style={styles.dateText}>Monday, November 6, 2024</Text>
      </View>

      {/* Current Location Box */}
      <View style={styles.currentLocationBox}>
        {/* Subtle Background Gradient Overlay */}
        <LinearGradient
          colors={['#dbeafe', '#d1fae5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.locationBoxGradient}
        />
        
        {/* Content Container */}
        <View style={styles.locationBoxContent}>
          {/* Title */}
          <Text style={styles.locationBoxTitle}>Current Location</Text>
          
          {/* Map Placeholder */}
          <View style={styles.mapPlaceholder}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="#94a3b8">
              <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </Svg>
            <Text style={styles.mapPlaceholderText}>Map placeholder</Text>
          </View>
          
          {/* Location Address */}
          <View style={styles.locationAddressRow}>
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="#94a3b8">
              <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </Svg>
            <View style={styles.locationAddressText}>
              <Text style={styles.locationAddressMain}>{currentLocation?.street || '1452 S York St'}</Text>
              <Text style={styles.locationAddressSecondary}>{currentLocation?.city || 'Denver, CO 80210'}</Text>
              {currentLocation && <Text style={styles.locationProjectName}>{currentLocation.name}</Text>}
            </View>
          </View>
        </View>
      </View>

      {/* Currently Clocked In - Animated Card */}
      <View style={styles.clockedInWrapper}>
        <LinearGradient
          colors={['#6A5AE0', '#34d399', '#6A5AE0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.clockedInGradientBorder}
        >
          <View style={styles.clockedInCard}>
            <View style={styles.clockedInContent}>
              {/* Left Side - Status & Progress */}
              <View style={styles.clockedInLeft}>
                {/* Status Row */}
                <View style={styles.clockedInStatusRow}>
                  {/* Animated Pulse Dot */}
                  <View style={styles.pulseDotWrapper}>
                    <View style={styles.pulseDot} />
                  </View>
                  
                  {/* Status Text */}
                  <Text style={styles.clockedInStatusText}>Currently Clocked In</Text>
                  
                  {/* On Break Badge - Only show when on break */}
                  {isOnBreak && (
                    <View style={styles.breakBadge}>
                      <Text style={styles.breakBadgeText}>On Break</Text>
                    </View>
                  )}
                </View>
                
                {/* Start Time */}
                <Text style={styles.clockedInStartTime}>Started at 08:45 AM</Text>
                
                {/* Progress Bar */}
                <View style={styles.clockedInProgressSection}>
                  <View style={styles.clockedInProgressBar}>
                    <LinearGradient
                      colors={['#34d399', '#10b981']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.clockedInProgressFill, { width: '65%' }]}
                    />
                  </View>
                  <View style={styles.clockedInProgressLabels}>
                    <Text style={styles.clockedInProgressLabel}>0h</Text>
                    <Text style={styles.clockedInProgressLabel}>8h goal</Text>
                  </View>
                </View>
              </View>
              
              {/* Right Side - Timer Badge */}
              <View style={styles.timerBadge}>
                <Text style={styles.timerBadgeText}>05:23</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Stacked Action Buttons */}
      <View style={styles.stackedButtonsContainer}>
        {/* Clock In - Dull when already clocked in */}
        <TouchableOpacity style={styles.stackedButton} onPress={handleClockInPress}>
          <LinearGradient
            colors={isClockedIn ? ['#6b7280', '#9ca3af'] : ['#10b981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.stackedButtonGradient}
          >
            <Text style={styles.stackedButtonText}>Clock In</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        {/* Clock Out - Dull when already clocked out */}
        <TouchableOpacity style={styles.stackedButton} onPress={handleClockOutPress}>
          <LinearGradient
            colors={!isClockedIn ? ['#6b7280', '#9ca3af'] : ['#fb7185', '#ef4444']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.stackedButtonGradient}
          >
            <Text style={styles.stackedButtonText}>Clock Out</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        {/* Take Break / Resume Work */}
        <TouchableOpacity style={styles.stackedButton} onPress={handleBreakToggle}>
          <LinearGradient
            colors={isOnBreak ? ['#10b981', '#059669'] : ['#fbbf24', '#f59e0b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.stackedButtonGradient}
          >
            <Text style={styles.stackedButtonText}>{isOnBreak ? 'Resume Work' : 'Take Break'}</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        {/* Add Another Stop */}
        <TouchableOpacity style={styles.outlineButton} onPress={() => setShowAddStopModal(true)}>
          <Text style={styles.outlineButtonText}>Add Another Stop</Text>
        </TouchableOpacity>
        
        {/* Daily Notes/Logs */}
        <TouchableOpacity style={styles.notesButton} onPress={openNotesModal}>
          <LinearGradient
            colors={['#6A5AE0', '#8B7CF0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.notesButtonGradient}
          >
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
              <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </Svg>
            <Text style={styles.notesButtonText}>Daily Notes/Logs</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Today's Summary - Full Box */}
      <View style={styles.summaryGradientWrapper}>
        <LinearGradient
          colors={['#6A5AE0', '#34d399']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryGradientBorder}
        >
          <View style={styles.summaryCard}>
            {/* Header Row */}
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>Today's Summary</Text>
              <Text style={styles.summaryDate}>Oct 29</Text>
            </View>
            
            {/* 3-Column Grid */}
            <View style={styles.summaryGrid}>
              {/* Column 1 - Worked */}
              <View style={styles.summaryColumn}>
                <View style={styles.summaryIconRow}>
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                    <Circle cx="12" cy="12" r="10" />
                    <Path d="M12 6v6l4 2" />
                  </Svg>
                  <Text style={styles.summaryLabel}>Worked</Text>
                </View>
                <Text style={styles.summaryValue}>8h 51m</Text>
                <View style={styles.summaryProgressBar}>
                  <View style={[styles.summaryProgressFill, styles.summaryProgressPurple, { width: '100%' }]} />
                </View>
              </View>
              
              {/* Column 2 - Break */}
              <View style={styles.summaryColumn}>
                <View style={styles.summaryIconRow}>
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="#64748b">
                    <Path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                  </Svg>
                  <Text style={styles.summaryLabel}>Break</Text>
                </View>
                <Text style={styles.summaryValue}>30m</Text>
                <View style={styles.summaryProgressBar}>
                  <View style={[styles.summaryProgressFill, styles.summaryProgressAmber, { width: '50%' }]} />
                </View>
              </View>
              
              {/* Column 3 - Earned */}
              <View style={styles.summaryColumn}>
                <View style={styles.summaryIconRow}>
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="#64748b">
                    <Circle cx="12" cy="12" r="10" />
                  </Svg>
                  <Text style={styles.summaryLabel}>Earned</Text>
                </View>
                <Text style={styles.summaryValueEarned}>$177</Text>
                <Text style={styles.summaryRate}>@ $20/hr</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Weekly Timesheet - Using Reusable Component */}
      <WeeklyTimesheet
        selectedWeekStart={selectedWeekStart}
        weeklyHours={weeklyHours}
        totalWeeklyHours={totalWeeklyHours}
        totalWeeklyPay={totalWeeklyPay}
        hourlyRate={hourlyRate}
        weeklyProgressPercent={weeklyProgressPercent}
        userName="Yefry S"
        userRole="Admin"
        userInitials="YS"
        onChangeWeek={() => setShowWeekCalendar(true)}
        onShowGrossPayInfo={() => setShowGrossPayInfo(true)}
      />

      {/* Tabs Section */}
      <View style={styles.recentSection}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'entries' && styles.tabActive]}
            onPress={() => setActiveTab('entries')}
          >
            <Text style={[styles.tabText, activeTab === 'entries' && styles.tabTextActive]}>Recent Entries</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'notes' && styles.tabActive]}
            onPress={() => setActiveTab('notes')}
          >
            <Text style={[styles.tabText, activeTab === 'notes' && styles.tabTextActive]}>Notes/Logs</Text>
            {savedNotes.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{savedNotes.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {activeTab === 'entries' && (
          <View>
          <Text style={styles.recentTitle}>Recent Entries</Text>
        
          <View style={styles.recentEntries}>
          {/* Entry 1 - Clock Out - Approved */}
          <View style={styles.entryCard}>
            <View style={styles.entryContent}>
              <View style={styles.entryLeft}>
                <View style={styles.entryAvatar}>
                  <Text style={styles.entryAvatarText}>YS</Text>
                </View>
                <View style={styles.entryDetails}>
                  <Text style={styles.entryAction}>Clock Out</Text>
                  <Text style={styles.entryLocation}>1452 S York St</Text>
                  <Text style={styles.entryCity}>Denver, CO 80210</Text>
                </View>
              </View>
              <View style={styles.entryRight}>
                <View style={styles.entryTime}>
                  <Text style={styles.entryTimeText}>05:30 PM</Text>
                  <Text style={styles.entryDateText}>Today</Text>
                </View>
                <View style={[styles.entryBadge, styles.entryBadgeApproved]}>
                  <Text style={styles.entryBadgeText}>Approved</Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Entry 2 - Clock In - Submitted */}
          <View style={styles.entryCard}>
            <View style={styles.entryContent}>
              <View style={styles.entryLeft}>
                <View style={styles.entryAvatar}>
                  <Text style={styles.entryAvatarText}>YS</Text>
                </View>
                <View style={styles.entryDetails}>
                  <Text style={styles.entryAction}>Clock In</Text>
                  <Text style={styles.entryLocation}>1452 S York St</Text>
                  <Text style={styles.entryCity}>Denver, CO 80210</Text>
                </View>
              </View>
              <View style={styles.entryRight}>
                <View style={styles.entryTime}>
                  <Text style={styles.entryTimeText}>09:11 AM</Text>
                  <Text style={styles.entryDateText}>Today</Text>
                </View>
                <View style={[styles.entryBadge, styles.entryBadgeSubmitted]}>
                  <Text style={styles.entryBadgeText}>Submitted</Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Entry 3 - Clock In - In Review */}
          <View style={styles.entryCard}>
            <View style={styles.entryContent}>
              <View style={styles.entryLeft}>
                <View style={styles.entryAvatar}>
                  <Text style={styles.entryAvatarText}>YS</Text>
                </View>
                <View style={styles.entryDetails}>
                  <Text style={styles.entryAction}>Clock In</Text>
                  <Text style={styles.entryLocation}>789 E Colfax Ave</Text>
                  <Text style={styles.entryCity}>Denver, CO 80203</Text>
                </View>
              </View>
              <View style={styles.entryRight}>
                <View style={styles.entryTime}>
                  <Text style={styles.entryTimeText}>09:00 AM</Text>
                  <Text style={styles.entryDateText}>Yesterday</Text>
                </View>
                <View style={[styles.entryBadge, styles.entryBadgeReview]}>
                  <Text style={styles.entryBadgeText}>In Review</Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Entry 4 - Clock Out - Denied */}
          <View style={styles.entryCard}>
            <View style={styles.entryContent}>
              <View style={styles.entryLeft}>
                <View style={styles.entryAvatar}>
                  <Text style={styles.entryAvatarText}>YS</Text>
                </View>
                <View style={styles.entryDetails}>
                  <Text style={styles.entryAction}>Clock Out</Text>
                  <Text style={styles.entryLocation}>321 W 16th Ave</Text>
                  <Text style={styles.entryCity}>Denver, CO 80204</Text>
                </View>
              </View>
              <View style={styles.entryRight}>
                <View style={styles.entryTime}>
                  <Text style={styles.entryTimeText}>06:00 PM</Text>
                  <Text style={styles.entryDateText}>Nov 4</Text>
                </View>
                <View style={[styles.entryBadge, styles.entryBadgeDenied]}>
                  <Text style={styles.entryBadgeText}>Denied</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
        </View>
        )}

        {activeTab === 'notes' && (
          <View style={styles.notesLogsList}>
            {savedNotes.length === 0 ? (
              <View style={styles.emptyNotesContainer}>
                <Svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                  <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                </Svg>
                <Text style={styles.emptyNotesText}>No notes/logs yet</Text>
                <Text style={styles.emptyNotesSubtext}>Save a Daily Notes/Logs to see it here</Text>
              </View>
            ) : (
              savedNotes.map((note) => (
                <TouchableOpacity 
                  key={note.id} 
                  style={styles.noteCard}
                  onPress={() => openNoteCard(note.id)}
                  activeOpacity={selectedNoteId === note.id ? 1 : 0.7}
                >
                  <View style={styles.noteCardHeader}>
                    <View style={styles.noteCardLeft}>
                      <View style={styles.noteIconContainer}>
                        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6A5AE0" strokeWidth="2">
                          <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                        </Svg>
                      </View>
                      <View style={styles.noteCardInfo}>
                        <Text style={styles.noteCardProject}>{note.project}</Text>
                        <Text style={styles.noteCardByUser}>By: John Smith</Text>
                        {note.title ? <Text style={styles.noteCardTitle}>{note.title}</Text> : null}
                      </View>
                    </View>
                    <View style={styles.noteCardRight}>
                      <Text style={styles.noteCardDate}>{formatDisplayDate(note.date)}</Text>
                      <Text style={styles.noteCardTime}>{note.time}</Text>
                    </View>
                  </View>
                  
                  {selectedNoteId === note.id && (
                    <View style={styles.noteCardExpanded}>
                      {note.content ? (
                        <View style={styles.noteContentBox}>
                          <Text style={styles.noteContentLabel}>Notes:</Text>
                          <Text style={styles.noteContentText}>{note.content}</Text>
                        </View>
                      ) : null}
                      
                      {/* Audio Section in Saved Note */}
                      {note.audioUri && (
                        <View style={styles.noteAudioSection}>
                          <View style={styles.noteAudioHeader}>
                            <Svg width="16" height="16" viewBox="0 0 24 24" fill="#6A5AE0">
                              <Path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                              <Path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                            </Svg>
                            <Text style={styles.noteAudioLabel}>Audio Recording</Text>
                          </View>
                          <TouchableOpacity 
                            style={styles.noteAudioPlayer}
                            onPress={() => playNoteAudio(note.id, note.audioUri)}
                            activeOpacity={0.7}
                          >
                            <View style={[styles.noteAudioIcon, playingNoteId === note.id && styles.noteAudioIconPlaying]}>
                              <Svg width="18" height="18" viewBox="0 0 24 24" fill={playingNoteId === note.id ? "#ffffff" : "#6A5AE0"}>
                                {playingNoteId === note.id ? (
                                  <Path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                ) : (
                                  <Path d="M8 5v14l11-7z" />
                                )}
                              </Svg>
                            </View>
                            <View style={styles.noteAudioWaveform}>
                              {[...Array(20)].map((_, i) => (
                                <View key={i} style={[styles.noteWaveBar, { height: 4 + Math.sin(i * 0.5) * 10 + 6, opacity: playingNoteId === note.id ? 1 : 0.7 }]} />
                              ))}
                            </View>
                            <Text style={styles.noteAudioPlayText}>{playingNoteId === note.id ? 'Playing...' : 'Tap to play'}</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      
                      {/* Transcript Section in Saved Note */}
                      {note.transcript && (
                        <View style={styles.noteTranscriptSection}>
                          <View style={styles.noteTranscriptHeader}>
                            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6A5AE0" strokeWidth="2">
                              <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                              <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                            </Svg>
                            <Text style={styles.noteTranscriptLabel}>Transcript</Text>
                          </View>
                          <View style={styles.noteTranscriptContent}>
                            <Text style={styles.noteTranscriptText}>{note.transcript}</Text>
                          </View>
                        </View>
                      )}
                      
                      {note.photos.length > 0 && (
                        <View style={styles.notePhotosSection}>
                          <Text style={styles.notePhotosLabel}>Photos ({note.photos.length})</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.notePhotosScroll}>
                            {note.photos.map((photo, index) => (
                              <TouchableOpacity 
                                key={index} 
                                onPress={() => openImageViewer(photo)}
                                style={styles.notePhotoThumb}
                              >
                                <Image source={{ uri: photo }} style={styles.notePhotoImage} />
                                <View style={styles.notePhotoOverlay}>
                                  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                                    <Path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                                  </Svg>
                                </View>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  )}
                  
                  <View style={styles.noteCardFooter}>
                    <View style={styles.noteFooterBadges}>
                      <View style={styles.notePhotosBadge}>
                        <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                          <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <Circle cx="8.5" cy="8.5" r="1.5" />
                          <Path d="M21 15l-5-5L5 21" />
                        </Svg>
                        <Text style={styles.notePhotosBadgeText}>{note.photos.length} photos</Text>
                      </View>
                      {note.audioUri && (
                        <View style={styles.noteAudioBadge}>
                          <Svg width="14" height="14" viewBox="0 0 24 24" fill="#6A5AE0">
                            <Path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                            <Path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                          </Svg>
                          <Text style={styles.noteAudioBadgeText}>Audio</Text>
                        </View>
                      )}
                    </View>
                    {selectedNoteId === note.id ? (
                      <TouchableOpacity onPress={closeNoteCard} style={styles.closeArrowButton}>
                        <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6A5AE0" strokeWidth="2.5">
                          <Path d="M18 15l-6-6-6 6" />
                        </Svg>
                      </TouchableOpacity>
                    ) : (
                      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                        <Path d="M6 9l6 6 6-6" />
                      </Svg>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </View>

      {/* Full Screen Image Viewer Modal */}
      <Modal
        visible={showImageViewer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageViewer(false)}
      >
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity 
            style={styles.imageViewerClose}
            onPress={() => setShowImageViewer(false)}
          >
            <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
              <Path d="M6 18L18 6M6 6l12 12" />
            </Svg>
          </TouchableOpacity>
          <Image 
            source={{ uri: selectedImage }} 
            style={styles.imageViewerImage}
            resizeMode="contain"
          />
        </View>
      </Modal>

      {/* Bottom spacing */}
      <View style={{ height: 100 }} />

      {/* Clock In Location Modal */}
      <Modal
        visible={showClockInModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowClockInModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nearby Locations</Text>
              <TouchableOpacity onPress={() => setShowClockInModal(false)} style={styles.modalCloseButton}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                  <Path d="M6 18L18 6M6 6l12 12" />
                </Svg>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Select your clock-in location</Text>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <Circle cx="11" cy="11" r="8" />
                <Path d="M21 21l-4.35-4.35" />
              </Svg>
              <TextInput
                style={styles.searchInput}
                placeholder="Search Address"
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Auto-Detected Location (Top Pick) */}
            {closestProject && (
              <TouchableOpacity 
                style={styles.topPickCard}
                onPress={() => handleSelectLocation(closestProject)}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.topPickGradient}
                >
                  <View style={styles.topPickContent}>
                    <View style={styles.topPickIcon}>
                      <Svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </Svg>
                    </View>
                    <View style={styles.topPickText}>
                      <Text style={styles.topPickLabel}>Your closest location</Text>
                      <Text style={styles.topPickSublabel}>Auto-Detected nearest site</Text>
                      <Text style={styles.topPickProjectName}>{closestProject.name}</Text>
                      <Text style={styles.topPickProjectAddress}>{closestProject.street}</Text>
                      <Text style={styles.topPickProjectAddress}>{closestProject.city}</Text>
                    </View>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <Path d="M9 18l6-6-6-6" />
                    </Svg>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* All Projects List */}
            <Text style={styles.allProjectsLabel}>All Projects</Text>
            <ScrollView style={styles.projectsList} showsVerticalScrollIndicator={false}>
              {filteredProjects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={styles.projectItem}
                  onPress={() => handleSelectLocation(project)}
                >
                  <View style={styles.projectIconContainer}>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="#6A5AE0">
                      <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </Svg>
                  </View>
                  <View style={styles.projectInfo}>
                    <Text style={styles.projectName}>{project.name}</Text>
                    <Text style={styles.projectAddress}>{project.street}</Text>
                    <Text style={styles.projectAddressCity}>{project.city}</Text>
                  </View>
                  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                    <Path d="M9 18l6-6-6-6" />
                  </Svg>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Another Stop Modal */}
      <Modal
        visible={showAddStopModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddStopModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nearby Locations</Text>
              <TouchableOpacity onPress={() => setShowAddStopModal(false)} style={styles.modalCloseButton}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                  <Path d="M6 18L18 6M6 6l12 12" />
                </Svg>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Select your stop location</Text>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <Circle cx="11" cy="11" r="8" />
                <Path d="M21 21l-4.35-4.35" />
              </Svg>
              <TextInput
                style={styles.searchInput}
                placeholder="Search Address"
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Auto-Detected Location (Top Pick) */}
            {closestProject && (
              <TouchableOpacity 
                style={styles.topPickCard}
                onPress={() => handleSelectStop(closestProject)}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.topPickGradient}
                >
                  <View style={styles.topPickContent}>
                    <View style={styles.topPickIcon}>
                      <Svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </Svg>
                    </View>
                    <View style={styles.topPickText}>
                      <Text style={styles.topPickLabel}>Your closest location</Text>
                      <Text style={styles.topPickSublabel}>Auto-Detected nearest site</Text>
                      <Text style={styles.topPickProjectName}>{closestProject.name}</Text>
                      <Text style={styles.topPickProjectAddress}>{closestProject.street}</Text>
                      <Text style={styles.topPickProjectAddress}>{closestProject.city}</Text>
                    </View>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <Path d="M9 18l6-6-6-6" />
                    </Svg>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* All Projects List */}
            <Text style={styles.allProjectsLabel}>All Projects</Text>
            <ScrollView style={styles.projectsList} showsVerticalScrollIndicator={false}>
              {filteredProjects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={styles.projectItem}
                  onPress={() => handleSelectStop(project)}
                >
                  <View style={styles.projectIconContainer}>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="#6A5AE0">
                      <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </Svg>
                  </View>
                  <View style={styles.projectInfo}>
                    <Text style={styles.projectName}>{project.name}</Text>
                    <Text style={styles.projectAddress}>{project.street}</Text>
                    <Text style={styles.projectAddressCity}>{project.city}</Text>
                  </View>
                  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                    <Path d="M9 18l6-6-6-6" />
                  </Svg>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Clock Out Options Modal - Using Reusable Component */}
      <ClockOutOptionsModal
        visible={showClockOutOptionsModal}
        onClockOutDirect={handleDirectClockOut}
        onClockOutWithNotes={handleClockOutWithNotes}
        onClose={() => setShowClockOutOptionsModal(false)}
      />

      {/* Reusable Modals */}
      <CustomAlertModal
        visible={showAlertModal}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setShowAlertModal(false)}
      />

      <GrossPayInfoModal
        visible={showGrossPayInfo}
        onClose={() => setShowGrossPayInfo(false)}
      />

      <WeekCalendarModal
        visible={showWeekCalendar}
        selectedWeekStart={selectedWeekStart}
        onSelectWeek={handleWeekSelect}
        onClose={() => setShowWeekCalendar(false)}
      />

      {/* Daily Notes/Logs Modal */}
      <Modal
        visible={showNotesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNotesModal(false)}
      >
        <View style={styles.notesModalOverlay}>
          <View style={styles.notesModalContainer}>
            {/* Header */}
            <LinearGradient
              colors={['#6A5AE0', '#8B7CF0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.notesModalHeaderGradient}
            >
              <View style={styles.notesModalHeaderContent}>
                <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                  <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                </Svg>
                <Text style={styles.notesModalTitleWhite}>Daily Notes/Logs</Text>
              </View>
              <TouchableOpacity onPress={() => { setShowNotesModal(false); setIsClockOutWithNotes(false); }} style={styles.modalCloseButtonWhite}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                  <Path d="M6 18L18 6M6 6l12 12" />
                </Svg>
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.notesScrollView} showsVerticalScrollIndicator={false}>
              {/* Project Field - Fixed/Read-only */}
              <View style={styles.notesFieldContainer}>
                <Text style={styles.notesFieldLabel}>Project</Text>
                <View style={styles.fixedTitleContainer}>
                  <Text style={styles.fixedTitleText}>{noteTitle}</Text>
                  <View style={styles.lockedBadge}>
                    <Svg width="12" height="12" viewBox="0 0 24 24" fill="#6A5AE0">
                      <Path d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zm-7 5a1 1 0 110-2 1 1 0 010 2zm3-5V8a3 3 0 00-6 0v3h6z" />
                    </Svg>
                  </View>
                </View>
              </View>

              {/* Title Field (Optional) */}
              <View style={styles.notesFieldContainer}>
                <Text style={styles.notesFieldLabel}>Title <Text style={styles.optionalLabel}>(optional)</Text></Text>
                <TextInput
                  style={styles.notesInput}
                  value={noteSubTitle}
                  onChangeText={setNoteSubTitle}
                  placeholder="Enter sub-title"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              {/* Date & Time Row */}
              <View style={styles.dateTimeRow}>
                {/* Date Field - Modern Calendar Picker */}
                <View style={styles.dateFieldContainer}>
                  <Text style={styles.notesFieldLabel}>Date</Text>
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePickerModal(true)}
                  >
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6A5AE0" strokeWidth="2">
                      <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <Path d="M16 2v4M8 2v4M3 10h18" />
                    </Svg>
                    <Text style={styles.datePickerText}>{formatDisplayDate(noteDate)}</Text>
                  </TouchableOpacity>
                </View>

                {/* Time Field - Fixed/Read-only */}
                <View style={styles.timeFieldContainer}>
                  <Text style={styles.notesFieldLabel}>Time</Text>
                  <View style={styles.fixedTimeContainer}>
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6A5AE0" strokeWidth="2">
                      <Circle cx="12" cy="12" r="10" />
                      <Path d="M12 6v6l4 2" />
                    </Svg>
                    <Text style={styles.fixedTimeText}>{formatDisplayTime(new Date())}</Text>
                    <View style={styles.lockedBadgeSmall}>
                      <Svg width="10" height="10" viewBox="0 0 24 24" fill="#6A5AE0">
                        <Path d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zm-7 5a1 1 0 110-2 1 1 0 010 2zm3-5V8a3 3 0 00-6 0v3h6z" />
                      </Svg>
                    </View>
                  </View>
                </View>
              </View>

              {/* Notes / Logs Field */}
              <View style={styles.notesFieldContainer}>
                <Text style={styles.notesFieldLabel}>Notes / Logs</Text>
                <TextInput
                  style={styles.notesTextArea}
                  value={noteContent}
                  onChangeText={setNoteContent}
                  placeholder="Add your notes here..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>

              {/* Audio Recording Section */}
              <View style={styles.notesFieldContainer}>
                <Text style={styles.notesFieldLabel}>Record Audio</Text>
                <View style={styles.audioRecordingContainer}>
                  {!audioUri ? (
                    // Recording UI
                    <View style={styles.recordingSection}>
                      <TouchableOpacity
                        style={[styles.recordButton, isRecording && styles.recordButtonActive]}
                        onPress={isRecording ? stopRecording : startRecording}
                      >
                        <LinearGradient
                          colors={isRecording ? ['#ef4444', '#dc2626'] : ['#6A5AE0', '#8B7CF0']}
                          style={styles.recordButtonGradient}
                        >
                          {isRecording ? (
                            <View style={styles.stopIcon} />
                          ) : (
                            <Svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff">
                              <Path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                              <Path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                            </Svg>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                      <View style={styles.recordingInfo}>
                        <Text style={styles.recordingStatus}>
                          {isRecording ? 'Recording...' : 'Tap to record'}
                        </Text>
                        <Text style={styles.recordingDuration}>
                          {formatDuration(recordingDuration)}
                        </Text>
                      </View>
                      {isRecording && (
                        <View style={styles.recordingWave}>
                          {[...Array(5)].map((_, i) => (
                            <View key={i} style={[styles.waveBar, { height: 8 + Math.random() * 16 }]} />
                          ))}
                        </View>
                      )}
                    </View>
                  ) : (
                    // Playback UI
                    <View style={styles.playbackSection}>
                      <View style={styles.playbackControls}>
                        <TouchableOpacity style={styles.playButton} onPress={playAudio}>
                          <LinearGradient
                            colors={['#6A5AE0', '#8B7CF0']}
                            style={styles.playButtonGradient}
                          >
                            <Svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
                              {isPlaying ? (
                                <Path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                              ) : (
                                <Path d="M8 5v14l11-7z" />
                              )}
                            </Svg>
                          </LinearGradient>
                        </TouchableOpacity>
                        <View style={styles.sliderContainer}>
                          <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={playbackDuration}
                            value={playbackPosition}
                            onSlidingComplete={seekAudio}
                            minimumTrackTintColor="#6A5AE0"
                            maximumTrackTintColor="#e2e8f0"
                            thumbTintColor="#6A5AE0"
                          />
                          <View style={styles.sliderLabels}>
                            <Text style={styles.sliderTime}>{formatDuration(playbackPosition)}</Text>
                            <Text style={styles.sliderTime}>{formatDuration(playbackDuration)}</Text>
                          </View>
                        </View>
                        <TouchableOpacity style={styles.deleteAudioButton} onPress={deleteRecording}>
                          <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                            <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </Svg>
                        </TouchableOpacity>
                      </View>
                      
                      {/* Transcription Section */}
                      <View style={styles.transcriptionSection}>
                        <View style={styles.transcriptionHeader}>
                          <Text style={styles.transcriptionLabel}>Transcript</Text>
                          {isTranscribing && (
                            <View style={styles.transcribingBadge}>
                              <Text style={styles.transcribingText}>Transcribing...</Text>
                            </View>
                          )}
                        </View>
                        <TextInput
                          style={styles.transcriptTextArea}
                          value={transcript}
                          onChangeText={setTranscript}
                          placeholder="Transcript will appear here..."
                          placeholderTextColor="#94a3b8"
                          multiline
                          numberOfLines={6}
                          textAlignVertical="top"
                        />
                        <View style={styles.transcriptActions}>
                          <TouchableOpacity 
                            style={styles.transcriptActionButton}
                            onPress={() => {
                              if (transcript) {
                                Alert.alert('Copied!', 'Transcript copied to clipboard');
                              }
                            }}
                          >
                            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6A5AE0" strokeWidth="2">
                              <Rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <Path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                            </Svg>
                            <Text style={styles.transcriptActionText}>Copy</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.transcriptActionButton}
                            onPress={() => setTranscript('')}
                          >
                            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                              <Path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </Svg>
                            <Text style={styles.transcriptActionText}>Clear</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Photos Section */}
              {capturedPhotos.length > 0 && (
                <View style={styles.notesFieldContainer}>
                  <Text style={styles.notesFieldLabel}>Photos ({capturedPhotos.length})</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScrollView}>
                    {capturedPhotos.map((uri, index) => (
                      <View key={index} style={styles.photoThumbnailContainer}>
                        <Image source={{ uri }} style={styles.photoThumbnail} />
                        <TouchableOpacity 
                          style={styles.removePhotoButton}
                          onPress={() => removePhoto(index)}
                        >
                          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
                            <Path d="M6 18L18 6M6 6l12 12" />
                          </Svg>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Save Button - Shows "Save and Clock Out" when coming from clock out flow */}
              {isClockOutWithNotes ? (
                <TouchableOpacity style={styles.saveNoteButton} onPress={handleSaveAndClockOut}>
                  <LinearGradient
                    colors={['#fb7185', '#ef4444']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveNoteGradient}
                  >
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" style={{ marginRight: 8 }}>
                      <Circle cx="12" cy="12" r="10" />
                      <Path d="M12 6v6l4 2" />
                    </Svg>
                    <Text style={styles.saveNoteText}>Save and Clock Out</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.saveNoteButton} onPress={handleSaveNote}>
                  <LinearGradient
                    colors={['#6A5AE0', '#8B7CF0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveNoteGradient}
                  >
                    <Text style={styles.saveNoteText}>Save Log</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </ScrollView>

            {/* FAB Menu */}
            {showFabMenu && (
              <View style={styles.fabMenuContainer}>
                <TouchableOpacity style={styles.fabMenuItem} onPress={handleTakePhotos}>
                  <View style={styles.fabMenuIconBg}>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                      <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                      <Circle cx="12" cy="13" r="4" />
                    </Svg>
                  </View>
                  <Text style={styles.fabMenuText}>Take Photos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.fabMenuItem} onPress={handleUploadPhotos}>
                  <View style={[styles.fabMenuIconBg, { backgroundColor: '#10b981' }]}>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                      <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </Svg>
                  </View>
                  <Text style={styles.fabMenuText}>Upload Photos</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* FAB Button */}
            <TouchableOpacity 
              style={[styles.fabButton, showFabMenu && styles.fabButtonActive]}
              onPress={() => setShowFabMenu(!showFabMenu)}
            >
              <LinearGradient
                colors={showFabMenu ? ['#ef4444', '#dc2626'] : ['#6A5AE0', '#8B7CF0']}
                style={styles.fabGradient}
              >
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
                  {showFabMenu ? (
                    <Path d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <Path d="M12 5v14M5 12h14" />
                  )}
                </Svg>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modern Date Picker Modal */}
      <Modal
        visible={showDatePickerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePickerModal(false)}
      >
        <View style={styles.dateModalOverlay}>
          <View style={styles.dateModalContainer}>
            <View style={styles.dateModalHeader}>
              <Text style={styles.dateModalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDatePickerModal(false)}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                  <Path d="M6 18L18 6M6 6l12 12" />
                </Svg>
              </TouchableOpacity>
            </View>
            <Calendar
              current={noteDate.toISOString().split('T')[0]}
              markedDates={{
                [noteDate.toISOString().split('T')[0]]: { selected: true, selectedColor: '#6A5AE0' }
              }}
              onDayPress={handleDateSelect}
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#64748b',
                selectedDayBackgroundColor: '#6A5AE0',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#6A5AE0',
                dayTextColor: '#0f172a',
                textDisabledColor: '#d1d5db',
                arrowColor: '#6A5AE0',
                monthTextColor: '#0f172a',
                textDayFontWeight: '500',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
              style={styles.calendarStyle}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  timeSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timeText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  dateText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  currentLocationBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#ffffff',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 16,
  },
  locationBoxGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  locationBoxContent: {
    position: 'relative',
  },
  locationBoxTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  mapPlaceholder: {
    height: 96,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  mapPlaceholderText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
  },
  locationAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationAddressText: {
    flex: 1,
  },
  locationAddressMain: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
  locationAddressSecondary: {
    fontSize: 12,
    color: '#64748b',
  },
  locationProjectName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6A5AE0',
    marginTop: 4,
  },
  clockedInWrapper: {
    marginBottom: 16,
  },
  clockedInGradientBorder: {
    padding: 1,
    borderRadius: 16,
  },
  clockedInCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    padding: 16,
  },
  clockedInContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  clockedInLeft: {
    flex: 1,
  },
  clockedInStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  pulseDotWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  clockedInStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  breakBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
  },
  breakBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#b45309',
  },
  clockedInStartTime: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },
  clockedInProgressSection: {
    gap: 4,
  },
  clockedInProgressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  clockedInProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  clockedInProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clockedInProgressLabel: {
    fontSize: 10,
    color: '#94a3b8',
  },
  timerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#d1fae5',
    borderRadius: 16,
    marginLeft: 12,
  },
  timerBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#047857',
  },
  stackedButtonsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  stackedButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  stackedButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackedButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  outlineButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  outlineButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6A5AE0',
  },
  summaryGradientWrapper: {
    marginBottom: 16,
  },
  summaryGradientBorder: {
    padding: 1,
    borderRadius: 16,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    padding: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  summaryDate: {
    fontSize: 11,
    color: '#64748b',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryColumn: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  summaryIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  summaryValueEarned: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 4,
  },
  summaryRate: {
    fontSize: 10,
    color: '#94a3b8',
  },
  summaryProgressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  summaryProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  summaryProgressPurple: {
    backgroundColor: '#6A5AE0',
  },
  summaryProgressAmber: {
    backgroundColor: '#fbbf24',
  },
  timesheetGradientWrapper: {
    marginBottom: 16,
  },
  timesheetGradientBorder: {
    padding: 1,
    borderRadius: 16,
  },
  timesheetCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  timesheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  timesheetTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  timesheetDate: {
    fontSize: 11,
    color: '#64748b',
  },
  timesheetButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  changeButtonText: {
    fontSize: 12,
    color: '#334155',
  },
  exportButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#6A5AE0',
  },
  exportButtonText: {
    fontSize: 12,
    color: '#ffffff',
  },
  timesheetContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  employeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6A5AE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeAvatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  employeeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  employeeRole: {
    fontSize: 12,
    color: '#64748b',
  },
  expandedContent: {
    gap: 12,
  },
  hoursPayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  totalHours: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  weekLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  payChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#6ee7b7',
  },
  payChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#047857',
  },
  // New Pay Section Styles
  paySection: {
    alignItems: 'flex-end',
  },
  grossPayLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  grossPayText: {
    fontSize: 12,
    color: '#6A5AE0',
    fontWeight: '500',
  },
  payAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#047857',
  },
  payRate: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  // Gross Pay Modal Styles
  grossPayModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 380,
  },
  grossPayModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  grossPayIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0efff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  grossPayModalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  grossPayModalText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 12,
  },
  grossPayModalNote: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  grossPayModalButton: {
    backgroundColor: '#6A5AE0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  grossPayModalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
    marginTop: 12,
    gap: 6,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barContainer: {
    width: 8,
    height: 56,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    backgroundColor: '#6A5AE0',
    borderRadius: 4,
    position: 'absolute',
    bottom: 0,
  },
  barLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  barHoursLabel: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '600',
  },
  weeklyProgress: {
    marginTop: 12,
  },
  weeklyProgressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  weeklyProgressFill: {
    height: '100%',
    backgroundColor: '#6A5AE0',
  },
  weeklyProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  weeklyProgressLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  recentSection: {
    marginBottom: 16,
  },
  // Tabs styles
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#6A5AE0',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#6A5AE0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  // Notes/Logs list styles
  notesLogsList: {
    gap: 12,
  },
  emptyNotesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyNotesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  emptyNotesSubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
  noteCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
  },
  noteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  noteCardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  noteIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteCardInfo: {
    flex: 1,
  },
  noteCardProject: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  noteCardByUser: {
    fontSize: 12,
    color: '#6A5AE0',
    fontWeight: '500',
    marginTop: 1,
  },
  noteCardTitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  noteCardRight: {
    alignItems: 'flex-end',
  },
  noteCardDate: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0f172a',
  },
  noteCardTime: {
    fontSize: 12,
    color: '#6A5AE0',
  },
  noteCardExpanded: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  noteContentBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  noteContentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  noteContentText: {
    fontSize: 14,
    color: '#0f172a',
    lineHeight: 20,
  },
  notePhotosSection: {
    marginTop: 4,
  },
  notePhotosLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  notePhotosScroll: {
    flexDirection: 'row',
  },
  notePhotoThumb: {
    position: 'relative',
    marginRight: 10,
  },
  notePhotoImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  notePhotoOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    padding: 4,
  },
  noteCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  noteFooterBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notePhotosBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notePhotosBadgeText: {
    fontSize: 12,
    color: '#64748b',
  },
  noteAudioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noteAudioBadgeText: {
    fontSize: 12,
    color: '#6A5AE0',
    fontWeight: '500',
  },
  // Audio section in saved notes
  noteAudioSection: {
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  noteAudioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  noteAudioLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A5AE0',
  },
  noteAudioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  noteAudioIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteAudioIconPlaying: {
    backgroundColor: '#6A5AE0',
  },
  noteAudioWaveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 30,
  },
  noteWaveBar: {
    width: 3,
    backgroundColor: '#6A5AE0',
    borderRadius: 2,
  },
  noteAudioPlayText: {
    fontSize: 12,
    color: '#6A5AE0',
    fontWeight: '500',
  },
  closeArrowButton: {
    padding: 8,
    marginRight: -8,
  },
  // Transcript section in saved notes
  noteTranscriptSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  noteTranscriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  noteTranscriptLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A5AE0',
  },
  noteTranscriptContent: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 10,
  },
  noteTranscriptText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  // Image viewer modal
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  imageViewerImage: {
    width: '100%',
    height: '80%',
  },
  // Audio recording styles
  audioRecordingContainer: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
  },
  recordingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  recordButton: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  recordButtonActive: {},
  recordButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  recordingDuration: {
    fontSize: 14,
    color: '#6A5AE0',
    marginTop: 2,
  },
  recordingWave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  waveBar: {
    width: 4,
    backgroundColor: '#ef4444',
    borderRadius: 2,
  },
  playbackSection: {
    gap: 16,
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  playButtonGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderContainer: {
    flex: 1,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  sliderTime: {
    fontSize: 12,
    color: '#64748b',
  },
  deleteAudioButton: {
    padding: 8,
  },
  transcriptionSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  transcriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  transcriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  transcribingBadge: {
    backgroundColor: '#6A5AE0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  transcribingText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '600',
  },
  transcriptTextArea: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  transcriptActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  transcriptActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
  },
  transcriptActionText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  recentTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  recentEntries: {
    gap: 8,
  },
  entryCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
  },
  entryContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
  },
  entryAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryAvatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  entryDetails: {
    flex: 1,
  },
  entryAction: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
  entryLocation: {
    fontSize: 12,
    color: '#64748b',
  },
  entryCity: {
    fontSize: 10,
    color: '#94a3b8',
  },
  entryRight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  entryTime: {
    alignItems: 'flex-end',
  },
  entryTimeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#334155',
  },
  entryDateText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  entryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  entryBadgeApproved: {
    backgroundColor: '#d1fae5',
    borderColor: '#6ee7b7',
  },
  entryBadgeSubmitted: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  entryBadgeReview: {
    backgroundColor: '#f3e8ff',
    borderColor: '#d8b4fe',
  },
  entryBadgeDenied: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  entryBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#047857',
  },
  // Modal Styles
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  // Custom Alert Modal Styles
  alertModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 340,
    alignItems: 'center',
  },
  alertModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },
  alertModalMessage: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  alertModalButton: {
    backgroundColor: '#6A5AE0',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  alertModalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Week Calendar Modal Styles
  weekCalendarContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    width: '95%',
    maxWidth: 400,
  },
  weekCalendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  weekCalendarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  weekCalendarSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
  },
  weekCalendarInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
  },
  weekCalendarInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6A5AE0',
  },
  // Clock Out Options Modal Styles
  clockOutOptionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  clockOutOptionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  clockOutOptionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  clockOutOptionsSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  clockOutOptionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  clockOutOptionGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  clockOutOptionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
  },
  topPickCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  topPickGradient: {
    padding: 16,
  },
  topPickContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topPickIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topPickText: {
    flex: 1,
  },
  topPickLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  topPickSublabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  topPickProjectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 8,
  },
  topPickProjectAddress: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  allProjectsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  projectsList: {
    maxHeight: 300,
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  projectIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  projectAddress: {
    fontSize: 13,
    color: '#64748b',
  },
  projectAddressCity: {
    fontSize: 12,
    color: '#94a3b8',
  },
  // Notes Modal Styles
  notesModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  notesModalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  notesModalHeaderGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: -20,
    marginTop: -20,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  notesModalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notesModalTitleWhite: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalCloseButtonWhite: {
    padding: 4,
  },
  notesButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  notesButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  notesButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  notesModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  notesModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  notesScrollView: {
    marginBottom: 80,
  },
  notesFieldContainer: {
    marginBottom: 20,
  },
  notesFieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0f172a',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  datePickerText: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  notesTextArea: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0f172a',
    minHeight: 140,
  },
  saveNoteButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  saveNoteGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveNoteText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  fabMenuContainer: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    gap: 12,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  fabMenuIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6A5AE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabMenuText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 28,
    overflow: 'hidden',
  },
  fabButtonActive: {},
  fabGradient: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Fixed Title styles
  fixedTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fixedTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A5AE0',
  },
  lockedBadge: {
    backgroundColor: '#ede9fe',
    padding: 6,
    borderRadius: 6,
  },
  optionalLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#94a3b8',
  },
  // Photos section styles
  photosScrollView: {
    marginTop: 8,
  },
  photoThumbnailContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Date picker modal styles
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dateModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 340,
  },
  dateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  calendarStyle: {
    borderRadius: 12,
    marginBottom: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  dateFieldContainer: {
    flex: 1,
  },
  timeFieldContainer: {
    flex: 1,
  },
  fixedTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 8,
  },
  fixedTimeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#6A5AE0',
  },
  lockedBadgeSmall: {
    backgroundColor: '#ede9fe',
    padding: 4,
    borderRadius: 4,
  },
  dateConfirmButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 16,
  },
  dateConfirmGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  dateConfirmText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
