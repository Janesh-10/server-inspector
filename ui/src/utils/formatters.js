/**
 * Formats byte counts into human-readable strings (e.g. 1.4 KB, 2.3 MB).
 * @param {number|string} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes === undefined || bytes === null || bytes === '') return '-';
  const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (isNaN(num) || num === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.abs(num)) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return `${(num / Math.pow(k, idx)).toFixed(idx === 0 ? 0 : 1)} ${sizes[idx]}`;
}

/**
 * Calculates and formats latency duration between two ISO timestamp strings.
 * @param {string} startedAt
 * @param {string} completedAt
 * @returns {string}
 */
export function formatDuration(startedAt, completedAt) {
  if (!startedAt || !completedAt) return '-';
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const diff = end - start;
  if (isNaN(diff) || diff < 0) return '-';
  if (diff < 1000) return `${diff}ms`;
  return `${(diff / 1000).toFixed(2)}s`;
}

/**
 * Formats an ISO date string into time representation (HH:mm:ss.SSS).
 * @param {string} dateStr
 * @returns {string}
 */
export function formatTime(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const pad = (n, len = 2) => String(n).padStart(len, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
  } catch {
    return dateStr;
  }
}

/**
 * Returns a CSS badge class / color based on HTTP method.
 * @param {string} method
 * @returns {{ bg: string, text: string, border: string }}
 */
export function getMethodStyle(method = 'GET') {
  const m = method.toUpperCase();
  switch (m) {
    case 'GET':
      return {
        bg: 'rgba(59, 130, 246, 0.15)',
        text: '#60a5fa',
        border: 'rgba(59, 130, 246, 0.3)',
      };
    case 'POST':
      return {
        bg: 'rgba(34, 197, 94, 0.15)',
        text: '#4ade80',
        border: 'rgba(34, 197, 94, 0.3)',
      };
    case 'PUT':
      return {
        bg: 'rgba(234, 179, 8, 0.15)',
        text: '#facc15',
        border: 'rgba(234, 179, 8, 0.3)',
      };
    case 'PATCH':
      return {
        bg: 'rgba(168, 85, 247, 0.15)',
        text: '#c084fc',
        border: 'rgba(168, 85, 247, 0.3)',
      };
    case 'DELETE':
      return {
        bg: 'rgba(239, 68, 68, 0.15)',
        text: '#f87171',
        border: 'rgba(239, 68, 68, 0.3)',
      };
    case 'OPTIONS':
    case 'HEAD':
      return {
        bg: 'rgba(148, 163, 184, 0.15)',
        text: '#94a3b8',
        border: 'rgba(148, 163, 184, 0.3)',
      };
    default:
      return {
        bg: 'rgba(100, 116, 139, 0.15)',
        text: '#cbd5e1',
        border: 'rgba(100, 116, 139, 0.3)',
      };
  }
}

/**
 * Returns color style for HTTP status codes.
 * @param {number|string} status
 * @returns {{ bg: string, text: string, border: string }}
 */
export function getStatusStyle(status) {
  if (!status) {
    return {
      bg: 'rgba(234, 179, 8, 0.15)',
      text: '#facc15',
      border: 'rgba(234, 179, 8, 0.3)',
    };
  }
  const s = typeof status === 'string' ? parseInt(status, 10) : status;
  if (s >= 200 && s < 300) {
    return {
      bg: 'rgba(34, 197, 94, 0.15)',
      text: '#4ade80',
      border: 'rgba(34, 197, 94, 0.3)',
    };
  }
  if (s >= 300 && s < 400) {
    return {
      bg: 'rgba(56, 189, 248, 0.15)',
      text: '#38bdf8',
      border: 'rgba(56, 189, 248, 0.3)',
    };
  }
  if (s >= 400 && s < 500) {
    return {
      bg: 'rgba(251, 146, 60, 0.15)',
      text: '#fb923c',
      border: 'rgba(251, 146, 60, 0.3)',
    };
  }
  if (s >= 500) {
    return {
      bg: 'rgba(239, 68, 68, 0.15)',
      text: '#f87171',
      border: 'rgba(239, 68, 68, 0.3)',
    };
  }
  return {
    bg: 'rgba(148, 163, 184, 0.15)',
    text: '#cbd5e1',
    border: 'rgba(148, 163, 184, 0.3)',
  };
}

