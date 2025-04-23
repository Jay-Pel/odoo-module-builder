# Frontend AGI Design Plan

A comprehensive development plan that synthesizes the strongest design ideas into a seamless visitor journey, from first impression through advanced user interactions.

## Visitor Journey Overview
1. **Landing Experience**
2. **Onboarding Portal**
3. **Module Creation Flow**
4. **Central Dashboard**
5. **Profile & Settings**
6. **Resources & Support**

---

## 1. Landing Experience
### Goal
Hook the user immediately with immersive, organic motion and interactive backgrounds.

### Key Elements
- **Waves Background**
  - 21st.dev implementation: https://21st.dev/DavidHDev/waves-background/default
  - Full-screen, fluid gradient waves.
- **Particle & Nebula Effects**
  - magic-mcp for dynamic particles: https://github.com/magic-mcp/magic-mcp
- **Interactive Gradient Sphere**
  - Hover ripple & parallax movement (Three.js or CSS custom properties).
- **Shader Distortion CTA**
  - Three.js/GLSL-powered button with ripple shader effect.

### Implementation Notes
- Next.js + Tailwind CSS base
- `WaveBackground.tsx` for the canvas implementation
- GPU-accelerated shaders via Three.js

---

## 2. Onboarding Portal
### Goal
Guide users through a Typeform‑style step-by-step flow, immersing them in a portal transition.

### Key Elements
- **Circular Portal Container**
  - CSS mask + backdrop-filter blur for "through the portal" effect.
- **Sequential Question Cards**
  - Single-question-per-view with slide/scale animations.
- **Progress Indicator**
  - Orbiting light particles tracing a circular path.

### Tools & References
- Framer Motion variants & transitions: https://www.framer.com/motion/
- GSAP Flip Plugin for layout transitions: https://greensock.com/flip/
- Lottie micro-animations: https://lottiefiles.com/

### Implementation Notes
- `QuestionPortal.tsx` & `InputOrb.tsx`
- Framer Motion for enter/exit variants
- magic-mcp trails on input focus

---

## 3. Module Creation Flow
### Goal
Allow users to build and configure modules with drag‑and‑drop and real‑time feedback.

### Key Elements
- **Drag-and-Drop Module Blocks**
  - React DnD or React Beautiful DnD: https://github.com/atlassian/react-beautiful-dnd
- **Floating Tooltips & Hints**
  - Tippy.js for rich tooltip animations: https://atomiks.github.io/tippyjs/
- **In-place Editing**
  - `contenteditable` fields with animated highlights (GSAP or Framer Motion)

### Implementation Notes
- `ModuleEditor.tsx` managing block state
- Animated feedback on drop success (e.g. confetti particle burst)

---

## 4. Central Dashboard
### Goal
Provide a polished archive of past modules with interactive previews and filtering.

### Key Elements
- **Glassmorphic Card Grid**
  - CSS Glass effect: https://uiverse.io/pointypure/glass-card
- **Parallax Hover Tilt**
  - Vanilla-Tilt.js: https://micku7zu.github.io/vanilla-tilt.js/
- **Perspective Time-Scroll**
  - Scroll-linked 3D perspective shift (CSS + JS)
- **Filter Drawer**
  - Slide-in sidebar with animated list reordering (Framer Motion)

### Implementation Notes
- `ModuleCard.tsx` with hover & focus states
- Virtualized list for performance on large datasets

---

## 5. Profile & Settings
### Goal
Let users personalize their workspace with animated controls and real-time previews.

### Key Elements
- **Animated Avatar**
  - Subtle breathing or glow effect using CSS keyframes
- **Tabs Navigation**
  - Underline grow animation (Radix UI Tabs: https://www.radix-ui.com/docs/react/tabs)
- **Theme Picker**
  - Live CSS variable updates
  - Color palette UI: https://vercel.com/design/color

### Implementation Notes
- `ProfileTabs.tsx` & `ThemeSwitcher.tsx`
- Store settings in Context and localStorage

---

## 6. Resources & Support
### Goal
Offer contextual help and documentation without breaking immersion.

### Key Elements
- **Floating Help Button**
  - Zoom-out modal animation (Framer Motion)
- **Inline Tooltips**
  - Contextual hints tied to components
- **Documentation Pages**
  - Fade-in sections on scroll (Intersection Observer + Framer Motion)
- **Chat Widget**
  - Slide-up panel with typing indicator

### Tools & References
- React Hotkeys (keyboard shortcuts): https://github.com/greena13/react-hotkeys
- React Modal for dialogs: https://github.com/reactjs/react-modal

---

## Technology Stack
- **Frameworks**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Styled Components
- **Animations**: Framer Motion, GSAP, Three.js, magic-mcp
- **Utilities**: Lottie, React DnD, Vanilla-Tilt, Tippy.js

## Performance & Accessibility
- Reduced-motion fallback via `prefers-reduced-motion`
- Lazy-load heavy components & shaders
- GPU-accelerated CSS transforms
- ARIA roles, keyboard navigation, color contrast checks

## Project Structure
```text
/components
  /Hero
    WaveBackground.tsx
    ParticleSphere.tsx
  /Onboarding
    QuestionPortal.tsx
    InputOrb.tsx
  /ModuleFlow
    ModuleEditor.tsx
    DragBlock.tsx
  /Dashboard
    ModuleCard.tsx
    FilterDrawer.tsx
  /Profile
    ProfileTabs.tsx
    ThemeSwitcher.tsx
  /Common
    Button.tsx
    Tooltip.tsx
```

---

This frontend plan follows the visitor's journey step by step, detailing design patterns, animations, and tools with example links to guide development. Let me know if you'd like adjustments or deeper details on any section. 