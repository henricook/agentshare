import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { env } from '../config/environment.js';
import {
  getGenerationConfigPath,
  getGlobalMarkerPath,
} from './storage.js';

let cachedGenerationHash: string | null = null;

/**
 * Calculate SHA-256 hash of a file
 * @param filePath - Path to file
 * @returns SHA-256 hash as hex string
 */
async function hashFile(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath);
    return createHash('sha256').update(content).digest('hex');
  } catch (error) {
    throw new Error(`Failed to hash file ${filePath}: ${error}`);
  }
}

/**
 * Calculate the current generation hash
 * Based on cclogviewer binary hash + generation config hash
 * @returns SHA-256 hash representing current generation configuration
 */
async function calculateGenerationHash(): Promise<string> {
  const binaryHash = await hashFile(env.CCLOGVIEWER_BIN_PATH);
  const configHash = await hashFile(getGenerationConfigPath());

  // Combine both hashes
  const combined = `${binaryHash}:${configHash}`;
  return createHash('sha256').update(combined).digest('hex');
}

/**
 * Get the current generation hash (cached)
 * @returns Current generation hash
 */
export async function getGenerationHash(): Promise<string> {
  if (cachedGenerationHash) {
    return cachedGenerationHash;
  }

  cachedGenerationHash = await calculateGenerationHash();
  return cachedGenerationHash;
}

/**
 * Ensure generation config file exists, create default if not
 */
async function ensureGenerationConfig(): Promise<void> {
  const configPath = getGenerationConfigPath();
  try {
    await fs.access(configPath);
  } catch {
    // Config doesn't exist, create default
    const defaultConfig = {
      version: '1.0.0',
      styling: {
        customCSS: false,
        theme: 'default',
      },
      cclogviewerArgs: [],
    };
    await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    console.log('Created default generation config');
  }
}

/**
 * Initialize the generation marker system
 * Creates the global marker file with current generation hash
 * Should be called on server startup
 */
export async function initializeGenerationMarker(): Promise<void> {
  // Ensure config file exists
  await ensureGenerationConfig();

  const hash = await getGenerationHash();
  const marker = {
    generationHash: hash,
    timestamp: new Date().toISOString(),
    binaryPath: env.CCLOGVIEWER_BIN_PATH,
    configPath: getGenerationConfigPath(),
  };

  const markerPath = getGlobalMarkerPath();
  await fs.writeFile(markerPath, JSON.stringify(marker, null, 2), 'utf-8');

  console.log('Generation marker initialized:', hash);
}

/**
 * Invalidate the cached generation hash
 * Call this if you need to force recalculation (e.g., during hot reload in dev)
 */
export function invalidateGenerationCache(): void {
  cachedGenerationHash = null;
}
