import { useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { formatTime, formatFileSize } from "@/lib/videoUtils";
import type { VideoFile, SubtitleFile } from "@/types";

interface ControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  progress: number;
  isFullscreen: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleFullscreen: () => void;
  video: VideoFile;
  videos: VideoFile[];
  subtitles: SubtitleFile[];
}

export default function Controls({
  isPlaying,
  currentTime,
  duration,
  volume,
  progress,
  isFullscreen,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onToggleFullscreen,
  video,
  videos,
  subtitles,
}: ControlsProps) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showTimeRemaining, setShowTimeRemaining] = useState(false);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!duration || isNaN(duration) || duration <= 0) {
      console.log('CONTROLS: Cannot seek - duration is', duration);
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pos = Math.max(0, Math.min(1, clickX / rect.width));
    const seekTime = pos * duration;
    
    console.log('CONTROLS: Progress click - clickX:', clickX, 'width:', rect.width, 'pos:', pos, 'seekTime:', seekTime, 'duration:', duration);
    
    // Force seek immediately
    onSeek(seekTime);
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons === 1) { // Left mouse button is pressed (dragging)
      handleProgressClick(e);
    }
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Handle immediate click
    e.preventDefault();
    handleProgressClick(e);
  };

  const handleSkipBackward = () => {
    onSeek(Math.max(0, currentTime - 10));
  };

  const handleSkipForward = () => {
    onSeek(Math.min(duration, currentTime + 10));
  };

  const isMuted = volume === 0;

  return (
    <div>
      {/* Progress Bar */}
      <div className="px-4 py-2">
        <div 
          className="progress-bar cursor-pointer select-none bg-white bg-opacity-30 rounded" 
          onClick={handleProgressClick}
          onMouseMove={handleProgressMouseMove}
          onMouseDown={handleProgressMouseDown}
          style={{ 
            height: '8px', 
            position: 'relative',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          <div
            className="progress-fill"
            style={{ 
              width: `${progress}%`,
              height: '100%',
              backgroundColor: '#ff8c00',
              borderRadius: '4px',
              transition: 'width 0.1s ease'
            }}
          />
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-4">
          {/* Play/Pause */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onPlayPause();
            }}
            className="vlc-button"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </Button>

          {/* Skip Buttons */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleSkipBackward();
            }}
            className="vlc-button"
          >
            <SkipBack size={20} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleSkipForward();
            }}
            className="vlc-button"
          >
            <SkipForward size={20} />
          </Button>

          {/* Volume */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onVolumeChange(isMuted ? 70 : 0);
              }}
              className="vlc-button"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </Button>
            <Slider
              value={[volume]}
              onValueChange={([value]) => onVolumeChange(value)}
              max={100}
              step={1}
              className="w-20"
            />
          </div>

          {/* Time Display */}
          <div 
            className="text-sm text-gray-300 cursor-pointer select-none"
            onClick={() => setShowTimeRemaining(!showTimeRemaining)}
            title="Click to toggle remaining time"
          >
            {duration > 0 ? (
              showTimeRemaining 
                ? `${formatTime(currentTime)} / -${formatTime(Math.max(0, duration - currentTime))}`
                : `${formatTime(currentTime)} / ${formatTime(duration)}`
            ) : (
              `${formatTime(currentTime)} / --:--`
            )}
          </div>

          {/* File Size Display */}
          <div className="text-sm text-gray-400">
            {formatFileSize(video.size)}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFullscreen();
            }}
            className="vlc-button"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </Button>
        </div>
      </div>
    </div>
  );
}
