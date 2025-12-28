# Contributing

## Where to focus
- Refactoring post vibe-coding bugs: clearer naming, leaner functions, fewer side effects.
- Performance and resource optimizations: reduce memory/CPU, shrink queue time, remove duplicated work.
- New themes; keep them lightweight and consistent across preview/export.

## Working style
- Small PRs with a single purpose preferred; document the before/after
- When refactoring, preserve behavior; add small comments only where logic is non-obvious.
- For performance tweaks, include a quick note on the scenario tested and observed impact.
- For themes, check both preview and PDF export.

## Before you open a PR
- Smoke test the relevant path (e.g., render a resume, export PDF, switch themes).
- Update docs only if instructions change; otherwise keep the README lean.

## PR checklist
- [ ] Scope is tight and described in the PR body.
- [ ] Behavior matches prior state unless explicitly improved.
- [ ] Added/updated themes render cleanly in both UI and exports.
- [ ] Notes on performance impact or refactor intent are included.
