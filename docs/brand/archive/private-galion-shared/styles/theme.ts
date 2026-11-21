/**
 * Galion V3 Design System
 * Centralized theme configuration for all platforms
 */

export const theme = {
  colors: {
    // galion.app (Voice AI Platform) - Blue Theme
    galionApp: {
      primary: '#3b82f6',      // Sky Blue
      secondary: '#1e40af',    // Darker Blue
      background: '#0f172a',   // Dark Blue-Gray
      surface: '#1e293b',      // Lighter surface
      text: '#f1f5f9',         // Almost white
      textMuted: '#94a3b8',    // Muted text
      accent: '#60a5fa',       // Light blue
    },
    
    // developer.galion.app (Developer Portal) - Cyan Theme
    developer: {
      primary: '#06b6d4',      // Cyan
      secondary: '#0891b2',    // Darker Cyan
      background: '#0f172a',   // Dark Blue-Gray
      surface: '#1e293b',      // Lighter surface
      text: '#f1f5f9',         // Almost white
      textMuted: '#94a3b8',    // Muted text
      accent: '#22d3ee',       // Light cyan
    },
    
    // galion.studio (B2B Marketing) - Purple/Pink Theme
    studio: {
      primary: '#a855f7',      // Purple
      secondary: '#ec4899',    // Pink
      background: '#0f172a',   // Dark Blue-Gray
      surface: '#1e293b',      // Lighter surface
      text: '#f1f5f9',         // Almost white
      textMuted: '#94a3b8',    // Muted text
      accent: '#c084fc',       // Light purple
    },
    
    // Orb Emotion Colors (for galion.app)
    orb: {
      happy: '#00FF00',        // Green
      sad: '#0000FF',          // Blue
      angry: '#FF0000',        // Red
      excited: '#FFFF00',      // Yellow
      neutral: '#FFFFFF',      // White
    },
    
    // Universal Colors
    universal: {
      black: '#000000',
      white: '#FFFFFF',
      error: '#ef4444',
      success: '#10b981',
      warning: '#f59e0b',
      info: '#3b82f6',
    },
  },
  
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
    '4xl': '6rem',    // 96px
  },
  
  fonts: {
    primary: "'Inter', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },
  
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    glow: '0 0 60px currentColor',
  },
  
  transitions: {
    fast: '150ms ease-in-out',
    base: '250ms ease-in-out',
    slow: '400ms ease-in-out',
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

export type Theme = typeof theme;

// Helper function to get platform-specific colors
export function getPlatformColors(platform: 'galionApp' | 'developer' | 'studio') {
  return theme.colors[platform];
}

// Export individual color palettes for convenience
export const galionAppColors = theme.colors.galionApp;
export const developerColors = theme.colors.developer;
export const studioColors = theme.colors.studio;
export const orbColors = theme.colors.orb;

