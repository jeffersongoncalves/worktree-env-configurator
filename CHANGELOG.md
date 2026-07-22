# Changelog

All notable changes to the "Worktree Env Configurator" extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.1.0] - 2026-07-22

### Added
- Git worktree detection via `.git` file / `gitdir:` / `commondir` parsing, with directory-traversal fallback.
- `.env` copy from the main worktree with `APP_URL` host rewriting (preserves scheme, compound TLD, port, path).
- Optional `.env.testing` copy alongside `.env`.
- Custom `APP_URL` pattern support via `{folder}` placeholder.
- Status bar item reflecting configured/unconfigured/not-a-worktree state, with a Quick Pick actions menu.
- Startup notification with Configure / Ignore actions; ignored projects persisted in extension global state.
- Commands: Configure .env, Open .env in Editor, Refresh Status, Reset Ignored Projects.
