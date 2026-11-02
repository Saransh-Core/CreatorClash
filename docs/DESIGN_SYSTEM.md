# Creator Clash — Design System

**Direction:** Premium Dark Editorial × Immersive 3D × Competitive Energy.  
**Status:** Applied in the frontend foundation; continue validating contrast, hierarchy, and motion in product review.

## Principles

Editorial clarity, asymmetric compositions, generous whitespace, purposeful structure, restrained competitive energy, dimensional objects at focal moments, and meaningful motion. Avoid generic SaaS/esports templates, repetitive card grids, excess glow, and broad gradients. Competition, identity, and actions remain understandable in semantic HTML without WebGL.

## Applied color tokens

| Token | Value | Use |
| --- | --- | --- |
| Canvas | `#0B0A10` | Main background |
| Surface | `#121019` | Grouped content |
| Elevated surface | `#191622` | Inputs and raised surfaces |
| Primary violet | `#9565F5` | Focus, links, active states |
| Hover violet | `#A982FF` | Highlight and hover |
| Lavender | `#C6A8FF` | Secondary focal accent |
| Primary text | `#F5F3FA` | Main copy |
| Secondary text | `#A6A0B2` | Supporting copy |
| Border | `#302B3A` | Dividers and outlines |
| Success | `#38C98B` | Positive status |
| Warning | `#E9B65C` | Caution/upcoming |
| Danger | `#EF6262` | Error/destructive status |

Typography uses an Inter/system sans stack and editorial display stack with system fallback. JetBrains Mono/SFMono/Consolas fallback is reserved for timers, IDs, scores, and numerical details. The spacing scale uses 8px increments and fluid page spacing. No externally hosted font is required for the initial render.

## Layout and responsive composition

- Public pages use a wide editorial container with asymmetric hero/feature layouts and lightweight section dividers.
- Creator and Community modes share a responsive workspace shell but have independent route navigation and page content.
- At compact width, public links move into a native disclosure menu; workspace navigation becomes a keyboard-operable expandable menu.
- Data rows remain horizontally readable; tables use an overflow container; competitions, profiles, and creator discovery recompose instead of merely shrinking.
- Reduced-motion preferences disable nonessential animation and WebGL scenes.

## Component language

Reusable primitives include buttons, icon buttons, fields, page headings, demo notices, status/demo badges, panels, avatars, stat blocks, empty states, responsive navigation, activity voting, battle rows, transactions, milestone progress, and charts. Interactive controls use semantic HTML and visible focus states. Demo-only behaviors are labelled in page copy and action feedback.

## Motion system

| Token | Value | Use |
| --- | --- | --- |
| Instant | 100ms | press acknowledgement |
| Fast | 160ms | hover/focus |
| Standard | 240ms | menu/tab/control transition |
| Emphasis | 400ms | composed entrances |
| Standard easing | `cubic-bezier(0.2, 0.8, 0.2, 1)` | typical transition |
| Enter easing | `cubic-bezier(0.16, 1, 0.3, 1)` | entrance |

Motion for React is the primary DOM animation library. Motion is currently used for the landing hero entrance; CSS handles restrained control and composition transitions. Extend motion to meaningful state changes only. Native scrolling is preserved; no Lenis/GSAP is installed. Respect `prefers-reduced-motion` globally.

## 3D art direction

Procedural R3F scenes provide an abstract two-sided arena, dimensional trophy, and metallic coin: low-complexity geometry, controlled violet/cool lighting, restrained particles, smoothed composition response, and deliberately layered ambient motion. Paired arena forms counter-rotate and breathe subtly; the center mark and stage ring animate at a slower cadence; the trophy has restrained halo orbits; and the coin floats with small orbital details. Motion stays concentrated on focal objects rather than every element. The hero scene is lazily imported, near-viewport gated, capped in DPR, disabled for reduced motion and compact viewports, and layered over CSS artwork. Canvas is decorative and pointer-transparent. Key data and actions stay in HTML. No external model/image dependency is required.

Next refinements: profile-specific dimensional artwork, battle stage camera/composition, context-loss recovery, low-tier capability detection, geometry/material reuse review, and measured GPU/CPU profiling. Do not add 3D to dense settings, tables, or routine statistics.

## Accessibility and quality review

Semantic landmarks, skip links, visible keyboard focus, explicit input labels, touch-sized actions, and reduced-motion support are foundations. Continue contrast checks for small metadata and test screen reader announcements, keyboard flows, modal behavior, zoom, and narrow screen layouts. Inspect desktop/tablet/mobile pages and every status/empty/error/disabled state.
