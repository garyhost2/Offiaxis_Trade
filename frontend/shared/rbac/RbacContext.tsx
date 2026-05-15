import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, UserRole } from '../../contexts/AuthContext';

type Action =
  | 'projects:read' | 'projects:write' | 'projects:delete'
  | 'tracker:clock' | 'tracker:review' | 'tracker:read_all'
  | 'financials:read' | 'financials:write'
  | 'change_orders:read' | 'change_orders:write' | 'change_orders:delete'
  | 'receipts:read' | 'receipts:write'
  | 'inventory:read' | 'inventory:write'
  | 'schedule:read' | 'schedule:write'
  | 'permits:read' | 'permits:write'
  | 'users:manage'
  | 'billing:manage';

type PermissionMatrix = Record<UserRole, Action[]>;

const PERMISSIONS: PermissionMatrix = {
  owner: [
    'projects:read', 'projects:write', 'projects:delete',
    'tracker:clock', 'tracker:review', 'tracker:read_all',
    'financials:read', 'financials:write',
    'change_orders:read', 'change_orders:write', 'change_orders:delete',
    'receipts:read', 'receipts:write',
    'inventory:read', 'inventory:write',
    'schedule:read', 'schedule:write',
    'permits:read', 'permits:write',
    'users:manage', 'billing:manage',
  ],
  admin: [
    'projects:read', 'projects:write', 'projects:delete',
    'tracker:clock', 'tracker:review', 'tracker:read_all',
    'financials:read', 'financials:write',
    'change_orders:read', 'change_orders:write', 'change_orders:delete',
    'receipts:read', 'receipts:write',
    'inventory:read', 'inventory:write',
    'schedule:read', 'schedule:write',
    'permits:read', 'permits:write',
    'users:manage',
  ],
  project_manager: [
    'projects:read', 'projects:write',
    'tracker:clock', 'tracker:review', 'tracker:read_all',
    'financials:read',
    'change_orders:read', 'change_orders:write',
    'receipts:read', 'receipts:write',
    'inventory:read',
    'schedule:read', 'schedule:write',
    'permits:read',
  ],
  field_worker: [
    'projects:read',
    'tracker:clock',
    'receipts:read',
    'schedule:read',
  ],
  subcontractor: [
    'projects:read',
    'tracker:clock',
    'schedule:read',
  ],
  viewer: [
    'projects:read',
    'financials:read',
    'change_orders:read',
    'receipts:read',
    'inventory:read',
    'schedule:read',
    'permits:read',
  ],
};

interface RbacContextType {
  can: (action: Action) => boolean;
  userRole: UserRole | null;
}

const RbacContext = createContext<RbacContextType | undefined>(undefined);

export function RbacProvider({ children }: { children: ReactNode }) {
  const { userRole } = useAuth();

  const can = (action: Action): boolean => {
    if (!userRole) return false;
    return PERMISSIONS[userRole]?.includes(action) ?? false;
  };

  return (
    <RbacContext.Provider value={{ can, userRole }}>
      {children}
    </RbacContext.Provider>
  );
}

export function useRbac() {
  const context = useContext(RbacContext);
  if (!context) throw new Error('useRbac must be used within RbacProvider');
  return context;
}
