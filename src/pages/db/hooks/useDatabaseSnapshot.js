// src/pages/db/hooks/useDatabaseSnapshot.js

import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '@config/firebase';
import { DB_PATHS } from '@services/database.service';

/**
 * Node definitions for the DB viewer.
 * Each entry maps a display label to its Firebase path.
 * Raw `.val()` is returned so the output reflects the actual kebab-case
 * Firebase format — useful for documentation.
 */
const DB_NODES = [
  { key: 'gameState', label: 'game-state', path: DB_PATHS.GAME_STATE },
  { key: 'teams', label: 'teams', path: DB_PATHS.TEAMS },
  { key: 'questionSets', label: 'question-sets', path: DB_PATHS.QUESTION_SETS },
  {
    key: 'prizeStructure',
    label: 'prize-structure',
    path: DB_PATHS.PRIZE_STRUCTURE,
  },
  { key: 'config', label: 'config', path: DB_PATHS.CONFIG },
  { key: 'allowedHosts', label: 'allowed-hosts', path: DB_PATHS.ALLOWED_HOSTS },
];

/**
 * useDatabaseSnapshot
 *
 * Attaches a real-time `onValue` listener to every root DB node.
 * Any change pushed to Firebase is reflected instantly — same mechanism
 * the public display would use.
 *
 * Listeners are attached on mount and cleaned up on unmount.
 * `reconnect` tears down and re-attaches all listeners (manual refresh).
 *
 * @returns {{
 *   nodes: typeof DB_NODES,
 *   data: Record<string, unknown>,
 *   isLoading: boolean,
 *   error: string | null,
 *   lastUpdated: Date | null,
 *   isLive: boolean,
 *   reconnect: () => void,
 * }}
 */
export function useDatabaseSnapshot() {
  const [data, setData] = useState({});
  const [loadedNodes, setLoadedNodes] = useState(new Set());
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Track unsubscribe functions so we can clean them all up
  const unsubscribeRefs = useRef([]);

  const attachListeners = useCallback(() => {
    // Clean up any existing listeners first
    unsubscribeRefs.current.forEach((unsub) => unsub());
    unsubscribeRefs.current = [];

    // Reset state for fresh connection
    setData({});
    setLoadedNodes(new Set());
    setError(null);

    DB_NODES.forEach(({ key, path }) => {
      const nodeRef = ref(database, path);

      const handler = (snapshot) => {
        const value = snapshot.exists() ? snapshot.val() : null;

        setData((prev) => ({ ...prev, [key]: value }));
        setLoadedNodes((prev) => new Set([...prev, key]));
        setLastUpdated(new Date());
      };

      const errorHandler = (err) => {
        console.error(`❌ Real-time listener error on /${path}:`, err);
        setError(err.message || `Failed to listen to /${path}`);
      };

      onValue(nodeRef, handler, errorHandler);

      // Store cleanup function
      unsubscribeRefs.current.push(() => off(nodeRef, 'value', handler));
    });
  }, []);

  // Attach on mount, detach on unmount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    attachListeners();
    return () => {
      unsubscribeRefs.current.forEach((unsub) => unsub());
    };
  }, [attachListeners]);

  // All nodes have received at least one value from Firebase
  const isLoading = loadedNodes.size < DB_NODES.length;

  // All listeners are active and data has been received
  const isLive = !isLoading && !error;

  return {
    nodes: DB_NODES,
    data,
    isLoading,
    error,
    lastUpdated,
    isLive,
    reconnect: attachListeners,
  };
}
