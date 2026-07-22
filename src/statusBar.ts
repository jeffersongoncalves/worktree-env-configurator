import * as vscode from 'vscode';
import { WorktreeStatus } from './worktreeEnvService';

export function createStatusBarItem(): vscode.StatusBarItem {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  item.command = 'worktreeEnv.showActions';
  return item;
}

export function updateStatusBarItem(item: vscode.StatusBarItem, status: WorktreeStatus, currentAppUrl: string | undefined): void {
  switch (status) {
    case 'configured':
      item.text = '$(check) Worktree Env';
      item.tooltip = `Worktree .env: ${currentAppUrl}`;
      item.backgroundColor = undefined;
      item.show();
      break;
    case 'unconfigured':
      item.text = '$(warning) Worktree Env';
      item.tooltip = 'Worktree .env: Not configured — click to configure';
      item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      item.show();
      break;
    case 'not-worktree':
      item.hide();
      break;
  }
}
