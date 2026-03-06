// paths.mjs — Platform-appropriate directory paths for TeamDNA
import { homedir, platform } from 'node:os';
import { join } from 'node:path';

/**
 * Get config directory path (XDG-compliant on Linux)
 * - Linux: $XDG_CONFIG_HOME/teamdna (default: ~/.config/teamdna)
 * - macOS/Windows: ~/.teamdna
 */
export const getConfigDir = () => {
  if (platform() === 'linux') {
    return join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'teamdna');
  }
  return join(homedir(), '.teamdna');
};

/**
 * Get data directory path (XDG-compliant on Linux)
 * - Linux: $XDG_DATA_HOME/teamdna (default: ~/.local/share/teamdna)
 * - macOS/Windows: ~/.teamdna/repo
 */
export const getDefaultDataDir = () => {
  if (platform() === 'linux') {
    return join(process.env.XDG_DATA_HOME || join(homedir(), '.local', 'share'), 'teamdna');
  }
  return join(getConfigDir(), 'repo');
};

/**
 * Get config file path
 */
export const getConfigPath = () => join(getConfigDir(), 'config');
