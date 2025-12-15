'use client';

import React, { createContext, useContext, useRef } from 'react';
import FallingEmojis, { FallingEmojisHandle } from '@/src/app/components/ui/fallingEmojis';

type FallingContextType = {
  burst: (reaction: number, count?: number) => void;
};

const FallingEmojisContext = createContext<FallingContextType>({
  burst: () => {},
});

export const useFallingEmojis = () => useContext(FallingEmojisContext);

export function FallingEmojisProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<FallingEmojisHandle | null>(null);

  const burst = (reaction: number, count?: number) => {
    try {
      ref.current?.burst(reaction as any, count);
    } catch (err) {
      console.error('FallingEmojisProvider burst error', err);
    }
  };

  return (
    <FallingEmojisContext.Provider value={{ burst }}>
      {children}
      <FallingEmojis ref={ref} />
    </FallingEmojisContext.Provider>
  );
}

export default FallingEmojisContext;
