// GalionOrbV7.2 - Epic Cosmic Shader
// 8K Quality GLSL Shaders for ultra-realistic orb rendering

export const cosmicVertexShader = `
  precision highp float;

  uniform float uTime;
  uniform float uIntensity;
  uniform float uBirthProgress;
  uniform float uAudioReactivity;

  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vDisplacement;
  varying float vFresnel;

  // Simplex 3D noise
  vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 1.0/7.0;
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
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  // FBM for organic displacement
  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 6; i++) {
      value += amplitude * snoise(p * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }

    return value;
  }

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    // Birth animation - orb emerges from singularity
    float birthScale = smoothstep(0.0, 1.0, uBirthProgress);
    float birthPulse = sin(uBirthProgress * 3.14159 * 4.0) * 0.1 * (1.0 - uBirthProgress);

    // Organic displacement with audio reactivity
    vec3 noisePos = position + vec3(uTime * 0.1);
    float noise = fbm(noisePos * 2.0);
    float audioWave = sin(uTime * 5.0 + position.y * 10.0) * uAudioReactivity * 0.1;

    vDisplacement = noise * uIntensity + audioWave + birthPulse;

    // Apply displacement along normal
    vec3 displaced = position + normal * vDisplacement * 0.15 * birthScale;
    displaced *= birthScale; // Scale from 0 to 1 during birth

    vPosition = displaced;

    // Fresnel for edge glow
    vec3 viewDir = normalize(cameraPosition - (modelMatrix * vec4(displaced, 1.0)).xyz);
    vFresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 3.0);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

export const cosmicFragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform float uIntensity;
  uniform float uBirthProgress;
  uniform float uAudioReactivity;
  uniform vec3 uEmotionColor;
  uniform vec3 uSecondaryColor;
  uniform float uEmotionEnergy;
  uniform sampler2D uNoiseTexture;

  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vDisplacement;
  varying float vFresnel;

  // Hash function for pseudo-random
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // 2D noise
  float noise2D(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // Aurora effect
  vec3 aurora(vec2 uv, float time) {
    float wave = sin(uv.x * 10.0 + time) * cos(uv.y * 8.0 - time * 0.5);
    float aurora1 = smoothstep(0.3, 0.7, wave + noise2D(uv * 5.0 + time));
    float aurora2 = smoothstep(0.4, 0.8, wave * 0.8 + noise2D(uv * 7.0 - time * 0.7));

    vec3 auroraColor1 = vec3(0.0, 1.0, 0.5);
    vec3 auroraColor2 = vec3(0.3, 0.0, 1.0);

    return mix(auroraColor1, auroraColor2, aurora2) * aurora1 * 0.5;
  }

  // Nebula clouds
  vec3 nebula(vec2 uv, float time) {
    float n1 = noise2D(uv * 3.0 + time * 0.1);
    float n2 = noise2D(uv * 6.0 - time * 0.15);
    float n3 = noise2D(uv * 12.0 + time * 0.2);

    float nebulaDensity = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
    nebulaDensity = pow(nebulaDensity, 2.0);

    vec3 nebulaColor = mix(uEmotionColor, uSecondaryColor, n2);
    return nebulaColor * nebulaDensity;
  }

  // Energy tendrils
  float energyTendrils(vec2 uv, float time) {
    float angle = atan(uv.y - 0.5, uv.x - 0.5);
    float dist = length(uv - 0.5);

    float tendrils = sin(angle * 8.0 + time * 2.0) * 0.5 + 0.5;
    tendrils *= sin(dist * 20.0 - time * 3.0);
    tendrils = smoothstep(0.3, 1.0, tendrils);

    return tendrils * (1.0 - dist * 1.5);
  }

  // Star field for birth
  float starField(vec2 uv, float time) {
    vec2 cell = floor(uv * 50.0);
    vec2 offset = fract(uv * 50.0) - 0.5;

    float star = hash(cell);
    float brightness = step(0.98, star);
    float twinkle = sin(time * 3.0 + star * 100.0) * 0.5 + 0.5;

    float dist = length(offset);
    float glow = smoothstep(0.3, 0.0, dist) * brightness * twinkle;

    return glow;
  }

  void main() {
    // Birth phase - starts dark, explodes into light
    float birthFade = smoothstep(0.0, 0.3, uBirthProgress);
    float birthExplosion = smoothstep(0.1, 0.4, uBirthProgress) * (1.0 - smoothstep(0.4, 0.8, uBirthProgress)) * 2.0;

    // Base cosmic color gradient
    vec3 baseColor = mix(
      uEmotionColor * 0.3,
      uEmotionColor,
      vFresnel + vDisplacement
    );

    // Add nebula clouds
    vec3 nebulaEffect = nebula(vUv, uTime);

    // Add aurora
    vec3 auroraEffect = aurora(vUv, uTime) * uEmotionEnergy;

    // Add energy tendrils
    float tendrils = energyTendrils(vUv, uTime);
    vec3 tendrilColor = uSecondaryColor * tendrils * uEmotionEnergy;

    // Fresnel glow (edge lighting)
    vec3 fresnelGlow = uEmotionColor * vFresnel * 2.0;

    // Core glow
    float coreGlow = smoothstep(0.5, 0.0, length(vUv - 0.5));
    vec3 coreColor = mix(uEmotionColor, vec3(1.0), 0.5) * coreGlow * 1.5;

    // Audio reactive pulses
    float audioPulse = sin(uTime * 10.0 + vPosition.y * 20.0) * uAudioReactivity;
    audioPulse = max(0.0, audioPulse);
    vec3 audioColor = uEmotionColor * audioPulse * 0.5;

    // Birth explosion effect - white hot core expanding
    vec3 birthColor = vec3(1.0, 0.9, 0.8) * birthExplosion;
    float birthStars = starField(vUv, uTime) * (1.0 - uBirthProgress) * 3.0;

    // Combine all effects
    vec3 finalColor = baseColor;
    finalColor += nebulaEffect * 0.5;
    finalColor += auroraEffect;
    finalColor += tendrilColor;
    finalColor += fresnelGlow;
    finalColor += coreColor;
    finalColor += audioColor;
    finalColor += birthColor;
    finalColor += vec3(birthStars);

    // Apply birth fade
    finalColor *= birthFade;

    // HDR tone mapping for 8K quality feel
    finalColor = finalColor / (finalColor + vec3(1.0));
    finalColor = pow(finalColor, vec3(1.0 / 2.2)); // Gamma correction

    // Alpha based on birth progress and fresnel
    float alpha = mix(0.6, 0.95, vFresnel) * birthFade;
    alpha = max(alpha, birthExplosion * 0.8);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export const glowVertexShader = `
  precision highp float;

  uniform float uTime;
  uniform float uPulse;
  uniform float uBirthProgress;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying float vIntensity;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    // Pulsating scale
    float pulse = sin(uTime * 2.0) * 0.02 * uPulse;
    float birthScale = smoothstep(0.0, 0.5, uBirthProgress);

    vec3 pos = position * (1.0 + pulse) * birthScale;

    // Calculate view-based intensity for fresnel
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vec3 viewDir = normalize(cameraPosition - worldPos.xyz);
    vIntensity = pow(1.0 - abs(dot(viewDir, vNormal)), 2.0);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const glowFragmentShader = `
  precision highp float;

  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uBirthProgress;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying float vIntensity;

  void main() {
    // Animated glow intensity
    float glow = vIntensity;
    glow *= 1.0 + sin(uTime * 3.0) * 0.2;

    // Birth flash
    float birthFlash = smoothstep(0.2, 0.4, uBirthProgress) * (1.0 - smoothstep(0.4, 0.6, uBirthProgress));
    glow += birthFlash * 2.0;

    // Color with HDR bloom simulation
    vec3 glowColor = uColor * glow * 2.0;
    glowColor += vec3(1.0) * birthFlash * 0.5;

    float alpha = glow * uOpacity * smoothstep(0.0, 0.3, uBirthProgress);

    gl_FragColor = vec4(glowColor, alpha);
  }
`;

