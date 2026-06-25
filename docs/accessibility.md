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

User-facing aria strings come from `customTranslations.ariaLabels` — read them with a fallback; never hardcode.

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
