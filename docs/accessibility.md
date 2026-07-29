# Accessibility (WCAG 2.2 AA)

Webchat targets **[WCAG 2.2](https://www.w3.org/TR/WCAG22/) Level AA**. Accessibility is part of the Definition of Done for every UI change, and it is enforced by tooling, not left to memory. This page is the single source of truth for how accessibility is built, tested, and reviewed here.

WCAG defines _what_ must be true; for _how_ each widget should behave (keyboard interaction and ARIA roles/states), follow the **[W3C ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/patterns/)**. The `wcag-component` skill and the `a11y-reviewer` agent link the specific patterns relevant to Webchat (dialog, menu, button, disclosure, carousel, listbox, grid, tooltip, alert).

## Definition of Done for UI changes

1. **Static lint passes** — `npm run lint:a11y` (jsx-a11y rules, WCAG 2.2 AA) reports no errors.
2. **Runtime axe assertion added** — the new/changed surface has a `cy.checkA11yCompliance()` assertion in its feature spec (e.g. `cypress/e2e/homeScreen.cy.ts`, `chatOptionsScreen.cy.ts`, `messageInput.cy.ts` — each has an `Accessibility (WCAG 2.2 AA)` describe block). Co-locate the check with the feature it tests; scope it to the widget root `[data-cognigy-webchat-root]`. This runs axe-core in a real browser, so it also catches color-contrast and computed-ARIA issues.
3. **Pattern documented** — if you introduce a new a11y pattern, note it here.

## The two automated gates

### 1. Static: ESLint `jsx-a11y` (catches issues in source/JSX)

- Plugin: `eslint-plugin-jsx-a11y`, the `recommended` ruleset.
- Main config [`eslint.config.mjs`](../eslint.config.mjs) runs the a11y rules as **errors** (`A11Y_SEVERITY = "error"`). The existing codebase has been triaged clean; intentional exceptions carry scoped `eslint-disable` comments with justifications.
- Dedicated config [`eslint.a11y.config.mjs`](../eslint.a11y.config.mjs) runs **only** the a11y rules as errors — this is what CI gates on, independent of unrelated lint debt.
- Commands: `npm run lint` (full ESLint) · `npm run lint:a11y` (a11y-only gate).
- CI: [`.github/workflows/lint.yml`](../.github/workflows/lint.yml) runs `lint:a11y` on every PR as a **blocking** job, plus a non-blocking full lint for visibility.

> The plugin shipped via a warn-first rollout (rules landed as warnings, the codebase was triaged, then promoted to errors). Mark the **Accessibility lint (jsx-a11y)** check as required in `main` branch protection (a repo-admin action) so the gate fully blocks merges.

### 2. Runtime: `cypress-axe` (catches issues in the rendered DOM)

- Command `cy.checkA11yCompliance(selector?)` in [`cypress/support/commands.ts`](../cypress/support/commands.ts) injects axe and checks `wcag2a/2aa`, `wcag21a/aa`, `wcag22a/aa`, and `best-practice` at all impact levels.
- Runs inside the existing Cypress E2E workflows (`cypress.yml`, `-firefox`, `-progressive-rendering`), which already block PRs — so any axe assertion you add gates automatically.
- Because Cypress runs a **real browser**, this is where color-contrast is verified (jsdom-based tools can't). We deliberately do **not** add jest-axe/vitest-axe — there is no unit-test runner in Webchat.

## Reusable accessibility utilities

| Need                                 | Use                                                           | Path                                                                  |
| ------------------------------------ | ------------------------------------------------------------- | --------------------------------------------------------------------- |
| Find focusable children / focus trap | `getKeyboardFocusableElements(el)`                            | `src/webchat-ui/utils/find-focusable.ts`                              |
| Screen-reader announcements (polite) | `<ScreenReaderLiveRegion>`                                    | `src/webchat-ui/components/presentational/ScreenReaderLiveRegion.tsx` |
| Extract / clean text to announce     | `extractTextForScreenReader`, `getTextFromDOM`, `cleanUpText` | `src/webchat-ui/utils/live-region-announcement.ts`                    |
| Visually-hidden text                 | `.sr-only` class                                              | `src/assets/style.css`                                                |
| Hide/show an offscreen region        | tabindex-toggling pattern                                     | `src/webchat-ui/components/presentational/HomeScreen.tsx`             |
| Open/close focus orchestration       | refs + focus-first-on-open                                    | `src/webchat-ui/components/WebchatUI.tsx`                             |
| Modal dialog (card or fullscreen)    | `<Modal variant>` — APG dialog + focus trap + `aria-modal`    | `src/webchat-ui/components/Modal/Modal.tsx`                           |

User-facing aria strings come from `customTranslations.ariaLabels` — read them with a fallback; never hardcode.

### Pattern: modal dialogs (`Modal`, variant-driven)

All modal surfaces build on `src/webchat-ui/components/Modal/Modal.tsx`, which implements the [APG modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) once — `aria-modal="true"`, `aria-labelledby` on the visible title, an Esc handler, and a Tab/Shift+Tab focus trap via `getKeyboardFocusableElements`. The fullscreen variant renders a `div[role="dialog"]` (APG-style): a native `<dialog open>` without `showModal()` has Chromium accessibility quirks where subtree changes inside it (inserted controls, focus on freshly inserted nodes) are not surfaced to screen readers. Pick the variant by what the surface _means_:

- **`variant="card"`** (default) — an inset confirm dialog over a dimmed backdrop (e.g. `DeleteConfirmModal`). Consumers manage initial focus themselves (e.g. `autoFocus` on the safe Cancel action).
- **`variant="fullscreen"`** — the modal represents a blocking state of the whole chat window (e.g. the disconnect overlay). It spans the entire window, so the close button's visual effect (closing the chat window) matches its accessible name. Pass `initialFocusRef` so focus moves **once** on open — to the primary action when rendered, otherwise the close button — and then stays put (SC 3.2.1, 2.4.3).

The disconnect overlay (`DisconnectOverlay.tsx`) additionally:

- Hides the chat layout behind it with `aria-hidden="true"` **and** `inert` (see `DisconnectableContentWrapper` in `WebchatUI.tsx`), so background content is neither announced by screen readers (SC 1.3.1/1.3.2) nor keyboard-reachable. On React 18 `inert` is not a supported prop — it is synced with an inline ref callback. `getKeyboardFocusableElements` skips `inert` subtrees (but deliberately not `aria-hidden` ancestors — the HomeScreen tabindex-toggling pattern queries inside its hidden root), so all focus logic composes with this.
- Announces state **changes** through a persistent visually-hidden `role="status"` region that lives _outside_ the dialog, reusing the already-localized overlay strings (`reconnecting`, `network_error`, `no_network`) — plus one new key, `connection_restored`, announced when the overlay closes (the region outlives the dialog). The dialog's initial appearance is deliberately not announced there (screen readers announce the dialog themselves — a duplicate would be noise). For the same reason the fullscreen variant has no `aria-describedby`: its body contains the status text, which would otherwise be read twice.
- The Reconnect action appears only in the permanent (gave-up) state and receives focus — the focus announcement conveys the transition. The move is **deferred** (~500ms — focusing a control in the same task that inserted it is not announced; the screen reader must ingest the node before the focus event) and **guarded** (only while focus still sits on the overlay's close button — never yanking it from a navigating user, SC 3.2.1). When the guard skips the move, the live region announces the `reconnect` button label instead — exactly one announcement either way, never both. For the same reason, `Modal`'s `initialFocusRef` focus on open is deferred (~200ms) — focusing in the same task that inserted the dialog races the accessibility-tree update and the announcement gets dropped.
- Shows a visible status line while something is happening ("Reconnecting…", "No network connection") and marks the Reconnect button `aria-disabled` (keeping focus, unlike `disabled`) while an attempt is in flight.
- Restores focus on close to the element focused before the overlay opened (Modal does this whenever `initialFocusRef` is used), so a successful reconnect doesn't drop focus to `<body>`.

## Boundary: Webchat vs. chat-components

Message **renderers** (text, image, gallery, list, datepicker, buttons, …) live in the **`@cognigy/chat-components`** package, which Webchat consumes. If an accessibility issue is inside a renderer's internals, fix it upstream in that repo and bump the dependency, rather than patching markup in Webchat.

## Working with AI assistants on accessibility

This repo ships AI-assistant configuration so AI-assisted work stays accessible by default:

- **[`CLAUDE.md`](../CLAUDE.md)** — auto-loaded baseline rules + reuse pointers (Claude Code).
- **`.claude/skills/wcag-component/`** — detailed, per-component-type recipes (loaded on demand).
- **`.claude/agents/a11y-reviewer.md`** + **`/a11y-review`** command — an accessibility-focused PR reviewer you can run on a diff.
- **[`.github/copilot-instructions.md`](../.github/copilot-instructions.md)** — repository custom instructions; includes an Accessibility section so GitHub Copilot's code suggestions and PR review also follow WCAG 2.2 AA.

## Manual checks

Automated tools catch a lot but not everything. Before merging non-trivial UI:

- Tab through the change with the keyboard only — every control reachable and operable, focus always visible.
- Test with a screen reader (NVDA/VoiceOver) for names, roles, and announcements.
- Install the free **axe DevTools** browser extension for an interactive page scan.
- Check zoom to 200% and `prefers-reduced-motion`.