export const particleVertexShader = `
  precision highp float;

  attribute float aSize;
  attribute float aLife;
  attribute float aRandom;
  attribute vec3 aVelocity;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uBirthProgress;
  uniform float uAudioReactivity;

  varying float vAlpha;
  varying float vLife;
  varying vec3 vColor;

  void main() {
    vLife = aLife;

    // Particle lifecycle
    float age = mod(uTime * 0.5 + aRandom, aLife) / aLife;
    vAlpha = sin(age * 3.14159);

    // Birth explosion - particles burst outward
    float birthBurst = smoothstep(0.1, 0.3, uBirthProgress) * (1.0 - smoothstep(0.3, 0.7, uBirthProgress));
    vec3 burstVelocity = normalize(position) * birthBurst * 2.0;

    // Position with velocity and birth
    float birthScale = smoothstep(0.0, 0.5, uBirthProgress);
    vec3 pos = position * birthScale;
    pos += aVelocity * mod(uTime, aLife);
    pos += burstVelocity * uTime;

    // Audio reactivity
    pos += normalize(position) * uAudioReactivity * sin(uTime * 10.0 + aRandom * 6.28) * 0.1;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size with distance attenuation
    float size = aSize * uPixelRatio * (300.0 / -mvPosition.z);
    size *= vAlpha;
    size *= 1.0 + birthBurst * 2.0;
    gl_PointSize = size;
  }
`;

export const particleFragmentShader = `
  precision highp float;

  uniform vec3 uColor;
  uniform float uBirthProgress;

  varying float vAlpha;
  varying float vLife;

  void main() {
    // Circular particle with soft edges
    float dist = length(gl_PointCoord - 0.5);
    if (dist > 0.5) discard;

    float alpha = smoothstep(0.5, 0.2, dist) * vAlpha;

    // Brighter during birth
    float birthBrightness = smoothstep(0.1, 0.4, uBirthProgress) * (1.0 - smoothstep(0.4, 0.8, uBirthProgress));
    vec3 color = uColor * (1.0 + birthBrightness);

    gl_FragColor = vec4(color, alpha * smoothstep(0.0, 0.2, uBirthProgress));
  }
`;
