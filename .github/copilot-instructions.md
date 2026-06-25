# Cognigy Webchat v3 - AI Agent Instructions

## Project Overview

This is **Cognigy Webchat v3** - a drop-in chat widget for Cognigy.AI endpoints. The widget is built with React + Redux + Emotion (CSS-in-JS) and compiled to standalone UMD/ESM bundles that embed into any website via `<script>` tags.

**Critical Architectural Constraint**: Only ONE webchat instance per page. Not designed for multiple sessions (parallel or sequential).

## Architecture

### Three-Layer Structure

1. **`src/webchat`** - Core React component with Redux state management + socket connection logic
2. **`src/webchat-ui`** - Presentational UI components using `@cognigy/chat-components`
3. **`src/webchat-embed`** - Entry point that mounts the widget to DOM and exposes `window.initWebchat()`

**Entry point**: `src/webchat-embed/index.tsx` loads plugins, prepares message/input plugins, and initializes the Webchat component.

### State Management

- **Mixed Redux approach**: Older reducers use hand-written reducers (see `src/webchat/store/config/config-reducer.ts`), newer ones use Redux Toolkit's `createSlice()` (see `src/webchat/store/typing/slice.ts`, `xapp-overlay/slice.ts`)
- **Root reducer**: `src/webchat/store/reducer.ts` combines all reducers with `combineReducers()` and handles special actions like `RESET_STATE` (restore persisted history) and `SET_PREV_STATE`
- **Key stores**: messages, config, ui, connection, rating, input, prevConversations, unseenMessages, inputCollation, autoInject, xAppOverlay, queueUpdates, userTyping

### Plugin System

Webchat supports **Message Plugins** (render custom message types) and **Input Plugins** (custom input UI):

- **Registration**: Plugins call `registerMessagePlugin()` or `registerInputPlugin()` from `src/plugins/helper.tsx` - these push to global `window.cognigyWebchatMessagePlugins` / `window.cognigyWebchatInputPlugins` arrays
- **Loading**: Import plugins in `src/webchat-embed/index.tsx` BEFORE mounting (e.g., `import "../plugins/rating"`)
- **Message matching**: Plugins define a `match` function `(message, config) => boolean` - typically checks `message.data._plugin.type`
- **Dependency injection pattern**: Plugins receive `{ React, styled }` at runtime to share host dependencies (avoids bundling React twice)

**Built-in plugins**: `src/plugins/get-started-button-input/`, `src/plugins/rating/`

