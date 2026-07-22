import * as fs from 'fs';
import * as path from 'path';
import { WorktreeInfo } from './worktreeDetector';
import { readEnvValue } from './envFile';

export interface ConfigureResult {
  success: boolean;
  newAppUrl: string;
  testingConfigured: boolean;
  error?: string;
}

export function configureEnv(info: WorktreeInfo, appUrlPattern: string, copyTesting: boolean): ConfigureResult {
  const sourceEnv = path.join(info.mainRoot, '.env');
  if (!fs.existsSync(sourceEnv)) {
    return { success: false, newAppUrl: '', testingConfigured: false, error: `Source .env not found at ${info.mainRoot}` };
  }

  const newAppUrl = resolveAppUrl(info, appUrlPattern, sourceEnv);
  copyEnvWithAppUrl(sourceEnv, path.join(info.worktreeRoot, '.env'), newAppUrl);

  let testingConfigured = false;
  const sourceTesting = path.join(info.mainRoot, '.env.testing');
  if (copyTesting && fs.existsSync(sourceTesting)) {
    copyEnvWithAppUrl(sourceTesting, path.join(info.worktreeRoot, '.env.testing'), newAppUrl);
    testingConfigured = true;
  }

  return { success: true, newAppUrl, testingConfigured };
}

function resolveAppUrl(info: WorktreeInfo, pattern: string, sourceEnv: string): string {
  if (pattern.trim().length > 0) {
    return pattern.replace('{folder}', info.worktreeFolderName).toLowerCase();
  }

  const currentUrl = readEnvValue(sourceEnv, 'APP_URL');
  if (!currentUrl) return `http://${info.worktreeFolderName}.test`.toLowerCase();

  return replaceUrlHost(currentUrl, info.worktreeFolderName).toLowerCase();
}

/** Replaces only the hostname of url, preserving scheme, compound TLD, port and path. */
export function replaceUrlHost(url: string, newHost: string): string {
  try {
    const u = new URL(url);
    const dotIndex = u.hostname.indexOf('.');
    const newHostname = dotIndex < 0 ? newHost : `${newHost}${u.hostname.slice(dotIndex)}`;
    const port = u.port ? `:${u.port}` : '';
    const pathPart = u.pathname === '/' ? '' : u.pathname;
    return `${u.protocol}//${newHostname}${port}${pathPart}`;
  } catch {
    return `http://${newHost}.test`;
  }
}

function copyEnvWithAppUrl(source: string, dest: string, newAppUrl: string): void {
  const lines = fs.readFileSync(source, 'utf8').split(/\r?\n/);
  const updated = lines.map((line) => (line.startsWith('APP_URL=') ? `APP_URL=${newAppUrl}` : line));
  fs.writeFileSync(dest, updated.join('\n'));
}
