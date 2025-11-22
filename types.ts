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

export enum AppStep {
  PACKAGING = 0,
  OUTLINE = 1,
  INTRO = 2,
  BODY = 3,
  OUTRO = 4,
  REVIEW = 5
}

export interface GeminiResponse<T> {
  data?: T;
  error?: string;
}