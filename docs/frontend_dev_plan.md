# Frontend Development Plan

A detailed sequential plan integrating the AGI frontend design into the existing `odoo-module-builder/frontend` React project.

1. Setup local development environment
   - Clone the repo and create a feature branch:
     ```bash
     git clone <repo-url> odoo-module-builder
     cd odoo-module-builder
     git checkout -b feature/frontend-agi-design
     ```
   - Open the project root in your editor.

2. Navigate to the frontend directory
   - Change directory:
     ```bash
     cd frontend
     ```
   - Confirm `src/`, `pages/`, `components/`, `styles/` folders exist.

3. Install required dependencies
   - Run:
     ```bash
     npm install tailwindcss postcss autoprefixer framer-motion three @react-three/fiber @react-three/drei gsap @tippyjs/react vanilla-tilt lottie-react react-dnd react-dnd-html5-backend @radix-ui/react-tabs react-window canvas-confetti react-hotkeys
     ```

4. Install development dependencies
   - Run:
     ```bash
     npm install -D postcss-loader autoprefixer tailwindcss
     ```

5. Generate Tailwind CSS and PostCSS config
   - Execute:
     ```bash
     npx tailwindcss init -p
     ```
   - This creates `tailwind.config.js` and `postcss.config.js` in `frontend/`.

6. Configure Tailwind to scan your source files
   - In `tailwind.config.js`, set:
     ```js
     module.exports = {
       content: ['./src/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}', './pages/**/*.{js,jsx,ts,tsx}'],
       theme: { extend: {} },
       plugins: [],
     };
     ```

7. Update Webpack to process Tailwind CSS
   - Open `webpack.config.js` and locate the `.css` rule.
   - Replace the CSS loader block with:
     ```js
     {
       test: /\.css$/,
       use: ['style-loader', 'postcss-loader', 'css-loader'],
     }
     ```
   - Ensure `resolve.extensions` includes `.ts` and `.tsx` if migrating.

8. Create global CSS file
   - Create `src/styles/globals.css` with:
     ```css
     @tailwind base;
     @tailwind components;
     @tailwind utilities;
     ```
   - In `src/index.js`, import the CSS at the top:
     ```js
     import './styles/globals.css';
     ```

9. (Optional) Migrate to TypeScript
   - Run:
     ```bash
     npm install -D typescript ts-loader @types/react @types/react-dom
     ```
   - Create `tsconfig.json` with React and ES modules settings.
   - Rename `src/index.js` → `src/index.tsx` and `src/App.js` → `src/App.tsx`.
   - In `webpack.config.js`, add a rule:
     ```js
     {
       test: /\.(ts|tsx)$/,
       use: 'ts-loader',
       exclude: /node_modules/,
     }
     ```
   - Update `resolve.extensions` to `['.js', '.jsx', '.ts', '.tsx']`.

10. Establish a global layout component
    - Under `src/components/Common/`, create `Layout.jsx` (or `.tsx`) that renders `<Header />`, `<main>`, and `<Footer />`.
    - In `src/App.jsx`, wrap `<Routes>` inside `<Layout>`.

11. Implement ThemeContext
    - Create `src/context/ThemeContext.js`:
      ```js
      import { createContext, useState, useEffect } from 'react';
      export const ThemeContext = createContext();
      export function ThemeProvider({ children }) {
        const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
        useEffect(() => { document.documentElement.className = theme; localStorage.setItem('theme', theme); }, [theme]);
        const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));
        return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
      }
      ```
    - Wrap `<ThemeProvider>` around `<App>` in `src/index.js`.

12. Define global CSS variables
    - In `src/styles/globals.css`, under `:root` and `.dark`, declare color and spacing variables:
      ```css
      :root { --color-bg: #fff; --color-text: #000; }
      .dark { --color-bg: #000; --color-text: #fff; }
      body { background: var(--color-bg); color: var(--color-text); }
      ```

13. Set up state management stores
    - Install Zustand or stick with Context. For Zustand:
      ```bash
      npm install zustand
      ```
    - In `src/stores/onboardingStore.js`:
      ```js
      import create from 'zustand';
      export const useOnboardingStore = create(set => ({ step: 0, answers: {}, setAnswer: (q,a) => set(state => ({ answers: { ...state.answers, [q]: a } })), next: () => set(state => ({ step: state.step+1 })), prev: () => set(state=>({ step: state.step-1 })), }));
      ```
    - Create `src/stores/moduleStore.js` and `src/stores/dashboardStore.js` with similar structures.

14. Configure React Router
    - In `src/App.jsx`, import:
      ```js
      import { BrowserRouter, Routes, Route } from 'react-router-dom';
      ```
    - Define routes:
      ```jsx
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HeroPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/module-flow" element={<ModuleFlowPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/resources" element={<ResourcesPage />} />
        </Routes>
      </BrowserRouter>
      ```

