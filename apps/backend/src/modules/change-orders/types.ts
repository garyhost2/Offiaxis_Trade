export type ChangeOrderStatus =
  | 'Submitted'
  | 'In Review'
  | 'Approved'
  | 'Rejected'
  | 'On Hold';

export type ChangeOrderType = 'Invoice' | 'Change Order' | 'Modification';

export interface StatusLogEntry {
  status: ChangeOrderStatus;
  changedBy: string;
  changedAt: Date;
  note?: string;
}

export interface PaymentStatusLogEntry {
  status: string;
  changedBy: string;
  changedAt: Date;
  note?: string;
}

export interface ChangeOrder {
  orgId: string;
  projectId: string;
  title: string;
  description?: string;
  amount: number;
  date: Date;
  status: ChangeOrderStatus;
  type: ChangeOrderType;
  requestedBy: string;
  fileUrl?: string;
  statusLog: StatusLogEntry[];
  paymentStatusLog: PaymentStatusLogEntry[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
