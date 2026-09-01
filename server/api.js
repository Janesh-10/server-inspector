const express = require('express');
const cors = require('cors');
const { getCaptures, getCaptureById, clearCaptures } = require('./db');

const DEFAULT_API_PORT = parseInt(process.env.API_PORT || '3001', 10);

/**
 * Helper to safely parse JSON strings into objects, falling back to original string.
 * @param {string|null} value
 * @returns {any}
 */
function safeJsonParse(value) {
    if (!value) return null;
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}

/**
 * Formats a SQLite capture row by parsing stored JSON header strings.
 * @param {Object} row
 * @returns {Object}
 */
function formatCapture(row) {
    if (!row) return row;
    return {
        ...row,
        request_headers: safeJsonParse(row.request_headers),
        response_headers: safeJsonParse(row.response_headers)
    };
}

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// 1. GET /api/captures -> search & filter
app.get('/api/captures', (req, res) => {
    const filters = {
        method: req.query.method,
        status: req.query.status,
        q: req.query.q,
        limit: req.query.limit,
        offset: req.query.offset
    };

    const rows = getCaptures(filters);
    res.json(rows.map(formatCapture));
});

// 2. GET /api/captures/:id -> single capture detail
app.get('/api/captures/:id', (req, res) => {
    const row = getCaptureById(req.params.id);
    if (!row) {
        return res.status(404).json({ error: 'Capture not found' });
    }
    res.json(formatCapture(row));
});

// 3. DELETE /api/captures -> clear all captures
app.delete('/api/captures', (req, res) => {
    const deletedCount = clearCaptures();
    res.json({
        message: 'All captures cleared',
        deletedCount
    });
});

/**
 * Starts the Express REST API server.
 * @param {number} [port=3001]
 * @returns {Promise<import('http').Server>}
 */
function startApiServer(port = DEFAULT_API_PORT) {
    return new Promise((resolve, reject) => {
        const server = app.listen(port, () => {
            console.log(`REST API server listening on http://127.0.0.1:${port}`);
            resolve(server);
        });
        server.on('error', reject);
    });
}

module.exports = {
    app,
    startApiServer,
    formatCapture,
    DEFAULT_API_PORT
};
