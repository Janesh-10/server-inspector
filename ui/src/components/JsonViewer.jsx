import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function JsonViewer({ data, rawString, title }) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('formatted'); // 'formatted' | 'raw'

  const jsonStr = typeof data === 'string' 
    ? data 
    : JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(viewMode === 'raw' && rawString ? rawString : jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!data && !rawString) {
    return <div className="text-gray-500 italic p-3 text-sm">No payload data</div>;
  }

  return (
    <div className="json-viewer-container">
      <div className="json-viewer-header">
        <span className="json-viewer-title">{title || 'Payload'}</span>
        <div className="json-viewer-actions">
          {rawString && (
            <div className="view-mode-toggle">
              <button 
                type="button"
                className={`mode-btn ${viewMode === 'formatted' ? 'active' : ''}`}
                onClick={() => setViewMode('formatted')}
              >
                Pretty JSON
              </button>
              <button 
                type="button"
                className={`mode-btn ${viewMode === 'raw' ? 'active' : ''}`}
                onClick={() => setViewMode('raw')}
              >
                Raw Text
              </button>
            </div>
          )}
          <button 
            type="button"
            className="copy-btn"
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
      <pre className="json-code-block">
        <code>{viewMode === 'raw' && rawString ? rawString : jsonStr}</code>
      </pre>
    </div>
  );
}