15. Create HeroPage
    - Under `src/pages/`, add `HeroPage.jsx`.
    - Import and render `WaveBackground`, `ParticleSphere`, `InteractiveGradientSphere`, and `ShaderButton` within a Tailwind `flex`, `items-center`, `justify-center`, `h-screen` container.

16. Implement `WaveBackground.jsx`
    - In `src/components/Hero/`, create `WaveBackground.jsx`:
      ```jsx
      import { Canvas, useFrame } from '@react-three/fiber';
      import { shaderMaterial } from '@react-three/drei';
      // define custom GLSL material and mesh here
      ```
    - Animate wave vertices in `useFrame` and pass `time` uniform.

17. Implement `ParticleSphere.jsx`
    - In `src/components/Hero/`, create `ParticleSphere.jsx`.
    - Use `useMemo` to generate particle positions and `useFrame` to rotate the group.
    - On `onPointerOver`, update material color via `useState`.

18. Implement `InteractiveGradientSphere.jsx`
    - Use a `motion.div` wrapping a `<div>` with classes: `w-48 h-48 rounded-full bg-gradient-to-tr from-purple-400 to-pink-500`.
    - Use `useMotionValue` and `useTransform` to adjust `x`/`y` based on pointer position.

19. Develop `ShaderButton.jsx`
    - In `src/components/Hero/`, use a Three.js plane mesh and custom `ShaderMaterial` for ripple effect.
    - Animate uniform values on click with GSAP timeline.

20. Centralize Motion Variants
    - In `src/utils/motionVariants.js`, export common variants (e.g., `fadeIn`, `staggerContainer`).
    - Apply variants in parent containers for consistent animation patterns.

21. Create OnboardingPage
    - Under `src/pages/`, add `OnboardingPage.jsx` that imports and renders `QuestionPortal` and provides Next/Back buttons styled with Tailwind.

22. Implement `QuestionPortal.jsx`
    - In `src/components/Onboarding/`, create `QuestionPortal.jsx` using Tailwind for CSS mask:
      ```css
      .portal { clip-path: circle(50% at 50% 50%); backdrop-filter: blur(8px); }
      ```
    - Use `AnimatePresence` and `motion.div` for card transitions.

23. Build `InputOrb.jsx`
    - Style as a floating circle with Tailwind: `w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center`.
    - Inside, render `<input>` with `className="bg-transparent text-center outline-none"`.
    - On focus, animate with `whileFocus` props.

24. Wire onboarding logic
    - Import `useOnboardingStore`. On answer submission, call `setAnswer(questionId, value)` then `next()`.

25. Add GSAP Flip transitions
    - In `QuestionPortal.jsx`, wrap the card list:
      ```js
      import { Flip } from 'gsap/Flip';
      const state = Flip.getState('.question-card');
      // after state update
      Flip.from(state, { duration: 0.6, ease: 'power1.inOut' });
      ```

26. Integrate Lottie animations
    - Install `lottie-react`. In `QuestionPortal.jsx`, import `Player`:
      ```jsx
      <Player src="/animations/typing.json" autoplay loop style={{ width: 80 }} />
      ```
    - Trigger on input focus.

27. Create ModuleFlowPage
    - Under `src/pages/`, add `ModuleFlowPage.jsx` rendering `<ModuleEditor />`.

28. Implement `ModuleEditor.jsx`
    - Wrap content in `<DndProvider backend={HTML5Backend}>`.
    - Use `useStore(moduleStore)` to access `blocks` and `moveBlock`.
    - Render `blocks.map(block => <DragBlock key={block.id} block={block} />)`.

29. Develop `DragBlock.jsx`
    - Use `useDrag` and `useDrop` from `react-dnd`.
    - On hover, use `motion.div` to scale.
    - On drop, call `moduleStore.moveBlock(dragIndex, hoverIndex)`.

30. In-place editing
    - In `DragBlock.jsx`, use `contentEditable` on title:
      ```jsx
      <h3 contentEditable suppressContentEditableWarning onBlur={e => updateTitle(e.target.textContent)} />
      ```
    - On focus and blur, animate highlight with GSAP.

31. Tooltips with Tippy.js
    - Create `src/components/Common/Tooltip.jsx`:
      ```jsx
      import Tippy from '@tippyjs/react';
      export default function Tooltip({ content, children }) { return <Tippy content={content}>{children}</Tippy>; }
      ```

32. Confetti on successful drop
    - After calling `moveBlock`, import and fire:
      ```js
      import confetti from 'canvas-confetti';
      confetti({ particleCount: 50, spread: 90 });
      ```

33. Create DashboardPage
    - Under `src/pages/`, add `DashboardPage.jsx` rendering `<FilterDrawer />` and `<ModuleCardGrid />` within a responsive container.

34. Implement `ModuleCard.jsx`
    - In `src/components/Dashboard/`, style card:
      ```jsx
      <div ref={cardRef} className="backdrop-filter blur-xl bg-white/30 rounded-lg p-4" />
      ```

