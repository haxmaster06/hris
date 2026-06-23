---
name: Nexus Enterprise
colors:
  surface: '#f8f9ff'
  surface-dim: '#ccdbf3'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d5e3fc'
  on-surface: '#0d1c2e'
  on-surface-variant: '#434655'
  inverse-surface: '#233144'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#943700'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#f8f9ff'
  on-background: '#0d1c2e'
  surface-variant: '#d5e3fc'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  gutter: 24px
  container-max: 1440px
---

## Brand & Style
The brand personality is authoritative yet accessible, focusing on clarity, precision, and high-trust interactions essential for human resources management. The design system adopts a **Corporate / Modern** aesthetic, prioritizing information density without sacrificing legibility. 

The visual language is rooted in a "Utility-First" philosophy: every element serves a functional purpose. There is a heavy emphasis on whitespace to prevent cognitive overload during complex data entry and management tasks. The interface should feel stable, predictable, and exceptionally organized.

## Colors
The palette is built on a foundation of neutral grays and a high-contrast primary blue to drive action and hierarchy.

- **Primary (#2563EB):** Used for primary actions, active states, and focus indicators.
- **Background (#F9FAFB):** A cool, neutral gray that provides subtle contrast against white surface elements.
- **Surface (#FFFFFF):** Used for cards, tables, and modal content to elevate information.
- **Semantic Colors:** Success (Green), Warning (Amber), and Danger (Red) are reserved for status indicators and destructive actions, ensuring clear communication of system states.
- **Text:** Primary text should use a deep slate (#1E293B) to ensure AAA accessibility against white backgrounds.

## Typography
The system utilizes **Inter** exclusively to take advantage of its systematic rhythm and high x-height, which is critical for dense data tables.

- **Headings:** Use bold weights (600-700) with slight negative letter spacing to create a grounded, professional feel.
- **Body:** Standardized at 16px for primary reading, with 14px used for secondary metadata and sidebars.
- **Data Display:** Numerical data in tables should utilize tabular num features (monospaced numbers) to ensure vertical alignment in financial columns.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid Grid**. On desktop, content is housed within a 1440px max-width container.

- **Grid:** A 12-column grid system with 24px gutters.
- **Layout Model:** Use a top navigation architecture for primary modules. Dashboard views utilize a "Modular Bento" layout where KPI cards span 3 columns each (4 per row).
- **Detail Drawers:** Contextual information appears in a right-side drawer (width: 480px or 33% of viewport) that slides over the content rather than reflowing the grid, maintaining the user's scroll position.
- **Mobile:** Transition to a single-column stack with 16px horizontal margins.

## Elevation & Depth
The system uses **Tonal Layers** supplemented by extremely subtle shadows to create a sense of organized structure.

- **Level 0 (Background):** #F9FAFB. All base-level canvas elements.
- **Level 1 (Surface):** #FFFFFF. Cards, table rows, and navigation bars. Use a 1px border (#E2E8F0) and no shadow for these elements.
- **Level 2 (Floating/Interactive):** Dropdowns and Hovered Cards. Use a soft, diffused shadow: `0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)`.
- **Level 3 (Overlay):** Drawers and App Launcher. Use a stronger depth shadow: `0 20px 25px -5px rgb(0 0 0 / 0.1)`.
- **Dividers:** Use 1px #F1F5F9 for subtle separation between list items or table rows.

## Shapes
A consistent **10px border radius** is applied across all primary UI components (cards, buttons, input fields).

- **Standard Elements:** Cards, input fields, and buttons utilize the base 10px radius.
- **Checkboxes:** 4px radius for a distinct functional look.
- **Tags/Chips:** Fully rounded (pill-shaped) to distinguish them from actionable buttons.

## Components

### Navigation & Launcher
- **Top Navigation Bar:** Fixed to the top with a white background and a 1px bottom border. Contains the App Launcher icon (left), Global Search (center), and User Profile (right).
- **App Launcher Overlay:** A full-screen or large-modal overlay triggered from the nav. Icons are displayed in a 4 or 6 column grid with large 64x64px icons and bold labels.

### Data & KPI Cards
- **KPI Cards:** White surface with 10px radius. Headline (Label-SM) at the top, primary value (Headline-MD) in center, and a "Trend Indicator" at the bottom using Success or Danger colors.
- **Data Tables:** No outer border. Header row uses a light gray background (#F8FAFC) and Label-MD typography. Rows use #FFFFFF with a subtle hover highlight (#F1F5F9).

### Interactive Elements
- **Buttons:** Primary buttons use #2563EB with white text. Ghost buttons use a 1px #E2E8F0 border. Transitions should be a crisp 150ms ease-in-out.
- **Right-Side Drawer:** Slides in from the right. Header includes a "Close" button and a primary action. Content is divided by 1px horizontal lines.
- **Input Fields:** 1px #D1D5DB border. On focus, the border changes to #2563EB with a 2px blue ring at 20% opacity.

### Forms & Feedback
- **Checkboxes & Radios:** Use Primary Blue for checked states.
- **Status Badges:** Use low-saturation backgrounds (e.g., 10% opacity of the semantic color) with high-saturation text for high readability.