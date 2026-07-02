# Nhat Binh Footer And Gift Fix Specification

## Overview
- Target file: `src/components/chungdoi-demo.tsx`
- Target route: `/mau-thiep/nhat-binh-do/demo`
- Original route: `https://chungdoi.com/mau-thiep/nhat-binh-do/demo`
- Interaction model: time-driven CSS animation; click opens the gift modal

## Original Measurements
- Footer container: `display: flex`, `width: 329px`, `max-width: 329px`, `padding: 10px 16px`, `text-align: center`.
- Footer text: `font-family: HelveticaNeue, "Helvetica Neue", Helvetica, Arial, sans-serif`, `font-size: 14px`, `line-height: 21px`, `color: rgb(84, 46, 8)`.
- Credit wrapper: `position: absolute`, `bottom: 8px`, `left: 0`, `right: 0`, centered flex layout.
- Credit text: `font-family: "Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif`, `font-size: 14px`, `color: rgb(84, 46, 8)`.

## Gift Envelope Animations
- Envelope body: `envelopeShake 2s ease-in-out infinite`, rotation sequence `0 -> -2.5deg -> 2.5deg -> 0`, repeated at the start and end of the cycle.
- Envelope front: `glowPulse 1.5s ease-in-out infinite`, amber outer glow pulsing between `20px/40px` and `30px/60px` shadows.
- Coins: five independent float animations, durations `3s`, `3.7s`, `2.8s`, `3.3s`, `4s`.
- Sparkles: `sparkle 2s ease-in-out infinite`, with delays `0s`, `0.7s`, `1.4s`.
- Hint text: `hintPulse 2s ease-in-out infinite`, opacity `0.4 -> 1 -> 0.4`.

## Local Fix
- Center the footer with `mx-auto` instead of `self-center`.
- Move the `chungdoi.com` credit to an absolute bottom overlay matching the original.
- Add namespaced `nhat-binh-*` CSS classes and keyframes for the envelope body, glow, coins, sparkles, hint text, and hover state.
