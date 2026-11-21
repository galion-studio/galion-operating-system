'use client';

/**
 * PremiumBootScreen - 2.4s Production-Grade Animation
 * 
 * Visuals: Clean Pastel Aurora Background, Sharp Typography.
 * Vibe: Premium, Adobe-like, Universal Design.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GalionLogger } from "@/utils/logger";

// ============================================================================
// CONFIGURATION
// ============================================================================

const BOOT_DURATION = 2400; // Exact 2.4s
const TRANSITION_DURATION = 0.8; // Smooth fade out

// ============================================================================
// COMPONENT: PREMIUM BOOT SCREEN
// ============================================================================

export default function PremiumBootScreen({ onComplete }: { onComplete?: () => void }) {
    const [progress, setProgress] = useState(0);
    const [finished, setFinished] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);

    const steps = [
        "Initializing...",
        "Loading Libraries...",
        "Optimizing Assets...",
        "System Ready"
    ];



    useEffect(() => {
        const startTime = Date.now();
        let lastStep = 0; // Local state for this specific interval instance

        // Prevent duplicate init logs
        if (loadingStep === 0 && progress === 0) {
            GalionLogger.info("SYSTEM", "Boot Sequence Initiated");
        }

        // Progress Loop
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const rawProgress = Math.min(1, elapsed / BOOT_DURATION);

            // Add a slight ease-out curve to the progress number for visual smoothness
            const easedProgress = 1 - Math.pow(1 - rawProgress, 3);

            setProgress(easedProgress);

            // Update steps based on progress
            // Use local variable to ensure we only log ONCE per step transition
            if (rawProgress < 0.25) {
                if (lastStep !== 0) {
                    lastStep = 0;
                    setLoadingStep(0);
                    GalionLogger.debug("SYSTEM", "Boot: Initializing...");
                }
            }
            else if (rawProgress < 0.6) {
                if (lastStep !== 1) {
                    lastStep = 1;
                    setLoadingStep(1);
                    GalionLogger.debug("SYSTEM", "Boot: Loading Libraries...");
                }
            }
            else if (rawProgress < 0.9) {
                if (lastStep !== 2) {
                    lastStep = 2;
                    setLoadingStep(2);
                    GalionLogger.debug("SYSTEM", "Boot: Optimizing Assets...");
                }
            }
            else {
                if (lastStep !== 3) {
                    lastStep = 3;
                    setLoadingStep(3);
                }
            }

            if (rawProgress >= 1) {
                clearInterval(interval);
                setFinished(true);
                GalionLogger.success("SYSTEM", "Boot Sequence Complete - System Ready");

                // Wait for exit animation
                setTimeout(() => {
                    // Cleanup logic if needed
                    onComplete?.();
                }, TRANSITION_DURATION * 1000);
            }
        }, 16);

        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <AnimatePresence>
            {!finished && (
                <motion.div
                    key="boot-screen"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden font-sans bg-[#0a0a0a]"
                >
                    {/* Background: Animated Pastel Aurora */}
                    <motion.div
                        className="absolute inset-0 z-0 opacity-40"
                        animate={{
                            background: [
                                "radial-gradient(circle at 0% 0%, #FFB3BA 0%, transparent 50%), radial-gradient(circle at 100% 0%, #BAE1FF 0%, transparent 50%), radial-gradient(circle at 100% 100%, #FFFFBA 0%, transparent 50%), radial-gradient(circle at 0% 100%, #BAFFC9 0%, transparent 50%)",
                                "radial-gradient(circle at 0% 0%, #BAE1FF 0%, transparent 50%), radial-gradient(circle at 100% 0%, #FFFFBA 0%, transparent 50%), radial-gradient(circle at 100% 100%, #BAFFC9 0%, transparent 50%), radial-gradient(circle at 0% 100%, #FFB3BA 0%, transparent 50%)",
                                "radial-gradient(circle at 0% 0%, #FFFFBA 0%, transparent 50%), radial-gradient(circle at 100% 0%, #BAFFC9 0%, transparent 50%), radial-gradient(circle at 100% 100%, #FFB3BA 0%, transparent 50%), radial-gradient(circle at 0% 100%, #BAE1FF 0%, transparent 50%)",
                            ]
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            repeatType: "mirror",
                            ease: "easeInOut"
                        }}
                    />

                    {/* Vignette & Texture Overlay for Premium Feel */}
                    <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_0%,#0a0a0a_90%)] pointer-events-none" />
                    <div className="absolute inset-0 z-10 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-overlay" />

                    {/* Content Layer */}
                    <div className="relative z-20 flex flex-col items-center justify-center w-full max-w-4xl px-8">

                        {/* Main Title Group */}
                        <div className="flex flex-col items-center gap-2 mb-12">
                            <motion.h1
                                initial={{ opacity: 0, y: 20, letterSpacing: "-0.05em" }}
                                animate={{ opacity: 1, y: 0, letterSpacing: "-0.02em" }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-400 tracking-tighter"
                                style={{ fontFamily: "'Inter', sans-serif" }}
                            >
                                WS3D
                            </motion.h1>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.8 }}
                                className="flex flex-col items-center"
                            >
                                <span className="text-xl md:text-2xl text-gray-300 font-medium tracking-wide">
                                    Workspace3D
                                </span>
                                <span className="text-sm text-cyan-200/60 font-medium tracking-widest mt-1 uppercase">
                                    Galion Ecosystem
                                </span>
                            </motion.div>
                        </div>

                        {/* Loading UI */}
                        <div className="w-full max-w-sm flex flex-col gap-2">
                            {/* Status Text & Percentage */}
                            <div className="flex justify-between items-end text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <span className="text-gray-400">{steps[loadingStep]}</span>
                                <span>{Math.floor(progress * 100)}%</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-[2px] bg-gray-800 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-[#FFB3BA] via-[#BAE1FF] to-[#FFFFBA]"
                                    style={{ width: `${progress * 100}%` }}
                                    layoutId="progress-bar"
                                />
                            </div>
                        </div>

                    </div>

                    {/* Footer / Copyright */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        transition={{ delay: 0.5 }}
                        className="absolute bottom-6 text-[10px] text-gray-500 uppercase tracking-[0.2em]"
                    >
                        © 2025 Galion Studios • Universal 3D
                    </motion.div>

                </motion.div>
            )}
        </AnimatePresence>
    );
}
