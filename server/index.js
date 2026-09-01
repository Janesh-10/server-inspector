const { startProxyServer } = require('./proxy');
const { closeDb } = require('./db');

const PORT = parseInt(process.env.PORT || process.env.PROXY_PORT || '8888', 10);

async function main() {
    try {
        const server = await startProxyServer(PORT);

        const shutdown = async () => {
            console.log('\nStopping proxy server and closing database...');
            try {
                await server.stop();
            } catch (err) {
                console.error('Error stopping proxy:', err);
            }
            closeDb();
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
