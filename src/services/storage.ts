import { promises as fs } from 'fs';
import path from 'path';
import { env } from '../config/environment.js';
import { getStoragePath } from '../utils/path-sanitizer.js';

/**
 * Ensure a directory exists, creating it if necessary
 */
async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create directory: ${dirPath}`);
  }
}

/**
 * Store uploaded JSONL content for a session
 * @param id - Session ID
 * @param content - JSONL file content
 */
export async function storeJSONL(id: string, content: string): Promise<void> {
  const sessionDir = getStoragePath(env.STORAGE_PATH, id);
  await ensureDirectory(sessionDir);

  const jsonlPath = getStoragePath(env.STORAGE_PATH, id, 'session.jsonl');
  await fs.writeFile(jsonlPath, content, 'utf-8');
}

/**
 * Get the path to a session's JSONL file
 * @param id - Session ID
 * @returns Absolute path to session.jsonl
 */
export function getJSONLPath(id: string): string {
  return getStoragePath(env.STORAGE_PATH, id, 'session.jsonl');
}

/**
 * Get the path to a session's HTML file
 * @param id - Session ID
 * @returns Absolute path to conversation.html
 */
export function getHTMLPath(id: string): string {
  return getStoragePath(env.STORAGE_PATH, id, 'conversation.html');
}

/**
 * Get the path to a session's cache marker file
 * @param id - Session ID
 * @returns Absolute path to .cache-marker
 */
export function getCacheMarkerPath(id: string): string {
  return getStoragePath(env.STORAGE_PATH, id, '.cache-marker');
}

/**
 * Check if a session's HTML file exists
 * @param id - Session ID
 * @returns true if HTML file exists
 */
export async function htmlExists(id: string): Promise<boolean> {
  try {
    await fs.access(getHTMLPath(id));
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a session exists (has JSONL file)
 * @param id - Session ID
 * @returns true if session exists
 */
export async function sessionExists(id: string): Promise<boolean> {
  try {
    await fs.access(getJSONLPath(id));
    return true;
  } catch {
    return false;
  }
}

/**
 * Read HTML content for a session
 * @param id - Session ID
 * @returns HTML content
 */
export async function readHTML(id: string): Promise<string> {
  const htmlPath = getHTMLPath(id);
  return await fs.readFile(htmlPath, 'utf-8');
}

/**
 * Store cache marker for a session
 * @param id - Session ID
 * @param generationHash - Current generation hash
 */
export async function storeCacheMarker(
  id: string,
  generationHash: string
): Promise<void> {
  const markerPath = getCacheMarkerPath(id);
  const marker = {
    generationHash,
    timestamp: new Date().toISOString(),
  };
  await fs.writeFile(markerPath, JSON.stringify(marker, null, 2), 'utf-8');
}

/**
 * Read cache marker for a session
 * @param id - Session ID
 * @returns Cache marker or null if doesn't exist
 */
export async function readCacheMarker(
  id: string
): Promise<{ generationHash: string; timestamp: string } | null> {
  try {
    const markerPath = getCacheMarkerPath(id);
    const content = await fs.readFile(markerPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Get the generation config path
 * @returns Absolute path to generation.config.json
 */
export function getGenerationConfigPath(): string {
  return path.join(env.STORAGE_PATH, 'generation.config.json');
}

/**
 * Get the global generation marker path
 * @returns Absolute path to .generation-marker
 */
export function getGlobalMarkerPath(): string {
  return path.join(env.STORAGE_PATH, '.generation-marker');
}
