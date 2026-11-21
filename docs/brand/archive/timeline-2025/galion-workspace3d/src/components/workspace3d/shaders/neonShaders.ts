/**
 * Neon Glow Shaders - Lightweight GPU-based glow effects
 * 
 * Custom shader materials for neon wireframe aesthetics.
 * All glow effects are computed in the shader (no post-processing needed).
 * 
 * Performance optimizations:
 * - Single pass rendering (no bloom post-process)
 * - Shared uniforms across instances
 * - Simple math operations
 */

import * as THREE from 'three';

// ============================================================================
// SHARED UNIFORMS
// ============================================================================

export const sharedUniforms = {
  uTime: { value: 0 },
  uPulseSpeed: { value: 1.0 },
  uPulseIntensity: { value: 0.3 },
};

// Update time uniform - call once per frame
export function updateShaderTime(time: number) {
  sharedUniforms.uTime.value = time;
}

// ============================================================================
// NEON EDGE MATERIAL - For wireframe/edge rendering
// ============================================================================

export const neonEdgeVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const neonEdgeFragmentShader = `
  uniform vec3 uColor;
  uniform vec3 uGlowColor;
  uniform float uTime;
  uniform float uPulseSpeed;
  uniform float uPulseIntensity;
  uniform float uOpacity;
  uniform float uGlowStrength;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  void main() {
    // Pulsing glow effect
    float pulse = sin(uTime * uPulseSpeed) * 0.5 + 0.5;
    float glowIntensity = uGlowStrength + pulse * uPulseIntensity;
    
    // Edge glow based on view angle (fresnel-like)
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float edgeFactor = 1.0 - abs(dot(viewDir, vNormal));
    edgeFactor = pow(edgeFactor, 2.0);
    
    // Combine base color with glow
    vec3 finalColor = mix(uColor, uGlowColor, edgeFactor * glowIntensity);
    
    // Add bloom simulation (brighten core)
    finalColor += uGlowColor * glowIntensity * 0.5;
    
    gl_FragColor = vec4(finalColor, uOpacity);
  }
`;

export function createNeonEdgeMaterial(options: {
  color?: string;
  glowColor?: string;
  opacity?: number;
  glowStrength?: number;
}) {
  const {
    color = '#00d4ff',
    glowColor = '#00aaff',
    opacity = 1.0,
    glowStrength = 1.0,
  } = options;

  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uGlowColor: { value: new THREE.Color(glowColor) },
      uTime: sharedUniforms.uTime,
      uPulseSpeed: sharedUniforms.uPulseSpeed,
      uPulseIntensity: sharedUniforms.uPulseIntensity,
      uOpacity: { value: opacity },
      uGlowStrength: { value: glowStrength },
    },
    vertexShader: neonEdgeVertexShader,
    fragmentShader: neonEdgeFragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

// ============================================================================
// NEON CORE MATERIAL - For inner glow spheres
// ============================================================================

export const neonCoreFragmentShader = `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uPulseSpeed;
  uniform float uIntensity;
  
  varying vec2 vUv;
  
  void main() {
    // Radial gradient from center
    vec2 center = vUv - 0.5;
    float dist = length(center) * 2.0;
    
    // Soft edge falloff
    float alpha = 1.0 - smoothstep(0.0, 1.0, dist);
    alpha = pow(alpha, 1.5);
    
    // Pulsing
    float pulse = sin(uTime * uPulseSpeed) * 0.5 + 0.5;
    float intensity = uIntensity + pulse * 0.3;
    
    vec3 finalColor = uColor * intensity;
    
    gl_FragColor = vec4(finalColor, alpha * 0.6);
  }
`;

export function createNeonCoreMaterial(color: string = '#00d4ff') {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uTime: sharedUniforms.uTime,
      uPulseSpeed: sharedUniforms.uPulseSpeed,
      uIntensity: { value: 1.5 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: neonCoreFragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

// ============================================================================
// ENERGY FLOW MATERIAL - For animated connection lines
// ============================================================================

export const energyFlowFragmentShader = `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uDashSize;
  uniform float uGapSize;
  
  varying float vLineDistance;
  
  void main() {
    // Animated dashes
    float dashPattern = mod(vLineDistance - uTime * uSpeed, uDashSize + uGapSize);
    float alpha = step(dashPattern, uDashSize);
    
    // Glow falloff at dash edges
    float edgeFade = smoothstep(0.0, uDashSize * 0.3, dashPattern) * 
                     smoothstep(uDashSize, uDashSize * 0.7, dashPattern);
    
    vec3 finalColor = uColor * (1.0 + edgeFade * 0.5);
    
    gl_FragColor = vec4(finalColor, alpha * 0.8);
  }
`;

export function createEnergyFlowMaterial(color: string = '#00d4ff') {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uTime: sharedUniforms.uTime,
      uSpeed: { value: 2.0 },
      uDashSize: { value: 0.5 },
      uGapSize: { value: 0.3 },
    },
    vertexShader: `
      attribute float lineDistance;
      varying float vLineDistance;
      
      void main() {
        vLineDistance = lineDistance;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: energyFlowFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

// ============================================================================
// PARTICLE MATERIAL - For instanced particles
// ============================================================================

export const particleVertexShader = `
  attribute float aScale;
  attribute float aPhase;
  
  uniform float uTime;
  uniform float uSize;
  
  varying float vAlpha;
  
  void main() {
    // Floating animation
    vec3 pos = position;
    pos.y += sin(uTime + aPhase) * 0.2;
    pos.x += cos(uTime * 0.5 + aPhase) * 0.1;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Size attenuation
    gl_PointSize = uSize * aScale * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
    
    // Fade based on phase for twinkling
    vAlpha = 0.3 + sin(uTime * 2.0 + aPhase * 6.28) * 0.3;
  }
`;

export const particleFragmentShader = `
  uniform vec3 uColor;
  
  varying float vAlpha;
  
  void main() {
    // Circular particle with soft edge
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
    
    gl_FragColor = vec4(uColor, alpha * vAlpha);
  }
`;

export function createParticleMaterial(color: string = '#00d4ff') {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uTime: sharedUniforms.uTime,
      uSize: { value: 8.0 },
    },
    vertexShader: particleVertexShader,
    fragmentShader: particleFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

// ============================================================================
// CATEGORY COLORS - Consistent neon palette
// ============================================================================

export const NEON_COLORS = {
  frontend: { base: '#00d4ff', glow: '#00aaff' },    // Cyan
  backend: { base: '#ff6b35', glow: '#ff4500' },     // Orange
  database: { base: '#a855f7', glow: '#9333ea' },    // Purple
  documentation: { base: '#22c55e', glow: '#16a34a' }, // Green
  config: { base: '#eab308', glow: '#ca8a04' },      // Yellow
  infrastructure: { base: '#ef4444', glow: '#dc2626' }, // Red
  api: { base: '#06b6d4', glow: '#0891b2' },         // Teal
  other: { base: '#6b7280', glow: '#4b5563' },       // Gray
};

export function getNeonColor(category: string): { base: string; glow: string } {
  return NEON_COLORS[category as keyof typeof NEON_COLORS] || NEON_COLORS.other;
}

