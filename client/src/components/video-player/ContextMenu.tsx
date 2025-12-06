import { Play, Maximize, Headphones, Captions, Settings } from "lucide-react";
import type { VideoFile, SubtitleFile } from "@/types";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onPlayPause: () => void;
  onToggleFullscreen: () => void;
  video: VideoFile;
  videos: VideoFile[];
  subtitles: SubtitleFile[];
}

export default function ContextMenu({
  x,
  y,
  onClose,
  onPlayPause,
  onToggleFullscreen,
  video,
  videos,
  subtitles,
}: ContextMenuProps) {
  const handleItemClick = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      className="context-menu"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="context-menu-item"
        onClick={() => handleItemClick(onPlayPause)}
      >
        <Play className="mr-2" size={16} />
        Play/Pause
      </div>
      <div
        className="context-menu-item"
        onClick={() => handleItemClick(onToggleFullscreen)}
      >
        <Maximize className="mr-2" size={16} />
        Fullscreen
      </div>
      <div className="context-menu-item">
        <Headphones className="mr-2" size={16} />
        Audio Tracks
      </div>
      <div className="context-menu-item">
        <Captions className="mr-2" size={16} />
        Subtitles
      </div>
      <div className="context-menu-item">
        <Settings className="mr-2" size={16} />
        Settings
      </div>
    </div>
  );
}
