import { randomUUID } from 'crypto';

/**
 * Generate a cryptographically secure UUID v4
 * Uses Node.js built-in crypto.randomUUID() which provides 122 bits of entropy
 * @returns UUID v4 string (e.g., "550e8400-e29b-41d4-a716-446655440000")
 */
export function generateId(): string {
  return randomUUID();
}

/**
 * Validate that a string is a valid UUID v4
 * @param id - String to validate
 * @returns true if valid UUID v4, false otherwise
 */
export function isValidUUID(id: string): boolean {
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(id);
}
