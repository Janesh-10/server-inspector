import React, { useState, useEffect } from "react";
import {
  X,
  Copy,
  Check,
  Key,
  Cookie as CookieIcon,
  Code,
  FileText,
  Clock,
  Globe,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Layers,
} from "lucide-react";
import {
  getMethodStyle,
  getStatusStyle,
  formatDuration,
  formatTime,
  parseCookies,
  extractAndDecodeJWTs,
  formatJsonBody,
} from "../utils/formatters";
import JsonViewer from "./JsonViewer";

export default function DetailPanel({ capture, onClose }) {
  const [activeTab, setActiveTab] = useState("headers"); // 'headers' | 'body' | 'cookies' | 'jwt' | 'overview'
  const [urlCopied, setUrlCopied] = useState(false);
  const [headersViewMode, setHeadersViewMode] = useState("parsed"); // 'parsed' | 'raw'

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!capture) return null;

  const methodStyle = getMethodStyle(capture.method);
  const statusStyle = getStatusStyle(capture.status_code);
  const duration = formatDuration(capture.started_at, capture.completed_at);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(capture.url || "");
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  // Safe headers objects
  const reqHeaders =
    typeof capture.request_headers === "object" &&
    capture.request_headers !== null
      ? capture.request_headers
      : {};
  const resHeaders =
    typeof capture.response_headers === "object" &&
    capture.response_headers !== null
      ? capture.response_headers
      : {};

  // Cookie parsing
  const reqCookies = parseCookies(
    reqHeaders.cookie || reqHeaders.Cookie,
    false,
  );
  const resCookies = parseCookies(
    resHeaders["set-cookie"] || resHeaders["Set-Cookie"],
    true,
  );
  const totalCookiesCount = reqCookies.length + resCookies.length;

  // JWT Extraction
  const allHeadersCombined = { ...reqHeaders, ...resHeaders };
  const jwts = extractAndDecodeJWTs(
    allHeadersCombined,
    `${capture.request_body || ""} ${capture.response_body || ""}`,
  );

  // Body formatting
  const reqBodyFormatted = formatJsonBody(capture.request_body);
  const resBodyFormatted = formatJsonBody(capture.response_body);

  return (
    <div className="detail-panel">
      {/* Panel Top Bar */}
      <div className="detail-top-bar">
        <div className="top-bar-left">
          <span
            className="method-badge"
            style={{
              backgroundColor: methodStyle.bg,
              color: methodStyle.text,
              borderColor: methodStyle.border,
            }}
          >
            {capture.method || "GET"}
          </span>

          <span
            className="status-badge"
            style={{
              backgroundColor: statusStyle.bg,
              color: statusStyle.text,
              borderColor: statusStyle.border,
            }}
          >
            {capture.status_code || "Pending"}
          </span>

          <div className="url-container" title={capture.url}>
            <span className="url-text">{capture.url || capture.path}</span>
            <button
              type="button"
              className="copy-url-btn"
              onClick={handleCopyUrl}
              title="Copy URL"
            >
              {urlCopied ? (
                <Check size={13} className="text-emerald-400" />
              ) : (
                <Copy size={13} />
              )}
            </button>
          </div>
        </div>

        <div className="top-bar-right">
          <span className="duration-pill">
            <Clock size={12} />
            {duration}
          </span>
          <button
            type="button"
            className="close-panel-btn"
            onClick={onClose}
            title="Close panel (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="detail-tabs">
        <button
          type="button"
          className={`tab-btn ${activeTab === "headers" ? "active" : ""}`}
          onClick={() => setActiveTab("headers")}
        >
          <Layers size={14} />
          <span>Headers</span>
          <span className="tab-count">
            {Object.keys(reqHeaders).length + Object.keys(resHeaders).length}
          </span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === "body" ? "active" : ""}`}
          onClick={() => setActiveTab("body")}
        >
          <Code size={14} />
          <span>Payload & Body</span>
          {(capture.request_body || capture.response_body) && (
            <span className="tab-indicator-dot"></span>
          )}
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === "cookies" ? "active" : ""}`}
          onClick={() => setActiveTab("cookies")}
        >
          <CookieIcon size={14} />
          <span>Cookies</span>
          {totalCookiesCount > 0 && (
            <span className="tab-count">{totalCookiesCount}</span>
          )}
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === "jwt" ? "active" : ""}`}
          onClick={() => setActiveTab("jwt")}
        >
          <Key size={14} />
          <span>JWT Claims</span>
          {jwts.length > 0 && (
            <span className="tab-count badge-jwt">{jwts.length}</span>
          )}
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <FileText size={14} />
          <span>Overview</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="detail-content">
        {/* ================= HEADERS TAB ================= */}
        {activeTab === "headers" && (
          <div className="tab-section">
            <div className="section-toolbar">
              <div className="view-mode-toggle">
                <button
                  type="button"
                  className={`mode-btn ${headersViewMode === "parsed" ? "active" : ""}`}
                  onClick={() => setHeadersViewMode("parsed")}
                >
                  Key-Value Table
                </button>
                <button
                  type="button"
                  className={`mode-btn ${headersViewMode === "raw" ? "active" : ""}`}
                  onClick={() => setHeadersViewMode("raw")}
                >
                  Raw Text
                </button>
              </div>
            </div>

            {/* Request Headers */}
            <div className="headers-block">
              <h4 className="block-title">
                <span>Request Headers</span>
                <span className="count-tag">
                  {Object.keys(reqHeaders).length}
                </span>
              </h4>

              {headersViewMode === "parsed" ? (
                Object.keys(reqHeaders).length > 0 ? (
                  <div className="headers-table-wrapper">
                    <table className="headers-table">
                      <tbody>
                        {Object.entries(reqHeaders).map(([key, val]) => (
                          <tr key={key}>
                            <td className="header-name">{key}</td>
                            <td className="header-value">
                              {Array.isArray(val)
                                ? val.join("; ")
                                : String(val)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-substate">No request headers</div>
                )
              ) : (
                <pre className="raw-headers-block">
                  <code>
                    {Object.entries(reqHeaders)
                      .map(
                        ([k, v]) =>
                          `${k}: ${Array.isArray(v) ? v.join("; ") : v}`,
                      )
                      .join("\n") || "No headers"}
                  </code>
                </pre>
              )}
            </div>

            {/* Response Headers */}
            <div className="headers-block mt-4">
              <h4 className="block-title">
                <span>Response Headers</span>
                <span className="count-tag">
                  {Object.keys(resHeaders).length}
                </span>
              </h4>

              {headersViewMode === "parsed" ? (
                Object.keys(resHeaders).length > 0 ? (
                  <div className="headers-table-wrapper">
                    <table className="headers-table">
                      <tbody>
                        {Object.entries(resHeaders).map(([key, val]) => (
                          <tr key={key}>
                            <td className="header-name">{key}</td>
                            <td className="header-value">
                              {Array.isArray(val)
                                ? val.join("; ")
                                : String(val)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-substate">No response headers</div>
                )
              ) : (
                <pre className="raw-headers-block">
                  <code>
                    {Object.entries(resHeaders)
                      .map(
                        ([k, v]) =>
                          `${k}: ${Array.isArray(v) ? v.join("; ") : v}`,
                      )
                      .join("\n") || "No headers"}
                  </code>
                </pre>
              )}
            </div>
          </div>
        )}

        {/* ================= BODY TAB ================= */}
        {activeTab === "body" && (
          <div className="tab-section">
            {/* Request Body */}
            <div className="body-block">
              <h4 className="block-title">
                <span>Request Payload</span>
                {capture.request_body && (
                  <span className="count-tag">
                    {capture.request_body.length} bytes{" "}
                    {reqBodyFormatted.isJson && "• JSON"}
                  </span>
                )}
              </h4>
              {capture.request_body ? (
                <JsonViewer
                  data={
                    reqBodyFormatted.isJson
                      ? JSON.parse(capture.request_body)
                      : capture.request_body
                  }
                  rawString={capture.request_body}
                  title="Request Data"
                />
              ) : (
                <div className="empty-substate">No request payload sent</div>
              )}
            </div>

            {/* Response Body */}
            <div className="body-block mt-4">
              <h4 className="block-title">
                <span>Response Body</span>
                {capture.response_body && (
                  <span className="count-tag">
                    {capture.response_body.length} bytes{" "}
                    {resBodyFormatted.isJson && "• JSON"}
                  </span>
                )}
              </h4>
              {capture.response_body ? (
                <JsonViewer
                  data={
                    resBodyFormatted.isJson
                      ? JSON.parse(capture.response_body)
                      : capture.response_body
                  }
                  rawString={capture.response_body}
                  title="Response Data"
                />
              ) : (
                <div className="empty-substate">No response body received</div>
              )}
            </div>
          </div>
        )}

        {/* ================= COOKIES TAB ================= */}
        {activeTab === "cookies" && (
          <div className="tab-section">
            {/* Request Cookies */}
            <div className="cookie-block">
              <h4 className="block-title">
                <span>Request Cookies (Client Cookie Header)</span>
                <span className="count-tag">{reqCookies.length}</span>
              </h4>
              {reqCookies.length > 0 ? (
                <div className="cookies-list">
                  {reqCookies.map((cookie, idx) => (
                    <div key={idx} className="cookie-card">
                      <div className="cookie-name">{cookie.name}</div>
                      <div className="cookie-value">{cookie.value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-substate">No request cookies sent</div>
              )}
            </div>

            {/* Response Cookies */}
            <div className="cookie-block mt-4">
              <h4 className="block-title">
                <span>Response Cookies (Set-Cookie Header)</span>
                <span className="count-tag">{resCookies.length}</span>
              </h4>
              {resCookies.length > 0 ? (
                <div className="cookies-list">
                  {resCookies.map((cookie, idx) => (
                    <div key={idx} className="cookie-card">
                      <div className="cookie-header-row">
                        <span className="cookie-name">{cookie.name}</span>
                        <div className="cookie-attr-pills">
                          {cookie.attributes &&
                            Object.entries(cookie.attributes).map(([k, v]) => (
                              <span key={k} className="cookie-attr-pill">
                                {k}
                                {typeof v !== "boolean" ? `=${v}` : ""}
                              </span>
                            ))}
                        </div>
                      </div>
                      <div className="cookie-value">{cookie.value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-substate">
                  No response Set-Cookie headers
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= JWT CLAIMS TAB ================= */}
        {activeTab === "jwt" && (
          <div className="tab-section">
            {jwts.length > 0 ? (
              <div className="jwts-container">
                {jwts.map((jwt, idx) => (
                  <div key={idx} className="jwt-card">
                    <div className="jwt-header-info">
                      <div className="jwt-title-row">
                        <Key size={16} className="text-amber-400" />
                        <span className="jwt-source">{jwt.source}</span>
                      </div>
                      <div className="jwt-status-row">
                        {jwt.expiresAt ? (
                          jwt.expired ? (
                            <span className="jwt-status-tag expired">
                              <ShieldAlert size={13} />
                              Expired (
                              {new Date(jwt.expiresAt).toLocaleTimeString()})
                            </span>
                          ) : (
                            <span className="jwt-status-tag valid">
                              <ShieldCheck size={13} />
                              Valid (Expires{" "}
                              {new Date(jwt.expiresAt).toLocaleTimeString()})
                            </span>
                          )
                        ) : (
                          <span className="jwt-status-tag no-exp">
                            No Expiration Claim
                          </span>
                        )}
                      </div>
                    </div>

                    {/* JWT Header */}
                    <div className="jwt-sub-block">
                      <h5 className="jwt-sub-title">
                        JOSE Header (Algorithm & Token Type)
                      </h5>
                      <pre className="jwt-json-block">
                        <code>{JSON.stringify(jwt.header, null, 2)}</code>
                      </pre>
                    </div>

                    {/* JWT Payload / Claims */}
                    <div className="jwt-sub-block mt-2">
                      <h5 className="jwt-sub-title">
                        Decoded Payload / Claims
                      </h5>
                      <pre className="jwt-json-block">
                        <code>{JSON.stringify(jwt.payload, null, 2)}</code>
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-substate">
                <Key size={32} className="text-gray-500 mb-2" />
                <p>
                  No JWT tokens detected in Authorization headers, cookies, or
                  body.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================= OVERVIEW TAB ================= */}
        {activeTab === "overview" && (
          <div className="tab-section">
            <div className="overview-grid">
              <div className="overview-card">
                <span className="overview-label">Capture ID</span>
                <span className="overview-value font-mono">{capture.id}</span>
              </div>

              <div className="overview-card">
                <span className="overview-label">Host Destination</span>
                <span className="overview-value font-mono">
                  {capture.host || "-"}
                </span>
              </div>

              <div className="overview-card">
                <span className="overview-label">Request Path</span>
                <span className="overview-value font-mono">
                  {capture.path || "-"}
                </span>
              </div>

              <div className="overview-card">
                <span className="overview-label">Full URL</span>
                <span className="overview-value font-mono break-all">
                  {capture.url || "-"}
                </span>
              </div>

              <div className="overview-card">
                <span className="overview-label">Started At</span>
                <span className="overview-value">
                  {capture.started_at
                    ? new Date(capture.started_at).toLocaleString()
                    : "-"}
                </span>
              </div>

              <div className="overview-card">
                <span className="overview-label">Completed At</span>
                <span className="overview-value">
                  {capture.completed_at
                    ? new Date(capture.completed_at).toLocaleString()
                    : "In-flight"}
                </span>
              </div>

              <div className="overview-card">
                <span className="overview-label">Roundtrip Latency</span>
                <span className="overview-value">{duration}</span>
              </div>

              <div className="overview-card">
                <span className="overview-label">Status Code</span>
                <span className="overview-value">
                  {capture.status_code || "Pending"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
