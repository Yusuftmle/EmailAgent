---
name: Aegis V3.0 Precision System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#00687a'
  on-secondary: '#ffffff'
  secondary-container: '#57dffe'
  on-secondary-container: '#006172'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#07006c'
  on-tertiary-container: '#7073ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 72px
    fontWeight: '800'
    lineHeight: 76px
    letterSpacing: -0.04em
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 44px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.03em
  headline-xl:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0em
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  label-bold:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  mono-label:
    fontFamily: Geist Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 20px
  section-gap-desktop: 160px
  section-gap-mobile: 80px
---

## Brand & Style

The design system is built upon the pillars of **Security, Intelligence, and Fluidity**. It targets high-stakes fintech and enterprise AI sectors where trust is the primary currency. The aesthetic is a fusion of **Modern Corporate** reliability and **Glassmorphic** futurism.

The UI should evoke a "Sentinel" mindset: watchful, precise, and sophisticated. We utilize expansive white space (Apple-inspired) to let high-density data breathe, while employing "Bento-grid" layouts to organize complex feature sets into digestible, premium modules. The inclusion of the 'Sentinel' mascot—a geometric, abstract hawk—should be treated with editorial restraint, appearing as a subtle watermark or a sharp, vector-based accent in hero sections.

## Colors

The palette is anchored by **Sapphire Blue (#0f172a)**, used for primary typography and deep-tone backgrounds to establish immediate authority. **Electric Cyan (#06b6d4)** serves as the "Intelligence" accent, reserved for AI-driven insights, active states, and data visualizations.

A tertiary **Indigo (#6366f1)** may be used for secondary calls-to-action to provide a sophisticated bridge between the deep primary and vibrant accent. Neutral shades are strictly cool-toned to maintain a clinical, high-tech atmosphere, avoiding any "muddy" or warm grays.

## Typography

The design system utilizes **Geist** for its technical precision and modern grotesk characteristics. The hierarchy relies on extreme contrast between display headings and body text. 

Display headings must use **heavy weights (700-800)** with **tight tracking (-0.04em)** to create a high-end, editorial impact similar to premium tech marketing. For technical data or "System Status" labels, use Geist Mono to reinforce the developer-friendly, precise nature of the Aegis platform.

## Layout & Spacing

This design system follows a **Fixed-Fluid hybrid grid**. Content is contained within a 1280px max-width wrapper for desktop, centered with generous outer margins. A 12-column grid is used for standard sections, while **Bento-style** grids utilize a 4x4 or 6x6 modular matrix.

Spacing is aggressive; use larger vertical gaps (160px+) between major marketing sections to signify premium quality and prevent information overload. Internal component padding should follow a strict 8px base-unit system (e.g., 8, 16, 24, 32, 48, 64).

## Elevation & Depth

Hierarchy is established through **Glassmorphism** and **Tonal Layering**. Instead of traditional heavy shadows, use:
1.  **Backdrop Blurs:** 12px to 20px blur on semi-transparent white (#FFFFFF80) surfaces.
2.  **Inner Glows:** 1px white semi-transparent borders on cards to simulate glass edges.
3.  **Ambient Shadows:** Very soft, high-spread shadows (e.g., `0 20px 50px -12px rgba(15, 23, 42, 0.08)`) to lift cards off the background.
4.  **Tonal Tiers:** Use the cool gray (#f8fafc) for the background and pure white for the primary content cards to create "flat depth."

## Shapes

The shape language is "Calculated Softness." Standard UI elements (buttons, inputs) use a **0.5rem (8px)** radius. Larger cards and Bento modules should scale up to **1.5rem (24px)** to feel more approachable and modern. Avoid sharp corners except for strictly technical charts or dividers.

## Components

### Buttons
*   **Primary:** Solid Sapphire Blue (#0f172a) with white text. High-contrast, sharp transitions.
*   **AI Action:** Gradient fill from Sapphire to Electric Cyan.
*   **Secondary:** Ghost style with a 1px Sapphire border or simple text with a trailing chevron.

### Glassmorphic Cards
Used in Hero sections. Feature a 1px white stroke (20% opacity), a subtle 16px backdrop blur, and an extremely light Sapphire tint. Use these for high-level statistics or AI status indicators.

### Bento Feature Grid
Rectangular modules of varying spans (e.g., one 2x2 block next to two 1x1 blocks). Each module has a light-gray (#f1f5f9) background and holds a single, clear value proposition or data visualization.

### Input Fields
Flat white background with a 1px #e2e8f0 border. On focus, the border transitions to Electric Cyan with a soft cyan outer glow (0px 0px 0px 4px rgba(6, 182, 212, 0.1)).

### Social Proof Section
Bold, monochromatic logos of partner firms. High-contrast typography ("Trusted by Industry Leaders") using the `label-bold` spec, centered with significant vertical padding.