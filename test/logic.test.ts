import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { detectWorktree } from '../src/worktreeDetector';
import { configureEnv, replaceUrlHost } from '../src/envConfigurator';
import { readEnvValue } from '../src/envFile';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'worktree-env-test-'));
}

test('replaceUrlHost preserves scheme and TLD', () => {
  assert.equal(replaceUrlHost('http://myapp.test', 'myapp-feature'), 'http://myapp-feature.test');
});

test('replaceUrlHost preserves compound TLD', () => {
  assert.equal(replaceUrlHost('http://myapp.dev.br', 'myapp-feature'), 'http://myapp-feature.dev.br');
});

test('replaceUrlHost preserves port and path', () => {
  assert.equal(replaceUrlHost('http://myapp.dev.br:8080/api', 'myapp-feature'), 'http://myapp-feature.dev.br:8080/api');
});

test('replaceUrlHost preserves https', () => {
  assert.equal(replaceUrlHost('https://myapp.herd.local', 'myapp-feature'), 'https://myapp-feature.herd.local');
});

test('replaceUrlHost falls back on malformed URL', () => {
  assert.equal(replaceUrlHost('not-a-url', 'myapp-feature'), 'http://myapp-feature.test');
});

test('readEnvValue handles quoted values', () => {
  const envFile = path.join(tmpDir(), '.env');
  fs.writeFileSync(envFile, 'APP_NAME="My App"\nAPP_KEY=\'base64:secret\'');
  assert.equal(readEnvValue(envFile, 'APP_NAME'), 'My App');
  assert.equal(readEnvValue(envFile, 'APP_KEY'), 'base64:secret');
});

test('readEnvValue returns undefined for missing key', () => {
  const envFile = path.join(tmpDir(), '.env');
  fs.writeFileSync(envFile, 'APP_NAME=Test');
  assert.equal(readEnvValue(envFile, 'MISSING'), undefined);
});

test('configureEnv copies env and updates APP_URL in auto-detect mode', () => {
  const root = tmpDir();
  const mainDir = path.join(root, 'myapp');
  const wtDir = path.join(root, 'myapp-feature');
  fs.mkdirSync(mainDir);
  fs.mkdirSync(wtDir);
  fs.writeFileSync(path.join(mainDir, '.env'), 'APP_NAME=MyApp\nAPP_URL=http://myapp.test\nAPP_KEY=base64:xxx\nDB_HOST=127.0.0.1');

  const info = { worktreeRoot: wtDir, mainRoot: mainDir, worktreeFolderName: 'myapp-feature', mainFolderName: 'myapp' };
  const result = configureEnv(info, '', false);

  assert.equal(result.success, true);
  assert.equal(result.newAppUrl, 'http://myapp-feature.test');
  assert.equal(result.testingConfigured, false);

  const lines = fs.readFileSync(path.join(wtDir, '.env'), 'utf8').split('\n');
  assert.equal(lines[0], 'APP_NAME=MyApp');
  assert.equal(lines[1], 'APP_URL=http://myapp-feature.test');
  assert.equal(lines[2], 'APP_KEY=base64:xxx');
  assert.equal(lines[3], 'DB_HOST=127.0.0.1');
});

test('configureEnv uses pattern when provided', () => {
  const root = tmpDir();
  const mainDir = path.join(root, 'myapp');
  const wtDir = path.join(root, 'myapp-feature');
  fs.mkdirSync(mainDir);
  fs.mkdirSync(wtDir);
  fs.writeFileSync(path.join(mainDir, '.env'), 'APP_URL=http://myapp.test');

  const info = { worktreeRoot: wtDir, mainRoot: mainDir, worktreeFolderName: 'myapp-feature', mainFolderName: 'myapp' };
  const result = configureEnv(info, 'https://{folder}.local:8443', false);

  assert.equal(result.success, true);
  assert.equal(result.newAppUrl, 'https://myapp-feature.local:8443');
});

test('configureEnv errors when source env missing', () => {
  const root = tmpDir();
  const mainDir = path.join(root, 'myapp');
  const wtDir = path.join(root, 'myapp-feature');
  fs.mkdirSync(mainDir);
  fs.mkdirSync(wtDir);

  const info = { worktreeRoot: wtDir, mainRoot: mainDir, worktreeFolderName: 'myapp-feature', mainFolderName: 'myapp' };
  const result = configureEnv(info, '', false);

  assert.equal(result.success, false);
  assert.match(result.error ?? '', /Source \.env not found/);
});

