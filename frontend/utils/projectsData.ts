// Shared projects data - In a real app, this would be in a state management solution or API
// For now, this acts as a simple in-memory store

// Helper function to format date without timezone issues
export const formatDateWithoutTimezone = (dateInput: any): string => {
  if (!dateInput) {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }
  
  // If it's already a string in YYYY-MM-DD format, return it
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  
  // If it's a Date object or ISO string, extract date parts without timezone conversion
  const date = typeof dateInput === 'string' ? new Date(dateInput + 'T00:00:00') : new Date(dateInput);
  
  // Use getFullYear, getMonth, getDate to avoid timezone issues
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export type Project = {
  id: number;
  name: string;
  street: string;
  city: string;
  phone: string;
  email?: string;
  status: string;
  initials: string;
  galleryDescription?: string;
  [key: string]: any;
};

let projectsStore: Project[] = [
  { 
    id: 1, 
    galleryDescription: 'Kitchen Remodel',
    name: 'Andrew Martinez', 
    street: '1234 Cherry Creek Dr', 
    city: 'Denver, CO 80223', 
    phone: '(720) 555-0101', 
    email: '', 
    permit: 'PRM-2024-001', 
    status: 'Rough-In', 
    initials: 'AM', 
    company: 'Boulder Contractor', 
    companyInitials: 'BC', 
    otherContacts: [{ id: '1-c1', name: 'Sarah Martinez', phone: '(720) 555-1001', email: 'sarah.m@example.com', note: '' }], 
    contacts: [], 
    propertyDescription: 'The job is located downtown; parking is limited. Lock box located in the lobby. Code #2654.', 
    accessCode: '#2654',
    locationImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800', 
    roughInStart: '2025-12-09', 
    roughInEnd: '2025-12-12', 
    inspectionDate: '', 
    finalTrimStart: '', 
    finalTrimEnd: '', 
    completedDate: '', 
    warrantyStart: '', 
    warrantyEnd: '',
    statusLogs: [
      {
        id: 'status-log-3',
        timestamp: '2025-12-09T09:15:00Z',
        oldStatus: 'To be scheduled',
        newStatus: 'Rough-In',
        note: 'Project kicked off. Materials delivered and team assigned.',
        changedBy: 'Admin'
      },
      {
        id: 'status-log-2',
        timestamp: '2025-11-20T14:30:00Z',
        oldStatus: 'Inspection',
        newStatus: 'To be scheduled',
        note: 'Inspection failed. Rescheduling required for electrical work.',
        changedBy: 'Inspector Johnson'
      },
      {
        id: 'status-log-1',
        timestamp: '2025-10-15T10:00:00Z',
        oldStatus: 'Service Call',
        newStatus: 'Inspection',
        note: 'Service call completed successfully. Ready for inspection.',
        changedBy: 'Tech Lead'
      }
    ],
    inspections: [
      {
        id: 'insp-1',
        projectName: 'Andrew Martinez',
        createdDate: '2025-12-03',
        scheduledDate: '2025-12-08',
        inspectionDate: '2025-12-08',
        stageFrom: 'Final Trim',
        stageTo: 'Inspection',
        assignedTo: 'Azis K',
        status: 'Final',
        passFailStatus: 'Pass',
        failNotes: '',
        failPhotos: [],
        checklist: [
          { id: 'check-1', text: 'Check electrical wiring', checked: true },
          { id: 'check-2', text: 'Verify plumbing connections', checked: true },
          { id: 'check-3', text: 'Inspect HVAC installation', checked: true }
        ],
        inspectorNotes: {
          deficiencies: '',
          corrections: '',
          reInspectionDate: null
        },
        photos: {
          before: [],
          after: [],
          correction: []
        }
      },
      {
        id: 'insp-2',
        projectName: 'Andrew Martinez',
        createdDate: '2025-11-03',
        scheduledDate: '2025-11-07',
        inspectionDate: '2025-11-07',
        stageFrom: 'Rough-In',
        stageTo: 'Inspection',
        assignedTo: 'Azis K',
        status: 'Rough-In',
        passFailStatus: 'Pass',
        failNotes: '',
        failPhotos: [],
        checklist: [
          { id: 'check-4', text: 'Verify all outlets functional', checked: true },
          { id: 'check-5', text: 'Check panel cover installation', checked: true },
          { id: 'check-6', text: 'Test GFCI protection', checked: true }
        ],
        inspectorNotes: {
          deficiencies: '',
          corrections: '',
          reInspectionDate: null
        },
        photos: {
          before: [],
          after: [],
          correction: []
        }
      }
    ],
    changeOrders: [
      {
        id: '1-co-7',
        title: 'Emergency Leak Repair - 2023',
        description: 'Emergency repair for basement pipe leak',
        amount: 1800,
        date: '2025-02-10',
        status: 'Approved',
        type: 'Change Order',
        requestedBy: 'Andrew Martinez',
        paymentStatus: 'Paid',
        paidAmount: 1800,
        paidDate: '2025-02-10',
        statusLogs: []
      },
      {
        id: '1-co-6',
        title: 'Initial Plumbing Deposit - 2024',
        description: 'Initial deposit for plumbing project work',
        amount: 4500,
        date: '2025-03-20',
        status: 'Approved',
        type: 'Invoice',
        requestedBy: 'Boulder Contractor',
        paymentStatus: 'Paid',
        paidAmount: 4500,
        paidDate: '2025-03-20',
        statusLogs: []
      },
      {
        id: '1-co-4',
        title: 'Materials Invoice - PEX Piping',
        description: 'Material costs for plumbing rough-in:\n- 250ft PEX-A tubing (red)\n- 250ft PEX-A tubing (blue)\n- Manifolds and fittings\n- Expansion tools rental',
        amount: 1250,
        date: '2025-05-15',
        status: 'Approved',
        type: 'Invoice',
        requestedBy: 'Boulder Contractor',
        paymentStatus: 'Unpaid',
        statusLogs: [
          {
            id: 'log-4',
            timestamp: '2025-05-15T14:30:00Z',
            oldStatus: 'Submitted',
            newStatus: 'Approved',
            note: 'Materials delivered and verified',
            changedBy: 'Project Manager'
          }
        ]
      },
      {
        id: '1-co-3',
        title: 'Kitchen Sink Location Change',
        description: 'Move kitchen sink 2 feet to the left to accommodate new island design. Requires:\n- Rerouting drain line\n- Adjusting water supply lines\n- Additional labor',
        amount: -450,
        date: '2025-07-16',
        status: 'On Hold',
        type: 'Modification',
        requestedBy: 'Andrew Martinez',
        paymentStatus: 'Refunded',
        paidAmount: 450,
        paidDate: '2025-07-16',
        statusLogs: [
          {
            id: 'log-3',
            timestamp: '2025-07-16T09:00:00Z',
            oldStatus: 'Submitted',
            newStatus: 'On Hold',
            note: 'Waiting for final kitchen cabinet measurements before proceeding',
            changedBy: 'Project Manager'
          }
        ]
      },
      {
        id: '1-co-5',
        title: 'Add Tankless Water Heater',
        description: 'Replace standard 50-gallon tank with Rinnai tankless water heater. Includes:\n- Rinnai RU199iN tankless unit\n- Gas line upgrade to 3/4"\n- New venting system\n- Condensate drain installation',
        amount: 3200,
        date: '2025-09-17',
        status: 'In Review',
        type: 'Change Order',
        requestedBy: 'Andrew Martinez',
        paymentStatus: 'Unpaid',
        statusLogs: [
          {
            id: 'log-5',
            timestamp: '2025-09-17T11:20:00Z',
            oldStatus: 'Submitted',
            newStatus: 'In Review',
            note: 'Verifying gas line capacity and permit requirements with city inspector',
            changedBy: 'Lead Technician'
          }
        ]
      },
      {
        id: '1-co-1',
        title: 'Additional Bathroom Fixtures',
        description: 'Customer requested upgraded fixtures:\n- High-end faucets for master bath\n- Rainfall showerhead\n- Custom vanity mirrors',
        amount: 2850,
        date: '2025-10-18',
        status: 'Approved',
        type: 'Change Order',
        requestedBy: 'Andrew Martinez',
        paymentStatus: 'Paid',
        paidAmount: 2850,
        paidDate: '2025-10-18',
        statusLogs: [
          {
            id: 'log-1',
            timestamp: '2025-11-18T10:30:00Z',
            oldStatus: 'Submitted',
            newStatus: 'In Review',
            note: 'Reviewing material costs and timeline impact',
            changedBy: 'Project Manager'
          },
          {
            id: 'log-2',
            timestamp: '2025-11-19T14:15:00Z',
            oldStatus: 'In Review',
            newStatus: 'Approved',
            note: 'Approved by homeowner. Fixtures ordered, expected delivery in 3 days',
            changedBy: 'Project Manager'
          }
        ],
        paymentStatusLogs: [
          {
            id: 'plog-1',
            timestamp: '2025-11-20T09:00:00Z',
            oldStatus: 'Unpaid',
            newStatus: 'Partially Paid',
            note: 'Received 50% deposit from homeowner',
            changedBy: 'Current User',
            paidAmount: 1425
          },
          {
            id: 'plog-2',
            timestamp: '2025-11-22T16:30:00Z',
            oldStatus: 'Partially Paid',
            newStatus: 'Paid',
            note: 'Final payment received after installation completed',
            changedBy: 'Current User',
            paidAmount: 2850
          }
        ]
      },
      {
        id: '1-co-2',
        title: 'Progress Invoice #1 - Rough-In Complete',
        description: 'Invoice for rough-in work completed:\n- All plumbing lines installed\n- Gas lines connected\n- Fixtures stubbed out\n- Inspection scheduled',
        amount: 8500,
        date: '2025-11-20',
        status: 'Submitted',
        type: 'Invoice',
        requestedBy: 'Boulder Contractor',
        paymentStatus: 'Partially Paid',
        paidAmount: 5000,
        paidDate: '2025-11-20',
        statusLogs: []
      }
    ],
    permits: [
      {
        id: 'permit-example-1',
        fileUri: 'https://customer-assets.emergentagent.com/job_eventedit-modal/artifacts/ltz2t6kd_image.png',
        fileName: 'Residential_Permit_RES-25-01340.png',
        fileType: 'image/png',
        permitNumber: 'RES-25-01340',
        issueDate: '10/17/2025',
        expirationDate: '04/15/2026',
        fees: '$213.96',
        dateAdded: '2025-12-09'
      }
    ],
    receipts: [
      {
        id: 'receipt-1',
        imageUri: 'https://customer-assets.emergentagent.com/job_project-organizer-4/artifacts/itjg8iq3_image.png',
        storeName: 'THE HOME DEPOT',
        storeAddress: '2555 GRANT AVE\nPHILADELPHIA PA 19114\n(215) 969-1478',
        date: '12/10/2025',
        time: '2:30 PM',
        items: [
          { name: '3-PACK CAULK', sku: '1003184254', price: 16.97 },
          { name: 'FOAM SEALANT', sku: '1000090946', price: 8.47 },
          { name: '3/4 PLYWOOD', sku: '1000094142', price: 32.48 },
          { name: 'PLYWOOD 4X8', sku: '1000094140', price: 38.97 },
        ],
        subtotal: '96.89',
        tax: '5.81',
        totalAmount: '102.70',
        paymentMethod: 'VISA',
        lastFourDigits: '0012',
        itemCount: 4,
        createdAt: '2025-12-10T14:30:00Z',
      },
      {
        id: 'receipt-2',
        imageUri: 'https://images.unsplash.com/photo-1545941962-1b6654eb8072?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwxfHxzdG9yZSUyMHJlY2VpcHR8ZW58MHx8fHwxNzY1NTE1NDY1fDA&ixlib=rb-4.1.0&q=85',
        storeName: "LOWE'S HOME IMPROVEMENT",
        storeAddress: '1500 WASHINGTON AVE\nPHILADELPHIA PA 19146\n(215) 555-1234',
        date: '12/08/2025',
        time: '10:15 AM',
        items: [
          { name: 'DEWALT DRILL KIT', sku: 'DWD110K', price: 79.99 },
          { name: 'DRILL BIT SET 29PC', sku: 'DW1969', price: 29.97 },
          { name: 'SAFETY GLASSES', sku: 'SG2000', price: 12.98 },
          { name: 'WORK GLOVES XL', sku: 'WG500XL', price: 15.99 },
          { name: 'EXTENSION CORD 50FT', sku: 'EC50HD', price: 34.99 },
        ],
        subtotal: '173.92',
        tax: '10.44',
        totalAmount: '184.36',
        paymentMethod: 'MASTERCARD',
        lastFourDigits: '4589',
        itemCount: 5,
        createdAt: '2025-12-08T10:15:00Z',
      },
      {
        id: 'receipt-3',
        imageUri: 'https://images.unsplash.com/photo-1731686602391-7484df33a03c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHw0fHxMb3dlJTI3cyUyMHJlY2VpcHR8ZW58MHx8fHwxNzY1NTE1NDUxfDA&ixlib=rb-4.1.0&q=85',
        storeName: 'ACE HARDWARE',
        storeAddress: '789 MAIN STREET\nKING OF PRUSSIA PA 19406\n(610) 555-9876',
        date: '12/05/2025',
        time: '3:45 PM',
        items: [
          { name: 'PAINT BRUSHES SET', sku: 'PB3000', price: 24.99 },
          { name: 'PAINTERS TAPE 3PK', sku: 'PT180-3', price: 18.49 },
          { name: 'DROP CLOTH 9X12', sku: 'DC912', price: 12.99 },
          { name: 'INTERIOR PAINT GAL', sku: 'IP-EGG-WH', price: 42.99 },
          { name: 'PAINT TRAY', sku: 'PTRY01', price: 4.99 },
          { name: 'ROLLER COVERS 3PK', sku: 'RC938-3', price: 11.99 },
        ],
        subtotal: '116.44',
        tax: '6.99',
        totalAmount: '123.43',
        paymentMethod: 'AMEX',
        lastFourDigits: '1234',
        itemCount: 6,
        createdAt: '2025-12-05T15:45:00Z',
      },
    ],
    tasks: [
      {
        id: 'task-1',
        title: 'Master Bedroom Remodel',
        assignedTeam: [],
        createdDate: '2025-12-09',
        categories: [
          {
            id: 'cat-1',
            name: 'Demolition & Removal',
            items: [
              { id: 'item-1', text: 'Remove existing carpet and padding', checked: false },
              { id: 'item-2', text: 'Remove tack strips, staples, and nails from the subfloor', checked: false },
              { id: 'item-3', text: 'Remove existing baseboards (label for reinstallation)', checked: false },
              { id: 'item-4', text: 'Remove closet doors and hardware (label doors & hinges)', checked: false },
              { id: 'item-5', text: 'Remove existing fan/light fixture (cap wires)', checked: false },
              { id: 'item-6', text: 'Remove wall sconces (cap wires)', checked: false }
            ]
          },
          {
            id: 'cat-2',
            name: 'Repairs & Prep',
            items: [
              { id: 'item-7', text: 'Patch drywall dents near window', checked: false },
              { id: 'item-8', text: 'Skim-coat wall behind bed to remove texture', checked: false },
              { id: 'item-9', text: 'Sand all patched areas', checked: false },
              { id: 'item-10', text: 'Inspect and repair any damaged subfloor areas', checked: false }
            ]
          },
          {
            id: 'cat-3',
            name: 'Electrical Prep',
            items: [
              { id: 'item-11', text: 'Verify power is off at the breaker before removal', checked: false },
              { id: 'item-12', text: 'Cap all exposed wires with proper connectors', checked: false },
              { id: 'item-13', text: 'Leave electrical boxes clean and ready for new fixtures', checked: false }
            ]
          },
          {
            id: 'cat-4',
            name: 'Site Preparation',
            items: [
              { id: 'item-14', text: 'Vacuum entire room including corners and subfloor', checked: false },
              { id: 'item-15', text: 'Wipe down drywall dust from walls and trim', checked: false },
              { id: 'item-16', text: 'Ensure room is clear for painters and flooring crew', checked: false }
            ]
          },
          {
            id: 'cat-5',
            name: 'Trash & Clean-Up',
            items: [
              { id: 'item-17', text: 'Bag all debris and take to designated dump location', checked: false },
              { id: 'item-18', text: 'Remove carpet and trash to garage/dumpster', checked: false },
              { id: 'item-19', text: 'Leave work area clean and ready for next trade', checked: false }
            ]
          }
        ]
      },
      {
        id: 'task-2',
        title: 'Office Room Remodel',
        assignedTeam: [],
        createdDate: '2025-12-09',
        categories: [
          {
            id: 'cat-6',
            name: 'Demolition & Removal',
            items: [
              { id: 'item-20', text: 'Remove built-in shelves (left wall)', checked: false },
              { id: 'item-21', text: 'Remove laminate flooring and underlayment', checked: false },
              { id: 'item-22', text: 'Remove transition strips at entry', checked: false },
              { id: 'item-23', text: 'Remove fluorescent ceiling fixture', checked: false },
              { id: 'item-24', text: 'Remove two wall outlets (prepare for new TR outlets)', checked: false }
            ]
          },
          {
            id: 'cat-7',
            name: 'Repairs & Patch Work',
            items: [
              { id: 'item-25', text: 'Patch drywall holes from shelving anchors', checked: false },
              { id: 'item-26', text: 'Patch areas damaged during shelf removal', checked: false },
              { id: 'item-27', text: 'Sand all patched areas smooth', checked: false }
            ]
          },
          {
            id: 'cat-8',
            name: 'Electrical Prep',
            items: [
              { id: 'item-28', text: 'Verify breaker is off before electrical work', checked: false },
              { id: 'item-29', text: 'Cap all fixture wires with approved connectors', checked: false },
              { id: 'item-30', text: 'Prep junction box for new LED panel', checked: false },
              { id: 'item-31', text: 'Prep wall boxes for new tamper-resistant outlets', checked: false }
            ]
          },
          {
            id: 'cat-9',
            name: 'Trim & Carpentry',
            items: [
              { id: 'item-32', text: 'Remove existing window trim cleanly', checked: false },
              { id: 'item-33', text: 'Record trim measurements for replacement', checked: false },
              { id: 'item-34', text: 'Inspect framing around window for damage', checked: false }
            ]
          },
          {
            id: 'cat-10',
            name: 'Site Preparation',
            items: [
              { id: 'item-35', text: 'Sweep and vacuum the entire room', checked: false },
              { id: 'item-36', text: 'Remove dust from windowsill and wall surfaces', checked: false },
              { id: 'item-37', text: 'Organize workspace for flooring crew', checked: false }
            ]
          },
          {
            id: 'cat-11',
            name: 'Trash & Clean-Up',
            items: [
              { id: 'item-38', text: 'Bag all debris and place in dumpster/garage', checked: false },
              { id: 'item-39', text: 'Stack reusable materials neatly', checked: false },
              { id: 'item-40', text: 'Leave room clean and ready for next phase', checked: false }
            ]
          }
        ]
      }
    ],
    checklists: [
      {
        id: 'checklist-1',
        title: 'Pre-Installation Safety Checklist',
        assignedTeam: [],
        createdDate: '2025-12-09',
        categories: [
          {
            id: 'cl-cat-1',
            name: 'Safety Equipment',
            items: [
              { id: 'cl-item-1', text: 'Hard hats available for all workers', checked: false },
              { id: 'cl-item-2', text: 'Safety glasses provided', checked: false },
              { id: 'cl-item-3', text: 'Work gloves available', checked: false },
              { id: 'cl-item-4', text: 'First aid kit on site', checked: false }
            ]
          },
          {
            id: 'cl-cat-2',
            name: 'Site Inspection',
            items: [
              { id: 'cl-item-5', text: 'Check electrical connections', checked: false },
              { id: 'cl-item-6', text: 'Verify gas lines are off', checked: false },
              { id: 'cl-item-7', text: 'Inspect for hazardous materials', checked: false }
            ]
          }
        ]
      },
      {
        id: 'checklist-2',
        title: 'Quality Assurance Checklist',
        assignedTeam: ['John D.', 'Sarah M.'],
        createdDate: '2025-12-09',
        categories: [
          {
            id: 'cl-cat-3',
            name: 'Measurements',
            items: [
              { id: 'cl-item-8', text: 'Verify room dimensions match plans', checked: true },
              { id: 'cl-item-9', text: 'Check window sizes', checked: true },
              { id: 'cl-item-10', text: 'Confirm door frame measurements', checked: false }
            ]
          },
          {
            id: 'cl-cat-4',
            name: 'Material Quality',
            items: [
              { id: 'cl-item-11', text: 'Inspect delivered materials', checked: false },
              { id: 'cl-item-12', text: 'Check for defects or damage', checked: false },
              { id: 'cl-item-13', text: 'Verify material specifications', checked: false }
            ]
          }
        ]
      }
    ],
    materialLists: [
      {
        id: 'material-list-1',
        name: 'Bedroom Flooring Materials',
        pickupLocation: 'Home Depot',
        pickupAddress: '1234 Market St, Denver, CO 80202',
        dueDate: '12/15/2025',
        priority: 'high',
        notes: 'Call ahead to confirm availability. Ask for contractor discount.',
        assignedTeam: ['John Smith', 'Mike Johnson'],
        createdDate: '2025-12-09',
        items: [
          { id: 'mat-item-1', name: 'Luxury Vinyl Plank Flooring (Oak)', quantity: '400', unit: 'feet', estimatedCost: '3.50', purchased: true, url: 'homedepot.com/p/vinyl-plank-flooring-oak' },
          { id: 'mat-item-2', name: 'Underlayment Roll', quantity: '2', unit: 'boxes', estimatedCost: '45.00', purchased: true, url: 'homedepot.com/p/underlayment-roll' },
          { id: 'mat-item-3', name: 'Quarter Round Molding', quantity: '100', unit: 'feet', estimatedCost: '1.25', purchased: false },
          { id: 'mat-item-4', name: 'Transition Strips', quantity: '3', unit: 'pieces', estimatedCost: '18.00', purchased: false, url: 'homedepot.com/p/transition-strips' },
          { id: 'mat-item-5', name: 'Floor Adhesive', quantity: '2', unit: 'gal', estimatedCost: '32.00', purchased: false }
        ]
      },
      {
        id: 'material-list-2',
        name: 'Electrical Supplies',
        pickupLocation: 'Lowes',
        pickupAddress: '5678 Broadway, Denver, CO 80216',
        dueDate: '12/18/2025',
        priority: 'medium',
        notes: 'Get electrical permit before pickup.',
        assignedTeam: ['David Brown'],
        createdDate: '2025-12-09',
        items: [
          { id: 'mat-item-6', name: '12/2 Romex Wire', quantity: '250', unit: 'feet', estimatedCost: '0.85', purchased: false },
          { id: 'mat-item-7', name: 'Outlet Boxes', quantity: '8', unit: 'pieces', estimatedCost: '2.50', purchased: false },
          { id: 'mat-item-8', name: 'GFCI Outlets', quantity: '2', unit: 'pieces', estimatedCost: '18.00', purchased: false },
          { id: 'mat-item-9', name: 'Light Switch (Dimmer)', quantity: '2', unit: 'pieces', estimatedCost: '24.00', purchased: false },
          { id: 'mat-item-10', name: 'Wire Nuts (Assorted)', quantity: '1', unit: 'boxes', estimatedCost: '8.50', purchased: false },
          { id: 'mat-item-11', name: 'Electrical Tape', quantity: '3', unit: 'pieces', estimatedCost: '4.00', purchased: false }
        ]
      },
      {
        id: 'material-list-3',
        name: 'Paint & Finishing',
        pickupLocation: 'Sherwin Williams',
        pickupAddress: '910 Colorado Blvd, Denver, CO 80206',
        dueDate: '12/20/2025',
        priority: 'low',
        notes: 'Get color samples approved by client before final purchase.',
        assignedTeam: [],
        createdDate: '2025-12-09',
        items: [
          { id: 'mat-item-12', name: 'Interior Paint (Eggshell) - Walls', quantity: '5', unit: 'gal', estimatedCost: '55.00', purchased: false },
          { id: 'mat-item-13', name: 'Primer', quantity: '2', unit: 'gal', estimatedCost: '35.00', purchased: false },
          { id: 'mat-item-14', name: 'Paint Rollers', quantity: '6', unit: 'pieces', estimatedCost: '8.00', purchased: false },
          { id: 'mat-item-15', name: 'Paint Brushes (2", 3")', quantity: '4', unit: 'pieces', estimatedCost: '12.00', purchased: false },
          { id: 'mat-item-16', name: 'Painters Tape (Blue)', quantity: '4', unit: 'pieces', estimatedCost: '7.50', purchased: false },
          { id: 'mat-item-17', name: 'Drop Cloths', quantity: '3', unit: 'pieces', estimatedCost: '15.00', purchased: false }
        ]
      }
    ],
    galleryPhotos: {
      before: [
        {
          id: 'before-1',
          url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
          timestamp: '2025-12-01T09:00:00Z',
          folderId: 'before',
          projectId: '1',
          title: 'Kitchen Before - Overall View',
          description: 'Initial state of the kitchen before renovation. Outdated cabinets and appliances.',
          location: '1234 Cherry Creek Dr, Denver'
        },
        {
          id: 'before-2',
          url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
          timestamp: '2025-12-01T09:15:00Z',
          folderId: 'before',
          projectId: '1',
          title: 'Kitchen Cabinets - Before',
          description: 'Old wooden cabinets to be replaced with modern shaker style.'
        },
        {
          id: 'before-3',
          url: 'https://images.unsplash.com/photo-1556909172-8c2f041fca1e?w=800',
          timestamp: '2025-12-01T09:30:00Z',
          folderId: 'before',
          projectId: '1',
          title: 'Sink Area - Before',
          description: 'Existing sink and countertop area requiring update.'
        }
      ],
      during: [
        {
          id: 'during-1',
          url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
          timestamp: '2025-12-05T14:00:00Z',
          folderId: 'during',
          projectId: '1',
          title: 'Demolition Day 1',
          description: 'Old cabinets removed, preparing for new installation.',
          location: '1234 Cherry Creek Dr'
        },
        {
          id: 'during-2',
          url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800',
          timestamp: '2025-12-06T10:00:00Z',
          folderId: 'during',
          projectId: '1',
          title: 'Plumbing Rough-In',
          description: 'New PEX piping installed for sink relocation.'
        },
        {
          id: 'during-3',
          url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
          timestamp: '2025-12-07T11:30:00Z',
          folderId: 'during',
          projectId: '1',
          title: 'Electrical Work',
          description: 'Adding new circuits for appliances and under-cabinet lighting.'
        },
        {
          id: 'during-4',
          url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800',
          timestamp: '2025-12-08T15:00:00Z',
          folderId: 'during',
          projectId: '1',
          title: 'Cabinet Installation Progress',
          description: 'Base cabinets being installed, wall cabinets next.'
        }
      ],
      final: [
        {
          id: 'final-1',
          url: 'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=800',
          timestamp: '2025-12-12T16:00:00Z',
          folderId: 'final',
          projectId: '1',
          title: 'Completed Kitchen - Main View',
          description: 'Final result of the kitchen remodel. Modern white shaker cabinets with quartz countertops.',
          location: '1234 Cherry Creek Dr'
        },
        {
          id: 'final-2',
          url: 'https://images.unsplash.com/photo-1556909114-4a3f6a9de4c4?w=800',
          timestamp: '2025-12-12T16:15:00Z',
          folderId: 'final',
          projectId: '1',
          title: 'New Sink & Faucet',
          description: 'Stainless steel farmhouse sink with modern brushed nickel faucet.'
        }
      ],
      issues: [
        {
          id: 'issue-1',
          url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800',
          timestamp: '2025-12-10T08:30:00Z',
          folderId: 'issues',
          projectId: '1',
          title: 'Cabinet Door Alignment',
          description: 'Upper cabinet door slightly misaligned - needs adjustment.',
          location: 'Kitchen - North Wall'
        },
        {
          id: 'issue-2',
          url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800',
          timestamp: '2025-12-11T09:00:00Z',
          folderId: 'issues',
          projectId: '1',
          title: 'Paint Touch-up Needed',
          description: 'Small paint touch-up required near outlet cover.'
        }
      ]
    }
  },
  { id: 2, galleryDescription: 'Bathroom Remodel', name: 'Barbara Thompson', street: '5678 Capitol Hill Ave', city: 'Denver, CO 80203', phone: '(303) 555-0102', email: '', permit: 'PRM-2024-002', status: 'To be scheduled', initials: 'BT', company: 'Denver Contractor', companyInitials: 'DC', otherContacts: [{ id: '2-c1', name: 'Michael Brown', phone: '(303) 555-1002', email: 'michael.b@example.com', note: 'Primary contact for permits' }], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 3, galleryDescription: 'Full Home Renovation', name: 'Carlos Rodriguez', street: '910 Highlands Blvd', city: 'Denver, CO 80211', phone: '(720) 555-0103', email: '', permit: 'PRM-2024-003', status: 'Inspection', initials: 'CR', company: 'Golden Contractor', companyInitials: 'GC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '2025-01-15', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 4, galleryDescription: 'Living Room Remodel', name: 'Diana Foster', street: '1122 Washington Park Way', city: 'Denver, CO 80209', phone: '(303) 555-0104', email: '', permit: 'PRM-2024-004', status: 'Completed', initials: 'DF', company: 'Golden Contractor', companyInitials: 'GC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '2025-02-18', warrantyStart: '2025-02-18', warrantyEnd: '2026-02-18' },
  { id: 5, galleryDescription: 'Bedroom Remodel', name: 'Edward Chen', street: '3344 LoDo St', city: 'Denver, CO 80202', phone: '(720) 555-0105', email: '', permit: 'PRM-2024-005', status: 'Final Trim', initials: 'EC', company: 'Boulder Contractor', companyInitials: 'BC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '2025-03-10', finalTrimEnd: '2025-03-17', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 6, galleryDescription: 'Attic Finish or Conversion', name: 'Fiona O\'Neill', street: '5566 RiNo Ave', city: 'Denver, CO 80216', phone: '(303) 555-0106', email: '', permit: 'PRM-2024-006', status: 'Rough-In', initials: 'FO', company: 'Denver Contractor', companyInitials: 'DC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '2025-04-08', roughInEnd: '2025-04-14', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 7, galleryDescription: 'Laundry Room Remodel', name: 'Gabriel Santos', street: '7788 Park Hill Rd', city: 'Denver, CO 80207', phone: '(720) 555-0107', email: '', permit: 'PRM-2024-007', status: 'To be scheduled', initials: 'GS', company: 'Golden Contractor', companyInitials: 'GC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 8, galleryDescription: 'Open-Concept Layout Modification', name: 'Hannah Kim', street: '9900 Congress Park Ln', city: 'Denver, CO 80206', phone: '(303) 555-0108', email: '', permit: 'PRM-2024-008', status: 'Inspection', initials: 'HK', company: 'Golden Contractor', companyInitials: 'GC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '2025-05-22', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 9, galleryDescription: 'Bedroom Addition', name: 'Isaac Johnson', street: '2211 Stapleton Dr', city: 'Aurora, CO 80010', phone: '(720) 555-0109', email: '', permit: 'PRM-2024-009', status: 'Completed', initials: 'IJ', company: 'Boulder Contractor', companyInitials: 'BC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '2025-01-25', warrantyStart: '2025-01-25', warrantyEnd: '2026-01-25' },
  { id: 10, galleryDescription: 'Bathroom Addition', name: 'Jessica Williams', street: '4433 Pearl St', city: 'Boulder, CO 80302', phone: '(303) 555-0110', email: '', permit: 'PRM-2024-010', status: 'Final Trim', initials: 'JW', company: 'Denver Contractor', companyInitials: 'DC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '2025-06-16', finalTrimEnd: '2025-06-23', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 11, galleryDescription: 'Second-Level Addition', name: 'Kevin Anderson', street: '6655 Main St', city: 'Littleton, CO 80120', phone: '(720) 555-0111', email: '', permit: 'PRM-2024-011', status: 'Rough-In', initials: 'KA', company: 'Golden Contractor', companyInitials: 'GC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '2025-07-05', roughInEnd: '2025-07-11', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 12, galleryDescription: 'Sunroom or Enclosed Patio Addition', name: 'Laura Davis', street: '8877 Wadsworth Blvd', city: 'Lakewood, CO 80215', phone: '(303) 555-0112', email: '', permit: 'PRM-2024-012', status: 'To be scheduled', initials: 'LD', company: 'Golden Contractor', companyInitials: 'GC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 13, galleryDescription: 'Garage Addition or Expansion', name: 'Michael Brown', street: '1010 Quebec St', city: 'Centennial, CO 80112', phone: '(720) 555-0113', email: '', permit: 'PRM-2024-013', status: 'Inspection', initials: 'MB', company: 'Boulder Contractor', companyInitials: 'BC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '2025-08-19', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 14, galleryDescription: 'In-Law Suite / ADU Construction', name: 'Natalie Garcia', street: '3232 South Broadway', city: 'Englewood, CO 80113', phone: '(303) 555-0114', email: '', permit: 'PRM-2024-014', status: 'Completed', initials: 'NG', company: 'Denver Contractor', companyInitials: 'DC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '2025-03-12', warrantyStart: '2025-03-12', warrantyEnd: '2026-03-12' },
  { id: 15, galleryDescription: 'Deck or Patio Build', name: 'Oliver Martinez', street: '5454 Pecos St', city: 'Westminster, CO 80030', phone: '(720) 555-0115', email: '', permit: 'PRM-2024-015', status: 'Completed', initials: 'OM', company: 'Golden Contractor', companyInitials: 'GC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '2025-04-20', warrantyStart: '2025-04-20', warrantyEnd: '2026-04-20' },
  { id: 16, galleryDescription: 'Roof Replacement or Upgrade', name: 'Patricia Wilson', street: '7676 Federal Blvd', city: 'Arvada, CO 80003', phone: '(303) 555-0116', email: '', permit: 'PRM-2024-016', status: 'Rough-In', initials: 'PW', company: 'Golden Contractor', companyInitials: 'GC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '2025-09-15', roughInEnd: '2025-09-22', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 17, galleryDescription: 'Window & Door Replacement Project', name: 'Quincy Roberts', street: '9898 Sheridan Blvd', city: 'Thornton, CO 80229', phone: '(720) 555-0117', email: '', permit: 'PRM-2024-017', status: 'To be scheduled', initials: 'QR', company: 'Boulder Contractor', companyInitials: 'BC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 18, galleryDescription: 'Foundation or Structural Repair Project', name: 'Rachel Taylor', street: '1357 Colfax Ave', city: 'Aurora, CO 80010', phone: '(303) 555-0118', email: '', permit: 'PRM-2024-018', status: 'Final Trim', initials: 'RT', company: 'Denver Contractor', companyInitials: 'DC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '2025-10-06', finalTrimEnd: '2025-10-13', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 19, galleryDescription: 'Kitchen Remodel', name: 'Samuel Moore', street: '2468 Havana St', city: 'Aurora, CO 80014', phone: '(720) 555-0119', email: '', permit: 'PRM-2024-019', status: 'Inspection', initials: 'SM', company: 'Golden Contractor', companyInitials: 'GC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '2025-11-12', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 20, galleryDescription: 'Bathroom Remodel', name: 'Theresa Jackson', street: '3691 Alameda Ave', city: 'Lakewood, CO 80226', phone: '(303) 555-0120', email: '', permit: 'PRM-2024-020', status: 'Completed', initials: 'TJ', company: 'Golden Contractor', companyInitials: 'GC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '2025-05-15', warrantyStart: '2025-05-15', warrantyEnd: '2026-05-15' },
  { id: 21, galleryDescription: 'Full Home Renovation', name: 'Ursula Harris', street: '4820 Parker Rd', city: 'Parker, CO 80134', phone: '(720) 555-0121', email: '', permit: 'PRM-2024-021', status: 'Completed', initials: 'UH', company: 'Boulder Contractor', companyInitials: 'BC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '2025-06-08', warrantyStart: '2025-06-08', warrantyEnd: '2026-06-08' },
  { id: 22, galleryDescription: 'Basement Finish or Remodel', name: 'Victor Nguyen', street: '5931 Belleview Ave', city: 'Greenwood Village, CO 80111', phone: '(303) 555-0122', email: '', permit: 'PRM-2024-022', status: 'To be scheduled', initials: 'VN', company: 'Denver Contractor', companyInitials: 'DC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 23, galleryDescription: 'Garage Conversion or Build', name: 'Wendy Clark', street: '6042 Kipling St', city: 'Wheat Ridge, CO 80033', phone: '(720) 555-0123', email: '', permit: 'PRM-2024-023', status: 'Rough-In', initials: 'WC', company: 'Golden Contractor', companyInitials: 'GC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '2025-01-20', roughInEnd: '2025-01-27', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 24, galleryDescription: 'Living Room Remodel', name: 'Xavier Lopez', street: '7153 Santa Fe Dr', city: 'Littleton, CO 80120', phone: '(303) 555-0124', email: '', permit: 'PRM-2024-024', status: 'Inspection', initials: 'XL', company: 'Golden Contractor', companyInitials: 'GC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '2025-02-10', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 25, galleryDescription: 'Bedroom Remodel', name: 'Yolanda Martinez', street: '8264 University Blvd', city: 'Highlands Ranch, CO 80126', phone: '(720) 555-0125', email: '', permit: 'PRM-2024-025', status: 'Completed', initials: 'YM', company: 'Boulder Contractor', companyInitials: 'BC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '2025-07-22', warrantyStart: '2025-07-22', warrantyEnd: '2026-07-22' },
  { id: 26, galleryDescription: 'Attic Finish or Conversion', name: 'Zachary White', street: '9375 Colorado Blvd', city: 'Thornton, CO 80229', phone: '(303) 555-0126', email: '', permit: 'PRM-2024-026', status: 'Final Trim', initials: 'ZW', company: 'Boulder Contractor', companyInitials: 'BC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '2025-08-25', finalTrimEnd: '2025-09-01', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 27, galleryDescription: 'Laundry Room Remodel', name: 'Aaron Bennett', street: '1425 Downing St', city: 'Denver, CO 80218', phone: '(720) 555-0127', email: '', permit: 'PRM-2024-027', status: 'Rough-In', initials: 'AB', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '2025-03-03', roughInEnd: '2025-03-09', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 28, galleryDescription: 'Open-Concept Layout Modification', name: 'Brenda Coleman', street: '2536 York St', city: 'Denver, CO 80205', phone: '(303) 555-0128', email: '', permit: 'PRM-2024-028', status: 'To be scheduled', initials: 'BC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 29, galleryDescription: 'Bedroom Addition', name: 'Christopher Diaz', street: '3647 Steele St', city: 'Denver, CO 80205', phone: '(720) 555-0129', email: '', permit: 'PRM-2024-029', status: 'Inspection', initials: 'CD', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '2025-04-14', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 30, galleryDescription: 'Bathroom Addition', name: 'Deborah Ellis', street: '4758 Franklin St', city: 'Denver, CO 80216', phone: '(303) 555-0130', email: '', permit: 'PRM-2024-030', status: 'Completed', initials: 'DE', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '2025-08-18', warrantyStart: '2025-08-18', warrantyEnd: '2026-08-18' },
  { id: 31, galleryDescription: 'Second-Level Addition', name: 'Eric Foster', street: '5869 Marion St', city: 'Denver, CO 80218', phone: '(720) 555-0131', email: '', permit: 'PRM-2024-031', status: 'Final Trim', initials: 'EF', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '2025-09-29', finalTrimEnd: '2025-10-06', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 32, galleryDescription: 'Sunroom or Enclosed Patio Addition', name: 'Frances Gray', street: '6970 Clarkson St', city: 'Denver, CO 80218', phone: '(303) 555-0132', email: '', permit: 'PRM-2024-032', status: 'Rough-In', initials: 'FG', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '2025-05-05', roughInEnd: '2025-05-12', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 33, galleryDescription: 'Garage Addition or Expansion', name: 'George Hughes', street: '7081 Adams St', city: 'Commerce City, CO 80022', phone: '(720) 555-0133', email: '', permit: 'PRM-2024-033', status: 'To be scheduled', initials: 'GH', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 34, galleryDescription: 'In-Law Suite / ADU Construction', name: 'Helen Irving', street: '8192 Washington St', city: 'Thornton, CO 80229', phone: '(303) 555-0134', email: '', permit: 'PRM-2024-034', status: 'Inspection', initials: 'HI', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '2025-06-25', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 35, galleryDescription: 'Deck or Patio Build', name: 'Ian Jenkins', street: '9203 Monaco Pkwy', city: 'Denver, CO 80207', phone: '(720) 555-0135', email: '', permit: 'PRM-2024-035', status: 'Completed', initials: 'IJ', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '2025-09-10', warrantyStart: '2025-09-10', warrantyEnd: '2026-09-10' },
  { id: 36, galleryDescription: 'Roof Replacement or Upgrade', name: 'Julia Kelly', street: '1314 Birch St', city: 'Broomfield, CO 80020', phone: '(303) 555-0136', email: '', permit: 'PRM-2024-036', status: 'Final Trim', initials: 'JK', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '2025-11-03', finalTrimEnd: '2025-11-10', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 37, galleryDescription: 'Window & Door Replacement Project', name: 'Keith Lambert', street: '2425 Elm St', city: 'Golden, CO 80401', phone: '(720) 555-0137', email: '', permit: 'PRM-2024-037', status: 'Rough-In', initials: 'KL', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '2025-02-03', roughInEnd: '2025-02-10', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 38, galleryDescription: 'Foundation or Structural Repair Project', name: 'Linda Morgan', street: '3536 Oak St', city: 'Westminster, CO 80030', phone: '(303) 555-0138', email: '', permit: 'PRM-2024-038', status: 'To be scheduled', initials: 'LM', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 39, galleryDescription: 'Kitchen Remodel', name: 'Marcus Nelson', street: '4647 Pine St', city: 'Arvada, CO 80002', phone: '(720) 555-0139', email: '', permit: 'PRM-2024-039', status: 'Inspection', initials: 'MN', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '2025-07-18', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 40, galleryDescription: 'Bathroom Remodel', name: 'Nina Owens', street: '5758 Maple Ave', city: 'Lakewood, CO 80214', phone: '(303) 555-0140', email: '', permit: 'PRM-2024-040', status: 'Completed', initials: 'NO', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '2025-10-14', warrantyStart: '2025-10-14', warrantyEnd: '2026-10-14' },
  { id: 41, galleryDescription: 'Full Home Renovation', name: 'Oscar Patel', street: '6869 Willow Dr', city: 'Englewood, CO 80110', phone: '(720) 555-0141', email: '', permit: 'PRM-2024-041', status: 'Final Trim', initials: 'OP', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '2025-12-01', finalTrimEnd: '2025-12-08', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 42, galleryDescription: 'Basement Finish or Remodel', name: 'Paula Quinn', street: '7970 Cedar Ln', city: 'Littleton, CO 80123', phone: '(303) 555-0142', email: '', permit: 'PRM-2024-042', status: 'Rough-In', initials: 'PQ', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '2025-04-21', roughInEnd: '2025-04-28', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 43, galleryDescription: 'Garage Conversion or Build', name: 'Ryan Stewart', street: '8081 Spruce Way', city: 'Centennial, CO 80112', phone: '(720) 555-0143', email: '', permit: 'PRM-2024-043', status: 'To be scheduled', initials: 'RS', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 44, galleryDescription: 'Living Room Remodel', name: 'Sandra Turner', street: '9192 Aspen Ct', city: 'Aurora, CO 80015', phone: '(303) 555-0144', email: '', permit: 'PRM-2024-044', status: 'Inspection', initials: 'ST', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '2025-03-26', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 45, galleryDescription: 'Bedroom Remodel', name: 'Timothy Underwood', street: '1023 Redwood St', city: 'Parker, CO 80138', phone: '(720) 555-0145', email: '', permit: 'PRM-2024-045', status: 'Completed', initials: 'TU', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '2025-11-18', warrantyStart: '2025-11-18', warrantyEnd: '2026-11-18' },
  { id: 46, galleryDescription: 'Attic Finish or Conversion', name: 'Veronica Walsh', street: '2134 Sycamore Blvd', city: 'Castle Rock, CO 80104', phone: '(303) 555-0146', email: '', permit: 'PRM-2024-046', status: 'Final Trim', initials: 'VW', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '2025-01-06', finalTrimEnd: '2025-01-13', completedDate: '', warrantyStart: '', warrantyEnd: '' },
];

export const getAllProjects = () => {
  return [...projectsStore];
};

export const getProjectById = (id: number) => {
  return projectsStore.find(p => p.id === id);
};

export const addProject = (project: any) => {
  projectsStore = [project, ...projectsStore];
  return project;
};

export const updateProject = (id: number, updates: any) => {
  projectsStore = projectsStore.map(p => {
    if (p.id === id) {
      const updatedProject = { ...p, ...updates };
      
      // Auto-create inspection card when status changes to "Inspection"
      if (updates.status === 'Inspection' && p.status !== 'Inspection') {
        // Create a new inspection card automatically
        
        const newInspection = {
          id: `insp-${Date.now()}`,
          projectName: p.name || 'Project',
          createdDate: formatDateWithoutTimezone(new Date()), // Date inspection was created
          scheduledDate: formatDateWithoutTimezone(updates.inspectionDate), // Date scheduled
          inspectionDate: formatDateWithoutTimezone(updates.inspectionDate), // Backward compatibility
          stageFrom: p.status || 'Unknown', // Previous status
          stageTo: 'Inspection', // New status
          assignedTo: updates.assignedEmployee || updates.assignedTeam || '',
          status: 'Rough-In', // Inspection type (Rough-In, Pre-Final, Final, Specialty)
          passFailStatus: 'In Progress', // Changed to dropdown: 'Pass', 'Fail', 'In Progress'
          failNotes: '',
          failPhotos: [],
          checklist: [],
          inspectorNotes: {
            deficiencies: '',
            corrections: '',
            reInspectionDate: null
          },
          photos: {
            before: [],
            after: [],
            correction: []
          },
          notes: updates.notes || '' // Save the note from status change
        };
        
        // Add to existing inspections or create new array (new cards at top)
        const existingInspections = updatedProject.inspections || [];
        updatedProject.inspections = [newInspection, ...existingInspections];
      }
      
      return updatedProject;
    }
    return p;
  });
  return projectsStore.find(p => p.id === id);
};

export const updateProjectGalleryDescription = (id: number, description: string) => {
  projectsStore = projectsStore.map(p => 
    p.id === id ? { ...p, galleryDescription: description } : p
  );
  return projectsStore.find(p => p.id === id);
};

// Update project profile image
export const updateProjectProfileImage = (id: number, imageUrl: string) => {
  projectsStore = projectsStore.map(p => 
    p.id === id ? { ...p, profileImageUrl: imageUrl } : p
  );
  return projectsStore.find(p => p.id === id);
};

// Gallery Photos Management
export interface GalleryPhoto {
  id: string;
  url: string;
  timestamp: string;
  folderId: string;
  projectId: string;
  title?: string;
  description?: string;
  location?: string;
  tags?: string[];
}

export interface ProjectGalleryPhotos {
  before: GalleryPhoto[];
  during: GalleryPhoto[];
  final: GalleryPhoto[];
  issues: GalleryPhoto[];
}

// Get photos for a specific project and folder
export const getProjectFolderPhotos = (projectId: number, folderId: string): GalleryPhoto[] => {
  const project = projectsStore.find(p => p.id === projectId);
  if (!project) return [];
  
  // Initialize galleryPhotos if it doesn't exist
  if (!project.galleryPhotos) {
    project.galleryPhotos = {
      before: [],
      during: [],
      final: [],
      issues: []
    };
  }
  
  return project.galleryPhotos[folderId as keyof ProjectGalleryPhotos] || [];
};

// Get photo counts for all folders of a project
export const getProjectPhotosCounts = (projectId: number): { before: number; during: number; final: number; issues: number } => {
  const project = projectsStore.find(p => p.id === projectId);
  if (!project || !project.galleryPhotos) {
    return { before: 0, during: 0, final: 0, issues: 0 };
  }
  
  return {
    before: project.galleryPhotos.before?.length || 0,
    during: project.galleryPhotos.during?.length || 0,
    final: project.galleryPhotos.final?.length || 0,
    issues: project.galleryPhotos.issues?.length || 0
  };
};

// Add photos to a specific project folder
export const addPhotosToProjectFolder = (projectId: number, folderId: string, photos: GalleryPhoto[]) => {
  projectsStore = projectsStore.map(p => {
    if (p.id === projectId) {
      const galleryPhotos = p.galleryPhotos || { before: [], during: [], final: [], issues: [] };
      const folderPhotos = galleryPhotos[folderId as keyof ProjectGalleryPhotos] || [];
      
      return {
        ...p,
        galleryPhotos: {
          ...galleryPhotos,
          [folderId]: [...photos, ...folderPhotos]
        }
      };
    }
    return p;
  });
  
  return getProjectFolderPhotos(projectId, folderId);
};

// Update a single photo in a project folder
export const updatePhotoInProjectFolder = (projectId: number, folderId: string, updatedPhoto: GalleryPhoto) => {
  projectsStore = projectsStore.map(p => {
    if (p.id === projectId && p.galleryPhotos) {
      const folderPhotos = p.galleryPhotos[folderId as keyof ProjectGalleryPhotos] || [];
      
      return {
        ...p,
        galleryPhotos: {
          ...p.galleryPhotos,
          [folderId]: folderPhotos.map((photo: GalleryPhoto) => 
            photo.id === updatedPhoto.id ? updatedPhoto : photo
          )
        }
      };
    }
    return p;
  });
  
  return getProjectFolderPhotos(projectId, folderId);
};

// Delete a photo from a project folder
export const deletePhotoFromProjectFolder = (projectId: number, folderId: string, photoId: string) => {
  projectsStore = projectsStore.map(p => {
    if (p.id === projectId && p.galleryPhotos) {
      const folderPhotos = p.galleryPhotos[folderId as keyof ProjectGalleryPhotos] || [];
      
      return {
        ...p,
        galleryPhotos: {
          ...p.galleryPhotos,
          [folderId]: folderPhotos.filter((photo: GalleryPhoto) => photo.id !== photoId)
        }
      };
    }
    return p;
  });
  
  return getProjectFolderPhotos(projectId, folderId);
};

export const deleteProject = (id: number) => {
  projectsStore = projectsStore.filter(p => p.id !== id);
};

// Portfolio Management
export interface PortfolioPhoto {
  id: string;
  url: string;
  timestamp: string;
  title?: string;
  description?: string;
  location?: string;
  sourceProjectId?: string;
  sourceFolderId?: string;
}

export interface Portfolio {
  id: string;
  title: string;
  description?: string;
  photos: PortfolioPhoto[];
  coverImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Portfolio store
let portfolioStore: Portfolio[] = [
  { 
    id: 'port-1', 
    title: 'Kitchen Renovations', 
    description: 'Our best kitchen remodel projects', 
    photos: [
      { id: 'pk-1', url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', timestamp: '2025-01-15T10:00:00Z', title: 'Modern Kitchen Design', description: 'White cabinets with quartz countertops' },
      { id: 'pk-2', url: 'https://images.unsplash.com/photo-1556909172-8c2f041fca1e?w=800', timestamp: '2025-01-16T10:00:00Z', title: 'Kitchen Island', description: 'Custom island with seating' },
      { id: 'pk-3', url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800', timestamp: '2025-01-17T10:00:00Z', title: 'Open Concept Kitchen' },
    ],
    coverImageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-17T00:00:00Z'
  },
  { 
    id: 'port-2', 
    title: 'Bathroom Remodels', 
    description: 'Luxury bathroom transformations', 
    photos: [
      { id: 'pb-1', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800', timestamp: '2025-02-10T10:00:00Z', title: 'Master Bath Renovation', description: 'Spa-like master bathroom' },
      { id: 'pb-2', url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800', timestamp: '2025-02-11T10:00:00Z', title: 'Walk-in Shower', description: 'Custom tile work' },
    ],
    coverImageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800',
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-02-11T00:00:00Z'
  },
  { 
    id: 'port-3', 
    title: 'LED Lighting', 
    description: 'Modern LED lighting installations and upgrades', 
    photos: [
      { id: 'pl-1', url: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=800', timestamp: '2025-03-05T10:00:00Z', title: 'Recessed LED Lighting', description: 'Energy-efficient recessed lighting installation' },
      { id: 'pl-2', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', timestamp: '2025-03-06T10:00:00Z', title: 'Under Cabinet LEDs', description: 'Kitchen under cabinet lighting' },
      { id: 'pl-3', url: 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=800', timestamp: '2025-03-07T10:00:00Z', title: 'LED Strip Installation', description: 'Accent lighting with LED strips' },
      { id: 'pl-4', url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800', timestamp: '2025-03-08T10:00:00Z', title: 'Smart LED Setup', description: 'Smart home LED integration' },
    ],
    coverImageUrl: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=800',
    createdAt: '2025-03-01T00:00:00Z',
    updatedAt: '2025-03-08T00:00:00Z'
  },
  { 
    id: 'port-4', 
    title: 'Panel Upgrades', 
    description: 'Electrical panel upgrades and replacements', 
    photos: [
      { id: 'pp-1', url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800', timestamp: '2025-04-10T10:00:00Z', title: '200 Amp Panel Upgrade', description: 'Residential panel upgrade to 200A' },
      { id: 'pp-2', url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800', timestamp: '2025-04-11T10:00:00Z', title: 'Sub-Panel Installation', description: 'Garage sub-panel installation' },
      { id: 'pp-3', url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800', timestamp: '2025-04-12T10:00:00Z', title: 'Commercial Panel', description: 'Commercial electrical panel work' },
    ],
    coverImageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800',
    createdAt: '2025-04-01T00:00:00Z',
    updatedAt: '2025-04-12T00:00:00Z'
  },
  { 
    id: 'port-5', 
    title: 'Garage Upgrades', 
    description: 'Garage electrical and lighting improvements', 
    photos: [
      { id: 'pg-1', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', timestamp: '2025-05-15T10:00:00Z', title: 'Garage Workshop Lighting', description: 'Full workshop LED lighting installation' },
      { id: 'pg-2', url: 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=800', timestamp: '2025-05-16T10:00:00Z', title: 'EV Charger Installation', description: 'Level 2 EV charger installation' },
      { id: 'pg-3', url: 'https://images.unsplash.com/photo-1558618047-f4b511ab909c?w=800', timestamp: '2025-05-17T10:00:00Z', title: 'Garage Door Opener', description: 'Smart garage door opener wiring' },
      { id: 'pg-4', url: 'https://images.unsplash.com/photo-1530334542096-7c26fe3c0b8e?w=800', timestamp: '2025-05-18T10:00:00Z', title: 'Motion Sensor Lights', description: 'Exterior motion sensor lighting' },
      { id: 'pg-5', url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800', timestamp: '2025-05-19T10:00:00Z', title: 'Finished Garage', description: 'Complete garage electrical upgrade' },
    ],
    coverImageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    createdAt: '2025-05-01T00:00:00Z',
    updatedAt: '2025-05-19T00:00:00Z'
  },
];

// Get all portfolios
export const getAllPortfolios = (): Portfolio[] => {
  return portfolioStore;
};

// Get portfolio by ID
export const getPortfolioById = (id: string): Portfolio | undefined => {
  return portfolioStore.find(p => p.id === id);
};

// Create new portfolio
export const createPortfolio = (title: string, description?: string, photos: PortfolioPhoto[] = []): Portfolio => {
  const newPortfolio: Portfolio = {
    id: `port-${Date.now()}`,
    title,
    description,
    photos,
    coverImageUrl: photos.length > 0 ? photos[0].url : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  portfolioStore.push(newPortfolio);
  return newPortfolio;
};

// Add photos to portfolio
export const addPhotosToPortfolio = (portfolioId: string, photos: PortfolioPhoto[]): Portfolio | undefined => {
  portfolioStore = portfolioStore.map(p => {
    if (p.id === portfolioId) {
      const updatedPhotos = [...photos, ...p.photos];
      return {
        ...p,
        photos: updatedPhotos,
        coverImageUrl: p.coverImageUrl || (updatedPhotos.length > 0 ? updatedPhotos[0].url : undefined),
        updatedAt: new Date().toISOString(),
      };
    }
    return p;
  });
  return getPortfolioById(portfolioId);
};

// Update portfolio details
export const updatePortfolio = (portfolioId: string, updates: Partial<Portfolio>): Portfolio | undefined => {
  portfolioStore = portfolioStore.map(p => {
    if (p.id === portfolioId) {
      return {
        ...p,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    }
    return p;
  });
  return getPortfolioById(portfolioId);
};

// Update photo in portfolio
export const updatePhotoInPortfolio = (portfolioId: string, photo: PortfolioPhoto): Portfolio | undefined => {
  portfolioStore = portfolioStore.map(p => {
    if (p.id === portfolioId) {
      return {
        ...p,
        photos: p.photos.map(ph => ph.id === photo.id ? photo : ph),
        updatedAt: new Date().toISOString(),
      };
    }
    return p;
  });
  return getPortfolioById(portfolioId);
};

// Delete photo from portfolio
export const deletePhotoFromPortfolio = (portfolioId: string, photoId: string): Portfolio | undefined => {
  portfolioStore = portfolioStore.map(p => {
    if (p.id === portfolioId) {
      const updatedPhotos = p.photos.filter(ph => ph.id !== photoId);
      return {
        ...p,
        photos: updatedPhotos,
        coverImageUrl: updatedPhotos.length > 0 ? (p.coverImageUrl === p.photos.find(ph => ph.id === photoId)?.url ? updatedPhotos[0].url : p.coverImageUrl) : undefined,
        updatedAt: new Date().toISOString(),
      };
    }
    return p;
  });
  return getPortfolioById(portfolioId);
};

// Delete portfolio
export const deletePortfolio = (portfolioId: string): void => {
  portfolioStore = portfolioStore.filter(p => p.id !== portfolioId);
};

// Set portfolio cover image
export const setPortfolioCoverImage = (portfolioId: string, imageUrl: string): Portfolio | undefined => {
  return updatePortfolio(portfolioId, { coverImageUrl: imageUrl });
};

// ==========================================
// Materials & Products Management
// ==========================================

export interface MaterialProduct {
  id: string;
  name: string;
  description: string;
  category: 'electrical' | 'plumbing' | 'fixtures' | 'hardware' | 'other';
  imageUrl?: string;
  url?: string;
  purchaseLocation?: string;
  brand?: string;
  modelNumber?: string;
  price?: string;
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

// Materials & Products store with sample data
let materialsStore: MaterialProduct[] = [
  {
    id: 'mat-1',
    name: 'Decora Outlets - White',
    description: 'Standard 15A Decora-style duplex outlet, tamper-resistant',
    category: 'electrical',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    url: 'https://www.homedepot.com/p/Leviton-Decora-15-Amp/123456',
    purchaseLocation: 'Home Depot',
    brand: 'Leviton',
    modelNumber: 'T5325-W',
    price: '$3.97',
    notes: 'Use for all standard outlets in residential projects',
    isFavorite: true,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 'mat-2',
    name: 'Decora Light Switch - White',
    description: 'Single-pole Decora rocker light switch, 15A',
    category: 'electrical',
    imageUrl: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=400',
    url: 'https://www.lowes.com/pd/Leviton-Decora-Switch/789012',
    purchaseLocation: 'Lowes',
    brand: 'Leviton',
    modelNumber: '5601-2W',
    price: '$2.48',
    notes: 'Standard switch for most residential applications',
    isFavorite: true,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 'mat-3',
    name: 'PEX Tubing 1/2" x 100ft',
    description: 'Red PEX-A tubing for hot water supply lines',
    category: 'plumbing',
    imageUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400',
    url: 'https://www.supplyhouse.com/pex-tubing',
    purchaseLocation: 'Supply House',
    brand: 'Uponor',
    modelNumber: 'F1040500',
    price: '$89.99',
    notes: 'Premium quality, 25-year warranty',
    isFavorite: false,
    createdAt: '2025-01-20T14:30:00Z',
    updatedAt: '2025-01-20T14:30:00Z',
  },
  {
    id: 'mat-4',
    name: 'Delta Kitchen Faucet',
    description: 'Single-handle pull-down kitchen faucet with Touch2O',
    category: 'fixtures',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400',
    url: 'https://www.deltafaucet.com/kitchen/product/9159T-DST',
    purchaseLocation: 'Ferguson',
    brand: 'Delta',
    modelNumber: '9159T-AR-DST',
    price: '$489.00',
    notes: 'Touch-activated, Arctic Stainless finish',
    isFavorite: true,
    createdAt: '2025-02-01T09:15:00Z',
    updatedAt: '2025-02-01T09:15:00Z',
  },
  {
    id: 'mat-5',
    name: 'Tankless Water Heater',
    description: 'Rinnai RU199iN natural gas tankless water heater',
    category: 'plumbing',
    imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400',
    url: 'https://www.rinnai.us/tankless-water-heater/ru199in',
    purchaseLocation: 'Ferguson',
    brand: 'Rinnai',
    modelNumber: 'RU199iN',
    price: '$1,849.00',
    notes: 'Indoor installation, 199k BTU, WiFi enabled',
    isFavorite: false,
    createdAt: '2025-02-10T11:00:00Z',
    updatedAt: '2025-02-10T11:00:00Z',
  },
  {
    id: 'mat-6',
    name: 'GFCI Outlet - White',
    description: '20A GFCI outlet with self-test, tamper-resistant',
    category: 'electrical',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    url: 'https://www.homedepot.com/p/Leviton-20-Amp-GFCI/345678',
    purchaseLocation: 'Home Depot',
    brand: 'Leviton',
    modelNumber: 'GFTR2-W',
    price: '$18.97',
    notes: 'Required for kitchens, bathrooms, and outdoor locations',
    isFavorite: true,
    createdAt: '2025-02-15T08:30:00Z',
    updatedAt: '2025-02-15T08:30:00Z',
  },
];

// Get all materials
export const getAllMaterials = (): MaterialProduct[] => {
  return [...materialsStore];
};

// Get materials by category
export const getMaterialsByCategory = (category: MaterialProduct['category']): MaterialProduct[] => {
  return materialsStore.filter(m => m.category === category);
};

// Get favorite materials
export const getFavoriteMaterials = (): MaterialProduct[] => {
  return materialsStore.filter(m => m.isFavorite);
};

// Get material by ID
export const getMaterialById = (id: string): MaterialProduct | undefined => {
  return materialsStore.find(m => m.id === id);
};

// Create new material
export const createMaterial = (material: Omit<MaterialProduct, 'id' | 'createdAt' | 'updatedAt'>): MaterialProduct => {
  const newMaterial: MaterialProduct = {
    ...material,
    id: `mat-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  materialsStore.push(newMaterial);
  return newMaterial;
};

// Update material
export const updateMaterial = (id: string, updates: Partial<MaterialProduct>): MaterialProduct | undefined => {
  materialsStore = materialsStore.map(m => {
    if (m.id === id) {
      return {
        ...m,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    }
    return m;
  });
  return getMaterialById(id);
};

// Delete material
export const deleteMaterial = (id: string): void => {
  materialsStore = materialsStore.filter(m => m.id !== id);
};

// Toggle favorite
export const toggleMaterialFavorite = (id: string): MaterialProduct | undefined => {
  const material = getMaterialById(id);
  if (material) {
    return updateMaterial(id, { isFavorite: !material.isFavorite });
  }
  return undefined;
};

// ==========================================
// Knowledge Center - Training Videos
// ==========================================

export interface TrainingVideo {
  id: string;
  title: string;
  description: string;
  category: string;
  videoUrl?: string; // YouTube/Vimeo URL
  videoUri?: string; // Local file URI
  thumbnailUrl?: string;
  duration?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

// Training Categories store (user-created)
let trainingCategoriesStore: string[] = [
  'Electrical',
  'Plumbing',
  'HVAC',
  'Carpentry',
  'Safety',
  'General',
];

// Training Videos store
let trainingVideosStore: TrainingVideo[] = [
  {
    id: 'tv-1',
    title: 'Electrical Panel Basics',
    description: 'Learn the fundamentals of residential electrical panels, breaker identification, and safety procedures.',
    category: 'Electrical',
    videoUrl: 'https://www.youtube.com/watch?v=example1',
    thumbnailUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    duration: '12:45',
    isFavorite: true,
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-01-10T10:00:00Z',
  },
  {
    id: 'tv-2',
    title: 'PEX Plumbing Installation',
    description: 'Complete guide to installing PEX tubing, including proper expansion techniques and fitting connections.',
    category: 'Plumbing',
    videoUrl: 'https://www.youtube.com/watch?v=example2',
    thumbnailUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400',
    duration: '18:30',
    isFavorite: false,
    createdAt: '2025-01-15T14:00:00Z',
    updatedAt: '2025-01-15T14:00:00Z',
  },
  {
    id: 'tv-3',
    title: 'Job Site Safety Essentials',
    description: 'Critical safety protocols every contractor should follow on residential job sites.',
    category: 'Safety',
    videoUrl: 'https://www.youtube.com/watch?v=example3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400',
    duration: '8:15',
    isFavorite: true,
    createdAt: '2025-02-01T09:00:00Z',
    updatedAt: '2025-02-01T09:00:00Z',
  },
];

// Get all training categories
export const getTrainingCategories = (): string[] => {
  return [...trainingCategoriesStore];
};

// Add training category
export const addTrainingCategory = (category: string): string[] => {
  if (!trainingCategoriesStore.includes(category)) {
    trainingCategoriesStore.push(category);
  }
  return [...trainingCategoriesStore];
};

// Delete training category
export const deleteTrainingCategory = (category: string): string[] => {
  trainingCategoriesStore = trainingCategoriesStore.filter(c => c !== category);
  return [...trainingCategoriesStore];
};

// Rename training category
export const renameTrainingCategory = (oldName: string, newName: string): string[] => {
  const index = trainingCategoriesStore.indexOf(oldName);
  if (index !== -1 && !trainingCategoriesStore.includes(newName)) {
    trainingCategoriesStore[index] = newName;
    // Also update all videos with this category
    trainingVideosStore = trainingVideosStore.map(v => 
      v.category === oldName ? { ...v, category: newName } : v
    );
  }
  return [...trainingCategoriesStore];
};

// Get all training videos
export const getAllTrainingVideos = (): TrainingVideo[] => {
  return [...trainingVideosStore];
};

// Get training videos by category
export const getTrainingVideosByCategory = (category: string): TrainingVideo[] => {
  return trainingVideosStore.filter(v => v.category === category);
};

// Get training video by ID
export const getTrainingVideoById = (id: string): TrainingVideo | undefined => {
  return trainingVideosStore.find(v => v.id === id);
};

// Create training video
export const createTrainingVideo = (video: Omit<TrainingVideo, 'id' | 'createdAt' | 'updatedAt'>): TrainingVideo => {
  const newVideo: TrainingVideo = {
    ...video,
    id: `tv-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  trainingVideosStore.unshift(newVideo);
  return newVideo;
};

// Update training video
export const updateTrainingVideo = (id: string, updates: Partial<TrainingVideo>): TrainingVideo | undefined => {
  trainingVideosStore = trainingVideosStore.map(v => {
    if (v.id === id) {
      return { ...v, ...updates, updatedAt: new Date().toISOString() };
    }
    return v;
  });
  return getTrainingVideoById(id);
};

// Delete training video
export const deleteTrainingVideo = (id: string): void => {
  trainingVideosStore = trainingVideosStore.filter(v => v.id !== id);
};

// Toggle training video favorite
export const toggleTrainingVideoFavorite = (id: string): TrainingVideo | undefined => {
  const video = getTrainingVideoById(id);
  if (video) {
    return updateTrainingVideo(id, { isFavorite: !video.isFavorite });
  }
  return undefined;
};

// ==========================================
// Knowledge Center - Project Templates
// ==========================================

export interface TemplateChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface TemplateChecklistCategory {
  id: string;
  name: string;
  items: TemplateChecklistItem[];
}

export interface TemplateMaterialItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  estimatedCost?: string;
  notes?: string;
}

export interface ProjectTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnailUrl?: string;
  checklist: TemplateChecklistCategory[];
  materials: TemplateMaterialItem[];
  estimatedDuration?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  isSystemTemplate: boolean; // true = Project Templates, false = My Templates
  sourceTemplateId?: string; // For copied templates, references original
  createdAt: string;
  updatedAt: string;
}

// Template Categories store (user-created)
let templateCategoriesStore: string[] = [
  'Remodel',
  'Addition',
  'Panel Upgrade',
  'New Construction',
  'Service Call',
  'Repair',
];

// Project Templates store (system templates)
let projectTemplatesStore: ProjectTemplate[] = [
  {
    id: 'pt-1',
    title: 'Kitchen Remodel Template',
    description: 'Complete checklist and materials for a standard kitchen remodel project including demo, rough-in, and finish work.',
    category: 'Remodel',
    thumbnailUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
    checklist: [
      {
        id: 'ptc-1',
        name: 'Demolition',
        items: [
          { id: 'pti-1', text: 'Remove existing cabinets', checked: false },
          { id: 'pti-2', text: 'Remove countertops', checked: false },
          { id: 'pti-3', text: 'Disconnect and remove appliances', checked: false },
          { id: 'pti-4', text: 'Remove flooring if needed', checked: false },
        ],
      },
      {
        id: 'ptc-2',
        name: 'Rough-In',
        items: [
          { id: 'pti-5', text: 'Electrical rough-in for new layout', checked: false },
          { id: 'pti-6', text: 'Plumbing rough-in for sink location', checked: false },
          { id: 'pti-7', text: 'HVAC modifications if needed', checked: false },
          { id: 'pti-8', text: 'Schedule rough-in inspection', checked: false },
        ],
      },
      {
        id: 'ptc-3',
        name: 'Installation',
        items: [
          { id: 'pti-9', text: 'Install base cabinets', checked: false },
          { id: 'pti-10', text: 'Install wall cabinets', checked: false },
          { id: 'pti-11', text: 'Install countertops', checked: false },
          { id: 'pti-12', text: 'Install backsplash', checked: false },
          { id: 'pti-13', text: 'Install sink and faucet', checked: false },
        ],
      },
      {
        id: 'ptc-4',
        name: 'Final Trim',
        items: [
          { id: 'pti-14', text: 'Install appliances', checked: false },
          { id: 'pti-15', text: 'Install lighting fixtures', checked: false },
          { id: 'pti-16', text: 'Install outlet covers and switches', checked: false },
          { id: 'pti-17', text: 'Final inspection', checked: false },
          { id: 'pti-18', text: 'Final cleanup', checked: false },
        ],
      },
    ],
    materials: [
      { id: 'ptm-1', name: 'Base Cabinets', quantity: '8', unit: 'units', estimatedCost: '$400/unit' },
      { id: 'ptm-2', name: 'Wall Cabinets', quantity: '6', unit: 'units', estimatedCost: '$300/unit' },
      { id: 'ptm-3', name: 'Countertop (Quartz)', quantity: '35', unit: 'sq ft', estimatedCost: '$75/sq ft' },
      { id: 'ptm-4', name: 'Backsplash Tile', quantity: '20', unit: 'sq ft', estimatedCost: '$15/sq ft' },
      { id: 'ptm-5', name: 'Kitchen Sink', quantity: '1', unit: 'unit', estimatedCost: '$350' },
      { id: 'ptm-6', name: 'Kitchen Faucet', quantity: '1', unit: 'unit', estimatedCost: '$250' },
    ],
    estimatedDuration: '2-3 weeks',
    difficulty: 'Medium',
    isSystemTemplate: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'pt-2',
    title: 'Electrical Panel Upgrade',
    description: 'Standard 200A panel upgrade template with all necessary steps and materials.',
    category: 'Panel Upgrade',
    thumbnailUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    checklist: [
      {
        id: 'ptc-5',
        name: 'Pre-Work',
        items: [
          { id: 'pti-19', text: 'Pull electrical permit', checked: false },
          { id: 'pti-20', text: 'Schedule utility disconnect', checked: false },
          { id: 'pti-21', text: 'Document existing circuits', checked: false },
        ],
      },
      {
        id: 'ptc-6',
        name: 'Panel Installation',
        items: [
          { id: 'pti-22', text: 'Remove old panel', checked: false },
          { id: 'pti-23', text: 'Install new 200A panel', checked: false },
          { id: 'pti-24', text: 'Re-terminate all circuits', checked: false },
          { id: 'pti-25', text: 'Install grounding system', checked: false },
        ],
      },
      {
        id: 'ptc-7',
        name: 'Completion',
        items: [
          { id: 'pti-26', text: 'Label all breakers', checked: false },
          { id: 'pti-27', text: 'Schedule final inspection', checked: false },
          { id: 'pti-28', text: 'Coordinate utility reconnection', checked: false },
        ],
      },
    ],
    materials: [
      { id: 'ptm-7', name: '200A Main Panel', quantity: '1', unit: 'unit', estimatedCost: '$450' },
      { id: 'ptm-8', name: 'Breakers (various)', quantity: '20', unit: 'units', estimatedCost: '$15/unit' },
      { id: 'ptm-9', name: 'Ground Rods', quantity: '2', unit: 'units', estimatedCost: '$25/unit' },
      { id: 'ptm-10', name: '#4 Copper Ground Wire', quantity: '25', unit: 'feet', estimatedCost: '$3/ft' },
      { id: 'ptm-11', name: 'Panel Seal', quantity: '1', unit: 'unit', estimatedCost: '$15' },
    ],
    estimatedDuration: '1 day',
    difficulty: 'Hard',
    isSystemTemplate: true,
    createdAt: '2025-01-05T00:00:00Z',
    updatedAt: '2025-01-05T00:00:00Z',
  },
  {
    id: 'pt-3',
    title: 'Bathroom Addition',
    description: 'Complete template for adding a new bathroom including plumbing, electrical, and finishing.',
    category: 'Addition',
    thumbnailUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400',
    checklist: [
      {
        id: 'ptc-8',
        name: 'Planning',
        items: [
          { id: 'pti-29', text: 'Verify structural requirements', checked: false },
          { id: 'pti-30', text: 'Pull building permits', checked: false },
          { id: 'pti-31', text: 'Design layout and fixtures', checked: false },
        ],
      },
      {
        id: 'ptc-9',
        name: 'Rough Plumbing',
        items: [
          { id: 'pti-32', text: 'Install drain lines', checked: false },
          { id: 'pti-33', text: 'Install water supply lines', checked: false },
          { id: 'pti-34', text: 'Install vent stack', checked: false },
          { id: 'pti-35', text: 'Plumbing rough inspection', checked: false },
        ],
      },
      {
        id: 'ptc-10',
        name: 'Rough Electrical',
        items: [
          { id: 'pti-36', text: 'Run circuits for lighting', checked: false },
          { id: 'pti-37', text: 'Install GFCI outlets', checked: false },
          { id: 'pti-38', text: 'Install exhaust fan circuit', checked: false },
          { id: 'pti-39', text: 'Electrical rough inspection', checked: false },
        ],
      },
      {
        id: 'ptc-11',
        name: 'Finishing',
        items: [
          { id: 'pti-40', text: 'Install drywall', checked: false },
          { id: 'pti-41', text: 'Tile floor and shower', checked: false },
          { id: 'pti-42', text: 'Install vanity and toilet', checked: false },
          { id: 'pti-43', text: 'Install fixtures', checked: false },
          { id: 'pti-44', text: 'Final inspection', checked: false },
        ],
      },
    ],
    materials: [
      { id: 'ptm-12', name: 'Toilet', quantity: '1', unit: 'unit', estimatedCost: '$250' },
      { id: 'ptm-13', name: 'Vanity w/ Top', quantity: '1', unit: 'unit', estimatedCost: '$450' },
      { id: 'ptm-14', name: 'Shower/Tub Unit', quantity: '1', unit: 'unit', estimatedCost: '$600' },
      { id: 'ptm-15', name: 'Floor Tile', quantity: '50', unit: 'sq ft', estimatedCost: '$8/sq ft' },
      { id: 'ptm-16', name: 'Wall Tile', quantity: '80', unit: 'sq ft', estimatedCost: '$6/sq ft' },
      { id: 'ptm-17', name: 'Exhaust Fan', quantity: '1', unit: 'unit', estimatedCost: '$120' },
    ],
    estimatedDuration: '2-4 weeks',
    difficulty: 'Hard',
    isSystemTemplate: true,
    createdAt: '2025-01-10T00:00:00Z',
    updatedAt: '2025-01-10T00:00:00Z',
  },
];

// My Templates store (user's custom templates)
let myTemplatesStore: ProjectTemplate[] = [];

// Get all template categories
export const getTemplateCategories = (): string[] => {
  return [...templateCategoriesStore];
};

// Add template category
export const addTemplateCategory = (category: string): string[] => {
  if (!templateCategoriesStore.includes(category)) {
    templateCategoriesStore.push(category);
  }
  return [...templateCategoriesStore];
};

// Delete template category
export const deleteTemplateCategory = (category: string): string[] => {
  templateCategoriesStore = templateCategoriesStore.filter(c => c !== category);
  return [...templateCategoriesStore];
};

// Rename template category
export const renameTemplateCategory = (oldName: string, newName: string): string[] => {
  const index = templateCategoriesStore.indexOf(oldName);
  if (index !== -1 && !templateCategoriesStore.includes(newName)) {
    templateCategoriesStore[index] = newName;
    // Also update all templates with this category
    projectTemplatesStore = projectTemplatesStore.map(t => 
      t.category === oldName ? { ...t, category: newName } : t
    );
    myTemplatesStore = myTemplatesStore.map(t => 
      t.category === oldName ? { ...t, category: newName } : t
    );
  }
  return [...templateCategoriesStore];
};

// Get all project templates (system templates)
export const getAllProjectTemplates = (): ProjectTemplate[] => {
  return [...projectTemplatesStore];
};

// Get project template by ID
export const getProjectTemplateById = (id: string): ProjectTemplate | undefined => {
  return projectTemplatesStore.find(t => t.id === id);
};

// Create project template
export const createProjectTemplate = (template: Omit<ProjectTemplate, 'id' | 'createdAt' | 'updatedAt'>): ProjectTemplate => {
  const newTemplate: ProjectTemplate = {
    ...template,
    id: `pt-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  projectTemplatesStore.unshift(newTemplate);
  return newTemplate;
};

// Update project template
export const updateProjectTemplate = (id: string, updates: Partial<ProjectTemplate>): ProjectTemplate | undefined => {
  projectTemplatesStore = projectTemplatesStore.map(t => {
    if (t.id === id) {
      return { ...t, ...updates, updatedAt: new Date().toISOString() };
    }
    return t;
  });
  return getProjectTemplateById(id);
};

// Delete project template
export const deleteProjectTemplate = (id: string): void => {
  projectTemplatesStore = projectTemplatesStore.filter(t => t.id !== id);
};

// Get all my templates (user's custom templates)
export const getAllMyTemplates = (): ProjectTemplate[] => {
  return [...myTemplatesStore];
};

// Get my template by ID
export const getMyTemplateById = (id: string): ProjectTemplate | undefined => {
  return myTemplatesStore.find(t => t.id === id);
};

// Copy template to My Templates
export const copyTemplateToMyTemplates = (templateId: string): ProjectTemplate | undefined => {
  const sourceTemplate = getProjectTemplateById(templateId);
  if (!sourceTemplate) return undefined;

  const newTemplate: ProjectTemplate = {
    ...sourceTemplate,
    id: `mt-${Date.now()}`,
    title: `${sourceTemplate.title} (Copy)`,
    isSystemTemplate: false,
    sourceTemplateId: sourceTemplate.id,
    // Deep copy checklist
    checklist: sourceTemplate.checklist.map(cat => ({
      ...cat,
      id: `mtc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      items: cat.items.map(item => ({
        ...item,
        id: `mti-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        checked: false,
      })),
    })),
    // Deep copy materials
    materials: sourceTemplate.materials.map(mat => ({
      ...mat,
      id: `mtm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  myTemplatesStore.unshift(newTemplate);
  return newTemplate;
};

// Create custom my template
export const createMyTemplate = (template: Omit<ProjectTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isSystemTemplate'>): ProjectTemplate => {
  const newTemplate: ProjectTemplate = {
    ...template,
    id: `mt-${Date.now()}`,
    isSystemTemplate: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  myTemplatesStore.unshift(newTemplate);
  return newTemplate;
};

// Update my template
export const updateMyTemplate = (id: string, updates: Partial<ProjectTemplate>): ProjectTemplate | undefined => {
  myTemplatesStore = myTemplatesStore.map(t => {
    if (t.id === id) {
      return { ...t, ...updates, updatedAt: new Date().toISOString() };
    }
    return t;
  });
  return getMyTemplateById(id);
};

// Delete my template
export const deleteMyTemplate = (id: string): void => {
  myTemplatesStore = myTemplatesStore.filter(t => t.id !== id);
};
