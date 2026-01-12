import { useState, useCallback, useRef, useEffect } from 'react';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface UseHistoryReturn<T> {
  state: T;
  setState: (newState: T | ((prev: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
}

/**
 * Custom hook for managing state with undo/redo history.
 * Useful for editors where users need to revert changes.
 *
 * @param initialState - The initial state value
 * @param maxHistory - Maximum number of history entries (default: 50)
 */
export function useHistory<T>(initialState: T, maxHistory = 50): UseHistoryReturn<T> {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  // Track if we're in the middle of an undo/redo operation
  const isUndoRedoRef = useRef(false);

  // Set new state and add to history
  const setState = useCallback(
    (newState: T | ((prev: T) => T)) => {
      setHistory((current) => {
        const resolvedState =
          typeof newState === 'function' ? (newState as (prev: T) => T)(current.present) : newState;

        // Don't add to history if state hasn't changed
        if (JSON.stringify(resolvedState) === JSON.stringify(current.present)) {
          return current;
        }

        // Add current state to past, clear future
        const newPast = [...current.past, current.present];

        // Limit history size
        if (newPast.length > maxHistory) {
          newPast.shift();
        }

        return {
          past: newPast,
          present: resolvedState,
          future: [],
        };
      });
    },
    [maxHistory]
  );

  // Undo - go back one step
  const undo = useCallback(() => {
    setHistory((current) => {
      if (current.past.length === 0) {
        return current;
      }

      const previous = current.past[current.past.length - 1];
      const newPast = current.past.slice(0, -1);

      isUndoRedoRef.current = true;

      return {
        past: newPast,
        present: previous,
        future: [current.present, ...current.future],
      };
    });
  }, []);

  // Redo - go forward one step
  const redo = useCallback(() => {
    setHistory((current) => {
      if (current.future.length === 0) {
        return current;
      }

      const next = current.future[0];
      const newFuture = current.future.slice(1);

      isUndoRedoRef.current = true;

      return {
        past: [...current.past, current.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  // Clear all history
  const clear = useCallback(() => {
    setHistory((current) => ({
      past: [],
      present: current.present,
      future: [],
    }));
  }, []);

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    clear,
  };
}

/**
 * Hook to add keyboard shortcuts for undo/redo
 */
export function useHistoryKeyboard(
  undo: () => void,
  redo: () => void,
  canUndo: boolean,
  canRedo: boolean
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl/Cmd + Z (undo) or Ctrl/Cmd + Shift + Z (redo)
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          // Redo
          if (canRedo) redo();
        } else {
          // Undo
          if (canUndo) undo();
        }
      }

      // Also support Ctrl/Cmd + Y for redo (common on Windows)
      if (isCtrlOrCmd && e.key === 'y') {
        e.preventDefault();
        if (canRedo) redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);
}
