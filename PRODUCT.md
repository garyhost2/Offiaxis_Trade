# Product

## Register

product

## Users

General Contractors (GC), Project Managers (PM), and specialty trade workers (electrical, plumbing, HVAC, framing). Used in the field — on a job site, in a truck cab, with dirty gloves, under direct sunlight, under time pressure. Screen time is short, task intent is clear. Users range from solo operators to multi-crew foremen.

## Product Purpose

Offiaxis is a field-first trade management platform. It keeps all project data — schedules, change orders, receipts, time logs, permits, P&L, site notes, and crew details — in one place accessible from a phone. Success means a contractor can pull up what they need, update it, and put the phone away in under 30 seconds.

## Brand Personality

Clean, Fast, Professional. The app should feel like the best tool in the truck — no decoration, just confidence. Information surfaces immediately, actions are unambiguous, and nothing feels like it was designed for a startup marketing site.

## Anti-references

- Generic SaaS: white backgrounds, default blue accents, grids of identical rounded cards. Procore and FieldWire's blandest moments.
- Consumer app aesthetics: pastel palettes, playful rounded fonts, Instagram-style imagery, gratuitous gradients.
- The app should not look like it was built for HR software or a project management SaaS targeting office workers.

## Strategic Design Principles

1. **Field-first legibility.** Text must be readable under direct sunlight on a phone screen with a cracked protector. High contrast is not a nice-to-have.
2. **Glove-friendly targets.** Every tap target ≥ 44×44pt minimum. Primary actions ≥ 56pt height.
3. **One action per screen.** Each screen has a primary action. Everything else is secondary. No visual competition.
4. **Status over decoration.** Color communicates job status, priority, and approval state — not brand expression. Every color token earns its place semantically.
5. **Density when needed.** Contractors read dense info (schedules, budgets, line items). Don't thin it out to look "clean." Density + clarity is the goal.

## Accessibility

- WCAG AA minimum on all text. Prefer 4.5:1+ contrast ratios given outdoor use.
- All interactive elements labeled for VoiceOver/TalkBack (a contractor using assistive tech on a noisy job site is a real user).
- No functionality gated behind hover states — touch-first throughout.
- Reduced motion support (reanimated animations should respect `AccessibilityInfo.isReduceMotionEnabled()`).
