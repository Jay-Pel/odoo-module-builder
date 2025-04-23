# Frontend Design Plan - Immersive Module Portal

## Core Concept
A spatial interface combining:
- Portal transition animations
- Fluid, organic motion design
- Context-aware particle effects
- 3D spatial interactions

## Key Sections

### 1. Hero Section (Portal Gateway)
```21st.dev-inspired waves background with:
- Floating orb (gradient core with particle corona)
- Interactive mouse-tracking distortion waves
- Portal entrance CTA with matter-transition animation
- Dynamic gradient mesh background

### 2. Module Creation Flow (Typeform-like Journey)
```magic-mcp enhanced question flow:
- Step transitions using portal warp effects
- Floating input fields with particle trails
- Progress indicator using glowing orb fragments
- Context-aware background patterns that react to input

Sample transition flow:
1. Portal entrance → scale up + blur background
2. Question steps → slide in from dimensional rift
3. Completion → particle implosion → dashboard

### 3. Module Dashboard (Temporal Archive)
```Holographic interface showing past modules:
- Card grid with parallax hover effects
- Time-warp scroll effect (perspective shift)
- Dynamic filtering with liquid sorting
- 3D preview panes on focus
- Morphing transitions between states

## Animation Systems

### Core Technologies
1. Framer Motion (React animation)
2. magic-mcp (Particle effects)
3. Waves Background (21st.dev implementation)
4. Three.js (WebGL portal effects)
5. GSAP (Complex animation timelines)

### Signature Effects
- **Portal Transition**: 
  ```tsx
  // Using Framer Motion + magic-mcp
  const portalTransition = {
    initial: { scale: 0, rotate: 180 },
    animate: { 
      scale: 1, 
      rotate: 0,
      background: "radial-gradient(circle, #4f46e5, transparent 70%)"
    },
    exit: {
      scale: 2,
      opacity: 0,
      transition: { duration: 0.6 }
    }
  }
  ```

- **Holographic Cards**:
  ```css
  .module-card {
    backdrop-filter: blur(12px);
    border-image: linear-gradient(45deg, #818cf8, #c084fc) 1;
    transition: transform 0.3s ease-in-out;
    
    &:hover {
      transform: perspective(1000px) rotateX(5deg) rotateY(5deg);
    }
  }
  ```

## Technical Implementation

### Base Stack
- Next.js 14 (App Router)
- Tailwind CSS + CSS Modules
- Framer Motion Animation Library
- magic-mcp Integration
- Custom WebGL Shaders

### Component Structure
```
/components
  /Hero
    PortalEntrance.tsx
    WaveBackground.tsx
  /Creation
    QuestionPortal.tsx
    InputOrb.tsx
  /Dashboard
    TimeGrid.tsx
    ModuleCard.tsx
```

## Timeline & Considerations

1. Phase 1 (2 weeks): Core animation system + Hero portal
2. Phase 2 (3 weeks): Module creation flow + transitions
3. Phase 3 (1 week): Dashboard implementation
4. Phase 4 (Ongoing): Performance optimization

**Important Notes:**
- All animations will have reduced-motion fallbacks
- Progressive enhancement strategy for older devices
- GPU-accelerated animations where possible
- Dynamic theme system for portal coloration

Would you like me to expand any particular section or adjust the visual direction?
```

This plan combines the requested Typeform-like flow with immersive spatial elements. The waves background library you referenced would be central to the Hero section, with magic-mcp handling particle effects. I can adjust any aspects of this proposal or provide more technical details for specific components.