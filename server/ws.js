const { WebSocketServer, WebSocket } = require('ws');

const DEFAULT_HOST = process.env.HOST || '127.0.0.1';
const DEFAULT_WS_PORT = parseInt(process.env.WS_PORT || '8889', 10);

let wssInstance = null;

/**
 * Initializes and starts the WebSocket server for real-time live push channel.
 *
 * @param {Object|number} [options={}] Configuration options or port number
 * @param {number} [options.port=8889] Port to listen on (if standalone)
 * @param {string} [options.host] Host IP to bind to
 * @param {import('http').Server} [options.server] Optional HTTP server to attach to
 * @returns {WebSocketServer} The initialized WebSocketServer instance
 */
function initWebSocketServer(options = {}) {
  if (wssInstance) {
    return wssInstance;
  }

  const config = typeof options === 'number' ? { port: options } : options;
  const port = config.port || (config.server ? undefined : DEFAULT_WS_PORT);
  const host = config.host || DEFAULT_HOST;
  const wssOptions = config.server ? { server: config.server } : { port, host };

  const wss = new WebSocketServer(wssOptions);

  wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(`[WS] Client connected from ${clientIp} (Total clients: ${wss.clients.size})`);

    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('error', (err) => {
      console.error('[WS] Client connection error:', err.message);
    });

    ws.on('close', () => {
      console.log(`[WS] Client disconnected (Remaining clients: ${wss.clients.size})`);
    });
  });

  // Heartbeat interval to detect and clean up stale client connections
  const heartbeatInterval = setInterval(() => {
    for (const ws of wss.clients) {
      if (ws.isAlive === false) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
    wssInstance = null;
  });

  if (port) {
    console.log(`WebSocket server listening on ws://${host}:${port}`);
  }

  wssInstance = wss;
  return wss;
}

/**
 * Broadcasts a completed capture event to all connected UI clients.
 * Emits { type: "capture", data: {...} }
 *
 * @param {Object} captureData Complete captured request/response metadata and payload
 */
function broadcastCapture(captureData) {
  if (!wssInstance) return;

  const message = JSON.stringify({
    type: 'capture',
    data: captureData,
  });

  for (const client of wssInstance.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

/**
 * Closes the WebSocket server and disconnects all clients.
 * @returns {Promise<void>}
 */
function closeWebSocketServer() {
  return new Promise((resolve) => {
    if (!wssInstance) {
      return resolve();
    }
    wssInstance.close(() => {
      wssInstance = null;
      resolve();
    });
  });
}

module.exports = {
  initWebSocketServer,
  broadcastCapture,
  closeWebSocketServer,
  DEFAULT_HOST,
  DEFAULT_WS_PORT,
};
