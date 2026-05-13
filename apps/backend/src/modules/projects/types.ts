export type ProjectStatus =
  | 'Rough-In'
  | 'To be scheduled'
  | 'Inspection'
  | 'Completed'
  | 'Final Trim';

export interface OtherContact {
  name: string;
  phone?: string;
  email?: string;
}

export interface Project {
  orgId: string;
  name: string;
  clientName: string;
  street: string;
  city: string;
  phone: string;
  permit?: string;
  status: ProjectStatus;
  initials: string;
  otherContacts: OtherContact[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
