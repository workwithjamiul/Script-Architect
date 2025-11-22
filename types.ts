
export interface ScriptData {
  topic: string;
  targetAudience: string;
  language: string;
  cta: string;
  selectedTitle: string;
  selectedThumbnail: string;
  selectedVideoIdea: string; // Corresponds to "Pain Point" or "Video Idea"
  selectedExpectations: string;
  outline: OutlinePoint[];
  introScript: string;
  bodyScript: string;
  outroScript: string;
}

export interface OutlinePoint {
  id: string;
  headline: string;
  what: string;
  why: string;
  how: string;
}

export interface PackagingIdea {
  title: string;
  thumbnail: string;
  videoIdea: string; // The "Pain Point"
  expectations: string; // What viewers expect
  psychology: string; // Why this title/angle works
}

export interface ApiKeyConfig {
  id: string;
  name: string;
  key: string;
  isEnabled: boolean;
}

export enum AppStep {
  PACKAGING = 0,
  OUTLINE = 1,
  INTRO = 2,
  BODY = 3,
  OUTRO = 4,
  REVIEW = 5
}

// --- BLOG SPECIFIC TYPES ---

export enum BlogStep {
  STRATEGY = 0,
  RESEARCH = 1,
  OUTLINE = 2,
  WRITING = 3,
  RESULT = 4
}

export interface BlogData {
  topic: string;
  targetAudience: string;
  tone: string;
  language: string;
  selectedTitle: string;
  seoKeywords: string[];
  competitorContent: string[]; // Array of competitor articles/outlines
  outline: BlogOutlineSection[];
  fullContent: string;
}

export interface BlogIdea {
  title: string;
  seoHook: string;
  targetKeywords: string[];
}

export interface BlogOutlineSection {
  id: string;
  heading: string;
  keyPoints: string[];
}

export interface GeminiResponse<T> {
  data?: T;
  error?: string;
}
