# Description & Acceptance-Criteria Templates

Fill `<placeholders>` from the parsed rows. Keep grounded — only state what the sheet/repo supports.
When the sheet gives only a short Description, write a reasonable Problem from it plus the control facts;
keep Remediation generic and control-appropriate rather than inventing repo specifics.

---

## Epic — `description` (markdown, via `contentFormat: "markdown"`)

```markdown
## Overview

This Epic tracks all FedRAMP Moderate remediation work for **<service>** — <one-line what the service is>.

Findings were identified via a structured codebase scan (`compliance:fedramp-codebase-assessment`)
against the NIST SP 800-53 Rev 5 / FedRAMP Moderate baseline. The full report lives at
`fedramp-codebase-assessment.md` in the <service> repo root.

**Parent Capability:** <capability key> — <capability summary>

---

## Finding Summary

| Severity | Total |
| --- | --- |
| **CRITICAL** | <n> |
| **HIGH** | <n> |
| **MEDIUM** | <n> |
| **LOW** | <n> |

---

## Findings

| Finding ID | Control | Severity | Description |
| --- | --- | --- | --- |
| <ID> | <control(s)> | <SEV> | <short description> |
| ... | | | |

---

## Definition of Done (for this Epic)

* \[ \] All CRITICAL + HIGH findings resolved or formally accepted with a POA&M entry
* \[ \] `fedramp-codebase-assessment.md` re-scanned showing 0 CRITICAL, 0 HIGH
* \[ \] Compliance team has reviewed INFO/HYBRID/PROCESS findings and updated the SSP
```

## Epic — Acceptance Criteria (`customfield_10039`, **ADF**)

```json
{
  "type": "doc",
  "version": 1,
  "content": [
    { "type": "paragraph", "content": [ { "type": "text", "text": "<service> remediations" } ] },
    { "type": "paragraph", "content": [ { "type": "text",
      "text": "Fixing all CRITICAL and HIGH findings under <service>: 0 CRITICAL and 0 HIGH findings remaining in a re-scan of fedramp-codebase-assessment.md, or formally accepted via POA&M." } ] }
  ]
}
```

---

## Story — `description` (markdown)

```markdown
## Summary

**Finding ID:** <FINDING-ID>
**Controls:** <control(s)>
**Severity:** <SEVERITY>
**Service:** <service>
**File:** <location>

## Problem

<Problem paragraph built from the Description + control. State the concrete gap and why the control
(<primary control> / <family>) is not met. Quote the flagged line/location if given.>

## Remediation

<Control-appropriate remediation steps. Keep generic if the sheet lacks repo specifics.
 e.g. RA-5 → add govulncheck/Dependabot on PR + schedule; SA-11 → CI test+SAST+SCA gates;
 SC-8 → TLS with MinVersion 1.2 + cert verification, no InsecureSkipVerify.>

## Acceptance Criteria

- [ ] <verifiable outcome 1>
- [ ] <verifiable outcome 2>
- [ ] <verifiable outcome 3>
```

## Story summary line

```
<SEVERITY> - <FINDING-ID> - <concise Title Case title derived from Description>
```

Examples:
```
HIGH - GHL-SC8-001 - Health-Check HTTP Server Uses Plaintext http.ListenAndServe; No TLS Option
HIGH - GHL-SA11-001 - No CI/CD Pipeline; No Automated Test/Lint/Scan Gates
HIGH - GHL-RA5-001 - No govulncheck / Dependabot / Snyk Configuration
```
