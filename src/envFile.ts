import * as fs from 'fs';

export function readEnvValue(envFile: string, key: string): string | undefined {
  if (!fs.existsSync(envFile)) return undefined;

  const prefix = `${key}=`;
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    if (line.startsWith(prefix)) {
      return line
        .slice(prefix.length)
        .trim()
        .replace(/^"(.*)"$/, '$1')
        .replace(/^'(.*)'$/, '$1');
    }
  }
  return undefined;
}