/**
 * Parses cookie strings into structured array of { name, value, attributes }.
 * @param {string|Array<string>} cookieHeader
 * @param {boolean} [isSetCookie=false]
 * @returns {Array<{ name: string, value: string, attributes?: Record<string, string|boolean> }>}
 */
export function parseCookies(cookieHeader, isSetCookie = false) {
  if (!cookieHeader) return [];

  const headers = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
  const results = [];

  for (const str of headers) {
    if (typeof str !== 'string') continue;

    if (isSetCookie) {
      const parts = str.split(';').map((p) => p.trim());
      if (parts.length === 0) continue;
      const [first, ...rest] = parts;
      const eqIdx = first.indexOf('=');
      if (eqIdx === -1) continue;
      const name = first.slice(0, eqIdx);
      const value = first.slice(eqIdx + 1);

      const attributes = {};
      for (const attr of rest) {
        const aEq = attr.indexOf('=');
        if (aEq !== -1) {
          attributes[attr.slice(0, aEq)] = attr.slice(aEq + 1);
        } else {
          attributes[attr] = true;
        }
      }
      results.push({ name, value, attributes });
    } else {
      const pairs = str.split(';');
      for (const pair of pairs) {
        const p = pair.trim();
        const eqIdx = p.indexOf('=');
        if (eqIdx !== -1) {
          results.push({
            name: p.slice(0, eqIdx),
            value: p.slice(eqIdx + 1),
          });
        }
      }
    }
  }

  return results;
}

/**
 * Searches headers, payload, or cookies for JWT tokens and decodes them.
 * @param {Object} headers
 * @param {string} [body]
 * @returns {Array<{ source: string, rawToken: string, header: Object, payload: Object, expired: boolean, expiresAt?: string }>}
 */
export function extractAndDecodeJWTs(headers = {}, body = '') {
  const jwtRegex = /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]*/g;
  const candidates = [];

  if (headers && typeof headers === 'object') {
    for (const [key, value] of Object.entries(headers)) {
      const valStr = Array.isArray(value) ? value.join(' ') : String(value || '');
      const matches = valStr.match(jwtRegex);
      if (matches) {
        matches.forEach((token) => candidates.push({ source: `Header: ${key}`, rawToken: token }));
      }
    }
  }

  if (body && typeof body === 'string') {
    const matches = body.match(jwtRegex);
    if (matches) {
      matches.forEach((token) => {
        if (!candidates.some((c) => c.rawToken === token)) {
          candidates.push({ source: 'Request/Response Body', rawToken: token });
        }
      });
    }
  }

  const decodedTokens = [];

  for (const item of candidates) {
    try {
      const parts = item.rawToken.split('.');
      if (parts.length < 2) continue;

      const decodeBase64Url = (str) => {
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
          base64 += '=';
        }
        return decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join(''),
        );
      };

      const header = JSON.parse(decodeBase64Url(parts[0]));
      const payload = JSON.parse(decodeBase64Url(parts[1]));

      let expired = false;
      let expiresAt = null;
      if (payload && payload.exp) {
        const expMs = payload.exp * 1000;
        expiresAt = new Date(expMs).toISOString();
        expired = Date.now() > expMs;
      }

      decodedTokens.push({
        source: item.source,
        rawToken: item.rawToken,
        header,
        payload,
        expired,
        expiresAt,
      });
    } catch {
      // Ignore invalid JWT format
    }
  }

  return decodedTokens;
}

/**
 * Checks if a string is valid JSON and pretty-formats it.
 * @param {string|null} str
 * @returns {{ isJson: boolean, formatted: string, raw: string }}
 */
export function formatJsonBody(str) {
  if (!str || typeof str !== 'string') {
    return { isJson: false, formatted: '', raw: str || '' };
  }
  try {
    const parsed = JSON.parse(str);
    return {
      isJson: true,
      formatted: JSON.stringify(parsed, null, 2),
      raw: str,
    };
  } catch {
    return { isJson: false, formatted: str, raw: str };
  }
}
