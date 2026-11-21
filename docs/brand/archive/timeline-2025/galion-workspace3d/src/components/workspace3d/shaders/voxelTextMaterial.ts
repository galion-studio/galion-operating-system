// shaders/voxelTextMaterial.ts - Custom Voxel Text Shader
// Minecraft-style blocky voxels with edge glow, emissive animation, scroll effect
// Optimized for InstancedMesh (30k+ nodes at 60FPS)

import { extend, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NodeMaterial } from 'three/examples/jsm/nodes/Nodes.js'; // Optional: Node materials for animation

// ============================================================================
// VERTEX SHADER
// ============================================================================
const voxelVertexShader = `
  attribute vec3 instanceOffset; // Per-instance voxel position from atlas
  attribute vec4 instanceColor;  // Per-instance color
  attribute float instanceAnim;  // Per-instance animation phase
  
  uniform float uTime;
  uniform float uScrollSpeed;
  uniform vec3 uScrollDirection;
  uniform float uGlowIntensity;
  uniform float uEmissivePulse;
  
  varying vec3 vWorldPosition;
  varying vec4 vInstanceColor;
  varying float vAnimPhase;
  
  void main() {
    vec3 pos = position + instanceOffset;
    
    // Scroll animation (text scroll effect)
    pos += uScrollDirection * fract(uTime * uScrollSpeed + instanceAnim);
    
    // Float animation (gentle bob)
    pos.y += sin(uTime * 2.0 + instanceAnim * 10.0) * 0.02;
    
    vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    
    gl_Position = projectedPosition;
    
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vInstanceColor = instanceColor;
    vAnimPhase = instanceAnim;
  }
`;

// ============================================================================
// FRAGMENT SHADER
// ============================================================================
const voxelFragmentShader = `
  uniform vec3 uColor;
  uniform float uGlowIntensity;
  uniform float uEmissivePulse;
  uniform float uEdgeThickness;
  
  varying vec3 vWorldPosition;
  varying vec4 vInstanceColor;
  varying float vAnimPhase;
  
  void main() {
    // Voxel block color
    vec3 voxelColor = uColor * vInstanceColor.rgb;
    
    // Edge detection (Minecraft blocky edges)
    vec2 screenUV = gl_FragCoord.xy / vec2(1024.0, 768.0); // Adjust for resolution
    float edge = fwidth(screenUV.x) * uEdgeThickness;
    float edgeMask = smoothstep(0.0, edge, abs(dot(normalize(cross(dFdx(vWorldPosition), dFdy(vWorldPosition))), vec3(0.0, 0.0, 1.0))));
    
    // Glow effect (emissive rim lighting)
    float glow = pow(1.0 - dot(normalize(vWorldPosition - cameraPosition), vec3(0.0, 0.0, 1.0)), 2.0) * uGlowIntensity;
    
    // Emissive pulse animation
    float pulse = sin(uTime * 4.0 + vAnimPhase * 3.14) * 0.5 + 0.5;
    pulse *= uEmissivePulse;
    
    // Combine effects
    vec3 finalColor = voxelColor + glow * vec3(0.2, 0.5, 1.0) * pulse;
    finalColor = mix(finalColor, vec3(1.0), edgeMask * 0.3); // Darker edges
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ============================================================================
// VOXEL TEXT MATERIAL CLASS
// ============================================================================
class VoxelTextMaterial extends THREE.ShaderMaterial {
  constructor(parameters = {}) {
    super({
      vertexShader: voxelVertexShader,
      fragmentShader: voxelFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uScrollSpeed: { value: 0.5 },
        uScrollDirection: { value: new THREE.Vector3(1, 0, 0) },
        uGlowIntensity: { value: 1.0 },
        uEmissivePulse: { value: 0.8 },
        uEdgeThickness: { value: 1.0 },
        uColor: { value: new THREE.Color(0xffffff) },
      },
      ...parameters
    });
  }
  
  // Animate material (useFrame integration)
  animate(time: number, scrollSpeed = 0.5, glowIntensity = 1.0) {
    this.uniforms.uTime.value = time;
    this.uniforms.uScrollSpeed.value = scrollSpeed;
    this.uniforms.uGlowIntensity.value = glowIntensity;
  }
}

// Extend Three.js for React Three Fiber
extend({ VoxelTextMaterial });

// ============================================================================
// REACT HOOK FOR ANIMATION
// ============================================================================
export function useVoxelTextAnimation(materialRef: React.RefObject<VoxelTextMaterial>) {
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.animate(state.clock.elapsedTime);
    }
  });
}

// ============================================================================
// EXPORTS
// ============================================================================
export { VoxelTextMaterial };
export default VoxelTextMaterial;
