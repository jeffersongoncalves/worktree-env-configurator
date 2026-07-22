import * as vscode from 'vscode';
import * as path from 'path';
import { detectWorktree, WorktreeInfo } from './worktreeDetector';
import { readEnvValue } from './envFile';

export type WorktreeStatus = 'not-worktree' | 'unconfigured' | 'configured';

export class WorktreeEnvService {
  info: WorktreeInfo | undefined;
  status: WorktreeStatus = 'not-worktree';
  currentAppUrl: string | undefined;

  private readonly changeEmitter = new vscode.EventEmitter<void>();
  readonly onDidChangeStatus = this.changeEmitter.event;

  constructor(private readonly folder: vscode.WorkspaceFolder) {}

  refresh(): void {
    this.info = detectWorktree(this.folder.uri.fsPath);

    if (!this.info) {
      this.status = 'not-worktree';
      this.currentAppUrl = undefined;
    } else {
      const appUrl = readEnvValue(path.join(this.info.worktreeRoot, '.env'), 'APP_URL');
      this.currentAppUrl = appUrl;
      this.status =
        appUrl && appUrl.toLowerCase().includes(this.info.worktreeFolderName.toLowerCase())
          ? 'configured'
          : 'unconfigured';
    }

    this.changeEmitter.fire();
  }
}
