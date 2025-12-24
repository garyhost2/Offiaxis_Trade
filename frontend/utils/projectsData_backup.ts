// Shared projects data - In a real app, this would be in a state management solution or API
// For now, this acts as a simple in-memory store

let projectsStore = [
  { 
    id: 1, 
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
    propertyDescription: '', 
    accessCode: '', 
    roughInStart: '2024-11-15', 
    roughInEnd: '2024-11-22', 
    inspectionDate: '', 
    finalTrimStart: '', 
    finalTrimEnd: '', 
    completedDate: '', 
    warrantyStart: '', 
    warrantyEnd: '',
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
    ]
  },
  { id: 2, name: 'Barbara Thompson', street: '5678 Capitol Hill Ave', city: 'Denver, CO 80203', phone: '(303) 555-0102', email: '', permit: 'PRM-2024-002', status: 'To be scheduled', initials: 'BT', company: 'Denver Contractor', companyInitials: 'DC', otherContacts: [{ id: '2-c1', name: 'Michael Brown', phone: '(303) 555-1002', email: 'michael.b@example.com', note: 'Primary contact for permits' }], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 3, name: 'Carlos Rodriguez', street: '910 Highlands Blvd', city: 'Denver, CO 80211', phone: '(720) 555-0103', email: '', permit: 'PRM-2024-003', status: 'Inspection', initials: 'CR', company: 'Golden Contractor', companyInitials: 'GC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '2024-12-02', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 4, name: 'Diana Foster', street: '1122 Washington Park Way', city: 'Denver, CO 80209', phone: '(303) 555-0104', email: '', permit: 'PRM-2024-004', status: 'Completed', initials: 'DF', company: 'Golden Contractor', companyInitials: 'GC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '2024-10-18', warrantyStart: '2024-10-18', warrantyEnd: '2025-10-18' },
  { id: 5, name: 'Edward Chen', street: '3344 LoDo St', city: 'Denver, CO 80202', phone: '(720) 555-0105', email: '', permit: 'PRM-2024-005', status: 'Final Trim', initials: 'EC', company: 'Boulder Contractor', companyInitials: 'BC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '2024-11-20', finalTrimEnd: '2024-11-27', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 6, name: 'Fiona O\'Neill', street: '5566 RiNo Ave', city: 'Denver, CO 80216', phone: '(303) 555-0106', email: '', permit: 'PRM-2024-006', status: 'Rough-In', initials: 'FO', company: 'Denver Contractor', companyInitials: 'DC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '2024-11-18', roughInEnd: '2024-11-25', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 7, name: 'Gabriel Santos', street: '7788 Park Hill Rd', city: 'Denver, CO 80207', phone: '(720) 555-0107', email: '', permit: 'PRM-2024-007', status: 'To be scheduled', initials: 'GS', company: 'Golden Contractor', companyInitials: 'GC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 8, name: 'Hannah Kim', street: '9900 Congress Park Ln', city: 'Denver, CO 80206', phone: '(303) 555-0108', email: '', permit: 'PRM-2024-008', status: 'Inspection', initials: 'HK', company: 'Golden Contractor', companyInitials: 'GC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '2024-11-29', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 9, name: 'Isaac Johnson', street: '2211 Stapleton Dr', city: 'Aurora, CO 80010', phone: '(720) 555-0109', email: '', permit: 'PRM-2024-009', status: 'Completed', initials: 'IJ', company: 'Boulder Contractor', companyInitials: 'BC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '2024-10-25', warrantyStart: '2024-10-25', warrantyEnd: '2025-10-25' },
  { id: 10, name: 'Jessica Williams', street: '4433 Pearl St', city: 'Boulder, CO 80302', phone: '(303) 555-0110', email: '', permit: 'PRM-2024-010', status: 'Final Trim', initials: 'JW', company: 'Denver Contractor', companyInitials: 'DC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '2024-11-22', finalTrimEnd: '2024-11-29', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 11, name: 'Kevin Anderson', street: '6655 Main St', city: 'Littleton, CO 80120', phone: '(720) 555-0111', email: '', permit: 'PRM-2024-011', status: 'Rough-In', initials: 'KA', company: 'Golden Contractor', companyInitials: 'GC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '2024-11-12', roughInEnd: '2024-11-19', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 12, name: 'Laura Davis', street: '8877 Wadsworth Blvd', city: 'Lakewood, CO 80215', phone: '(303) 555-0112', email: '', permit: 'PRM-2024-012', status: 'To be scheduled', initials: 'LD', company: 'Golden Contractor', companyInitials: 'GC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 13, name: 'Michael Brown', street: '1010 Quebec St', city: 'Centennial, CO 80112', phone: '(720) 555-0113', email: '', permit: 'PRM-2024-013', status: 'Inspection', initials: 'MB', company: 'Boulder Contractor', companyInitials: 'BC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '2024-12-05', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 14, name: 'Natalie Garcia', street: '3232 South Broadway', city: 'Englewood, CO 80113', phone: '(303) 555-0114', email: '', permit: 'PRM-2024-014', status: 'Completed', initials: 'NG', company: 'Denver Contractor', companyInitials: 'DC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '2024-11-05', warrantyStart: '2024-11-05', warrantyEnd: '2025-11-05' },
  { id: 15, name: 'Oliver Martinez', street: '5454 Pecos St', city: 'Westminster, CO 80030', phone: '(720) 555-0115', email: '', permit: 'PRM-2024-015', status: 'Completed', initials: 'OM', company: 'Golden Contractor', companyInitials: 'GC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '2024-11-10', warrantyStart: '2024-11-10', warrantyEnd: '2025-11-10' },
  { id: 16, name: 'Patricia Wilson', street: '7676 Federal Blvd', city: 'Arvada, CO 80003', phone: '(303) 555-0116', email: '', permit: 'PRM-2024-016', status: 'Rough-In', initials: 'PW', company: 'Golden Contractor', companyInitials: 'GC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '2024-11-10', roughInEnd: '2024-11-17', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 17, name: 'Quincy Roberts', street: '9898 Sheridan Blvd', city: 'Thornton, CO 80229', phone: '(720) 555-0117', email: '', permit: 'PRM-2024-017', status: 'To be scheduled', initials: 'QR', company: 'Boulder Contractor', companyInitials: 'BC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 18, name: 'Rachel Taylor', street: '1357 Colfax Ave', city: 'Aurora, CO 80010', phone: '(303) 555-0118', email: '', permit: 'PRM-2024-018', status: 'Final Trim', initials: 'RT', company: 'Denver Contractor', companyInitials: 'DC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '2024-11-25', finalTrimEnd: '2024-12-02', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 19, name: 'Samuel Moore', street: '2468 Havana St', city: 'Aurora, CO 80014', phone: '(720) 555-0119', email: '', permit: 'PRM-2024-019', status: 'Inspection', initials: 'SM', company: 'Golden Contractor', companyInitials: 'GC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '2024-12-03', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 20, name: 'Theresa Jackson', street: '3691 Alameda Ave', city: 'Lakewood, CO 80226', phone: '(303) 555-0120', email: '', permit: 'PRM-2024-020', status: 'Completed', initials: 'TJ', company: 'Golden Contractor', companyInitials: 'GC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '2024-10-22', warrantyStart: '2024-10-22', warrantyEnd: '2025-10-22' },
  { id: 21, name: 'Ursula Harris', street: '4820 Parker Rd', city: 'Parker, CO 80134', phone: '(720) 555-0121', email: '', permit: 'PRM-2024-021', status: 'Completed', initials: 'UH', company: 'Boulder Contractor', companyInitials: 'BC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '2024-11-01', warrantyStart: '2024-11-01', warrantyEnd: '2025-11-01' },
  { id: 22, name: 'Victor Nguyen', street: '5931 Belleview Ave', city: 'Greenwood Village, CO 80111', phone: '(303) 555-0122', email: '', permit: 'PRM-2024-022', status: 'To be scheduled', initials: 'VN', company: 'Denver Contractor', companyInitials: 'DC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 23, name: 'Wendy Clark', street: '6042 Kipling St', city: 'Wheat Ridge, CO 80033', phone: '(720) 555-0123', email: '', permit: 'PRM-2024-023', status: 'Rough-In', initials: 'WC', company: 'Golden Contractor', companyInitials: 'GC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '2024-11-14', roughInEnd: '2024-11-21', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 24, name: 'Xavier Lopez', street: '7153 Santa Fe Dr', city: 'Littleton, CO 80120', phone: '(303) 555-0124', email: '', permit: 'PRM-2024-024', status: 'Inspection', initials: 'XL', company: 'Golden Contractor', companyInitials: 'GC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '2024-12-06', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 25, name: 'Yolanda Martinez', street: '8264 University Blvd', city: 'Highlands Ranch, CO 80126', phone: '(720) 555-0125', email: '', permit: 'PRM-2024-025', status: 'Completed', initials: 'YM', company: 'Boulder Contractor', companyInitials: 'BC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '2024-11-08', warrantyStart: '2024-11-08', warrantyEnd: '2025-11-08' },
  { id: 26, name: 'Zachary White', street: '9375 Colorado Blvd', city: 'Thornton, CO 80229', phone: '(303) 555-0126', email: '', permit: 'PRM-2024-026', status: 'Final Trim', initials: 'ZW', company: 'Boulder Contractor', companyInitials: 'BC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '2024-11-23', finalTrimEnd: '2024-11-30', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 27, name: 'Aaron Bennett', street: '1425 Downing St', city: 'Denver, CO 80218', phone: '(720) 555-0127', email: '', permit: 'PRM-2024-027', status: 'Rough-In', initials: 'AB', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '2024-11-16', roughInEnd: '2024-11-23', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 28, name: 'Brenda Coleman', street: '2536 York St', city: 'Denver, CO 80205', phone: '(303) 555-0128', email: '', permit: 'PRM-2024-028', status: 'To be scheduled', initials: 'BC', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 29, name: 'Christopher Diaz', street: '3647 Steele St', city: 'Denver, CO 80205', phone: '(720) 555-0129', email: '', permit: 'PRM-2024-029', status: 'Inspection', initials: 'CD', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '2024-12-07', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 30, name: 'Deborah Ellis', street: '4758 Franklin St', city: 'Denver, CO 80216', phone: '(303) 555-0130', email: '', permit: 'PRM-2024-030', status: 'Completed', initials: 'DE', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '2024-11-12', warrantyStart: '2024-11-12', warrantyEnd: '2025-11-12' },
  { id: 31, name: 'Eric Foster', street: '5869 Marion St', city: 'Denver, CO 80218', phone: '(720) 555-0131', email: '', permit: 'PRM-2024-031', status: 'Final Trim', initials: 'EF', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '2024-11-26', finalTrimEnd: '2024-12-03', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 32, name: 'Frances Gray', street: '6970 Clarkson St', city: 'Denver, CO 80218', phone: '(303) 555-0132', email: '', permit: 'PRM-2024-032', status: 'Rough-In', initials: 'FG', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '2024-11-17', roughInEnd: '2024-11-24', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 33, name: 'George Hughes', street: '7081 Adams St', city: 'Commerce City, CO 80022', phone: '(720) 555-0133', email: '', permit: 'PRM-2024-033', status: 'To be scheduled', initials: 'GH', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 34, name: 'Helen Irving', street: '8192 Washington St', city: 'Thornton, CO 80229', phone: '(303) 555-0134', email: '', permit: 'PRM-2024-034', status: 'Inspection', initials: 'HI', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '2024-12-08', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 35, name: 'Ian Jenkins', street: '9203 Monaco Pkwy', city: 'Denver, CO 80207', phone: '(720) 555-0135', email: '', permit: 'PRM-2024-035', status: 'Completed', initials: 'IJ', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '2024-11-14', warrantyStart: '2024-11-14', warrantyEnd: '2025-11-14' },
  { id: 36, name: 'Julia Kelly', street: '1314 Birch St', city: 'Broomfield, CO 80020', phone: '(303) 555-0136', email: '', permit: 'PRM-2024-036', status: 'Final Trim', initials: 'JK', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '2024-11-27', finalTrimEnd: '2024-12-04', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 37, name: 'Keith Lambert', street: '2425 Elm St', city: 'Golden, CO 80401', phone: '(720) 555-0137', email: '', permit: 'PRM-2024-037', status: 'Rough-In', initials: 'KL', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '2024-11-18', roughInEnd: '2024-11-25', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 38, name: 'Linda Morgan', street: '3536 Oak St', city: 'Westminster, CO 80030', phone: '(303) 555-0138', email: '', permit: 'PRM-2024-038', status: 'To be scheduled', initials: 'LM', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 39, name: 'Marcus Nelson', street: '4647 Pine St', city: 'Arvada, CO 80002', phone: '(720) 555-0139', email: '', permit: 'PRM-2024-039', status: 'Inspection', initials: 'MN', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '2024-12-09', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 40, name: 'Nina Owens', street: '5758 Maple Ave', city: 'Lakewood, CO 80214', phone: '(303) 555-0140', email: '', permit: 'PRM-2024-040', status: 'Completed', initials: 'NO', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '2024-11-15', warrantyStart: '2024-11-15', warrantyEnd: '2025-11-15' },
  { id: 41, name: 'Oscar Patel', street: '6869 Willow Dr', city: 'Englewood, CO 80110', phone: '(720) 555-0141', email: '', permit: 'PRM-2024-041', status: 'Final Trim', initials: 'OP', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '2024-11-28', finalTrimEnd: '2024-12-05', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 42, name: 'Paula Quinn', street: '7970 Cedar Ln', city: 'Littleton, CO 80123', phone: '(303) 555-0142', email: '', permit: 'PRM-2024-042', status: 'Rough-In', initials: 'PQ', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '2024-11-19', roughInEnd: '2024-11-26', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 43, name: 'Ryan Stewart', street: '8081 Spruce Way', city: 'Centennial, CO 80112', phone: '(720) 555-0143', email: '', permit: 'PRM-2024-043', status: 'To be scheduled', initials: 'RS', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 44, name: 'Sandra Turner', street: '9192 Aspen Ct', city: 'Aurora, CO 80015', phone: '(303) 555-0144', email: '', permit: 'PRM-2024-044', status: 'Inspection', initials: 'ST', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '2024-12-10', finalTrimStart: '', finalTrimEnd: '', completedDate: '', warrantyStart: '', warrantyEnd: '' },
  { id: 45, name: 'Timothy Underwood', street: '1023 Redwood St', city: 'Parker, CO 80138', phone: '(720) 555-0145', email: '', permit: 'PRM-2024-045', status: 'Completed', initials: 'TU', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '', finalTrimEnd: '', completedDate: '2024-11-16', warrantyStart: '2024-11-16', warrantyEnd: '2025-11-16' },
  { id: 46, name: 'Veronica Walsh', street: '2134 Sycamore Blvd', city: 'Castle Rock, CO 80104', phone: '(303) 555-0146', email: '', permit: 'PRM-2024-046', status: 'Final Trim', initials: 'VW', otherContacts: [], contacts: [], propertyDescription: '', accessCode: '', roughInStart: '', roughInEnd: '', inspectionDate: '', finalTrimStart: '2024-11-29', finalTrimEnd: '2024-12-06', completedDate: '', warrantyStart: '', warrantyEnd: '' },
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
  projectsStore = projectsStore.map(p => 
    p.id === id ? { ...p, ...updates } : p
  );
  return projectsStore.find(p => p.id === id);
};

export const deleteProject = (id: number) => {
  projectsStore = projectsStore.filter(p => p.id !== id);
};
