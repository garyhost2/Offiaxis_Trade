import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PLTabProps {
  project: any;
  changeOrders: any[];
  permits: any[];
  receipts: any[];
  router: any;
}

const PLTab: React.FC<PLTabProps> = ({ project, changeOrders, permits, receipts, router }) => {
  // P&L tab state
  const [plSummary, setPlSummary] = useState({ totalIncome: 0, totalExpenses: 0, profit: 0 });
  const [plRecentActivity, setPlRecentActivity] = useState<any[]>([]);
  const [plAllActivity, setPlAllActivity] = useState<any[]>([]); // Store all activity
  const [plDisplayCount, setPlDisplayCount] = useState(5); // Start with 5
  const [plLoading, setPlLoading] = useState(false);

  // Calculate permit expenses
  const calculatePermitExpenses = () => {
    let totalExpenses = 0;
    const activities: any[] = [];
    
    permits.forEach((permit: any) => {
      if (permit.fees) {
        // Parse fees amount (remove $ and convert to number)
        const feeAmount = parseFloat(permit.fees.replace(/[$,]/g, ''));
        
        if (!isNaN(feeAmount) && feeAmount > 0) {
          totalExpenses += feeAmount;
          
          // Add to activities
          activities.push({
            id: permit.id,
            type: 'expense',
            amount: feeAmount,
            date: permit.dateAdded || new Date().toISOString().split('T')[0],
            note: `Permit ${permit.permitNumber || ''}`,
            category: 'Permit',
          });
        }
      }
    });
    
    return { totalExpenses, activities };
  };

  // Calculate expenses from receipts
  const calculateReceiptExpenses = () => {
    let totalExpenses = 0;
    const activities: any[] = [];
    
    receipts.forEach((receipt: any) => {
      if (receipt.totalAmount) {
        const amount = parseFloat(receipt.totalAmount);
        
        if (!isNaN(amount) && amount > 0) {
          totalExpenses += amount;
          
          // Add to activities
          activities.push({
            id: receipt.id,
            type: 'expense',
            amount: amount,
            date: receipt.date || receipt.createdAt || new Date().toISOString().split('T')[0],
            note: receipt.storeName || 'Receipt',
            vendor: receipt.storeName,
            category: 'Receipt',
            isReceipt: true,
          });
        }
      }
    });
    
    return { totalExpenses, activities };
  };

  // Calculate income from change orders based on payment status
  const calculateChangeOrderIncome = () => {
    let totalIncome = 0;
    const activities: any[] = [];
    
    changeOrders.forEach((order: any) => {
      if (order.paymentStatus && order.paymentStatus !== 'Unpaid') {
        // Add to total - use amount as-is (respects positive/negative)
        totalIncome += order.amount;
        
        // Add to recent activity (all paid items)
        activities.push({
          id: order.id,
          type: order.amount >= 0 ? 'income' : 'expense',
          amount: Math.abs(order.amount),
          date: order.date,
          note: order.title,
          category: order.type,
          paymentStatus: order.paymentStatus
        });
      }
    });
    
    // Sort activities by date descending (newest first)
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return { totalIncome, activities };
  };

  const fetchPLData = async () => {
    if (!project) return;
    
    try {
      setPlLoading(true);
      
      // Calculate income from change orders
      const changeOrderData = calculateChangeOrderIncome();
      
      // Calculate expenses from permits
      const permitData = calculatePermitExpenses();
      
      // Calculate expenses from receipts
      const receiptData = calculateReceiptExpenses();
      
      // Set summary - income from change orders, expenses from permits + receipts
      const totalIncome = changeOrderData.totalIncome;
      const totalExpenses = permitData.totalExpenses + receiptData.totalExpenses;
      const profit = totalIncome - totalExpenses;
      
      setPlSummary({
        totalIncome,
        totalExpenses,
        profit
      });
      
      // Combine activities from change orders, permits, and receipts
      const allActivities = [...changeOrderData.activities, ...permitData.activities, ...receiptData.activities];
      
      // Sort all activities by date descending (newest first)
      allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Store all activity
      setPlAllActivity(allActivities);
      // Display first 5
      setPlRecentActivity(allActivities.slice(0, plDisplayCount));
    } catch (error) {
      console.error('Error fetching P&L data:', error);
    } finally {
      setPlLoading(false);
    }
  };

  // Fetch P&L data on mount and when dependencies change
  useEffect(() => {
    if (project) {
      fetchPLData();
    }
  }, [project, changeOrders, permits, receipts]);

  if (plLoading) {
    return <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />;
  }

  return (
    <View style={styles.plContainer}>
      {/* Summary Cards */}
      <View style={styles.plSummaryCards}>
        <View style={[styles.plCard, { borderLeftColor: '#10B981' }]}>
          <Text style={styles.plCardLabel}>Total Income</Text>
          <Text style={[styles.plCardValue, { color: '#10B981' }]}>
            ${plSummary.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
        
        <View style={[styles.plCard, { borderLeftColor: '#EF4444' }]}>
          <Text style={styles.plCardLabel}>Total Expenses</Text>
          <Text style={[styles.plCardValue, { color: '#EF4444' }]}>
            ${plSummary.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
        
        <View style={[styles.plCard, { borderLeftColor: plSummary.profit >= 0 ? '#10B981' : '#EF4444' }]}>
          <Text style={styles.plCardLabel}>Profit</Text>
          <Text style={[styles.plCardValue, { color: plSummary.profit >= 0 ? '#10B981' : '#EF4444' }]}>
            ${plSummary.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={[styles.plCardStatus, {
            backgroundColor: plSummary.profit >= 0 ? '#D1FAE5' : '#FEE2E2',
            color: plSummary.profit >= 0 ? '#059669' : '#DC2626'
          }]}>
            {plSummary.profit >= 0 ? '✓ Profitable' : '⚠ At a Loss'}
          </Text>
        </View>
      </View>
      
      {/* Category Line */}
      <View style={styles.plCategoryLine}>
        <Text style={styles.plCategoryLineText}>
          Labor • Materials • Warranty • Mileage • Misc
        </Text>
      </View>
      
      {/* Recent Activity */}
      <View style={styles.plRecentActivity}>
        <Text style={styles.plRecentTitle}>Recent Activity</Text>
        {plRecentActivity.length === 0 ? (
          <Text style={styles.plEmptyText}>No recent activity</Text>
        ) : (
          <>
            {plRecentActivity.map((entry: any, index: number) => (
              <View key={index} style={styles.plActivityItem}>
                {/* Top Row: Amount (left) and Badge (right) */}
                <View style={styles.plActivityTopRow}>
                  <Text style={[
                    styles.plActivityAmount,
                    { color: entry.type === 'income' ? '#10B981' : '#EF4444' }
                  ]}>
                    ${entry.amount.toFixed(2)}
                  </Text>
                  <View style={[
                    styles.plActivityBadge,
                    { backgroundColor: entry.isReceipt ? '#FEF3C7' : (entry.type === 'income' ? '#D1FAE5' : '#FEE2E2') }
                  ]}>
                    <Text style={[
                      styles.plActivityBadgeText,
                      { color: entry.isReceipt ? '#D97706' : (entry.type === 'income' ? '#059669' : '#DC2626') }
                    ]}>
                      {entry.isReceipt ? 'Receipt' : (entry.type === 'income' 
                        ? entry.incomeType || entry.category || 'Income'
                        : entry.category || 'Expense')}
                    </Text>
                  </View>
                </View>
                {/* Bottom Row: Date (left) and Description (right) */}
                <View style={styles.plActivityBottomRow}>
                  <Text style={styles.plActivityDate}>
                    {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                  {(entry.note || entry.vendor) && (
                    <Text style={styles.plActivityNote} numberOfLines={1}>
                      {entry.vendor || entry.note}
                    </Text>
                  )}
                </View>
              </View>
            ))}
            
            {/* Show More Button */}
            {plDisplayCount < plAllActivity.length && (
              <TouchableOpacity
                style={styles.plShowMoreButton}
                onPress={() => {
                  const newCount = plDisplayCount + 10;
                  setPlDisplayCount(newCount);
                  setPlRecentActivity(plAllActivity.slice(0, newCount));
                }}
              >
                <Text style={styles.plShowMoreText}>
                  Show More ({plAllActivity.length - plDisplayCount} remaining)
                </Text>
                <Ionicons name="chevron-down" size={18} color="#4F46E5" />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
      
      {/* View Full P&L Report Button */}
      <TouchableOpacity
        style={styles.plFullReportButton}
        onPress={() => router.push(`/profitloss?projectId=${project.id}`)}
      >
        <Text style={styles.plFullReportButtonText}>View Full P&L Report</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  plContainer: {
    padding: 16,
  },
  plSummaryCards: {
    gap: 12,
  },
  plCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  plCardLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  plCardValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  plCardStatus: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  plCategoryLine: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  plCategoryLineText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  plRecentActivity: {
    marginTop: 16,
  },
  plRecentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  plEmptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20,
  },
  plActivityItem: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  plActivityTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  plActivityBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plActivityAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  plActivityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  plActivityBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  plActivityDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  plActivityNote: {
    fontSize: 12,
    color: '#6B7280',
    maxWidth: 150,
    textAlign: 'right',
  },
  plShowMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  plShowMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },
  plFullReportButton: {
    marginTop: 24,
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  plFullReportButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default PLTab;
