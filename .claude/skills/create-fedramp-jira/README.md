# Skill: `create-fedramp-jira`

Turns a spreadsheet/paste of FedRAMP security findings into Jira tickets automatically —
creates **one Epic per service** and **one Story per finding** in the **CSA** project
(`nice-ce-cxone-prod.atlassian.net`).

## What it does

- Parses pasted finding rows or a `.xlsx`/`.csv`/`.tsv` file — columns are auto-detected,
  with or without a header row.
- Creates a Jira **Epic** per service under a Capability you choose, and one **Story** per finding.
- Applies all the fixed Cognigy fields for you (see below).
- Reports the created keys + links, and flags any mismatch against the repo's own
  `fedramp-codebase-assessment.md`.

## How it works

1. You paste the finding rows (or give a file path).
2. It asks for the **Capability key** (the Epic's parent, e.g. `CSA-89851`) and an optional
   **reference Epic** to copy field settings from.
3. Shows a **preview table** and waits for your explicit "go ahead" — nothing is created before you confirm.
4. Creates the Epic + Stories with the fixed field policy applied automatically:
   P1 · 1 story point (stories) · Fix version · Team *Analytics Zenith* · Component *Cognigy AI* ·
   Epic Type *NFR* / NFR Type *Security - Static Code* · labels `fedramp`/`<service>`/`security` ·
   assigned to you.
5. Reports back the created keys + browse URLs.

## How to run it

Type `/create-fedramp-jira` and paste your findings, or just say
*"create FedRAMP epic and stories for `<service>`."*

## Setup (one-time, per person)

1. Copy the whole `create-fedramp-jira` folder into your skills directory:
   - macOS/Linux: `~/.claude/skills/`
   - Windows: `%USERPROFILE%\.claude\skills\`
2. Restart Claude Code.
3. Connect Atlassian: run `/mcp` → authenticate **"claude.ai Atlassian"**.
   Each person uses their own Atlassian account — this part is not shared.

## Good to know

- It **never** creates tickets before you confirm the preview.
- It won't invent a Capability key — it always asks.
- Works on the `nice-ce-cxone-prod` Jira site, project **CSA**.
- Flags (does not silently correct) severity/ID mismatches between your sheet and a repo's
  `fedramp-codebase-assessment.md`.

## Folder contents

- `SKILL.md` — the skill instructions Claude follows.
- `references/field-map.md` — exact Jira field IDs, option IDs, and the create payload.
- `references/templates.md` — Epic/Story description + acceptance-criteria templates.
- `scripts/xlsx_to_tsv.py` — helper to convert `.xlsx` input to TSV.
