import { useEffect, useState } from "react";
import { useSubtitles } from "@/hooks/useSubtitles";
import type { SubtitleFile } from "@shared/schema";

interface SubtitleOverlayProps {
  subtitle: SubtitleFile | null;
  currentTime: number;
  subtitleDelay: number;
  subtitleSize: number;
  playbackRate?: number;
}

export default function SubtitleOverlay({
  subtitle,
  currentTime,
  subtitleDelay,
  subtitleSize,
  playbackRate = 1,
}: SubtitleOverlayProps) {
  const [currentSubtitle, setCurrentSubtitle] = useState<string>("");
  const { parseSubtitles, getCurrentSubtitle } = useSubtitles();

  useEffect(() => {
    if (subtitle && subtitle.content) {
      const parsedSubtitles = parseSubtitles(subtitle.content, subtitle.format);
      // Adjust for playback rate - subtitles should sync with actual video time
      const adjustedTime = (currentTime * 1000 + subtitleDelay); // Convert to milliseconds
      const current = getCurrentSubtitle(parsedSubtitles, adjustedTime);
      setCurrentSubtitle(current);
    } else {
      setCurrentSubtitle("");
    }
  }, [subtitle, currentTime, subtitleDelay, playbackRate, parseSubtitles, getCurrentSubtitle]);

  if (!currentSubtitle) {
    return null;
  }

  return (
    <div
      className="subtitle-overlay"
      style={{
        fontSize: `${subtitleSize}px`,
      }}
      dangerouslySetInnerHTML={{ __html: currentSubtitle }}
    />
  );
}
