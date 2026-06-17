export const MAX_TAG_NAME_LENGTH = 32;

export function normalizeTagName(name: string): string {
  return name.trim().toLowerCase();
}

export function validateTagName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Tag name cannot be empty');
  }
  if (trimmed.length > MAX_TAG_NAME_LENGTH) {
    throw new Error(`Tag name cannot exceed ${MAX_TAG_NAME_LENGTH} characters`);
  }
  return trimmed;
}
