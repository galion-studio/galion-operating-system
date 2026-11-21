'use client';

/**
 * WorkspaceBootScreen - Hybrid Edition
 * 
 * Visuals: Classic Galion OS (Blue Tech Sphere + Beam)
 * UI: Westworld/Cyberpunk Text
 */

import { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Float, Stars as DreiStars, Line } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BOOT_DURATION = 8000; // Faster boot
const FADE_OUT_DURATION = 1000;

// ============================================================================
// 3D COMPONENT: CLASSIC CORE (The "Old" look)
// ============================================================================

function CentralCore({ progress }: { progress: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const sphereRef = useRef<THREE.Mesh>(null);

  // Classic Particle Cloud (Blue/White)
  const particles = useMemo(() => {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color('#00f0ff');

    for (let i = 0; i < count; i++) {
      const r = 3 + Math.random() * 0.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return { positions, colors };
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.elapsedTime;
    pointsRef.current.rotation.y = time * 0.2;

    if (sphereRef.current) {
      sphereRef.current.scale.setScalar(1 + Math.sin(time * 3) * 0.05);
    }
  });

  return (
    <group>
      {/* Wireframe Core */}
      <mesh ref={sphereRef} scale={progress}>
        <icosahedronGeometry args={[2.8, 2]} />
        <meshBasicMaterial color="#0088ff" wireframe transparent opacity={0.3} />
      </mesh>

      {/* Particle Cloud */}
      <Points ref={pointsRef} positions={particles.positions} colors={particles.colors}>
        <PointMaterial transparent vertexColors size={0.03} sizeAttenuation={true} depthWrite={false} opacity={0.6} />
      </Points>
    </group>
  );
}

// ============================================================================
// 3D COMPONENT: HORIZONTAL BEAM (The "Lines")
// ============================================================================

function EnergyBeam({ progress }: { progress: number }) {
  const beamRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!beamRef.current) return;
    // Expand/Contract beam
    beamRef.current.scale.x = 10 + Math.sin(state.clock.elapsedTime * 5) * 2;
  });

  return (
    <mesh ref={beamRef} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
      <meshBasicMaterial color="#00f0ff" transparent opacity={0.8} />
    </mesh>
  );
}

// ============================================================================
// COMPONENT: WORKSPACE BOOT SCREEN
// ============================================================================

export function WorkspaceBootScreen({ onComplete }: { onComplete?: () => void }) {
  const [progress, setProgress] = useState(0);
  const [finished, setFinished] = useState(false);

  // Audio Drone
  useEffect(() => {
    const playDrone = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        // Handle autoplay policy
        if (ctx.state === 'suspended') {
          const resume = () => {
            ctx.resume();
            document.removeEventListener('click', resume);
            document.removeEventListener('touchstart', resume);
            document.removeEventListener('keydown', resume);
          };
          document.addEventListener('click', resume);
          document.addEventListener('touchstart', resume);
          document.addEventListener('keydown', resume);
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(50, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 8);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 8);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, ctx.currentTime);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 9);
      } catch (e) { }
    };
    playDrone();
  }, []);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(1, elapsed / BOOT_DURATION);
      setProgress(p);
      if (p >= 1) {
        clearInterval(interval);
        setFinished(true);

        // CRITICAL: Clean up boot screen WebGL context BEFORE creating main canvas
        setTimeout(() => {
          // Force dispose the boot screen's WebGL context
          const bootGL = (window as any).__bootScreenGL;
          if (bootGL) {
            console.log('[BootScreen] Disposing WebGL context before workspace loads');
            try {
              bootGL.dispose();
              const ext = bootGL.getContext().getExtension('WEBGL_lose_context');
              if (ext) {
                ext.loseContext();
              }
            } catch (e) {
              console.warn('[BootScreen] Error disposing WebGL:', e);
            }
            delete (window as any).__bootScreenGL;
          }

          // Now call onComplete after cleanup
          onComplete?.();
        }, FADE_OUT_DURATION);
      }
    }, 16);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: finished ? 0 : 1 }}
      transition={{ duration: 1 }}
    >
      {/* 3D Canvas Layer - with proper cleanup */}
      {!finished && (
        <div className="absolute inset-0 pointer-events-none">
          <Canvas
            camera={{ position: [0, 0, 8], fov: 45 }}
            gl={{ antialias: true, alpha: false }}
            onCreated={({ gl }) => {
              // Store gl reference for cleanup
              (window as any).__bootScreenGL = gl;
            }}
          >
            <Suspense fallback={null}>
              <color attach="background" args={['#000000']} />
              <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
                <CentralCore progress={progress} />
              </Float>
              <EnergyBeam progress={progress} />
              <DreiStars radius={50} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
              <ambientLight intensity={0.5} />
            </Suspense>
          </Canvas>
        </div>
      )}

      {/* Scanlines & Vignette */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none z-10 opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_90%)] z-10 pointer-events-none" />

      {/* UI Layer (Westworld Style Text) */}
      <div className="relative z-20 flex flex-col items-center justify-between h-full py-20 pointer-events-none">
        {/* Top Status */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="text-center"
        >
          <div className="text-xs tracking-[0.5em] text-cyan-500/70 uppercase font-bold font-mono">
            Neural Handshake Protocol
          </div>
        </motion.div>

        {/* Center Title */}
        <motion.div className="flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9, letterSpacing: '0em', textShadow: "0 0 0px #000" }}
            animate={{
              opacity: progress > 0.3 ? 1 : 0,
              scale: 1,
              letterSpacing: '0.2em',
              textShadow: ["0 0 0px #fff", "0 0 20px #00f0ff", "0 0 10px #ff003c", "0 0 0px #fff"]
            }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="text-4xl md:text-8xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500 text-center select-none"
          >
            GALION
          </motion.h1>

          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: progress > 0.5 ? 1 : 0, y: 0 }}
            transition={{ duration: 1.5 }}
            className="mt-4 flex flex-col items-center"
          >
            <div className="h-[2px] w-[100px] bg-red-500 shadow-[0_0_10px_#ff003c] mb-3" />
            <span className="text-xs md:text-sm font-mono text-cyan-300 uppercase tracking-[0.3em] drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]">
              Westworld Edition: Cyberpunk UI
            </span>
          </motion.div>
        </motion.div>

        {/* Bottom: Progress */}
        <div className="w-80 flex flex-col gap-3">
          <div className="flex justify-between text-xs text-gray-400 font-mono uppercase tracking-widest">
            <span>Loading Core</span>
            <span className="text-cyan-400">{Math.floor(progress * 100)}%</span>
          </div>
          <div className="w-full h-[3px] bg-gray-900 rounded-full overflow-hidden border border-white/5">
            <motion.div
              className="h-full bg-cyan-500 shadow-[0_0_10px_#00f0ff]"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="text-[11px] text-gray-500 font-mono mt-1 text-center opacity-80 uppercase tracking-wider">
            {progress < 0.3 && "Initializing BIOS..."}
            {progress >= 0.3 && progress < 0.7 && "Building Neural Mesh..."}
            {progress >= 0.7 && progress < 1.0 && "Synchronizing..."}
            {progress >= 1.0 && "System Ready"}
          </div>
        </div>
      </div>

      {/* Skip Button */}
      <button
        onClick={() => { setProgress(1); }}
        className="absolute bottom-8 right-8 text-xs text-white/20 hover:text-white/60 uppercase tracking-widest transition-colors z-30 pointer-events-auto font-mono"
      >
        [ SPACE TO SKIP ]
      </button>
    </motion.div>
  );
}

export default WorkspaceBootScreen;
