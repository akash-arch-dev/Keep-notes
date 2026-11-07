export type KeepColorId =
  | 'default'
  | 'coral'
  | 'peach'
  | 'sand'
  | 'mint'
  | 'sage'
  | 'fog'
  | 'storm'
  | 'dusk'
  | 'blossom'
  | 'clay';

export interface KeepColor {
  id: KeepColorId;
  name: string;
  lightBg: string;
  darkBg: string;
  borderLight: string;
  borderDark: string;
}

export type MediaType = 'image' | 'drawing' | 'audio' | 'video';

export interface MediaItem {
  id: string;
  type: MediaType;
  url: string; // Data URL or object URL or web URL
  name?: string;
  caption?: string;
  createdAt: number;
  duration?: number; // for audio/video in seconds
}

export interface NotePage {
  id: string;
  title: string;
  content: string; // rich creative writing text or markdown
  media: MediaItem[];
  createdAt: number;
  updatedAt: number;
}

export interface Note {
  id: string;
  title: string;
  pages: NotePage[];
  activePageIndex?: number;
  color: KeepColorId;
  isPinned: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
}

export interface VocabularyItem {
  id: string;
  word: string; // The primary key (e.g. "Petrichor")
  definition: string;
  pronunciation?: string;
  etymology?: string;
  exampleContext?: string; // Story snippet or example usage
  tags: string[]; // e.g. ["#sensory", "#atmosphere", "#archaic"]
  customFields: KeyValuePair[]; // Arbitrary user key-value pairs (e.g. Tone: Melancholy, Chapter: 4, Dialect: Elvish)
  createdAt: number;
  updatedAt: number;
  // Node coordinates for visual map view
  mapX?: number;
  mapY?: number;
}

export type NavSection = 'notes' | 'pinned' | 'vocabulary' | 'supabase' | 'archive' | 'trash' | 'tag';
export type ViewMode = 'grid' | 'list';
