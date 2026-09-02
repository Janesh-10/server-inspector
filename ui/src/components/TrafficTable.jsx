import {
  getMethodStyle,
  getStatusStyle,
  formatBytes,
  formatDuration,
  formatTime,
} from '../utils/formatters';
import { Terminal, Globe, Clock } from 'lucide-react';

export default function TrafficTable({ captures, selectedCapture, onSelectCapture, loading }) {
  if (loading && captures.length === 0) {
    return (
      <div className="table-empty-state">
        <div className="animate-spin text-blue-400 mb-2">
          <Clock size={32} />
        </div>
        <p className="empty-title">Loading network traffic captures...</p>
      </div>
    );
  }

  if (captures.length === 0) {
    return (
      <div className="table-empty-state">
        <div className="empty-icon-wrapper">
          <Globe size={40} className="text-blue-400" />
        </div>
        <h3 className="empty-title">No Captured Traffic Yet</h3>
        <p className="empty-description">
          Route HTTP traffic through the local proxy server to start inspecting requests in
          real-time.
        </p>

        <div className="empty-guide-card">
          <div className="guide-header">
            <Terminal size={15} />
            <span>Send a test proxy request</span>
          </div>
          <pre className="guide-code">
            <code>
              curl -x {import.meta.env.VITE_PROXY_URL || 'http://127.0.0.1:8888'}{' '}
              http://httpbin.org/get
            </code>
          </pre>
          <div className="guide-hint">
            Or configure your application:{' '}
            <code>
              export HTTP_PROXY={import.meta.env.VITE_PROXY_URL || 'http://127.0.0.1:8888'}
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="traffic-table-wrapper">
      <table className="traffic-table">
        <thead>
          <tr>
            <th className="th-method">Method</th>
            <th className="th-status">Status</th>
            <th className="th-path">Path & Query</th>
            <th className="th-host">Host</th>
            <th className="th-size">Size</th>
            <th className="th-duration">Duration</th>
            <th className="th-time">Time</th>
          </tr>
        </thead>
        <tbody>
          {captures.map((capture, idx) => {
            const isSelected = selectedCapture && selectedCapture.id === capture.id;
            const methodStyle = getMethodStyle(capture.method);
            const statusStyle = getStatusStyle(capture.status_code);
            const duration = formatDuration(capture.started_at, capture.completed_at);
            const size = formatBytes(
              capture.response_body
                ? typeof capture.response_body === 'string'
                  ? capture.response_body.length
                  : capture.response_body?.length || 0
                : capture.request_body?.length || 0,
            );

            return (
              <tr
                key={capture.id || idx}
                className={`traffic-row ${isSelected ? 'row-selected' : ''}`}
                onClick={() => onSelectCapture(capture)}
              >
                {/* Method */}
                <td className="td-method">
                  <span
                    className="method-badge"
                    style={{
                      backgroundColor: methodStyle.bg,
                      color: methodStyle.text,
                      borderColor: methodStyle.border,
                    }}
                  >
                    {capture.method || 'GET'}
                  </span>
                </td>

                {/* Status */}
                <td className="td-status">
                  <span
                    className="status-badge"
                    style={{
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.text,
                      borderColor: statusStyle.border,
                    }}
                  >
                    {capture.status_code || '...'}
                  </span>
                </td>

                {/* Path & Query */}
                <td className="td-path" title={capture.url || capture.path}>
                  <div className="path-text">{capture.path || capture.url || '/'}</div>
                </td>

                {/* Host */}
                <td className="td-host" title={capture.host}>
                  <span className="host-text">{capture.host || '-'}</span>
                </td>

                {/* Size */}
                <td className="td-size">
                  <span className="size-text">{size}</span>
                </td>

                {/* Duration */}
                <td className="td-duration">
                  <span className="duration-text">{duration}</span>
                </td>

                {/* Time */}
                <td className="td-time">
                  <span className="time-text">{formatTime(capture.started_at)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
