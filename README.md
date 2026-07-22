# Worktree Env Configurator

> Auto-configure `.env` files for Git worktree projects in VS Code.

**Worktree Env Configurator** detects when a project is opened as a [Git worktree](https://git-scm.com/docs/git-worktree) and automatically configures the `.env` file by copying it from the main worktree and adjusting `APP_URL` to match the worktree folder name.

- **Homepage**: [GitHub](https://github.com/jeffersongoncalves/worktree-env-configurator-vscode)
- **Issues**: [GitHub Issues](https://github.com/jeffersongoncalves/worktree-env-configurator-vscode/issues)

This is a VS Code port of the JetBrains plugin [worktree-env-plugin](https://github.com/jeffersongoncalves/worktree-env-plugin).

## The Problem

When using Git worktrees with Laravel (or any) projects, each worktree lives in a separate folder (e.g., `myapp-feature-payment`) and needs its own `.env` with `APP_URL` pointing to the correct local hostname. With Laravel Herd or Valet, this means `http://myapp-feature-payment.test`.

Today this is manual: copy `.env`, edit `APP_URL`. This extension automates it.

## Features

- **Auto-detection** — Detects Git worktree projects on open via `.git` file parsing
- **Smart APP_URL** — Preserves scheme, compound TLDs, port, and path from the original URL
- **Status bar item** — Color-coded icon showing worktree `.env` status at a glance
- **Quick actions menu** — Click the status bar item for Configure / Open / Refresh
- **Live updates** — Reacts to `.env` file changes in real time
- **Configurable pattern** — Use `{folder}` placeholder for custom URL patterns
- **`.env.testing` support** — Optionally copies and configures the testing env
- **Smart notification** — Prompt with "Configure" and "Ignore" actions on project open
- **Lowercase URLs** — All generated `APP_URL` values are lowercased for consistent hostname resolution

## Requirements

- VS Code 1.85+
- A project opened as a Git worktree (root `.git` is a file pointing to `gitdir:`, not a directory)

## Installation

Install from the `.vsix` (see [Building from Source](#building-from-source)) via **Extensions → ⋯ → Install from VSIX...**, or from the VS Code Marketplace once published.

## Usage

### Quick Start

1. Open a Git worktree folder in VS Code
2. If unconfigured, a notification appears — click **Configure .env**
3. The `.env` is copied from the main worktree and `APP_URL` is adjusted
4. The status bar item (bottom-right) turns green when configured

### Status Bar

- **$(check) green** — `.env` is configured with the correct `APP_URL` (hover for the URL)
- **$(warning) orange** — Worktree detected but `.env` not yet configured

Click the item to open the actions menu (Configure / Reconfigure, Open .env in Editor, Refresh).

### Commands

Available via the Command Palette under **Worktree Env**:

| Command | Description |
|---|---|
| `Worktree Env: Configure .env for Worktree` | Copy and configure `.env` (and `.env.testing`) |
| `Worktree Env: Open .env in Editor` | Open the worktree's `.env` |
| `Worktree Env: Refresh Status` | Re-detect worktree state |
| `Worktree Env: Reset Ignored Projects` | Clear the "ignore this project" list |

### APP_URL Resolution

The extension intelligently replaces only the hostname while preserving everything else:

| Main Worktree `.env` | Worktree Folder | Generated `APP_URL` |
|---|---|---|
| `http://myapp.test` | `myapp-feature` | `http://myapp-feature.test` |
| `https://myapp.herd.local` | `myapp-feature` | `https://myapp-feature.herd.local` |
| `http://myapp.dev.br:8080/api` | `myapp-feature` | `http://myapp-feature.dev.br:8080/api` |

Or use a custom pattern in settings: `http://{folder}.test`

## Settings

| Setting | Default | Description |
|---|---|---|
| `worktreeEnv.autoConfigureOnOpen` | `true` | Show notification when a worktree is detected on open |
| `worktreeEnv.copyTestingEnv` | `true` | Also configure `.env.testing` if it exists in the main worktree |
| `worktreeEnv.openEnvInEditor` | `true` | Open `.env` in the editor after configuration |
| `worktreeEnv.appUrlPattern` | _(empty)_ | Custom URL pattern using `{folder}` placeholder. Empty = auto-detect from main `.env` |

### Ignored Projects

Clicking "Ignore this project" on the notification stores the workspace path in extension global state, so the notification won't show again for that folder. Reset via the **Worktree Env: Reset Ignored Projects** command.

## How It Works

1. On activation, reads the `.git` file (not directory) in the workspace root — this indicates a worktree
2. Parses the `gitdir:` path and resolves the main worktree via `commondir` (falls back to directory traversal)
3. Checks if `.env` exists in the worktree with the correct `APP_URL`
4. If not configured, shows a notification with actions
5. On configure: copies `.env` from the main worktree, replacing only the `APP_URL` line
6. A file watcher tracks `.env` / `.env.testing` changes and updates the status bar in real time

## Building from Source

```bash
git clone git@github.com:jeffersongoncalves/worktree-env-configurator-vscode.git
cd worktree-env-configurator-vscode

npm install

# Build
npm run compile

# Run tests
npm test

# Lint
npm run lint

# Press F5 in VS Code to launch the Extension Development Host
```

## License

[MIT](LICENSE)

## Author

**Jefferson Gonçalves** — [GitHub](https://github.com/jeffersongoncalves)
