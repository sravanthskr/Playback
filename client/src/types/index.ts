export interface VideoFile {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  duration: number | null;
  audioTracks: Array<{
    index: number;
    language: string;
    codec: string;
    title?: string;
  }> | null;
  subtitleTracks: Array<{
    index: number;
    language: string;
    codec: string;
    title?: string;
  }> | null;
  metadata: Record<string, any> | null;
  localUrl?: string;
  file?: File;
}

export interface SubtitleFile {
  id: number;
  filename: string;
  originalName: string;
  format: string;
  language: string | null;
  content: string;
  file?: File;
}
