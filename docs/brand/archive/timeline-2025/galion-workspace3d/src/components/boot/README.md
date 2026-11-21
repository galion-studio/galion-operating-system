# 🚀 Unified Boot Sequence

> The ONE perfect boot experience for GALION.

## Overview

This unified boot sequence consolidates all loading/welcome screens into a single, cinematic experience that adapts based on whether the user is visiting for the first time or returning.

## Features

### For First-Time Users (45s)
```
VOID → BIRTH → WELCOME → CONSENT → COMPLETE
```

1. **Void Phase** (2s) - Pure black with single point of light
2. **Birth Phase** (6s) - Minimalistic spinner → Nebula → Orb birth
3. **Welcome Phase** (6s) - 3D scene with "Welcome to GALION Ecosystem"
4. **Consent Phase** (20s) - Cookie, Terms, Microphone permissions
5. **Complete** - Smooth transition to main app

### For Returning Users (8s)
```
WAKE → GREETING → ORBING → COMPLETE
```

1. **Wake Phase** (3s) - Flowing lines animation
2. **Greeting Phase** (3s) - "Welcome Back" text
3. **Orbing Phase** (2s) - Orb materialization
4. **Complete** - Ready to use

## Usage

```tsx
import { UnifiedBootSequence, hasCompletedBoot } from '@/components/boot/UnifiedBootSequence';

function App() {
  const [bootComplete, setBootComplete] = useState(hasCompletedBoot());
  
  if (!bootComplete) {
    return (
      <UnifiedBootSequence
        isFirstVisit={!hasCompletedBoot()}
        onComplete={() => setBootComplete(true)}
        allowSkip={true}
      />
    );
  }
  
  return <YourMainApp />;
}
```

## API

### UnifiedBootSequence

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isFirstVisit` | `boolean` | required | Whether this is the user's first visit |
| `onComplete` | `() => void` | required | Callback when boot completes |
| `allowSkip` | `boolean` | `true` | Allow users to skip phases (except consent) |
| `platformName` | `string` | `'GALION'` | Platform name for branding |

### Helper Functions

#### `hasCompletedBoot(): boolean`
Check if the user has completed the boot sequence before.

#### `getTimeSinceLastVisit(): string | null`
Get a human-readable string of time since last visit (e.g., "2 days", "5 hours").

## File Structure

```
src/components/boot/
├── UnifiedBootSequence.tsx    # Main orchestrator
├── types.ts                    # TypeScript definitions
├── phases/
│   ├── VoidPhase.tsx          # Pure black with single light
│   ├── BirthPhase.tsx         # Spinner → Nebula → Orb
│   ├── WelcomePhase.tsx       # 3D "Welcome to GALION Ecosystem"
│   ├── ConsentPhase.tsx       # Cookie/Terms/Mic permissions
│   ├── WakePhase.tsx          # Flowing lines (returning)
│   ├── GreetingPhase.tsx      # Welcome back text
│   └── OrbingPhase.tsx        # Orb materialization
└── shared/
    ├── SkipButton.tsx         # Subtle skip affordance
    └── AnimatedText.tsx       # Text reveal animations
```

## Design Principles

### 1. Human-Optimized Timing
- First-time: 45s (worth it for setup and impression)
- Returning: 8s (fast, elegant, respectful of time)
- All phases can be skipped except consent (legal requirement)

### 2. Visual Continuity
- The orb is the constant throughout
- Same color palette (HDR blues, purples, cyans)
- Smooth transitions between phases
- 60 FPS performance

### 3. Progressive Disclosure
- First-time: Full story (birth → welcome → consent)
- Returning: Quick story (wake → greet → ready)
- Both feel complete and intentional

### 4. V3 Design Compliance
- Pure black background (#000000)
- Pure white text (#FFFFFF)
- ONE primary element (the orb)
- NO unnecessary UI
- <200ms transitions
- 60 FPS animations

## LocalStorage Keys

The boot sequence uses these localStorage keys:

| Key | Value | Purpose |
|-----|-------|---------|
| `galion_boot_completed` | `'true'` | Marks boot as completed |
| `galion_last_visit` | ISO timestamp | Last visit time |
| `galion_cookies` | `'essential'` \| `'all'` | Cookie consent choice |
| `galion_terms_accepted` | `'true'` | Terms acceptance |
| `galion_microphone` | `'granted'` \| `'denied'` \| `'text-only'` | Mic permission |

## Performance

### Optimization Strategies

1. **Lazy Loading** - Heavy 3D components are dynamically imported
2. **Suspense Boundaries** - Graceful loading for 3D scenes
3. **RAF Optimization** - All animations use requestAnimationFrame
4. **GPU Acceleration** - CSS transforms for 2D animations
5. **Debounced Events** - User interactions are properly debounced

### Metrics

- Time to Interactive (TTI): <2s
- First Contentful Paint (FCP): <500ms
- Animation Frame Rate: 60 FPS
- Memory Usage: <50MB for entire sequence

## Accessibility

- ✅ Keyboard navigation (Enter/Space to skip)
- ✅ Screen reader support with ARIA labels
- ✅ High contrast text and elements
- ✅ No motion sickness triggers (gentle animations)
- ✅ Clear affordances for all interactions

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ Mobile Safari (some 3D performance limitations)

## Future Enhancements

### v2: Personalization
- Custom wake-up messages
- Orb remembers last conversation
- Contextual greetings
- Mood detection

### v3: Voice-First
- Voice-guided setup
- Speak to skip phases
- Audio cues for each phase
- Accessibility improvements

### v4: Adaptive
- Learn user preferences
- Adjust timing based on behavior
- Smart defaults
- Predictive loading

## Migration from Old Boot Screens

The unified boot sequence replaces:
- ❌ `GalionGatekeeperV2.tsx` (consent flow)
- ❌ `WelcomeScreen.tsx` (3D welcome)
- ❌ `WelcomeBackV2.tsx` (flowing lines)
- ❌ `WorkspaceBootScreen.tsx` (workspace init)
- ❌ Multiple scattered loading screens

Migration steps:
1. Update `page.tsx` to use `UnifiedBootSequence`
2. Remove old boot components
3. Test first-visit and returning-user flows
4. Verify localStorage persistence
5. Check accessibility
6. Monitor performance metrics

## License

Part of the GALION Ecosystem - Open Source MIT License
