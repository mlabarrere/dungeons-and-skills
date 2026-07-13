# Security Policy

## Scope

This is a rules-reference and character-builder skill pack. Its runtime surface is small: the
Node scripts in `engine/` and `scripts/` read local JSON and Markdown and print text. They do not
make network calls, and they should never execute untrusted input. If you find a way to make them
write outside the repo, execute arbitrary code, or exfiltrate data, that is a vulnerability.

## Supported versions

The latest `main` is supported. There are no long-term support branches yet (pre-1.0).

## Reporting a vulnerability

Please **do not** open a public issue for a security problem. Instead use GitHub's
**private vulnerability reporting** ("Report a vulnerability" under the repository's Security tab),
or contact the maintainers privately. Include steps to reproduce and the impact.

We aim to acknowledge a report within a few days and to fix confirmed issues before any public
disclosure.
