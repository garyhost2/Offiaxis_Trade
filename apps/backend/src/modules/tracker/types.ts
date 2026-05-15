export type TrackerStatus = 'active' | 'on_break' | 'completed' | 'pending_review';

export interface TrackerSession {
  orgId: string;
  userId: string;
  projectId?: string;
  clockIn: Date;
  clockOut?: Date;
  breakStart?: Date;
  breakEnd?: Date;
  status: TrackerStatus;
  note?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  manualEntry: boolean;
  createdAt: Date;
  updatedAt: Date;
}
