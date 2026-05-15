export type PermitStatus = 'pending' | 'active' | 'expired';

export interface Permit {
  orgId: string;
  projectId: string;
  permitNumber?: string;
  issueDate?: Date;
  expirationDate?: Date;
  fees?: number;
  imageUrl?: string;
  extractedData?: Record<string, unknown>;
  status: PermitStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
