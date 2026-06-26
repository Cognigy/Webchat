---
name: wcag-component
description: Build or modify accessible (WCAG 2.2 Level AA) Webchat UI in this repo. Use whenever creating or editing any React component, control, button, icon button, link, input, textarea, file upload, persistent menu, home screen, header, modal/dialog, overlay, lightbox, tooltip, message renderer, or any JSX/markup — and whenever working on keyboard navigation, focus management, ARIA, screen-reader announcements, live regions, color contrast, or aria-labels. Provides Webchat-specific accessibility recipes and a pre-finish self-check.
---

# Accessible Webchat components (WCAG 2.2 AA)

Apply these recipes when writing or changing UI in `@cognigy/webchat`. The goal is WCAG 2.2 Level AA on every interactive surface. Reuse the existing utilities — do not reinvent them.

## The standard

The normative requirement is the **[WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/)** at **Level AA** (all A + AA success criteria). For a filterable, practical view of every criterion with sufficient techniques, use the **[How to Meet WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/?currentsidebar=%23col_customize&levels=aaa)** (filter to A & AA). WCAG defines _what_ must be true; the APG below defines _how_ to build each widget to satisfy it.

## Follow the W3C ARIA Authoring Practices Guide (APG)

When you build a recognizable widget, implement the **keyboard interaction and ARIA roles/states** exactly as the **[W3C ARIA APG pattern](https://www.w3.org/WAI/ARIA/apg/patterns/)** specifies — it's the canonical source for _how_ a widget must behave. Each recipe below links its APG pattern; open the page for the precise keyboard table before implementing. General conventions: Tab/Shift+Tab move between widgets (one tab stop per composite widget, via roving tabindex), arrow keys move _within_ a composite widget, `Esc` dismisses popups/dialogs, `Enter`/`Space` activate.

Key patterns for Webchat: [Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [Menu Button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) & [Menu](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/), [Button](https://www.w3.org/WAI/ARIA/apg/patterns/button/), [Disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/), [Link](https://www.w3.org/WAI/ARIA/apg/patterns/link/), [Carousel](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/), [Listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/), [Grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/), [Alert](https://www.w3.org/WAI/ARIA/apg/patterns/alert/), [Tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/).

## Existing utilities (always prefer these)

| Need                                | Use                                                                                 | Path                                                                  |
| ----------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Find focusable children / trap      | `getKeyboardFocusableElements(el)` → `{ firstFocusable, lastFocusable, focusable }` | `src/webchat-ui/utils/find-focusable.ts`                              |
| Announce to screen readers (polite) | `<ScreenReaderLiveRegion>`                                                          | `src/webchat-ui/components/presentational/ScreenReaderLiveRegion.tsx` |
| Extract/clean text for announcing   | `extractTextForScreenReader`, `getTextFromDOM`, `cleanUpText`                       | `src/webchat-ui/utils/live-region-announcement.ts`                    |
| Visually-hidden text                | `.sr-only` class                                                                    | `src/assets/style.css`                                                |
| Hide/show an offscreen region       | tabindex-toggling pattern                                                           | `src/webchat-ui/components/presentational/HomeScreen.tsx`             |
| Open/close focus orchestration      | refs + focus-first-on-open                                                          | `src/webchat-ui/components/WebchatUI.tsx`                             |

User-facing aria strings come from `customTranslations.ariaLabels` — read from translations with a sensible fallback; never hardcode.

## Recipes by component type

### Buttons & icon buttons — [APG: Button](https://www.w3.org/WAI/ARIA/apg/patterns/button/)

- Use a native `<button type="button">`. Give icon-only buttons an `aria-label` (from translations). Mark the icon SVG `aria-hidden="true"`.
- Disabled state: prefer `disabled`; if you must keep it focusable for discoverability, use `aria-disabled` and guard the handler.
- Pointer target ≥ 24×24px (SC 2.5.8) — check padding/hit area.

### Links — [APG: Link](https://www.w3.org/WAI/ARIA/apg/patterns/link/)

- Real navigation → `<a href>`. External links: `target="_blank"` + `rel="noopener noreferrer"`, and indicate "opens in new tab" in the accessible name (see the watermark/branding link).
- An `<a>` with no `href` is not keyboard-accessible — use a `<button>` styled as a link instead. Anchors must have content (`jsx-a11y/anchor-has-content`).

### Toggle / header controls (open, close, menu) — [APG: Disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)

- Toggle buttons: `aria-expanded={open}` and, when controlling a region, `aria-controls={regionId}`.
- On open, move focus into the opened surface; keep a ref to the trigger and restore focus to it on close (pattern in `WebchatUI.tsx`).

### Persistent menu (`role="group"`) — action buttons grouped under a visible label

- The persistent menu contains plain action `<button>` elements, **not** `menuitem` children. Use `role="group"` (not `role="menu"`) on the wrapper, with `aria-labelledby` pointing at the visible title heading. Tab moves between the buttons normally — `role="group"` carries no special keyboard model, so don't attach arrow-key handlers. See `src/webchat-ui/components/plugins/input/menu/PersistentMenu.tsx`.
- Example: `<ActionButtonsWrapper role="group" aria-labelledby="persistentMenuTitle">` with `<h3 id="persistentMenuTitle">{title}</h3>`.
- Do **not** use `role="menu"` unless the children carry `role="menuitem"` / `menuitemradio` / `menuitemcheckbox` and you implement the full [APG Menu](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/) roving-tabindex + arrow-key model.

### Inputs / textarea / file upload / speech

- Every field needs a programmatic label (`<label for>` or `aria-label`). See `BaseInput.tsx`.
- File chips: each remove button needs an `aria-label` that names the file (e.g. "Remove file X").
- Speech input: restore focus to the input after start/cancel.
- Avoid `autoFocus` (rule `jsx-a11y/no-autofocus`). When autofocus is genuinely the right UX (e.g. focusing a just-opened modal), do it programmatically via a ref in an effect, or add a justified `// eslint-disable-next-line jsx-a11y/no-autofocus` — don't sprinkle the JSX prop.

### Modals / dialogs / overlays / lightbox — [APG: Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

- Root: `role="dialog"` + `aria-modal="true"` + `aria-labelledby` (the title) or `aria-label`.
- Move focus to the dialog (heading with `tabindex=-1`, or first control) on open.
- Trap focus with `getKeyboardFocusableElements`: on Tab from last → first; Shift+Tab from first → last.
- Esc closes and restores focus to the trigger.
- Background content gets `aria-hidden`/inert while open.

### Hidden / collapsible regions (e.g. home screen) — [APG: Disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)

- When hidden: `aria-hidden="true"` on the root and set all focusable descendants to `tabindex=-1`; when shown, set them back to `0` and move focus in. Pattern: `HomeScreen.tsx`.

### Galleries / carousels — [APG: Carousel](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)

- Provide previous/next controls with accessible names; slides reachable by keyboard; pause control if it auto-rotates (and respect `prefers-reduced-motion`). Gallery renderers live in `@cognigy/chat-components` (see boundary note below).

### Live regions / announcements — [APG: Alert](https://www.w3.org/WAI/ARIA/apg/patterns/alert/)

- New chat messages and status changes must be announced. Use `<ScreenReaderLiveRegion>` (polite) for messages; `aria-live="assertive"` only for interrupt-worthy events. Don't double-announce (guard already-announced ids).

### Message renderers

- These live in `@cognigy/chat-components`. If the a11y gap is in a renderer's internals, fix it **upstream** in that package and bump the dependency — note this rather than patching markup in Webchat.

## Pre-finish self-check (run before you call it done)

- [ ] Every interactive element has an accessible name.
- [ ] Everything operable by keyboard alone; visible `:focus-visible`; logical tab order.
- [ ] Roles/ARIA correct and not contradicting native semantics; no ARIA where native HTML suffices.
- [ ] For any composite widget, keyboard interaction and ARIA match its [APG pattern](https://www.w3.org/WAI/ARIA/apg/patterns/).
- [ ] Focus moves in on open and restores on close; modals trap + Esc.
- [ ] Contrast ≥ 4.5:1 (text) / 3:1 (large text, UI/state); honors `prefers-reduced-motion`; targets ≥ 24×24px; focus not obscured.
- [ ] Images have `alt`; decorative icons `aria-hidden`.
- [ ] `npm run lint:a11y` passes.
- [ ] Added a `cy.checkA11yCompliance("[data-cognigy-webchat-root]")` assertion for the new/changed surface in its feature spec's `Accessibility (WCAG 2.2 AA)` describe block (e.g. `cypress/e2e/homeScreen.cy.ts`).
