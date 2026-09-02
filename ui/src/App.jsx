import { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import TrafficTable from './components/TrafficTable';
import DetailPanel from './components/DetailPanel';
import { getCaptures, clearAllCaptures } from './services/api';
import './App.css';

const WS_URL = 'ws://127.0.0.1:8889';

export default function App() {
  const [captures, setCaptures] = useState([]);
  const [selectedCapture, setSelectedCapture] = useState(null);
  const [methodFilter, setMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [wsStatus, setWsStatus] = useState('connecting'); // 'connected' | 'connecting' | 'disconnected'
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Debounce search query input by 250ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch on mount and when filters change without synchronous setState in effect body
  useEffect(() => {
    let ignore = false;

    getCaptures({
      method: methodFilter,
      status: statusFilter,
      q: debouncedQuery
    })
      .then((data) => {
        if (!ignore) {
          setCaptures(data);
          if (!methodFilter && !statusFilter && !debouncedQuery) {
            setTotalCount(data.length);
          }
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Error fetching captures via axios:', err);
        }
      });

    return () => {
      ignore = true;
    };
  }, [methodFilter, statusFilter, debouncedQuery]);

  // Manual refresh callback
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCaptures({
        method: methodFilter,
        status: statusFilter,
        q: debouncedQuery
      });
      setCaptures(data);
      if (!methodFilter && !statusFilter && !debouncedQuery) {
        setTotalCount(data.length);
      }
    } catch (err) {
      console.error('Error refreshing captures:', err);
    } finally {
      setLoading(false);
    }
  }, [methodFilter, statusFilter, debouncedQuery]);

  // WebSocket Live Push Subscription
  useEffect(() => {
    let isSubscribed = true;

    function connectWs() {
      if (
        wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      setWsStatus('connecting');
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isSubscribed) return;
          console.log('[WS] Connected to live capture push channel');
          setWsStatus('connected');
        };

        ws.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'capture' && message.data) {
              const newCapture = message.data;

              // Update in-memory list
              setCaptures((prev) => {
                const existingIdx = prev.findIndex((c) => c.id === newCapture.id);
                if (existingIdx !== -1) {
                  // Replace updated capture
                  const updated = [...prev];
                  updated[existingIdx] = newCapture;
                  return updated;
                }
                // Prepend new capture to list
                return [newCapture, ...prev];
              });

              setTotalCount((c) => c + 1);

              // If currently selected capture was updated, keep detail panel in sync
              setSelectedCapture((currentSelected) => {
                if (currentSelected && currentSelected.id === newCapture.id) {
                  return newCapture;
                }
                return currentSelected;
              });
            }
          } catch (err) {
            console.error('[WS] Error processing message:', err);
          }
        };

        ws.onclose = () => {
          if (!isSubscribed) return;
          console.warn('[WS] Disconnected. Reconnecting in 3 seconds...');
          setWsStatus('disconnected');
          reconnectTimeoutRef.current = setTimeout(connectWs, 3000);
        };

        ws.onerror = (err) => {
          console.error('[WS] Connection error:', err);
          ws.close();
        };
      } catch (err) {
        console.error('[WS] Setup error:', err);
        setWsStatus('disconnected');
        reconnectTimeoutRef.current = setTimeout(connectWs, 3000);
      }
    }

    connectWs();

    return () => {
      isSubscribed = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Clear all captures action using Axios
  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all traffic captures?')) {
      return;
    }
    try {
      await clearAllCaptures();
      setCaptures([]);
      setSelectedCapture(null);
      setTotalCount(0);
    } catch (err) {
      console.error('Error clearing captures via axios:', err);
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setMethodFilter('');
    setStatusFilter('');
    setSearchQuery('');
  };

  const hasActiveFilters = Boolean(methodFilter || statusFilter || searchQuery);

  return (
    <div className="app-layout">
      {/* Header */}
      <Header
        wsStatus={wsStatus}
        capturesCount={captures.length}
        totalCaptures={totalCount || captures.length}
        onClearAll={handleClearAll}
        onRefresh={handleRefresh}
        loading={loading}
      />

      {/* Filter Bar */}
      <FilterBar
        methodFilter={methodFilter}
        setMethodFilter={setMethodFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Main Content Area: Table View + Slide-out Detail Panel */}
      <main className="main-content">
        <div className={`table-container ${selectedCapture ? 'with-detail-panel' : ''}`}>
          <TrafficTable
            captures={captures}
            selectedCapture={selectedCapture}
            onSelectCapture={setSelectedCapture}
            loading={loading}
          />
        </div>

        {selectedCapture && (
          <aside className="detail-panel-container">
            <DetailPanel
              capture={selectedCapture}
              onClose={() => setSelectedCapture(null)}
            />
          </aside>
        )}
      </main>
    </div>
  );
}
