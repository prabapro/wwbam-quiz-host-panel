// src/pages/db/components/NodePanel.jsx

import { useState, useCallback } from 'react';
import {
  Copy,
  Download,
  ChevronDown,
  ChevronRight,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { JsonDisplay } from './JsonDisplay';

/**
 * Derive a human-readable record count from a node value.
 * - null / undefined → null (no badge)
 * - Array           → length
 * - Object          → key count
 * - Primitive       → null
 */
function getRecordCount(data) {
  if (data === null || data === undefined) return null;
  if (Array.isArray(data)) return data.length;
  if (typeof data === 'object') return Object.keys(data).length;
  return null;
}

/**
 * Serialise data to a pretty-printed JSON string.
 */
function toJsonString(data) {
  return JSON.stringify(data, null, 2);
}

/**
 * Copy JSON to clipboard. Returns a promise.
 */
async function copyToClipboard(jsonStr) {
  await navigator.clipboard.writeText(jsonStr);
}

/**
 * Trigger a browser JSON file download.
 */
function downloadJson(jsonStr, filename) {
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * NodePanel
 * Displays a single Firebase DB node with:
 *  - Collapsible JSON view
 *  - Copy node as JSON
 *  - Download node as JSON file
 *
 * Props:
 *   label     {string}   Firebase path label e.g. "game-state"
 *   nodeKey   {string}   Unique key used for the filename
 *   data      {unknown}  Raw node value (null if empty)
 *   isLoading {boolean}  True while the snapshot is being fetched
 */
export function NodePanel({ label, nodeKey, data, isLoading }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const recordCount = getRecordCount(data);
  const isEmpty = data === null || data === undefined;

  const handleCopy = useCallback(async () => {
    if (isEmpty) return;
    try {
      await copyToClipboard(toJsonString(data));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Copy failed');
    }
  }, [data, isEmpty]);

  const handleDownload = useCallback(() => {
    if (isEmpty) return;
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    downloadJson(toJsonString(data), `${nodeKey}-${ts}.json`);
  }, [data, isEmpty, nodeKey]);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
      {/* Panel Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/30">
        {/* Left: toggle + label + badge */}
        <button
          onClick={() => setIsExpanded((v) => !v)}
          className="flex items-center gap-2 min-w-0 flex-1 text-left hover:opacity-80 transition-opacity"
          aria-expanded={isExpanded}
          aria-label={`Toggle ${label} node`}>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
          )}

          <code className="text-sm font-semibold font-mono text-foreground truncate">
            /{label}
          </code>

          {!isLoading && recordCount !== null && (
            <Badge variant="secondary" className="text-xs shrink-0">
              {recordCount} {recordCount === 1 ? 'record' : 'records'}
            </Badge>
          )}

          {!isLoading && isEmpty && (
            <Badge
              variant="outline"
              className="text-xs shrink-0 text-muted-foreground">
              empty
            </Badge>
          )}
        </button>

        {/* Right: action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={isLoading || isEmpty}
            title="Copy as JSON"
            className="h-7 w-7 p-0">
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            disabled={isLoading || isEmpty}
            title="Download as JSON"
            className="h-7 w-7 p-0">
            <Download className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Panel Body */}
      {isExpanded && (
        <div className="overflow-auto max-h-120">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading…
            </div>
          ) : (
            <JsonDisplay data={data} />
          )}
        </div>
      )}
    </div>
  );
}