35. Implement `ModuleCardGrid.jsx`
    - Use `react-window`:
      ```jsx
      import { FixedSizeList } from 'react-window';
      <FixedSizeList height={600} itemCount={modules.length} itemSize={200}>{({ index, style }) => <ModuleCard style={style} module={modules[index]} />}</FixedSizeList>
      ```

36. Parallax tilt effect
    - In `ModuleCard.jsx`, use `useEffect` to initialize VanillaTilt:
      ```js
      import VanillaTilt from 'vanilla-tilt';
      useEffect(() => { VanillaTilt.init(cardRef.current, { max: 15, speed: 400, scale: 1.05 }); }, []);
      ```

37. Perspective scroll animation
    - In `ModuleCardGrid.jsx`, use Intersection Observer to toggle a `visible` state for each card.
    - Animate transform via inline style:
      ```jsx
      style={{ transform: `perspective(800px) rotateX(${visible ? 0 : 20}deg)` }}
      ```

38. Build `FilterDrawer.jsx`
    - Use `<motion.div initial={{ x: '-100%' }} animate={{ x: open ? '0%' : '-100%' }}>`.
    - Bind filter inputs (search, dropdowns) to `dashboardStore.setFilter` and `setSort`.

39. Dashboard state store
    - In `src/stores/dashboardStore.js`, use Zustand:
      ```js
      export const useDashboardStore = create(set => ({ filters: {}, modules: [], setFilter: (k,v) => set(state => ({ filters: {...state.filters, [k]: v} })), filteredModules: () => /* selector logic */ }));
      ```

40. Create ProfilePage
    - Under `src/pages/`, add `ProfilePage.jsx` rendering `<ProfileTabs />`, `<Avatar />`, and `<ThemeSwitcher />`.

41. Implement `ProfileTabs.jsx`
    - In `src/components/Profile/`, import:
      ```jsx
      import * as Tabs from '@radix-ui/react-tabs';
      ```
    - Use `Tabs.Root`, `Tabs.List`, `Tabs.Trigger`, and `Tabs.Content` with Tailwind styling and Framer Motion for the underline.

42. Implement `ThemeSwitcher.jsx`
    - In `src/components/Profile/`, render a set of color swatches as buttons. On click, call `toggleTheme` from `ThemeContext`.

43. Develop `Avatar.jsx`
    - In `src/components/Profile/`, render `<img>` with className="avatar w-24 h-24 rounded-full".
    - Define breathing animation in `globals.css`:
      ```css
      @keyframes breath { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.05); opacity: 1; } }
      .avatar { animation: breath 4s ease-in-out infinite; }
      ```

44. Persist user settings
    - In `ProfileProvider.js`, subscribe to store changes and sync relevant fields to `localStorage`.
    - On load in `ThemeProvider` and `ProfileProvider`, hydrate state from `localStorage`.

45. Create ResourcesPage
    - Under `src/pages/`, add `ResourcesPage.jsx` that lists available documentation files from `/docs` and links.

46. Implement `FloatingHelpButton.jsx`
    - Under `src/components/Common/`, create `FloatingHelpButton.jsx`:
      ```jsx
      import { motion } from 'framer-motion';
      <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} className="fixed bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full">?</motion.button>
      ```
    - On click, toggle `<HelpModal />`.

47. Inline tooltips across the app
    - Wrap inputs, buttons, and icons with `<Tooltip content="..." />` for contextual help.

48. Load markdown documentation
    - Install `remark`:
      ```bash
      npm install remark remark-html
      ```
    - In `ResourcesPage.jsx`, import `fs` and read markdown files from `docs` (via Webpack raw loader if needed) or fetch via HTTP.
    - Process with `remark().use(remarkHtml).processSync(md).toString()` and render.
    - Wrap sections in `motion.div` with fade-in variants.

49. Implement ChatWidget
    - Under `src/components/Common/`, create `ChatWidget.jsx` with a slide-up `motion.div` containing a message list and `<textarea>`.
    - Animate typing indicator with CSS keyframes:
      ```css
      @keyframes blink { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
      .typing-dot { animation: blink 1.4s infinite both; }
      ```

50. Set up testing and CI pipeline
    - In `frontend`, install Jest & RTL:
      ```bash
      npm install -D jest @testing-library/react @types/jest
      ```
    - Create `jest.config.js`, write unit tests under `__tests__` for components (`WaveBackground`, `QuestionPortal`, `ModuleEditor`).
    - Install Playwright:
      ```bash
      npx playwright install
      ```
    - Add E2E tests in `tests/playwright/` covering onboarding, module flow, and dashboard.
    - Create `.github/workflows/ci.yml`:
      ```yaml
      name: CI
      on: [pull_request]
      jobs:
        frontend:
          runs-on: ubuntu-latest
          steps:
            - uses: actions/checkout@v2
            - name: Setup Node
              uses: actions/setup-node@v2
              with:
                node-version: '16'
            - name: Install dependencies
              run: npm ci
              working-directory: frontend
            - name: Run lint and tests
              run: npm run lint && npm test
              working-directory: frontend
            - name: Build
              run: npm run build
              working-directory: frontend
      ``` 