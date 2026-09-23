---
name: Objely Kiosk Human Interface
colors:
  surface: '#faf8ff'
  surface-dim: '#cdd9ff'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2ff'
  on-surface: '#001946'
  on-surface-variant: '#414753'
  inverse-surface: '#1a2f5c'
  inverse-on-surface: '#eef0ff'
  outline: '#717785'
  outline-variant: '#c1c6d6'
  surface-tint: '#005db5'
  primary: '#005bb1'
  on-primary: '#ffffff'
  primary-container: '#0073dd'
  on-primary-container: '#fefcff'
  inverse-primary: '#a9c8ff'
  secondary: '#6441c8'
  on-secondary: '#ffffff'
  secondary-container: '#7e5ce2'
  on-secondary-container: '#fffbff'
  tertiary: '#005fa0'
  on-tertiary: '#ffffff'
  tertiary-container: '#0078c9'
  on-tertiary-container: '#fdfcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#a9c8ff'
  on-primary-fixed: '#001b3d'
  on-primary-fixed-variant: '#00468b'
  secondary-fixed: '#e8deff'
  secondary-fixed-dim: '#cdbdff'
  on-secondary-fixed: '#20005f'
  on-secondary-fixed-variant: '#4f26b1'
  tertiary-fixed: '#d1e4ff'
  tertiary-fixed-dim: '#9fcaff'
  on-tertiary-fixed: '#001d36'
  on-tertiary-fixed-variant: '#00497d'
  background: '#faf8ff'
  on-background: '#001946'
  surface-variant: '#dae2ff'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  body-xl:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 20px
  label-xl:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.375rem
  space-sm: 0.75rem
  space-md: 1.25rem
  space-lg: 1.75rem
  space-xl: 2.5rem
---

