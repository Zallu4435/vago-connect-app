export function getAbsoluteUrl(src?: string | null): string | undefined {
  if (!src) return undefined;
  // If it's already absolute or a data URL, return as-is
  if (/^https?:\/\//i.test(src) || /^data:/i.test(src)) return src;
  // If it's a same-origin public asset path, return as-is
  if (src.startsWith('/')) {
    // Heuristic: if path looks like backend static path, prefix backend host
    const looksBackend = src.startsWith('/upload/') || src.startsWith('/images/') || src.startsWith('/files/');
    if (looksBackend) {
      const host = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3005';
      return `${host}${src}`;
    }
    return src;
  }
  // Fallback: treat as backend-relative path
  const host = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3005';
  return `${host}/${src.replace(/^\//, '')}`;
}
