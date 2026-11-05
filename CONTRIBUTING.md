# Contributing to Displacer

Contributions to the design language, libraries, examples, and documentation are
welcome. For a bug report, include the relevant component or API, platform,
reproduction steps, and expected behavior. Use small, self-contained examples
with synthetic data.

Execute Software and community contributors are recognized in
[CONTRIBUTORS.md](CONTRIBUTORS.md). You may add your preferred name to the
community section when submitting a contribution.

## Development workflow

1. Build the affected library using the [README](readme.md).
2. Keep changes focused and update the relevant specification or examples when
   behavior changes. Record coverage changes in [PORTING.md](PORTING.md).
3. Run the native CTest suite or Rust tests for native rendering changes. For
   web changes, build the library and showcase, then check the affected controls
   in a browser. See the [development guide](docs/development.md).
4. Describe what changed and which checks passed in the pull request. Mention
   API changes and known limitations.

Do not commit credentials, private conversations, internal project notes, local
service addresses, developer-specific paths, or generated build artifacts.
Use relative paths, explicit configuration, and synthetic examples. If adding
notebooks, review their Markdown, code, outputs, attachments, and metadata;
clear execution outputs and local kernel details before sharing them.

For a local secret scan, install
[Gitleaks 8.30.1](https://github.com/gitleaks/gitleaks/releases/tag/v8.30.1)
and run these commands from the repository root. Choose a new report directory
outside the checkout:

```sh
python3 scripts/test_audit_secrets.py
python3 scripts/audit_secrets.py --scanner /path/to/gitleaks --report-dir ../displacer-audit
```

The helper scans tracked and non-ignored source files, staged changes, and all
local Git refs. It refuses symlinks and submodules, keeps redacted reports
outside the checkout, and ignores inline scanner-suppression comments. Fetch
any additional branches or tags that need review first. The source-audit
workflow installs the same scanner from a checksum-pinned release and does not
upload reports. Never paste a scanner report into a public issue or pull
request: even redacted findings can reveal private surrounding context.
Pattern scanning does not replace review of proprietary content, notebooks,
attachments, generated artifacts, or Git history.

## Design changes

Use the [design specification](spec/README.md) as the starting point. Token JSON,
TypeScript constants, theme presets, and native palettes are separate files;
update affected consumers deliberately. Distinguish implemented behavior from
proposed behavior and check keyboard, contrast, and focus states when changing
interactive controls.

## Releases

Maintainers increment the rolling root `VERSION` with
`./scripts/bump-version.sh` as part of a default-branch release change. Cargo,
CMake, and npm compatibility versions are independent. Review all branches and
tags intended for publication: deleting a private detail in the latest revision
does not delete it from older commits. Do not change repository visibility until
the intended public history and source snapshot have been reviewed.

Contributions to original Displacer materials use the repository's
[MIT License](LICENSE). Preserve existing third-party notices.
