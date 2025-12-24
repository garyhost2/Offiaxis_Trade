import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Svg, { Path } from 'react-native-svg';

interface WeekCalendarModalProps {
  visible: boolean;
  selectedWeekStart: Date;
  onSelectWeek: (date: Date) => void;
  onClose: () => void;
}

export default function WeekCalendarModal({ visible, selectedWeekStart, onSelectWeek, onClose }: WeekCalendarModalProps) {
  const handleDayPress = (day: any) => {
    const selectedDate = new Date(day.dateString);
    // Get Monday of the selected week
    const dayOfWeek = selectedDate.getDay();
    const diff = selectedDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(selectedDate);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    onSelectWeek(monday);
  };

  // Calculate the end of the week for marking
  const getWeekEndDate = (start: Date) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return end;
  };

  // Generate marked dates for the selected week
  const getMarkedDates = () => {
    const marked: { [key: string]: any } = {};
    const weekEnd = getWeekEndDate(selectedWeekStart);
    
    for (let d = new Date(selectedWeekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const isStart = d.getTime() === selectedWeekStart.getTime();
      const isEnd = d.toDateString() === weekEnd.toDateString();
      
      marked[dateStr] = {
        selected: true,
        color: isStart || isEnd ? '#6A5AE0' : '#e8e6fa',
        textColor: isStart || isEnd ? '#ffffff' : '#6A5AE0',
        startingDay: isStart,
        endingDay: isEnd,
      };
    }
    return marked;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Week</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                <Path d="M18 6L6 18M6 6l12 12" />
              </Svg>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.hint}>Tap any date to select that entire week (Mon-Sun)</Text>
          
          <Calendar
            onDayPress={handleDayPress}
            markedDates={getMarkedDates()}
            markingType={'period'}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#64748b',
              selectedDayBackgroundColor: '#6A5AE0',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#6A5AE0',
              dayTextColor: '#1e293b',
              textDisabledColor: '#cbd5e1',
              dotColor: '#6A5AE0',
              arrowColor: '#6A5AE0',
              monthTextColor: '#1e293b',
              textMonthFontWeight: '600',
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
            style={styles.calendar}
          />
          
          <TouchableOpacity style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 380,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  closeButton: {
    padding: 4,
  },
  hint: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
  },
  calendar: {
    borderRadius: 12,
    marginBottom: 16,
  },
  doneButton: {
    backgroundColor: '#6A5AE0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
