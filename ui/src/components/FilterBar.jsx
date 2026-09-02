import { Search, X, RotateCcw } from 'lucide-react';

const HTTP_METHODS = ['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];

const STATUS_PRESETS = [
  { label: 'All Statuses', value: '' },
  { label: '2xx Success', value: '200' },
  { label: '201 Created', value: '201' },
  { label: '204 No Content', value: '204' },
  { label: '400 Bad Request', value: '400' },
  { label: '401 Unauthorized', value: '401' },
  { label: '403 Forbidden', value: '403' },
  { label: '404 Not Found', value: '404' },
  { label: '500 Server Error', value: '500' },
  { label: '502 Bad Gateway', value: '502' }
];

export default function FilterBar({
  methodFilter,
  setMethodFilter,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  onResetFilters,
  hasActiveFilters
}) {
  return (
    <div className="filter-bar">
      <div className="filter-group method-group">
        <span className="filter-label">Method:</span>
        <div className="method-chips">
          {HTTP_METHODS.map((m) => {
            const isSelected = (m === 'ALL' && !methodFilter) || methodFilter === m;
            return (
              <button
                key={m}
                type="button"
                className={`method-chip ${m.toLowerCase()} ${isSelected ? 'selected' : ''}`}
                onClick={() => setMethodFilter(m === 'ALL' ? '' : m)}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      <div className="filter-divider"></div>

      <div className="filter-group status-group">
        <span className="filter-label">Status:</span>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Custom code..."
          className="filter-input-status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value.replace(/\D/g, ''))}
          maxLength={3}
        />
      </div>

      <div className="filter-divider"></div>

      <div className="filter-group search-group">
        <div className="search-input-wrapper">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Search path, url, host, body (e.g. api/users)..."
            className="filter-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          className="reset-filters-btn"
          onClick={onResetFilters}
          title="Reset all filters"
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
}
