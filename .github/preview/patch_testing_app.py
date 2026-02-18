#!/usr/bin/env python3
"""
Patches the Webchat-Testing app for PR preview usage.

Usage:
    python3 patch_testing_app.py <testing_dir> <pr_number> <commit_sha> <endpoint_url> <base_path>

Modifications:
  - App.jsx: Adds PR info banner, inserts a "PR Build" option at the top of the
    release dropdown (pre-selected), pre-fills endpoint from build config,
    prevents release-load from overriding the PR build selection.
  - vite.config.js: Sets the `base` path for correct asset loading on gh-pages.
  - index.css: Adds styles for the PR banner.
"""

import sys
import pathlib


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

    # 2. Replace the default endpoint with PR_CONFIG.endpoint
    content = content.replace(
        'endpoint = "https://endpoint-dev.cognigy.ai/45c4ec61c937e830ecdebfaad977e2ed0bd84001e3b6df736e84560b73506463"',
        'endpoint = PR_CONFIG.endpoint || "https://endpoint-dev.cognigy.ai/45c4ec61c937e830ecdebfaad977e2ed0bd84001e3b6df736e84560b73506463"'
    )

    # 3. Default selectedRelease to local build
    content = content.replace(
        'const [selectedRelease, setSelectedRelease] = useState("");',
        'const [selectedRelease, setSelectedRelease] = useState(PR_CONFIG.localBuildUrl);'
    )

    # 4. Prevent the releases-load useEffect from overriding PR build selection
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

    # 5. Add the PR banner after <div className="ui">
    banner = (
        '<div className="pr-banner">\n'
        '          <strong>PR Preview</strong>\n'
        '          <span className="pr-pill">PR #{PR_CONFIG.prNumber}</span>\n'
        '          <span className="pr-pill">{PR_CONFIG.commitSha?.substring(0, 7)}</span>\n'
        '        </div>\n        '
    )
    content = content.replace(
        '<div className="ui">',
        '<div className="ui">\n        ' + banner
    )

    # 6. Add local PR build option at top of release <select>
    pr_option = (
        '<option value={PR_CONFIG.localBuildUrl}>\n'
        '                PR #{PR_CONFIG.prNumber} Build ({PR_CONFIG.commitSha?.substring(0, 7)})\n'
        '              </option>\n              '
    )
    content = content.replace(
        '{releases.map((release)',
        pr_option + '{releases.map((release)'
    )

    # 7. Replace the title
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


def patch_css(css_path):
    banner_css = """\
/* --- PR Preview Banner --- */
.pr-banner {
    width: 100%;
    background: #1a1a2e;
    color: #e0e0e0;
    padding: 10px 24px;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    position: sticky;
    top: 0;
    z-index: 9999;
}
.pr-banner strong { color: #fff; }
.pr-pill {
    background: #2d2d4a;
    border-radius: 12px;
    padding: 2px 10px;
    font-family: monospace;
    font-size: 12px;
    color: #c3c3ff;
}

"""
    content = css_path.read_text()
    css_path.write_text(banner_css + content)
    print(f"  Patched {css_path}")


if __name__ == "__main__":
    if len(sys.argv) < 6:
        print("Usage: patch_testing_app.py <dir> <pr> <sha> <endpoint> <base>")
        sys.exit(1)

    d = pathlib.Path(sys.argv[1])
    patch_app_jsx(d / "src" / "App.jsx", sys.argv[2], sys.argv[3], sys.argv[4])
    patch_vite_config(d / "vite.config.js", sys.argv[5])
    patch_css(d / "src" / "index.css")
    print("Done!")
