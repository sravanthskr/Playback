import { useState, useEffect, useCallback, RefObject } from "react";

interface UseVideoPlayerProps {
  videoRef: RefObject<HTMLVideoElement>;
  containerRef: RefObject<HTMLDivElement>;
}

export function useVideoPlayer(
  videoRef: RefObject<HTMLVideoElement>,
  containerRef: RefObject<HTMLDivElement>
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  const video = videoRef.current;

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (showControls && isPlaying) {
      timeout = setTimeout(() => {
        setShowControls(false);
      }, isFullscreen ? 2000 : 3000); // Hide faster in fullscreen
    }

    return () => clearTimeout(timeout);
  }, [showControls, isPlaying, isFullscreen]);

  // Video event listeners with optimized performance
  useEffect(() => {
    if (!video) return;

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => {
      setIsLoading(false);
      if (video.duration && !isNaN(video.duration) && duration === 0) {
        console.log('VIDEO: Setting duration from canplay event:', video.duration);
        setDuration(video.duration);
        setCurrentTime(video.currentTime);
        setProgress((video.currentTime / video.duration) * 100);
      }
    };
    const handleLoadedMetadata = () => {
      console.log('VIDEO: Loaded metadata - duration:', video.duration);
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
        setCurrentTime(video.currentTime);
        setProgress((video.currentTime / video.duration) * 100);
      }
      setIsLoading(false);
    };

    const handleSeeked = () => {
      console.log('VIDEO: Seeked to time:', video.currentTime);
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
    };
    
    // Throttle timeupdate for better performance
    let timeUpdateTimeout: NodeJS.Timeout;
    const handleTimeUpdate = () => {
      clearTimeout(timeUpdateTimeout);
      timeUpdateTimeout = setTimeout(() => {
        if (video.duration && !isNaN(video.duration)) {
          setCurrentTime(video.currentTime);
          setProgress((video.currentTime / video.duration) * 100);
          
          // Set duration if it's not set yet
          if (duration === 0) {
            setDuration(video.duration);
          }
        }
      }, 50); // Update every 50ms for smoother seeking
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => setVolume(video.volume * 100);

    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("volumechange", handleVolumeChange);

    return () => {
      clearTimeout(timeUpdateTimeout);
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("volumechange", handleVolumeChange);
    };
  }, [video]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const playPause = useCallback(() => {
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  }, [video, isPlaying]);

  const seek = useCallback((time: number) => {
    if (!video || !video.duration || isNaN(video.duration)) {
      console.log('Cannot seek - video:', !!video, 'duration:', video?.duration);
      return;
    }
    
    // Clamp time to valid range
    const clampedTime = Math.max(0, Math.min(time, video.duration));
    
    console.log('SEEK: Attempting to seek from', video.currentTime, 'to', clampedTime);
    
    // Immediate UI updates for instant feedback
    setCurrentTime(clampedTime);
    setProgress((clampedTime / video.duration) * 100);
    
    // Set video time using requestAnimationFrame for smooth performance
    requestAnimationFrame(() => {
      video.currentTime = clampedTime;
    });
    
    console.log('SEEK: Video currentTime after seek:', video.currentTime);
  }, [video]);

  const setVolumeLevel = useCallback((newVolume: number) => {
    if (!video) return;
    const clampedVolume = Math.max(0, Math.min(100, newVolume));
    video.volume = clampedVolume / 100;
    setVolume(clampedVolume);
  }, [video]);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    if (isFullscreen) {
      await document.exitFullscreen();
    } else {
      await containerRef.current.requestFullscreen();
    }
  }, [containerRef, isFullscreen]);

  const setPlaybackRateLevel = useCallback((rate: number) => {
    if (!video) return;
    const clampedRate = Math.max(0.25, Math.min(4.0, rate));
    
    // Only update if the rate is actually different
    if (Math.abs(video.playbackRate - clampedRate) > 0.01) {
      video.playbackRate = clampedRate;
      setPlaybackRate(clampedRate);
    }
  }, [video]);

  return {
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
    setVolume: setVolumeLevel,
    toggleFullscreen,
    setShowControls,
    setPlaybackRate: setPlaybackRateLevel,
  };
}
