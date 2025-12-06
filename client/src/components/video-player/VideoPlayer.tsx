import { useRef, useEffect, useState, useCallback } from "react";
import { useVideoPlayer } from "@/hooks/useVideoPlayer";
import { useKeyboardControls } from "@/hooks/useKeyboardControls";
import Controls from "./Controls";
import SubtitleOverlay from "./SubtitleOverlay";
import ContextMenu from "./ContextMenu";
import type { VideoFile, SubtitleFile } from "@/types";
import { saveVideoSettings, loadVideoSettings } from "@/lib/storage";

// Helper function to get aspect ratio class
const getAspectRatioClass = (ratio: string) => {
  switch (ratio) {
    case "16:9":
      return "aspect-video object-cover";
    case "4:3":
      return "aspect-[4/3] object-cover";
    case "21:9":
      return "aspect-[21/9] object-cover";
    case "fill":
      return "object-fill";
    case "stretch":
      return "object-fill";
    default:
      return "object-contain";
  }
};

interface VideoPlayerProps {
  video: VideoFile | null;
  subtitle: SubtitleFile | null;
  videos: VideoFile[];
  subtitles: SubtitleFile[];
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  aspectRatio?: string;
}

export default function VideoPlayer({ 
  video, 
  subtitle, 
  videos, 
  subtitles, 
  playbackRate: externalPlaybackRate, 
  onPlaybackRateChange: onExternalPlaybackRateChange,
  aspectRatio = "default"
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showSpeedIndicator, setShowSpeedIndicator] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(2.0);
  const [currentPlaybackRate, setCurrentPlaybackRate] = useState(1.0);

  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    isFullscreen,
    showControls,
    progress,
    isLoading,
    playbackRate,
    playPause,
    seek,
    setVolume,
    toggleFullscreen,
    setShowControls,
    setPlaybackRate,
  } = useVideoPlayer(videoRef, containerRef);

  // Sync external playback rate with internal state - only when different
  useEffect(() => {
    if (Math.abs(externalPlaybackRate - playbackRate) > 0.01) {
      setPlaybackRate(externalPlaybackRate);
    }
  }, [externalPlaybackRate, setPlaybackRate]);

  // Handle playback rate changes from sidebar
  const handlePlaybackRateChange = useCallback((rate: number) => {
    setPlaybackRate(rate);
    onExternalPlaybackRateChange(rate);
  }, [setPlaybackRate, onExternalPlaybackRateChange]);

  const { temporarySpeed, setTemporarySpeed } = useKeyboardControls({
    videoRef,
    playPause,
    seek,
    setVolume,
    toggleFullscreen,
    onSpeedChange: (show) => {
      setShowSpeedIndicator(show);
      if (show) {
        setCurrentSpeed(temporarySpeed);
        setCurrentPlaybackRate(temporarySpeed);
      } else {
        setCurrentPlaybackRate(1.0);
      }
    },
  });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const hideContextMenu = () => {
    setContextMenu(null);
  };

  const handleMouseMove = () => {
    setShowControls(true);
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    // Don't interfere with controls
    if ((e.target as HTMLElement).closest('.controls-overlay')) {
      return;
    }
    
    // Toggle play/pause on video click
    playPause();
  };

  useEffect(() => {
    const handleClickOutside = () => hideContextMenu();
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Load video when video prop changes
  useEffect(() => {
    if (video && video.file && videoRef.current) {
      const videoElement = videoRef.current;
      const videoUrl = URL.createObjectURL(video.file);
      
      videoElement.src = videoUrl;
      videoElement.load();
      
      // Load saved video position after metadata is loaded
      const handleLoadedMetadata = () => {
        console.log('VIDEO: Metadata loaded, duration:', videoElement.duration);
        const videoSettings = loadVideoSettings(video.id);
        if (videoSettings && videoSettings.position > 0) {
          videoElement.currentTime = videoSettings.position;
          console.log('VIDEO: Restored position', videoSettings.position, 'for video', video.id);
        }
      };

      // Also try to restore position on canplay event
      const handleCanPlay = () => {
        console.log('VIDEO: Can play event, duration:', videoElement.duration);
        if (videoElement.duration && !isNaN(videoElement.duration)) {
          const videoSettings = loadVideoSettings(video.id);
          if (videoSettings && videoSettings.position > 0 && videoElement.currentTime === 0) {
            videoElement.currentTime = videoSettings.position;
            console.log('VIDEO: Restored position on canplay', videoSettings.position);
          }
        }
      };
      
      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.addEventListener('canplay', handleCanPlay);
      
      return () => {
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.removeEventListener('canplay', handleCanPlay);
        URL.revokeObjectURL(videoUrl);
      };
    }
  }, [video]);

  // Save video position periodically
  useEffect(() => {
    if (!video || !videoRef.current) return;
    
    const videoElement = videoRef.current;
    let saveInterval: NodeJS.Timeout;
    
    const savePosition = () => {
      if (videoElement.currentTime > 0 && videoElement.duration > 0) {
        saveVideoSettings(video.id, {
          position: videoElement.currentTime,
          playbackRate: externalPlaybackRate,
          subtitle: null,
          lastPlayed: new Date().toISOString()
        });
      }
    };
    
    // Save position every 10 seconds
    saveInterval = setInterval(savePosition, 10000);
    
    // Save position on pause
    videoElement.addEventListener('pause', savePosition);
    
    return () => {
      clearInterval(saveInterval);
      videoElement.removeEventListener('pause', savePosition);
      savePosition(); // Save final position
    };
  }, [video, externalPlaybackRate]);

  if (!video) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="text-6xl text-gray-600 mb-4">🎬</div>
          <h2 className="text-xl text-gray-400 mb-2">No video selected</h2>
          <p className="text-gray-500">Upload a video file to start watching</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`video-container flex-1 relative ${
        isFullscreen ? "fullscreen-mode" : ""
      }`}
      onContextMenu={handleContextMenu}
      onMouseMove={handleMouseMove}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className={`w-full h-full bg-black cursor-pointer ${getAspectRatioClass(aspectRatio)}`}
        onLoadStart={() => console.log("Video loading started")}
        onLoadedMetadata={() => console.log("Video metadata loaded")}
        onCanPlay={() => console.log("Video can play")}
        onError={(e) => console.error("Video error:", e)}
        onClick={handleVideoClick}
      />

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-vlc-orange text-xl">Loading...</div>
        </div>
      )}

      {/* Speed Indicator */}
      <div className={`speed-indicator ${showSpeedIndicator ? "show" : ""}`}>
        {currentSpeed}x
      </div>



      {/* Subtitle Overlay */}
      <SubtitleOverlay
        subtitle={subtitle}
        currentTime={currentTime}
        subtitleDelay={0}
        subtitleSize={20}
        playbackRate={currentPlaybackRate}
      />

      {/* Controls Overlay */}
      <div className={`controls-overlay absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 ${showControls ? "" : "hidden"}`}>
        <Controls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          progress={progress}
          isFullscreen={isFullscreen}
          onPlayPause={playPause}
          onSeek={seek}
          onVolumeChange={setVolume}
          onToggleFullscreen={toggleFullscreen}
          video={video}
          videos={videos}
          subtitles={subtitles}
        />
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={hideContextMenu}
          onPlayPause={playPause}
          onToggleFullscreen={toggleFullscreen}
          video={video}
          videos={videos}
          subtitles={subtitles}
        />
      )}
    </div>
  );
}
