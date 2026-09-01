const mockttp = require("mockttp");
const { initDb, insertRequest, updateResponse } = require("./db");

/**
 * List of proxy-specific headers that must be stripped before forwarding upstream
 * to prevent backend servers from misinterpreting proxy control instructions.
 */
const PROXY_SPECIFIC_HEADERS = [
  "proxy-connection",
  "proxy-authorization",
  "proxy-authenticate",
  "proxy-agent",
];

/**
 * Strips proxy-specific headers from incoming request headers.
 * @param {Record<string, string | string[] | undefined>} headers
 * @returns {Record<string, string | string[] | undefined>}
 */
function stripProxyHeaders(headers) {
  const cleanedHeaders = { ...headers };
  for (const header of PROXY_SPECIFIC_HEADERS) {
    delete cleanedHeaders[header];
  }
  return cleanedHeaders;
}

/**
 * Extracts the host string from request metadata.
 * @param {import('mockttp').CompletedRequest} req
 * @returns {string|null}
 */
function extractHost(req) {
  if (req.headers && req.headers.host) {
    return req.headers.host;
  }
  if (req.url) {
    try {
      return new URL(req.url).host;
    } catch {
      // Non-absolute URL
    }
  }
  if (req.destination && req.destination.hostname) {
    return req.destination.port
      ? `${req.destination.hostname}:${req.destination.port}`
      : req.destination.hostname;
  }
  return null;
}

/**
 * Creates and starts a Mockttp HTTP proxy server instance.
 *
 * Captures HTTP requests, saves request/response details into SQLite `captures` table,
 * strips proxy-specific headers, and forwards traffic to the real destination.
 *
 * @param {number} [port=8888] Local port to listen on
 * @param {Object} [options={}] Additional options (e.g., dbPath)
 * @returns {Promise<import('mockttp').Mockttp>} Started mockttp server instance
 */
async function startProxyServer(port = 8888, options = {}) {
  // Initialize SQLite database
  initDb(options.dbPath);

  const server = mockttp.getLocal({
    debug: options.debug || false,
    cors: false,
    suggestChanges: false,
    ...options,
  });

  // 1. Intercept incoming request and persist to SQLite
  await server.on("request", async (req) => {
    let body = null;
    try {
      body = await req.body.getText();
    } catch {
      body = req.body?.buffer ? req.body.buffer.toString("utf8") : null;
    }

    const host = extractHost(req);
    const started_at = req.timingEvents?.startTime
      ? new Date(req.timingEvents.startTime).toISOString()
      : new Date().toISOString();

    insertRequest({
      id: req.id,
      method: req.method,
      url: req.url,
      host: host,
      path: req.path,
      request_headers: req.headers,
      request_body: body,
      started_at: started_at,
    });
  });

  // 2. Intercept upstream response and update record in SQLite
  await server.on("response", async (res) => {
    let body = null;
    try {
      body = await res.body.getText();
    } catch {
      body = res.body?.buffer ? res.body.buffer.toString("utf8") : null;
    }

    const completed_at = new Date().toISOString();

    updateResponse(res.id, {
      status_code: res.statusCode,
      response_headers: res.headers,
      response_body: body,
      completed_at: completed_at,
    });
  });

  // Pass through to destination while stripping proxy headers
  await server.forAnyRequest().thenPassThrough({
    beforeRequest: (req) => {
      return {
        headers: stripProxyHeaders(req.headers),
      };
    },
  });

  await server.start(port);
  console.log(`Proxy server listening on port ${server.port}`);

  return server;
}

module.exports = {
  startProxyServer,
  stripProxyHeaders,
  PROXY_SPECIFIC_HEADERS,
};
