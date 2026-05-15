export type ScheduleEventType = 'job' | 'inspection' | 'meeting' | 'other';
export type ScheduleEventStatus = 'scheduled' | 'completed' | 'cancelled';

export interface ScheduleEvent {
  orgId: string;
  projectId?: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  allDay: boolean;
  assignedTo: string[];
  type: ScheduleEventType;
  status: ScheduleEventStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
