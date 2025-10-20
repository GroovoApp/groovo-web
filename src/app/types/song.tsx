export type Song = {
  id: string;        // Unique identifier
  title: string;     // Song title
  album?: string;    // Album name (optional)
  image: string;    // Cover image URL (optional)
  author: string;    // Artist(s)
  dateAdded: string; // Date added as string
  duration: string;  // Duration formatted like "3:45"
};
