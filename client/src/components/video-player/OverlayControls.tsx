import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Pause, SkipBack, SkipForward, 
  Volume2, VolumeX, Maximize, Minimize,
  Settings, Subtitles, Gauge, Ratio,
  Upload, X, ChevronRight, Plus, Minus, FolderOpen, Keyboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { formatTime, formatFileSize } from "@/lib/videoUtils";
import { useToast } from "@/hooks/use-toast";
import type { VideoFile, SubtitleFile } from "@/types";

interface OverlayControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  progress: number;
  isFullscreen: boolean;
  showControls: boolean;
  video: VideoFile | null;
  subtitles: SubtitleFile[];
  currentSubtitle: SubtitleFile | null;
  playbackRate: number;
  aspectRatio: string;
  subtitleDelay: number;
  subtitleSize: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleFullscreen: () => void;
  onSubtitleSelect: (subtitle: SubtitleFile | null) => void;
  onSubtitleAdd: (subtitle: SubtitleFile) => void;
  onPlaybackRateChange: (rate: number) => void;
  onAspectRatioChange: (ratio: string) => void;
  onSubtitleDelayChange: (delay: number) => void;
  onSubtitleSizeChange: (size: number) => void;
  onVideoAdd?: (video: VideoFile) => void;
  onVideoSelect?: (video: VideoFile) => void;
  showTimeRemaining: boolean;
  onToggleTimeRemaining: () => void;
  speedHotkey: string;
  onSpeedHotkeyChange: (key: string) => void;
}

const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4];
const aspectRatios = [
  { value: "default", label: "Default" },
  { value: "16:9", label: "16:9" },
  { value: "4:3", label: "4:3" },
  { value: "21:9", label: "21:9" },
  { value: "fill", label: "Fill" },
];

