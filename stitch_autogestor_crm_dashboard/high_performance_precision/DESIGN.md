---
name: High-Performance Precision
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#464555'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#3130c0'
  on-tertiary: '#ffffff'
  tertiary-container: '#4b4dd8'
  on-tertiary-container: '#d9d8ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 0.5rem
  sm: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  max-width: 1440px
---

## Brand & Style

This design system is engineered for high-end vehicle dealership management, where clarity, speed, and premium aesthetics are paramount. The personality is authoritative yet unobtrusive, prioritizing the high-value inventory over decorative elements.

The style is **Refined Minimalism**. It utilizes a "Silent UI" approach—where the interface recedes to let product photography and data take center stage. By leveraging generous white space, a controlled color palette, and hyper-precise typography, the system evokes the feeling of a luxury automotive cockpit: functional, sophisticated, and technologically advanced.

## Colors

The palette is anchored in a professional, high-contrast spectrum that ensures legibility and a sense of "clean" luxury.

- **Primary (Indigo):** Used for primary actions, active states, and brand-critical highlights. It signals interactivity and momentum.
- **Secondary (Charcoal):** Reserved for deep headings and high-emphasis text, providing a grounded, authoritative contrast.
- **Surface & Background:** A tiered light-gray system. The global background uses a cool-toned gray (`#F9FAFB`) to make pure white surface cards "pop" with clear separation.
- **Semantic Accents:** Subdued, low-saturation tones for status indicators (e.g., emerald for availability, rose for sold units) to maintain the minimalist aesthetic without sacrificing clarity.

## Typography

This design system relies exclusively on **Inter**, a typeface designed for screens. The typographic hierarchy is built on a tight scale to maintain a "SaaS-native" look.

- **Scale & Contrast:** Large display titles use a tighter letter-spacing and heavier weights to feel "impactful" like luxury branding.
- **Functional Labels:** Secondary information and labels use a reduced font size with increased tracking or uppercase treatment to differentiate from body content without adding visual weight.
- **Readability:** Body text maintains a generous line-height to ensure that dense technical specifications of vehicles are easy to scan.

## Layout & Spacing

The layout utilizes a **12-column fluid grid** for desktop and a **single-column stack** for mobile.

- **Rhythm:** An 8pt grid system (calculated from a 4px base) governs all padding and margins.
- **Structure:** Content is housed in a centered container with a maximum width of 1440px to prevent excessive line lengths on ultra-wide monitors.
- **Breathability:** Generous margins (`40px` on desktop) are used to prevent the UI from feeling "cramped," reinforcing the premium nature of the brand.
- **Safe Areas:** On mobile, side margins shrink to `16px`, and vertical spacing is compressed slightly to maximize screen real estate.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layering** and **Ambient Shadows**.

- **Level 0 (Background):** Gray-50.
- **Level 1 (Cards/Surfaces):** Pure white with a 1px border in Gray-200. No shadow or a very faint `0 1px 2px rgba(0,0,0,0.05)`.
- **Level 2 (Interactive/Floating):** Used for hovered cards or dropdowns. Employs an ambient, diffused shadow: `0 10px 15px -3px rgba(0,0,0,0.04), 0 4px 6px -2px rgba(0,0,0,0.02)`.
- **Depth Markers:** Avoid using shadows to indicate "stacking" of basic UI elements; use borders and subtle background shifts instead. Shadows are reserved for elements that literally sit "above" the interface (modals, tooltips).

## Shapes

The shape language is purposefully soft to contrast with the sharp, technical nature of the automotive industry.

- **Standard Elements:** Use `rounded-lg` (8px) for input fields and small buttons.
- **Surface Containers:** Use `rounded-2xl` (16px) for cards and main content areas to create a modern, approachable container style.
- **Pill Shapes:** Status badges and tags use a fully rounded (pill) radius to distinguish them clearly from interactive buttons.

## Components

### Buttons
- **Primary:** Background Indigo-600, White text. `rounded-xl` (12px). Subtle hover transition: slightly darker background and a soft outer glow.
- **Secondary:** White background, Gray-200 border, Deep Charcoal text. High-precision alignment.

### Cards
- Pure white surfaces. `rounded-2xl` with a subtle Gray-200 border. Content should have at least `24px` of internal padding to maintain the "premium" feel.

### Lists & Tables
- **Table Row:** No vertical borders. Only subtle horizontal dividers (`Gray-100`). 
- **Hover State:** Rows should transition to `Gray-50` on hover to provide clear feedback without heavy visual shifts.
- **Typography:** Table headers are `label-sm` (uppercase, medium-gray) for clarity.

### Badges/Chips
- **Pill-shaped.** Backgrounds are 10% opacity of the status color (e.g., Soft Emerald) with high-contrast text in the same hue at 90% opacity.

### Input Fields
- `rounded-lg` (8px). Height: `44px` for a substantial, tactile feel. Focus state: `2px` indigo border with a `4px` soft indigo shadow (low opacity).

### Vehicle Media Gallery
- Large-radius corners on thumbnails. Use a "ghost" overlay for image count or zoom actions to keep the focus on the vehicle's design.