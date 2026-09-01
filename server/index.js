const { startProxyServer } = require('./proxy');
const { closeDb } = require('./db');
const { closeWebSocketServer } = require('./ws');

const PORT = parseInt(process.env.PORT || process.env.PROXY_PORT || '8888', 10);
const WS_PORT = parseInt(process.env.WS_PORT || '8889', 10);

async function main() {
    try {
        const server = await startProxyServer(PORT, { wsPort: WS_PORT });

        const shutdown = async () => {
            console.log('\nShutting down inspector services...');
            try {
                await server.stop();
            } catch (err) {
                console.error('Error stopping proxy:', err);
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
        console.error('Failed to start proxy server:', err);
        process.exit(1);
    }
}

main();
