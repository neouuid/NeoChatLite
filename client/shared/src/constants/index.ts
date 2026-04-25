// API constants
export const API_BASE_URL = 'http://localhost:8080/api/v1';
export const WS_BASE_URL = 'ws://localhost:8080/ws';

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'neochat_access_token',
  REFRESH_TOKEN: 'neochat_refresh_token',
  USER: 'neochat_user',
  THEME: 'neochat_theme',
  SETTINGS: 'neochat_settings',
};

// Theme colors
export const COLORS = {
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  secondary: '#8b5cf6',
  accent: '#f59e0b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Light theme
  light: {
    background: '#ffffff',
    surface: '#F7F8FA',
    text: {
      primary: '#1D2129',
      secondary: '#86909C',
      tertiary: '#C9CDD4',
    },
    border: '#E5E6EB',
  },

  // Dark theme
  dark: {
    background: '#131324',
    surface: '#1a1a2e',
    text: {
      primary: '#ffffff',
      secondary: '#8b8bb3',
      tertiary: '#4a4a6a',
    },
    border: '#252542',
  },
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Typography
export const TYPOGRAPHY = {
  fonts: {
    primary: 'Inter',
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

// Border radius
export const BORDER_RADIUS = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

// Animation
export const ANIMATION = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
};

// Message types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  SYSTEM: 'system',
} as const;

// Conversation types
export const CONVERSATION_TYPES = {
  SINGLE: 'single',
  GROUP: 'group',
} as const;

// User status
export const USER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  AWAY: 'away',
  BUSY: 'busy',
} as const;
