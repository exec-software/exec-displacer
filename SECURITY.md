# Reporting security issues

For a vulnerability or credential exposure, use GitHub's private vulnerability
reporting for this repository when available. If no private reporting channel
is available, open a minimal issue requesting one without including exploit
details, credentials, or private data. Ordinary bugs can be reported publicly.

Include the affected revision, relevant component, impact, and a minimal
reproduction in the private report. Do not test against another person's
application or infrastructure.

## Integration boundaries

- TrueType loading accepts trusted fonts only. The bundled `stb_truetype`
  parser is not suitable for untrusted uploaded font data.
- The developer console is a client UI for optional application endpoints.
  Applications must authenticate and authorize their own console and agent
  operations; Displacer does not supply a backend or access-control service.
- Web theme presets may load external font stylesheets when applied. Hosts
  control those URLs and can use system or self-hosted fonts instead.

Keep local configuration and secrets outside the source tree. If a credential
is committed, revoke or rotate it and review historical exposure; removing the
current file alone does not remove the credential from Git history.
