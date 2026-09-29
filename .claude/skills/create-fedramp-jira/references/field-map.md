# Field Map — CSA project (nice-ce-cxone-prod)

Exact IDs and the `createJiraIssue` payload shape for the FedRAMP Epic/Story creation flow.

> **Prefer resolving these from the reference epic** (see "Resolve from reference epic" below).
> The values here are the **fallback defaults** captured 2026-07 and **will drift** — fix versions
> especially. If a `createJiraIssue` call rejects an option ID, re-resolve from a current epic.

## Environment

| Thing | Value |
| --- | --- |
| Site / cloudId | `nice-ce-cxone-prod.atlassian.net` (pass the hostname as `cloudId`, or UUID `0e508bed-9911-4fa0-9106-53d761fb5715`) |
| Project key | `CSA` |
| Epic issue type | `Epic` |
| Story issue type | `Story` |

## Field IDs and default option values

| Field | Field ID | Default value payload | Notes |
| --- | --- | --- | --- |
| Priority | `priority` | `{"name": "P1"}` | |
| Labels | `labels` | `["fedramp", "<service>", "security"]` | |
| Component | `components` | `[{"id": "18272"}]` | "Cognigy AI" |
| Fix version | `fixVersions` | `[{"id": "65109"}]` | "26.4" — **verify/re-resolve; version IDs roll each release** |
| Story Points | `customfield_10038` | `1` | number, Story only |
| Team Name | `customfield_10098` | `{"id": "142436"}` | option "Analytics Zenith". Epic + Story |
| Epic Team | `customfield_10040` | `[{"id": "142443"}]` | option "Analytics Zenith". **ARRAY.** Epic only |
| Epic Type | `customfield_11577` | `{"value": "NFR"}` | Epic only, **required** |
| NFR Type | `customfield_11578` | `{"value": "Security - Static Code"}` | Epic only, **mandatory when Epic Type = NFR** |
| Acceptance Criteria | `customfield_10039` | ADF doc (see templates.md) | Epic **required**; rich text → **ADF**, not markdown |
| Sprint | `customfield_10020` | — | **leave unset** |
| Assignee | `assignee_account_id` | current user's `account_id` | from `atlassianUserInfo` |
| Epic parent (Capability) | `parent` param | Capability key, e.g. `CSA-89851` | |
| Story parent (Epic) | `parent` param | the new Epic key | |

> "Analytics Zenith" has a **different option id per field** (Team Name `142436`, Epic Team `142443`) —
> they are distinct custom fields. Don't reuse one id for the other.

## Resolve from reference epic (preferred)

`getJiraIssue` the reference epic with `fields: ["*all"]` and copy these straight across (keeps the skill
correct when IDs/versions change):

- `parent` → the Capability (if the user didn't supply one, offer the ref epic's parent)
- `priority`, `components`, `fixVersions`
- `customfield_10040` (Epic Team), `customfield_10098` (Team Name)
- `customfield_11577` (Epic Type), `customfield_11578` (NFR Type)
- label convention (`fedramp` / `<service>` / `security`)

If no reference epic: use the defaults above.

## Create the Epic

Tool: `mcp__claude_ai_Atlassian__createJiraIssue`

- `cloudId`, `projectKey: "CSA"`, `issueTypeName: "Epic"`
- `summary: "Cognigy FedRAMP - <service> remediations"`
- `parent: "<capability key>"`
- `assignee_account_id: "<current user>"`
- `contentFormat: "markdown"`, `description:` (markdown — templates.md)
- `additional_fields`:
  ```json
  {
    "priority": {"name": "P1"},
    "labels": ["fedramp", "<service>", "security"],
    "components": [{"id": "18272"}],
    "fixVersions": [{"id": "65109"}],
    "customfield_10040": [{"id": "142443"}],
    "customfield_10098": {"id": "142436"},
    "customfield_11577": {"value": "NFR"},
    "customfield_11578": {"value": "Security - Static Code"},
    "customfield_10039": { "type": "doc", "version": 1, "content": [ /* ADF, see templates.md */ ] }
  }
  ```

## Create each Story

- `cloudId`, `projectKey: "CSA"`, `issueTypeName: "Story"`
- `parent: "<new epic key>"`
- `summary: "<SEVERITY> - <FINDING-ID> - <Title>"`
- `assignee_account_id: "<current user>"`
- `contentFormat: "markdown"`, `description:` (markdown — templates.md)
- `additional_fields`:
  ```json
  {
    "priority": {"name": "P1"},
    "labels": ["fedramp", "<service>", "security"],
    "components": [{"id": "18272"}],
    "fixVersions": [{"id": "65109"}],
    "customfield_10038": 1,
    "customfield_10098": {"id": "142436"}
  }
  ```
  (Story has no Epic Team / Epic Type / NFR Type / Acceptance Criteria fields — do not set them. Leave Sprint unset.)

## Known-good gotchas

1. Epic Team (`customfield_10040`) must be an **array** or you get *"Specify the value for Epic Team in an array"*.
2. Epic Type = NFR ⇒ NFR Type (`customfield_11578`) is **required** — set both.
3. Acceptance Criteria (`customfield_10039`) must be **ADF**; passing a markdown string fails silently or errors.
4. `description` param converts markdown when `contentFormat: "markdown"`; `additional_fields` are passed raw (ADF for rich text).
