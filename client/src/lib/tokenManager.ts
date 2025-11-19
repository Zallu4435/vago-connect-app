export interface TokenPayload {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number; // seconds since epoch
  nbf?: number;
  iat?: number;
  jti?: string;
  [key: string]: any;
}

export type DecodedToken = TokenPayload & { raw?: string };

function base64UrlDecode(input: string): string {
  try {
    const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
    if (typeof window !== "undefined") {
      return decodeURIComponent(
        Array.prototype.map
          .call(atob(padded), (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
    }
    return Buffer.from(padded, "base64").toString("utf8");
  } catch {
    return "";
  }
}

export function decodeToken(token: string): DecodedToken | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payloadJson = base64UrlDecode(parts[1]);
    const payload = JSON.parse(payloadJson) as TokenPayload;
    return { ...payload, raw: token };
  } catch {
    return null;
  }
}

export function getTokenExpiry(token: string): number | null {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return null;
  // exp is in seconds, convert to ms
  return decoded.exp * 1000;
}

export function isTokenExpired(token: string): boolean {
  const expMs = getTokenExpiry(token);
  if (!expMs) return true; // if no exp, treat as expired
  return Date.now() >= expMs;
}

export function isTokenExpiringSoon(token: string, bufferMinutes = 5): boolean {
  const expMs = getTokenExpiry(token);
  if (!expMs) return true;
  const bufferMs = bufferMinutes * 60 * 1000;
  return Date.now() >= expMs - bufferMs;
}

export function scheduleTokenRefresh(
  token: string,
  refreshCallback: () => void,
  bufferMinutes = 5
): number | null {
  const expMs = getTokenExpiry(token);
  if (!expMs) return null;
  const bufferMs = bufferMinutes * 60 * 1000;
  const delay = Math.max(0, expMs - bufferMs - Date.now());
  // Use window.setTimeout in browser, fallback to global setTimeout in Node
  const id = (typeof window !== "undefined" ? window.setTimeout : setTimeout)(refreshCallback, delay);
  return Number(id);
}

export function clearScheduledRefresh(timeoutId: number | null | undefined): void {
  if (!timeoutId && timeoutId !== 0) return;
  if (typeof window !== "undefined") {
    window.clearTimeout(timeoutId as number);
  } else {
    clearTimeout(timeoutId as any);
  }
}
