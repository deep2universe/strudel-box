/**
 * Strudel Box - Log Panel
 * Displays log messages to the user in the REPL interface
 */

import type { LogLevel } from './sampleLoader';

// =============================================================================
// Types
// =============================================================================

interface LogEntry {
  message: string;
  level: LogLevel;
  timestamp: Date;
}

// =============================================================================
// State
// =============================================================================

const MAX_LOG_ENTRIES = 50;
const logEntries: LogEntry[] = [];
let logContainer: HTMLElement | null = null;
let isExpanded = false;

// =============================================================================
// Initialization
// =============================================================================

/**
 * Initialize the log panel in the DOM
 */
export function initLogPanel(): void {
  // Create log panel container
  const panel = document.createElement('div');
  panel.id = 'log-panel';
  panel.className = 'log-panel collapsed';
  
  panel.innerHTML = `
    <div class="log-header">
      <span class="log-title">📋 Log</span>
      <span class="log-badge" id="log-badge">0</span>
      <button class="log-toggle" id="log-toggle" title="Toggle log panel">▼</button>
      <button class="log-clear" id="log-clear" title="Clear logs">🗑️</button>
    </div>
    <div class="log-content" id="log-content"></div>
  `;
  
  // Insert before controls
  const controls = document.getElementById('controls');
  if (controls && controls.parentNode) {
    controls.parentNode.insertBefore(panel, controls);
  } else {
    document.body.appendChild(panel);
  }
  
  logContainer = document.getElementById('log-content');
  
  // Setup event listeners
  const toggleBtn = document.getElementById('log-toggle');
  const clearBtn = document.getElementById('log-clear');
  
  toggleBtn?.addEventListener('click', toggleLogPanel);
  clearBtn?.addEventListener('click', clearLogs);
}

// =============================================================================
// Log Panel Controls
// =============================================================================

function toggleLogPanel(): void {
  const panel = document.getElementById('log-panel');
  const toggleBtn = document.getElementById('log-toggle');
  
  if (panel && toggleBtn) {
    isExpanded = !isExpanded;
    panel.classList.toggle('collapsed', !isExpanded);
    panel.classList.toggle('expanded', isExpanded);
    toggleBtn.textContent = isExpanded ? '▲' : '▼';
    
    // Reset badge when expanded
    if (isExpanded) {
      updateBadge(0);
    }
  }
}

function updateBadge(count: number): void {
  const badge = document.getElementById('log-badge');
  if (badge) {
    badge.textContent = String(count);
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }
}

function clearLogs(): void {
  logEntries.length = 0;
  if (logContainer) {
    logContainer.innerHTML = '';
  }
  updateBadge(0);
}

// =============================================================================
// Logging
// =============================================================================

/**
 * Add a log entry to the panel
 */
export function addLog(message: string, level: LogLevel = 'info'): void {
  const entry: LogEntry = {
    message,
    level,
    timestamp: new Date()
  };
  
  logEntries.push(entry);
  
  // Trim old entries
  while (logEntries.length > MAX_LOG_ENTRIES) {
    logEntries.shift();
  }
  
  // Render entry
  renderLogEntry(entry);
  
  // Update badge if collapsed
  if (!isExpanded) {
    const unreadCount = logEntries.filter(e => 
      e.level === 'error' || e.level === 'warn'
    ).length;
    updateBadge(unreadCount);
  }
}

function renderLogEntry(entry: LogEntry): void {
  if (!logContainer) return;
  
  const el = document.createElement('div');
  el.className = `log-entry log-${entry.level}`;
  
  const time = entry.timestamp.toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  const icon = {
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    success: '✅'
  }[entry.level];
  
  el.innerHTML = `
    <span class="log-time">${time}</span>
    <span class="log-icon">${icon}</span>
    <span class="log-message">${escapeHtml(entry.message)}</span>
  `;
  
  logContainer.appendChild(el);
  
  // Auto-scroll to bottom
  logContainer.scrollTop = logContainer.scrollHeight;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Get log callback for sample loader
 */
export function getLogCallback(): (message: string, level: LogLevel) => void {
  return addLog;
}
