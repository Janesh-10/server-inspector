const mockttp = require('mockttp');
const { initDb, insertRequest, updateResponse } = require('./db');
const { initWebSocketServer, broadcastCapture } = require('./ws');

/**
 * List of proxy-specific headers that must be stripped before forwarding upstream
 * to prevent backend servers from misinterpreting proxy control instructions.
 */
const PROXY_SPECIFIC_HEADERS = [
    'proxy-connection',
    'proxy-authorization',
    'proxy-authenticate',
    'proxy-agent'
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
 * Safely extracts body text or decoded buffer string from request/response.
 * @param {import('mockttp').CompletedRequest | import('mockttp').CompletedResponse} entity
 * @returns {Promise<string|null>}
 */
async function extractBodyText(entity) {
    try {
        return await entity.body.getText();
    } catch {
        return entity.body?.buffer ? entity.body.buffer.toString('utf8') : null;
    }
}

/**
 * Creates and starts a Mockttp HTTP proxy server instance and WebSocket broadcast channel.
 * 
 * Captures HTTP requests, saves request/response details into SQLite `captures` table,
 * broadcasts completed captures live via WebSocket to all connected UI clients,
 * strips proxy-specific headers, and forwards traffic to the real destination.
 * 
 * @param {number} [port=8888] Local port to listen on
 * @param {Object} [options={}] Additional options (e.g., dbPath, wsPort)
 * @returns {Promise<import('mockttp').Mockttp>} Started mockttp server instance
 */
async function startProxyServer(port = 8888, options = {}) {
    // Initialize SQLite database
    initDb(options.dbPath);

    // Initialize WebSocket broadcast channel unless explicitly disabled
    if (options.ws !== false) {
        initWebSocketServer(options.wsPort ? { port: options.wsPort } : {});
    }

    // In-memory tracker for in-flight requests to combine request & response for broadcasting
    const activeRequests = new Map();

    const server = mockttp.getLocal({
        debug: options.debug || false,
        cors: false,
        suggestChanges: false,
        ...options
    });

    // 1. Intercept incoming request and persist to SQLite
    await server.on('request', async (req) => {
        const body = await extractBodyText(req);
        const host = extractHost(req);
        const started_at = req.timingEvents?.startTime 
            ? new Date(req.timingEvents.startTime).toISOString() 
            : new Date().toISOString();

        const reqData = {
            id: req.id,
            method: req.method,
            url: req.url,
            host: host,
            path: req.path,
            request_headers: req.headers,
            request_body: body,
            started_at: started_at
        };

        // Track in memory for live response combination
        activeRequests.set(req.id, reqData);

        // Persist request to SQLite
        insertRequest(reqData);

        console.log(`[PROXY] --> ${req.method} ${req.url}`);
    });

    // 2. Intercept upstream response, update SQLite, and broadcast to connected UI clients
    await server.on('response', async (res) => {
        const body = await extractBodyText(res);
        const completed_at = new Date().toISOString();
        const reqData = activeRequests.get(res.id) || {};
        activeRequests.delete(res.id);

        // Update record in SQLite
        updateResponse(res.id, {
            status_code: res.statusCode,
            response_headers: res.headers,
            response_body: body,
            completed_at: completed_at
        });

        // Assemble full capture payload for live WebSocket broadcast
        const captureData = {
            id: res.id,
            method: reqData.method || null,
            url: reqData.url || null,
            host: reqData.host || null,
            path: reqData.path || null,
            request_headers: reqData.request_headers || {},
            request_body: reqData.request_body !== undefined ? reqData.request_body : null,
            status_code: res.statusCode,
            response_headers: res.headers || {},
            response_body: body,
            started_at: reqData.started_at || null,
            completed_at: completed_at
        };

        // Live push to all connected UI clients
        broadcastCapture(captureData);

        console.log(`[PROXY] <-- ${res.statusCode} ${reqData.url || res.id}`);
    });

    // Pass through to destination while stripping proxy headers
    await server.forAnyRequest().thenPassThrough({
        beforeRequest: (req) => {
            return {
                headers: stripProxyHeaders(req.headers)
            };
        }
    });

    await server.start(port);
    console.log(`Proxy server listening on http://127.0.0.1:${server.port}`);

    return server;
}

module.exports = {
    startProxyServer,
    stripProxyHeaders,
    PROXY_SPECIFIC_HEADERS
};
