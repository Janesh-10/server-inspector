import { Activity, Trash2, RefreshCw, Radio, Server } from 'lucide-react';

export default function Header({
  wsStatus,
  capturesCount,
  totalCaptures,
  onClearAll,
  onRefresh,
  loading,
}) {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="app-brand">
          <div className="brand-icon-wrapper">
            <Activity className="brand-icon" size={20} />
          </div>
          <div>
            <h1 className="brand-title">API Traffic Inspector</h1>
            <span className="brand-subtitle">Real-time HTTP Proxy & Traffic Interceptor</span>
          </div>
        </div>

        <div className="proxy-target-badge">
          <Server size={14} className="text-blue-400" />
          <span>HTTP_PROXY:</span>
          <code>http://127.0.0.1:8888</code>
        </div>
      </div>

      <div className="header-right">
        {/* WebSocket Connection Status */}
        <div className={`ws-status-badge ${wsStatus}`}>
          <Radio
            size={14}
            className={`ws-status-icon ${wsStatus === 'connected' ? 'animate-pulse' : ''}`}
          />
          <span className="ws-status-text">
            {wsStatus === 'connected' && 'Live Connected'}
            {wsStatus === 'connecting' && 'Connecting...'}
            {wsStatus === 'disconnected' && 'Disconnected'}
          </span>
        </div>

        {/* Traffic Count Badge */}
        <div className="traffic-count-badge">
          <span className="count-label">Captures:</span>
          <span className="count-value">{capturesCount}</span>
          {totalCaptures !== capturesCount && <span className="count-total">/{totalCaptures}</span>}
        </div>

        {/* Refresh Action */}
        <button
          type="button"
          className="header-btn"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh captures list"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>

        {/* Clear Action */}
        <button
          type="button"
          className="header-btn btn-danger"
          onClick={onClearAll}
          title="Clear all recorded captures"
        >
          <Trash2 size={15} />
          <span>Clear All</span>
        </button>
      </div>
    </header>
  );
}
