// Shared calendar event management for Project <-> Schedule sync
// This provides ONE-WAY sync from Projects to Calendar

// In-memory storage for calendar events (will be replaced with AsyncStorage in production)
let calendarEvents: any[] = [];
let eventListeners: ((events: any[]) => void)[] = [];

// Status to color mapping (must match project card colors)
const STATUS_COLOR_MAP: Record<string, string> = {
  'Rough-In': 'lightblue',
  'Inspection': 'purple',
  'Final Trim': 'green',
  'Completed': 'lightgray',
  'Service Call': 'red',
};

// Get all calendar events
export const getCalendarEvents = (): any[] => {
  return [...calendarEvents];
};

// Subscribe to event changes
export const subscribeToEvents = (callback: (events: any[]) => void) => {
  eventListeners.push(callback);
  // Return unsubscribe function
  return () => {
    eventListeners = eventListeners.filter(cb => cb !== callback);
  };
};

// Notify all listeners
const notifyListeners = () => {
  eventListeners.forEach(callback => callback([...calendarEvents]));
};

// Parse time string to hours and minutes
const parseTime = (timeStr: string): { hours: number; minutes: number } => {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return { hours: 9, minutes: 0 }; // Default 9:00 AM
  
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  return { hours, minutes };
};

// Format address into 2 lines
const formatAddress = (street: string, city: string): string => {
  if (!street && !city) return '';
  if (!city) return street;
  if (!street) return city;
  return `${street}\n${city}`;
};

// Create or update calendar event from project data
export const syncProjectToCalendar = (project: any, statusData: any) => {
  console.log('[SYNC] syncProjectToCalendar called', { 
    projectId: project.id, 
    projectName: project.name, 
    status: statusData.newStatus || project.status 
  });
  
  // Determine which dates to use based on status
  let startDateStr = '';
  let endDateStr = '';
  
  switch (statusData.newStatus || project.status) {
    case 'Rough-In':
      startDateStr = statusData.roughInStart || project.roughInStart;
      endDateStr = statusData.roughInEnd || project.roughInEnd || startDateStr;
      break;
    case 'Inspection':
      startDateStr = statusData.inspectionDate || project.inspectionDate;
      endDateStr = startDateStr; // Single day event
      break;
    case 'Final Trim':
      startDateStr = statusData.finalTrimStart || project.finalTrimStart;
      endDateStr = statusData.finalTrimEnd || project.finalTrimEnd || startDateStr;
      break;
    case 'Completed':
    case 'Service Call':
      startDateStr = statusData.completedDate || project.completedDate;
      endDateStr = startDateStr; // Single day event
      break;
    default:
      // No dates for "To be scheduled"
      return deleteProjectEvent(project.id);
  }
  
  // If no dates, remove the event
  if (!startDateStr) {
    return deleteProjectEvent(project.id);
  }
  
  // Parse dates
  const startDate = new Date(startDateStr);
  const endDate = endDateStr ? new Date(endDateStr) : new Date(startDateStr);
  
  // Get start time (default 9:00 AM)
  const startTime = statusData.startTime || project.startTime || '9:00 AM';
  const { hours: startHours, minutes: startMinutes } = parseTime(startTime);
  
  // Set start time
  startDate.setHours(startHours, startMinutes, 0, 0);
  
  // Get end time (default 4:30 PM)
  const endTime = statusData.endTime || project.endTime || '4:30 PM';
  const { hours: endHours, minutes: endMinutes } = parseTime(endTime);
  
  // Set end time
  endDate.setHours(endHours, endMinutes, 0, 0);
  
  // Get color based on status
  const status = statusData.newStatus || project.status;
  const color = STATUS_COLOR_MAP[status] || 'lightblue';
  
  // Format location
  const location = formatAddress(project.street, project.city);
  
  // Create event object
  const event = {
    id: `project-${project.id}`, // Prefix with 'project-' to identify synced events
    title: project.name,
    start: startDate,
    end: endDate,
    location: location,
    color: color,
    projectId: project.id,
    assignedTeam: statusData.assignedEmployee || project.assignedEmployee || '',
    alerts: statusData.alerts || project.alerts || [],
    notes: statusData.notes || project.notes || '',
    status: status,
  };
  
  // Find existing event
  const existingIndex = calendarEvents.findIndex(e => e.id === event.id);
  
  if (existingIndex >= 0) {
    // Update existing event
    console.log('[SYNC] Updating existing event:', event.id, event.title);
    calendarEvents[existingIndex] = event;
  } else {
    // Add new event
    console.log('[SYNC] Adding new event:', event.id, event.title, event.start, event.end);
    calendarEvents.push(event);
  }
  
  console.log('[SYNC] Total events in store:', calendarEvents.length);
  notifyListeners();
  return event;
};

// Delete project event from calendar
export const deleteProjectEvent = (projectId: number) => {
  const eventId = `project-${projectId}`;
  const initialLength = calendarEvents.length;
  calendarEvents = calendarEvents.filter(e => e.id !== eventId);
  
  if (calendarEvents.length !== initialLength) {
    notifyListeners();
  }
};

// Initialize with default events from schedule
export const initializeEvents = (defaultEvents: any[]) => {
  // Only add non-project events (events without 'project-' prefix)
  const nonProjectEvents = defaultEvents.filter(e => !String(e.id).startsWith('project-'));
  calendarEvents = [...nonProjectEvents, ...calendarEvents];
  notifyListeners();
};

// Add a manual event (from schedule page)
export const addManualEvent = (event: any) => {
  // Make sure it doesn't have project- prefix
  if (String(event.id).startsWith('project-')) {
    console.warn('Cannot manually add project-synced events');
    return;
  }
  
  calendarEvents.push(event);
  notifyListeners();
};

// Update manual event (from schedule page)
export const updateManualEvent = (eventId: string | number, updates: any) => {
  // Don't allow updating project-synced events from calendar
  if (String(eventId).startsWith('project-')) {
    console.warn('Cannot edit project-synced events from calendar');
    return;
  }
  
  const index = calendarEvents.findIndex(e => e.id === eventId);
  if (index >= 0) {
    calendarEvents[index] = { ...calendarEvents[index], ...updates };
    notifyListeners();
  }
};

// Delete manual event (from schedule page)
export const deleteManualEvent = (eventId: string | number) => {
  // Don't allow deleting project-synced events from calendar
  if (String(eventId).startsWith('project-')) {
    console.warn('Cannot delete project-synced events from calendar');
    return;
  }
  
  calendarEvents = calendarEvents.filter(e => e.id !== eventId);
  notifyListeners();
};
