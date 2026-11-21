'use client';

/**
 * OrbTouchControls.tsx - Touch Interactions for Mobile
 * 
 * Implements touch gestures for the mobile orb experience:
 * - Tap orb: Toggle listening mode
 * - Long press: Open quick settings
 * - Swipe left/right: Change personality/mode
 * - Pinch: Zoom (if camera enabled)
 * - Double tap: Reset camera to home
 * 
 * This is an overlay component that wraps the 3D canvas.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface TouchGesture {
  type: 'tap' | 'doubleTap' | 'longPress' | 'swipeLeft' | 'swipeRight' | 'swipeUp' | 'swipeDown' | 'pinch';
  position?: { x: number; y: number };
  delta?: { x: number; y: number };
  scale?: number;
}

export interface OrbTouchControlsProps {
  /** Children (usually the 3D canvas) */
  children: React.ReactNode;
  /** Callback on tap */
  onTap?: (position: { x: number; y: number }) => void;
  /** Callback on double tap */
  onDoubleTap?: (position: { x: number; y: number }) => void;
  /** Callback on long press */
  onLongPress?: (position: { x: number; y: number }) => void;
  /** Callback on swipe */
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down', delta: { x: number; y: number }) => void;
  /** Callback on pinch */
  onPinch?: (scale: number) => void;
  /** Enable/disable touch controls */
  enabled?: boolean;
  /** Long press threshold in ms */
  longPressThreshold?: number;
  /** Swipe threshold in pixels */
  swipeThreshold?: number;
  /** Double tap timeout in ms */
  doubleTapTimeout?: number;
  /** Show touch feedback */
  showFeedback?: boolean;
}

// ============================================================================
// TOUCH STATE
// ============================================================================

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  touches: number;
  initialPinchDistance: number;
}

// ============================================================================
// TOUCH FEEDBACK COMPONENT
// ============================================================================

interface TouchFeedbackProps {
  x: number;
  y: number;
  visible: boolean;
  type: 'tap' | 'longPress' | 'swipe';
}

