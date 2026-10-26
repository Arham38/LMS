# Design System for the LMS

Follow in every screen without exception.

## Goal
The site must look like it was designed by a human product designer at a real company: calm, confident, slightly editorial. It must NOT look like a generic AI or template site.

## Brand
- Use a `BRAND_NAME` constant (default: `CodeCraft Academy`) and a tagline constant in `src/config/brand.js`.
- One `Wordmark` component: the name in the display font with a small solid square mark.
- No gradients, no clipart, no emoji.

## Forbidden (AI-site hallmarks)
- Purple, blue or pink gradients, gradient text, glowing blobs, glassmorphism, neon shadows.
- Emojis as icons or in headings.
- The same `rounded-2xl` card with a big soft shadow repeated everywhere.
- A centered hero + three icon cards + 'Get started' as the whole page.
- Lorem ipsum and buzzwords: *unleash, elevate, seamless, revolutionize, cutting-edge, empower, unlock your potential*.
- Vague copy. Every sentence must be concrete.
- Inter or Roboto as the only font. Default Tailwind blue anywhere.
- Bouncing, floating, pulsing or looping animations.
- Fake numbers, fake testimonials, fake logos or fake student counts.

## Color Tokens (CSS variables & Tailwind)
- `paper`: `#FAF7F2` (page background)
- `surface`: `#FFFFFF`
- `surface-alt`: `#F3EEE6`
- `ink`: `#14181F` (text)
- `ink-muted`: `#5E6573`
- `line`: `#E7E2D9`
- `line-strong`: `#D3CCBF`
- `primary`: `#12372A` (deep green)
- `primary-hover`: `#0C281E`
- `primary-soft`: `#E3EEE8`
- `accent`: `#D9480F` (burnt orange, sparingly: at most one accent element per screen)
- `accent-soft`: `#FDEBDD`
- `success`: `#2F7D4F` / `success-soft`: `#E8F5EE`
- `warning`: `#B7791F` / `warning-soft`: `#FEF3E2`
- `danger`: `#B42318` / `danger-soft`: `#FEECEB`
- `info`: `#1D5FA6` / `info-soft`: `#EBF2FA`
*No dark mode.*

## Typography (Self-hosted with @fontsource)
- **Display**: Fraunces 600 for H1, H2 and big numbers.
- **UI and body**: Manrope 400/500/600/700.
- **Mono**: JetBrains Mono for code, IDs and transaction numbers.
- **Size scale in px**: 12, 14 (default UI), 16 (body), 18, 20, 24, 32, 44, 60.
- **Line height**: 1.5 for body, 1.15 for headings.
- **Letter spacing**: -0.01em on display.
- **Paragraph max width**: 68ch.
- **Numbers**: Tabular numbers (`tabular-nums`) in tables.

## Shape, Spacing, Depth
- **Spacing grid**: 4px. Public sections: 96px vertical padding desktop, 56px mobile. App pages: 24px gutters.
- **Radius**: 6px for inputs and buttons, 10px for cards and modals. No pill buttons except small status badges.
- **Depth**: 1px borders in the line color, not heavy shadows.
  - Card shadow: `0 1px 2px rgba(20,24,31,.06)`.
  - Popovers / Modals: `0 8px 24px rgba(20,24,31,.12)`.
- **Icons**: `lucide-react`, stroke width 1.5, sizes 16 and 20. Buttons always have a text label next to an icon.

## Component Language
- **Buttons**: primary (green fill), secondary (white with border), ghost, danger. Heights: 36, 40, 44. Visible focus ring. Disabled and loading states (spinner inside the button, width does not jump).
- **Inputs**: label above, helper text below, error text in danger color with an icon. Never use a placeholder as the label.
- **Admin tables**: 44px rows, sticky header, hover row in surface-alt, numbers right-aligned, status badge column, row actions in a kebab menu, skeleton rows while loading, empty state, pagination footer.
- **Badges**: 12px font size, soft background with strong text (e.g. Approved = success-soft background, success text).
- **Destructive actions**: Must open a `ConfirmDialog`. Never use `window.alert`, `window.confirm`, or `window.prompt`.
- **Toasts**: bottom-right, dismiss after 4 seconds, aria-live.
- **Empty states**: one headline, one sentence, one action, in plain helpful language.
- **Skeleton loaders**: match the final layout. No full-screen spinner except the first auth check.
- **Forms**: single column, max width 560px.

## Layouts
- **Public site**: top nav (wordmark left, links, a Login text link, one primary button). Hero is left-aligned with the headline in Fraunces and, on the right, a real course info panel (next batch date, schedule, fee, seats left). Thin horizontal rules between sections. The syllabus is an editorial numbered list (01, 02, 03) instead of icon cards. FAQ as an accordion. Footer with real columns.
- **Student app**: left sidebar 232px (becomes a bottom tab bar on mobile), top bar with course switcher, page title and avatar menu. Content max width 1080px.
- **Admin app**: sidebar 248px grouped as Overview, Teaching, People, Money. Compact stat strip (label, number, small change) instead of big colorful stat cards. Dense tables.

## Copy
- Simple direct English for a Pakistan context: currency as `Rs. 7,000`, JazzCash, Easypaisa, bank transfer, time zone `Asia/Karachi`.
- Short sentences. Buttons are verbs: `Request enrollment`, `Save changes`.
- Errors say what happened and what to do next.

## Motion
- 150 to 200ms ease-out for hover and focus.
- Modals and toasts: 200ms fade with a 4px rise.
- Respect `prefers-reduced-motion`.
- Nothing else moves (no bouncing, looping, floating).

## Accessibility & Responsive
- WCAG AA contrast, visible focus, keyboard-operable menus and modals (focus trap, Esc closes).
- Label on every input, aria-live on toasts, touch targets >= 44px on mobile.
- Responsive breakpoints tested at 360px, 768px, and 1280px.
- Every page has title and meta description.
