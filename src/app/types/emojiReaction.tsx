export enum EmojiReaction {
  Heart = 0,
  Fire = 1,
  Laughing = 2,
  Crying = 3,
  StarEyes = 4,
  Clapping = 5,
  ThumbsUp = 6,
  PartyPopper = 7,
  MusicalNote = 8,
  Rocket = 9,
}

export interface ReactionResponse {
  userId?: string;
  songId?: string | null;
  reaction: EmojiReaction;
  timestamp: string; // ISO string from server
}
