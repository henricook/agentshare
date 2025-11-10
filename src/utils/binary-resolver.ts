import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

/**
 * Check if a file exists at the given path
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve the cclogviewer binary path
 * Tries multiple common locations in order:
 * 1. CCLOGVIEWER_BIN_PATH environment variable (if set)
 * 2. /app/bin/cclogviewer (Docker/Kubernetes deployment)
 * 3. ~/go/bin/cclogviewer (local development with go install)
 *
 * @returns Absolute path to cclogviewer binary
 * @throws Error if binary cannot be found
 */
export async function resolveCclogviewerPath(): Promise<string> {
  const envPath = process.env.CCLOGVIEWER_BIN_PATH;

  // If env var is set, use it (and fail if it doesn't exist)
  if (envPath) {
    if (await fileExists(envPath)) {
      return path.resolve(envPath);
    }
    throw new Error(
      `CCLOGVIEWER_BIN_PATH is set to "${envPath}" but file does not exist`
    );
  }

  // Try common locations
  const candidates = [
    '/app/bin/cclogviewer', // Docker/Kubernetes
    path.join(os.homedir(), 'go/bin/cclogviewer'), // Local development
  ];

  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      return candidate;
    }
  }

  // Not found anywhere
  throw new Error(
    'cclogviewer binary not found. Please either:\n' +
      '  1. Set CCLOGVIEWER_BIN_PATH environment variable, or\n' +
      '  2. Install cclogviewer: go install github.com/brads3290/cclogviewer/cmd/cclogviewer@latest'
  );
}
