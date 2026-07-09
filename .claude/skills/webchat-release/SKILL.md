---
name: webchat-release
description: Cut, build, and ship a new @cognigy/webchat release in this repo — version bump, dependency updates (axios, @cognigy/chat-components, @cognigy/socket-client), OSS license regeneration, the release PR, tagging, the Automatic Draft Release workflow, the changelog, and publishing as a pre-release to npm. Use whenever the user wants to release Webchat, cut/prepare a new version, bump the version, "do a webchat release", update a core dependency and ship it, create or fill a draft release, publish a pre-release, or asks about the release/draft/publish CI workflows. Also use when diagnosing release CI failures (E2E specs broken by a dependency bump, Format/Prettier check, OSS license version mismatch).
---

# Releasing @cognigy/webchat

This is the end-to-end runbook for shipping a Webchat release, plus the non-obvious traps that bite every time. The canonical company runbook lives on Confluence ("Releasing Webchat"); this skill encodes it **and** the hard-won details that aren't written there.

Webchat is released as a **minor** version bump (`npm version minor`), published to npm under the **`pre-release`** dist-tag first, and only promoted to `latest` after QA signs off (~1 week later). Most releases exist to ship dependency updates (`@cognigy/chat-components`, `axios`, `@cognigy/socket-client`) and accumulated fixes.

Releasing is **outward-facing**: pushing branches/tags, opening PRs, triggering draft releases, and publishing all have real consequences. Do the local, reversible prep autonomously; **confirm with the user before each outward-facing step** (push, PR, merge, tag push, publish) unless they've told you to run the whole thing.

## 0. Pre-flight: release upstream dependencies first

