#!/usr/bin/env python3
"""
Patches the Webchat-Testing app for PR preview usage.

Usage:
    python3 patch_testing_app.py <testing_dir> <pr_number> <commit_sha> <endpoint_url> <base_path>

Modifications:
  - App.jsx: Inserts a "PR Build" option at the top of the release dropdown
    (pre-selected), shows "Pull Request" label when PR build is selected,
    pre-fills endpoint from build config, prevents release-load from
    overriding the PR build selection, namespaces endpoint and settings
    localStorage keys per-PR to avoid cross-PR bleed.
  - vite.config.js: Sets the `base` path for correct asset loading on gh-pages.
"""

import json
import pathlib
import sys


def expect_replace(content, old, new, *, label="", count=1):
    """Replace `old` with `new` in `content`, failing if `old` isn't found
    exactly `count` time(s).  This prevents silent failures when the upstream
    Webchat-Testing source changes."""
    occurrences = content.count(old)
    if occurrences == 0:
        raise RuntimeError(
            f"Patch failed ({label}): pattern not found in source.\n"
            f"  Expected: {old[:120]!r}..."
        )
    if occurrences != count:
        raise RuntimeError(
            f"Patch failed ({label}): expected {count} occurrence(s), found {occurrences}."
        )
    return content.replace(old, new, count)


def patch_app_jsx(app_path, pr_number, commit_sha, endpoint_url):
    if not pr_number.isdigit():
        raise RuntimeError(
            f"Invalid pr_number: {pr_number!r} — expected a numeric string."
        )

    content = app_path.read_text()

    # 1. Add PR_CONFIG constant after the imports.
    #    Use json.dumps() for all values so that quotes, backslashes, etc.
    #    are properly escaped in the JavaScript string literals.
    pr_config = (
        '\n// --- PR Preview Config (injected by CI) ---\n'
        'const PR_CONFIG = {\n'
        f'  prNumber: {json.dumps(pr_number)},\n'
        f'  commitSha: {json.dumps(commit_sha)},\n'
        f'  endpoint: {json.dumps(endpoint_url)},\n'
        '  localBuildUrl: "./webchat.js",\n'
        '};\n'
    )
    # Find the last import statement using line-based search, which is more
    # robust than assuming imports end with semicolons (some formatters omit them).
    lines = content.splitlines(keepends=True)
    last_import_idx = -1
    for idx, line in enumerate(lines):
        if line.lstrip().startswith("import "):
            last_import_idx = idx
    if last_import_idx == -1:
        raise RuntimeError(
            "Patch failed (insert PR_CONFIG): no import statements found in App.jsx."
        )
    lines.insert(last_import_idx + 1, pr_config)
    content = "".join(lines)

    # 2. Namespace localStorage keys for endpoint and settings so that
    #    different PR previews (all on the same origin) don't share state.
    content = expect_replace(
        content,
        'useLocalStorageState("testing-endpoint")',
        f'useLocalStorageState("testing-endpoint-pr-{pr_number}")',
        label="namespace endpoint localStorage key",
    )
    content = expect_replace(
        content,
        'useLocalStorageState("testing-settings")',
        f'useLocalStorageState("testing-settings-pr-{pr_number}")',
        label="namespace settings localStorage key",
    )

    # 3. Replace the default endpoint with PR_CONFIG.endpoint
    content = expect_replace(
        content,
        'endpoint = "https://endpoint-dev.cognigy.ai/45c4ec61c937e830ecdebfaad977e2ed0bd84001e3b6df736e84560b73506463"',
        'endpoint = PR_CONFIG.endpoint || "https://endpoint-dev.cognigy.ai/45c4ec61c937e830ecdebfaad977e2ed0bd84001e3b6df736e84560b73506463"',
        label="default endpoint override",
    )

    # 4. Default selectedRelease to local build
    content = expect_replace(
        content,
        'const [selectedRelease, setSelectedRelease] = useState("");',
        'const [selectedRelease, setSelectedRelease] = useState(PR_CONFIG.localBuildUrl);',
        label="default selectedRelease",
    )

    # 5. Prevent the releases-load useEffect from overriding PR build selection
    content = expect_replace(
        content,
        '''  useEffect(() => {
    if (releases?.length > 0) {
      setSelectedRelease(releases[0].assets[2].browser_download_url);
    }
  }, [releases]);''',
        '''  useEffect(() => {
    // Only auto-select latest release if no PR build is pre-selected
    if (releases?.length > 0 && !PR_CONFIG.localBuildUrl) {
      setSelectedRelease(releases[0].assets[2].browser_download_url);
    }
  }, [releases]);''',
        label="prevent useEffect override",
    )

    # 6. Make the version selector label dynamic: "Pull Request" when PR build
    #    is selected, "Release" otherwise.  Also update the href to link to the
    #    PR page instead of the GitHub release page.
    content = expect_replace(
        content,
        '''href={
              releases?.find(
                (release) =>
                  release?.assets?.[2]?.browser_download_url ===
                  selectedRelease,
              )?.html_url
            }
          >
            Release
          </a>''',
        '''href={
              selectedRelease === PR_CONFIG.localBuildUrl
                ? `https://github.com/Cognigy/Webchat/pull/${PR_CONFIG.prNumber}`
                : releases?.find(
                    (release) =>
                      release?.assets?.[2]?.browser_download_url ===
                      selectedRelease,
                  )?.html_url
            }
          >
            {selectedRelease === PR_CONFIG.localBuildUrl ? "Pull Request" : "Release"}
          </a>''',
        label="dynamic Release/Pull Request label",
    )

    # 7. Add local PR build option at top of release <select>
    pr_option = (
        '<option value={PR_CONFIG.localBuildUrl}>\n'
        '                PR #{PR_CONFIG.prNumber} Build ({PR_CONFIG.commitSha?.substring(0, 7)})\n'
        '              </option>\n              '
    )
    content = expect_replace(
        content,
        '{releases.map((release)',
        pr_option + '{releases.map((release)',
        label="PR build <option>",
    )

    # 8. Replace the title
    content = expect_replace(
        content,
        '<h1>Webchat Release Testing</h1>',
        '<h1>Webchat PR Preview</h1>',
        label="page title",
    )

    app_path.write_text(content)
    print(f"  Patched {app_path}")


def patch_vite_config(config_path, base_path):
    content = config_path.read_text()
    # Use json.dumps() so that any special characters in base_path are safely
    # escaped inside the JavaScript string literal.
    safe_base = json.dumps(base_path)
    content = expect_replace(
        content,
        "export default defineConfig({",
        f'export default defineConfig({{\n  base: {safe_base},',
        label="vite base path",
    )
    config_path.write_text(content)
    print(f"  Patched {config_path}")


if __name__ == "__main__":
    if len(sys.argv) < 6:
        print("Usage: patch_testing_app.py <dir> <pr> <sha> <endpoint> <base>")
        sys.exit(1)

    d = pathlib.Path(sys.argv[1])
    try:
        patch_app_jsx(d / "src" / "App.jsx", sys.argv[2], sys.argv[3], sys.argv[4])
        patch_vite_config(d / "vite.config.js", sys.argv[5])
    except RuntimeError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
    print("Done!")
