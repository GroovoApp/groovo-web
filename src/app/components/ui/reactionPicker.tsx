'use client';

import React from 'react';
import { useSignalR } from '@/src/app/contexts/SignalRContext';
import { EmojiReaction, ReactionResponse } from '@/src/app/types/emojiReaction';

const EMOJI_MAP: { key: EmojiReaction; label: string }[] = [
  { key: EmojiReaction.Heart, label: '❤️' },
  { key: EmojiReaction.Fire, label: '🔥' },
  { key: EmojiReaction.Laughing, label: '😂' },
  { key: EmojiReaction.Crying, label: '😭' },
  { key: EmojiReaction.StarEyes, label: '🤩' },
  { key: EmojiReaction.Clapping, label: '👏' },
  { key: EmojiReaction.ThumbsUp, label: '👍' },
  { key: EmojiReaction.PartyPopper, label: '🎉' },
  { key: EmojiReaction.MusicalNote, label: '🎵' },
  { key: EmojiReaction.Rocket, label: '🚀' },
];

type Props = {
  songId?: string | null;
  // Called after a reaction is sent (so the sender can display it locally)
  onReact?: (r: ReactionResponse) => void;
};

export default function ReactionPicker({ songId, onReact }: Props) {
  const { sendReaction, isConnected } = useSignalR();

  const handleSend = async (reactionKey: EmojiReaction) => {
    if (!isConnected) return;
    try {
      await sendReaction(reactionKey);
      // Build a local reaction response to show to the sender immediately
      const response: ReactionResponse = {
        userId: 'me',
        songId: songId ?? null,
        reaction: reactionKey,
        timestamp: new Date().toISOString(),
      };
      onReact?.(response);
    } catch (err) {
      console.error('Failed to send reaction', err);
    }
  };

  return (
    <div className="inline-flex items-center gap-2 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 shadow-2xl">
      {EMOJI_MAP.map((e) => (
        <button
          key={e.key}
          onClick={() => handleSend(e.key)}
          title={`Send ${e.label}`}
          aria-label={`Send ${e.label}`}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/6 hover:bg-white/10 active:scale-95 transition transform text-2xl shadow-sm"
        >
          <span className="animate-[pulse_900ms_infinite]">{e.label}</span>
        </button>
      ))}
    </div>
  );
}
