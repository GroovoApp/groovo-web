export interface AuthorData {
  id: string;
  name: string;
  bio: string;
  imageUrl: string;
}

export interface SongData {
  id: string;
  name: string;
  description: string;
  releaseDate: string;
  picture: string;
  album: string;
  genre: string;
  tags: string[];
  audioUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  length: number;   // in seconds
  plays: number;
  likes: number;
  authors: AuthorData;
}
