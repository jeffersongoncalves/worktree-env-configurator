import * as vscode from 'vscode';

export function getSettings() {
  const cfg = vscode.workspace.getConfiguration('worktreeEnv');
  return {
    autoConfigureOnOpen: cfg.get<boolean>('autoConfigureOnOpen', true),
    appUrlPattern: cfg.get<string>('appUrlPattern', ''),
    copyTestingEnv: cfg.get<boolean>('copyTestingEnv', true),
    openEnvInEditor: cfg.get<boolean>('openEnvInEditor', true)
  };
}
