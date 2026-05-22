/**
 * Offiaxis Trade — Status vocabulary
 *
 * Single source of truth for all status/state labels and their colors.
 * Import this instead of defining status colors inline per screen.
 *
 * Usage:
 *   import { JOB_STATUS, getJobStatusStyle } from '../shared/status';
 *   const style = getJobStatusStyle('in_progress');
 *   // { bg: '#FEF3C7', text: '#B45309', dot: '#D97706' }
 */

import { colors } from './theme';

// ─── Job / Project Status ────────────────────────────────────────────────────

export type JobStatus =
  | 'pending'
  | 'scheduled'
  | 'in_progress'
  | 'rough_in'
  | 'final_trim'
  | 'complete'
  | 'blocked'
  | 'cancelled'
  | 'draft';

export const JOB_STATUS: Record<JobStatus, string> = {
  pending:     'Pending',
  scheduled:   'Scheduled',
  in_progress: 'In Progress',
  rough_in:    'Rough-In',
  final_trim:  'Final Trim',
  complete:    'Complete',
  blocked:     'Blocked',
  cancelled:   'Cancelled',
  draft:       'Draft',
};

export function getJobStatusStyle(status: JobStatus | string) {
  switch (status) {
    case 'complete':
    case 'final_trim':
      return colors.status.complete;
    case 'in_progress':
    case 'rough_in':
      return colors.status.inProgress;
    case 'pending':
    case 'draft':
      return colors.status.draft;
    case 'scheduled':
      return colors.status.scheduled;
    case 'blocked':
      return colors.status.blocked;
    case 'cancelled':
      return colors.status.cancelled;
    default:
      return colors.status.draft;
  }
}

// ─── Permit Status ───────────────────────────────────────────────────────────

export type PermitStatus =
  | 'not_applied'
  | 'applied'
  | 'approved'
  | 'expired'
  | 'rejected';

export const PERMIT_STATUS: Record<PermitStatus, string> = {
  not_applied: 'Not Applied',
  applied:     'Applied',
  approved:    'Approved',
  expired:     'Expired',
  rejected:    'Rejected',
};

export function getPermitStatusStyle(status: PermitStatus | string) {
  switch (status) {
    case 'approved':  return colors.status.complete;
    case 'applied':   return colors.status.pending;
    case 'expired':   return colors.status.blocked;
    case 'rejected':  return colors.status.blocked;
    default:          return colors.status.draft;
  }
}

// ─── Change Order Status ─────────────────────────────────────────────────────

export type ChangeOrderStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'voided';

export const CHANGE_ORDER_STATUS: Record<ChangeOrderStatus, string> = {
  draft:     'Draft',
  submitted: 'Submitted',
  approved:  'Approved',
  rejected:  'Rejected',
  voided:    'Voided',
};

export function getChangeOrderStatusStyle(status: ChangeOrderStatus | string) {
  switch (status) {
    case 'approved':  return colors.status.complete;
    case 'submitted': return colors.status.pending;
    case 'rejected':  return colors.status.blocked;
    case 'voided':    return colors.status.cancelled;
    default:          return colors.status.draft;
  }
}

// ─── Receipt Category Colors ─────────────────────────────────────────────────

export type ReceiptCategory =
  | 'materials'
  | 'tools'
  | 'labor'
  | 'permits'
  | 'transportation'
  | 'utilities'
  | 'office'
  | 'other';

/** Semantic color per receipt category (bg + icon color). Not decorative. */
export const RECEIPT_CATEGORY_COLORS: Record<ReceiptCategory, { bg: string; icon: string }> = {
  materials:      { bg: '#FEF3C7', icon: '#D97706' },  // amber — raw materials
  tools:          { bg: '#DBEAFE', icon: '#2563EB' },  // blue  — equipment
  labor:          { bg: '#DCFCE7', icon: '#16A34A' },  // green — people cost
  permits:        { bg: '#EDE9FE', icon: '#7C3AED' },  // purple— legal/admin
  transportation: { bg: '#E0F2FE', icon: '#0284C7' },  // sky   — logistics
  utilities:      { bg: '#FFF7ED', icon: '#EA580C' },  // orange— utilities
  office:         { bg: '#F3F4F6', icon: '#4B5563' },  // gray  — overhead
  other:          { bg: '#F3F4F6', icon: '#6B7280' },  // gray  — misc
};

export const RECEIPT_CATEGORIES: { id: ReceiptCategory; label: string; icon: string }[] = [
  { id: 'materials',      label: 'Materials',         icon: 'cube-outline'           },
  { id: 'tools',          label: 'Tools & Equipment', icon: 'construct-outline'      },
  { id: 'labor',          label: 'Labor',             icon: 'people-outline'         },
  { id: 'permits',        label: 'Permits & Fees',    icon: 'document-text-outline'  },
  { id: 'transportation', label: 'Transportation',    icon: 'car-outline'            },
  { id: 'utilities',      label: 'Utilities',         icon: 'flash-outline'          },
  { id: 'office',         label: 'Office Supplies',   icon: 'briefcase-outline'      },
  { id: 'other',          label: 'Other',             icon: 'ellipsis-horizontal-outline' },
];
