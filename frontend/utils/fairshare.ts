// ============================================================================
// FAIRSHARE DESIGN SYSTEM v1.0
// Modern Fintech Design for Mobile-First Expense Sharing App
// Inspired by: Splitwise, Revolut, Linear, Stripe, Notion
// ============================================================================

// PRIMARY COLOR PALETTE
const PRIMARY_EMERALD = '#10B981' // Primary action, success states
const PRIMARY_NAVY = '#0F172A' // Primary text, headers, backgrounds
const PRIMARY_SLATE = '#64748B' // Secondary text, muted content

// SEMANTIC COLORS
const SEMANTIC_SUCCESS = '#059669'
const SEMANTIC_WARNING = '#D97706'
const SEMANTIC_ERROR = '#DC2626'
const SEMANTIC_INFO = '#0284C7'

// NEUTRAL PALETTE (Gray scale for modern UI)
const NEUTRAL_50 = '#F9FAFB'
const NEUTRAL_100 = '#F3F4F6'
const NEUTRAL_200 = '#E5E7EB'
const NEUTRAL_300 = '#D1D5DB'
const NEUTRAL_400 = '#9CA3AF'
const NEUTRAL_500 = '#6B7280'
const NEUTRAL_600 = '#4B5563'
const NEUTRAL_700 = '#374151'
const NEUTRAL_800 = '#1F2937'
const NEUTRAL_900 = '#111827'

// BACKGROUNDS & SURFACES
const BG_PRIMARY = '#FFFFFF' // Main background
const BG_SECONDARY = '#F9FAFB' // Secondary backgrounds
const BG_TERTIARY = '#F3F4F6' // Tertiary backgrounds
const SURFACE_ELEVATION_1 = '#FFFFFF'
const SURFACE_ELEVATION_2 = '#F9FAFB'

// TINTS & OVERLAYS
const EMERALD_TINT = '#D1FAE5' // Emerald light tint
const EMERALD_LIGHT = '#A7F3D0'
const NAVY_TINT = '#EFF6FF' // Navy light tint
const ERROR_TINT = '#FEE2E2'
const WARNING_TINT = '#FEF3C7'

