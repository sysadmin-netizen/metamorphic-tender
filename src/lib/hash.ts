export function hashObject(obj: unknown): string {
  const str = JSON.stringify(
    obj,
    Object.keys(obj as Record<string, unknown>).sort()
  );
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}
