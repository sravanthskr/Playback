import { useEffect, useState, useCallback, RefObject } from "react";

interface UseKeyboardControlsProps {
  videoRef: RefObject<HTMLVideoElement>;
  playPause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleFullscreen: () => void;
  onSpeedChange: (show: boolean) => void;
  speedHotkey?: string;
}

export function useKeyboardControls({
  videoRef,
  playPause,
  seek,
  setVolume,
  toggleFullscreen,
  onSpeedChange,
  speedHotkey = "Space",
}: UseKeyboardControlsProps) {
  const [is2xSpeed, setIs2xSpeed] = useState(false);
  const [hotkeyPressed, setHotkeyPressed] = useState(false);
  const [originalSpeed, setOriginalSpeed] = useState(1);
  const [speedTimeout, setSpeedTimeout] = useState<NodeJS.Timeout | null>(null);
  const [temporarySpeed, setTemporarySpeed] = useState(2.0);

  const video = videoRef.current;

  const handleHotkeyDown = useCallback(() => {
    if (hotkeyPressed) return;
    
    setHotkeyPressed(true);
    
    const timeout = setTimeout(() => {
      if (video && !video.paused) {
        setOriginalSpeed(video.playbackRate);
        video.playbackRate = temporarySpeed;
        setIs2xSpeed(true);
        onSpeedChange(true);
      }
    }, 200);
    
    setSpeedTimeout(timeout);
  }, [hotkeyPressed, video, onSpeedChange, temporarySpeed]);

  const handleHotkeyUp = useCallback(() => {
    if (!hotkeyPressed) return;
    
    const wasSpeedActive = is2xSpeed;
    
    if (speedTimeout) {
      clearTimeout(speedTimeout);
      setSpeedTimeout(null);
    }
    
    setHotkeyPressed(false);
    
    if (wasSpeedActive && video) {
      video.playbackRate = originalSpeed;
      setIs2xSpeed(false);
      onSpeedChange(false);
    } else if (speedHotkey === "Space") {
      playPause();
    }
  }, [hotkeyPressed, is2xSpeed, video, originalSpeed, playPause, onSpeedChange, speedTimeout, speedHotkey]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === speedHotkey) {
        e.preventDefault();
        handleHotkeyDown();
        return;
      }

      switch (e.code) {
        case "Space":
          if (speedHotkey !== "Space") {
            e.preventDefault();
            playPause();
          }
          break;
        case "KeyF":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "KeyM":
          e.preventDefault();
          setVolume(0);
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (video) {
            seek(Math.max(0, video.currentTime - 10));
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (video) {
            seek(Math.min(video.duration, video.currentTime + 10));
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (video) {
            const newVolume = Math.min(100, video.volume * 100 + 10);
            setVolume(newVolume);
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (video) {
            const newVolume = Math.max(0, video.volume * 100 - 10);
            setVolume(newVolume);
          }
          break;
        case "Digit1":
          e.preventDefault();
          setTemporarySpeed(1.25);
          break;
        case "Digit2":
          e.preventDefault();
          setTemporarySpeed(1.5);
          break;
        case "Digit3":
          e.preventDefault();
          setTemporarySpeed(2.0);
          break;
        case "Digit4":
          e.preventDefault();
          setTemporarySpeed(2.5);
          break;
        case "Digit5":
          e.preventDefault();
          setTemporarySpeed(3.0);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === speedHotkey) {
        handleHotkeyUp();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleHotkeyDown, handleHotkeyUp, video, seek, setVolume, toggleFullscreen, temporarySpeed, speedHotkey, playPause]);

  useEffect(() => {
    return () => {
      if (speedTimeout) {
        clearTimeout(speedTimeout);
      }
    };
  }, [speedTimeout]);

  return {
    is2xSpeed,
    temporarySpeed,
    setTemporarySpeed,
  };
}
