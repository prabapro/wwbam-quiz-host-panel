// src/pages/db/index.jsx

import {
  Database,
  RefreshCw,
  Download,
  AlertCircle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '@components/ui/button';
import { Alert, AlertDescription } from '@components/ui/alert';
import { Badge } from '@components/ui/badge';
import { NodePanel } from './components/NodePanel';
import { useDatabaseSnapshot } from './hooks/useDatabaseSnapshot';

/**
 * Download all nodes as a single JSON file.
 */
function downloadAllJson(data, nodes) {
  const payload = nodes.reduce((acc, node) => {
    acc[node.label] = data[node.key] ?? null;
    return acc;
  }, {});

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  anchor.href = url;
  anchor.download = `db-snapshot-${ts}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function DatabaseViewer() {
  const { nodes, data, isLoading, error, lastUpdated, isLive, reconnect } =
    useDatabaseSnapshot();

  const hasData = Object.keys(data).length > 0;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Title block */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Database className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">DB Viewer</h1>

              {/* Environment badge */}
              <Badge variant="outline" className="text-xs font-mono">
                {import.meta.env.VITE_ENVIRONMENT ?? 'development'}
              </Badge>

              {/* Live / connecting indicator */}
              {isLive ? (
                <Badge className="text-xs gap-1 bg-green-600 hover:bg-green-600 text-white">
                  <Wifi className="w-3 h-3" />
                  Live
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="text-xs gap-1 text-muted-foreground">
                  <WifiOff className="w-3 h-3" />
                  {isLoading ? 'Connecting…' : 'Disconnected'}
                </Badge>
              )}
            </div>

            <p className="text-muted-foreground text-sm">
              Real-time view of all Firebase Realtime Database nodes in raw
              kebab-case format — exactly as they appear in Firebase.
            </p>

            {lastUpdated && (
              <p className="text-xs text-muted-foreground mt-1">
                Last updated:{' '}
                <span className="font-mono">
                  {lastUpdated.toLocaleTimeString()}
                </span>
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadAllJson(data, nodes)}
              disabled={!hasData}
              title="Download all nodes as one JSON file">
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={reconnect}
              disabled={isLoading}
              title="Re-attach all real-time listeners">
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
              />
              Reconnect
            </Button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Node grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {nodes.map((node) => (
          <NodePanel
            key={node.key}
            label={node.label}
            nodeKey={node.key}
            data={data[node.key] ?? null}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
}