Before bumping Webchat, check whether `@cognigy/chat-components` or `@cognigy/socket-client` have unreleased changes that should go out first — they have their own release processes (see their repos' READMEs). Check the latest published versions and compare to `package.json`:

```bash
npm view @cognigy/chat-components version
npm view @cognigy/chat-components dist-tags --json
npm view @cognigy/socket-client dist-tags --json       # Webchat tracks socket-client's `beta` tag, not `latest`
npm view axios version
```

When bumping `@cognigy/chat-components` across several minors (it's `0.x`, so minors can carry behavior changes), read its GitHub releases to know what's coming — it directly changes Webchat's rendered output:

```bash
gh release list --repo Cognigy/chat-components --limit 12
gh release view v0.NN.0 --repo Cognigy/chat-components --json body -q .body
```

## 1. Branch and update dependencies

```bash
git checkout main && git pull && git checkout -b release-webchat-3.NN
```

Edit `package.json` to the target versions, then **`npm install`** to refresh `package-lock.json` and install. Use `npm install`, **not `npm ci`** — `npm ci` fails when you've just changed `package.json` because the lockfile no longer matches. Verify what actually got installed (chat-components blocks `require` of its `package.json`, so read the file):

```bash
node -e "console.log('axios', require('axios/package.json').version)"
node -e "const fs=require('fs');console.log('cc', JSON.parse(fs.readFileSync('node_modules/@cognigy/chat-components/package.json')).version)"
```

## 2. Build, bump version, regenerate OSS licenses — order matters

`OSS_LICENSES.txt` lists Webchat itself (`"@cognigy/webchat@<version>"`), and `npm run update-license` stamps whatever version is in `package.json` **at that moment**. So regenerate it **after** the version bump — otherwise the manifest self-references the old version, a mismatch Copilot flags on every release. Sequence:

```bash
npm run build                                  # UMD + ESM; bundle-size warnings are expected
git commit -am "chore(deps): update <pkgs>"    # npm version needs a clean tree
npm version minor                              # writes 3.NN.0, commits it, creates tag v3.NN.0
npm run update-license                         # now stamps 3.NN.0
git commit -am "chore: regenerate OSS_LICENSES.txt for v3.NN.0"
grep -m1 '"@cognigy/webchat@' OSS_LICENSES.txt # confirm it equals the new version
```

The OSS commit lands **after** the `3.NN.0` version commit — that's fine. The local tag gets re-pointed to the squash commit on `main` after merge anyway (§6), so its exact position now doesn't matter; what matters is that the **branch tip** carries the corrected `OSS_LICENSES.txt` before you merge.

## 3. Local verification gates — know which are real

CI blocks on these; run them locally to avoid round-trips:

- **`npm run build`** — the real artifact. Babel transpiles (strips types); only size warnings are normal.
- **`npm run lint:a11y`** — the **blocking** "Accessibility lint (jsx-a11y)" job (`lint.yml`); **0 errors** required. (The full `npm run lint` also runs in CI but is `continue-on-error` / non-blocking — don't chase its pre-existing debt during a release.)
- **`npm run prettier:check`** — the **Format Check** CI job. Easy to trip with multi-line edits in `cypress/` (which `lint-staged`'s pre-commit does _not_ cover). Fix with `npx prettier --write <file>`.
- **Cypress E2E** — heavy. `npm test` runs the **Chrome** suite only (`test:cypress:chrome`); Firefox and progressive-rendering are separate scripts (`test:cypress:firefox`, `test:cypress:progressive-rendering`) and separate CI workflows. See §4.

**`npm run tsc:check` is NOT a release gate.** It reports ~150 pre-existing errors and is wired into no workflow (the build uses Babel, not `tsc`). Don't block a release on it or try to "fix" those errors as part of a release.

## 4. Dependency bumps break E2E tests that pin upstream output

This is the most common release surprise. `@cognigy/chat-components` renders the messages; some Webchat E2E specs **pin its exact rendered output** (avatar SVG data-URIs, focus targets, class names). A chat-components bump legitimately changes that output and those specs fail — usually **not** a Webchat regression.

Diagnose from the failed run rather than re-running blindly:

```bash
gh run list --repo Cognigy/Webchat --branch release-webchat-3.NN --limit 20 \
  --json databaseId,workflowName,conclusion,headSha --jq '.[] | "\(.conclusion) \(.workflowName) \(.headSha[0:8])"'
gh run view <run-id> --repo Cognigy/Webchat --log-failed | sed -E 's/\x1b\[[0-9;]*m//g' \
  | grep -iE "failing|AssertionError|expected|be.focused|\.cy\.ts" | tail -40
```

For each failing assertion, decide **intended upstream change vs. regression**:

- Read the chat-components release notes for that version range.
- Confirm the real behavior. Webchat passes the avatar through `getAvatarForMessage` (`src/webchat/store/messages/message-middleware.ts`); with no `logoUrl`/`botLogoUrl` configured it returns `undefined`, so **chat-components' built-in default is used** — Webchat does not override it. The default avatar SVG, calendar focus order, etc. are **chat-components concerns** (see the Webchat-vs-chat-components boundary in `CLAUDE.md`). If a change looks like a genuine a11y/visual regression, raise it **upstream** instead of papering over it in a Webchat test.
- If intended, update the spec to assert the new behavior. **Copy the expected value (e.g. an SVG data-URI) verbatim from the Cypress failure output or the rendered DOM — never hand-type it;** these strings are long and URL-encoded and the assertion is a strict equality. Add a comment naming the chat-components version + ticket so the next person understands why.

Verify just the touched specs locally before pushing (the Cypress binary often isn't installed after `npm install`):

```bash
npx cypress install && npx cypress verify
npm run build
npx http-server -a localhost -p 8787 dist/ --silent &   # serve dist on :8787
npx cypress run --browser electron --quiet --spec "cypress/e2e/<a>.cy.ts,cypress/e2e/<b>.cy.ts"
```

The same specs run in **three** workflows — `cypress.yml` (Chrome), `cypress-firefox.yml`, and `cypress-progressive-rendering.yml` — so a fix that greens Chrome locally still needs all three green in CI.

To eyeball the real widget, `npm run dev` serves `dist/index.html` on :8787 wired to a live dev endpoint (auto-opens + starts a conversation). The endpoint's config (avatar/logo settings, etc.) is plain JSON — `curl <endpoint-url>` to inspect what it actually sends.

New/changed UI also needs a `cy.checkA11yCompliance("[data-cognigy-webchat-root]")` assertion (see `CLAUDE.md`'s Definition of Done) — but a dependency-only release won't add UI.

## 5. PR, review, merge

Push the branch and open the PR against `main`. Title `Release/3.NN.0`; body should list the dependency bumps and what they bring. Address review comments — **Copilot reviews automatically** and reliably catches the OSS version mismatch (§2). After fixing, you can reply on its review thread, but **resolving** a Copilot thread needs explicit user authorization.

If `main` moved while the PR was open, the branch may get `main` merged into it (or you'll need to). A push rejected as non-fast-forward means the remote diverged — **fetch and inspect, never force over it**.

## 6. Tag and trigger the Automatic Draft Release

**The draft release is triggered by pushing a `v*` tag** — `.github/workflows/release.yml` runs `on: push: tags: ["v*"]`, does `npm ci && npm run build`, and creates a **draft** GitHub release with `dist/webchat.js`, `dist/webchat.esm.js`, and `OSS_LICENSES.txt` attached, using an empty section template for notes.

**Tag trap — make sure the tag is on `main`.** The local `v3.NN.0` tag created by `npm version` points to the bump commit on the _release branch_. Whether that commit is on `main` depends on how the PR landed — and this repo has used **both** strategies, so don't assume:

- **Squash merge** (e.g. #287): `main` gets a single new `Release/3.NN.0` commit; the branch bump commit is **orphaned** (not an ancestor of `main`).
- **Merge commit** (older releases): the bump commit is preserved on `main` as the merge's second parent, so the tag may already be reachable.

Check, then re-point the tag onto the commit that's actually on `main` (the squash commit, or the bump/merge commit) so the release is tagged on `main`'s history:

```bash
git fetch origin main
git log --oneline origin/main | head                       # find the Release/3.NN.0 commit -> RELEASE_SHA
git merge-base --is-ancestor v3.NN.0 origin/main && echo "tag already on main" || echo "re-point needed"
git tag -d v3.NN.0 && git tag v3.NN.0 RELEASE_SHA          # if re-point needed
git diff <branch-tip> RELEASE_SHA                          # expect empty: identical trees
git push origin v3.NN.0                                     # <-- this triggers the draft release
```

Watch it: `gh run list --repo Cognigy/Webchat --workflow "Automatic Draft Release" --limit 3`.

## 7. Fill the changelog

The draft body is an empty template (`### Potentially breaking changes / New Features / Bug Fixes / Improvements`). Fill it from the commits **on `main` between the previous `Release/X.Y.Z` commit and this one** — **not** `git log vX.Y.Z..` , because the `vX.Y.Z` tags sit on orphaned squash branches and give a misleading range:

```bash
git log <prev-release-commit>..<this-release-commit> --oneline
```

Group changes into the four sections, link PRs (`https://github.com/Cognigy/Webchat/pull/N`) and AB# tickets, and surface user-facing items the dependency bump brings (e.g. chat-components a11y/theme changes). Then:

```bash
gh release edit v3.NN.0 --repo Cognigy/Webchat --notes-file notes.md
```

## 8. Publish as a pre-release, then the post-release checklist

Publishing is the point of no return — `.github/workflows/publish.yml` runs `on: release: published` and does `npm publish --tag pre-release`, so the version lands on npm under the **`pre-release`** dist-tag (never `latest` automatically). **Confirm with the user before publishing.** When publishing, **check "Set as a pre-release"** on the GitHub release.

After publishing (per the Confluence runbook):

1. Verify the new version loads on the **Testing Webchat** page.
2. Tag this release's tickets with `webchat-3.NN`, plus the release tech-story.
3. Create a QA tech-story; await QA approval (~1 week). For a patch, ask QA to prioritize.
4. After the green light, promote to latest by running the **Promote Release to Latest** workflow (`promote-to-latest.yml`) — Actions → Run workflow → input the release tag `v3.NN.0`. It marks the GitHub release `--latest`, runs `npm dist-tag add @cognigy/webchat@3.NN.0 latest`, and removes the `pre-release` dist-tag if it still points there. (Editing the GitHub release in the UI alone does **not** update npm — there's no `release: edited` automation; this workflow is the mechanism.) Then re-verify on the Testing Webchat page and confirm `npm view @cognigy/webchat dist-tags`.
5. Update the demo-webchat version in `service-webchat` (`services/service-webchat/package.json`), `npm i`, commit, push.

## Quick reference — gotchas

- `npm install` after editing `package.json`, never `npm ci` (lockfile mismatch).
- Regenerate `OSS_LICENSES.txt` **after** `npm version`, or the self-ref version is stale (Copilot will flag it).
- `tsc:check` is not a gate; the gates are build, `lint:a11y` (Accessibility lint), **Format Check** (`prettier:check`), and Cypress E2E.
- Prettier flags multi-line edits in `cypress/` that the pre-commit hook misses — run `prettier --check .`.
- Dependency bumps break E2E specs that pin chat-components output; decide intended-vs-regression, fix upstream if it's a real regression.
- Squash merges orphan the `npm version` tag — re-point `v3.NN.0` to the `main` squash commit before pushing it.
- Changelog range is between `Release/*` commits on `main`, not between `vX.Y.Z` tags.
- Pushing the tag → draft release. Publishing the release → npm `pre-release` dist-tag. The **Promote Release to Latest** workflow (manual dispatch) → npm `latest` (and drops `pre-release`). Editing the release in the UI does not touch npm.