export const theme = {
  // ========== COLOR SYSTEM ==========
  colors: {
    // Brand Colors
    primary: PRIMARY_EMERALD,
    primaryDark: '#047857',
    primaryLight: '#D1FAE5',
    secondary: PRIMARY_NAVY,
    secondaryLight: '#EFF6FF',
    
    // Semantic Colors
    success: SEMANTIC_SUCCESS,
    warning: SEMANTIC_WARNING,
    error: SEMANTIC_ERROR,
    danger: SEMANTIC_ERROR,
    info: SEMANTIC_INFO,
    
    // Text Colors
    text: PRIMARY_NAVY,
    textPrimary: PRIMARY_NAVY,
    textSecondary: PRIMARY_SLATE,
    textMuted: NEUTRAL_500,
    textInverse: '#FFFFFF',
    
    // Background Colors
    background: BG_SECONDARY,
    backgroundPrimary: BG_PRIMARY,
    backgroundSecondary: BG_SECONDARY,
    backgroundTertiary: BG_TERTIARY,
    
    // Surface Colors
    surface: SURFACE_ELEVATION_1,
    surfaceElevated: SURFACE_ELEVATION_2,
    
    // Borders & Lines
    border: NEUTRAL_300,
    borderLight: NEUTRAL_200,
    borderDark: NEUTRAL_400,
    line: NEUTRAL_200,
    
    // Interactive States
    interactive: PRIMARY_EMERALD,
    interactiveHover: '#059669',
    interactiveActive: '#047857',
    interactiveDisabled: NEUTRAL_400,
    
    // Tints
    emerald: PRIMARY_EMERALD,
    emeraldDark: '#047857',
    emeraldTint: EMERALD_TINT,
    emeraldLight: EMERALD_LIGHT,
    navy: PRIMARY_NAVY,
    navyTint: NAVY_TINT,
    muted: NEUTRAL_500,
    mutedSoft: NEUTRAL_400,
    
    // Legacy (backward compat)
    statusPositive: SEMANTIC_SUCCESS,
    statusNegative: SEMANTIC_ERROR,
    statusWarning: SEMANTIC_WARNING,
  },
  
  // ========== TYPOGRAPHY SYSTEM ==========
  typography: {
    // Display / Hero text
    displayLarge: {
      fontSize: 48,
      fontWeight: '800',
      lineHeight: 56,
      letterSpacing: -1.5,
    },
    displayMedium: {
      fontSize: 40,
      fontWeight: '800',
      lineHeight: 48,
      letterSpacing: -1,
    },
    displaySmall: {
      fontSize: 32,
      fontWeight: '800',
      lineHeight: 40,
      letterSpacing: -0.5,
    },
    
    // Headings
    heading1: {
      fontSize: 28,
      fontWeight: '800',
      lineHeight: 36,
      letterSpacing: -0.3,
    },
    heading2: {
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 32,
      letterSpacing: 0,
    },
    heading3: {
      fontSize: 20,
      fontWeight: '700',
      lineHeight: 28,
      letterSpacing: 0,
    },
    
    // Body text
    bodyLarge: {
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 24,
      letterSpacing: 0.3,
    },
    bodyRegular: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 22,
      letterSpacing: 0.2,
    },
    bodySmall: {
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 18,
      letterSpacing: 0.1,
    },
    
    // UI text
    buttonLarge: {
      fontSize: 16,
      fontWeight: '700',
      lineHeight: 20,
      letterSpacing: 0,
    },
    buttonMedium: {
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 18,
      letterSpacing: 0,
    },
    buttonSmall: {
      fontSize: 12,
      fontWeight: '700',
      lineHeight: 16,
      letterSpacing: 0,
    },
    
    // Labels & captions
    label: {
      fontSize: 12,
      fontWeight: '700',
      lineHeight: 16,
      letterSpacing: 1,
      textTransform: 'uppercase' as const,
    },
    caption: {
      fontSize: 11,
      fontWeight: '600',
      lineHeight: 14,
      letterSpacing: 0.5,
    },
  },
  
  // ========== SPACING SYSTEM ==========
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    xxxxl: 40,
    massive: 48,
  },
  
  // ========== BORDER RADIUS ==========
  radius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    pill: 999,
  },
  
  // ========== SHADOWS (Elevation System) ==========
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    xl: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 8,
    },
  },
  
  // ========== COMPONENT STYLES ==========
  buttons: {
    primary: {
      backgroundColor: PRIMARY_EMERALD,
      color: '#FFFFFF',
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 24,
      fontWeight: '700',
    },
    secondary: {
      backgroundColor: NEUTRAL_100,
      color: PRIMARY_NAVY,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 24,
      fontWeight: '700',
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: PRIMARY_EMERALD,
      color: PRIMARY_EMERALD,
      borderRadius: 12,
      paddingVertical: 11,
      paddingHorizontal: 23,
      fontWeight: '700',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: PRIMARY_EMERALD,
      paddingVertical: 12,
      paddingHorizontal: 24,
      fontWeight: '600',
    },
  },
  
  inputs: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: NEUTRAL_300,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: BG_PRIMARY,
  },
  
  cards: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: BG_PRIMARY,
    elevation: 'md',
  },
  
  // ========== ANIMATIONS ==========
  animation: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    slower: '500ms',
  },
} as const

// Dark theme variant
export const darkTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    text: '#E6EEF3',
    textSoft: '#B6C3CA',
    muted: '#94A3B8',
    mutedSoft: '#778899',
    background: '#0B1115',
    backgroundPrimary: '#05060A',
    surface: '#0F1720',
    surfaceElevated: '#111827',
    line: 'rgba(255,255,255,0.06)',
    navy: '#0B1220',
    navyTint: '#0F172A',
    emeraldTint: '#063E2B',
    surface: '#0B1115',
  },
} as const

export const lightTheme = theme

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const formatMoney = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

export const getRootNavigation = (navigation: any) => {
  return navigation.getParent() || navigation
}
