# Cognigy Webchat — project guide for Claude

`@cognigy/webchat` is a React 18 chat widget (Webpack 5, Emotion CSS-in-JS, Redux Toolkit). It consumes `@cognigy/chat-components` for message renderers and orchestrates them (focus, live regions, state). Tests are **Cypress** end-to-end (no Jest/Vitest).

## Accessibility is non-negotiable

**All UI code in this repo must meet [WCAG 2.2](https://www.w3.org/TR/WCAG22/) Level AA.** When you write or modify any component, control, dialog, input, or markup, apply this checklist before you finish:

- **Semantic HTML first.** Use `<button>`, `<a href>`, `<ul>/<li>`, headings, etc. Reach for ARIA only when native semantics are insufficient — and never use ARIA that contradicts the element.
- **Follow the W3C ARIA APG.** For any recognizable widget (dialog, menu, button, disclosure, carousel, listbox, grid, tooltip, alert), implement the keyboard interaction and ARIA roles/states from the matching [APG pattern](https://www.w3.org/WAI/ARIA/apg/patterns/). The `wcag-component` skill links each pattern.
- **Accessible name on every interactive element.** Prefer visible text; otherwise `aria-label`/`aria-labelledby`. Honor `customTranslations.ariaLabels` (configurable strings) — don't hardcode user-facing aria text.
- **Full keyboard operability.** No mouse-only handlers — anything with `onClick` on a non-native element needs key handling and a role, or (better) use a real `<button>`. Provide a visible focus indicator via `:focus-visible`. Keep tab order logical.
- **Focus management.** On open, move focus into the new surface; on close, restore it to the trigger. Trap focus only in modals, and make it escapable (Esc). Use the existing helpers below.
- **Color contrast** ≥ 4.5:1 for normal text, ≥ 3:1 for large text and UI component/state indicators.
- **Respect `prefers-reduced-motion`** for animations/transitions.
- **Target size** ≥ 24×24 CSS px for pointer targets (WCAG 2.2 SC 2.5.8).
- **Focus not obscured** (SC 2.4.11) — focused elements must not be hidden behind sticky headers/overlays.
- **Images** need `alt` (empty `alt=""` for decorative); decorative icons get `aria-hidden="true"`.

## Reuse these — don't reinvent

- **Focus discovery / trap:** `getKeyboardFocusableElements` — `src/webchat-ui/utils/find-focusable.ts` (returns `{ firstFocusable, lastFocusable, focusable }`, skips `disabled`/`aria-hidden`).
- **Screen-reader announcements:** `ScreenReaderLiveRegion` (`aria-live="polite"`) — `src/webchat-ui/components/presentational/ScreenReaderLiveRegion.tsx`; text extraction helpers in `src/webchat-ui/utils/live-region-announcement.ts` (`extractTextForScreenReader`, `getTextFromDOM`, `cleanUpText`). For interrupt-worthy status, `aria-live="assertive"` (see `ChatEvent` in chat-components).
- **Visually-hidden text:** the `.sr-only` class — `src/assets/style.css`.
- **Show/hide an off-screen region:** the tabindex-toggling pattern in `src/webchat-ui/components/presentational/HomeScreen.tsx` (set focusable children `tabindex=0` when visible, `-1` when hidden; `aria-hidden` on the root).
- **Open/close focus orchestration:** `src/webchat-ui/components/WebchatUI.tsx` (focus moves to first focusable on open; refs restore focus on close).

The `wcag-component` skill (`.claude/skills/wcag-component/`) has detailed, copy-paste recipes per component type — use it when building/editing UI.

## Boundary: Webchat vs. chat-components

Message **renderers** (text, image, gallery, list, datepicker, buttons, …) live in the `@cognigy/chat-components` package ([Cognigy/chat-components](https://github.com/Cognigy/chat-components)), not here. If an a11y issue is inside a renderer's internals, the fix likely belongs **upstream** in that repository — call that out rather than patching around it in Webchat.

## Definition of Done for UI changes

1. Passes `npm run lint:a11y` (jsx-a11y, WCAG 2.2 AA static rules).
2. New/changed UI surfaces have a `cy.checkA11yCompliance("[data-cognigy-webchat-root]")` assertion in the relevant feature spec's `Accessibility (WCAG 2.2 AA)` describe block (co-located with the feature, e.g. `cypress/e2e/homeScreen.cy.ts`). This runs axe in a real browser, covering contrast + ARIA.
3. The a11y pattern is reflected in `docs/accessibility.md` if it's new.

## Other useful commands

- `npm run lint` — full ESLint (a11y rules are errors).
- `npm run lint:a11y` — a11y-only gate (errors); what CI blocks on.
- `npm test` — Cypress E2E (Chrome). `npm run dev` — dev server on :8787.