## Brand & Style
This design system defines an ergonomic, institutional touch kiosk interface tailored specifically for high-throughput school environments on tablet displays (specifically fixed 11" iPad landscape profiles, 1194x834 viewport). 

The emotional tone balances institutional trust, adolescent approachability, and Apple HIG-inspired clarity. By marrying vibrant, energetic hues with disciplined, calming structural surfaces, the UI reduces anxiety during high-stress moments (such as reporting or recovering lost belongings). The visual aesthetic relies on Modern Glass & Tonal Layering: pristine white elevated cards resting over a soft, tinted foundation (`#F6F8FC`), crisp perimeter micro-borders, tactile hit targets exceeding 52px, and dynamic energetic accents powered by the signature blue-to-purple gradient. Visual clarity, high legibility under varying indoor lighting conditions, and frictionless single-hand or index-finger ergonomics direct every composition.

## Colors
The palette is engineered for vibrant contrast and institutional durability in bright ambient spaces.

- **Primary Brand Accents**:
  - `Primary Blue` (`#087BEA`): Primary interactive cues, confirmations, and active states.
  - `Light Blue` (`#4FA8FF`): Focus rings, progress glow, and secondary badges.
  - `Primary Purple` (`#8D6CF3`): Accent markers, secondary brand weight, and gradient partner.
  - `Light Purple` (`#B49CFF`): Subtle highlights and decorative states.
  - `Objely Signature Gradient`: `linear-gradient(135deg, #087BEA 0%, #8D6CF3 100%)`, reserved for high-impact action buttons, wizard completions, and brand identity marks.

- **Surfaces & Tonal Neutrals**:
  - `Main Background` (`#F6F8FC`): Cool slate-tinted canvas that prevents eye fatigue under fluorescent school lighting.
  - `Surface White` (`#FFFFFF`): Elevated touch tiles, cards, modal sheets, and active form controls.
  - `Soft Selected Blue` (`#EAF4FF`): Active selection fills for large cards, category chips, and selected rows.
  - `Borders & Dividers` (`#E2E8F0`): Clean 1px structural separation without heavy visual clutter.

- **Typography & Content Hierarchy**:
  - `Primary Text / Night Blue` (`#102653`): Deep saturated neutral providing crisp AAA contrast for headlines, values, and primary labels.
  - `Secondary Text / Slate` (`#64748B`): Secondary instructions, metadata, placeholders, and inactive indicator labels.

- **Feedback & Semantics**:
  - `Success Green` (`#22C55E`): Item found confirmation, photo capture success.
  - `Warning Orange` (`#F59E0B`): Duplicate warnings, pending validation.
  - `Error Red` (`#EF4444`): Missing required fields, failed device attachment.

## Typography
Built using **Inter** to mirror the native precision and optical balance of Apple's SF Pro. Sizing is intentionally scaled upward compared to typical desktop interfaces to ensure legibility from standing eye height (40–60cm viewing distance) at the kiosk.

- **Headlines**: Use heavy weights (`700` and `600`) with tight tracking to anchor step headers and call-out questions (e.g., "Quel type d'objet avez-vous perdu ?").
- **Body**: Uses `20px` (`body-xl`) for core instructional prompts and `17px` (`body-lg`) for secondary contextual copy. Text sizes below `14px` are prohibited in core kiosk flows to safeguard accessibility for young students and staff.
- **Labels & Numbers**: Used inside primary touch targets, segment indicator headers, and metadata chips, set with medium or semi-bold weights for rapid glanceability.

## Layout & Spacing
Designed explicitly for a fixed iPad 11" landscape frame (1194px width x 834px height) with hardware containment (zero horizontal/vertical browser scroll within standard wizard flows).

- **Grid Architecture**: 12-column fluid framework constrained within an active container max-width of 1130px, with `2rem` (32px) outer margins and `1.5rem` (24px) gutters.
- **Vertical Zone Allocation**:
  - `Header Zone`: Fixed height of 84px, housing system metadata, brand mark, cancellation, and step transitions.
  - `Body Workspace`: Fixed viewport of 626px with vertical flexbox layouts. Content is centered or structured in balanced multi-column cards.
  - `Bottom Action Bar`: Fixed height of 96px, anchoring large forward/back controls flush to natural resting thumb positions.
- **Hit-Target Discipline**: No interactive touch item may have a footprint smaller than 52px x 52px. Standard selection targets span 110px+ in height to guarantee effortless finger taps without precision aiming.

## Elevation & Depth
Elevation mimics iOS frosted translucent surfaces and clean floating slabs. Depth is communicated through calibrated ambient drop-shadows combined with 1px border lines rather than dark opaque shadows.

- **Level 0 (Flat Canvas)**: `#F6F8FC` baseline background.
- **Level 1 (Card Rest)**: `#FFFFFF` fill with `border: 1px solid #E2E8F0` and `box-shadow: 0 4px 16px -2px rgba(16, 38, 83, 0.05), 0 2px 6px -1px rgba(16, 38, 83, 0.03)`.
- **Level 2 (Interactive Active / Selected)**: `#EAF4FF` fill with `border: 2px solid #087BEA` and `box-shadow: 0 8px 24px -4px rgba(8, 123, 234, 0.15)`.
- **Level 3 (Floating Kiosk Modals / Camera Sheets)**: `#FFFFFF` fill with `border: 1px solid rgba(226, 232, 240, 0.8)` and deep soft ambient elevation `box-shadow: 0 20px 40px -8px rgba(16, 38, 83, 0.12), 0 8px 16px -4px rgba(16, 38, 83, 0.06)`.
- **Level 4 (Sticky Header Glass)**: `background: rgba(255, 255, 255, 0.88)`, `backdrop-filter: blur(20px)`, `border-bottom: 1px solid #E2E8F0`.

## Shapes
The design system embraces Apple-inspired continuous curvature (`roundedness: 2` with explicit hyper-radii for kiosk friendliness).

- **Touch Cards & Hero Tiles**: Fixed `border-radius: 20px` to convey softness, safety, and a distinct modern app surface.
- **Form Fields & Action Buttons**: `border-radius: 12px` to `14px` for tight, structured alignment.
- **Progress Badges & Status Chips**: Pill curvature (`border-radius: 9999px`) to immediately signal non-input state or discrete tags.
- **Icon Enclosures**: 48px to 64px circular or squircle containers with continuous squircle corners (`smooth: 60%`).

## Components

### Kiosk Header & Navigation
- **Structure**: Height 84px, full width, padded horizontally by `2rem`.
- **Brand Lockup**: Left-aligned pin icon (styled in `#087BEA`), "Objely" (`label-xl`, `#102653`), centered dot separator (`#CBD5E1`), followed by "Lycée Jean Moulin" (`body-lg`, `#64748B`).
- **Wizard Nav**:
  - `Cancel Action`: Text button "Annuler" (`label-lg`, `#64748B`, active press state `#102653`).
  - `Back Button`: 52px circular or rounded squircle button (`#FFFFFF`, border `#E2E8F0`) housing a Material Symbols Outlined `arrow_back` icon.
  - `3-Segment Stepper`: Displaying "1. Vos informations", "2. L'objet", "3. Photos". Active segments highlight in `#087BEA` with an animated horizontal pill underline and bold title; completed steps show a green check icon (`#22C55E`); upcoming steps rest in `#64748B`.

### Hero Touch Selection Cards (110px+)
- **Geometry**: Minimum height 110px, `border-radius: 20px`, surface `#FFFFFF`, 1px `#E2E8F0` border.
- **Layout**: Centered or horizontal split featuring 36px Material Symbols Outlined icon in an accent tint squircle, primary category title (`headline-md`), and brief helper count or hint (`body-md`, `#64748B`).
- **States**: 
  - *Pressed*: Scale to `0.98` with immediate haptic-like animation (`100ms ease-out`).
  - *Selected*: Background `#EAF4FF`, border `2px solid #087BEA`, icon tinted in `#087BEA`.

### Touch Inputs & Fields
- **Geometry**: Height 56px (minimum 52px), `border-radius: 12px`, background `#FFFFFF`, border `1.5px solid #E2E8F0`.
- **Typography**: Text styled at `body-xl` (`20px`) with placeholder in `#64748B` to prevent squinting.
- **Focus State**: Border color jumps to `#087BEA` with an outer focus halo `box-shadow: 0 0 0 4px rgba(8, 123, 234, 0.18)`.
- **Integrated Clear Button**: 44px circular tap target with `cancel` icon for rapid reset without relying on external keyboards.

### Buttons & CTAs
- **Primary Kiosk CTA**: Height 60px, padding `0 2.5rem`, `border-radius: 16px`, background `linear-gradient(135deg, #087BEA, #8D6CF3)`, text `#FFFFFF` (`label-xl`). Elevation shadow `0 8px 20px -4px rgba(8, 123, 234, 0.35)`.
- **Secondary CTA**: Height 60px, background `#FFFFFF`, border `2px solid #E2E8F0`, text `#102653` (`label-xl`).
- **Iconography**: 28px Material Symbols Outlined icons aligned with 12px spacing from button copy.

### Camera & Photo Capture Module
- **Live Preview Container**: `border-radius: 20px`, overflow hidden, aspect ratio 4:3, border `2px dashed #CBD5E1`.
- **Capture Trigger**: 80px floating circular button with dual rings (outer white, inner `#087BEA`), creating a native iPad camera trigger affordance.