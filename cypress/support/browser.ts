/**
 * `it` for tests that press real keys through cypress-real-events, which
 * drives the browser over the Chrome DevTools Protocol and so exists in
 * Chromium only. Elsewhere (the Firefox job) the test is registered as
 * pending, so the run shows it was skipped rather than silently missing;
 * every assertion that does not need a native key event stays in a plain `it`.
 */
export const itChromiumOnly = Cypress.isBrowser({ family: "chromium" }) ? it : it.skip;
