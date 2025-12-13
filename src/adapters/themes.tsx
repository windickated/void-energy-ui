/*
 * ROLE: React adapter hook for the Triad Engine.
 * RESPONSIBILITY: Exposes atmosphere state and setters backed by the shared VoidEngine so React trees honor Triad attributes without duplicating logic.
 */

import { useEffect, useState } from 'react';
import { VoidEngine } from './void-engine';

// Singleton engine keeps Physics/Mode attributes consistent across React trees.
const voidEngine = new VoidEngine();

/**
 * React hook exposing atmosphere controls and derived config.
 */
export function useVoidTheme() {
  const [atmosphere, setAtmosState] = useState<string>(voidEngine.atmosphere);

  useEffect(() => {
    // Subscribe to Triad changes; unsubscribe is returned by the engine.
    const unsubscribe = voidEngine.subscribe((newAtmos) => {
      setAtmosState(newAtmos);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const setAtmosphere = (name: string) => {
    voidEngine.setAtmosphere(name);
  };

  return {
    atmosphere,
    setAtmosphere,
    // Convenience accessor for Physics/Mode derived from the current atmosphere.
    config: voidEngine.getConfig(atmosphere),
  };
}

// Reference usage component
/*
export const ThemeSwitcher = () => {
  const { atmosphere, setAtmosphere, config } = useVoidTheme();

  return (
    <div className="card-glass pad-md">
      <h3>Current: {atmosphere}</h3>
      <p className="text-dim">
        Physics: {config.physics} | Mode: {config.mode}
      </p>
      
      <div className="flex-row gap-sm">
        <button onClick={() => setAtmosphere('void')}>Void</button>
        <button onClick={() => setAtmosphere('paper')}>Paper</button>
        <button onClick={() => setAtmosphere('terminal')}>Terminal</button>
      </div>
    </div>
  );
};
*/
