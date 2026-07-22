import * as fs from 'fs';
import * as path from 'path';

export interface WorktreeInfo {
  worktreeRoot: string;
  mainRoot: string;
  worktreeFolderName: string;
  mainFolderName: string;
}

/**
 * Detects whether baseDir is a Git worktree (i.e. its `.git` is a file
 * pointing at `gitdir:`, not a directory) and resolves the main worktree
 * it was created from.
 */
export function detectWorktree(baseDir: string): WorktreeInfo | undefined {
  const gitEntry = path.join(baseDir, '.git');
  if (!fs.existsSync(gitEntry) || fs.statSync(gitEntry).isDirectory()) return undefined;

  const content = fs.readFileSync(gitEntry, 'utf8').trim();
  if (!content.startsWith('gitdir:')) return undefined;

  const gitdirPath = content.slice('gitdir:'.length).trim().replace(/\\/g, '/');
  const gitdirFile = path.isAbsolute(gitdirPath) ? gitdirPath : path.join(baseDir, gitdirPath);

  const mainGitDir = resolveMainGitDirViaCommondir(gitdirFile) ?? resolveMainGitDirByTraversal(baseDir);
  if (!mainGitDir) return undefined;

  const mainRoot = path.dirname(realpath(mainGitDir));
  const worktreeRoot = realpath(baseDir);
  if (pathsEqual(worktreeRoot, mainRoot)) return undefined;

  return {
    worktreeRoot,
    mainRoot,
    worktreeFolderName: path.basename(worktreeRoot),
    mainFolderName: path.basename(mainRoot)
  };
}

function resolveMainGitDirViaCommondir(gitdirFile: string): string | undefined {
  const commondirFile = path.join(gitdirFile, 'commondir');
  if (!fs.existsSync(commondirFile)) return undefined;

  const commondirPath = fs.readFileSync(commondirFile, 'utf8').trim().replace(/\\/g, '/');
  const mainGitDir = realpath(path.join(gitdirFile, commondirPath));
  return fs.existsSync(path.join(mainGitDir, 'HEAD')) ? mainGitDir : undefined;
}

function resolveMainGitDirByTraversal(startDir: string): string | undefined {
  let current: string | undefined = path.dirname(realpath(startDir));
  while (current) {
    const gitDir = path.join(current, '.git');
    if (fs.existsSync(gitDir) && fs.statSync(gitDir).isDirectory() && fs.existsSync(path.join(gitDir, 'HEAD'))) {
      return gitDir;
    }
    const parent = path.dirname(current);
    current = parent === current ? undefined : parent;
  }
  return undefined;
}

function realpath(p: string): string {
  try {
    return fs.realpathSync(p);
  } catch {
    return path.resolve(p);
  }
}

// ponytail: case-insensitive compare covers Windows/macOS; exact match on Linux would need fs.case detection, not worth it here
function pathsEqual(a: string, b: string): boolean {
  return process.platform === 'darwin' || process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b;
}