External plugins: See [WebchatPlugins repo](https://github.com/Cognigy/WebchatPlugins) for examples. Plugins use `alias/react.js` pattern to consume host's React.

## Configuration System

**Adding new config options** (see `architecture-docs/quality-attributes.md`):

1. Add property to `IWebchatConfig` or `IWebchatSettings` in `src/common/interfaces/webchat-config.ts`
2. Set default value in `getInitialState()` in `src/webchat/store/config/config-reducer.ts`
3. Access via Redux `state.config.settings.*` throughout the app

Settings come from Endpoint Config API (merged with client-side `initWebchat()` options).

## Styling

- **Emotion CSS-in-JS**: All components use `styled()` from `@emotion/styled` - see examples in `src/webchat-ui/components/`
- **Theme**: Injected via Emotion's `ThemeProvider` (colors, spacing) - see `src/webchat-ui/style`
- **CSS classes**: Exposed for external customization - documented in `docs/css-customization.md` (e.g., `webchat-root`, `webchat-header-bar`, `webchat-message-row`)
- **Components library**: Uses `@cognigy/chat-components` for base UI (Typography, Button, ActionButtons, Message, etc.)

## Accessibility (WCAG 2.2 AA) — required for all UI

**All UI code in this repo must meet [WCAG 2.2](https://www.w3.org/TR/WCAG22/) Level AA.** When writing, modifying, or reviewing any component, control, dialog, input, or markup, apply this and flag violations:

- **Semantic HTML first** (`<button>`, `<a href>`, `<ul>/<li>`, headings); use ARIA only when native semantics are insufficient and never ARIA that contradicts the element.
- **Follow the W3C ARIA Authoring Practices Guide (APG)** for recognizable widgets — implement the keyboard interaction and ARIA roles/states from the matching pattern (https://www.w3.org/WAI/ARIA/apg/patterns/): Dialog (modals/overlays/lightbox), Menu Button (persistent menu), Button, Disclosure (toggles/home screen), Link, Carousel (gallery), Listbox/Grid (selection lists, date picker), Alert/Tooltip.
- **Accessible name on every interactive element**; prefer visible text, else `aria-label`/`aria-labelledby`. Read user-facing aria strings from `customTranslations.ariaLabels` — never hardcode them.
- **Full keyboard operability** — no mouse-only handlers (`onClick` on a non-native element needs key handling + role, or use a real `<button>`); logical tab order; visible `:focus-visible`.
- **Focus management** — move focus into new surfaces on open, restore to the trigger on close; trap focus only in modals and keep it Esc-dismissible; focus must not be obscured (SC 2.4.11).
- **Color contrast** ≥ 4.5:1 text / 3:1 large text & UI/state; **target size** ≥ 24×24 CSS px (SC 2.5.8); respect `prefers-reduced-motion`; images need `alt` (empty for decorative), decorative icons `aria-hidden`.

**Reuse existing utilities** — don't reinvent: focus discovery/trap → `getKeyboardFocusableElements` (`src/webchat-ui/utils/find-focusable.ts`); announcements → `ScreenReaderLiveRegion` + `src/webchat-ui/utils/live-region-announcement.ts`; visually-hidden text → `.sr-only` (`src/assets/style.css`); show/hide regions → tabindex-toggling pattern in `HomeScreen.tsx`; open/close focus → `WebchatUI.tsx`.

**Boundary**: message renderers live in `@cognigy/chat-components`. If an a11y issue is inside a renderer's internals, the fix belongs upstream in that package — call that out rather than patching around it here.

**Enforced by** (see `docs/accessibility.md`): static lint `npm run lint:a11y` (jsx-a11y, errors, blocking CI) and runtime `cy.checkA11yCompliance()` (cypress-axe, real-browser, WCAG 2.2 AA — also catches contrast). **Definition of Done for UI changes**: passes `lint:a11y` and adds a `cy.checkA11yCompliance()` assertion for the new/changed surface.

## Build System

**Webpack configurations**:

- `webpack.config.js` - Base config (dev mode)
- `webpack.production.js` - UMD bundle (`dist/webchat.js`)
- `webpack.es.js` - ESM bundle (`dist/webchat.esm.js`) with external React/React-DOM
- `webpack.dev.js` - Dev server config

**Build process**:

```bash
npm run build       # Builds both UMD + ESM, runs postbuild-secure-patch
npm run dev         # Webpack dev server on localhost:8080
```

**Post-build security patching**: `scripts/postbuild-secure-patch.mjs` applies idempotent text replacements to fix CodeQL findings (incomplete sanitization, regex issues) - runs automatically after build.

## Development Workflows

### Running Locally

```bash
npm install
npm run dev         # Starts dev server at http://localhost:8080
```

Opens test page with webchat embedded. **Hot reload enabled** - changes auto-refresh.

### Testing

```bash
npm run build                          # Must build first
npm run test                          # Runs Cypress tests (Chrome)
npm run test:cypress:firefox          # Firefox variant
npm run test:cypress:progressive-rendering  # Tests progressive rendering mode
```

**Cypress architecture** (see `cypress/support/commands.ts`):

- `cy.initMockWebchat()` - Mocks endpoint, initializes webchat, stores instance in `window.webchat`
- `cy.receiveMessage()` - Simulates receiving a message from socket (exposed internal function)
- Tests run against built bundles served by `http-server` on port 8787

### Type Checking & Linting

```bash
npm run tsc:check      # TypeScript type checking (no emit)
npm run lint           # ESLint (incl. jsx-a11y accessibility rules)
npm run lint:a11y      # Accessibility-only lint gate (jsx-a11y, errors) — blocks PRs
npm run prettier:check # Format check
npm run prettier:fix   # Auto-format
```

### CodeQL Scanning

```bash
npm run codeql:scan:src   # Scan source code
npm run codeql:scan:dist  # Scan built bundles
```

## Key Implementation Patterns

### Storage Management

- Persistent history uses localStorage/sessionStorage (configurable via `settings.embeddingConfiguration.disableLocalStorage` / `useSessionStorage`)
- **Storage abstraction**: `getStorage()` helper in `src/webchat/helper/storage.ts` returns appropriate storage API
- **userId persistence**: Generated via `uuid.v4()`, stored in storage unless explicitly provided

### Message Rendering

- Messages flow through plugin matcher system in `src/plugins/helper.tsx` - `getPluginsForMessage()` finds matching plugins
- **Progressive rendering**: Optional mode where messages render incrementally (enable via `behavior.progressiveMessageRendering`)
- **Animation states**: Messages have `animationState: "start" | "animating" | "done" | "exited"` for enter/exit animations

### Socket Connection

- Uses `@cognigy/socket-client` (v5.0.0-beta.24) for Cognigy endpoint communication
- Connection state tracked in `src/webchat/store/connection/connection-reducer.ts`
- Reconnection logic handles disconnects with UI indicators

## Important Files

- **Config schema**: `src/common/interfaces/webchat-config.ts` - Complete settings interface (~450 lines)
- **Root reducer**: `src/webchat/store/reducer.ts` - Combines all state + history restoration logic
- **Plugin loader**: `src/webchat-embed/index.tsx` - Entry point for bundle
- **Quality attributes doc**: `architecture-docs/quality-attributes.md` - Extensibility, maintainability, limitations

## Common Tasks

**Add a message plugin**: Create plugin in `src/plugins/`, call `registerMessagePlugin()`, import in `src/webchat-embed/index.tsx`

**Add config option**: Update `IWebchatConfig`, set default in `config-reducer.ts`, use in components via `useSelector(state => state.config.settings.*)`

**Fix scroll issues**: Look in `src/webchat-ui/components/history/ChatScroller.tsx` - handles auto-scroll, scroll-to-bottom button

**Style customization**: Use `styled()` components - inject theme via props `({ theme }) => ({...})`

## Migration Context

This is Webchat v3 (current). Webchat v2 (deprecated) ends support Jan 31, 2026. v3 is a full rewrite with new UI, plugin system, and endpoint settings.

## Known Limitations

- One webchat per page (by design)
- Large persistent histories (base64 content) can break localStorage capacity
- Rapid reconnects can create load spikes on endpoint
- No exposed React component - only `initWebchat()` function for embedding
