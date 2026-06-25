---
description: Review the current PR / diff for WCAG 2.2 AA accessibility compliance
---

Run an accessibility-focused review of the current changes.

Use the `a11y-reviewer` subagent (`.claude/agents/a11y-reviewer.md`) to review the diff against `main` for WCAG 2.2 Level AA compliance. If `$ARGUMENTS` contains a PR number, review that PR (`gh pr diff $ARGUMENTS`); otherwise review the local branch diff vs. `main`.

Report the subagent's findings grouped by severity (blocker / should-fix / nit), each with a `file:line`, the relevant WCAG success criterion, and a concrete fix. Finish with whether the change meets WCAG 2.2 AA and whether a `cy.checkA11yCompliance()` assertion was added for any new/changed UI surface.
