import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVideoPlayer } from "@/hooks/useVideoPlayer";
import { useKeyboardControls } from "@/hooks/useKeyboardControls";
import OverlayControls from "@/components/video-player/OverlayControls";
import SubtitleOverlay from "@/components/video-player/SubtitleOverlay";
import type { VideoFile, SubtitleFile } from "@/types";
import { savePlayerState, loadPlayerState, saveVideoSettings, loadVideoSettings } from "@/lib/storage";
import { FolderOpen } from "lucide-react";

const getAspectRatioClass = (ratio: string) => {
  switch (ratio) {
    case "16:9": return "aspect-video object-cover";
    case "4:3": return "aspect-[4/3] object-cover";
    case "21:9": return "aspect-[21/9] object-cover";
    case "fill": return "object-fill";
    case "stretch": return "object-fill";
    default: return "object-contain";
  }
};

export default function VideoPlayerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [currentVideo, setCurrentVideo] = useState<VideoFile | null>(null);
  const [currentSubtitle, setCurrentSubtitle] = useState<SubtitleFile | null>(null);
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [subtitles, setSubtitles] = useState<SubtitleFile[]>([]);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [aspectRatio, setAspectRatio] = useState("default");
  const [subtitleDelay, setSubtitleDelay] = useState(0);
  const [subtitleSize, setSubtitleSize] = useState(24);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showTimeRemaining, setShowTimeRemaining] = useState(false);
  const [speedHotkey, setSpeedHotkey] = useState("Space");

  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    isFullscreen,
    showControls,
    progress,
    isLoading,
    playPause,
    seek,
    setVolume,
    toggleFullscreen,
    setShowControls,
    setPlaybackRate: setPlayerPlaybackRate,
  } = useVideoPlayer(videoRef, containerRef);

  const isPaused = !isPlaying && currentVideo !== null && duration > 0;
  const [showSpeedIndicator, setShowSpeedIndicator] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(1.0);

  const { temporarySpeed, setTemporarySpeed } = useKeyboardControls({
    videoRef,
    playPause,
    seek,
    setVolume,
    toggleFullscreen,
    onSpeedChange: (show) => {
      setShowSpeedIndicator(show);
      if (show) {
        setCurrentSpeed(temporarySpeed || playbackRate);
      }
    },
    speedHotkey,
  });

  const addVideo = (video: VideoFile) => {
    setVideos(prev => [...prev, video]);
  };

  const addSubtitle = (subtitle: SubtitleFile) => {
    setSubtitles(prev => [...prev, subtitle]);
  };

  useEffect(() => {
    const savedState = loadPlayerState();
    if (savedState) {
      setPlaybackRate(savedState.playbackRate || 1.0);
      if (savedState.volume !== undefined && savedState.volume >= 0) {
        setVolume(savedState.volume);
      }
      if (savedState.showTimeRemaining !== undefined) {
        setShowTimeRemaining(savedState.showTimeRemaining);
      }
      if (savedState.speedHotkey) {
        setSpeedHotkey(savedState.speedHotkey);
      }
    }
  }, []);

  useEffect(() => {
    if (currentVideo) {
      savePlayerState({
        currentVideoId: currentVideo.id,
        currentSubtitleId: currentSubtitle?.id || null,
        playbackRate,
        volume,
        showTimeRemaining,
        videoPosition: currentTime,
        lastPlayed: new Date().toISOString(),
        speedHotkey,
      });
    }
  }, [currentVideo, currentSubtitle, playbackRate, volume, currentTime, showTimeRemaining, speedHotkey]);

  useEffect(() => {
    const savedState = loadPlayerState();
    savePlayerState({
      currentVideoId: savedState?.currentVideoId || null,
      currentSubtitleId: savedState?.currentSubtitleId || null,
      playbackRate,
      volume,
      showTimeRemaining,
      videoPosition: savedState?.videoPosition || 0,
      lastPlayed: new Date().toISOString(),
      speedHotkey,
    });
  }, [showTimeRemaining, speedHotkey, playbackRate, volume]);

  useEffect(() => {
    if (currentVideo && currentVideo.file && videoRef.current) {
      const videoElement = videoRef.current;
      const videoUrl = URL.createObjectURL(currentVideo.file);
      
      videoElement.src = videoUrl;
      videoElement.load();
      
      const handleLoadedMetadata = () => {
        const videoSettings = loadVideoSettings(currentVideo.id);
        if (videoSettings && videoSettings.position > 0) {
          videoElement.currentTime = videoSettings.position;
        }
        videoElement.play().catch(() => {});
      };
      
      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      return () => {
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        URL.revokeObjectURL(videoUrl);
      };
    }
  }, [currentVideo]);

  useEffect(() => {
    if (!currentVideo || !videoRef.current) return;
    
    const videoElement = videoRef.current;
    let saveInterval: NodeJS.Timeout;
    
    const savePosition = () => {
      if (videoElement.currentTime > 0 && videoElement.duration > 0) {
        saveVideoSettings(currentVideo.id, {
          position: videoElement.currentTime,
          playbackRate,
          subtitle: currentSubtitle?.id || null,
          lastPlayed: new Date().toISOString()
        });
      }
    };
    
    saveInterval = setInterval(savePosition, 10000);
    videoElement.addEventListener('pause', savePosition);
    
    return () => {
      clearInterval(saveInterval);
      videoElement.removeEventListener('pause', savePosition);
      savePosition();
    };
  }, [currentVideo, playbackRate, currentSubtitle]);

  useEffect(() => {
    setPlayerPlaybackRate(playbackRate);
  }, [playbackRate, setPlayerPlaybackRate]);

  const handleVideoClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.controls-area')) return;
    playPause();
  }, [playPause]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
  }, [setShowControls]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('video/') || file.name.match(/\.(mp4|mkv|avi|mov|webm)$/i))) {
      const videoFile: VideoFile = {
        id: Date.now(),
        filename: file.name,
        originalName: file.name,
        mimeType: file.type || 'video/mp4',
        size: file.size,
        duration: null,
        audioTracks: null,
        subtitleTracks: null,
        metadata: null,
        localUrl: URL.createObjectURL(file),
        file: file
      };
      addVideo(videoFile);
      setCurrentVideo(videoFile);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`
        relative w-screen h-screen bg-black overflow-hidden
        ${isFullscreen ? 'fixed inset-0 z-50' : ''}
      `}
      onMouseMove={handleMouseMove}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className={`
          absolute inset-0 w-full h-full bg-black
          ${getAspectRatioClass(aspectRatio)}
        `}
        onClick={handleVideoClick}
        playsInline
      />

      {/* Loading Indicator */}
      <AnimatePresence>
        {isLoading && currentVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 z-20"
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full"
              />
              <span className="text-white/60">Loading video...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag Overlay */}
      <AnimatePresence>
        {isDraggingOver && currentVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/80 z-30 border-4 border-dashed border-orange-500"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">📁</div>
              <p className="text-2xl text-white font-medium">Drop to replace video</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty Player Screen (when no video) */}
      <AnimatePresence>
        {!currentVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black z-10"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center gap-4 text-center"
            >
              <div className="p-4 rounded-full bg-white/5 border border-white/10">
                <FolderOpen size={32} className="text-white/40" />
              </div>
              <div>
                <p className="text-white/60 text-lg">No video loaded</p>
                <p className="text-white/40 text-sm mt-1">
                  Click the folder icon in the controls below to open a video
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtitle Overlay */}
      {currentVideo && currentSubtitle && (
        <SubtitleOverlay
          subtitle={currentSubtitle}
          currentTime={currentTime}
          subtitleDelay={subtitleDelay}
          subtitleSize={subtitleSize}
          playbackRate={playbackRate}
        />
      )}

      {/* Overlay Controls */}
      <div className="controls-area absolute inset-0 z-20">
        <OverlayControls
          isPlaying={isPlaying}
          isPaused={isPaused}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          progress={progress}
          isFullscreen={isFullscreen}
          showControls={showControls || !currentVideo}
          video={currentVideo}
          subtitles={subtitles}
          currentSubtitle={currentSubtitle}
          playbackRate={playbackRate}
          aspectRatio={aspectRatio}
          subtitleDelay={subtitleDelay}
          subtitleSize={subtitleSize}
          onPlayPause={playPause}
          onSeek={seek}
          onVolumeChange={setVolume}
          onToggleFullscreen={toggleFullscreen}
          onSubtitleSelect={setCurrentSubtitle}
          onSubtitleAdd={addSubtitle}
          onPlaybackRateChange={setPlaybackRate}
          onAspectRatioChange={setAspectRatio}
          onSubtitleDelayChange={setSubtitleDelay}
          onSubtitleSizeChange={setSubtitleSize}
          onVideoAdd={addVideo}
          onVideoSelect={setCurrentVideo}
          showTimeRemaining={showTimeRemaining}
          onToggleTimeRemaining={() => setShowTimeRemaining(!showTimeRemaining)}
          speedHotkey={speedHotkey}
          onSpeedHotkeyChange={setSpeedHotkey}
        />
      </div>

      {/* Speed Indicator */}
      <AnimatePresence>
        {showSpeedIndicator && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-6 right-6 px-4 py-2 rounded-lg bg-black/60 backdrop-blur-sm border border-orange-500/50 z-20"
          >
            <span className="text-orange-400 font-bold">{currentSpeed}x</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Hint (shows briefly on first load) */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 3, duration: 1 }}
        className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-none z-10"
      >
        <div className="flex gap-4 text-white/30 text-xs">
          <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded">Space</kbd> Play/Pause</span>
          <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded">F</kbd> Fullscreen</span>
          <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded">M</kbd> Mute</span>
          <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded">←→</kbd> Seek</span>
        </div>
      </motion.div>
    </div>
  );
}
