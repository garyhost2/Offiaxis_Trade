import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../shared/theme';

// ─── Menu item definition ────────────────────────────────────────────────────

type MenuItem = {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  route?: string;
  disabled?: boolean;
  badge?: string;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

const MENU_SECTIONS: MenuSection[] = [
  {
    title: 'Operations',
    items: [
      {
        id: 'schedule',
        label: 'Schedules',
        description: 'View and manage job timelines',
        icon: 'calendar-outline',
        iconColor: '#2563EB',
        iconBg: '#DBEAFE',
        route: '/schedule',
      },
      {
        id: 'inventory',
        label: 'Inventory',
        description: 'Materials, tools and stock levels',
        icon: 'cube-outline',
        iconColor: '#D97706',
        iconBg: '#FEF3C7',
        route: '/inventory',
      },
      {
        id: 'site-notes-ai',
        label: 'Site Notes AI',
        description: 'AI-powered job documentation',
        icon: 'bulb-outline',
        iconColor: '#0284C7',
        iconBg: '#E0F2FE',
        route: '/site-notes-ai',
      },
      {
        id: 'knowledge-center',
        label: 'Knowledge Center',
        description: 'Training videos and templates',
        icon: 'book-outline',
        iconColor: '#7C3AED',
        iconBg: '#EDE9FE',
        route: '/knowledge-center',
      },
    ],
  },
  {
    title: 'Financials',
    items: [
      {
        id: 'receipts',
        label: 'Receipts',
        description: 'All project receipts and expenses',
        icon: 'receipt-outline',
        iconColor: '#D97706',
        iconBg: '#FEF3C7',
        route: '/receipts',
      },
      {
        id: 'e-contracts',
        label: 'E-Contracts',
        description: 'Digital document signing',
        icon: 'document-text-outline',
        iconColor: '#16A34A',
        iconBg: '#DCFCE7',
        route: '/e-contracts',
      },
    ],
  },
  {
    title: 'Team',
    items: [
      {
        id: 'spaces',
        label: 'OffiAxis Spaces',
        description: 'Team chat and file workspaces',
        icon: 'chatbubbles-outline',
        iconColor: '#2563EB',
        iconBg: '#DBEAFE',
        disabled: true,
        badge: 'Soon',
      },
      {
        id: 'users',
        label: 'Users and Roles',
        description: 'Manage team access and permissions',
        icon: 'people-outline',
        iconColor: '#4B5563',
        iconBg: '#F3F4F6',
        disabled: true,
        badge: 'Soon',
      },
    ],
  },
  {
    title: 'Support',
    items: [
      {
        id: 'help',
        label: 'Help and Support',
        description: 'Documentation and help center',
        icon: 'help-circle-outline',
        iconColor: '#4B5563',
        iconBg: '#F3F4F6',
      },
      {
        id: 'about',
        label: 'About OffiAxis',
        description: 'Version info and legal',
        icon: 'information-circle-outline',
        iconColor: '#4B5563',
        iconBg: '#F3F4F6',
      },
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function MenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();

  const handleItemPress = (item: MenuItem) => {
    if (item.disabled || !item.route) return;
    router.push(item.route as any);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerEyebrow}>OFFIAXIS</Text>
          <Text style={styles.headerTitle}>Quick Access</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => router.push('/settings')}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={22} color={colors.brand.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => signOut()}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Ionicons name="log-out-outline" size={22} color={colors.brand.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 80, 100) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, idx) => {
                const rowContent = (
                  <>
                    <View
                      style={[
                        styles.iconWrap,
                        { backgroundColor: item.disabled ? '#F3F4F6' : item.iconBg },
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={22}
                        color={item.disabled ? '#9CA3AF' : item.iconColor}
                      />
                    </View>

                    <View style={styles.rowText}>
                      <Text
                        style={[styles.rowLabel, item.disabled && styles.rowLabelDisabled]}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={[styles.rowDesc, item.disabled && styles.rowDescDisabled]}
                        numberOfLines={1}
                      >
                        {item.description}
                      </Text>
                    </View>

                    {item.badge ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    ) : item.route ? (
                      <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
                    ) : null}
                  </>
                );

                return (
                  <React.Fragment key={item.id}>
                    {item.disabled ? (
                      <View
                        style={[styles.menuRow, styles.menuRowDisabled]}
                        accessible={true}
                        accessibilityLabel={`${item.label}. Coming soon. ${item.description}`}
                        accessibilityState={{ disabled: true }}
                      >
                        {rowContent}
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.menuRow}
                        onPress={() => handleItemPress(item)}
                        activeOpacity={0.65}
                        accessibilityRole="button"
                        accessibilityLabel={item.label}
                        accessibilityHint={item.description}
                      >
                        {rowContent}
                      </TouchableOpacity>
                    )}

                    {idx < section.items.length - 1 && <View style={styles.divider} />}
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface.bg,
  },
  header: {
    backgroundColor: colors.brand.bg,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent.textOnDark,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.brand.text,
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 2,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.muted,
    letterSpacing: 1.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: colors.surface.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
    shadowColor: '#0E1016',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
    gap: 12,
  },
  menuRowDisabled: {
    opacity: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginLeft: 72,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  rowLabelDisabled: {
    color: colors.text.muted,
  },
  rowDesc: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  rowDescDisabled: {
    color: colors.text.muted,
  },
  badge: {
    backgroundColor: colors.surface.bg,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.muted,
    letterSpacing: 0.5,
  },
});
