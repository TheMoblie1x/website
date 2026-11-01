# TakeMyTest brand template

**Idea:** the colour of trust. Blue and black, nothing else. The product handles people's
careers and exam integrity, so it should feel calm, exact and credible, never playful.

## Colour

| Role | Token | Hex | Use |
|---|---|---|---|
| Ink (black) | `ink` | `#0B1220` | Headings, body text, dark bars, logo mark |
| Trust blue (primary) | `brand-600` / `accent` | `#1558D6` | Primary buttons, links, selected tabs, switches, charts |
| Blue hover | `brand-700` / `accent-hover` | `#1145AE` | Hover and pressed states |
| Blue tint | `brand-50` / `accent-soft` | `#EFF5FF` | Selected backgrounds, soft panels |
| Blue line | `brand-200` / `accent-line` | `#BFD6FD` | Borders on tinted panels |
| Dark blue | `brand-800` | `#12398A` | Text on tints, deep accents |
| Neutrals | `slate-50 … slate-900` | Tailwind slate | Surfaces, borders, secondary text |
| Alert (only exception) | `red-600` | Tailwind red | Errors, rule violations, destructive actions |

Contrast: ink on white is 18:1; brand-600 on white is 6.0:1 (AA for body text).

### Rules
1. One primary action per screen, in `bg-accent`. Secondary actions are white with a slate border.
2. Colour never carries meaning alone. Pair it with an icon, label, shape or pattern.
3. Red is for things that are wrong or dangerous. It is not decoration and not "unanswered".
4. No other hues. `index.css` remaps Tailwind's emerald/purple families to the brand blue and
   amber to slate, so a stray `emerald-600` still renders on-brand. Prefer the `accent` and
   `brand-*` tokens in new code.

### Status encoding (question matrix, charts)
| State | Treatment |
|---|---|
| Answered | Solid blue |
| Marked for review | Solid ink (black) |
| Answered and marked | Blue/ink diagonal stripes |
| Visited, unanswered | White, dashed slate border |
| Not visited | Light slate |
| Pass / Fail / Malpractice (charts) | Blue / slate / red |

## Type
Plus Jakarta Sans (fallback Inter, then system). Body 14-16px, line-height 1.5.
Headings semibold/bold with slightly tight tracking. Numbers in timers and tables use
`tabular-nums`.

## Logo
Ink rounded square with a blue check, then the wordmark **Take**`MyTest` (ink + blue).
Component: `src/components/BrandMark.tsx`. On dark surfaces pass `onDark`.

## Tenant (white-label) colours
Companies can set their own colours for the candidate-facing experience (Branding tab).
That is customer content and is exempt from this palette. The platform's own screens
(admin, login, emails sent by the platform) always use the colours above.
