'use client';

/**
 * GalionOS Boot V2 - Ultra Fast Beta Boot Screen
 * 
 * Design:
 * - Fast boot (<1s)
 * - Minimal: Just the GalionOS wordmark with spinning loader
 * - Professional, clean aesthetic
 * - No forms, pure system boot feel
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GalionOSBootV2Props {
    onComplete: () => void;
    /** Boot duration in ms (default: 800ms) */
    duration?: number;
}

export function GalionOSBootV2({ onComplete, duration = 800 }: GalionOSBootV2Props) {
    const [phase, setPhase] = useState<'booting' | 'complete'>('booting');

    useEffect(() => {
        // Fast boot - just show branding briefly
        const timer = setTimeout(() => {
            setPhase('complete');
            setTimeout(onComplete, 200); // Small delay for exit animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onComplete]);

    return (
        <AnimatePresence onExitComplete={onComplete}>
            {phase === 'booting' && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Centered GalionOS wordmark */}
                    <motion.div
                        className="flex flex-col items-center gap-6"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                    >
                        {/* Logo/Wordmark */}
                        <div className="text-center">
                            <h1
                                className="text-3xl font-light tracking-[0.25em] text-white"
                                style={{ fontFamily: '-apple-system, system-ui, sans-serif' }}
                            >
                                GALION
                            </h1>
                            <p
                                className="text-xs tracking-[0.3em] text-white/50 mt-1"
                                style={{ fontFamily: '-apple-system, system-ui, sans-serif' }}
                            >
                                OS
                            </p>
                        </div>

                        {/* Spinning loader ring */}
                        <div className="relative w-8 h-8">
                            {/* Outer spinning ring */}
                            <motion.div
                                className="absolute inset-0 rounded-full"
                                style={{
                                    border: '2px solid transparent',
                                    borderTopColor: 'rgba(59, 130, 246, 0.8)',
                                    borderRightColor: 'rgba(139, 92, 246, 0.4)',
                                }}
                                animate={{ rotate: 360 }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: 'linear',
                                }}
                            />

                            {/* Inner subtle glow */}
                            <motion.div
                                className="absolute inset-2 rounded-full"
                                style={{
                                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                                }}
                                animate={{
                                    opacity: [0.3, 0.6, 0.3],
                                    scale: [0.95, 1.05, 0.95]
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            />
                        </div>
                    </motion.div>

                    {/* Subtle bottom text */}
                    <motion.p
                        className="absolute bottom-8 text-[10px] tracking-[0.2em] text-white/30"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        style={{ fontFamily: '-apple-system, system-ui, sans-serif' }}
                    >
                        BETA
                    </motion.p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default GalionOSBootV2;
