const Database = require("better-sqlite3");
const path = require("path");

const DEFAULT_DB_PATH = path.join(__dirname, "traffic.db");

let dbInstance = null;

/**
 * Initializes the SQLite database and creates the `captures` table if it doesn't exist.
 * @param {string} [dbPath] Path to the SQLite database file (or ':memory:')
 * @returns {import('better-sqlite3').Database}
 */
function initDb(dbPath = DEFAULT_DB_PATH) {
  if (dbInstance && (!dbPath || dbPath === DEFAULT_DB_PATH)) {
    return dbInstance;
  }

  const db = new Database(dbPath);

  // Create captures table
  db.exec(`
        CREATE TABLE IF NOT EXISTS captures (
            id TEXT PRIMARY KEY,
            method TEXT,
            url TEXT,
            host TEXT,
            path TEXT,
            request_headers TEXT,
            request_body TEXT,
            status_code INTEGER,
            response_headers TEXT,
            response_body TEXT,
            started_at TEXT,
            completed_at TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_captures_started_at ON captures(started_at);
        CREATE INDEX IF NOT EXISTS idx_captures_host ON captures(host);
    `);

  dbInstance = db;
  return db;
}

/**
 * Gets the current database instance or initializes the default one.
 * @returns {import('better-sqlite3').Database}
 */
function getDb() {
  if (!dbInstance) {
    return initDb();
  }
  return dbInstance;
}

/**
 * Inserts an intercepted request record into the `captures` table.
 * @param {Object} captureData
 * @param {string} captureData.id
 * @param {string} captureData.method
 * @param {string} captureData.url
 * @param {string} [captureData.host]
 * @param {string} [captureData.path]
 * @param {Object|string} [captureData.request_headers]
 * @param {string|Buffer} [captureData.request_body]
 * @param {string} [captureData.started_at]
 */
function insertRequest(captureData) {
  const db = getDb();
  const stmt = db.prepare(`
        INSERT INTO captures (
            id, method, url, host, path, request_headers, request_body, started_at
        ) VALUES (
            @id, @method, @url, @host, @path, @request_headers, @request_body, @started_at
        )
        ON CONFLICT(id) DO UPDATE SET
            method = excluded.method,
            url = excluded.url,
            host = excluded.host,
            path = excluded.path,
            request_headers = excluded.request_headers,
            request_body = excluded.request_body,
            started_at = excluded.started_at
    `);

  const headersJson =
    typeof captureData.request_headers === "object"
      ? JSON.stringify(captureData.request_headers)
      : captureData.request_headers || null;

  stmt.run({
    id: captureData.id,
    method: captureData.method || null,
    url: captureData.url || null,
    host: captureData.host || null,
    path: captureData.path || null,
    request_headers: headersJson,
    request_body:
      captureData.request_body !== undefined ? captureData.request_body : null,
    started_at: captureData.started_at || new Date().toISOString(),
  });
}

/**
 * Updates an existing capture record with the upstream response information.
 * @param {string} id
 * @param {Object} responseData
 * @param {number} responseData.status_code
 * @param {Object|string} [responseData.response_headers]
 * @param {string|Buffer} [responseData.response_body]
 * @param {string} [responseData.completed_at]
 */
function updateResponse(id, responseData) {
  const db = getDb();
  const stmt = db.prepare(`
        UPDATE captures SET
            status_code = @status_code,
            response_headers = @response_headers,
            response_body = @response_body,
            completed_at = @completed_at
        WHERE id = @id
    `);

  const headersJson =
    typeof responseData.response_headers === "object"
      ? JSON.stringify(responseData.response_headers)
      : responseData.response_headers || null;

  stmt.run({
    id,
    status_code:
      responseData.status_code !== undefined ? responseData.status_code : null,
    response_headers: headersJson,
    response_body:
      responseData.response_body !== undefined
        ? responseData.response_body
        : null,
    completed_at: responseData.completed_at || new Date().toISOString(),
  });
}

/**
 * Closes the database connection.
 */
function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

module.exports = {
  initDb,
  getDb,
  insertRequest,
  updateResponse,
  closeDb,
};
