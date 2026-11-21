"use client";

import { motion } from "framer-motion";
import { Pin, PinOff, Sparkles, X, Maximize2 } from "lucide-react";
import dynamic from "next/dynamic";
import React, { Suspense } from "react";
// Import V5 types
import type { Emotion, OrbState } from "@/components/workspace3d/orb/v5";

// V5 Orb (Has its own Canvas)
const GalionOrbV5 = dynamic(
    () => import("@/components/workspace3d/orb/v5").then((mod) => mod.GalionOrbV5),
    { ssr: false }
);

interface OrbWindowProps {
    onClose: () => void;
    isPinned?: boolean;
    onTogglePin?: () => void;
    onHeaderPointerDown?: (e: React.PointerEvent) => void;
    className?: string;
    emotion?: Emotion;
    state?: OrbState;
    onStateChange?: (state: OrbState) => void;
}

export function OrbWindow({
    onClose,
    isPinned = false,
    onTogglePin,
    onHeaderPointerDown,
    className = "",
    emotion = "neutral",
    state = "idle",
    onStateChange,
}: OrbWindowProps) {
    return (
        <div
            className={`fixed top-20 right-4 md:right-20 w-[calc(100vw-32px)] md:w-[300px] h-[350px] z-30 bg-black/70 backdrop-blur-2xl rounded-2xl border border-cyan-500/30 shadow-2xl overflow-hidden flex flex-col ${className}`}
        >
            {/* Header */}
            <div
                onPointerDown={onHeaderPointerDown}
                className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-linear-to-r from-cyan-500/10 via-blue-500/10 to-cyan-500/10 cursor-grab active:cursor-grabbing touch-none"
            >
                <div className="flex items-center gap-2 pointer-events-none">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <h3 className="text-white font-bold text-sm tracking-wide">Galion AI</h3>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
                    {onTogglePin && (
                        <button
                            onClick={onTogglePin}
                            title={isPinned ? "Unpin" : "Pin"}
                            className={`p-1.5 rounded-lg transition-colors ${isPinned
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                : "hover:bg-white/10 text-white/50 hover:text-white"
                                }`}
                        >
                            {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                        </button>
                    )}

                    {/* Resize Button Removed for Simplicity */}

                    <button
                        onClick={onClose}
                        title="Close"
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content - V5 Orb */}
            <div className="flex-1 relative bg-black/20">
                <Suspense
                    fallback={
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                        </div>
                    }
                >
                    {/* GalionOrbV5 fills parent */}
                    <GalionOrbV5
                        initialState={state}
                        state={state}
                        initialEmotion={emotion}
                        emotion={emotion}
                        onStateChange={onStateChange}
                        quality="high" // Increased quality
                        audioEnabled={true} // Enable audio reactivity
                        size={2.2}
                    />
                </Suspense>

                {/* Overlay info */}
                <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none z-10">
                    <p className="text-xs text-cyan-400 font-medium uppercase tracking-widest drop-shadow-md">
                        {state}
                    </p>
                </div>
            </div>
        </div>
    );
}
