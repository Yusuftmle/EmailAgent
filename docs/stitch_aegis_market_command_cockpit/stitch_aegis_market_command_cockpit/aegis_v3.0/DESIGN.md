---
name: Aegis V3.0
colors:
  surface: '#0c1324'
  surface-dim: '#0c1324'
  surface-bright: '#33394c'
  surface-container-lowest: '#070d1f'
  surface-container-low: '#151b2d'
  surface-container: '#191f31'
  surface-container-high: '#23293c'
  surface-container-highest: '#2e3447'
  on-surface: '#dce1fb'
  on-surface-variant: '#bbc9cd'
  inverse-surface: '#dce1fb'
  inverse-on-surface: '#2a3043'
  outline: '#859397'
  outline-variant: '#3c494c'
  surface-tint: '#2fd9f4'
  primary: '#8aebff'
  on-primary: '#00363e'
  primary-container: '#22d3ee'
  on-primary-container: '#005763'
  inverse-primary: '#006877'
  secondary: '#45dfa4'
  on-secondary: '#003825'
  secondary-container: '#00bd85'
  on-secondary-container: '#00452e'
  tertiary: '#ffd2d5'
  on-tertiary: '#67001f'
  tertiary-container: '#ffaab2'
  on-tertiary-container: '#94223a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#a2eeff'
  primary-fixed-dim: '#2fd9f4'
  on-primary-fixed: '#001f25'
  on-primary-fixed-variant: '#004e5a'
  secondary-fixed: '#68fcbf'
  secondary-fixed-dim: '#45dfa4'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#ffdadc'
  tertiary-fixed-dim: '#ffb2b9'
  on-tertiary-fixed: '#400010'
  on-tertiary-fixed-variant: '#891933'
  background: '#0c1324'
  on-background: '#dce1fb'
  surface-variant: '#2e3447'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  title-md:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-desktop: 32px
  margin-mobile: 16px
  container-max: 1920px
---

## Brand & Style
The design system is engineered for high-stakes, real-time decision-making environments. It embodies an **Autonomous, Precision-Engineered, and AI-Driven** personality. The UI serves as a command cockpit where data density is prioritized without sacrificing clarity.

The visual style is a hybrid of **Minimalist-Glassmorphism** and **Technical-Modern**. It utilizes deep obsidian surfaces, translucent layering, and vibrant "signal" colors to draw attention to critical anomalies. The aesthetic is intentionally "low-light" to reduce eye strain during long-term monitoring, creating a focused, immersive experience that feels like a futuristic OS.

## Colors
The palette is built on a "Dark Mode First" philosophy using a deep Slate foundation to ensure high contrast for functional signals.

- **Background**: `#020617` (Slate-950) provides the infinite depth required for glass effects.
- **AI Active**: `#22d3ee` (Cyan-400) is used exclusively for AI-generated insights, active processing states, and primary actions.
- **Positive Signal**: `#34d399` (Emerald-400) denotes stable systems, successful operations, and "all-clear" status.
- **Alert/Error**: `#fb7185` (Rose-400) is reserved for anomalies, critical failures, and immediate human-intervention triggers.
- **Surfaces**: Components utilize `bg-slate-900/40` with a subtle `backdrop-blur-sm` to maintain a sense of depth and hierarchy.

## Typography
This design system utilizes **Geist** for its neutral, technical clarity and exceptional legibility at small sizes. **JetBrains Mono** is introduced for data-heavy strings, timestamps, and coordinate values to reinforce the "precision-engineered" feel.

Typography is scaled for high density. Line heights are kept tight to allow more information to be visible on a single screen. For mobile devices, display and large headline sizes are aggressively stepped down to prevent overflow in multi-column dashboard layouts.

## Layout & Spacing
The layout follows a **Fluid Grid** model optimized for ultra-wide displays and multi-monitor setups. 

- **Grid**: A 12-column grid system with 16px (1rem) gutters. 
- **Density**: A tight 4px base unit controls all internal component padding to maximize data visibility.
- **Breakpoints**: 
  - **Desktop (1280px+)**: Full 12-column dashboard view with permanent sidebars.
  - **Tablet (768px - 1279px)**: 8-column grid; sidebars collapse into a rail or drawer.
  - **Mobile (0px - 767px)**: 4-column fluid layout; modules stack vertically with reduced side margins (16px).

## Elevation & Depth
Depth is created through **Glassmorphism** rather than traditional shadows. This maintains the "cockpit" feel where elements appear as overlays on a digital glass canopy.

- **Base Layer**: Deep Slate-950 background.
- **Surface Layer**: `bg-slate-900/40` with a `backdrop-blur-sm` (4px to 8px blur) and a 1px solid border of `slate-800`.
- **Floating Layer**: Popovers and modals use `bg-slate-800/60` with `backdrop-blur-md` and a subtle inner-glow (1px stroke of `white/10`) to separate them from the background modules.
- **Signals**: Do not use depth; they are treated as luminous, flat overlays that "glow" through color intensity rather than shadow.

## Shapes
The shape language balances the rigid nature of data with the "softness" of modern glass interfaces.

- **Cards/Modules**: All primary containers use **2xl (1.5rem / 24px)** corner radii.
- **Interactive Elements**: Buttons and inputs use the system default **Rounded (0.5rem / 8px)** to differentiate "active" controls from "passive" containers.
- **Status Indicators**: Circular shapes are reserved for pulsing status indicators to ensure they stand out against the geometric grid.

## Components
- **Command Cards**: Utilize `rounded-2xl`, glass backgrounds, and 1px borders. Headers should include a `data-mono` subtitle for technical context.
- **Buttons**:
  - *Primary*: Cyan background with black text for maximum contrast. 
  - *Ghost*: Transparent with Cyan border; 1px width.
- **Pulsing Indicators**: Small 8px circles with a CSS animation: `animate-ping` with a 2-second duration. Green for "Nominal," Cyan for "Active," and Rose for "Anomaly."
- **Input Fields**: Dark backgrounds (`slate-950/50`) with `slate-800` borders. Focus state transitions the border to Cyan with a subtle outer glow.
- **Shimmer Skeletons**: Use a linear gradient animation from `slate-800` to `slate-700` to `slate-800` moving at a 45-degree angle.
- **Data Tables**: Minimalist borders (bottom-only). Rows use a subtle highlight on hover (`white/5`) to assist with tracking across dense data points.
- **AI Tooltips**: Floating glass elements with Cyan accents, using a "light-beam" top border (2px Cyan) to indicate AI-originated content.