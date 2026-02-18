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

import pathlib
import sys


def patch_app_jsx(app_path, pr_number, commit_sha, endpoint_url):
    content = app_path.read_text()

    # 1. Add PR_CONFIG constant after the imports
    pr_config = (
        '\n// --- PR Preview Config (injected by CI) ---\n'
        'const PR_CONFIG = {\n'
        f'  prNumber: "{pr_number}",\n'
        f'  commitSha: "{commit_sha}",\n'
        f'  endpoint: "{endpoint_url}",\n'
        '  localBuildUrl: "./webchat.js",\n'
        '};\n'
    )
    import_end = content.rfind("import ")
    import_end = content.index("\n", content.index(";", import_end)) + 1
    content = content[:import_end] + pr_config + content[import_end:]

    # 2. Namespace localStorage keys for endpoint and settings so that
    #    different PR previews (all on the same origin) don't share state.
    content = content.replace(
        'useLocalStorageState("testing-endpoint")',
        f'useLocalStorageState("testing-endpoint-pr-{pr_number}")'
    )
    content = content.replace(
        'useLocalStorageState("testing-settings")',
        f'useLocalStorageState("testing-settings-pr-{pr_number}")'
    )

    # 3. Replace the default endpoint with PR_CONFIG.endpoint
    content = content.replace(
        'endpoint = "https://endpoint-dev.cognigy.ai/45c4ec61c937e830ecdebfaad977e2ed0bd84001e3b6df736e84560b73506463"',
        'endpoint = PR_CONFIG.endpoint || "https://endpoint-dev.cognigy.ai/45c4ec61c937e830ecdebfaad977e2ed0bd84001e3b6df736e84560b73506463"'
    )

    # 4. Default selectedRelease to local build
    content = content.replace(
        'const [selectedRelease, setSelectedRelease] = useState("");',
        'const [selectedRelease, setSelectedRelease] = useState(PR_CONFIG.localBuildUrl);'
    )

    # 5. Prevent the releases-load useEffect from overriding PR build selection
    content = content.replace(
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
  }, [releases]);'''
    )

    # 6. Make the version selector label dynamic: "Pull Request" when PR build
    #    is selected, "Release" otherwise.  Also update the href to link to the
    #    PR page instead of the GitHub release page.
    content = content.replace(
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
          </a>'''
    )

    # 7. Add local PR build option at top of release <select>
    pr_option = (
        '<option value={PR_CONFIG.localBuildUrl}>\n'
        '                PR #{PR_CONFIG.prNumber} Build ({PR_CONFIG.commitSha?.substring(0, 7)})\n'
        '              </option>\n              '
    )
    content = content.replace(
        '{releases.map((release)',
        pr_option + '{releases.map((release)'
    )

    # 8. Replace the title
    content = content.replace(
        '<h1>Webchat Release Testing</h1>',
        '<h1>Webchat PR Preview</h1>'
    )

    app_path.write_text(content)
    print(f"  Patched {app_path}")


def patch_vite_config(config_path, base_path):
    content = config_path.read_text()
    content = content.replace(
        "export default defineConfig({",
        f'export default defineConfig({{\n  base: "{base_path}",'
    )
    config_path.write_text(content)
    print(f"  Patched {config_path}")


if __name__ == "__main__":
    if len(sys.argv) < 6:
        print("Usage: patch_testing_app.py <dir> <pr> <sha> <endpoint> <base>")
        sys.exit(1)

    d = pathlib.Path(sys.argv[1])
    patch_app_jsx(d / "src" / "App.jsx", sys.argv[2], sys.argv[3], sys.argv[4])
    patch_vite_config(d / "vite.config.js", sys.argv[5])
    print("Done!")
