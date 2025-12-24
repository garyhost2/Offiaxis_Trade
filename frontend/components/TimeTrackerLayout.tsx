import React from 'react';
import TimeTrackerSimple from './TimeTrackerSimple';
import TimeTrackerCommon from './TimeTrackerCommon';
import TimeTrackerAutomated from './TimeTrackerAutomated';
import TimeTrackerAdmin from './TimeTrackerAdmin';

/**
 * TIME TRACKER LAYOUT - VARIANT ROUTER
 * This component routes to the correct Time Tracker variant based on selection.
 * 
 * Each variant is in its own separate file for independent editing:
 * - TimeTrackerSimple.tsx      → Time Tracker #1 (Simple)
 * - TimeTrackerCommon.tsx      → Time Tracker #2 (Common one)
 * - TimeTrackerAutomated.tsx   → Time Tracker #3 (Automated)
 * - TimeTrackerAdmin.tsx       → Admin
 */

interface TimeTrackerLayoutProps {
  variant: string;
}

export default function TimeTrackerLayout({ variant }: TimeTrackerLayoutProps) {
  switch (variant) {
    case 'Time Tracker #1 (Simple)':
      return <TimeTrackerSimple />;
    case 'Time Tracker #2 (Common one)':
      return <TimeTrackerCommon />;
    case 'Time Tracker #3 (Automated)':
      return <TimeTrackerAutomated />;
    case 'Admin':
      return <TimeTrackerAdmin />;
    default:
      return <TimeTrackerSimple />;
  }
}
