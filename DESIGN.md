# PowerAmp Player Design Brief

## Aesthetic Direction
Dark Navy Brutalist Car Audio Dashboard with Cyberpunk Neon Energy. Industrial precision meets maximalist visual intensity. Designed for control and immersion in a simulated high-powered audio system.

## Differentiation
Neon glow effects on active modules, uppercase badge system (WIRED/OFF/LIVE/STABLE), grid-based control layout with cyan pulses, gold value displays. Zero generic styling — every element has electrical character.

## Palette

| Token | OKLCH | Use |
| --- | --- | --- |
| background | 0.08 0.01 270 | Page base, deep navy |
| card | 0.12 0.02 270 | Module surfaces |
| primary | 0.6 0.2 200 | Cyan accent, primary action |
| secondary | 0.5 0.18 40 | Gold value displays |
| destructive | 0.52 0.19 25 | OFF/inactive states |
| chart-3 | 0.48 0.18 120 | Live/active states |
| foreground | 0.95 0.02 260 | Text, high contrast |

## Typography

| Role | Font | Use |
| --- | --- | --- |
| display | Space Grotesk | Module labels, headers, uppercase UI |
| body | General Sans | Descriptions, values, readability |
| mono | Space Grotesk | Numeric displays, technical readouts |

## Elevation & Depth
Card surfaces at L=0.12, header at L=0.15, backgrounds fade deeper to L=0.08. Neon glow replaces traditional shadows — cyan for active, gold for value emphasis. Border layer at L=0.18 for module separation.

## Structural Zones

| Zone | Style | Purpose |
| --- | --- | --- |
| Header | Card + cyan border-b | Title, app nav |
| Content Grid | Module cards, glow active | 8-icon layout, audio controls |
| Footer | Muted bg, border-t | Meter display, status |
| Module Badge | Inline-block uppercase | WIRED/OFF/LIVE/STABLE states |

## Spacing & Rhythm
Grid 1rem gap, 120px min module width. Badges 0.25rem padding with 0.1em letter spacing. Neon glow 20–40px radius spread. Dense layout reflects dashboard compactness.

## Component Patterns
- **Module Button**: Card + glow-cyan on active + badge-live, transitions smooth
- **Value Display**: Gold text + glow-gold on emphasis
- **Status Badge**: Uppercase 0.7rem, bold 700, live=green, off=red
- **Grid Layout**: Auto-fit 120px columns, 1rem gaps

## Motion
Glow-pulse animation 3s ease-in-out infinite on active modules. Smooth transitions 0.3s on state changes. No bounce — precision industrial feel.

## Constraints
No wave shaper, no bass stacking. All uppercase UI labels. Cyan (#00d4ff) sparingly on interactive, gold (#ffd700) for values. Max 3 active glows at once to preserve legibility.

## Signature Detail
Cyan neon glow pulses 20–30px box-shadow with 60% opacity peak, 30% opacity trough. Creates electric energy on live modules. Paired with uppercase badges (WIRED/OFF/LIVE/STABLE) in 0.7rem bold sans, letter-spaced 0.1em. Total industrial audio precision.
