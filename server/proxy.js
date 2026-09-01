const mockttp = require("mockttp");

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
 * Creates and starts a Mockttp HTTP proxy server instance.
 *
 * Captures HTTP requests, logs the complete request object, strips proxy-specific headers,
 * and forwards traffic to the real destination.
 *
 * @param {number} [port=8888] Local port to listen on
 * @param {Object} [options={}] Additional mockttp options
 * @returns {Promise<import('mockttp').Mockttp>} Started mockttp server instance
 */
async function startProxyServer(port = 8888, options = {}) {
  const server = mockttp.getLocal({
    debug: options.debug || false,
    cors: false,
    suggestChanges: false,
    ...options,
  });

  // Capture and log key request details
  await server.on("request", async (req) => {
    console.log(`--> ${req.method} ${req.url}`);
  });

  // Capture and log key response details
  await server.on("response", async (res) => {
    console.log(`<-- ${res.statusCode} ${res.url}`);
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
