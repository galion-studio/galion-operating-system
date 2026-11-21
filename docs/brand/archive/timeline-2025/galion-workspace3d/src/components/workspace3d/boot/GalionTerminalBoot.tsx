'use client';

/**
 * GalionTerminalBoot.tsx - Cyberpunk Terminal Boot Screen
 * 
 * A high-tech, HDR-heavy boot sequence that replaces the Orb animation
 * with a terminal/matrix style initialization process.
 * 
 * Features:
 * - HDR Horizontal Scan Lines (Bloom effect)
 * - "GALION OS" Glowing Holographic Title
 * - System Status Log (Typewriter style)
 * - Progress Bar with Percentage
 * - CRT/Scanline Vignette Overlay
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

export interface GalionTerminalBootProps {
    onComplete?: () => void;
    speedMultiplier?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BOOT_DURATION = 6000; // 6 seconds total
const TOTAL_STEPS = 100;

const SYSTEM_LOGS = [
    { p: 5, text: "Initializing BIOS..." },
    { p: 15, text: "Verifying secure boot handshake..." },
    { p: 25, text: "Loading neural mesh..." },
    { p: 35, text: "Mounting file system /dev/galion..." },
    { p: 45, text: "Starting voice pipeline service..." },
    { p: 60, text: "Connecting to Grokopedia knowledge base..." },
    { p: 75, text: "Calibrating 3D workspace environment..." },
    { p: 85, text: "Synchronizing user preferences..." },
    { p: 95, text: "System ready. Welcome." },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function GalionTerminalBoot({ onComplete, speedMultiplier = 1 }: GalionTerminalBootProps) {
    const [progress, setProgress] = useState(0);
    const [currentLog, setCurrentLog] = useState("");
    const [showContent, setShowContent] = useState(false);
    const [scanLineY, setScanLineY] = useState(0);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Animation loop
    useEffect(() => {
        // Start after slight delay
        const startTimeout = setTimeout(() => setShowContent(true), 500);

        // Progress timer
        const startTime = Date.now();
        const duration = BOOT_DURATION / speedMultiplier;

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const p = Math.min(100, (elapsed / duration) * 100);

            setProgress(p);

            // Update log based on progress
            const logEntry = SYSTEM_LOGS.find(log => p >= log.p && p < log.p + 10);
            if (logEntry) {
                setCurrentLog(logEntry.text);
            }

            if (p >= 100) {
                clearInterval(interval);
                setTimeout(() => onComplete?.(), 800); // Small delay at 100% before finish
            }
        }, 16);

        // Scanline animation loop
        const scanLoop = setInterval(() => {
            setScanLineY(prev => (prev + 2) % 100);
        }, 20);

        return () => {
            clearTimeout(startTimeout);
            clearInterval(interval);
            clearInterval(scanLoop);
            // Only close AudioContext if it exists and is not already closed
            const ctx = audioContextRef.current;
            if (ctx && ctx.state !== 'closed') {
                ctx.close().catch(() => { });
            }
            audioContextRef.current = null; // Prevent double-close
        };
    }, [onComplete, speedMultiplier]);

    // Audio Drone (High-tech hum) - Silently fails if no user gesture
    useEffect(() => {
        const duration = BOOT_DURATION / speedMultiplier;
        let localCtx: AudioContext | null = null;

        const playSound = async () => {
            try {
                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                if (!AudioCtx) return;

                const ctx = new AudioCtx();
                localCtx = ctx;
                audioContextRef.current = ctx;

                // Resume if suspended (browser autoplay policy)
                if (ctx.state === 'suspended') {
                    await ctx.resume().catch(() => { });
                }

                // Low drone
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(60, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + duration / 1000);

                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration / 1000);

                // Filter for nicer sound
                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(400, ctx.currentTime);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);

                osc.start();
                osc.stop(ctx.currentTime + duration / 1000 + 1);
            } catch {
                // Silently fail - audio is optional for boot screen
            }
        };

        playSound();

        return () => {
            // Cleanup audio context created by this effect
            if (localCtx && localCtx.state !== 'closed') {
                localCtx.close().catch(() => { });
            }
        };
    }, [speedMultiplier]);

    return (
        <div className="fixed inset-0 bg-black z-[9999] overflow-hidden flex flex-col items-center justify-center font-mono select-none">

            {/* Background Grid (Subtle) */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            {/* CRT Vignette & Scanlines Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none z-20" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] pointer-events-none z-20" />

            <AnimatePresence>
                {showContent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative z-30 w-full max-w-4xl flex flex-col items-center gap-12 p-8"
                    >
                        {/* Top HDR Line */}
                        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent shadow-[0_0_20px_#00ffff]" />

                        {/* Main Content Container */}
                        <div className="flex flex-col items-center gap-8 w-full">

                            {/* GALION OS Title - HDR Glow */}
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="relative"
                            >
                                <h1 className="text-6xl md:text-8xl font-black tracking-[0.2em] text-white text-center">
                                    GALION
                                    <span className="text-cyan-500 ml-4 drop-shadow-[0_0_15px_rgba(0,255,255,0.8)]">OS</span>
                                </h1>
                                <div className="absolute -inset-4 bg-cyan-500/10 blur-xl rounded-full opacity-50 animate-pulse" />
                                <p className="text-center text-cyan-400/60 tracking-[0.5em] text-sm mt-4 uppercase">
                                    Hyper-Intelligent Workspace Environment
                                </p>
                            </motion.div>

                            {/* Progress Bar Container */}
                            <div className="w-full max-w-lg mt-8 relative group">
                                <div className="flex justify-between text-xs text-cyan-500/70 mb-2 uppercase tracking-widest">
                                    <span>System Initialization</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>

                                {/* Bar Background */}
                                <div className="w-full h-2 bg-gray-900 border border-cyan-900/50 rounded-sm overflow-hidden relative">
                                    {/* Grid Pattern in Bar */}
                                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_2px,rgba(0,0,0,0.8)_2px)] bg-[size:10px_100%] z-10 opacity-30" />

                                    {/* Fill */}
                                    <motion.div
                                        className="h-full bg-cyan-400 shadow-[0_0_15px_#00ffff] relative"
                                        style={{ width: `${progress}%` }}
                                    >
                                        {/* Leading Edge Highlight */}
                                        <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-white shadow-[0_0_10px_#ffffff]" />
                                    </motion.div>
                                </div>
                            </div>

                            {/* Terminal Log */}
                            <div className="h-12 flex flex-col items-center justify-center">
                                <motion.div
                                    key={currentLog}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 text-cyan-300 font-mono text-sm md:text-base"
                                >
                                    <span className="text-cyan-600 mr-2">{">"}</span>
                                    {currentLog}
                                    <span className="w-2 h-4 bg-cyan-400 animate-pulse ml-1 inline-block align-middle" />
                                </motion.div>
                            </div>

                        </div>

                        {/* Bottom HDR Line */}
                        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent shadow-[0_0_20px_#a855f7]" />

                        {/* Footer Status */}
                        <div className="absolute bottom-8 text-[10px] text-cyan-900/50 uppercase tracking-[0.3em] flex gap-8">
                            <span>Kernel v5.2.0</span>
                            <span>Secure Boot: Enabled</span>
                            <span>Mem: 64TB OK</span>
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>

            {/* Skip Button (Bottom Right) */}
            <motion.button
                whileHover={{ scale: 1.05, color: '#fff' }}
                onClick={() => { setProgress(100); setTimeout(() => onComplete?.(), 100); }}
                className="absolute bottom-10 right-10 text-xs text-white/20 uppercase tracking-widest font-mono z-50 hover:text-cyan-400 transition-colors"
            >
                [ SPACE TO SKIP ]
            </motion.button>
        </div>
    );
}

export default GalionTerminalBoot;
