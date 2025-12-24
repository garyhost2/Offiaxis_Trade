import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';

interface WeeklyTimesheetProps {
  // Week data
  selectedWeekStart: Date;
  weeklyHours: number[];
  totalWeeklyHours: number;
  totalWeeklyPay: number;
  hourlyRate: number;
  weeklyProgressPercent: number;
  
  // User info
  userName: string;
  userRole: string;
  userInitials: string;
  
  // Actions
  onChangeWeek: () => void;
  onShowGrossPayInfo: () => void;
  onExport?: () => void;
}

export default function WeeklyTimesheet({
  selectedWeekStart,
  weeklyHours,
  totalWeeklyHours,
  totalWeeklyPay,
  hourlyRate,
  weeklyProgressPercent,
  userName,
  userRole,
  userInitials,
  onChangeWeek,
  onShowGrossPayInfo,
  onExport,
}: WeeklyTimesheetProps) {
  
  // Format week date range
  const formatWeekRange = (start: Date) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formatDate = (d: Date) => `${months[d.getMonth()]} ${d.getDate()}`;
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  return (
    <View style={styles.gradientWrapper}>
      <LinearGradient
        colors={['#6A5AE0', '#34d399']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        <View style={styles.card}>
          {/* Header Section */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Weekly Timesheet</Text>
              <Text style={styles.dateRange}>{formatWeekRange(selectedWeekStart)}</Text>
            </View>
            
            {/* Header Buttons */}
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.changeButton} onPress={onChangeWeek}>
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6A5AE0" strokeWidth="2">
                  <Path d="M3 4h18v18H3z" />
                  <Path d="M16 2v4M8 2v4M3 10h18" />
                </Svg>
                <Text style={styles.changeButtonText}>Change</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportButton} onPress={onExport}>
                <Text style={styles.exportButtonText}>Export</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* User Identity Row */}
          <View style={styles.content}>
            <View style={styles.employeeRow}>
              <View style={styles.employeeInfo}>
                <View style={styles.employeeAvatar}>
                  <Text style={styles.employeeAvatarText}>{userInitials}</Text>
                </View>
                <View>
                  <Text style={styles.employeeName}>{userName}</Text>
                  <Text style={styles.employeeRole}>{userRole}</Text>
                </View>
              </View>
            </View>
            
            {/* Expanded Content */}
            <View style={styles.expandedContent}>
              {/* KPI Row - Hours & Money */}
              <View style={styles.hoursPayRow}>
                <View>
                  <Text style={styles.totalHours}>{totalWeeklyHours} hrs</Text>
                  <Text style={styles.weekLabel}>This week</Text>
                </View>
                <View style={styles.paySection}>
                  <TouchableOpacity style={styles.grossPayLabel} onPress={onShowGrossPayInfo}>
                    <Text style={styles.grossPayText}>Gross Pay</Text>
                    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6A5AE0" strokeWidth="2">
                      <Circle cx="12" cy="12" r="10" />
                      <Path d="M12 16v-4M12 8h.01" />
                    </Svg>
                  </TouchableOpacity>
                  <Text style={styles.payAmount}>${totalWeeklyPay.toLocaleString()}</Text>
                  <Text style={styles.payRate}>${hourlyRate}/hr</Text>
                </View>
              </View>
              
              {/* Daily Bars Chart */}
              <View style={styles.barChart}>
                {weeklyHours.map((hours, i) => {
                  const maxHours = 8;
                  const heightPercent = Math.min((hours / maxHours) * 100, 100);
                  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                  return (
                    <View key={i} style={styles.barColumn}>
                      <View style={styles.barContainer}>
                        <View style={[styles.bar, { height: `${heightPercent}%` }]} />
                      </View>
                      <Text style={styles.barLabel}>{dayLabels[i]}</Text>
                      <Text style={styles.barHoursLabel}>{hours > 0 ? hours : '-'}</Text>
                    </View>
                  );
                })}
              </View>
              
              {/* Weekly Progress Bar */}
              <View style={styles.weeklyProgress}>
                <View style={styles.weeklyProgressBar}>
                  <View style={[styles.weeklyProgressFill, { width: `${weeklyProgressPercent}%` }]} />
                </View>
                <View style={styles.weeklyProgressLabels}>
                  <Text style={styles.weeklyProgressLabel}>Weekly progress</Text>
                  <Text style={styles.weeklyProgressLabel}>{totalWeeklyHours}h / 40h</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  gradientWrapper: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  gradientBorder: {
    borderRadius: 16,
    padding: 2,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  dateRange: {
    fontSize: 12,
    color: '#64748b',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  changeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6A5AE0',
  },
  exportButton: {
    backgroundColor: '#6A5AE0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  content: {
    padding: 16,
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    fontWeight: '700',
  },
  employeeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  employeeRole: {
    fontSize: 12,
    color: '#64748b',
  },
  expandedContent: {},
  hoursPayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  totalHours: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
  },
  weekLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  paySection: {
    alignItems: 'flex-end',
  },
  grossPayLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  grossPayText: {
    fontSize: 12,
    color: '#6A5AE0',
    fontWeight: '500',
  },
  payAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10b981',
  },
  payRate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    width: 20,
    height: 80,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    backgroundColor: '#6A5AE0',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 6,
    fontWeight: '600',
  },
  barHoursLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  weeklyProgress: {
    marginTop: 4,
  },
  weeklyProgressBar: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  weeklyProgressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  weeklyProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weeklyProgressLabel: {
    fontSize: 11,
    color: '#64748b',
  },
});
