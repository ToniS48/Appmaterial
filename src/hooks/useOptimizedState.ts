import { useCallback, useState, useRef } from 'react';

export function useOptimizedState<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const lastUpdateTime = useRef<number>(0);
  
  const optimizedSetState = useCallback((newState: T | ((prev: T) => T)) => {
    const now = Date.now();
    
    // Throttle updates to prevent excessive re-renders
    if (now - lastUpdateTime.current < 16) { // ~60fps
      return;
    }
    
    lastUpdateTime.current = now;
    setState(newState);
  }, []);

  return [state, optimizedSetState] as const;
}