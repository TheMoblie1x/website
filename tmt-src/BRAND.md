# TakeMyTest brand template

Three brand colours, plus neutrals. Tokens live in `src/index.css`.

| Colour | Hex | Token | Role |
|---|---|---|---|
| **Navy Blue** | `#072D59` | `ink`, `accent`, `brand-900` | Headings and body text, dark surfaces, logo, switches that are on, focus ring |
| **Seal Blue** | `#DBF2FC` | `accent-soft`, `brand-100` | Backgrounds, tints, selected tab, icon tiles, hero gradient |
| **Crimson Pink** | `#FD6E88` | `cta` | The call to action and highlights |

Supporting shades (derived, not new hues): the blue ramp `brand-50 … brand-950` runs from Seal Blue to Navy;
`cta-hover #FE8FA4`, `cta-press #FEB1C0`, `cta-soft #FFE6EC`, `cta-line #FECCD6`, and `cta-text #C73A56`
(pink for text/icons on light backgrounds). Neutrals are Tailwind slate, with `slate-50…300` tinted toward Seal Blue.

**Red** (Tailwind red) is the only extra colour: errors, rule violations, destructive actions. Never decoration.

## The one rule that matters: text on pink is navy, never white
| Pairing | Contrast | Use |
|---|---|---|
| Navy on white | 13.7:1 | Body text, headings |
| Navy on Seal Blue | 11.9:1 | Selected tab, tinted panels |
| **Navy on Pink** | **5.1:1** | **Call-to-action buttons** |
| Navy on Pink (hover, lighter) | 6.3:1 | Hover state |
| **White on Pink** | **2.7:1, fails** | **Never** |
| Pink on Navy | 5.1:1 | Logo word, accents on dark bands |
| Crimson `#C73A56` on white | 5.0:1 | "MyTest" wordmark, check icons on light |
| White on `brand-600` | 6.9:1 | Answered cell, avatar |
| Pink `#FD6E88` icon on white | 2.7:1, fails 3:1 | Use `cta-text` instead |

## Using the colours
1. **One primary action per screen**, pink with navy text: `bg-cta hover:bg-cta-hover active:bg-cta-press text-ink`.
   Secondary actions are white with a slate border. A dark alternative is `bg-ink text-white`.
2. Structure and state are navy: headings, switches that are on (`bg-accent`), links (`text-accent`), focus ring.
3. Backgrounds use Seal Blue tints (`bg-accent-soft`, `slate-50`, hero gradient). Cards stay white.
4. Colour never carries meaning alone. Pair it with an icon, label, shape or border pattern.
5. `index.css` maps Tailwind's emerald and purple onto the blue ramp and amber onto slate, so a stray
   old class still renders on-brand. Prefer `accent`, `cta` and `brand-*` in new code.

### Status encoding (question grid, charts)
| State | Treatment |
|---|---|
| Answered | Solid blue (`brand-600`) |
| Marked for review | Solid pink |
| Answered and marked | Blue with a pink border |
| Visited, unanswered | White, dashed slate border |
| Not visited | Light slate |
| Pass / Fail / Malpractice (charts) | Blue / slate / red |

## Type
Plus Jakarta Sans (fallback Inter, then system). Body 14-16px, line-height 1.5. Headings semibold/bold with
slightly tight tracking. Numbers in timers and tables use `tabular-nums`.

## Logo
Navy rounded square with a pink check, then the wordmark **Take**`MyTest` (navy + crimson).
On dark surfaces: Seal Blue square, navy check, white + pink wordmark. Component: `src/components/BrandMark.tsx`
(pass `onDark`).

## Tenant (white-label) colours
Each company sets its own colours for the candidate-facing screens (Branding tab). That is customer content and is
exempt from this palette. The platform's own screens (landing, sign-in, console, emails sent by the platform)
always use the colours above. Default company colours are Navy `#072D59` with Pink `#FD6E88` as secondary.
Companies that already saved colours in a browser keep their saved values until reset.
