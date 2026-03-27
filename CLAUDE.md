# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Volt Theme** — custom Shopify theme built on Dawn 15.4.1 for an electronics/tech store.
- Store: `volt-techh.myshopify.com`
- Currency: PHP (₱)
- Built-in apps: Judge.me (reviews)

## Development Commands

```bash
# Local development server (hot-reloads to connected store)
shopify theme dev

# Lint Liquid files
shopify theme check

# Push theme to store
shopify theme push
```

Prettier auto-formats `.js`, `.css`, `.liquid` on save via `.vscode/settings.json`. CI runs Theme Check + Lighthouse audits on every push (`.github/workflows/ci.yml`).

## Architecture

### Core Principles (Dawn)
- **Server-rendered first**: All HTML via Liquid. Business logic stays server-side.
- **JS only as needed**: Progressive enhancement — vanilla JS, custom elements, no jQuery/polyfills.
- **Conditional loading**: Assets load only when the section/feature is used (e.g., `animations.js` loads only if `settings.animations_reveal_on_scroll` is on).

### File Layout
- `layout/theme.liquid` — Master HTML shell: skip link, page loader, toast container, compare bar, font loading, core script order, `content_for_header` hook.
- `sections/` — 52 customizable page sections (settings schema at bottom of each file).
- `snippets/` — 37 reusable partials (cards, media, forms, localization).
- `templates/` — JSON templates composing sections onto pages; `gift_card.liquid` is the only non-JSON template.
- `assets/` — 64 CSS files + 26 JS files, loaded on demand per section/component.
- `config/settings_schema.json` — All merchant-facing theme settings.

### Design System (`assets/volt-base.css`)
All Volt design tokens as CSS custom properties. Dark mode via `[data-theme='dark']` attribute on `<html>`.

| Token | Value |
|---|---|
| `--volt-blue` | `#0066ff` (primary) |
| `--volt-cyan` | `#00d4ff` (accent) |
| `--volt-bg` | `#f8f9fa` |
| `--volt-dark` | `#0a0a0a` |
| `--volt-font-display` | Syne 800 |
| `--volt-font-body` | Inter |
| `--volt-font-mono` | JetBrains Mono |
| `--volt-radius` | `0px` (sharp/technical) |

Dark mode tokens are prefixed `--volt-dm-*`. Dawn's global styles live in `assets/base.css`; Volt tokens layer on top.

### CSS Conventions
- All custom classes prefixed `volt-` (e.g., `.volt-header`, `.volt-header__inner`)
- Dawn components: `component-*.css`; Dawn sections: `section-*.css`
- BEM naming throughout; Dawn overrides scoped carefully to avoid conflicts

### JavaScript Patterns
- **PubSub event bus** (`pubsub.js`): inter-component events — `cartUpdate`, `quantityUpdate`, `variantChange`, `cartError` (constants in `constants.js`).
- **View transitions**: DOM updates via `HTMLUpdateUtility` double-buffer pattern.
- **Debouncing**: 300ms `ON_CHANGE_DEBOUNCE_TIMER` for input handlers.

### Header (`sections/header.liquid`)
Fully custom Volt component (~1400 lines), not Dawn's original header:
1. Announcement bar — dismissible, block-based, multiple items
2. Logo — custom "VOLT" branding
3. Main nav — **mega menu** triggered by nested links in `linklists[section.settings.menu]`, multi-column dropdowns with IDs `mega-{{ forloop.index }}`
4. Actions — search toggle, wishlist (badge, `volt-wishlist.js`), cart (count bubble), mobile hamburger, dark mode toggle

All interactive elements use `aria-expanded`, `aria-haspopup`, `aria-controls`.

## What's Built

| Asset | Description |
|---|---|
| `assets/volt-base.css` | Design tokens, buttons, cards, badges, spec table, accessibility helpers |
| `assets/volt-wishlist.js` | localStorage wishlist with toast notifications |
| `assets/volt-compare.js` | Product comparison (up to 3 items) with floating bar |
| `sections/header.liquid` | Mega menu, predictive search, dark mode toggle, ARIA |

## What Still Needs Building

1. ~~`sections/hero.liquid`~~ — **Done**
2. `sections/featured-products.liquid` — Dark product grid
3. `sections/footer.liquid` — Newsletter + links + payment icons
4. `sections/main-product.liquid` — Spec table (metafields), Judge.me reviews, sticky ATC, subscription UI
5. `sections/main-collection.liquid` — Filters, sort, view toggle
6. `sections/main-cart.liquid` — Cart page
7. `snippets/cart-drawer.liquid` — Section Rendering API cart drawer (no page reload)
8. `snippets/mobile-drawer.liquid` — Mobile menu
9. `snippets/meta-tags.liquid` — SEO meta tags + JSON-LD structured data

## Shopify / App Details

### Metafields
Namespace `specs.*`: `processor`, `ram`, `storage`, `display`, `battery`, `connectivity`, `weight`, `warranty`

### Features to Integrate
- Judge.me reviews (app installed)
- localStorage wishlist (built: `volt-wishlist.js`)
- Product comparison up to 3 items (built: `volt-compare.js`)
- Section Rendering API for cart
- Sticky ATC bar (appears when scrolling past ATC button)
- Subscription product UI
- Recently viewed products via localStorage
- Back-in-stock email form

## Git Workflow
- `main` — production
- `develop` — integration
- `feature/*` — individual features

## Updating Dawn Base

```bash
git remote add upstream https://github.com/Shopify/dawn.git  # first time only
git fetch upstream && git pull upstream main
# Resolve conflicts carefully — volt-base.css and sections/header.liquid are fully custom
```
