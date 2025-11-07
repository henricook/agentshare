import path from 'path';
import { isValidUUID } from './id-generator.js';

/**
 * Sanitize and validate a session ID
 * Ensures the ID is a valid UUID v4 to prevent path traversal attacks
 * @param id - Session ID to validate
 * @throws Error if ID is invalid
 * @returns Sanitized ID
 */
export function sanitizeId(id: string): string {
  if (!isValidUUID(id)) {
    throw new Error('Invalid ID format');
  }
  return id;
}

/**
 * Get a safe storage path for a session ID and optional filename
 * Validates that the resolved path stays within the storage directory
 * @param storagePath - Base storage directory path
 * @param id - Session ID
 * @param filename - Optional filename within the session directory
 * @throws Error if path traversal is detected
 * @returns Safe absolute path
 */
export function getStoragePath(
  storagePath: string,
  id: string,
  filename?: string
): string {
  const safeId = sanitizeId(id);
  const basePath = path.resolve(storagePath);

  const fullPath = filename
    ? path.join(basePath, safeId, filename)
    : path.join(basePath, safeId);

  // Ensure the resolved path is within the storage directory
  if (!fullPath.startsWith(basePath + path.sep)) {
    throw new Error('Path traversal detected');
  }

  return fullPath;
}
