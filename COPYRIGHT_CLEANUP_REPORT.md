# Copyright Cleanup Report

## Changes completed
1. Removed all bundled Gilmer font files and every local Gilmer `@font-face` / preload reference.
2. Replaced typography with Manrope (OFL 1.1) plus system-font fallback while recreating the outlined headline treatment in CSS.
3. Confirmed the build contains no BYTRIX domain URLs, email addresses, phone numbers, tracking scripts, image URLs, videos, Lottie assets, or footer/legal text.
4. Replaced reference-specific markup hooks such as `data-scroll-section` / `data-scroll-speed` with NOWA-owned motion hooks.
5. Renamed the remaining contact-page class names copied verbatim from reference markup.
6. Removed source comments that described the implementation in relation to the reference site.
7. Preserved NOWA's orange/black design, page structure, Three.js orb, smooth scrolling, text-fill animation and responsive behavior.
8. Applied the requested white scroll-fill treatment to the Product Strategy heading.
9. Fixed anchor-based `LET'S TALK` CTAs so they render as the same visible circular button as the button element.

## Remaining launch checks
- Confirm NOWA owns or is licensed to use the supplied logo artwork.
- Replace placeholder social `#` links with real NOWA profiles.
- Connect the contact form to an owned backend or form provider.
- Review all marketing claims and portfolio/project descriptions for factual accuracy before launch.

This is a technical provenance/cleanup review, not a legal opinion or a guarantee against third-party claims.
