# Landing Page Overview (Current Implementation)

This document reflects the **current landing page functionality and aesthetic** implemented in this repo (not a hypothetical design spec).

---

## Project context (landing page)

**Product**: BinPacker Cloud App (3D bin packing optimization for logistics / transportation).  
**Goal of landing page**: communicate value quickly and convert users into authenticated users who can access the optimizer (“BinPacker Algorithm”).

---

## Tech + styling approach (current)

- **Frontend**: React + TypeScript
- **Auth**: Firebase Authentication (Google sign-in + Email/Password)
- **Styling**: Tailwind via CDN + a few custom CSS helpers (glow + grid)

Where this is configured:
- **Tailwind + Inter font + helpers**: `frontend/public/index.html`
  - Tailwind CDN: `https://cdn.tailwindcss.com`
  - Font: Inter (Google Fonts import)
  - Helpers: `.glow-shadow`, `.text-glow`, `.bg-grid-pattern`

---

## Landing page composition (current)

Primary entry:
- `frontend/src/components/LandingPage.tsx`

Landing sections/components (in order):
- `frontend/src/components/frontGoogle/Header.tsx`
- `frontend/src/components/frontGoogle/Hero.tsx`
- `frontend/src/components/frontGoogle/Features.tsx`
- `frontend/src/components/frontGoogle/ValueProps.tsx`
- `frontend/src/components/frontGoogle/AuthSection.tsx`
- `frontend/src/components/frontGoogle/Footer.tsx`

The landing page uses a simple `scrollTo(id)` that smooth-scrolls to section IDs:
- `features`
- `benefits`
- `auth`

---

## Aesthetic / visual identity (current)

**Overall feel**: dark, subtle, “premium” SaaS style.

High-level visual rules (as implemented):
- **Background**: slate/dark (`bg-slate-900`) with a faint **grid pattern** behind everything.
- **Primary accent**: cyan for CTAs and highlights (`bg-cyan-500`, `text-cyan-400`, `border-cyan-500/20`).
- **Secondary accent**: purple for secondary CTA border (`border-purple-500`).
- **Motion**: short “fade in” hero text animations + hover scale on cards/buttons.
- **Glow**: cyan glow shadow on primary buttons (`glow-shadow`) + subtle text glow (`text-glow`).

---

## Functionality by section (what the user can do)

### Header (sticky) — `Header.tsx`

**Visible elements**
- **Logo image** (left)
- **Nav buttons** (desktop): “Features”, “Benefits”
- **Auth button** (desktop + mobile): changes by login state

**Interactions**
- “Features” → scrolls to section id `features`
- “Benefits” → scrolls to section id `benefits`
- Auth button:
  - **Logged out**: label **“Login”** → scrolls to section id `auth`
  - **Logged in**: label **“Log out”** → signs out (Firebase) via the parent callback

**Logo customization (implemented)**
- File expected at: `frontend/public/brand-logo.png` (URL `/brand-logo.png`)
- Edit size/position inside `Header.tsx`:
  - `heightPx` (pixels)
  - `offsetXPct`, `offsetYPct` (translate in %)

---

### Hero — `Hero.tsx`

**Visible elements**
- Headline text:
  - “Optimize Your Truck Loading with”
  - Highlighted: **“Cloud-Powered 3D Bin Packing”**
- Subtitle:
  - “Maximize space utilization, ensure EU compliance, and reduce costs with our intelligent collision points algorithm.”
- Two CTA buttons:
  - Primary (left)
  - Secondary (right): “Learn More”

**Interactions**
- Primary CTA is conditional:
  - **Logged out**: **“Get Started Free”** → scroll to `auth`
  - **Logged in**: **“Access your account”** → triggers `onAccessAccount()` (enters the app)
- Secondary CTA:
  - “Learn More” → scroll to `features`

**Hero vertical positioning (implemented)**
- `heroTextOffsetTopPx` in `Hero.tsx` pushes the hero text block down by a pixel amount.

---

### Features — `Features.tsx`

**Section id**: `features`

**Visible elements**
- Section heading: “Core Features”
- 4 feature cards:
  - Intelligent 3D Optimization
  - EU Logistics Compliant
  - Live Optimization Results
  - Easy Data Import

**Interactions**
- Cards have hover animation (scale + border highlight).

---

### Value props / ROI — `ValueProps.tsx`

**Section id**: `benefits`

**Visible elements**
- Section heading: “Proven ROI”
- 3 large metrics with count-up animation:
  - 60%
  - 95%
  - 1000+

**Interactions**
- The numbers animate **when the section becomes visible** (IntersectionObserver).
- Count-up uses `requestAnimationFrame` with easing, and the “1000+” metric is intentionally faster (`durationMs: 650`).

---

### Auth section — `AuthSection.tsx`

**Section id**: `auth`

This section is **inline** on the landing page (not a modal) and has two UI states:

**A) Logged out**
- Google sign-in button
- OR divider
- Email input
- Password input
- Submit button:
  - “Log In” (login mode)
  - “Sign Up” (register mode)
- Toggle button between login/register
- Error banner when Firebase returns an auth error

**B) Logged in**
- “Welcome Back!” + shows the user email
- Buttons:
  - “Access BinPacker Algorithm” → calls `onLoginSuccess()` (enter app)
  - “Log Out” → Firebase sign-out

---

### Footer — `Footer.tsx`

**Visible elements**
- Centered single line:
  - “© 2026 BinPacker Cloud App - Project by Andrei Baban”

**Notes**
- No “API Documentation” / “Health Check” links (removed).

---

## Quick “where to change what”

- **Header logo image + size/position**: `frontend/src/components/frontGoogle/Header.tsx`
- **Hero headline / subtitle / CTA behavior / vertical offset**: `frontend/src/components/frontGoogle/Hero.tsx`
- **Feature card text**: `frontend/src/components/frontGoogle/Features.tsx`
- **Counter speeds/values**: `frontend/src/components/frontGoogle/ValueProps.tsx`
- **Auth UI + copy**: `frontend/src/components/frontGoogle/AuthSection.tsx`
- **Footer text**: `frontend/src/components/frontGoogle/Footer.tsx`
- **Tailwind + glow/grid helpers**: `frontend/public/index.html`