test('configureEnv copies .env.testing when requested', () => {
  const root = tmpDir();
  const mainDir = path.join(root, 'myapp');
  const wtDir = path.join(root, 'myapp-feature');
  fs.mkdirSync(mainDir);
  fs.mkdirSync(wtDir);
  fs.writeFileSync(path.join(mainDir, '.env'), 'APP_URL=http://myapp.test\nDB_HOST=127.0.0.1');
  fs.writeFileSync(path.join(mainDir, '.env.testing'), 'APP_URL=http://myapp.test\nDB_HOST=sqlite');

  const info = { worktreeRoot: wtDir, mainRoot: mainDir, worktreeFolderName: 'myapp-feature', mainFolderName: 'myapp' };
  const result = configureEnv(info, '', true);

  assert.equal(result.testingConfigured, true);
  const testing = fs.readFileSync(path.join(wtDir, '.env.testing'), 'utf8');
  assert.match(testing, /APP_URL=http:\/\/myapp-feature\.test/);
  assert.match(testing, /DB_HOST=sqlite/);
});

test('detectWorktree returns undefined when .git is a directory (main project)', () => {
  const project = path.join(tmpDir(), 'myapp');
  fs.mkdirSync(project);
  const gitDir = path.join(project, '.git');
  fs.mkdirSync(gitDir);
  fs.writeFileSync(path.join(gitDir, 'HEAD'), 'ref: refs/heads/main');

  assert.equal(detectWorktree(project), undefined);
});

test('detectWorktree returns undefined when .git is absent', () => {
  const project = path.join(tmpDir(), 'myapp');
  fs.mkdirSync(project);
  assert.equal(detectWorktree(project), undefined);
});

test('detectWorktree returns undefined when .git has no gitdir prefix', () => {
  const project = path.join(tmpDir(), 'myapp');
  fs.mkdirSync(project);
  fs.writeFileSync(path.join(project, '.git'), 'something else');
  assert.equal(detectWorktree(project), undefined);
});

test('detectWorktree detects worktree via commondir', () => {
  const root = tmpDir();
  const mainProject = path.join(root, 'myapp');
  fs.mkdirSync(mainProject);
  const mainGitDir = path.join(mainProject, '.git');
  fs.mkdirSync(mainGitDir);
  fs.writeFileSync(path.join(mainGitDir, 'HEAD'), 'ref: refs/heads/main');

  const worktreesDir = path.join(mainGitDir, 'worktrees', 'feature-payment');
  fs.mkdirSync(worktreesDir, { recursive: true });
  fs.writeFileSync(path.join(worktreesDir, 'commondir'), '../..');
  fs.writeFileSync(path.join(worktreesDir, 'HEAD'), 'ref: refs/heads/feature-payment');

  const worktreeProject = path.join(root, 'myapp-feature-payment');
  fs.mkdirSync(worktreeProject);
  fs.writeFileSync(path.join(worktreeProject, '.git'), `gitdir: ${worktreesDir}`);

  const result = detectWorktree(worktreeProject);
  assert.ok(result);
  assert.equal(result!.worktreeFolderName, 'myapp-feature-payment');
  assert.equal(result!.mainFolderName, 'myapp');
});

test('detectWorktree handles relative gitdir path', () => {
  const root = tmpDir();
  const mainProject = path.join(root, 'myapp');
  fs.mkdirSync(mainProject);
  const mainGitDir = path.join(mainProject, '.git');
  fs.mkdirSync(mainGitDir);
  fs.writeFileSync(path.join(mainGitDir, 'HEAD'), 'ref: refs/heads/main');

  const worktreesDir = path.join(mainGitDir, 'worktrees', 'feature');
  fs.mkdirSync(worktreesDir, { recursive: true });
  fs.writeFileSync(path.join(worktreesDir, 'commondir'), '../..');
  fs.writeFileSync(path.join(worktreesDir, 'HEAD'), 'ref: refs/heads/feature');

  const worktreeProject = path.join(root, 'myapp-feature');
  fs.mkdirSync(worktreeProject);
  fs.writeFileSync(path.join(worktreeProject, '.git'), 'gitdir: ../myapp/.git/worktrees/feature');

  const result = detectWorktree(worktreeProject);
  assert.ok(result);
  assert.equal(result!.worktreeFolderName, 'myapp-feature');
  assert.equal(result!.mainFolderName, 'myapp');
});