export default function OverlayControls({
  isPlaying,
  isPaused,
  currentTime,
  duration,
  volume,
  progress,
  isFullscreen,
  showControls,
  video,
  subtitles,
  currentSubtitle,
  playbackRate,
  aspectRatio,
  subtitleDelay,
  subtitleSize,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onToggleFullscreen,
  onSubtitleSelect,
  onSubtitleAdd,
  onPlaybackRateChange,
  onAspectRatioChange,
  onSubtitleDelayChange,
  onSubtitleSizeChange,
  onVideoAdd,
  onVideoSelect,
  showTimeRemaining,
  onToggleTimeRemaining,
  speedHotkey,
  onSpeedHotkeyChange,
}: OverlayControlsProps) {
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [isRecordingHotkey, setIsRecordingHotkey] = useState(false);
  const [wasFullscreenBeforeFilePicker, setWasFullscreenBeforeFilePicker] = useState(false);
  const subtitleInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getKeyDisplayName = (code: string) => {
    const keyMap: Record<string, string> = {
      "Space": "Space",
      "Enter": "Enter",
      "NumpadEnter": "Numpad Enter",
      "ShiftLeft": "Left Shift",
      "ShiftRight": "Right Shift",
      "ControlLeft": "Left Ctrl",
      "ControlRight": "Right Ctrl",
      "AltLeft": "Left Alt",
      "AltRight": "Right Alt",
    };
    return keyMap[code] || code.replace("Key", "").replace("Numpad", "Num ");
  };

  useEffect(() => {
    if (isPlaying) {
      setActivePanel(null);
    }
  }, [isPlaying]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!duration || isNaN(duration) || duration <= 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pos = Math.max(0, Math.min(1, clickX / rect.width));
    const seekTime = pos * duration;
    onSeek(seekTime);
  };

  const handleSubtitleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const content = await file.text();
    const format = file.name.split('.').pop()?.toLowerCase() || 'srt';
    
    const subtitleFile: SubtitleFile = {
      id: Date.now(),
      filename: file.name,
      originalName: file.name,
      format,
      language: 'en',
      content,
      file: file
    };
    
    onSubtitleAdd(subtitleFile);
    onSubtitleSelect(subtitleFile);
    if (subtitleInputRef.current) {
      subtitleInputRef.current.value = '';
    }
  };

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      if (wasFullscreenBeforeFilePicker && !document.fullscreenElement) {
        onToggleFullscreen();
      }
      setWasFullscreenBeforeFilePicker(false);
      return;
    }

    if (!file.type.startsWith('video/') && 
        !file.name.match(/\.(mp4|mkv|avi|mov|webm|m4v|wmv|flv)$/i)) {
      toast({
        title: "Invalid file",
        description: "Please select a video file",
        variant: "destructive",
      });
      if (wasFullscreenBeforeFilePicker && !document.fullscreenElement) {
        onToggleFullscreen();
      }
      setWasFullscreenBeforeFilePicker(false);
      return;
    }

    try {
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

      onVideoAdd?.(videoFile);
      onVideoSelect?.(videoFile);
      
      toast({
        title: "Video loaded",
        description: file.name,
      });

      if (wasFullscreenBeforeFilePicker && !document.fullscreenElement) {
        setTimeout(() => {
          onToggleFullscreen();
        }, 100);
      }
    } catch (error) {
      toast({
        title: "Failed to load video",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      if (wasFullscreenBeforeFilePicker && !document.fullscreenElement) {
        onToggleFullscreen();
      }
    }
    
    setWasFullscreenBeforeFilePicker(false);
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const handleOpenVideoFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setWasFullscreenBeforeFilePicker(isFullscreen);
    videoInputRef.current?.click();
  };

  const isMuted = volume === 0;
  const shouldShow = showControls || !isPlaying || activePanel !== null;
  const hasVideo = !!video;

  return (
    <AnimatePresence>
      {(shouldShow || !hasVideo) && (
        <>
          {/* Top Bar - Video Title (only when video is loaded) */}
          {hasVideo && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/70 to-transparent"
            >
              <h1 className="text-white text-xl font-medium truncate pr-20">
                {video?.originalName || video?.filename}
              </h1>
              <p className="text-white/60 text-sm mt-1">
                {video && formatFileSize(video.size)}
              </p>
            </motion.div>
          )}

          {/* Settings Panels - Left Side (only when video is loaded) */}
          {hasVideo && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute top-20 left-4 flex flex-col gap-1.5"
            >
              {/* Settings Buttons */}
              <SettingsButton
                icon={<Subtitles size={18} />}
                label="Subtitles"
                isActive={activePanel === 'subtitles'}
                onClick={() => setActivePanel(activePanel === 'subtitles' ? null : 'subtitles')}
              />
              <SettingsButton
                icon={<Gauge size={18} />}
                label={`${playbackRate}x`}
                isActive={activePanel === 'speed'}
                onClick={() => setActivePanel(activePanel === 'speed' ? null : 'speed')}
              />
              <SettingsButton
                icon={<Ratio size={18} />}
                label="Ratio"
                isActive={activePanel === 'aspect'}
                onClick={() => setActivePanel(activePanel === 'aspect' ? null : 'aspect')}
              />
              <SettingsButton
                icon={<Keyboard size={18} />}
                label="Hotkey"
                isActive={activePanel === 'hotkey'}
                onClick={() => setActivePanel(activePanel === 'hotkey' ? null : 'hotkey')}
              />
            </motion.div>
          )}

          {/* Subtitles Panel */}
          <AnimatePresence>
            {activePanel === 'subtitles' && (
              <SettingsPanel
                title="Subtitles"
                onClose={() => setActivePanel(null)}
              >
                <div className="space-y-2">
                  {/* Subtitle Selection */}
                  <div className="space-y-1">
                    <button
                      onClick={() => onSubtitleSelect(null)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        !currentSubtitle 
                          ? 'bg-orange-500/30 text-orange-400' 
                          : 'text-white/70 hover:bg-white/10'
                      }`}
                    >
                      Off
                    </button>
                    {subtitles.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => onSubtitleSelect(sub)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors truncate ${
                          currentSubtitle?.id === sub.id 
                            ? 'bg-orange-500/30 text-orange-400' 
                            : 'text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {sub.originalName}
                      </button>
                    ))}
                  </div>

                  {/* Load Subtitle Button */}
                  <input
                    ref={subtitleInputRef}
                    type="file"
                    accept=".srt,.ass,.vtt"
                    onChange={handleSubtitleFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => subtitleInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                  >
                    <Upload size={14} />
                    Load Subtitle
                  </button>

                  {/* Subtitle Sync */}
                  {currentSubtitle && (
                    <div className="pt-2 border-t border-white/10">
                      <h4 className="text-white/50 text-xs mb-2">Sync</h4>
                      
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-white/50">Delay</span>
                            <span className="text-white">{subtitleDelay}ms</span>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => onSubtitleDelayChange(subtitleDelay - 500)}
                              className="flex-1 py-1.5 rounded-md bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 transition-colors"
                            >
                              <Minus size={14} className="mx-auto" />
                            </button>
                            <button
                              onClick={() => onSubtitleDelayChange(subtitleDelay + 500)}
                              className="flex-1 py-1.5 rounded-md bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 transition-colors"
                            >
                              <Plus size={14} className="mx-auto" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-white/50">Size</span>
                            <span className="text-white">{subtitleSize}px</span>
                          </div>
                          <Slider
                            value={[subtitleSize]}
                            onValueChange={([value]) => onSubtitleSizeChange(value)}
                            min={12}
                            max={48}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </SettingsPanel>
            )}
          </AnimatePresence>

          {/* Speed Panel */}
          <AnimatePresence>
            {activePanel === 'speed' && (
              <SettingsPanel
                title="Speed"
                onClose={() => setActivePanel(null)}
              >
                <div className="grid grid-cols-3 gap-1">
                  {playbackRates.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        onPlaybackRateChange(rate);
                        setActivePanel(null);
                      }}
                      className={`px-2 py-1.5 rounded-md text-xs text-center transition-colors ${
                        playbackRate === rate 
                          ? 'bg-orange-500/30 text-orange-400' 
                          : 'text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </SettingsPanel>
            )}
          </AnimatePresence>

          {/* Aspect Ratio Panel */}
          <AnimatePresence>
            {activePanel === 'aspect' && (
              <SettingsPanel
                title="Aspect Ratio"
                onClose={() => setActivePanel(null)}
              >
                <div className="space-y-0.5">
                  {aspectRatios.map((ratio) => (
                    <button
                      key={ratio.value}
                      onClick={() => {
                        onAspectRatioChange(ratio.value);
                        setActivePanel(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                        aspectRatio === ratio.value 
                          ? 'bg-orange-500/30 text-orange-400' 
                          : 'text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </SettingsPanel>
            )}
          </AnimatePresence>

          {/* Hotkey Panel */}
          <AnimatePresence>
            {activePanel === 'hotkey' && (
              <SettingsPanel
                title="Speed Boost Hotkey"
                onClose={() => {
                  setActivePanel(null);
                  setIsRecordingHotkey(false);
                }}
              >
                <div className="space-y-3">
                  <p className="text-white/50 text-xs">
                    Hold this key to temporarily speed up playback
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white/70">Current Key</span>
                      <span className="text-orange-400 font-medium">
                        {getKeyDisplayName(speedHotkey)}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => setIsRecordingHotkey(!isRecordingHotkey)}
                      onKeyDown={(e) => {
                        if (isRecordingHotkey) {
                          e.preventDefault();
                          e.stopPropagation();
                          onSpeedHotkeyChange(e.code);
                          setIsRecordingHotkey(false);
                          toast({
                            title: "Hotkey Updated",
                            description: `Speed boost key set to ${getKeyDisplayName(e.code)}`,
                          });
                        }
                      }}
                      className={`w-full py-3 rounded-md text-sm font-medium transition-colors ${
                        isRecordingHotkey
                          ? 'bg-orange-500 text-white animate-pulse'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {isRecordingHotkey ? 'Press any key...' : 'Change Hotkey'}
                    </button>
                  </div>
                  
                  <div className="pt-2 border-t border-white/10">
                    <p className="text-white/40 text-xs">
                      Tip: Try Numpad Enter or Shift for easier access
                    </p>
                  </div>
                </div>
              </SettingsPanel>
            )}
          </AnimatePresence>

          {/* Bottom Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/80 to-transparent"
          >
            {/* Hidden Video Input */}
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*,.mp4,.mkv,.avi,.mov,.webm,.m4v,.wmv,.flv"
              onChange={handleVideoFileChange}
              className="hidden"
            />

            {/* Progress Bar (only when video is loaded) */}
            {hasVideo && (
              <div 
                className="relative h-1 bg-white/30 rounded-full mb-4 cursor-pointer group"
                onClick={handleProgressClick}
                onMouseMove={(e) => e.buttons === 1 && handleProgressClick(e)}
              >
                <div 
                  className="absolute h-full bg-orange-500 rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
                <div 
                  className="absolute h-3 w-3 bg-orange-500 rounded-full -top-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `calc(${progress}% - 6px)` }}
                />
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4">
                {hasVideo ? (
                  <>
                    {/* Play/Pause */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayPause();
                      }}
                      className="p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      {isPlaying ? <Pause size={20} className="text-white" /> : <Play size={20} className="text-white" />}
                    </button>

                    {/* Skip Backward */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSeek(Math.max(0, currentTime - 10));
                      }}
                      className="p-2 hover:text-orange-400 transition-colors text-white/80 hidden sm:block"
                    >
                      <SkipBack size={20} />
                    </button>

                    {/* Skip Forward */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSeek(Math.min(duration, currentTime + 10));
                      }}
                      className="p-2 hover:text-orange-400 transition-colors text-white/80 hidden sm:block"
                    >
                      <SkipForward size={20} />
                    </button>

                    {/* Volume - Always visible */}
                    <div className="flex items-center gap-2 hidden sm:flex">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onVolumeChange(isMuted ? 70 : 0);
                        }}
                        className="p-2 hover:text-orange-400 transition-colors text-white/80"
                      >
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                      </button>
                      <Slider
                        value={[volume]}
                        onValueChange={([value]) => onVolumeChange(value)}
                        max={100}
                        step={1}
                        className="w-20"
                      />
                    </div>

                    {/* Time - Click to toggle remaining time */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleTimeRemaining();
                      }}
                      className="text-white/60 text-xs sm:text-sm ml-1 sm:ml-2 hover:text-white/80 transition-colors cursor-pointer"
                    >
                      {formatTime(currentTime)} / {showTimeRemaining ? `-${formatTime(duration - currentTime)}` : formatTime(duration)}
                    </button>
                  </>
                ) : (
                  <span className="text-white/50 text-sm">Select a video to play</span>
                )}
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Open Video File */}
                <button
                  onClick={handleOpenVideoFile}
                  className={`p-2 transition-colors ${hasVideo ? 'hover:text-orange-400 text-white/80' : 'bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-3'}`}
                  title="Open Video"
                >
                  <div className="flex items-center gap-2">
                    <FolderOpen size={18} />
                    {!hasVideo && <span className="text-sm font-medium">Open</span>}
                  </div>
                </button>
                
                {/* Fullscreen */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFullscreen();
                  }}
                  className="p-2 hover:text-orange-400 transition-colors text-white/80"
                >
                  {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Center Play/Pause Indicator */}
          {isPaused && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayPause();
                }}
                className="p-6 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
              >
                <Play size={48} className="text-white ml-1" />
              </button>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}

function SettingsButton({ 
  icon, 
  label, 
  isActive, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-md backdrop-blur-md transition-colors text-xs
        ${isActive 
          ? 'bg-orange-500/30 text-orange-400 border border-orange-500/50' 
          : 'bg-black/50 text-white/80 hover:bg-black/70 border border-white/10'
        }
      `}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </motion.button>
  );
}

function SettingsPanel({ 
  title, 
  onClose, 
  children 
}: { 
  title: string; 
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute top-20 left-32 w-56 sm:w-64 rounded-lg overflow-hidden backdrop-blur-xl bg-black/70 border border-white/10 shadow-2xl z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <h3 className="text-white text-sm font-medium">{title}</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={16} className="text-white/60" />
        </button>
      </div>
      <div className="p-2 max-h-64 overflow-y-auto">
        {children}
      </div>
    </motion.div>
  );
}
