"use client";

import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { createPortal } from 'react-dom';
import { EmojiReaction } from '@/src/app/types/emojiReaction';

type Particle = {
  id: string;
  emoji: string;
  left: number; // vw
  size: number; // px
  duration: number; // seconds
  delay: number; // seconds
  drift: number; // px
  rot: number; // deg (delta rotation applied during animation)
  initRot: number; // deg (initial rotation)
};

const getEmojiChar = (r: EmojiReaction) => {
  switch (r) {
    case EmojiReaction.Heart: return '❤️';
    case EmojiReaction.Fire: return '🔥';
    case EmojiReaction.Laughing: return '😂';
    case EmojiReaction.Crying: return '😭';
    case EmojiReaction.StarEyes: return '🤩';
    case EmojiReaction.Clapping: return '👏';
    case EmojiReaction.ThumbsUp: return '👍';
    case EmojiReaction.PartyPopper: return '🎉';
    case EmojiReaction.MusicalNote: return '🎵';
    case EmojiReaction.Rocket: return '🚀';
    default: return '✨';
  }
};

const randomBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export type FallingEmojisHandle = {
  burst: (reaction: EmojiReaction, count?: number) => void;
};

const FallingEmojis = forwardRef<FallingEmojisHandle, {}>((_, ref) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useImperativeHandle(ref, () => ({
    burst(reaction: EmojiReaction, count?: number) {
      const num = typeof count === 'number' ? count : randomBetween(10, 30);
      const newParticles: Particle[] = [];
      for (let i = 0; i < num; i++) {
        const id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}_${i}`;
        newParticles.push({
          id,
          emoji: getEmojiChar(reaction),
          left: Math.random() * 100,
          size: randomBetween(18, 36),
          duration: Math.random() * 1.6 + 2.4, // 2.4 - 4.0s
          delay: Math.random() * 0.6,
          drift: (Math.random() - 0.5) * 200, // -100 to 100px
          rot: randomBetween(90, 720),
          initRot: Math.random() * 40 - 20,
        });
      }
      setParticles((prev) => [...prev, ...newParticles]);

      // Cleanup after longest duration + delay
      const maxTime = Math.max(...newParticles.map(p => p.duration + p.delay));
      setTimeout(() => {
        setParticles((prev) => prev.filter(p => !newParticles.some(np => np.id === p.id)));
      }, (maxTime + 0.2) * 1000);
    }
  }), []);

  const container = (
    <div aria-hidden style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', pointerEvents: 'none', userSelect: 'none', touchAction: 'none', zIndex: 9999, overflow: 'hidden' }}>
      <style>{`
        /* Use CSS variables for initial rotation, rotation delta and horizontal drift. */
        @keyframes fall {
          0% { transform: translate3d(0, -10vh, 0) translateX(0) rotate(var(--init-rot)); opacity: 1; }
          100% { transform: translate3d(0, 110vh, 0) translateX(var(--drift)) rotate(calc(var(--init-rot) + var(--rot))); opacity: 0; }
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: '-10vh',
            left: `${p.left}vw`,
            fontSize: p.size,
            transform: 'translateX(0)',
            willChange: 'transform, opacity',
            animation: `fall ${p.duration}s linear ${p.delay}s forwards`,
            // css variables for drift/rotation
            // @ts-ignore
            ['--drift' as any]: `${p.drift}px`,
            // @ts-ignore
            ['--rot' as any]: `${p.rot}deg`,
            // @ts-ignore
            ['--init-rot' as any]: `${p.initRot}deg`,
            pointerEvents: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            textShadow: '0 2px 6px rgba(0,0,0,0.35)',
            userSelect: 'none',
          }}
        >
          <span style={{ display: 'inline-block', userSelect: 'none' }}>{p.emoji}</span>
        </div>
      ))}
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(container, document.body);
  }
  return container;
});

export default FallingEmojis;

