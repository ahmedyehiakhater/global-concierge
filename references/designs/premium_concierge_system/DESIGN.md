---
name: Premium Concierge System
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#5e3f3b'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#936e69'
  outline-variant: '#e9bcb6'
  surface-tint: '#c0000c'
  primary: '#b5000b'
  on-primary: '#ffffff'
  primary-container: '#e30613'
  on-primary-container: '#fff5f3'
  inverse-primary: '#ffb4aa'
  secondary: '#725c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed000'
  on-secondary-container: '#6f5900'
  tertiary: '#0059a8'
  on-tertiary: '#ffffff'
  tertiary-container: '#0071d4'
  on-tertiary-container: '#f5f7ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad5'
  primary-fixed-dim: '#ffb4aa'
  on-primary-fixed: '#410001'
  on-primary-fixed-variant: '#930007'
  secondary-fixed: '#ffe07f'
  secondary-fixed-dim: '#edc200'
  on-secondary-fixed: '#231b00'
  on-secondary-fixed-variant: '#564500'
  tertiary-fixed: '#d5e3ff'
  tertiary-fixed-dim: '#a7c8ff'
  on-tertiary-fixed: '#001b3c'
  on-tertiary-fixed-variant: '#004788'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
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
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
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
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

This design system translates the high-touch hospitality of premium airport services into a digital interface. The personality is **professional, welcoming, and efficient**, balancing the urgency of travel with the serenity of a luxury lounge.

The visual style is **Corporate Modern with Tactile Accents**. It utilizes high-quality whitespace and a sophisticated "White Glove" aesthetic—clean, bright surfaces that prioritize legibility and ease of navigation. By moving away from dark themes, the interface evokes a sense of daylight, clarity, and the premium openness of modern international terminals. The goal is to make the user feel prioritized and guided at every touchpoint.

## Colors

The palette is anchored by the signature brand heritage. 

- **Primary Red (#E30613):** Used strategically for primary actions, critical alerts, and brand signifiers. It commands attention without overwhelming the workspace.
- **Secondary Gold (#FFD100):** Utilized for "Premium" or "VIP" indicators, highlighting special features, and providing warmth to the interface.
- **Surface & Backgrounds:** The core background is a crisp White (#FFFFFF), with a very light "Cloud Gray" (#F9FAFB) used for subtle section nesting.
- **Typography & UI:** A deep "Jet Black" (#1A1A1A) provides high-contrast legibility, while "Slate Gray" (#6B7280) handles secondary metadata.

## Typography

The typography system employs a dual-font strategy to balance character with utility.

- **Headlines:** Montserrat provides a geometric, confident, and modern voice. Its bold weights are used for page titles and section headers to reinforce the brand's authoritative yet friendly presence.
- **Body & UI:** Inter is used for all functional text. Its high x-height and neutral character ensure maximum readability for flight details, terms of service, and form inputs.
- **Hierarchy:** Use tight letter-spacing for large headlines to maintain a "premium editorial" feel. For labels and captions, increased tracking and medium weights ensure clarity on smaller screens.

## Layout & Spacing

The layout follows a **Fluid Grid** model based on an 8px square rhythm, ensuring all elements align to a consistent mathematical scale.

- **Desktop:** 12-column grid with 24px gutters. Content is centered in a maximum 1280px container to maintain readability on wide displays.
- **Mobile:** 4-column grid with 16px margins. Elements typically stack vertically to prioritize the flow of information.
- **Rhythm:** Use large vertical padding (64px+) between major sections to evoke a sense of "Lounge Space"—avoiding the cluttered feel of typical budget travel sites. Internal component spacing (e.g., inside cards) should stay tight (16px or 24px) to keep data grouped logically.

## Elevation & Depth

This design system uses **Tonal Layers** combined with **Ambient Shadows** to create a sophisticated sense of hierarchy.

- **Level 0 (Base):** The primary background (#F9FAFB).
- **Level 1 (Cards/Containers):** Pure white surfaces with a very soft, diffused shadow (0px 4px 20px rgba(0,0,0,0.05)). This makes components appear to float slightly above the base.
- **Level 2 (Interaction/Popovers):** Used for dropdowns and active menus. These feature a more defined shadow with a subtle tint of the primary color (rgba(227, 6, 19, 0.08)) to draw the eye.
- **Outlines:** Use 1px borders in a very light gray (#E5E7EB) for input fields and static containers where shadow-based depth is not required.

## Shapes

The shape language is defined by **Medium Roundness (8px)**, striking a balance between corporate precision and welcoming softness.

- **Standard Elements:** Buttons, input fields, and small cards use an 8px radius (`rounded-md`).
- **Large Containers:** Content sections and main feature cards use a 16px radius (`rounded-lg`) to feel more approachable.
- **Interactive Pill:** Small tags, chips, and status indicators use a fully rounded/pill shape to distinguish them from structural UI components.

## Components

- **Buttons:**
    - *Primary:* Solid Marhaba Red with white text. High-contrast, 8px radius.
    - *Secondary:* Marhaba Gold with dark neutral text for "Premium" upgrades or secondary calls to action.
    - *Ghost:* Transparent background with red border/text for low-priority actions.
- **Inputs:** Clean white backgrounds with 1px light gray borders. On focus, the border transitions to Marhaba Red with a subtle 2px soft outer glow.
- **Cards:** White background, 16px corner radius, and level 1 ambient shadow. Use a 4px top-border accent in Gold for "VIP" or "Diamond" tier services.
- **Chips/Badges:** Pill-shaped. Use subtle background tints (e.g., light red or light gold) with high-contrast text for status indicators like "Confirmed" or "On Time."
- **Lists:** Clean, borderless list items separated by light horizontal rules. Use icons with a circular Marhaba Red background to lead the eye through service steps.
- **Travel Specifics:** Custom components for "Booking Progress" steppers and "Flight Info" cards should use bold Montserrat headings and clear Inter data points for instant scannability.