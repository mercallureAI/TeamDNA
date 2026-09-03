// paths.mjs — Platform-appropriate directory paths and config helpers for TeamDNA
import { homedir, platform } from 'node:os';
import { join } from 'node:path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';

/**
 * Get config directory path.
 * Explicit XDG_CONFIG_HOME overrides the platform default.
 * - Linux: $XDG_CONFIG_HOME/teamdna (default: ~/.config/teamdna)
 * - macOS/Windows: ~/.teamdna
 */
export const getConfigDir = () => {
  if (process.env.XDG_CONFIG_HOME) {
    return join(process.env.XDG_CONFIG_HOME, 'teamdna');
  }
  if (platform() === 'linux') {
    return join(homedir(), '.config', 'teamdna');
  }
  return join(homedir(), '.teamdna');
};

/**
 * Get data directory path.
 * Explicit XDG_DATA_HOME overrides the platform default.
 * - Linux: $XDG_DATA_HOME/teamdna (default: ~/.local/share/teamdna)
 * - macOS/Windows: ~/.teamdna/repo
 */
export const getDefaultDataDir = () => {
  if (process.env.XDG_DATA_HOME) {
    return join(process.env.XDG_DATA_HOME, 'teamdna');
  }
  if (platform() === 'linux') {
    return join(homedir(), '.local', 'share', 'teamdna');
  }
  return join(getConfigDir(), 'repo');
};

/**
 * Get config file path
 */
export const getConfigPath = () => join(getConfigDir(), 'config');

/**
 * Read TeamDNA config file.
 * Returns { repoPath, configPath, configDir } or null if not initialized.
 */
export function readConfig() {
  const configPath = getConfigPath();
  if (!existsSync(configPath)) return null;
  const content = readFileSync(configPath, 'utf-8');
  const repoPath = content.match(/repo_path=(.+)/)?.[1]?.trim();
  if (!repoPath) return null;
  return { repoPath, configPath, configDir: getConfigDir() };
}

/**
 * Get repo path from config, throwing if not initialized.
 */
export function getRepoPath() {
  const config = readConfig();
  if (!config) throw new Error('TeamDNA is not initialized. Call teamdna_init with your team\'s Git repo URL.');
  return config.repoPath;
}

/**
 * Write TeamDNA config file with the given repo path.
 */
export function writeConfig(repoPath) {
  const configDir = getConfigDir();
  mkdirSync(configDir, { recursive: true });
  writeFileSync(join(configDir, 'config'), `repo_path=${repoPath}\n`);
}
