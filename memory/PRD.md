# Soon Places - PRD

## Original Problem Statement
Recrear una página con burbujas interactivas tipo esferas de cristal con imágenes de lugares. Click en las burbujas produce efecto blur motion. Título: "Soon Places". Estilo landing page visual vertical mobile-first.

## Architecture
- **Frontend**: React + Tailwind + Framer Motion
- **Backend**: FastAPI (minimal, health check only)
- **Database**: MongoDB (not actively used for this landing page)

## User Personas
- Visual/design enthusiasts
- Travel lovers
- General audience discovering places

## Core Requirements (Static)
- [x] Interactive glass sphere bubbles with real place images
- [x] Blur motion effect on bubble click
- [x] "Soon Places" title in Anton bold font
- [x] White background, clean aesthetic
- [x] Mobile-first vertical layout
- [x] Masonry 2-column grid with offset
- [x] Glass overlay with specular highlights
- [x] Place name labels on hover
- [x] Staggered entrance animations
- [x] Scroll hint at bottom

## What's Been Implemented (Feb 2026)
- Landing page with 12 glass sphere bubbles (Paris, Tokyo, Bali, Portugal, New York, Alps, Kyoto, Maldives, Amsterdam, Shibuya, London, Istanbul)
- Glass sphere CSS effects: radial gradient overlay, rim light, specular highlights
- Blur-jump CSS keyframe animation on click (800ms)
- Framer Motion entrance animations with staggered delays
- Anton font for title, Manrope for body text
- Masonry 2-column layout with 40px right column offset
- Responsive design (max-width: 520px, mobile-first)

## Prioritized Backlog
- P1: Add more destinations/categories
- P1: Add click-to-expand modal with place details
- P2: Add search/filter functionality
- P2: Backend API for dynamic place management
- P3: User favorites/bookmarks
- P3: Share functionality
