/**
 * orbDepthShaders.ts - Custom GLSL Shaders for Volumetric Depth Effects
 * 
 * Collection of shader code for creating god-like depth in the orb:
 * - Volumetric nebula shader
 * - Fresnel glass shader
 * - Core glow shader
 * - Energy stream shader
 * 
 * These can be used with THREE.ShaderMaterial for advanced effects
 */

// ============================================================================
// VOLUMETRIC NEBULA SHADER
// Creates swirling cloud-like effect inside the orb
// ============================================================================

export const volumetricNebulaVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const volumetricNebulaFragmentShader = `
  uniform vec3 innerColor;
  uniform vec3 outerColor;
  uniform float time;
  uniform float opacity;
  uniform float noiseScale;
  uniform float rotationSpeed;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  
  // Simplex-like noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  // Fractal Brownian Motion
  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 4; i++) {
      value += amplitude * snoise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    
    return value;
  }
  
  void main() {
    // Rotate position for animation
    float angle = time * rotationSpeed;
    mat3 rotY = mat3(
      cos(angle), 0.0, sin(angle),
      0.0, 1.0, 0.0,
      -sin(angle), 0.0, cos(angle)
    );
    
    vec3 rotatedPos = rotY * vPosition;
    
    // Generate cloud noise
    float noise = fbm(rotatedPos * noiseScale + time * 0.1);
    noise = noise * 0.5 + 0.5; // Normalize to 0-1
    
    // Distance from center for gradient
    float dist = length(vPosition);
    float gradient = smoothstep(0.0, 1.0, dist);
    
    // Mix colors based on distance and noise
    vec3 color = mix(innerColor, outerColor, gradient * noise);
    
    // Fresnel for edge fade
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.0);
    
    // Final alpha with fresnel fade
    float alpha = opacity * (0.2 + fresnel * 0.8) * (1.0 - dist * 0.3);
    alpha *= noise;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// ============================================================================
// CORE GLOW SHADER
// Creates the bright central singularity effect
// ============================================================================

export const coreGlowVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const coreGlowFragmentShader = `
  uniform vec3 coreColor;
  uniform vec3 glowColor;
  uniform float time;
  uniform float intensity;
  uniform float pulseSpeed;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  
  void main() {
    // Distance from center
    float dist = length(vPosition);
    
    // Core brightness (inverse square falloff)
    float coreBrightness = 1.0 / (dist * dist + 0.1);
    coreBrightness = clamp(coreBrightness, 0.0, 1.0);
    
    // Pulsing
    float pulse = sin(time * pulseSpeed) * 0.3 + 0.7;
    coreBrightness *= pulse;
    
    // Fresnel glow
    float fresnel = pow(1.0 - abs(dot(vViewDir, vNormal)), 3.0);
    
    // Mix core and glow colors
    vec3 color = mix(coreColor, glowColor, fresnel);
    color *= coreBrightness * intensity;
    
    // Add white hot center
    color += vec3(1.0) * pow(coreBrightness, 4.0) * 0.5;
    
    float alpha = (coreBrightness + fresnel * 0.5) * intensity;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// ============================================================================
// ENERGY STREAM SHADER  
// Flowing particle river effect
// ============================================================================

export const energyStreamVertexShader = `
  attribute float progress;
  attribute float speed;
  
  varying float vProgress;
  varying float vSpeed;
  varying vec3 vColor;
  
  uniform float time;
  uniform vec3 startColor;
  uniform vec3 endColor;
  uniform float flowDirection; // 1.0 = inward, -1.0 = outward
  
  void main() {
    // Update progress
    float t = mod(progress + time * speed * flowDirection, 1.0);
    vProgress = t;
    vSpeed = speed;
    
    // Color gradient along stream
    vColor = mix(startColor, endColor, t);
    
    // Scale point size based on progress
    float size = 2.0 + (1.0 - t) * 4.0; // Larger at start
    gl_PointSize = size;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const energyStreamFragmentShader = `
  varying float vProgress;
  varying float vSpeed;
  varying vec3 vColor;
  
  uniform float opacity;
  
  void main() {
    // Circular point
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    if (dist > 0.5) discard;
    
    // Soft edge
    float alpha = smoothstep(0.5, 0.0, dist);
    
    // Fade based on progress (fade out near end)
    alpha *= 1.0 - vProgress * 0.5;
    alpha *= opacity;
    
    // Glow effect
    vec3 color = vColor + vec3(1.0) * pow(1.0 - dist * 2.0, 4.0) * 0.3;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// ============================================================================
// SYNAPSE PULSE SHADER
// Neural network connection pulse effect
// ============================================================================

export const synapsePulseVertexShader = `
  attribute float pulseProgress;
  
  varying float vPulse;
  
  uniform float time;
  uniform float pulseSpeed;
  
  void main() {
    // Animated pulse along the line
    vPulse = mod(pulseProgress + time * pulseSpeed, 1.0);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const synapsePulseFragmentShader = `
  varying float vPulse;
  
  uniform vec3 baseColor;
  uniform vec3 pulseColor;
  uniform float intensity;
  
  void main() {
    // Pulse brightness (bell curve)
    float pulseBrightness = exp(-pow(vPulse - 0.5, 2.0) * 20.0);
    
    // Mix colors
    vec3 color = mix(baseColor, pulseColor, pulseBrightness);
    
    float alpha = (0.2 + pulseBrightness * 0.8) * intensity;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// ============================================================================
// DEPTH FOG SHADER
// Creates sense of infinite depth
// ============================================================================

export const depthFogVertexShader = `
  varying float vDepth;
  varying vec3 vPosition;
  
  void main() {
    vPosition = position;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mvPosition.z;
    
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const depthFogFragmentShader = `
  uniform vec3 nearColor;
  uniform vec3 farColor;
  uniform float nearDistance;
  uniform float farDistance;
  uniform float opacity;
  
  varying float vDepth;
  varying vec3 vPosition;
  
  void main() {
    // Depth-based fog
    float fogFactor = smoothstep(nearDistance, farDistance, vDepth);
    
    vec3 color = mix(nearColor, farColor, fogFactor);
    float alpha = opacity * fogFactor;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// ============================================================================
// SHADER MATERIAL FACTORIES
// Helper functions to create THREE.ShaderMaterial instances
// ============================================================================

import * as THREE from 'three';

export interface NebulaShaderOptions {
  innerColor?: string;
  outerColor?: string;
  opacity?: number;
  noiseScale?: number;
  rotationSpeed?: number;
}

export function createNebulaShaderMaterial(options: NebulaShaderOptions = {}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      innerColor: { value: new THREE.Color(options.innerColor || '#1e3a8a') },
      outerColor: { value: new THREE.Color(options.outerColor || '#0f172a') },
      time: { value: 0 },
      opacity: { value: options.opacity ?? 0.3 },
      noiseScale: { value: options.noiseScale ?? 2.0 },
      rotationSpeed: { value: options.rotationSpeed ?? 0.1 },
    },
    vertexShader: volumetricNebulaVertexShader,
    fragmentShader: volumetricNebulaFragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
}

export interface CoreGlowShaderOptions {
  coreColor?: string;
  glowColor?: string;
  intensity?: number;
  pulseSpeed?: number;
}

export function createCoreGlowShaderMaterial(options: CoreGlowShaderOptions = {}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      coreColor: { value: new THREE.Color(options.coreColor || '#ffffff') },
      glowColor: { value: new THREE.Color(options.glowColor || '#06b6d4') },
      time: { value: 0 },
      intensity: { value: options.intensity ?? 1.0 },
      pulseSpeed: { value: options.pulseSpeed ?? 1.0 },
    },
    vertexShader: coreGlowVertexShader,
    fragmentShader: coreGlowFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

export default {
  volumetricNebulaVertexShader,
  volumetricNebulaFragmentShader,
  coreGlowVertexShader,
  coreGlowFragmentShader,
  energyStreamVertexShader,
  energyStreamFragmentShader,
  synapsePulseVertexShader,
  synapsePulseFragmentShader,
  depthFogVertexShader,
  depthFogFragmentShader,
  createNebulaShaderMaterial,
  createCoreGlowShaderMaterial,
};

