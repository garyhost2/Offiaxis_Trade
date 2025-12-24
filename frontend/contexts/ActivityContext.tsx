import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Activity types that can be tracked
export type ActivityType = 
  | 'project'
  | 'receipt'
  | 'task'
  | 'inspection'
  | 'permit'
  | 'invoice'
  | 'change_order'
  | 'expense'
  | 'income'
  | 'portfolio'
  | 'gallery'
  | 'time_entry'
  | 'inventory'
  | 'tool'
  | 'note'
  | 'contact'
  | 'photo';

export interface Activity {
  id: string;
  type: ActivityType;
  action: string;
  description: string;
  userName: string;
  userInitials: string;
  projectName?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface ActivityContextType {
  activities: Activity[];
  logActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => Promise<void>;
  clearActivities: () => Promise<void>;
  refreshActivities: () => Promise<void>;
}

const STORAGE_KEY = '@offiaxis_activities';
const MAX_ACTIVITIES = 100; // Keep last 100 activities

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

// Helper to generate initials from name
const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Helper to generate unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Mock sample activities to demonstrate all activity types
const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 'mock-1',
    type: 'project',
    action: 'created',
    description: 'created new project "Smith Kitchen Remodel"',
    userName: 'Yefry Soto',
    userInitials: 'YS',
    projectName: 'Smith Kitchen Remodel',
    timestamp: Date.now() - 1000 * 60 * 30, // 30 mins ago
  },
  {
    id: 'mock-2',
    type: 'receipt',
    action: 'uploaded',
    description: 'uploaded receipt for $245.00 materials at Home Depot',
    userName: 'Maria Rodriguez',
    userInitials: 'MR',
    projectName: 'Johnson Bathroom',
    timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
  },
  {
    id: 'mock-3',
    type: 'task',
    action: 'completed',
    description: 'completed task "Install electrical panel"',
    userName: 'Carlos Martinez',
    userInitials: 'CM',
    projectName: 'Denver Office Build',
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
  },
  {
    id: 'mock-4',
    type: 'inspection',
    action: 'passed',
    description: 'passed framing inspection for Boulder Residence',
    userName: 'Azis K',
    userInitials: 'AK',
    projectName: 'Boulder Residence',
    timestamp: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago
  },
  {
    id: 'mock-5',
    type: 'permit',
    action: 'uploaded',
    description: 'uploaded building permit document',
    userName: 'Oumayama M',
    userInitials: 'OM',
    projectName: 'Smith Kitchen Remodel',
    timestamp: Date.now() - 1000 * 60 * 60 * 4, // 4 hours ago
  },
  {
    id: 'mock-6',
    type: 'invoice',
    action: 'created',
    description: 'created invoice #1247 for $3,500.00',
    userName: 'Yefry Soto',
    userInitials: 'YS',
    projectName: 'Johnson Bathroom',
    timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
  },
  {
    id: 'mock-7',
    type: 'change_order',
    action: 'approved',
    description: 'approved change order for additional wiring ($850)',
    userName: 'Sarash Williams',
    userInitials: 'SW',
    projectName: 'Denver Office Build',
    timestamp: Date.now() - 1000 * 60 * 60 * 6, // 6 hours ago
  },
  {
    id: 'mock-8',
    type: 'expense',
    action: 'added',
    description: 'added $1,200 labor expense',
    userName: 'Emely Devis',
    userInitials: 'ED',
    projectName: 'Boulder Residence',
    timestamp: Date.now() - 1000 * 60 * 60 * 7, // 7 hours ago
  },
  {
    id: 'mock-9',
    type: 'income',
    action: 'recorded',
    description: 'recorded $5,000 payment received',
    userName: 'Yefry Soto',
    userInitials: 'YS',
    projectName: 'Smith Kitchen Remodel',
    timestamp: Date.now() - 1000 * 60 * 60 * 8, // 8 hours ago
  },
  {
    id: 'mock-10',
    type: 'portfolio',
    action: 'created',
    description: 'created new portfolio folder "LED Lighting Projects"',
    userName: 'Maria Rodriguez',
    userInitials: 'MR',
    timestamp: Date.now() - 1000 * 60 * 60 * 9, // 9 hours ago
  },
  {
    id: 'mock-11',
    type: 'time_entry',
    action: 'clock_in',
    description: 'clocked in at Johnson Bathroom site',
    userName: 'Carlos Martinez',
    userInitials: 'CM',
    projectName: 'Johnson Bathroom',
    timestamp: Date.now() - 1000 * 60 * 60 * 10, // 10 hours ago
  },
  {
    id: 'mock-12',
    type: 'inventory',
    action: 'added',
    description: 'added 50 units of 12-gauge wire to inventory',
    userName: 'Azis K',
    userInitials: 'AK',
    timestamp: Date.now() - 1000 * 60 * 60 * 11, // 11 hours ago
  },
  {
    id: 'mock-13',
    type: 'tool',
    action: 'checkout',
    description: 'checked out "DeWalt Drill #5" to job site',
    userName: 'Oumayama M',
    userInitials: 'OM',
    timestamp: Date.now() - 1000 * 60 * 60 * 12, // 12 hours ago
  },
  {
    id: 'mock-14',
    type: 'tool',
    action: 'checkin',
    description: 'returned "Milwaukee Saw #3" to warehouse',
    userName: 'Sarash Williams',
    userInitials: 'SW',
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
  },
  {
    id: 'mock-15',
    type: 'inventory',
    action: 'restock',
    description: 'restocked electrical supplies - 200 items added',
    userName: 'Emely Devis',
    userInitials: 'ED',
    timestamp: Date.now() - 1000 * 60 * 60 * 48, // 2 days ago
  },
];

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);

  // Load activities from AsyncStorage on mount, or use mock data if empty
  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // If we have stored activities, use them
        if (parsed && parsed.length > 0) {
          setActivities(parsed);
        } else {
          // Otherwise use mock data
          setActivities(MOCK_ACTIVITIES);
        }
      } else {
        // No stored activities, use mock data
        setActivities(MOCK_ACTIVITIES);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      // On error, use mock data
      setActivities(MOCK_ACTIVITIES);
    }
  };

  const saveActivities = async (newActivities: Activity[]) => {
    try {
      // Keep only the most recent activities
      const trimmed = newActivities.slice(0, MAX_ACTIVITIES);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      setActivities(trimmed);
    } catch (error) {
      console.error('Error saving activities:', error);
    }
  };

  const logActivity = async (activityData: Omit<Activity, 'id' | 'timestamp'>) => {
    const newActivity: Activity = {
      ...activityData,
      id: generateId(),
      timestamp: Date.now(),
      userInitials: activityData.userInitials || getInitials(activityData.userName),
    };

    const updatedActivities = [newActivity, ...activities];
    await saveActivities(updatedActivities);
  };

  const clearActivities = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setActivities([]);
    } catch (error) {
      console.error('Error clearing activities:', error);
    }
  };

  const refreshActivities = async () => {
    await loadActivities();
  };

  return (
    <ActivityContext.Provider value={{ activities, logActivity, clearActivities, refreshActivities }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
}

// Helper function to format time ago
export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (months > 0) {
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
  if (weeks > 0) {
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  if (days > 0) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }
  if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  if (minutes > 0) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }
  return 'Just now';
}

