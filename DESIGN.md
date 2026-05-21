# DESIGN.md — Estagionauta

> Design system for estagionauta.com.br — a platform connecting university students to internship opportunities, mentors, and career tools.

## Brand Identity

**Name**: Estagionauta (estagiário + astronauta)
**Tagline**: Sua missão rumo ao estágio ideal
**Tone**: Aspirational, trustworthy, youthful but professional. Like a supportive mentor who believes in your potential.
**Audience**: Brazilian university students (18-25), digital natives, career-focused, budget-conscious.

The brand metaphor is a **space mission** — the student is an astronaut navigating the universe of career possibilities. This informs the visual language without being childish or over-themed.

---

## Color Palette

### Primary Colors

| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| `--cosmic-indigo` | `245 58% 51%` | `#5B4AE4` | Primary brand color — CTAs, links, focus states |
| `--cosmic-indigo-light` | `245 80% 68%` | `#8B7EF2` | Hover states, secondary accents |
| `--cosmic-indigo-dark` | `245 58% 40%` | `#463AB5` | Pressed states, dark mode primary |

### Accent Colors

| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| `--nebula-violet` | `270 60% 58%` | `#9B59D0` | Gradient endpoints, feature highlights |
| `--aurora-teal` | `174 62% 47%` | `#2DB8A0` | Success states, positive feedback, credits |
| `--solar-amber` | `38 95% 60%` | `#F5A623` | Warnings, badges, premium features |
| `--meteor-rose` | `340 75% 60%` | `#E44D7B` | Destructive actions, urgent alerts |

### Neutral Colors

| Token | Usage |
|-------|-------|
| `--void-950` `#0A0B14` | Deepest background (dark mode) |
| `--void-900` `#111224` | Card background (dark mode) |
| `--void-800` `#1A1B33` | Elevated surfaces (dark mode) |
| `--void-700` `#2A2B47` | Borders (dark mode) |
| `--void-600` `#4A4B6A` | Muted text (dark mode) |
| `--void-400` `#8B8CA8` | Secondary text |
| `--void-200` `#CDCEE0` | Borders (light mode) |
| `--void-100` `#EDEDF5` | Surface (light mode) |
| `--void-50` `#F7F7FC` | Background (light mode) |
| `--void-0` `#FFFFFF` | Card background (light mode) |

### Gradient Recipes

```css
/* Hero / CTA gradient — the signature Estagionauta gradient */
--gradient-cosmic: linear-gradient(135deg, #5B4AE4 0%, #9B59D0 50%, #E44D7B 100%);

/* Subtle card shimmer (used sparingly) */
--gradient-nebula: linear-gradient(135deg, rgba(91,74,228,0.08) 0%, rgba(155,89,208,0.08) 100%);

/* Success / credits */
--gradient-aurora: linear-gradient(135deg, #2DB8A0 0%, #5B4AE4 100%);

/* Dark mode background depth */
--gradient-void: radial-gradient(ellipse at top, #1A1B33 0%, #0A0B14 70%);
```

---

## Typography

### Font Stack

| Role | Font | Fallback | Weight |
|------|------|----------|--------|
| **Headings** | `Space Grotesk` | `system-ui, sans-serif` | 600-700 |
| **Body** | `Inter` | `system-ui, sans-serif` | 400-500 |
| **Mono/Code** | `JetBrains Mono` | `monospace` | 400 |

> **Why Space Grotesk**: Geometric, modern, slightly technical — matches the space theme without being playful. Excellent legibility. Free on Google Fonts.
> **Why Inter**: The gold standard for UI text. Optimized for screens, universally readable. Already widely used.

### Type Scale

| Level | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| `display` | 48px / 3rem | 700 | 1.1 | -0.02em | Hero headlines |
| `h1` | 36px / 2.25rem | 700 | 1.2 | -0.015em | Page titles |
| `h2` | 28px / 1.75rem | 600 | 1.25 | -0.01em | Section titles |
| `h3` | 22px / 1.375rem | 600 | 1.3 | -0.005em | Card titles |
| `h4` | 18px / 1.125rem | 600 | 1.4 | 0 | Subsection titles |
| `body-lg` | 18px / 1.125rem | 400 | 1.6 | 0 | Lead paragraphs |
| `body` | 16px / 1rem | 400 | 1.6 | 0 | Default text |
| `body-sm` | 14px / 0.875rem | 400 | 1.5 | 0 | Secondary text, captions |
| `label` | 12px / 0.75rem | 500 | 1.4 | 0.04em | Labels, badges, overlines |

---

## Spacing & Layout

### Spacing Scale (base: 4px)

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Inline gaps, icon padding |
| `sm` | 8px | Tight component spacing |
| `md` | 16px | Default component padding |
| `lg` | 24px | Section gaps |
| `xl` | 32px | Card padding |
| `2xl` | 48px | Section separators |
| `3xl` | 64px | Page-level spacing |
| `4xl` | 96px | Hero vertical padding |

### Container

- Max width: `1200px`
- Horizontal padding: `16px` (mobile) → `24px` (tablet) → `32px` (desktop)
- Content never touches screen edges

### Grid

- 12-column grid on desktop (≥1024px)
- 2-column on tablet (≥768px)
- Single column on mobile (<768px)
- Gap: `24px`

---

## Components

### Buttons

