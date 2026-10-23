# CLAUDE.md

@AGENTS.md

## Claude Code specifics
- Project skills are in `.claude/skills/` (`waste-category-sync`, `add-api-endpoint`). Use them when the task matches.
- Always create/switch to a new git branch before making changes.
- Prefer small, reviewable diffs; explain which of the 4 services (frontend, admin, backend, ml_service) you touched.
- Ask before running anything that modifies the database or deletes files.
