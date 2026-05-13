export type UserRole = 'owner' | 'admin' | 'project_manager' | 'field_worker' | 'subcontractor' | 'viewer';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  orgId: string;
  fcmTokens: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const SUPERVISOR_ROLES: UserRole[] = ['owner', 'admin', 'project_manager'];
export const ADMIN_ROLES: UserRole[] = ['owner', 'admin'];
export const WORKER_ROLES: UserRole[] = ['field_worker', 'subcontractor'];
