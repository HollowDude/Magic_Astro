# OpenCode Instructions: Maggy Flowers

## Tech Stack
- **Frontend:** Astro 6 (SSR Mode), React 19 (for islands), TypeScript (Strict).
- **Styling:** Tailwind 4 (using `@theme` in `src/styles/global.css`), Material Symbols (Rounded & Outlined).
- **Backend:** Drupal 10/11 Headless (JSON:API, OAuth2).
- **Data:** `jsona` for JSON:API deserialization.

## Architecture & Conventions
- **I18n:** 
  - Routing: Astro i18n config. `/` (ES), `/en/` (EN).
  - Drupal: Prefix URLs with `/en` for English JSON:API requests (handled by `drupalFetch` in `src/services/drupal/drupal.client.ts`).
  - UI: Use dictionary in `src/i18n/ui.ts`.
- **Components:**
  - UI: Stateless components in `src/components/ui/`.
  - Design Tokens: Strictly use Tailwind classes or CSS variables defined in `@theme`.
  - Icons: Use `.material-symbols-outlined` or `.material-symbols-rounded` classes.
- **Authentication:**
  - SSR-based using `src/services/session.service.ts`. 
  - Sessions stored in `mf_session` HTTP-only base64 cookies.
  - **Security:** Never store JWT/Secrets in `localStorage`.
- **Data Fetching:**
  - Use `drupalFetch` for all Drupal requests.
  - Use `drupal-jsonapi-params` for query building.
  - Always deserialize with `jsona` before passing to components (see `drupal.commerce.ts`).

## Developer Workflow
- **Dev Server:** `npm run dev` (Port 4321).
- **Build:** `npm run build`.
- **Environment:**
  - `DRUPAL_BASE_URL`: Backend endpoint.
  - `DRUPAL_DEFAULT_LANG`: Usually `es`.
  - `SESSION_MAX_AGE`: Session duration.

## Critical Constraints
- **Styling:** No magic numbers. Follow `src/styles/global.css` tokens.
- **Paths:** Always use `@/` alias for `src/`.
- **Hydration:** Use `client:load` or `client:visible` only when interactivity is required.
- **Images:** Prefer Astro's `<Image />` for Drupal-hosted assets.