// Helper to get color for activity type
export function getActivityColor(type: ActivityType): string {
  const colors: Record<ActivityType, string> = {
    project: '#E0E7FF',      // Indigo light
    receipt: '#FEF3C7',      // Amber light
    task: '#D1FAE5',         // Green light
    inspection: '#DBEAFE',   // Blue light
    permit: '#FDE68A',       // Yellow
    invoice: '#C7D2FE',      // Indigo
    change_order: '#FECACA', // Red light
    expense: '#FEE2E2',      // Red very light
    income: '#BBF7D0',       // Green
    portfolio: '#E9D5FF',    // Purple light
    gallery: '#FCE7F3',      // Pink light
    time_entry: '#CFFAFE',   // Cyan light
    inventory: '#FED7AA',    // Orange light
    tool: '#A5B4FC',         // Indigo
    note: '#F3E8FF',         // Purple very light
    contact: '#FBCFE8',      // Pink
    photo: '#BAE6FD',        // Sky light
  };
  return colors[type] || '#E5E7EB';
}

// Helper to get icon for activity type
export function getActivityIcon(type: ActivityType): string {
  const icons: Record<ActivityType, string> = {
    project: 'folder-open',
    receipt: 'receipt',
    task: 'checkmark-circle',
    inspection: 'search',
    permit: 'document-text',
    invoice: 'document',
    change_order: 'swap-horizontal',
    expense: 'trending-down',
    income: 'trending-up',
    portfolio: 'images',
    gallery: 'image',
    time_entry: 'time',
    inventory: 'cube',
    tool: 'construct',
    note: 'create',
    contact: 'person',
    photo: 'camera',
  };
  return icons[type] || 'ellipse';
}
