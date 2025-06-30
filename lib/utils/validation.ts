// UUID validation regex - matches UUID v1-v5
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID format
 * @param uuid - The string to validate
 * @returns true if the string is a valid UUID, false otherwise
 */
export function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid);
}

/**
 * Validates multiple UUIDs at once
 * @param uuids - Array of strings to validate
 * @returns true if all strings are valid UUIDs, false otherwise
 */
export function areValidUUIDs(uuids: string[]): boolean {
  return uuids.every(uuid => isValidUUID(uuid));
}

/**
 * Sanitizes and validates a UUID parameter
 * @param uuid - The UUID string to sanitize
 * @returns The trimmed UUID if valid, null if invalid
 */
export function sanitizeUUID(uuid: string | null | undefined): string | null {
  if (!uuid || typeof uuid !== 'string') {
    return null;
  }
  
  const trimmed = uuid.trim();
  return isValidUUID(trimmed) ? trimmed : null;
}