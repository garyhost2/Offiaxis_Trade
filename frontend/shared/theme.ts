/**
 * Offiaxis Trade — Design Token System
 *
 * Register: product (field-first trade management)
 * Scene:    GC / PM / trade worker on a job site, phone in hand, outdoor light.
 *
 * Color strategy: Restrained with one Committed surface.
 * Primary surface: dark slate (authoritative, readable outdoors under any glare).
 * Accent: amber-ochre — semantic for primary actions & active states only.
 * Status vocabulary is fully separate from brand colors.
 *
 * Never add hex values directly to components — import from here.
 */

// ─── Primitives ─────────────────────────────────────────────────────────────
// Raw values. Don't use these in components directly — use semantic tokens below.

const primitive = {
  // Slate scale (app chrome, headers, nav)
  slate950: '#0E1016',
  slate900: '#16181F',
  slate800: '#1E2130',
  slate700: '#252A3A',
  slate600: '#2E3447',
  slate500: '#404766',
  slate400: '#5B6380',
  slate300: '#8B95AE',
  slate200: '#C2C9D8',
  slate100: '#E4E8F0',
  slate50:  '#F3F5F9',

  // Amber scale (primary accent)
  amber700: '#B45309',
  amber600: '#D97706',
  amber500: '#F59E0B',
  amber400: '#FCD34D',
  amber100: '#FEF3C7',
  amber50:  '#FFFBEB',

  // Status greens
  green700: '#15803D',
  green600: '#16A34A',
  green100: '#DCFCE7',

  // Status reds
  red700:   '#B91C1C',
  red600:   '#DC2626',
  red100:   '#FEE2E2',

  // Status blues
  blue700:  '#1D4ED8',
  blue600:  '#2563EB',
  blue100:  '#DBEAFE',

  // Neutral (text, borders, disabled)
  neutral900: '#111318',
  neutral700: '#374151',
  neutral600: '#4B5563',
  neutral500: '#6B7280',
  neutral400: '#9CA3AF',
  neutral300: '#D1D5DB',
  neutral200: '#E5E7EB',
  neutral100: '#F3F4F6',
  neutral50:  '#F9FAFB',
  white:      '#FFFFFF',
} as const;

// ─── Semantic Color Tokens ───────────────────────────────────────────────────

export const colors = {
  // ── Brand chrome (headers, tab bars, nav surfaces)
  brand: {
    bg:        primitive.slate900,    // Primary dark header surface
    bgElevated:primitive.slate800,    // Slightly lighter (sub-headers, dropdowns on dark)
    bgDeep:    primitive.slate950,    // Tab bars, bottom nav
    border:    primitive.slate700,    // Borders within dark surfaces
    text:      '#F1F3F7',             // Body text on dark
    textMuted: primitive.slate300,    // Secondary text on dark
  },

  // ── Accent (primary actions, active states, key indicators ONLY)
  accent: {
    default:   primitive.amber600,
    strong:    primitive.amber700,
    light:     primitive.amber500,
    subtle:    primitive.amber100,
    text:      primitive.amber600,    // Accent text on light surfaces
    textOnDark:primitive.amber500,    // Accent text on dark surfaces
  },

  // ── Content surfaces (cards, forms, content areas)
  surface: {
    bg:        primitive.slate50,     // Screen background (light)
    card:      primitive.white,       // Card / panel surface
    elevated:  primitive.white,       // Modals, dropdowns
    input:     primitive.white,       // Form input background
    inputBorder:         primitive.neutral200,
    inputBorderFocus:    primitive.amber600,
    inputBorderError:    primitive.red600,
    disabled:  primitive.neutral100,
  },

  // ── Text on light surfaces
  text: {
    primary:   primitive.neutral900,
    secondary: primitive.neutral600,
    muted:     primitive.neutral400,
    disabled:  primitive.neutral300,
    link:      primitive.blue600,
    error:     primitive.red600,
    success:   primitive.green600,
  },

  // ── Semantic status (job states, permit states, change order states)
  // These are the ONLY correct status colors. Do not define elsewhere.
  status: {
    complete:   { bg: primitive.green100,  text: primitive.green700,  dot: primitive.green600  },
    inProgress: { bg: primitive.amber100,  text: primitive.amber700,  dot: primitive.amber600  },
    pending:    { bg: primitive.blue100,   text: primitive.blue700,   dot: primitive.blue600   },
    blocked:    { bg: primitive.red100,    text: primitive.red700,    dot: primitive.red600    },
    draft:      { bg: primitive.neutral100,text: primitive.neutral600,dot: primitive.neutral400},
    scheduled:  { bg: '#EDE9FE',           text: '#6D28D9',           dot: '#7C3AED'           },
    cancelled:  { bg: primitive.neutral100,text: primitive.neutral500,dot: primitive.neutral400},
  },

  // ── Dividers and structural borders
  border: {
    default:  primitive.neutral200,
    strong:   primitive.neutral300,
    subtle:   primitive.neutral100,
  },

  // ── Feedback surfaces
  feedback: {
    errorBg:   primitive.red100,
    errorText: primitive.red600,
    successBg: primitive.green100,
    successText:primitive.green700,
    warningBg: primitive.amber100,
    warningText:primitive.amber700,
    infoBg:    primitive.blue100,
    infoText:  primitive.blue700,
  },

  // ── Utility
  overlay:         'rgba(14,16,22,0.55)',
  overlayStrong:   'rgba(14,16,22,0.80)',
  transparent:     'transparent',
  white:           primitive.white,
  black:           primitive.neutral900,
} as const;

