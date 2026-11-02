# Creator Clash — Design System

**Direction:** Dark Samurai — Premium Competitive Arena.

## Foundations

| Token | Value | Use |
| --- | --- | --- |
| Background | `#09090F` | Main canvas |
| Secondary | `#101019` | Navigation and inset sections |
| Elevated | `#171725` | Panels and controls |
| Violet | `#9565F5` | Primary actions and active states |
| Electric purple | `#B18AFF` | Focus and selected accents |
| Crimson | `#E94B64` | Competition urgency and destructive states |
| Cyan | `#42C8D9` | Community participation and information |
| Gold | `#E8B45D` | Rewards and achievement |
| Main text | `#F5F2FA` | Primary content |
| Secondary text | `#A7A2B5` | Supporting content |
| Border | `#302B40` | Dividers and quiet outlines |

Use violet sparingly for actions and navigation. Crimson, cyan and gold each carry a distinct meaning. Avoid neon fills and decorative gradients on routine surfaces. Use strong type scale, whitespace and thin borders to establish hierarchy. Components share the CSS custom properties in `apps/web/src/styles/index.css`.

## Layout, motion and accessibility

Public, creator and community experiences share the dark token system while retaining separate navigation and page layouts. Workspaces collapse navigation for narrow screens, use fluid page gutters, and keep controls touch-sized. Focus indicators, semantic landmarks, reduced-motion support and readable contrast are required. Motion should clarify transitions and feedback; avoid persistent movement that competes with content.

## Samurai art and immersive scenes

The original, generated samurai artwork in `apps/web/public/art/samurai-arena.png` is the signature visual for the public hero. A dark overlay preserves text contrast; the art should not be repeated behind cards. This is a static image, not an animated 3D character. The asset integration slot and requirements are documented in `apps/web/public/models/samurai/README.md`. Existing optional Three.js / React Three Fiber scenes are code-split and have CSS fallbacks. Keep scenes decorative, low complexity, responsive to reduced motion, and independent from product state. Do not add further 3D dependencies without a specific product need and performance review.

## Quality checks

Review every route at mobile and desktop widths, keyboard navigation, reduced-motion settings, loading and empty states, and color contrast. Treat the samurai art and 3D scenes as progressive enhancement; core content and controls must remain usable without them.
