import * as vscode from 'vscode';

const KEY = 'worktreeEnv.ignoredProjects';

export function isIgnored(context: vscode.ExtensionContext, projectPath: string): boolean {
  return getIgnored(context).includes(projectPath);
}

export function addIgnored(context: vscode.ExtensionContext, projectPath: string): void {
  const list = getIgnored(context);
  if (!list.includes(projectPath)) {
    void context.globalState.update(KEY, [...list, projectPath]);
  }
}

export function resetIgnored(context: vscode.ExtensionContext): void {
  void context.globalState.update(KEY, []);
}

function getIgnored(context: vscode.ExtensionContext): string[] {
  return context.globalState.get<string[]>(KEY, []);
}
