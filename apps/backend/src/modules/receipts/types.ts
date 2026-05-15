export interface Receipt {
  orgId: string;
  projectId?: string;
  vendor: string;
  amount: number;
  date: Date;
  category: string;
  imageUrl?: string;
  note?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
