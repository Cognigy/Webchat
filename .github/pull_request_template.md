# Success criteria

Please describe what should be possible after this change. List all individual items on a separate line.

- A
- B
- C

# How to test

Please describe the individual steps on how a peer can test your change.

1. A
2. B
3. C

# Security

- [ ] Possible injection vector
- [ ] Authentication/Access controls touched
- [ ] Sensitive Data could be exposed
- [ ] XSS
- [ ] Logging/Monitoring touched
- [ ] Exchanges data with external systems
- [ ] No security implications

# Accessibility (WCAG 2.2 AA)

For UI changes (see [docs/accessibility.md](../docs/accessibility.md)):

- [ ] `npm run lint:a11y` passes
- [ ] Added a `cy.checkA11yCompliance()` assertion for the new/changed surface
- [ ] Keyboard-only operable; focus visible and managed (move-in on open, restore on close)
- [ ] All interactive elements have an accessible name; ARIA correct / not contradicting semantics
- [ ] Color contrast and target size (≥24×24px) checked
- [ ] No accessibility implications (non-UI change)

# Additional considerations

- [ ] This PR might have performance implications

# Documentation Considerations

These are hints for the documentation team to help write the docs.
