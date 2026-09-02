const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from root or local .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const { startProxyServer } = require('./proxy');
const { startApiServer } = require('./api');
const { closeDb } = require('./db');
const { closeWebSocketServer } = require('./ws');

const HOST = process.env.HOST || '127.0.0.1';
const PROXY_PORT = parseInt(process.env.PROXY_PORT || process.env.PORT || '8888', 10);
const WS_PORT = parseInt(process.env.WS_PORT || '8889', 10);
const API_PORT = parseInt(process.env.API_PORT || '3001', 10);
const DB_PATH = process.env.DB_PATH;

async function main() {
  try {
    const proxyServer = await startProxyServer(PROXY_PORT, {
      host: HOST,
      wsPort: WS_PORT,
      dbPath: DB_PATH ? path.resolve(__dirname, DB_PATH) : undefined,
    });
    const apiServer = await startApiServer(API_PORT, { host: HOST });

    const shutdown = async () => {
      console.log('\nShutting down inspector services...');
      try {
        await proxyServer.stop();
      } catch (err) {
        console.error('Error stopping proxy:', err);
      }
      try {
        await new Promise((resolve) => apiServer.close(resolve));
      } catch (err) {
        console.error('Error stopping API server:', err);
      }
      try {
        await closeWebSocketServer();
      } catch (err) {
        console.error('Error closing WebSocket server:', err);
      }
      closeDb();
      console.log('All services stopped cleanly.');
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

main();
