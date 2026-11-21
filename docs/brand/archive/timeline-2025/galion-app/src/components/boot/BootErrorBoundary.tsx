'use client';

/**
 * Boot Error Boundary - Prevents boot animation crashes from breaking the app
 * 
 * Features:
 * - Catches all React errors in boot components
 * - Provides instant fallback to simple CSS animation
 * - Logs errors for debugging
 * - Auto-recovers after timeout
 */

import { Component, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
  onError?: (error: Error) => void;
  fallbackDelay?: number; // How long to show fallback before skipping
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class BootErrorBoundary extends Component<Props, State> {
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[BootErrorBoundary] Boot animation crashed:', error, errorInfo);
    
    // Call optional error handler
    this.props.onError?.(error);

    // Auto-skip to main app after delay
    const delay = this.props.fallbackDelay || 3000;
    this.timeoutId = setTimeout(() => {
      // Force skip by throwing to parent if needed
      window.location.reload();
    }, delay);
  }

  componentWillUnmount() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      return <SimpleFallbackBoot />;
    }

    return this.props.children;
  }
}

/**
 * Simple CSS-only fallback boot animation
 * Used when Lottie/Framer Motion fails
 */
function SimpleFallbackBoot() {
  return (
    <div className="fixed inset-0 bg-[#0a0a0f] flex items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-radial from-[#0f1729]/50 to-[#0a0a0f] animate-pulse" />
      
      {/* Central orb with pure CSS animation */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      >
        {/* Orb core */}
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 shadow-2xl shadow-cyan-500/50 animate-pulse" />
        
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-3xl animate-ping" style={{ animationDuration: '2s' }} />
      </motion.div>

      {/* Loading text */}
      <motion.div
        className="absolute bottom-16 text-white/60 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        Starting Galion...
      </motion.div>
    </div>
  );
}

export default BootErrorBoundary;
