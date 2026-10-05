# Contributing to ClimateOS

Thank you for contributing! This is a hackathon project — keep PRs small, focused, and easy to review.

---

## Branch Naming

```
feature/<short-description>     # New feature
fix/<short-description>         # Bug fix
chore/<short-description>       # Config, docs, refactor
```

Examples:
- `feature/risk-engine-zone-a`
- `fix/shelter-occupancy-display`
- `chore/update-readme`

---

## PR Guidelines

- **One feature per PR.** Don't bundle unrelated changes.
- **Keep PRs small** — under 300 lines changed is ideal for a hackathon.
- **Describe what you did** in the PR description: what changed, why, and how to test it.
- **Don't edit another person's files** without telling them first (check the ownership table in README.md).
- **All tests must pass** before merging: `pytest tests/test_api.py -v`

---

## File Ownership

Before editing a file, check the **Who Owns What** table in [README.md](README.md).
If you need to change a file owned by someone else, message them first.

---

## Code Style

**Python (backend)**
- Follow PEP 8.
- Add docstrings to every function.
- Mark stubs with `# TODO (Feature Name): What needs to be replaced.`

**JavaScript (frontend)**
- ES modules only (use `import`/`export` — no `<script>` globals).
- All `fetch()` calls go in `js/api.js` only.
- Add `// TODO` comments where real logic will go.

**CSS**
- Use CSS variables from `css/base.css` — never hardcode colors.
- Component styles go in `css/components.css`.
- Page layout goes in `css/layout.css`.

---

## Commit Messages

Use conventional commit style:

```
feat: add shelter distance sorting
fix: correct confidence badge color for low confidence
chore: update requirements.txt
docs: add API endpoint description
```

---

## Questions?

Open an issue or tag the relevant feature owner in your PR.

> ⚠️ ClimateOS supports decisions; authorized emergency authorities make final calls.
