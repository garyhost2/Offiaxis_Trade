import React, { ReactNode } from 'react';
import { useRbac } from './RbacContext';

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

interface RoleGateProps {
  action: Action;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGate({ action, children, fallback = null }: RoleGateProps) {
  const { can } = useRbac();
  return can(action) ? <>{children}</> : <>{fallback}</>;
}