// ─── Typography ──────────────────────────────────────────────────────────────
// Fixed rem-equivalent scale. One family; weight contrast carries hierarchy.

export const typography = {
  // Font family (system-native; no Google Fonts loading on mobile)
  fontFamily: {
    sans:  'System',          // React Native resolves to SF Pro / Roboto
    mono:  'Courier New',     // Only for permit numbers, codes, amounts
  },

  // Size scale (pt, equivalent to sp on Android)
  size: {
    xs:   11,
    sm:   13,
    base: 15,
    md:   17,
    lg:   20,
    xl:   24,
    '2xl':28,
    '3xl':32,
    '4xl':38,
  },

  // Weight constants — use these named values, not raw numbers
  weight: {
    regular:   '400' as const,
    medium:    '500' as const,
    semibold:  '600' as const,
    bold:      '700' as const,
    extrabold: '800' as const,
  },

  // Line height multipliers for readability
  lineHeight: {
    tight:   1.2,
    base:    1.45,
    relaxed: 1.6,
  },

  // Letter spacing (tracking)
  tracking: {
    tight:   -0.5,
    normal:   0,
    wide:     0.5,
    wider:    1.0,
    caps:     1.5,   // All-caps labels
  },
} as const;

// ─── Spacing ─────────────────────────────────────────────────────────────────
// 4pt base grid. Rhythm varies — do not use a single value for everything.

export const spacing = {
  px:  1,
  0.5: 2,
  1:   4,
  1.5: 6,
  2:   8,
  2.5: 10,
  3:   12,
  4:   16,
  5:   20,
  6:   24,
  7:   28,
  8:   32,
  10:  40,
  12:  48,
  16:  64,
  20:  80,
} as const;

// ─── Border Radius ───────────────────────────────────────────────────────────

export const radius = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  '2xl':28,
  full: 999,
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────
// iOS shadows only. Android uses elevation prop.

export const shadows = {
  sm: {
    shadowColor:   primitive.slate950,
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius:  3,
    elevation: 2,
  },
  md: {
    shadowColor:   primitive.slate950,
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius:  8,
    elevation: 4,
  },
  lg: {
    shadowColor:   primitive.slate950,
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius:  16,
    elevation: 8,
  },
} as const;

// ─── Touch Targets ───────────────────────────────────────────────────────────
// Minimum 44pt per iOS HIG / Android Material guidelines.
// Primary actions use 56pt for glove-friendly use.

export const touch = {
  min:     44,
  primary: 56,
  icon:    40,
} as const;

// ─── Z-index ─────────────────────────────────────────────────────────────────

export const zIndex = {
  base:    0,
  raised:  10,
  overlay: 20,
  modal:   30,
  toast:   40,
} as const;
