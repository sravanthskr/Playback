import { useCallback } from "react";
import { parseSRT, parseVTT, parseASS } from "@/lib/subtitleParser";

interface SubtitleItem {
  start: number;
  end: number;
  text: string;
}

export function useSubtitles() {
  const parseSubtitles = useCallback((content: string, format: string): SubtitleItem[] => {
    switch (format.toLowerCase()) {
      case "srt":
        return parseSRT(content);
      case "vtt":
        return parseVTT(content);
      case "ass":
        return parseASS(content);
      default:
        return [];
    }
  }, []);

  const getCurrentSubtitle = useCallback((subtitles: SubtitleItem[], currentTime: number): string => {
    const current = subtitles.find(
      (subtitle) => currentTime >= subtitle.start && currentTime <= subtitle.end
    );
    return current ? current.text : "";
  }, []);

  return {
    parseSubtitles,
    getCurrentSubtitle,
  };
}