function TouchFeedback({ x, y, visible, type }: TouchFeedbackProps) {
  if (!visible) return null;
  
  const size = type === 'tap' ? 40 : type === 'longPress' ? 60 : 30;
  const color = type === 'tap' ? '#06b6d4' : type === 'longPress' ? '#8b5cf6' : '#10b981';
  
  return (
    <div
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: '50%',
        border: `2px solid ${color}`,
        backgroundColor: `${color}20`,
        pointerEvents: 'none',
        animation: 'touchFeedbackPulse 0.3s ease-out forwards',
        zIndex: 1000,
      }}
    />
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OrbTouchControls({
  children,
  onTap,
  onDoubleTap,
  onLongPress,
  onSwipe,
  onPinch,
  enabled = true,
  longPressThreshold = 500,
  swipeThreshold = 50,
  doubleTapTimeout = 300,
  showFeedback = true,
}: OrbTouchControlsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStateRef = useRef<TouchState | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout>();
  const lastTapTimeRef = useRef(0);
  const lastTapPositionRef = useRef({ x: 0, y: 0 });
  
  // Feedback state
  const [feedback, setFeedback] = useState<{
    visible: boolean;
    x: number;
    y: number;
    type: 'tap' | 'longPress' | 'swipe';
  }>({ visible: false, x: 0, y: 0, type: 'tap' });
  
  // Show touch feedback
  const showTouchFeedback = useCallback((x: number, y: number, type: 'tap' | 'longPress' | 'swipe') => {
    if (!showFeedback) return;
    
    setFeedback({ visible: true, x, y, type });
    setTimeout(() => setFeedback(prev => ({ ...prev, visible: false })), 300);
  }, [showFeedback]);
  
  // Get touch position relative to container
  const getTouchPosition = useCallback((touch: React.Touch) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  }, []);
  
  // Calculate pinch distance
  const getPinchDistance = useCallback((touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);
  
  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    
    const touch = e.touches[0];
    const pos = getTouchPosition(touch);
    
    touchStateRef.current = {
      startX: pos.x,
      startY: pos.y,
      startTime: Date.now(),
      touches: e.touches.length,
      initialPinchDistance: e.touches.length >= 2 ? getPinchDistance(e.touches) : 0,
    };
    
    // Start long press timer
    longPressTimerRef.current = setTimeout(() => {
      if (touchStateRef.current) {
        showTouchFeedback(pos.x, pos.y, 'longPress');
        onLongPress?.(pos);
        touchStateRef.current = null; // Consume the touch
      }
    }, longPressThreshold);
  }, [enabled, getTouchPosition, getPinchDistance, longPressThreshold, onLongPress, showTouchFeedback]);
  
  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled || !touchStateRef.current) return;
    
    const state = touchStateRef.current;
    
    // Cancel long press on move
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    
    // Handle pinch
    if (e.touches.length >= 2 && state.initialPinchDistance > 0) {
      const currentDistance = getPinchDistance(e.touches);
      const scale = currentDistance / state.initialPinchDistance;
      onPinch?.(scale);
      return;
    }
    
    // Check for swipe
    const touch = e.touches[0];
    const pos = getTouchPosition(touch);
    const deltaX = pos.x - state.startX;
    const deltaY = pos.y - state.startY;
    
    if (Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold) {
      // Determine swipe direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        const direction = deltaX > 0 ? 'right' : 'left';
        showTouchFeedback(pos.x, pos.y, 'swipe');
        onSwipe?.(direction, { x: deltaX, y: deltaY });
      } else {
        // Vertical swipe
        const direction = deltaY > 0 ? 'down' : 'up';
        showTouchFeedback(pos.x, pos.y, 'swipe');
        onSwipe?.(direction, { x: deltaX, y: deltaY });
      }
      
      touchStateRef.current = null; // Consume the touch
    }
  }, [enabled, getTouchPosition, getPinchDistance, swipeThreshold, onPinch, onSwipe, showTouchFeedback]);
  
  // Handle touch end
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    
    // Cancel long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    
    const state = touchStateRef.current;
    if (!state) return;
    
    const touchDuration = Date.now() - state.startTime;
    const pos = { x: state.startX, y: state.startY };
    
    // Check for tap (short duration, minimal movement)
    if (touchDuration < 200) {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTimeRef.current;
      const distanceFromLastTap = Math.sqrt(
        Math.pow(pos.x - lastTapPositionRef.current.x, 2) +
        Math.pow(pos.y - lastTapPositionRef.current.y, 2)
      );
      
      // Check for double tap
      if (timeSinceLastTap < doubleTapTimeout && distanceFromLastTap < 30) {
        showTouchFeedback(pos.x, pos.y, 'tap');
        onDoubleTap?.(pos);
        lastTapTimeRef.current = 0; // Reset
      } else {
        // Single tap
        showTouchFeedback(pos.x, pos.y, 'tap');
        onTap?.(pos);
        lastTapTimeRef.current = now;
        lastTapPositionRef.current = pos;
      }
    }
    
    touchStateRef.current = null;
  }, [enabled, doubleTapTimeout, onTap, onDoubleTap, showTouchFeedback]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);
  
  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        touchAction: 'none', // Disable browser touch handling
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
      
      {/* Touch feedback */}
      <TouchFeedback {...feedback} />
      
      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes touchFeedbackPulse {
          0% {
            transform: scale(0.5);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// HOOK FOR TOUCH GESTURE STATE
// ============================================================================

export interface UseTouchGesturesOptions {
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export function useTouchGestures(options: UseTouchGesturesOptions) {
  const handleTap = useCallback(() => {
    options.onTap?.();
  }, [options]);
  
  const handleDoubleTap = useCallback(() => {
    options.onDoubleTap?.();
  }, [options]);
  
  const handleLongPress = useCallback(() => {
    options.onLongPress?.();
  }, [options]);
  
  const handleSwipe = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (direction === 'left') options.onSwipeLeft?.();
    if (direction === 'right') options.onSwipeRight?.();
  }, [options]);
  
  return {
    onTap: handleTap,
    onDoubleTap: handleDoubleTap,
    onLongPress: handleLongPress,
    onSwipe: handleSwipe,
  };
}

export default OrbTouchControls;