```
Primary:    bg: --gradient-cosmic, text: white, rounded-xl, px-6 py-3, shadow-md
            hover: brightness(1.1) + translateY(-1px) + shadow-lg
            active: brightness(0.95) + translateY(0)

Secondary:  bg: transparent, border: 1px --cosmic-indigo, text: --cosmic-indigo, rounded-xl
            hover: bg --cosmic-indigo/10

Ghost:      bg: transparent, text: --void-400, rounded-lg
            hover: bg --void-100 (light) / --void-800 (dark)

Destructive: bg: --meteor-rose, text: white, rounded-xl
```

- All buttons: `font-weight: 500`, `transition: all 200ms ease`
- Min height: `44px` (touch target)
- Icon + text gap: `8px`

### Cards

```
Light:  bg: white, border: 1px --void-200, rounded-2xl, shadow-sm
        hover: shadow-md + translateY(-2px)
Dark:   bg: --void-900, border: 1px --void-700, rounded-2xl
        hover: border --void-600

Padding: 24px
Gap between cards: 24px
```

- Cards should feel like they float slightly above the background
- Use subtle `transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1)` for hover

### Badges & Tags

```
Default:  bg: --cosmic-indigo/10, text: --cosmic-indigo, rounded-full, px-3 py-1, text-label
Success:  bg: --aurora-teal/10, text: --aurora-teal
Warning:  bg: --solar-amber/10, text: --solar-amber
Premium:  bg: --gradient-cosmic, text: white (for paid features)
```

### Inputs

```
Default:  bg: --void-50 (light) / --void-900 (dark)
          border: 1px --void-200 (light) / --void-700 (dark)
          rounded-xl, px-4 py-3
          focus: ring-2 --cosmic-indigo/30, border --cosmic-indigo

Placeholder text: --void-400
```

### Navigation

- **Desktop**: Sticky header, glassmorphism background (`backdrop-blur(12px)`), 68px height
- **Mobile**: Bottom navigation bar (4-5 items max), 64px height, safe area padding
- Active state: `--cosmic-indigo` icon + text
- Inactive: `--void-400` icon + text

---

## Iconography

- **Library**: Lucide React (already in use)
- **Size**: 20px default, 16px in compact contexts, 24px in hero/empty states
- **Stroke width**: 1.5px (slightly lighter than default for elegance)
- **Color**: Inherit from text color; accent icons use `--cosmic-indigo`

### Thematic Icons

Use space-themed Lucide icons where natural:
- `Rocket` — launch, start, CTA
- `Star` — favorites, ratings, premium
- `Sparkles` — AI features, analysis
- `Globe` — map, agencies
- `Award` — achievements, milestones
- `GraduationCap` — education, students
- `Briefcase` — internships, careers

---

## Motion & Animation

### Principles
- Motion should feel **weightless** (space theme) — use ease-out curves
- Never block interaction with animation
- Reduce motion for users who prefer it (`prefers-reduced-motion`)

### Transitions

| Element | Duration | Easing | Property |
|---------|----------|--------|----------|
| Button hover | 200ms | ease-out | all |
| Card hover | 300ms | cubic-bezier(0.4,0,0.2,1) | transform, shadow |
| Page transition | 300ms | ease-in-out | opacity |
| Modal enter | 250ms | cubic-bezier(0.16,1,0.3,1) | transform, opacity |
| Modal exit | 200ms | ease-in | opacity |
| Toast slide-in | 400ms | cubic-bezier(0.16,1,0.3,1) | transform |

### Micro-interactions

- **Starfield background**: Subtle particle animation on landing page (existing `Starfield.tsx`)
- **Credits counter**: Number tick animation when credits change
- **Analysis progress**: Pulsing gradient border during AI processing
- **Card entrance**: Staggered fade-up on scroll (Framer Motion, 50ms stagger)

---

## Dark Mode

- **Default mode**: Dark (matches space theme, preferred by young audience)
- Light mode available via toggle
- Use CSS custom properties for all colors — never hardcode
- Dark mode backgrounds should feel like looking into deep space, not just "gray"
- Cards in dark mode: slightly lighter than background with subtle border

---

## Responsive Breakpoints

| Name | Width | Behavior |
|------|-------|----------|
| `mobile` | < 640px | Single column, bottom nav, compact cards |
| `tablet` | 640-1023px | 2-column grid, side navigation collapse |
| `desktop` | ≥ 1024px | Full layout, sticky sidebar, expanded cards |
| `wide` | ≥ 1400px | Max container width, centered |

---

## Accessibility

- Minimum contrast ratio: 4.5:1 (WCAG AA)
- Focus indicators: 2px ring in `--cosmic-indigo` with 2px offset
- All interactive elements: minimum 44x44px touch target
- Semantic HTML: proper heading hierarchy, landmarks, labels
- Keyboard navigation: all features accessible without mouse
- Screen reader: meaningful alt text, aria-labels on icon-only buttons

---

## Do / Don't

### Do
- Use the cosmic gradient sparingly — on hero CTAs, premium badges, key moments
- Let whitespace breathe — students are scanning, not reading essays
- Use illustrations/icons over stock photos where possible
- Make success states feel rewarding (the student just took a step!)
- Keep forms short — students have low patience for forms

### Don't
- Don't overuse the space theme — it's a subtle undercurrent, not a theme park
- Don't use more than 2 gradient instances per screen
- Don't use pure black (`#000`) — use `--void-950` for depth
- Don't use animations that take >400ms — it feels sluggish
- Don't use serif fonts — they feel too formal for this audience
- Don't use rainbow colors or random accent colors — stay within the palette
