import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Calendar } from 'react-native-calendars';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';

// Import reusable components
import { WeeklyTimesheet } from './tracker';
import { CustomAlertModal, GrossPayInfoModal, WeekCalendarModal, ClockOutOptionsModal } from './tracker/modals';

/**
 * TIME TRACKER #3 (AUTOMATED)
 * Fully automated GPS-based tracking.
 * Automatically clocks in/out when arriving at or leaving job sites.
 * Edit this file ONLY for Time Tracker #3 changes.
 */

// Helper to format date as "Dec 17, 2025"
const formatDisplayDate = (date: Date) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

// Helper to format time as "02:45 PM"
const formatDisplayTime = (date: Date) => {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

// Helper to format date as "MM/DD"
const formatShortDate = (date: Date) => {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}/${day}`;
};

export default function TimeTrackerAutomated() {
  const [activeTab, setActiveTab] = useState<'activity' | 'notes'>('activity');
  
  // Weekly Timesheet state
  const [showWeekCalendar, setShowWeekCalendar] = useState(false);
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  });
  
  const getWeeklyHoursData = (weekStart: Date) => {
    const weekKey = weekStart.toISOString().split('T')[0];
    const mockData: { [key: string]: number[] } = {
      '2024-12-16': [0, 8, 7.5, 8, 8, 6.5, 0],
      '2024-12-09': [0, 7, 8, 8, 7.5, 8, 0],
      '2024-12-02': [0, 8, 8, 6, 8, 8, 0],
      '2024-11-25': [0, 6, 7, 8, 8, 7, 0],
    };
    if (mockData[weekKey]) return mockData[weekKey];
    const seed = weekStart.getTime();
    return [0, 7 + (seed % 2), 7.5 + ((seed >> 1) % 1.5), 8, 7 + ((seed >> 2) % 2), 6.5 + ((seed >> 3) % 2), 0];
  };
  
  const [weeklyHours, setWeeklyHours] = useState<number[]>(() => getWeeklyHoursData(selectedWeekStart));
  const hourlyRate = 20;
  const totalWeeklyHours = weeklyHours.reduce((sum, h) => sum + h, 0);
  const totalWeeklyPay = totalWeeklyHours * hourlyRate;
  const weeklyProgressPercent = Math.min((totalWeeklyHours / 40) * 100, 100);
  
  const formatWeekRange = (start: Date) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const formatDate = (d: Date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[d.getMonth()]} ${d.getDate()}`;
    };
    return `${formatDate(start)} - ${formatDate(end)}`;
  };
  
  const handleWeekSelect = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    setSelectedWeekStart(monday);
    setWeeklyHours(getWeeklyHoursData(monday));
    setShowWeekCalendar(false);
  };
  
  // Gross Pay Info Modal
  const [showGrossPayInfo, setShowGrossPayInfo] = useState(false);
  
  // Notes modal state
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteSubTitle, setNoteSubTitle] = useState('');
  const [noteDate, setNoteDate] = useState(new Date());
  const [noteContent, setNoteContent] = useState('');
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [savedNotes, setSavedNotes] = useState<Array<{id: string; project: string; title: string; date: Date; time: string; content: string; photos: string[]; audioUri?: string; transcript?: string;}>>([
    {
      id: '1',
      project: 'Eastgate Shopping Center',
      title: 'Roofing Progress',
      date: new Date('2025-12-12'),
      time: '04:15 PM',
      content: 'TPO membrane installation 90% complete. Flashing details finished around all penetrations. Final walkthrough scheduled for Friday.',
      photos: ['https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400', 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=400'],
      audioUri: 'mock-audio-1',
      transcript: 'Roofing Status\n\n• TPO 90% installed\n• All penetrations sealed\n• Drains connected\n• Warranty inspection pending\n\nNotes: No leaks detected during water test. Excellent workmanship.'
    },
    {
      id: '2',
      project: 'University Science Building',
      title: 'Lab Equipment Installation',
      date: new Date('2025-12-13'),
      time: '11:00 AM',
      content: 'Fume hoods installed in labs 201-205. Exhaust connections complete. Gas and air lines tested and certified.',
      photos: ['https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400'],
      audioUri: 'mock-audio-2',
      transcript: 'Lab Equipment Update\n\n• 5 fume hoods operational\n• Gas lines pressure tested\n• Emergency shutoffs verified\n• Safety inspection passed\n\nNotes: Remaining equipment arrives next week.'
    },
    {
      id: '3',
      project: 'Central Fire Station #7',
      title: 'Apparatus Bay Flooring',
      date: new Date('2025-12-14'),
      time: '09:30 AM',
      content: 'Epoxy floor coating applied in main apparatus bay. 24-hour cure time required. Secondary bay prep work in progress.',
      photos: ['https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400'],
      audioUri: 'mock-audio-3',
      transcript: 'Flooring Progress\n\n• Bay 1 epoxy complete\n• Non-slip finish applied\n• Drain trenches coated\n• Bay 2 grinding done\n\nNotes: Keep area clear for 24 hours. No vehicle traffic until cured.'
    }
  ]);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  
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
  const mockTranscriptText = `General walk\n\n• Completed foundation work on section A\n• Electrical wiring 80% done\n• Plumbing inspection passed\n• Need to order more materials for next week\n• Team meeting scheduled for tomorrow at 9 AM\n\nNotes: Weather conditions were favorable today. All safety protocols followed.`;

  const openNotesModal = () => {
    setNoteTitle('GPS Auto-Track Location');
    setNoteSubTitle('');
    setNoteDate(new Date());
    setNoteContent('');
    setShowFabMenu(false);
    setCapturedPhotos([]);
    setShowNotesModal(true);
  };

  const handleDateSelect = (day: any) => {
    setNoteDate(new Date(day.dateString));
    setShowDatePickerModal(false);
  };

  const handleTakePhotos = async () => {
    setShowFabMenu(false);
    if (capturedPhotos.length >= 10) { Alert.alert('Limit Reached', 'You can only add up to 10 photos.'); return; }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Required', 'Camera access is needed to take photos.'); return; }
    let currentPhotos = [...capturedPhotos];
    while (currentPhotos.length < 10) {
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.8 });
      if (result.canceled) break;
      if (result.assets) { currentPhotos = [...currentPhotos, ...result.assets.map(a => a.uri)]; setCapturedPhotos(currentPhotos.slice(0, 10)); if (currentPhotos.length >= 10) { Alert.alert('Complete', 'You have reached the maximum of 10 photos.'); break; } }
    }
  };

  const handleUploadPhotos = async () => {
    setShowFabMenu(false);
    if (capturedPhotos.length >= 10) { Alert.alert('Limit Reached', 'You can only add up to 10 photos.'); return; }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Required', 'Gallery access is needed to upload photos.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, selectionLimit: 10, quality: 0.8 });
    if (!result.canceled && result.assets) { setCapturedPhotos(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 10)); }
  };

  const removePhoto = (index: number) => { setCapturedPhotos(prev => prev.filter((_, i) => i !== index)); };

  const handleSaveNote = () => {
    const currentTime = new Date();
    const newNote = { id: Date.now().toString(), project: noteTitle, title: noteSubTitle, date: noteDate, time: formatDisplayTime(currentTime), content: noteContent, photos: [...capturedPhotos], audioUri: audioUri, transcript: transcript };
    setSavedNotes(prev => [newNote, ...prev]);
    resetAudioState();
    Alert.alert('Success', `Daily log saved at ${formatDisplayTime(currentTime)}!`);
    setShowNotesModal(false);
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
      if (permission.status !== 'granted') { Alert.alert('Permission Required', 'Microphone access is needed to record audio.'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      recordingIntervalRef.current = setInterval(() => { setRecordingDuration(prev => prev + 1000); }, 1000);
    } catch (err) { console.error('Failed to start recording', err); Alert.alert('Error', 'Failed to start recording'); }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      if (recordingIntervalRef.current) { clearInterval(recordingIntervalRef.current); recordingIntervalRef.current = null; }
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (uri) { setAudioUri(uri); setPlaybackDuration(recordingDuration); startMockTranscription(); }
    } catch (err) { console.error('Failed to stop recording', err); }
  };

  const startMockTranscription = () => {
    setIsTranscribing(true);
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
      } else { clearInterval(transcriptionInterval); setIsTranscribing(false); setHighlightedWordIndex(-1); }
    }, 100);
  };

  const playAudio = async () => {
    if (!audioUri) return;
    try {
      if (sound) {
        if (isPlaying) { await sound.pauseAsync(); setIsPlaying(false); if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current); }
        else { await sound.playAsync(); setIsPlaying(true); startPlaybackTracking(); }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUri }, { shouldPlay: true });
        setSound(newSound);
        setIsPlaying(true);
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) { setIsPlaying(false); setPlaybackPosition(0); if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current); }
        });
        startPlaybackTracking();
      }
    } catch (err) { console.error('Failed to play audio', err); }
  };

  const startPlaybackTracking = () => {
    playbackIntervalRef.current = setInterval(async () => {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          setPlaybackPosition(status.positionMillis);
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
      const progress = value / (playbackDuration || 1);
      const wordIndex = Math.floor(progress * transcriptWords.length);
      setHighlightedWordIndex(Math.min(wordIndex, transcriptWords.length - 1));
    }
  };

  const deleteRecording = () => {
    Alert.alert('Delete Recording', 'Are you sure you want to delete this recording?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: resetAudioState }
    ]);
  };

  // Play audio from saved note
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
  const [noteSound, setNoteSound] = useState<Audio.Sound | null>(null);

  const playNoteAudio = async (noteId: string, audioUri: string) => {
    try {
      if (noteSound) { await noteSound.stopAsync(); await noteSound.unloadAsync(); setNoteSound(null); }
      if (playingNoteId === noteId) { setPlayingNoteId(null); return; }
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUri }, { shouldPlay: true });
      setNoteSound(newSound);
      setPlayingNoteId(noteId);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) { setPlayingNoteId(null); newSound.unloadAsync(); setNoteSound(null); }
      });
    } catch (err) { console.error('Failed to play note audio', err); Alert.alert('Error', 'Failed to play audio'); }
  };

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
      if (sound) sound.unloadAsync();
      if (noteSound) noteSound.unloadAsync();
    };
  }, [sound, noteSound]);

  const openImageViewer = (imageUri: string) => { setSelectedImage(imageUri); setShowImageViewer(true); };
  const openNoteCard = (noteId: string) => { if (selectedNoteId !== noteId) setSelectedNoteId(noteId); };
  const closeNoteCard = () => { setSelectedNoteId(null); if (noteSound) { noteSound.stopAsync(); noteSound.unloadAsync(); setNoteSound(null); setPlayingNoteId(null); } };
  return (
    <View style={styles.content}>
      {/* Time and Date */}
      <View style={styles.timeSection}>
        <Text style={styles.timeText}>02:45 PM</Text>
        <Text style={styles.dateText}>Monday, November 6, 2024</Text>
      </View>

      {/* GPS Auto-Tracking Status Banner */}
      <View style={styles.gpsStatusBanner}>
        <LinearGradient
          colors={['#10b981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gpsGradient}
        >
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </Svg>
          <View style={styles.gpsTextContainer}>
            <Text style={styles.gpsTitle}>GPS Auto-Tracking Active</Text>
            <Text style={styles.gpsSubtitle}>Automatically clocking based on job site location</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Current Location Box */}
      <View style={styles.currentLocationBox}>
        <LinearGradient
          colors={['#dbeafe', '#d1fae5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.locationBoxGradient}
        />
        <View style={styles.locationBoxContent}>
          <Text style={styles.locationBoxTitle}>Current Location</Text>
          <View style={styles.mapPlaceholder}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="#94a3b8">
              <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </Svg>
            <Text style={styles.mapPlaceholderText}>Map placeholder</Text>
          </View>
          <View style={styles.locationAddressRow}>
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="#94a3b8">
              <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </Svg>
            <View style={styles.locationAddressText}>
              <Text style={styles.locationAddressMain}>1452 S York St</Text>
              <Text style={styles.locationAddressSecondary}>Denver, CO 80210</Text>
            </View>
            <View style={styles.jobSiteBadge}>
              <Text style={styles.jobSiteBadgeText}>Job Site</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Auto Clocked In Card */}
      <View style={styles.clockedInWrapper}>
        <LinearGradient
          colors={['#10b981', '#059669', '#10b981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.clockedInGradientBorder}
        >
          <View style={styles.clockedInCard}>
            <View style={styles.clockedInContent}>
              <View style={styles.clockedInLeft}>
                <View style={styles.clockedInStatusRow}>
                  <View style={styles.pulseDotWrapper}>
                    <View style={styles.pulseDot} />
                  </View>
                  <Text style={styles.clockedInStatusText}>Auto Clocked In</Text>
                  <View style={styles.autoBadge}>
                    <Svg width="12" height="12" viewBox="0 0 24 24" fill="#059669">
                      <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    </Svg>
                    <Text style={styles.autoBadgeText}>GPS</Text>
                  </View>
                </View>
                <Text style={styles.clockedInStartTime}>Arrived at job site 08:45 AM</Text>
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
              <View style={styles.timerBadge}>
                <Text style={styles.timerBadgeText}>05:23</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Manual Override Button */}
      <TouchableOpacity style={styles.manualOverrideButton}>
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6A5AE0" strokeWidth="2">
          <Path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </Svg>
        <Text style={styles.manualOverrideText}>Manual Override / Add Break</Text>
      </TouchableOpacity>

      {/* Daily Notes/Logs Button */}
      <TouchableOpacity style={styles.notesButton} onPress={openNotesModal}>
        <LinearGradient colors={['#6A5AE0', '#8B7CF0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.notesButtonGradient}>
          <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
            <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
          </Svg>
          <Text style={styles.notesButtonText}>Daily Notes/Logs</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Today's Summary */}
      <View style={styles.summaryGradientWrapper}>
        <LinearGradient colors={['#6A5AE0', '#34d399']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.summaryGradientBorder}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>Today's Summary</Text>
              <Text style={styles.summaryDate}>Oct 29</Text>
            </View>
            <View style={styles.summaryGrid}>
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
                  <View style={[styles.summaryProgressFill, styles.summaryProgressGreen, { width: '100%' }]} />
                </View>
              </View>
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
      <View style={styles.activitySection}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'activity' && styles.tabActive]} onPress={() => setActiveTab('activity')}>
            <Text style={[styles.tabText, activeTab === 'activity' && styles.tabTextActive]}>GPS Activity Log</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'notes' && styles.tabActive]} onPress={() => setActiveTab('notes')}>
            <Text style={[styles.tabText, activeTab === 'notes' && styles.tabTextActive]}>Notes/Logs</Text>
          </TouchableOpacity>
        </View>
        {activeTab === 'activity' && (
        <View>
        <Text style={styles.activityTitle}>GPS Activity Log</Text>
        <View style={styles.activityEntries}>
          <View style={styles.activityEntry}>
            <View style={[styles.activityDot, styles.activityDotGreen]} />
            <View style={styles.activityInfo}>
              <Text style={styles.activityAction}>Auto Clock In - Arrived at Job Site</Text>
              <Text style={styles.activityLocation}>1452 S York St, Denver, CO</Text>
            </View>
            <Text style={styles.activityTime}>08:45 AM</Text>
          </View>
          <View style={styles.activityEntry}>
            <View style={[styles.activityDot, styles.activityDotAmber]} />
            <View style={styles.activityInfo}>
              <Text style={styles.activityAction}>Break Started - Left Geofence</Text>
              <Text style={styles.activityLocation}>Moved 0.3mi from site</Text>
            </View>
            <Text style={styles.activityTime}>12:15 PM</Text>
          </View>
          <View style={styles.activityEntry}>
            <View style={[styles.activityDot, styles.activityDotGreen]} />
            <View style={styles.activityInfo}>
              <Text style={styles.activityAction}>Break Ended - Returned to Site</Text>
              <Text style={styles.activityLocation}>1452 S York St, Denver, CO</Text>
            </View>
            <Text style={styles.activityTime}>12:45 PM</Text>
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
                <Text style={styles.emptyNotesSubtext}>Click "Daily Notes/Logs" button above to add notes</Text>
              </View>
            ) : (
              savedNotes.map((note) => (
                <TouchableOpacity key={note.id} style={styles.noteCard} onPress={() => openNoteCard(note.id)} activeOpacity={selectedNoteId === note.id ? 1 : 0.7}>
                  <View style={styles.noteCardHeader}>
                    <View style={styles.noteCardLeft}>
                      <View style={styles.noteIconContainer}><Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6A5AE0" strokeWidth="2"><Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></Svg></View>
                      <View style={styles.noteCardInfo}><Text style={styles.noteCardProject}>{note.project}</Text><Text style={styles.noteCardByUser}>By: John Smith</Text>{note.title ? <Text style={styles.noteCardTitle}>{note.title}</Text> : null}</View>
                    </View>
                    <View style={styles.noteCardRight}><Text style={styles.noteCardDate}>{formatDisplayDate(note.date)}</Text><Text style={styles.noteCardTime}>{note.time}</Text></View>
                  </View>
                  {selectedNoteId === note.id && (
                    <View style={styles.noteCardExpanded}>
                      {note.content ? <View style={styles.noteContentBox}><Text style={styles.noteContentLabel}>Notes:</Text><Text style={styles.noteContentText}>{note.content}</Text></View> : null}
                      {/* Audio Section in Saved Note */}
                      {note.audioUri && (
                        <View style={styles.noteAudioSection}>
                          <View style={styles.noteAudioHeader}>
                            <Svg width="16" height="16" viewBox="0 0 24 24" fill="#6A5AE0"><Path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" /><Path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" /></Svg>
                            <Text style={styles.noteAudioLabel}>Audio Recording</Text>
                          </View>
                          <TouchableOpacity style={styles.noteAudioPlayer} onPress={() => playNoteAudio(note.id, note.audioUri)} activeOpacity={0.7}>
                            <View style={[styles.noteAudioIcon, playingNoteId === note.id && styles.noteAudioIconPlaying]}><Svg width="18" height="18" viewBox="0 0 24 24" fill={playingNoteId === note.id ? "#ffffff" : "#6A5AE0"}>{playingNoteId === note.id ? <Path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /> : <Path d="M8 5v14l11-7z" />}</Svg></View>
                            <View style={styles.noteAudioWaveform}>{[...Array(20)].map((_, i) => <View key={i} style={[styles.noteWaveBar, { height: 4 + Math.sin(i * 0.5) * 10 + 6, opacity: playingNoteId === note.id ? 1 : 0.7 }]} />)}</View>
                            <Text style={styles.noteAudioPlayText}>{playingNoteId === note.id ? 'Playing...' : 'Tap to play'}</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      {/* Transcript Section in Saved Note */}
                      {note.transcript && (
                        <View style={styles.noteTranscriptSection}>
                          <View style={styles.noteTranscriptHeader}>
                            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6A5AE0" strokeWidth="2"><Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></Svg>
                            <Text style={styles.noteTranscriptLabel}>Transcript</Text>
                          </View>
                          <View style={styles.noteTranscriptContent}><Text style={styles.noteTranscriptText}>{note.transcript}</Text></View>
                        </View>
                      )}
                      {note.photos.length > 0 && (
                        <View style={styles.notePhotosSection}><Text style={styles.notePhotosLabel}>Photos ({note.photos.length})</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false}>{note.photos.map((photo, index) => (<TouchableOpacity key={index} onPress={() => openImageViewer(photo)} style={styles.notePhotoThumb}><Image source={{ uri: photo }} style={styles.notePhotoImage} /></TouchableOpacity>))}</ScrollView>
                        </View>
                      )}
                    </View>
                  )}
                  <View style={styles.noteCardFooter}><View style={styles.noteFooterBadges}><View style={styles.notePhotosBadge}><Text style={styles.notePhotosBadgeText}>{note.photos.length} photos</Text></View>{note.audioUri && <View style={styles.noteAudioBadge}><Svg width="14" height="14" viewBox="0 0 24 24" fill="#6A5AE0"><Path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" /><Path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" /></Svg><Text style={styles.noteAudioBadgeText}>Audio</Text></View>}</View>{selectedNoteId === note.id ? <TouchableOpacity onPress={closeNoteCard} style={styles.closeArrowButton}><Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6A5AE0" strokeWidth="2.5"><Path d="M18 15l-6-6-6 6" /></Svg></TouchableOpacity> : <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><Path d="M6 9l6 6 6-6" /></Svg>}</View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </View>

      {/* Gross Pay Info Modal */}
      <Modal visible={showGrossPayInfo} transparent={true} animationType="fade" onRequestClose={() => setShowGrossPayInfo(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.grossPayModalContainer}>
            <View style={styles.grossPayModalHeader}>
              <View style={styles.grossPayIconCircle}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6A5AE0" strokeWidth="2">
                  <Circle cx="12" cy="12" r="10" />
                  <Path d="M12 16v-4M12 8h.01" />
                </Svg>
              </View>
              <Text style={styles.grossPayModalTitle}>Gross Pay</Text>
              <TouchableOpacity onPress={() => setShowGrossPayInfo(false)} style={styles.modalCloseButton}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                  <Path d="M6 18L18 6M6 6l12 12" />
                </Svg>
              </TouchableOpacity>
            </View>
            <Text style={styles.grossPayModalText}>Gross pay is the total amount earned before taxes, benefits, or other deductions are applied.</Text>
            <Text style={styles.grossPayModalText}>Taxes and deductions are calculated separately through payroll.</Text>
            <Text style={styles.grossPayModalNote}>For questions about your take-home pay, deductions, or paychecks, please contact your office or payroll administrator.</Text>
            <TouchableOpacity style={styles.grossPayModalButton} onPress={() => setShowGrossPayInfo(false)}>
              <Text style={styles.grossPayModalButtonText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Week Selection Calendar Modal */}
      <Modal visible={showWeekCalendar} transparent={true} animationType="fade" onRequestClose={() => setShowWeekCalendar(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.weekCalendarContainer}>
            <View style={styles.weekCalendarHeader}>
              <Text style={styles.weekCalendarTitle}>Select Week</Text>
              <TouchableOpacity onPress={() => setShowWeekCalendar(false)} style={styles.modalCloseButton}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                  <Path d="M6 18L18 6M6 6l12 12" />
                </Svg>
              </TouchableOpacity>
            </View>
            <Text style={styles.weekCalendarSubtitle}>Pick any date to select that week (Mon - Sun)</Text>
            <Calendar
              onDayPress={(day: { dateString: string }) => handleWeekSelect(new Date(day.dateString + 'T00:00:00'))}
              markedDates={{ [selectedWeekStart.toISOString().split('T')[0]]: { selected: true, selectedColor: '#6A5AE0' } }}
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
              }}
            />
            <View style={styles.weekCalendarInfo}>
              <Text style={styles.weekCalendarInfoText}>Selected: {formatWeekRange(selectedWeekStart)}</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Daily Notes/Logs Modal */}
      <Modal visible={showNotesModal} transparent={true} animationType="slide" onRequestClose={() => setShowNotesModal(false)}>
        <View style={styles.notesModalOverlay}>
          <View style={styles.notesModalContainer}>
            <LinearGradient colors={['#6A5AE0', '#8B7CF0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.notesModalHeaderGradient}>
              <View style={styles.notesModalHeaderContent}>
                <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2"><Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></Svg>
                <Text style={styles.notesModalTitleWhite}>Daily Notes/Logs</Text>
              </View>
              <TouchableOpacity onPress={() => setShowNotesModal(false)} style={styles.modalCloseButtonWhite}><Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2"><Path d="M6 18L18 6M6 6l12 12" /></Svg></TouchableOpacity>
            </LinearGradient>
            <ScrollView style={styles.notesScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.notesFieldContainer}><Text style={styles.notesFieldLabel}>Project</Text><View style={styles.fixedTitleContainer}><Text style={styles.fixedTitleText}>{noteTitle}</Text><View style={styles.lockedBadge}><Svg width="12" height="12" viewBox="0 0 24 24" fill="#6A5AE0"><Path d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zm-7 5a1 1 0 110-2 1 1 0 010 2zm3-5V8a3 3 0 00-6 0v3h6z" /></Svg></View></View></View>
              <View style={styles.notesFieldContainer}><Text style={styles.notesFieldLabel}>Title <Text style={styles.optionalLabel}>(optional)</Text></Text><TextInput style={styles.notesInput} value={noteSubTitle} onChangeText={setNoteSubTitle} placeholder="Enter title" placeholderTextColor="#94a3b8" /></View>
              <View style={styles.dateTimeRow}>
                <View style={styles.dateFieldContainer}><Text style={styles.notesFieldLabel}>Date</Text><TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePickerModal(true)}><Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6A5AE0" strokeWidth="2"><Rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><Path d="M16 2v4M8 2v4M3 10h18" /></Svg><Text style={styles.datePickerText}>{formatDisplayDate(noteDate)}</Text></TouchableOpacity></View>
                <View style={styles.timeFieldContainer}><Text style={styles.notesFieldLabel}>Time</Text><View style={styles.fixedTimeContainer}><Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6A5AE0" strokeWidth="2"><Circle cx="12" cy="12" r="10" /><Path d="M12 6v6l4 2" /></Svg><Text style={styles.fixedTimeText}>{formatDisplayTime(new Date())}</Text><View style={styles.lockedBadgeSmall}><Svg width="10" height="10" viewBox="0 0 24 24" fill="#6A5AE0"><Path d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zm-7 5a1 1 0 110-2 1 1 0 010 2zm3-5V8a3 3 0 00-6 0v3h6z" /></Svg></View></View></View>
              </View>
              <View style={styles.notesFieldContainer}><Text style={styles.notesFieldLabel}>Notes / Logs</Text><TextInput style={styles.notesTextArea} value={noteContent} onChangeText={setNoteContent} placeholder="Add your notes here..." placeholderTextColor="#94a3b8" multiline numberOfLines={6} textAlignVertical="top" /></View>
              
              {/* Audio Recording Section */}
              <View style={styles.notesFieldContainer}>
                <Text style={styles.notesFieldLabel}>Record Audio</Text>
                <View style={styles.audioRecordingContainer}>
                  {!audioUri ? (
                    <View style={styles.recordingSection}>
                      <TouchableOpacity style={[styles.recordButton, isRecording && styles.recordButtonActive]} onPress={isRecording ? stopRecording : startRecording}>
                        <LinearGradient colors={isRecording ? ['#ef4444', '#dc2626'] : ['#6A5AE0', '#8B7CF0']} style={styles.recordButtonGradient}>
                          {isRecording ? <View style={styles.stopIcon} /> : <Svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff"><Path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" /><Path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" /></Svg>}
                        </LinearGradient>
                      </TouchableOpacity>
                      <View style={styles.recordingInfo}>
                        <Text style={styles.recordingStatus}>{isRecording ? 'Recording...' : 'Tap to record'}</Text>
                        <Text style={styles.recordingDuration}>{formatDuration(recordingDuration)}</Text>
                      </View>
                      {isRecording && <View style={styles.recordingWave}>{[...Array(5)].map((_, i) => <View key={i} style={[styles.waveBar, { height: 8 + Math.random() * 16 }]} />)}</View>}
                    </View>
                  ) : (
                    <View style={styles.playbackSection}>
                      <View style={styles.playbackControls}>
                        <TouchableOpacity style={styles.playButton} onPress={playAudio}>
                          <LinearGradient colors={['#6A5AE0', '#8B7CF0']} style={styles.playButtonGradient}>
                            <Svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">{isPlaying ? <Path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /> : <Path d="M8 5v14l11-7z" />}</Svg>
                          </LinearGradient>
                        </TouchableOpacity>
                        <View style={styles.sliderContainer}>
                          <Slider style={styles.slider} minimumValue={0} maximumValue={playbackDuration} value={playbackPosition} onSlidingComplete={seekAudio} minimumTrackTintColor="#6A5AE0" maximumTrackTintColor="#e2e8f0" thumbTintColor="#6A5AE0" />
                          <View style={styles.sliderLabels}><Text style={styles.sliderTime}>{formatDuration(playbackPosition)}</Text><Text style={styles.sliderTime}>{formatDuration(playbackDuration)}</Text></View>
                        </View>
                        <TouchableOpacity style={styles.deleteAudioButton} onPress={deleteRecording}><Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></Svg></TouchableOpacity>
                      </View>
                      <View style={styles.transcriptionSection}>
                        <View style={styles.transcriptionHeader}><Text style={styles.transcriptionLabel}>Transcript</Text>{isTranscribing && <View style={styles.transcribingBadge}><Text style={styles.transcribingText}>Transcribing...</Text></View>}</View>
                        <TextInput style={styles.transcriptTextArea} value={transcript} onChangeText={setTranscript} placeholder="Transcript will appear here..." placeholderTextColor="#94a3b8" multiline numberOfLines={6} textAlignVertical="top" />
                        <View style={styles.transcriptActions}>
                          <TouchableOpacity style={styles.transcriptActionButton} onPress={() => { if (transcript) Alert.alert('Copied!', 'Transcript copied to clipboard'); }}><Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6A5AE0" strokeWidth="2"><Rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><Path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></Svg><Text style={styles.transcriptActionText}>Copy</Text></TouchableOpacity>
                          <TouchableOpacity style={styles.transcriptActionButton} onPress={() => setTranscript('')}><Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><Path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></Svg><Text style={styles.transcriptActionText}>Clear</Text></TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {capturedPhotos.length > 0 && (<View style={styles.notesFieldContainer}><Text style={styles.notesFieldLabel}>Photos ({capturedPhotos.length})</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScrollView}>{capturedPhotos.map((uri, index) => (<View key={index} style={styles.photoThumbnailContainer}><Image source={{ uri }} style={styles.photoThumbnail} /><TouchableOpacity style={styles.removePhotoButton} onPress={() => removePhoto(index)}><Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5"><Path d="M6 18L18 6M6 6l12 12" /></Svg></TouchableOpacity></View>))}</ScrollView></View>)}
              <TouchableOpacity style={styles.saveNoteButton} onPress={handleSaveNote}><LinearGradient colors={['#6A5AE0', '#8B7CF0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveNoteGradient}><Text style={styles.saveNoteText}>Save Log</Text></LinearGradient></TouchableOpacity>
            </ScrollView>
            {showFabMenu && (<View style={styles.fabMenuContainer}><TouchableOpacity style={styles.fabMenuItem} onPress={handleTakePhotos}><View style={styles.fabMenuIconBg}><Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2"><Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><Circle cx="12" cy="13" r="4" /></Svg></View><Text style={styles.fabMenuText}>Take Photos</Text></TouchableOpacity><TouchableOpacity style={styles.fabMenuItem} onPress={handleUploadPhotos}><View style={[styles.fabMenuIconBg, { backgroundColor: '#10b981' }]}><Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2"><Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></Svg></View><Text style={styles.fabMenuText}>Upload Photos</Text></TouchableOpacity></View>)}
            <TouchableOpacity style={styles.fabButton} onPress={() => setShowFabMenu(!showFabMenu)}><LinearGradient colors={showFabMenu ? ['#ef4444', '#dc2626'] : ['#6A5AE0', '#8B7CF0']} style={styles.fabGradient}><Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">{showFabMenu ? <Path d="M6 18L18 6M6 6l12 12" /> : <Path d="M12 5v14M5 12h14" />}</Svg></LinearGradient></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal visible={showDatePickerModal} transparent={true} animationType="fade" onRequestClose={() => setShowDatePickerModal(false)}>
        <View style={styles.dateModalOverlay}>
          <View style={styles.dateModalContainer}>
            <View style={styles.dateModalHeader}><Text style={styles.dateModalTitle}>Select Date</Text><TouchableOpacity onPress={() => setShowDatePickerModal(false)}><Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><Path d="M6 18L18 6M6 6l12 12" /></Svg></TouchableOpacity></View>
            <Calendar current={noteDate.toISOString().split('T')[0]} markedDates={{ [noteDate.toISOString().split('T')[0]]: { selected: true, selectedColor: '#6A5AE0' } }} onDayPress={handleDateSelect} theme={{ backgroundColor: '#ffffff', calendarBackground: '#ffffff', selectedDayBackgroundColor: '#6A5AE0', selectedDayTextColor: '#ffffff', todayTextColor: '#6A5AE0', dayTextColor: '#0f172a', arrowColor: '#6A5AE0', monthTextColor: '#0f172a' }} style={styles.calendarStyle} />
          </View>
        </View>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal visible={showImageViewer} transparent={true} animationType="fade" onRequestClose={() => setShowImageViewer(false)}>
        <View style={styles.imageViewerOverlay}><TouchableOpacity style={styles.imageViewerClose} onPress={() => setShowImageViewer(false)}><Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5"><Path d="M6 18L18 6M6 6l12 12" /></Svg></TouchableOpacity><Image source={{ uri: selectedImage }} style={styles.imageViewerImage} resizeMode="contain" /></View>
      </Modal>

      <View style={{ height: 100 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 16 },
  timeSection: { alignItems: 'center', marginBottom: 16 },
  timeText: { fontSize: 48, fontWeight: 'bold', color: '#0f172a' },
  dateText: { fontSize: 14, color: '#64748b', marginTop: 4 },
  gpsStatusBanner: { marginBottom: 16, borderRadius: 12, overflow: 'hidden' },
  gpsGradient: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  gpsTextContainer: { flex: 1 },
  gpsTitle: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  gpsSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  currentLocationBox: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, backgroundColor: '#ffffff', position: 'relative', overflow: 'hidden', marginBottom: 16 },
  locationBoxGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1 },
  locationBoxContent: { position: 'relative' },
  locationBoxTitle: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 8 },
  mapPlaceholder: { height: 96, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  mapPlaceholderText: { fontSize: 12, color: '#475569', marginTop: 4 },
  locationAddressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationAddressText: { flex: 1 },
  locationAddressMain: { fontSize: 14, fontWeight: '500', color: '#0f172a' },
  locationAddressSecondary: { fontSize: 12, color: '#64748b' },
  jobSiteBadge: { backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  jobSiteBadgeText: { fontSize: 10, fontWeight: '600', color: '#059669' },
  clockedInWrapper: { marginBottom: 16 },
  clockedInGradientBorder: { padding: 1, borderRadius: 16 },
  clockedInCard: { backgroundColor: 'rgba(255, 255, 255, 0.9)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)', borderRadius: 16, padding: 16 },
  clockedInContent: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  clockedInLeft: { flex: 1 },
  clockedInStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  pulseDotWrapper: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center' },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981' },
  clockedInStatusText: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  autoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#d1fae5', borderRadius: 12 },
  autoBadgeText: { fontSize: 10, fontWeight: '600', color: '#059669' },
  clockedInStartTime: { fontSize: 12, color: '#64748b', marginBottom: 12 },
  clockedInProgressSection: { gap: 4 },
  clockedInProgressBar: { height: 8, borderRadius: 4, backgroundColor: '#e2e8f0', overflow: 'hidden' },
  clockedInProgressFill: { height: '100%', borderRadius: 4 },
  clockedInProgressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  clockedInProgressLabel: { fontSize: 10, color: '#94a3b8' },
  timerBadge: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#d1fae5', borderRadius: 16, marginLeft: 12 },
  timerBadgeText: { fontSize: 14, fontWeight: 'bold', color: '#047857' },
  manualOverrideButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderWidth: 1, borderColor: '#6A5AE0', borderRadius: 12, backgroundColor: '#ffffff', marginBottom: 16 },
  manualOverrideText: { fontSize: 14, fontWeight: '600', color: '#6A5AE0' },
  summaryGradientWrapper: { marginBottom: 16 },
  summaryGradientBorder: { padding: 1, borderRadius: 16 },
  summaryCard: { backgroundColor: 'rgba(255, 255, 255, 0.7)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)', borderRadius: 16, padding: 16 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  summaryTitle: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  summaryDate: { fontSize: 11, color: '#64748b' },
  summaryGrid: { flexDirection: 'row', gap: 8 },
  summaryColumn: { flex: 1, borderRadius: 8, padding: 12, borderWidth: 1, backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
  summaryIconRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  summaryLabel: { fontSize: 11, color: '#64748b' },
  summaryValue: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
  summaryValueEarned: { fontSize: 16, fontWeight: 'bold', color: '#059669', marginBottom: 4 },
  summaryRate: { fontSize: 10, color: '#94a3b8' },
  summaryProgressBar: { height: 4, borderRadius: 2, backgroundColor: '#e2e8f0', overflow: 'hidden' },
  summaryProgressFill: { height: '100%', borderRadius: 2 },
  summaryProgressGreen: { backgroundColor: '#10b981' },
  summaryProgressAmber: { backgroundColor: '#fbbf24' },
  timesheetGradientWrapper: { marginBottom: 16 },
  timesheetGradientBorder: { padding: 1, borderRadius: 16 },
  timesheetCard: { backgroundColor: 'rgba(255, 255, 255, 0.7)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)', borderRadius: 16, overflow: 'hidden' },
  timesheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  timesheetTitle: { fontSize: 12, fontWeight: '600', color: '#334155' },
  timesheetDate: { fontSize: 11, color: '#64748b' },
  timesheetButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  changeButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, backgroundColor: 'rgba(255, 255, 255, 0.6)' },
  changeButtonText: { fontSize: 12, color: '#334155' },
  exportButton: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#6A5AE0' },
  exportButtonText: { fontSize: 12, color: '#ffffff' },
  timesheetContent: { paddingHorizontal: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  employeeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  employeeInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  employeeAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6A5AE0', alignItems: 'center', justifyContent: 'center' },
  employeeAvatarText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  employeeName: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  employeeRole: { fontSize: 12, color: '#64748b' },
  expandedContent: { gap: 12 },
  hoursPayRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  totalHours: { fontSize: 30, fontWeight: 'bold', color: '#0f172a' },
  weekLabel: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  payChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#d1fae5', borderWidth: 1, borderColor: '#6ee7b7' },
  payChipText: { fontSize: 13, fontWeight: '600', color: '#047857' },
  // New Pay Section Styles
  paySection: { alignItems: 'flex-end' },
  grossPayLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  grossPayText: { fontSize: 12, color: '#6A5AE0', fontWeight: '500' },
  payAmount: { fontSize: 22, fontWeight: 'bold', color: '#047857' },
  payRate: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  // Gross Pay Modal Styles
  grossPayModalContainer: { backgroundColor: '#ffffff', borderRadius: 20, padding: 24, width: '90%', maxWidth: 380 },
  grossPayModalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  grossPayIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0efff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  grossPayModalTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  grossPayModalText: { fontSize: 15, color: '#475569', lineHeight: 22, marginBottom: 12 },
  grossPayModalNote: { fontSize: 14, color: '#64748b', lineHeight: 20, fontStyle: 'italic', marginTop: 8, marginBottom: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  grossPayModalButton: { backgroundColor: '#6A5AE0', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  grossPayModalButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 80, marginTop: 12, gap: 6 },
  barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barContainer: { width: 8, height: 56, borderRadius: 4, backgroundColor: '#e2e8f0', overflow: 'hidden' },
  bar: { width: '100%', backgroundColor: '#6A5AE0', borderRadius: 4, position: 'absolute', bottom: 0 },
  barLabel: { fontSize: 10, color: '#64748b', marginTop: 4 },
  barHoursLabel: { fontSize: 9, color: '#94a3b8', marginTop: 2, fontWeight: '600' },
  // Week Calendar Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  weekCalendarContainer: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, width: '95%', maxWidth: 400 },
  weekCalendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  weekCalendarTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  weekCalendarSubtitle: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  weekCalendarInfo: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0', alignItems: 'center' },
  weekCalendarInfoText: { fontSize: 14, fontWeight: '600', color: '#6A5AE0' },
  modalCloseButton: { padding: 4 },
  weeklyProgress: { marginTop: 12 },
  weeklyProgressBar: { height: 6, borderRadius: 3, backgroundColor: '#e2e8f0', overflow: 'hidden' },
  weeklyProgressFill: { height: '100%', backgroundColor: '#6A5AE0' },
  weeklyProgressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  weeklyProgressLabel: { fontSize: 10, color: '#64748b' },
  activitySection: { marginBottom: 16 },
  tabsContainer: { flexDirection: 'row', marginBottom: 16, backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, gap: 6 },
  tabActive: { backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '500', color: '#64748b' },
  tabTextActive: { color: '#6A5AE0', fontWeight: '600' },
  emptyNotesContainer: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyNotesText: { fontSize: 16, fontWeight: '600', color: '#64748b' },
  emptyNotesSubtext: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
  // Notes button styles
  notesButton: { borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
  notesButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  notesButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  // Notes list styles
  notesLogsList: { gap: 12 },
  noteCard: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14 },
  noteCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  noteCardLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  noteIconContainer: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center' },
  noteCardInfo: { flex: 1 },
  noteCardProject: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  noteCardByUser: { fontSize: 12, color: '#6A5AE0', fontWeight: '500', marginTop: 1 },
  noteCardTitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  noteCardRight: { alignItems: 'flex-end' },
  noteCardDate: { fontSize: 13, fontWeight: '500', color: '#0f172a' },
  noteCardTime: { fontSize: 12, color: '#6A5AE0' },
  noteCardExpanded: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  noteContentBox: { backgroundColor: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 12 },
  noteContentLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 4 },
  noteContentText: { fontSize: 14, color: '#0f172a', lineHeight: 20 },
  notePhotosSection: { marginTop: 4 },
  notePhotosLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  notePhotoThumb: { marginRight: 10 },
  notePhotoImage: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#f1f5f9' },
  noteCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  noteFooterBadges: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notePhotosBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  notePhotosBadgeText: { fontSize: 12, color: '#64748b' },
  noteAudioBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  noteAudioBadgeText: { fontSize: 12, color: '#6A5AE0', fontWeight: '500' },
  noteAudioSection: { backgroundColor: '#f0f4ff', borderRadius: 8, padding: 12, marginBottom: 12 },
  noteAudioHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  noteAudioLabel: { fontSize: 12, fontWeight: '600', color: '#6A5AE0' },
  noteAudioPlayer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  noteAudioIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  noteAudioIconPlaying: { backgroundColor: '#6A5AE0' },
  noteAudioWaveform: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 30 },
  noteWaveBar: { width: 3, backgroundColor: '#6A5AE0', borderRadius: 2 },
  noteAudioPlayText: { fontSize: 12, color: '#6A5AE0', fontWeight: '500' },
  closeArrowButton: { padding: 8, marginRight: -8 },
  noteTranscriptSection: { backgroundColor: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  noteTranscriptHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  noteTranscriptLabel: { fontSize: 12, fontWeight: '600', color: '#6A5AE0' },
  noteTranscriptContent: { backgroundColor: '#ffffff', borderRadius: 6, padding: 10 },
  noteTranscriptText: { fontSize: 13, color: '#334155', lineHeight: 18 },
  // Modal styles
  notesModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  notesModalContainer: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  notesModalHeaderGradient: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: -20, marginTop: -20, marginBottom: 20, paddingHorizontal: 20, paddingVertical: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  notesModalHeaderContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notesModalTitleWhite: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  modalCloseButtonWhite: { padding: 4 },
  notesScrollView: { marginBottom: 80 },
  notesFieldContainer: { marginBottom: 20 },
  notesFieldLabel: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  fixedTitleContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  fixedTitleText: { fontSize: 16, fontWeight: '600', color: '#6A5AE0' },
  lockedBadge: { backgroundColor: '#ede9fe', padding: 6, borderRadius: 6 },
  optionalLabel: { fontSize: 12, fontWeight: '400', color: '#94a3b8' },
  notesInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#0f172a' },
  dateTimeRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  dateFieldContainer: { flex: 1 },
  timeFieldContainer: { flex: 1 },
  datePickerButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 14, gap: 8 },
  datePickerText: { fontSize: 14, fontWeight: '500', color: '#0f172a' },
  fixedTimeContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 14, gap: 8 },
  fixedTimeText: { flex: 1, fontSize: 14, fontWeight: '500', color: '#6A5AE0' },
  lockedBadgeSmall: { backgroundColor: '#ede9fe', padding: 4, borderRadius: 4 },
  notesTextArea: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#0f172a', minHeight: 140, textAlignVertical: 'top' },
  photosScrollView: { marginTop: 8 },
  photoThumbnailContainer: { position: 'relative', marginRight: 12 },
  photoThumbnail: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#f1f5f9' },
  removePhotoButton: { position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: 12, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' },
  saveNoteButton: { borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  saveNoteGradient: { paddingVertical: 16, alignItems: 'center' },
  saveNoteText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  fabMenuContainer: { position: 'absolute', bottom: 90, right: 20, gap: 12 },
  fabMenuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12 },
  fabMenuIconBg: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#6A5AE0', alignItems: 'center', justifyContent: 'center' },
  fabMenuText: { fontSize: 14, fontWeight: '600', color: '#0f172a', backgroundColor: '#ffffff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  fabButton: { position: 'absolute', bottom: 20, right: 20, borderRadius: 28, overflow: 'hidden' },
  fabGradient: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  dateModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dateModalContainer: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, width: '100%', maxWidth: 340 },
  dateModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  dateModalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  calendarStyle: { borderRadius: 12, marginBottom: 8 },
  imageViewerOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.95)', justifyContent: 'center', alignItems: 'center' },
  imageViewerClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8 },
  imageViewerImage: { width: '100%', height: '80%' },
  activityTitle: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 8 },
  activityEntries: { gap: 8 },
  activityEntry: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, gap: 12 },
  activityDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  activityDotGreen: { backgroundColor: '#10b981' },
  activityDotAmber: { backgroundColor: '#f59e0b' },
  activityInfo: { flex: 1 },
  activityAction: { fontSize: 13, fontWeight: '500', color: '#0f172a' },
  activityLocation: { fontSize: 11, color: '#64748b' },
  activityTime: { fontSize: 12, fontWeight: '500', color: '#334155' },
  // Audio recording styles
  audioRecordingContainer: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16 },
  recordingSection: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  recordButton: { borderRadius: 30, overflow: 'hidden' },
  recordButtonActive: {},
  recordButtonGradient: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  stopIcon: { width: 20, height: 20, backgroundColor: '#ffffff', borderRadius: 4 },
  recordingInfo: { flex: 1 },
  recordingStatus: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  recordingDuration: { fontSize: 14, color: '#6A5AE0', marginTop: 2 },
  recordingWave: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  waveBar: { width: 4, backgroundColor: '#ef4444', borderRadius: 2 },
  playbackSection: { gap: 16 },
  playbackControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playButton: { borderRadius: 25, overflow: 'hidden' },
  playButtonGradient: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  sliderContainer: { flex: 1 },
  slider: { width: '100%', height: 40 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -8 },
  sliderTime: { fontSize: 12, color: '#64748b' },
  deleteAudioButton: { padding: 8 },
  transcriptionSection: { marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  transcriptionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  transcriptionLabel: { fontSize: 14, fontWeight: '600', color: '#475569' },
  transcribingBadge: { backgroundColor: '#6A5AE0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  transcribingText: { fontSize: 11, color: '#ffffff', fontWeight: '600' },
  transcriptTextArea: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0f172a', minHeight: 100, textAlignVertical: 'top' },
  transcriptActions: { flexDirection: 'row', gap: 16, marginTop: 8 },
  transcriptActionButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#f1f5f9', borderRadius: 6 },
  transcriptActionText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
});
