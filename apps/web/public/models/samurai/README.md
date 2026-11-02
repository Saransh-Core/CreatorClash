# Samurai character asset slot

There is no character model in this directory yet. The homepage currently uses the original static cinematic artwork at `/art/samurai-arena.png` as its graceful visual fallback; it is not a 3D model and has no character animation.

When a licensed, optimized character asset is approved, place the GLB here as `samurai.glb`. The scene integration should be lazy-loaded from `src/components/scenes`, use an existing Three.js dependency, render only while visible, respect reduced motion and mobile performance, and preserve this image fallback on load failure. Target a compressed model and textures suitable for a landing-page scene; do not commit an unlicensed or unoptimized asset.
