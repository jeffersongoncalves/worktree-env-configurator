import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { WorktreeEnvService } from './worktreeEnvService';
import { configureEnv } from './envConfigurator';
import { getSettings } from './config';
import { isIgnored, addIgnored, resetIgnored } from './ignoredStore';
import { createStatusBarItem, updateStatusBarItem } from './statusBar';

let service: WorktreeEnvService | undefined;

export function activate(context: vscode.ExtensionContext) {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) return;

  service = new WorktreeEnvService(folder);
  service.refresh();

  const statusBarItem = createStatusBarItem();
  context.subscriptions.push(statusBarItem);

  const render = () => updateStatusBarItem(statusBarItem, service!.status, service!.currentAppUrl);
  render();
  context.subscriptions.push(service.onDidChangeStatus(render));

  const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(folder, '.env{,.testing}'));
  const onEnvChange = () => service?.refresh();
  context.subscriptions.push(
    watcher,
    watcher.onDidCreate(onEnvChange),
    watcher.onDidChange(onEnvChange),
    watcher.onDidDelete(onEnvChange),

    vscode.commands.registerCommand('worktreeEnv.configure', () => runConfigure()),
    vscode.commands.registerCommand('worktreeEnv.openEnv', () => openEnv()),
    vscode.commands.registerCommand('worktreeEnv.refresh', () => service?.refresh()),
    vscode.commands.registerCommand('worktreeEnv.resetIgnored', () => {
      resetIgnored(context);
      vscode.window.showInformationMessage('Worktree Env: ignored projects list cleared.');
    }),
    vscode.commands.registerCommand('worktreeEnv.showActions', () => showActionsMenu())
  );

  void maybeNotify(context, folder.uri.fsPath);
}

async function maybeNotify(context: vscode.ExtensionContext, folderPath: string): Promise<void> {
  const settings = getSettings();
  if (!settings.autoConfigureOnOpen) return;
  if (isIgnored(context, folderPath)) return;
  if (!service || service.status !== 'unconfigured' || !service.info) return;
  if (!fs.existsSync(path.join(service.info.mainRoot, '.env'))) return;

  const { info } = service;
  const choice = await vscode.window.showInformationMessage(
    `Git worktree "${info.worktreeFolderName}" detected from main project "${info.mainFolderName}".`,
    'Configure .env',
    'Ignore this project'
  );

  if (choice === 'Configure .env') {
    await runConfigure();
  } else if (choice === 'Ignore this project') {
    addIgnored(context, folderPath);
  }
}

async function runConfigure(): Promise<void> {
  if (!service?.info) {
    vscode.window.showWarningMessage('Worktree Env: this folder is not a Git worktree.');
    return;
  }

  const settings = getSettings();
  const result = configureEnv(service.info, settings.appUrlPattern, settings.copyTestingEnv);

  if (!result.success) {
    vscode.window.showErrorMessage(`Worktree Env: ${result.error}`);
    return;
  }

  service.refresh();
  if (settings.openEnvInEditor) await openEnv();

  const testingMsg = result.testingConfigured ? ' (.env.testing also configured)' : '';
  vscode.window.showInformationMessage(`Worktree Env: APP_URL set to ${result.newAppUrl}${testingMsg}`);
}

async function openEnv(): Promise<void> {
  if (!service?.info) return;
  const envPath = path.join(service.info.worktreeRoot, '.env');
  if (!fs.existsSync(envPath)) return;

  const doc = await vscode.workspace.openTextDocument(envPath);
  await vscode.window.showTextDocument(doc);
}

async function showActionsMenu(): Promise<void> {
  if (!service?.info) return;

  const configureLabel = service.status === 'configured' ? 'Reconfigure .env' : 'Configure .env';
  const pick = await vscode.window.showQuickPick([configureLabel, 'Open .env in Editor', 'Refresh'], {
    placeHolder: `Worktree: ${service.info.worktreeFolderName} (main: ${service.info.mainFolderName})`
  });

  if (pick === configureLabel) {
    await runConfigure();
  } else if (pick === 'Open .env in Editor') {
    await openEnv();
  } else if (pick === 'Refresh') {
    service.refresh();
  }
}

export function deactivate() {}
